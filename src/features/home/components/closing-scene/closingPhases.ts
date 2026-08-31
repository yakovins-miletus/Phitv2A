/**
 * Closing scrub phase math — pure functions of the pin's 0..1 progress `p`.
 *
 * Kept OUT of `src/features/hero/heroPhases.ts` on purpose: that file is
 * PARITY-LOCKED to the top hero's call sites. The closing scene owns its own
 * "cinematic hand-off" spine and tunes it here.
 *
 * Every sequence is followed by a BUFFER — a stretch of pin where nothing moves
 * — so each beat lands and rests before the next starts.
 *
 * | phase              | p range   | headline wrapper opacity   | cta wrapper opacity        | cta pointer |
 * |--------------------|-----------|----------------------------|----------------------------|-------------|
 * | 1 P + vignette in  | 0.00–0.20 | 0                          | 0                          | none        |
 * | ·  buffer          | 0.20–0.30 | 0                          | 0                          | none        |
 * | 2 headline builds  | 0.30–0.46 | ramp 0→1 over [0.30,0.46]  | 0                          | none        |
 * | ·  buffer / hold   | 0.46–0.58 | 1                          | 0                          | none        |
 * | 3 headline recedes | 0.58–0.70 | ramp 1→0 over [0.58,0.70]  | 0                          | none        |
 * | ·  buffer / gap    | 0.70–0.80 | 0                          | 0                          | none        |
 * | 4 CTA rises        | 0.80–0.93 | 0                          | ramp 0→1 over [0.80,0.93]  | auto ≥ 0.87 |
 * | ·  settled         | 0.93–1.00 | 0                          | 1                          | auto        |
 *
 * Disjointness: headline-opacity is 0 for all p ≥ 0.70 and cta-opacity is 0 for
 * all p ≤ 0.80 — they are never both > 0 (deliberate dead gap [0.70, 0.80]).
 *
 * The scrubbed GSAP timeline in `ClosingLattice.tsx` is forced to total
 * duration 1 (a full-span spacer tween), so every tween's absolute position
 * here equals the pin's scrub progress `p` — the word/recede/CTA motion stays
 * locked to the wrapper-opacity ramps above.
 *
 * Mode A does NOT scrub the canvas. It mounts the closure `HeroCanvas` as a
 * background layer with `setProgress(0)` (solid 3D P, never the particle-converge
 * window) and `setZoomProgress(CLOSURE_ZOOM_HOLD)` held for the whole pin, plus a
 * subtle CSS drift. `closingHeroProgressFor` / `closingZoomFor` / `ZOOM_MAX`
 * describe the alternative scrubbed camera and stay exported for a future
 * iteration.
 */

import { PHASE_MOVE_END } from "@/features/hero/heroPhases";

/** Pin length as a multiple of `window.innerHeight`. Retuned 1.3 → 2.0 → 2.6 →
 *  3.0: the buffered spine needs the extra room (re-check
 *  `tests/e2e/ladder-probe.js` — the `#closing` pin end moves deliberately). */
export const CLOSING_PIN_VH = 3.0;

export const SETTLE_END = 0.2;
export const WORD_IN_START = 0.3;
export const WORD_IN_END = 0.46;
export const EYEBROW_IN_START = 0.3;
export const EYEBROW_IN_END = 0.37;
export const HEADLINE_OUT_START = 0.58;
export const HEADLINE_OUT_END = 0.7;
export const CTA_IN_START = 0.8;
export const CTA_IN_END = 0.93;
export const CTA_POINTER_AT = 0.87;

/** Max closure-camera zoom (0 = tight, 1 = fully wide). A partial dolly-out —
 *  reveals the supporting lattice nodes without shrinking the P to a speck. */
export const ZOOM_MAX = 0.7;

/** Mode A holds the closure camera at a fixed wide-ish framing for the whole pin
 *  — the extended node lattice reads, and the 3D P (offset left, see the drift
 *  constants) sits small enough to clear the right-hand headline/CTA stage. Held,
 *  not scrubbed — no dolly-out. */
export const CLOSURE_ZOOM_HOLD = 0.82;

/** The masked canvas layer sits biased left of centre so the 3D P clears the
 *  right-hand headline / CTA stage, then drifts a touch further across the pin
 *  (subtle parallax). Values are % of the layer's own box. */
export const CLOSURE_DRIFT_X_FROM = -12;
export const CLOSURE_DRIFT_X_TO = -14;
export const CLOSURE_DRIFT_Y_FROM = 0;
export const CLOSURE_DRIFT_Y_TO = -2;

/** Closing vignette opacity ramp start/end, in pin progress. Fades in just past
 *  where the "In closing" establishing header has left the viewport (pin p just
 *  above 0), settling well before the headline build starts. */
export const VIGNETTE_IN_START = 0.03;
export const VIGNETTE_IN_END = 0.17;

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** Smootherstep-free smoothstep on [0, 1]. */
const smoothstep = (t: number): number => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

/** Canvas pin progress. Ramps 0 → PHASE_MOVE_END across phase 1, then clamps —
 *  the closure canvas must never exceed PHASE_MOVE_END or it enters the top
 *  hero's gunshot/smoke/container-transform phases. */
export const closingHeroProgressFor = (p: number): number =>
  Math.min((p / SETTLE_END) * PHASE_MOVE_END, PHASE_MOVE_END);

/** Closure-camera zoom. Monotonic non-decreasing 0 → ZOOM_MAX, eased. */
export const closingZoomFor = (p: number): number => ZOOM_MAX * smoothstep(p);

/** Headline wrapper opacity: rises 0→1, holds, then falls 1→0 — all before the
 *  CTA window opens. Difference of two clamped ramps: continuous, self-bounded
 *  to [0, 1]. */
export const headlineOpacityFor = (p: number): number =>
  clamp01((p - WORD_IN_START) / (WORD_IN_END - WORD_IN_START)) -
  clamp01((p - HEADLINE_OUT_START) / (HEADLINE_OUT_END - HEADLINE_OUT_START));

/** CTA wrapper opacity: 0 → 1 over [CTA_IN_START, CTA_IN_END], then holds. */
export const ctaOpacityFor = (p: number): number =>
  clamp01((p - CTA_IN_START) / (CTA_IN_END - CTA_IN_START));

/** CTA pointer-events gate — a step, not a ramp. */
export const ctaPointerFor = (p: number): "auto" | "none" =>
  p >= CTA_POINTER_AT ? "auto" : "none";

/** Closing vignette opacity: 0 → 1 over [VIGNETTE_IN_START, VIGNETTE_IN_END],
 *  then holds. Mirrors `ctaOpacityFor` — continuous, self-bounded to [0, 1]. */
export const vignetteOpacityFor = (p: number): number =>
  clamp01((p - VIGNETTE_IN_START) / (VIGNETTE_IN_END - VIGNETTE_IN_START));
