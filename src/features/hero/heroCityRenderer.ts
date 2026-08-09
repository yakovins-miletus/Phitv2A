/**
 * Canvas painter for the dawn-halftone city.
 *
 * The frame is built as a flat *mark list* and then drawn in colour/alpha batches:
 *
 *   1. cast shadows — one batch per shadow step (`SHADOW_STEPS` fillStyle changes)
 *   2. emit marks   — one ground dot per lattice cell, plus one dot per storey of
 *                     every building, stacked up +z
 *   3. draw marks   — one batch per (colour step, alpha tier) pair
 *
 * **Why a stack of dots per building.** A dot has no side faces, so one mark per
 * cell can only ever render plan view — the first prototype of this file did
 * exactly that and read as a halftone map. The visible shaft is the elevation.
 *
 * **Why no painter's-algorithm sort.** The old renderer sorted twenty opaque
 * extruded solids back to front because a wrong order there is a visible hole.
 * Every mark here is a small translucent dot on a near-white ground, where a
 * wrong order costs a fraction of one alpha step. Iterating alpha tiers ascending
 * puts the opaque marks last — i.e. on top — which is the correct order anywhere
 * it could be noticed, for free.
 *
 * **Why bucketing.** `fillStyle` assignment, not arithmetic, is the expensive part
 * of a multi-thousand-mark frame. Marks are counting-sorted into `BATCH_COUNT`
 * buckets (5 colour steps x 6 alpha tiers), so a frame changes `fillStyle` ~34
 * times rather than once per mark, and each bucket is one `beginPath()`/`fill()`.
 *
 * Zero allocation in the frame path: every buffer below is module-scope and sized
 * once, at load, against `DOT_COUNT * (MAX_STOREYS + 1)`.
 */

import {
  PERSPECTIVE,
  PLANE_SIZE,
  SIGNAL_LOOPS,
  SIGNAL_SPEED_PX_PER_MS,
  makeCamera,
  pointAtLoopDistance,
  project,
  type Camera,
  type HeroFrameState,
} from "./heroScene";
import {
  CURSOR_RADIUS,
  CURSOR_SHADOW_LENGTH,
  HOVER_LERP,
  cursorFalloff,
  easeToward,
  rippleCrest,
  skylineStretch,
  warmthShift,
} from "./heroPointer";
import {
  ALPHA_TIERS,
  AVENUE_SPACING,
  BATCH_COUNT,
  DOTS_PER_AXIS,
  DOT_STEP,
  CITY_RAMP,
  DOT_COLOUR,
  DOT_COUNT,
  DOT_DENSITY,
  DOT_STOREYS,
  DOT_X,
  DOT_Y,
  HORIZON,
  MAX_STOREYS,
  RGB_SHADOW_NAVY,
  SHADOW_ALPHA,
  SHADOW_DIR,
  SHADOW_LENGTH,
  SHADOW_MIN_HEIGHT,
  SHADOW_STEPS,
  STOREY_HEIGHT,
  VIEW_FIT,
  alphaTier,
  batchIndex,
  clamp01,
  dotRadius,
  latticeIndexRect,
  tierAlpha,
} from "./heroCity";
import {
  LOGO_STOREYS,
  beaconX,
  beaconY,
  getBeaconCount,
  refreshLogoMask,
} from "./heroLogoMask";

const TAU = Math.PI * 2;

/** Alpha of a street hairline on the ground plane. */
const STREET_ALPHA = 0.095;
/** Roof dots are drawn this much larger than the column's nominal radius... */
const ROOF_SCALE = 1.2;
/** ...and the shaft below them this much smaller, so the tower has a visible top. */
const SHAFT_SCALE = 0.66;
/** Shafts also step back in alpha, so a roof line reads across the whole skyline. */
const SHAFT_FADE = 0.72;
/** Floor under a roof dot's presence, so even a one-storey building has a top. */
const ROOF_PRESENCE = 0.5;
/** Radius of one of the mark's beacons, in plane px. Smaller than a roof: the mark
 *  is finer-grained than the city it hangs over, which is what makes it legible. */
const BEACON_RADIUS = 1.75;
/**
 * Alpha tier the mark is drawn at.
 *
 * Two steps below the ceiling, on purpose. At full opacity the P became the frame's
 * subject and buried the headline — which is precisely the failure this rebuild
 * exists to correct. The eye's order here is: headline, then city, then mark.
 */
const BEACON_TIER = ALPHA_TIERS - 3;
/** Alpha of the cursor's own short cast shadow. */
const CURSOR_SHADOW_ALPHA = 0.11;
/** Alpha of a signal pulse's head. */
const PULSE_ALPHA = 0.62;
/** How many lattice cells behind the head a pulse's tail lights. */
const PULSE_TAIL = 5;
/** Spacing between tail samples, in plane px — one lattice pitch. */
const PULSE_TAIL_STEP = 21;
/** Pulse marks are drawn this much larger than the roof they sit on. */
const PULSE_SCALE = 0.78;

/** Upper bound on marks in one frame: every storey of every cell, plus one mark beacon. */
const MAX_MARKS = DOT_COUNT * (MAX_STOREYS + 1);

/** How the pointer influences the frame. Populated by `HeroCanvas.tsx`, mutated in place. */
export interface CityInteraction {
  /** Camera tilt, already scaled by `interactStrength`. */
  tiltX: number;
  tiltY: number;
  /** Whether a fine pointer is currently over the canvas at all. */
  pointerActive: boolean;
  /** The cursor light's position, in plane coordinates. */
  lightX: number;
  lightY: number;
  /** `interactStrength(progress)` — the continuous fade-out across the scroll. */
  strength: number;
  /** Smoothed, normalised pointer speed, 0..1. */
  velocity: number;
  /** Origin of the live click ripple, in plane coordinates. */
  rippleX: number;
  rippleY: number;
  /** Milliseconds since the click, or a negative number when no ripple is live. */
  rippleAge: number;
}

/* ─────────────────────── Preallocated frame buffers ─────────────────────── */

/** Effective height in storeys per cell this frame — resting height x (1 + stretch). */
const storeys = new Float32Array(DOT_COUNT);
/**
 * Per-cell stretch, eased toward `stretchTarget`. Persisting this across frames is
 * what makes the light arrive and leave smoothly instead of snapping; it is the
 * only per-cell state the interaction keeps.
 */
const stretchCurrent = new Float32Array(DOT_COUNT);
const stretchTarget = new Float32Array(DOT_COUNT);
/** Whole-step warm shift toward the sunlit end of the ramp, per cell. */
const warmShift = new Uint8Array(DOT_COUNT);
/** Scratch for `latticeIndexRect`, so the cursor pass allocates nothing. */
const rectBuf = new Int32Array(4);

/** The frame's mark list. `markCount` is how much of each array is live. */
const markX = new Float32Array(MAX_MARKS);
const markY = new Float32Array(MAX_MARKS);
const markR = new Float32Array(MAX_MARKS);
const markBucket = new Int32Array(MAX_MARKS);
let markCount = 0;

/** Counting-sort scratch. `bucketCount` doubles as the write cursor in pass two. */
const bucketCount = new Int32Array(BATCH_COUNT);
const bucketStart = new Int32Array(BATCH_COUNT);
const bucketSlots = new Int32Array(MAX_MARKS);

/** `rgba()` strings for every (colour, tier) pair, built once. */
const BATCH_FILL: readonly string[] = (() => {
  const out: string[] = [];
  for (let c = 0; c < CITY_RAMP.length; c++) {
    const step = CITY_RAMP[c]!;
    const [r, g, b] = step.rgb;
    for (let t = 0; t < ALPHA_TIERS; t++) {
      const a = Math.min(1, tierAlpha(t) * step.alphaScale);
      out.push(`rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`);
    }
  }
  return out;
})();

/** `rgba()` strings for each shadow step, built once. */
const SHADOW_FILL: readonly string[] = (() => {
  const [r, g, b] = RGB_SHADOW_NAVY;
  const out: string[] = [];
  for (let k = 1; k <= SHADOW_STEPS; k++) {
    const decay = 1 - (k - 1) / (SHADOW_STEPS + 1);
    out.push(`rgba(${r}, ${g}, ${b}, ${(SHADOW_ALPHA * decay).toFixed(4)})`);
  }
  return out;
})();

/* ───────────────────────────────── Passes ───────────────────────────────── */

/**
 * A cell's resting building height. The mark is not a building — it is a separate
 * beacon emitted above the city — so it does not appear here at all, and no stack
 * can exceed `MAX_STOREYS`. That is the invariant `MAX_MARKS` is sized against.
 */
function restStoreys(i: number): number {
  return DOT_STOREYS[i]!;
}

/**
 * Presence of a mark at storey `s` of an `n`-storey building, 0..1.
 *
 * Two factors, multiplied: taller buildings read stronger overall, and within any
 * one building the upper storeys read stronger than the base. The second term is
 * what makes a shaft look lit from above rather than like a stack of beads.
 */
function storeyPresence(s: number, n: number): number {
  const withinColumn = n <= 1 ? 1 : 0.55 + 0.45 * (s / n);
  const columnHeight = 0.45 + 0.55 * (n / MAX_STOREYS);
  return clamp01(withinColumn * columnHeight);
}

/**
 * Resolve this frame's per-cell stretch and warm shift from the cursor and any live
 * click ripple, then write the effective heights into `storeys`.
 *
 * **The cursor pass is O(1) in the size of the city.** `latticeIndexRect` turns the
 * cursor's plane position straight into the inclusive index range it can possibly
 * reach — at a 5-cell radius over a 21px lattice that is roughly 20x20 = 400 cells,
 * regardless of whether the field is 2,000 dots or 200,000. No quadtree, no spatial
 * hash, no per-frame rebuild: those structures answer particle-to-particle queries
 * over moving points, and this is one query point against a static regular lattice.
 *
 * The ripple is the one thing that must sweep the whole field, because its crest can
 * be anywhere; it is gated on `rippleAge >= 0`, so it costs nothing at rest.
 */
function applyCursor(interaction: CityInteraction | undefined): void {
  stretchTarget.fill(0);
  warmShift.fill(0);

  const lit = interaction !== undefined && interaction.pointerActive && interaction.strength > 0;
  if (lit && latticeIndexRect(interaction.lightX, interaction.lightY, CURSOR_RADIUS, rectBuf)) {
    const c0 = rectBuf[0]!;
    const c1 = rectBuf[1]!;
    const r0 = rectBuf[2]!;
    const r1 = rectBuf[3]!;
    for (let row = r0; row <= r1; row++) {
      const base = row * DOTS_PER_AXIS;
      for (let col = c0; col <= c1; col++) {
        const i = base + col;
        if (restStoreys(i) === 0) continue;
        const falloff = cursorFalloff(
          DOT_X[i]! - interaction.lightX,
          DOT_Y[i]! - interaction.lightY,
          CURSOR_RADIUS,
        );
        if (falloff <= 0) continue;
        stretchTarget[i] = skylineStretch(falloff, interaction.strength, interaction.velocity);
        warmShift[i] = warmthShift(falloff, interaction.strength);
      }
    }
  }

  if (interaction !== undefined && interaction.rippleAge >= 0) {
    for (let i = 0; i < DOT_COUNT; i++) {
      if (restStoreys(i) === 0) continue;
      const dx = DOT_X[i]! - interaction.rippleX;
      const dy = DOT_Y[i]! - interaction.rippleY;
      const crest = rippleCrest(Math.sqrt(dx * dx + dy * dy), interaction.rippleAge);
      if (crest > stretchTarget[i]!) stretchTarget[i] = crest;
    }
  }

  for (let i = 0; i < DOT_COUNT; i++) {
    const s = easeToward(stretchCurrent[i]!, stretchTarget[i]!, HOVER_LERP);
    stretchCurrent[i] = s;
    // The base stays planted and the top rises: the building *grows* rather than
    // levitating, and because the stack's storey count never changes there is no
    // pop as the stretch crosses a whole storey.
    storeys[i] = restStoreys(i) * (1 + s);
  }
}

/**
 * The avenues, as stroked lines on the ground plane.
 *
 * This exists because removing it was a mistake. A field of dots at a uniform
 * lattice pitch has no perspective cue of its own — nothing converges, nothing
 * establishes a floor — so the third prototype read as a beautiful abstract point
 * cloud rather than as a place. Twenty-two hairlines re-establish the plane, the
 * viewing angle and the block structure in one stroke call, and they are what make
 * the stacked dots above them legible as buildings standing ON something.
 *
 * Cost: one `beginPath()`/`stroke()` for the whole grid.
 */
function drawStreets(ctx: CanvasRenderingContext2D, cam: Camera, state: HeroFrameState): void {
  const [r, g, b] = RGB_SHADOW_NAVY;
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${STREET_ALPHA})`;
  ctx.lineWidth = Math.max(0.5, cam.scale * 0.8);
  ctx.beginPath();
  const span = (DOTS_PER_AXIS - 1) * DOT_STEP + DOT_STEP / 2;
  for (let n = 0; n < DOTS_PER_AXIS; n += AVENUE_SPACING) {
    const t = n * DOT_STEP + DOT_STEP / 2;
    const a = project(cam, t, DOT_STEP / 2, 0);
    const bEnd = project(cam, t, span, 0);
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(bEnd.sx, bEnd.sy);
    const c = project(cam, DOT_STEP / 2, t, 0);
    const d = project(cam, span, t, 0);
    ctx.moveTo(c.sx, c.sy);
    ctx.lineTo(d.sx, d.sy);
  }
  ctx.globalAlpha = 1 - 0.5 * state.flatten;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/**
 * Cast shadows: `SHADOW_STEPS` stepped dots per building, marching along the one
 * global `SHADOW_DIR`. Parallel, because the sun is directional — which is both
 * right for a body 150M km away and the reason a shadow costs a multiply-add per
 * step rather than a normalize.
 *
 * Fades with `flatten`: once the city is a flat plan, nothing stands up to cast.
 */
function drawShadows(ctx: CanvasRenderingContext2D, cam: Camera, state: HeroFrameState): void {
  const presence = 1 - state.flatten;
  if (presence <= 0.01) return;
  ctx.globalAlpha = presence;

  for (let k = 1; k <= SHADOW_STEPS; k++) {
    const frac = k / SHADOW_STEPS;
    ctx.fillStyle = SHADOW_FILL[k - 1]!;
    ctx.beginPath();
    let drew = false;
    for (let i = 0; i < DOT_COUNT; i++) {
      const n = storeys[i]!;
      const h = n / MAX_STOREYS;
      if (h < SHADOW_MIN_HEIGHT) continue;
      const len = h * SHADOW_LENGTH * frac;
      const p = project(cam, DOT_X[i]! + SHADOW_DIR.x * len, DOT_Y[i]! + SHADOW_DIR.y * len, 0);
      const kp = PERSPECTIVE / Math.max(1, PERSPECTIVE - p.depth);
      // Shadow dots widen with distance from their caster: a penumbra, and the
      // cheapest available substitute for the blur this hero is not allowed.
      const r = dotRadius(h) * cam.scale * kp * (0.9 + frac * 0.7);
      ctx.moveTo(p.sx + r, p.sy);
      ctx.arc(p.sx, p.sy, r, 0, TAU);
      drew = true;
    }
    if (drew) ctx.fill();
  }

  // The mark's own shadow, thrown by the same dawn sun onto the same ground. This
  // is the line between an object that is in the scene and a decal that is on top
  // of it, and it costs one extra pass over the masked cells.
  ctx.fillStyle = SHADOW_FILL[1]!;
  ctx.beginPath();
  let markDrew = false;
  const markLen = (LOGO_STOREYS / MAX_STOREYS) * SHADOW_LENGTH;
  const beacons = getBeaconCount();
  for (let i = 0; i < beacons; i++) {
    const p = project(cam, beaconX[i]! + SHADOW_DIR.x * markLen, beaconY[i]! + SHADOW_DIR.y * markLen, 0);
    const kp = PERSPECTIVE / Math.max(1, PERSPECTIVE - p.depth);
    const rad = BEACON_RADIUS * cam.scale * kp * 1.25;
    ctx.moveTo(p.sx + rad, p.sy);
    ctx.arc(p.sx, p.sy, rad, 0, TAU);
    markDrew = true;
  }
  if (markDrew) ctx.fill();

  ctx.globalAlpha = 1;
}

/**
 * The cursor's own cast shadow — the half of "second light" that does the work.
 *
 * Without this the pointer is a magnifying glass: things under it get bigger and
 * warmer, which is a filter, not a light. A shadow thrown *away* from the cursor is
 * what makes the brain accept a second source in the scene, and it is why the
 * effect reads as depth rather than as a hover state.
 *
 * Short — `CURSOR_SHADOW_LENGTH` is about a quarter of the dawn sun's reach —
 * because a near light casts a near shadow, and because a long one would fight the
 * dawn shadows that carry the composition.
 *
 * Bounded to the cells the cursor actually lit, so it costs one normalize each for
 * a few hundred cells at most, and nothing at all at rest.
 */
function drawCursorShadows(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  state: HeroFrameState,
  interaction: CityInteraction | undefined,
): void {
  if (!interaction || !interaction.pointerActive || interaction.strength <= 0) return;
  const presence = 1 - state.flatten;
  if (presence <= 0.01) return;
  if (!latticeIndexRect(interaction.lightX, interaction.lightY, CURSOR_RADIUS, rectBuf)) return;

  const [r, g, b] = RGB_SHADOW_NAVY;
  ctx.globalAlpha = presence;
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${CURSOR_SHADOW_ALPHA})`;
  ctx.beginPath();
  let drew = false;
  const c0 = rectBuf[0]!;
  const c1 = rectBuf[1]!;
  const r0 = rectBuf[2]!;
  const r1 = rectBuf[3]!;
  for (let row = r0; row <= r1; row++) {
    const rowBase = row * DOTS_PER_AXIS;
    for (let col = c0; col <= c1; col++) {
      const i = rowBase + col;
      const s = stretchCurrent[i]!;
      if (s <= 0.02 || restStoreys(i) === 0) continue;
      const dx = DOT_X[i]! - interaction.lightX;
      const dy = DOT_Y[i]! - interaction.lightY;
      const dist = Math.hypot(dx, dy);
      if (dist <= 0.001) continue;
      const h = storeys[i]! / MAX_STOREYS;
      const len = h * CURSOR_SHADOW_LENGTH * s;
      const p = project(cam, DOT_X[i]! + (dx / dist) * len, DOT_Y[i]! + (dy / dist) * len, 0);
      const kp = PERSPECTIVE / Math.max(1, PERSPECTIVE - p.depth);
      const rad = dotRadius(h) * cam.scale * kp * 1.15;
      ctx.moveTo(p.sx + rad, p.sy);
      ctx.arc(p.sx, p.sy, rad, 0, TAU);
      drew = true;
    }
  }
  if (drew) ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * Emit this frame's marks: one ground dot per lattice cell, then one dot per
 * storey of every building, climbing +z at `STOREY_HEIGHT` intervals.
 *
 * `flatten` collapses the stacks into the ground plane rather than deleting them —
 * the city becomes a flat halftone *plan* of itself. That is the settled state both
 * the reduced-motion frame and the scrolled-past frame land on.
 */
function emitMarks(cam: Camera, state: HeroFrameState): void {
  markCount = 0;
  const lift = 1 - state.flatten;

  // The mark: one beacon per sampled point, all at the same altitude, all
  // sunstruck gold. Emitted into the same batches as everything else, so the whole
  // brand mark costs zero extra draw calls.
  const markZ = LOGO_STOREYS * STOREY_HEIGHT * lift;
  const markRadius = BEACON_RADIUS;
  const beacons = getBeaconCount();
  for (let i = 0; i < beacons; i++) {
    const p = project(cam, beaconX[i]!, beaconY[i]!, markZ);
    const k = PERSPECTIVE / Math.max(1, PERSPECTIVE - p.depth);
    const m = markCount++;
    markX[m] = p.sx;
    markY[m] = p.sy;
    markR[m] = markRadius * cam.scale * k;
    markBucket[m] = batchIndex(0, BEACON_TIER);
  }

  for (let i = 0; i < DOT_COUNT; i++) {
    const density = DOT_DENSITY[i]!;
    if (density <= 0.02) continue;

    // Only buildings emit marks.
    //
    // An earlier pass also emitted a faint ground dot per lattice cell, as "paper
    // texture". Once `drawStreets` existed the two competed: the plane was being
    // described twice, by lines and by a pepper of dots, and the result was that
    // neither read. Removing the ground dots makes the grammar unambiguous —
    // **lines are ground, dots are city** — and drops roughly a third of the
    // frame's marks for free.
    const rest = DOT_STOREYS[i]!;
    if (rest === 0) continue;

    const x = DOT_X[i]!;
    const y = DOT_Y[i]!;
    // Cursor warmth walks the colour toward the sunlit end of the ramp. An integer
    // step, so a lit building lands in an existing batch rather than minting a new
    // fillStyle — the interaction costs zero extra draw calls.
    const colour = Math.max(0, DOT_COLOUR[i]! - warmShift[i]!);
    // The stack always has `rest` marks; the stretch only changes their spacing.
    // Scaling z rather than adding storeys is what keeps the growth continuous.
    const zStep = STOREY_HEIGHT * (1 + stretchCurrent[i]!) * lift;
    const tall = storeys[i]! / MAX_STOREYS;

    // A thin shaft under a distinctly larger roof cap. A constant-radius stack
    // reads as a vertical stripe and adjacent stacks merge into a curtain; the cap
    // is what lets one building be told from its neighbour at a glance.
    const base = dotRadius(tall);
    for (let s = 1; s <= rest; s++) {
      const roof = s === rest;
      const p = project(cam, x, y, s * zStep);
      const k = PERSPECTIVE / Math.max(1, PERSPECTIVE - p.depth);
      const presence = storeyPresence(s, rest);
      const m = markCount++;
      markX[m] = p.sx;
      markY[m] = p.sy;
      markR[m] = base * (roof ? ROOF_SCALE : SHAFT_SCALE) * cam.scale * k * density;
      markBucket[m] = batchIndex(
        colour,
        alphaTier(roof ? Math.max(presence, ROOF_PRESENCE) : presence * SHAFT_FADE),
      );
    }
  }
}

/** Counting-sort every mark into its bucket. No allocation, two passes. */
function bucketMarks(): void {
  bucketCount.fill(0);
  for (let m = 0; m < markCount; m++) {
    const b = markBucket[m]!;
    bucketCount[b] = bucketCount[b]! + 1;
  }
  let acc = 0;
  for (let b = 0; b < BATCH_COUNT; b++) {
    bucketStart[b] = acc;
    acc += bucketCount[b]!;
    bucketCount[b] = 0; // reused below as the bucket's write cursor
  }
  for (let m = 0; m < markCount; m++) {
    const b = markBucket[m]!;
    bucketSlots[bucketStart[b]! + bucketCount[b]!] = m;
    bucketCount[b] = bucketCount[b]! + 1;
  }
}

/**
 * Draw the marks, one `beginPath()`/`fill()` per non-empty bucket.
 *
 * Tier is the outer loop so faint marks land first and opaque ones last — the only
 * depth ordering this scene needs.
 */
function drawMarks(ctx: CanvasRenderingContext2D): void {
  for (let t = 0; t < ALPHA_TIERS; t++) {
    for (let c = 0; c < CITY_RAMP.length; c++) {
      const b = batchIndex(c, t);
      const count = bucketCount[b]!;
      if (count === 0) continue;
      const start = bucketStart[b]!;
      ctx.fillStyle = BATCH_FILL[b]!;
      ctx.beginPath();
      for (let s = 0; s < count; s++) {
        const m = bucketSlots[start + s]!;
        const r = markR[m]!;
        if (r <= 0.05) continue;
        ctx.moveTo(markX[m]! + r, markY[m]!);
        ctx.arc(markX[m]!, markY[m]!, r, 0, TAU);
      }
      ctx.fill();
    }
  }
}

/**
 * Signal pulses: data moving through the city.
 *
 * This is what makes it a city *of SaaS* rather than just a city, and it is the one
 * survivor of the old renderer's scene graph — `SIGNAL_LOOPS` is reused verbatim as
 * data, with its three closed circuits and two pulses each.
 *
 * What changed is the drawing. The old renderer stroked a 14-sample tapered tail in
 * two passes (a 14px glow under a 5.5px core) per pulse. Here a pulse simply lights
 * the roofs it passes: the nearest lattice cells get one extra, brighter mark on
 * top of their tower. No strokes at all, ~6 marks per pulse, and it reads as the
 * city itself carrying the signal rather than as a line drawn over it.
 */
function drawPulses(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  state: HeroFrameState,
  elapsed: number,
): void {
  const presence = Math.max(0, 1 - state.flatten * 1.4);
  if (presence <= 0.01) return;

  const [r, g, b] = CITY_RAMP[0]!.rgb;
  ctx.globalAlpha = presence;
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${PULSE_ALPHA})`;
  ctx.beginPath();
  let drew = false;

  for (let l = 0; l < SIGNAL_LOOPS.length; l++) {
    const loop = SIGNAL_LOOPS[l]!;
    for (let o = 0; o < loop.pulseOffsets.length; o++) {
      const head = elapsed * SIGNAL_SPEED_PX_PER_MS + loop.pulseOffsets[o]! * loop.totalL;
      for (let t = 0; t < PULSE_TAIL; t++) {
        const at = pointAtLoopDistance(loop, head - t * PULSE_TAIL_STEP);
        const col = Math.round((at.x - DOT_STEP / 2) / DOT_STEP);
        const row = Math.round((at.y - DOT_STEP / 2) / DOT_STEP);
        if (col < 0 || row < 0 || col >= DOTS_PER_AXIS || row >= DOTS_PER_AXIS) continue;
        const i = row * DOTS_PER_AXIS + col;
        const n = restStoreys(i);
        // Ride the rooftops where there are any, the street where there are not.
        const z = n * STOREY_HEIGHT * (1 + stretchCurrent[i]!) * (1 - state.flatten);
        const p = project(cam, DOT_X[i]!, DOT_Y[i]!, z);
        const k = PERSPECTIVE / Math.max(1, PERSPECTIVE - p.depth);
        const fade = 1 - t / PULSE_TAIL;
        const rad = dotRadius(Math.max(0.25, n / MAX_STOREYS)) * PULSE_SCALE * fade * cam.scale * k;
        if (rad <= 0.05) continue;
        ctx.moveTo(p.sx + rad, p.sy);
        ctx.arc(p.sx, p.sy, rad, 0, TAU);
        drew = true;
      }
    }
  }
  if (drew) ctx.fill();
  ctx.globalAlpha = 1;
}

/* ───────────────────────────────── Entry ───────────────────────────────── */

/** Marks emitted on the last frame — read by tests and the perf harness. */
export function lastMarkCount(): number {
  return markCount;
}

/**
 * Paint one frame of the city.
 *
 * `w`/`h` are CSS pixels; the caller owns the DPR transform. `elapsed` will drive
 * the signal pulses in stage D and is accepted now so the signature is stable.
 */
export function drawCityFrame(
  ctx: CanvasRenderingContext2D,
  state: HeroFrameState,
  w: number,
  h: number,
  _elapsed: number,
  interaction?: CityInteraction,
): void {
  ctx.clearRect(0, 0, w, h);
  if (w <= 0 || h <= 0) return;

  const viewScale = Math.min(w, h) / (PLANE_SIZE * VIEW_FIT);
  const cam = makeCamera(
    state.flatten,
    w / 2,
    h * HORIZON,
    viewScale,
    interaction?.tiltX ?? 0,
    interaction?.tiltY ?? 0,
  );

  // The mark's mask is sampled against an UNTILTED camera, so it depends only on
  // flatten and the viewport and never shimmers as the pointer moves. Internally
  // cached on exactly those inputs, so a still scene rebuilds nothing.
  refreshLogoMask(
    makeCamera(state.flatten, w / 2, h * HORIZON, viewScale),
    w,
    h,
    state.flatten,
  );

  applyCursor(interaction);

  drawStreets(ctx, cam, state);
  drawShadows(ctx, cam, state);
  drawCursorShadows(ctx, cam, state, interaction);
  emitMarks(cam, state);
  bucketMarks();
  drawMarks(ctx);
  drawPulses(ctx, cam, state, _elapsed);
}
