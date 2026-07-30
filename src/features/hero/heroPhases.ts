/**
 * The hero's scroll-phase math, as pure functions of the pin's 0..1 progress.
 *
 * These expressions used to be written inline at nine call sites across
 * SuperHeroSequence.tsx and HeroSignalP.tsx, with the boundaries 0.45, 0.75 and
 * 0.3 restated at each one — and 0.45 meaning "flatten end" in some places and
 * "move start" in others. Changing a phase boundary meant finding every copy.
 *
 * PARITY-LOCKED: every number and every expression here is transcribed
 * literally from those call sites. tests/motion/hero-phases.test.ts pins the
 * outputs. If you are changing how the hero is *driven* (Stage 10 replaces the
 * per-frame setState with CSS custom properties), the values these return must
 * not move — only who reads them.
 */

/** Phase 1 ends here: the 3D logo has finished flattening to 2D. */
export const PHASE_FLATTEN_END = 0.20;
/** Phase 2 ends here: the P logo has finished shifting left (or up on mobile). */
export const PHASE_MOVE_END = 0.35;
/** Span of phase 2. Equals PHASE_MOVE_END - PHASE_FLATTEN_END. */
export const PHASE_MOVE_SPAN = 0.15;
/** Phase 3: the wordmark rises into place. */
export const WORD_REVEAL_END = 0.50;
export const WORD_REVEAL_SPAN = 0.15;

/** Phase 4: Empty threshold dwell hold (0.50 to 0.60). */
export const DWELL_END = 0.60;

/** Phase 5: Gunshot transition (0.60 to 0.80 - doubled duration: span 0.20). */
export const GUNSHOT_END = 0.80;
export const GUNSHOT_SPAN = 0.20;

/** Phase 6: Smoking section slow-motion drift (0.80 to 1.00). */
export const SMOKING_SPAN = 0.20;

/** Distance the wordmark travels, as a percentage of its own height. */
export const WORD_LIFT_PERCENT = -110;
/** How fast the side panels fade out relative to scroll. */
export const PANEL_FADE_RATE = 4;
/** Past this, the side panels stop taking pointer events. */
export const PANEL_POINTER_CUTOFF = 0.2;
/** How fast the logo's side faces fade as it flattens. */
export const SIDE_FACE_FADE_RATE = 1.8;

/** 0..1 across phase 1. Reaches 1 at PHASE_FLATTEN_END and stays there. */
export function flattenProgress(p: number): number {
  return Math.min(1, p / PHASE_FLATTEN_END);
}

/** 0 until PHASE_FLATTEN_END, then 0..1 across phase 2, then 1. */
export function moveLeftProgress(p: number): number {
  if (p <= PHASE_FLATTEN_END) return 0;
  if (p >= PHASE_MOVE_END) return 1;
  return (p - PHASE_FLATTEN_END) / PHASE_MOVE_SPAN;
}

/** 0 until PHASE_MOVE_END, then 0..1 across phase 3, then 1. */
export function wordRevealProgress(p: number): number {
  if (p <= PHASE_MOVE_END) return 0;
  if (p >= WORD_REVEAL_END) return 1;
  return (p - PHASE_MOVE_END) / WORD_REVEAL_SPAN;
}

/** translateY percentage for the wordmark: -110% hidden, 0% fully revealed. */
export function wordLiftPercent(p: number): number {
  return (1 - wordRevealProgress(p)) * WORD_LIFT_PERCENT;
}

/** 0 until DWELL_END, 0..1 across Phase 5 (Gunshot), then 1. */
export function gunshotProgress(p: number): number {
  if (p <= DWELL_END) return 0;
  if (p >= GUNSHOT_END) return 1;
  return (p - DWELL_END) / GUNSHOT_SPAN;
}

/** High-velocity ease-out curve for the gunshot transition. */
export function gunshotEaseOut(p: number): number {
  const g = gunshotProgress(p);
  return 1 - Math.pow(1 - g, 3);
}

/** 0 until GUNSHOT_END, 0..1 across Phase 6 (Smoking drift). */
export function smokingProgress(p: number): number {
  if (p <= GUNSHOT_END) return 0;
  return Math.min(1, (p - GUNSHOT_END) / SMOKING_SPAN);
}

/** Grouped container scale: 1.0 down to 0.4 during gunshot with ease-out, stays at 0.4 during smoking. */
export function containerScale(p: number): number {
  if (p <= DWELL_END) return 1;
  const g = gunshotEaseOut(p);
  return 1 - g * 0.6; // 1.0 -> 0.4
}

/** Top panel X translation percentage: -100% -> 0% during gunshot with ease-out, 0% -> +10% during smoking. */
export function topPanelX(p: number): number {
  if (p <= DWELL_END) return -100;
  if (p <= GUNSHOT_END) {
    const g = gunshotEaseOut(p);
    return -100 + g * 100;
  }
  const s = smokingProgress(p);
  return s * 10;
}

/** Bottom panel X translation percentage: +100% -> 0% during gunshot with ease-out, 0% -> -10% during smoking. */
export function bottomPanelX(p: number): number {
  if (p <= DWELL_END) return 100;
  if (p <= GUNSHOT_END) {
    const g = gunshotEaseOut(p);
    return 100 - g * 100;
  }
  const s = smokingProgress(p);
  return -s * 10;
}

/** Opacity of the hero's side content panels. */
export function panelOpacity(p: number): number {
  return Math.max(0, 1 - p * PANEL_FADE_RATE);
}

/** Side panels must stop swallowing clicks once they have faded out. */
export function panelPointerEvents(p: number): "none" | "auto" {
  return p > PANEL_POINTER_CUTOFF ? "none" : "auto";
}

/** Opacity of the 3D logo's side faces, as a function of FLATTEN progress. */
export function sideFaceOpacity(flatten: number): number {
  return Math.max(0, 1 - flatten * SIDE_FACE_FADE_RATE);
}


