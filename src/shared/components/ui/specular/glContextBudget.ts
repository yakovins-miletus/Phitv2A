/**
 * A page-wide budget for the per-button WebGL contexts that draw the specular rim.
 *
 * Why this exists
 * ---------------
 * `SpecularFx` follows the upstream React Bits design: one `Renderer`, one
 * canvas, one rAF loop *per button*. That is fine for the component's demo page,
 * which shows a single button. This site puts 43 of them across the routes, on
 * top of the hero's R3F canvases, the ground layer and the logo particle field.
 *
 * Browsers cap live WebGL contexts per page — Chrome at ~16, and it evicts the
 * *oldest* context when you exceed it, firing `webglcontextlost` on a canvas
 * that is very much still on screen. The failure mode is not a crash: it is a
 * button whose rim silently stops drawing, which is worse because it looks like
 * a flaky effect rather than a bug.
 *
 * The insight that makes a budget invisible
 * -----------------------------------------
 * The rim only *renders* within `proximity` px of the pointer (`bright` fades to
 * 0 outside it, so the shader outputs a fully transparent frame). A button on
 * the far side of the viewport is paying for a context, a canvas and a 60fps rAF
 * loop to draw nothing at all. So we rank every registered button by pointer
 * distance and hand the small pool of contexts to the closest ones. A button
 * that loses its context was drawing nothing when it lost it.
 *
 * `autoAnimate` buttons are the exception — their rim is on regardless of the
 * pointer, so they rank as distance 0 and effectively pin a slot.
 *
 * Hysteresis
 * ----------
 * Straight "closest N wins" thrashes: two buttons a pixel apart would trade a
 * context on every pointer move, and each trade is a full GL teardown plus
 * shader recompile. A challenger must beat the incumbent by `SWAP_MARGIN_PX`
 * before it takes the slot.
 */

/** Contexts this pool will hand out at once.
 *
 *  Deliberately well under Chrome's ~16: the hero owns up to three R3F canvases
 *  and the ground layer owns one, and those must never be the contexts that get
 *  evicted — they are full-viewport and their loss is unmissable. Six is enough
 *  that every button under the cursor and its neighbours are live, since the rim
 *  is invisible past `proximity` (250px by default) anyway. */
const MAX_CONTEXTS = 6;

/** How much closer (px) a challenger must be before it takes a live slot. */
const SWAP_MARGIN_PX = 48;

export interface SpecularHolder {
  /** Pointer distance in px, 0 when the rim is on regardless of the pointer. */
  distance: number;
  /** Create the GL context and start the loop. Must be idempotent. */
  start: () => void;
  /** Destroy the GL context and stop the loop. Must be idempotent. */
  stop: () => void;
  /** Owned by the pool — do not set from the holder. */
  live: boolean;
}

const holders = new Set<SpecularHolder>();
let rebalanceQueued = false;

/**
 * Give slots to the closest holders.
 *
 * Runs on a rAF tick rather than per pointer event: a pointer move can register
 * at 1000Hz on a high-polling mouse, and rebalancing is O(n log n) plus possible
 * GL teardown.
 */
function rebalance(): void {
  rebalanceQueued = false;

  const ranked = [...holders].sort((a, b) => a.distance - b.distance);
  const winners = new Set(ranked.slice(0, MAX_CONTEXTS));

  // Hysteresis. Only two groups can churn: holders this pass would promote
  // (in the top N, no context yet) and holders it would displace (outside the
  // top N, holding one). Both stay distance-sorted, so it is enough to compare
  // the *weakest* promotion against the *strongest* displacement: if even that
  // pairing is a decisive win, every other pairing is too.
  const promoted = ranked.slice(0, MAX_CONTEXTS).filter((h) => !h.live);
  const displaced = ranked.slice(MAX_CONTEXTS).filter((h) => h.live);
  while (promoted.length > 0 && displaced.length > 0) {
    const challenger = promoted[promoted.length - 1]!;
    const incumbent = displaced[0]!;
    if (challenger.distance + SWAP_MARGIN_PX < incumbent.distance) break;
    // Too close to justify a teardown plus a shader recompile. Keep the incumbent.
    winners.delete(challenger);
    winners.add(incumbent);
    promoted.pop();
    displaced.shift();
  }

  for (const holder of holders) {
    const shouldBeLive = winners.has(holder);
    if (shouldBeLive === holder.live) continue;
    holder.live = shouldBeLive;
    if (shouldBeLive) holder.start();
    else holder.stop();
  }
}

/** Coalesce rebalances to one per frame. */
export function requestRebalance(): void {
  if (rebalanceQueued) return;
  rebalanceQueued = true;
  requestAnimationFrame(rebalance);
}

/**
 * Enter the pool. Call when the button scrolls into view; the returned function
 * leaves the pool and is safe to call from an effect cleanup.
 */
export function registerSpecular(holder: SpecularHolder): () => void {
  holders.add(holder);
  requestRebalance();
  return () => {
    holders.delete(holder);
    if (holder.live) {
      holder.live = false;
      holder.stop();
    }
    requestRebalance();
  };
}
