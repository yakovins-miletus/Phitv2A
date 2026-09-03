/**
 * Pure Phase Math & Timing Model for Closing Video Stage
 *
 * Cinematic sequence over a 3.0vh pinned ScrollTrigger:
 *   Phase 1: [0.00, 0.52] — Video scrub (we-build-the-future.mp4 plays from 0% to 100%).
 *            The video element has the full stage; scrim is subtle.
 *   Phase 2: [0.48, 0.58] — Scrim deepens from 0.25 to 0.72 as the video reaches concluding frames.
 *   Phase 3: [0.52, 0.72] — Beat 1: "We create exciting technologies" emerges centered and
 *            horizontally expanded, dwells in full view, and recedes [0.72, 0.78].
 *   Phase 4: [0.78, 0.82] — Disjoint Buffer: Beat 1 has faded out, Beat 2 has not started.
 *            100% mathematical disjointness guarantee (opacity of both is never simultaneously > 0).
 *   Phase 5: [0.82, 1.00] — Beat 2: Primary CTA card rises centered and horizontally expanded,
 *            revealing "Start a Conversation" (/contact) and "Explore Careers" (/careers).
 *            Interactive pointer events open at p >= 0.86.
 */

export const CLOSING_PIN_VH = 3.0;

export const VIDEO_SCRUB_START = 0.0;
export const VIDEO_SCRUB_END = 0.52;

export const SCRIM_START = 0.48;
export const SCRIM_END = 0.58;
export const SCRIM_MIN = 0.25;
export const SCRIM_MAX = 0.72;

export const BEAT1_IN_START = 0.52;
export const BEAT1_IN_END = 0.60;
export const BEAT1_OUT_START = 0.72;
export const BEAT1_OUT_END = 0.78;

export const BEAT2_IN_START = 0.82;
export const BEAT2_IN_END = 0.90;
export const BEAT2_POINTER_START = 0.86;

/**
 * Normalized video scrub progress [0.0, 1.0].
 * Proportionally scrubs video.currentTime as the user scrolls through [0, 0.52].
 * Holds at 1.0 for p >= 0.52 so the concluding frame remains as an atmosphere backdrop.
 */
export function videoProgressFor(p: number): number {
  if (p <= VIDEO_SCRUB_START) return 0;
  if (p >= VIDEO_SCRUB_END) return 1;
  return (p - VIDEO_SCRUB_START) / (VIDEO_SCRUB_END - VIDEO_SCRUB_START);
}

/**
 * Radial / backdrop scrim opacity [0.25, 0.72].
 * Deepens as the video scrub finishes so the typography in Beats 1 and 2 has
 * supreme contrast and readability.
 */
export function scrimOpacityFor(p: number): number {
  if (p <= SCRIM_START) return SCRIM_MIN;
  if (p >= SCRIM_END) return SCRIM_MAX;
  const ratio = (p - SCRIM_START) / (SCRIM_END - SCRIM_START);
  return SCRIM_MIN + ratio * (SCRIM_MAX - SCRIM_MIN);
}

/**
 * Beat 1 opacity curve.
 * 0.0 before 0.52
 * Ramps 0 -> 1 in [0.52, 0.60]
 * Holds 1.0 in [0.60, 0.72]
 * Ramps 1 -> 0 in [0.72, 0.78]
 * 0.0 thereafter
 */
export function beat1OpacityFor(p: number): number {
  if (p < BEAT1_IN_START || p > BEAT1_OUT_END) return 0;
  if (p >= BEAT1_IN_END && p <= BEAT1_OUT_START) return 1;
  if (p < BEAT1_IN_END) {
    return (p - BEAT1_IN_START) / (BEAT1_IN_END - BEAT1_IN_START);
  }
  return (BEAT1_OUT_END - p) / (BEAT1_OUT_END - BEAT1_OUT_START);
}

/**
 * Beat 2 (CTA Block) opacity curve.
 * 0.0 before 0.82
 * Ramps 0 -> 1 in [0.82, 0.90]
 * Holds 1.0 in [0.90, 1.00]
 */
export function beat2OpacityFor(p: number): number {
  if (p < BEAT2_IN_START) return 0;
  if (p >= BEAT2_IN_END) return 1;
  return (p - BEAT2_IN_START) / (BEAT2_IN_END - BEAT2_IN_START);
}

/**
 * Pointer events gate for Beat 2 CTA buttons.
 * "none" until p reaches 0.86, "auto" thereafter so clicks cannot trigger prematurely.
 */
export function ctaPointerFor(p: number): "none" | "auto" {
  return p >= BEAT2_POINTER_START ? "auto" : "none";
}

/**
 * Visibility gate for Beat 1 headline and copy.
 * "visible" when within [BEAT1_IN_START, BEAT1_OUT_END], "hidden" otherwise.
 * Prevents screen-readers and accessibility tools from focusing while invisible.
 */
export function beat1VisibilityFor(p: number): "visible" | "hidden" {
  return p >= BEAT1_IN_START && p <= BEAT1_OUT_END ? "visible" : "hidden";
}

/**
 * Visibility gate for Beat 2 CTA block.
 * "visible" when p >= BEAT2_IN_START, "hidden" otherwise.
 * Prevents tab navigation from reaching buttons while they are invisible during video scrub.
 */
export function beat2VisibilityFor(p: number): "visible" | "hidden" {
  return p >= BEAT2_IN_START ? "visible" : "hidden";
}

