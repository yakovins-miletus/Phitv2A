/**
 * Single source of truth for home-page **reveal** thresholds.
 *
 * Before this module the page carried four hand-tuned values with no
 * convention behind them — major establishing shots at `top 78%`, mini shots at
 * `top 85%`, `StageSection` at `top 78%`, and `AppetizerReveal` (since deleted;
 * its scrub was folded into `SectionBeat`) at `top 78%`. A
 * shot and the section it announces therefore fired at two different scroll
 * offsets, which is one of the reasons the pairs read as mistimed. Every reveal
 * trigger now starts from `BEAT_START`; tuning the page's entrance feel is a
 * one-line change here rather than a hunt through four components.
 *
 * NOT a reveal, and deliberately exempt from this convention:
 * `useStagePresence` (`StageSection.tsx`) uses `top 50%` / `bottom 50%`. That
 * trigger animates nothing — it is a *presence tracker* that reports which
 * section owns the viewport middle to `setActiveSection()` for the dot rail,
 * and it runs under reduced motion too. Its thresholds describe "occupies the
 * middle of the screen", which is a different question from "has entered far
 * enough to start playing". Do not fold it into these constants.
 */

/**
 * Entrance threshold: a beat starts when its trigger's top reaches 75% of the
 * viewport height, i.e. a quarter of the way up from the fold. Slightly earlier
 * than the old 78% majority so the reveal has visibly begun by the time the
 * element is comfortably on screen, and much later than the old mini-shot 85%,
 * which fired while the shot was still essentially at the bottom edge.
 */
export const BEAT_START = "top 75%";

/**
 * Where a beat's ENTRANCE trigger arms — deliberately earlier than
 * `BEAT_START`, and not interchangeable with it.
 *
 * The content tween runs `immediateRender: false`, so its from-vars are written
 * when the trigger fires rather than when the tween is built. That is what
 * guarantees the no-stranded-content invariant: a beat whose trigger never
 * fires renders lit instead of blank. The cost is that the moment the trigger
 * fires is now visible to the reader — and at `BEAT_START` the section is
 * already a quarter of the way up the viewport, so correctly-placed content
 * was seen snapping down ~90px and dimming to ~0.15 before re-animating.
 *
 * "top bottom" arms as the section's top edge reaches the bottom of the
 * viewport — 0% visible — so the from-vars land unseen and the reveal plays as
 * the section scrolls in.
 *
 * `BEAT_START` remains the threshold for everything else (the exit range is
 * still expressed relative to it); this constant governs only when the
 * entrance timeline is armed.
 */
export const BEAT_ENTER_START = "top bottom";

/**
 * Exit-dim range, for the scrubbed recede that Phase 3+ will create as a
 * separate top-level trigger (GreenSock forbids `scrub` + `toggleActions` on
 * one trigger, but permits two triggers on one element with disjoint ranges).
 *
 * These reproduce the *current* exit behaviour rather than inventing a new one.
 * Today `StageSection` runs one scrubbed timeline over `BEAT_START` →
 * `"bottom top"`, and `stageChoreo.ts` splits it 0.35 enter / 0.47 hold / 0.18
 * exit — so the dim occupies the final 18% of that range. Resolving that for a
 * full-viewport section (height H = 1vh, range length L = H + 0.75vh = 1.75vh):
 *
 *   exit begins at  end − 0.18·L  =  top + 1vh − 0.315vh  =  top + 0.685vh
 *
 * which, expressed against the section's bottom edge, is
 * `bottom (1 − 0.685) = bottom 31.5%` — rounded to `bottom 30%`. The end is
 * unchanged from today's `"bottom top"`: the dim completes exactly as the
 * section leaves the top of the viewport.
 */
export const BEAT_EXIT_START = "bottom 30%";
export const BEAT_EXIT_END = "bottom top";

/**
 * Page order → `refreshPriority`.
 *
 * ScrollTrigger sorts its refresh queue with `(refreshPriority || 0) * -1e6 +
 * _sortY` (`node_modules/gsap/ScrollTrigger.js`, `_sort`). **Higher priority
 * refreshes first**, and anything that does not declare one sits at an implicit
 * 0. Refresh must run top-to-bottom, because refreshing a trigger reverts the
 * pins above it — a trigger measured before an upstream pin has settled reads
 * offsets that are wrong by that pin's spacer height.
 *
 * Hence the whole scale is kept **positive**: every beat that opts in refreshes
 * ahead of the un-migrated triggers still sitting at 0, in page order among
 * themselves, and the un-migrated ones then refresh last by their own page
 * position. A negative scale would invert that and push the three pins *behind*
 * every establishing shot below them — measured at ~850px of trigger
 * displacement on the ladder probe at all three viewports.
 *
 * `order` is the page index (hero = 0, counting down the page); the base is
 * simply larger than the number of ordered beats so nothing goes non-positive.
 */
export const BEAT_REFRESH_BASE = 20;

export function refreshPriorityFor(order: number): number {
  return BEAT_REFRESH_BASE - order;
}
