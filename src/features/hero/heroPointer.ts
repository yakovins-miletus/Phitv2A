/**
 * Pointer math for the hero canvas — pure, DOM-free, no React and no renderer
 * imports. Every function is a transform of its arguments, which is what makes it
 * unit-testable without a browser canvas.
 *
 * ## What the cursor does, and what it deliberately does not
 *
 * The cursor is a **second light**. Buildings under it grow toward it, warm toward
 * gold, and throw a second, shorter shadow away from it. It does not repel the
 * city, does not drag it, and does not magnetise it.
 *
 * That is a design decision with a technical dividend. Repulsion — the default move
 * of every particle hero — carries no meaning in a scene that is a city at dawn,
 * and it costs a per-dot integration plus per-dot velocity state. A second light is
 * coherent with the scene's one existing idea and is a pure function of distance:
 * no integration, no velocity field, no state beyond one eased scalar per cell.
 *
 * ## What used to live here
 *
 * - `writeAnchors` / `findNearestAnchor` / `ANCHOR_COUNT` projected and hit-tested
 *   the twenty cube and service-node anchors. There are no discrete scene objects
 *   any more; the pointer addresses the lattice by arithmetic (`latticeIndexRect`
 *   in `heroCity.ts`), so a hit test is `floor(x / DOT_STEP)`.
 * - `magneticDisplacement` and `signalBowOffset` moved scene objects off their grid
 *   positions. Nothing in the lattice may move off its cell — the O(1) cursor query
 *   depends on the lattice being static — so they are gone rather than ported.
 * - `RippleScheduler` was a sorted typed-array queue that replaced a `setTimeout`
 *   storm, draining per-object impulses against `elapsed`. The click ripple is now
 *   an expanding *crest* evaluated as a pure function of `(distance, age)` — see
 *   `rippleCrest` — which needs no queue, no drain, and no teardown, and gives a
 *   continuous wave instead of per-object pops. Deleting a well-built thing the
 *   design no longer needs is cheaper than carrying it.
 * - `lambertFalloff` / `quantizeLambert` are superseded by `cursorFalloff`, which
 *   compares squared distances and needs no quantisation because its consumer
 *   already buckets by alpha tier.
 */

import { GRID_CELL } from "./heroScene";
import { PHASE_FLATTEN_END } from "./heroPhases";

/* ───────────────────────────── Interaction gate ───────────────────────────── */

/**
 * End of the interaction window, as a fraction of the pin's 0..1 progress.
 *
 * Derived from `PHASE_FLATTEN_END` (0.20) rather than restated as a literal: past
 * half the flatten phase the city has collapsed far enough toward its flat plan
 * that there is no elevation left for a light to act on.
 */
export const INTERACT_END = PHASE_FLATTEN_END * 0.5;

/**
 * End of the click window. Hard cutoff, not faded — a click either lands or it
 * doesn't — and strictly inside `INTERACT_END` so a ripple can never be armed past
 * the point where the continuous interaction has itself faded to nothing.
 */
export const HIT_TEST_END = 0.04;

/**
 * Continuous interaction amplitude, 1 at `progress === 0` fading linearly to 0 at
 * `INTERACT_END` and staying there. Multiplying an effect's amplitude by this,
 * rather than hard-gating on a threshold, is what keeps the interaction from
 * snapping off mid-scroll. `interactStrength(0) === 1` exactly.
 */
export function interactStrength(progress: number): number {
  return Math.max(0, Math.min(1, 1 - progress / INTERACT_END));
}

/* ───────────────────────────── Shared primitives ───────────────────────────── */

/** Clamp to `[0, 1]`. */
export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Standard smoothstep: `0..1` in, `0..1` out. */
export function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/** Lerp factor every eased per-cell quantity uses — the same one the camera tilt does. */
export const HOVER_LERP = 0.12;

/**
 * Ease `current` toward `target` by `lerp`. Monotone toward the target and
 * convergent (no oscillation) for any `lerp` in `(0, 1]`. This is most of the
 * difference between an interaction that feels cheap and one that feels expensive.
 */
export function easeToward(current: number, target: number, lerp: number): number {
  return current + (target - current) * lerp;
}

/* ─────────────────────── The cursor as a second light ─────────────────────── */

/** Radius of the cursor light, in plane units. */
export const CURSOR_RADIUS = 6 * GRID_CELL;

/** How much taller a building gets directly under the cursor, as a fraction of its own height. */
export const LIFT_STRETCH = 1.25;

/** How many steps toward the warm end of `CITY_RAMP` a fully lit building shifts. */
export const CURSOR_WARM_SHIFT = 2;

/** Length of the cursor's own cast shadow, in plane px, for a full-height building. */
export const CURSOR_SHADOW_LENGTH = 74;

/** Reference pointer speed, in screen px per frame, that saturates the velocity term. */
export const VELOCITY_REF = 26;

/** Lerp the smoothed pointer speed eases with. Slower than the position lerp on
 *  purpose: speed should read as momentum, not as a second cursor. */
export const VELOCITY_LERP = 0.09;

/** Share of the lift that pointer speed controls; the rest is always available. */
export const VELOCITY_GAIN = 0.45;

/**
 * Falloff of the cursor light at plane offset `(dx, dy)`: 1 at the cursor, 0 at and
 * beyond `radius`, smoothstepped in between.
 *
 * Compares squared distances — no `sqrt` — because this runs once per cell in the
 * cursor's index rectangle, which is the only per-frame work the pointer costs.
 */
export function cursorFalloff(dx: number, dy: number, radius: number): number {
  if (radius <= 0) return 0;
  const d2 = dx * dx + dy * dy;
  const r2 = radius * radius;
  if (d2 >= r2) return 0;
  return smoothstep(1 - d2 / r2);
}

/**
 * How far a building stretches under the light, as a fraction of its own height.
 *
 * `velocity` is the smoothed, normalised pointer speed. Scaling by it is the single
 * highest-value term in the whole interaction — a few arithmetic ops *per frame*,
 * not per cell — and it is the difference between a static magnifying glass and
 * something with momentum. A still cursor still lights the city, at
 * `1 - VELOCITY_GAIN` of full strength; sweeping across it makes the skyline surge.
 */
export function skylineStretch(falloff: number, strength: number, velocity: number): number {
  const speed = 1 - VELOCITY_GAIN + VELOCITY_GAIN * clamp01(velocity);
  return LIFT_STRETCH * clamp01(falloff) * clamp01(strength) * speed;
}

/** Whole-step shift toward the warm end of the ramp for a lit building. */
export function warmthShift(falloff: number, strength: number): number {
  return Math.round(CURSOR_WARM_SHIFT * clamp01(falloff) * clamp01(strength));
}

/**
 * Ease a raw per-frame pointer speed (screen px since the last frame) toward a
 * normalised 0..1 value. Clamped, so a single large jump — the pointer re-entering
 * the canvas, or a frame the tab spent in the background — cannot spike the scene.
 */
export function smoothVelocity(current: number, rawPxPerFrame: number): number {
  const target = clamp01(rawPxPerFrame / VELOCITY_REF);
  return easeToward(current, target, VELOCITY_LERP);
}

/* ──────────────────────────── The click ripple ──────────────────────────── */

/** How fast the ripple crest travels outward, in plane px per millisecond. */
export const RIPPLE_SPEED = 0.9;

/** Half-width of the crest, in plane px. Wider reads as a swell, narrower as a shock. */
export const RIPPLE_WIDTH = 110;

/** How long a ripple lives, in ms. */
export const RIPPLE_DURATION_MS = 1400;

/** Peak extra stretch a building gets as the crest passes through it. */
export const RIPPLE_STRETCH = 0.75;

/**
 * Height contribution of an expanding ripple at plane distance `dist` from its
 * origin, `age` ms after the click. Zero before the click, zero once the ripple has
 * expired, and zero everywhere the crest has not reached.
 *
 * A pure function of `(dist, age)`, which is why there is no scheduler: every cell
 * evaluates its own contribution during the frame it is drawn, nothing is queued,
 * and there is nothing to cancel when the component unmounts.
 */
export function rippleCrest(dist: number, age: number): number {
  if (age < 0 || age >= RIPPLE_DURATION_MS) return 0;
  const crest = age * RIPPLE_SPEED;
  const offset = Math.abs(dist - crest);
  if (offset >= RIPPLE_WIDTH) return 0;
  // Fade the whole wave out over its lifetime so it dies gracefully rather than
  // vanishing mid-travel.
  const life = 1 - age / RIPPLE_DURATION_MS;
  return RIPPLE_STRETCH * smoothstep(1 - offset / RIPPLE_WIDTH) * life * life;
}
