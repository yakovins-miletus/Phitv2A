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

/** Phase 4: Dwell buffer (0.50 → 0.60). Nothing moves. */
export const DWELL_END = 0.60;

/** Phase 5: Gunshot — ONLY images slide in (0.60 → 0.70). */
export const GUNSHOT_END = 0.70;
export const GUNSHOT_SPAN = 0.10;

/** Phase 6: Post-gunshot buffer (0.70 → 0.74). Nothing moves. */

/** Phase 7: Smoking — ONLY flanking texts appear vertically (0.74 → 0.82). */
export const SMOKING_START = 0.74;
export const SMOKING_END = 0.82;
export const SMOKING_SPAN = 0.08;

/** Phase 8: Post-smoking buffer (0.82 → 0.86). Texts are settled, nothing moves. */

/** Phase 9: Container transform — P exit, AT enter, tighten (0.86 → 1.00). */
export const CONTAINER_START = 0.86;

/** Border animation starts after tighten finishes (0.95 → 1.00). */
export function borderAnimProgress(p: number): number {
  if (p <= 0.95) return 0;
  if (p >= 1.00) return 1;
  return (p - 0.95) / 0.05;
}

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

/** 0 until DWELL_END, 0..1 across Phase 5 (Gunshot images), then 1. */
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

/** 0 until SMOKING_START, 0..1 across Phase 7 (Smoking texts), then 1. */
export function smokingProgress(p: number): number {
  if (p <= SMOKING_START) return 0;
  if (p >= SMOKING_END) return 1;
  return (p - SMOKING_START) / SMOKING_SPAN;
}

/**
 * Container scale: scales down from 1.0 to 0.34 during gunshot (alongside images).
 * Stays at 0.34 through smoking, buffers, and container transform.
 */
export function containerScale(p: number): number {
  if (p <= DWELL_END) return 1;
  if (p >= GUNSHOT_END) return 0.34;
  const g = gunshotEaseOut(p);
  return 1 - g * 0.66; // 1.0 → 0.34
}

/**
 * Top panel X translation: -100% → 0% during gunshot only.
 * Stays at 0% during smoking and container transform (no drift).
 *
 * HISTORY: these two describe an entrance nothing renders any more. The split panes
 * they were written for stopped reading `--hp-topx`/`--hp-botx` some time before the
 * drift wall replaced them, and the wall enters on `--hp-g` instead. They survive
 * because this file is PARITY-LOCKED (see the header) and hero-phases.test.ts pins
 * their outputs; they are pure, unimported by any `src/` module, and cost nothing.
 */
export function topPanelX(p: number): number {
  if (p <= DWELL_END) return -100;
  if (p >= GUNSHOT_END) return 0;
  const g = gunshotEaseOut(p);
  return -100 + g * 100;
}

/**
 * Bottom panel X translation: +100% → 0% during gunshot only.
 * Stays at 0% during smoking and container transform (no drift).
 */
export function bottomPanelX(p: number): number {
  if (p <= DWELL_END) return 100;
  if (p >= GUNSHOT_END) return 0;
  const g = gunshotEaseOut(p);
  return 100 - g * 100;
}

/** Left flanking text X translation px (unused — texts move vertically now). */
export function leftFlankX(_p: number): number {
  return 0;
}

/** Right flanking text X translation px (unused — texts move vertically now). */
export function rightFlankX(_p: number): number {
  return 0;
}

/** Left flanking text Y translation vh: 0 → -18vh (upward) during smoking only. */
export function leftFlankY(p: number): number {
  if (p <= SMOKING_START) return 0;
  if (p >= SMOKING_END) return -18;
  const s = smokingProgress(p);
  const eased = 1 - Math.pow(1 - s, 2); // ease-out quad
  return -eased * 18;
}

/** Right flanking text Y translation vh: 0 → +18vh (downward) during smoking only. */
export function rightFlankY(p: number): number {
  if (p <= SMOKING_START) return 0;
  if (p >= SMOKING_END) return 18;
  const s = smokingProgress(p);
  const eased = 1 - Math.pow(1 - s, 2); // ease-out quad
  return eased * 18;
}

/** Flanking text opacity: 0 until smoking starts, then 0→1 during smoking. */
export function flankOpacity(p: number): number {
  if (p <= SMOKING_START) return 0;
  if (p >= SMOKING_END) return 1;
  return smokingProgress(p);
}

/** Crossfade progress for P logo and AT (0.86 → 0.92). */
export function logoAtCrossfadeProgress(p: number): number {
  if (p <= CONTAINER_START) return 0;
  if (p >= 0.92) return 1;
  return (p - CONTAINER_START) / 0.06;
}

/** Backward compatibility alias for pExitProgress. */
export function pToAtProgress(p: number): number {
  return logoAtCrossfadeProgress(p);
}

/** PHITOPOLIS slides left to meet AT with reasonable spacing (0.92 → 0.95). */
export function atTightenProgress(p: number): number {
  if (p <= 0.92) return 0;
  if (p >= 0.95) return 1;
  return (p - 0.92) / 0.03;
}

/** Final buffer 0.97 → 1.00 */

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

/* ── Stage 4: dawn sky choreography ──────────────────────────────────────
   Four more pure functions of the same 0..1 pin progress, expressed against
   the boundaries already exported above so they can never desync from the
   phases they ride alongside. */

/** How high the sun sits: 0 at rest, 1 once the wordmark has fully revealed.
 *  Rises slowly through the flatten phase, then climbs the rest of the way
 *  during move+reveal, then holds. */
export function sunAltitude(p: number): number {
  if (p <= PHASE_FLATTEN_END) return (Math.max(0, p) / PHASE_FLATTEN_END) * 0.35;
  if (p >= WORD_REVEAL_END) return 1.0;
  return 0.35 + ((p - PHASE_FLATTEN_END) / (WORD_REVEAL_END - PHASE_FLATTEN_END)) * 0.65;
}

/** How thick the low haze is: full through the flatten phase, thins across
 *  move+reveal, holds through the dwell, then burns off during gunshot. */
export function hazeDensity(p: number): number {
  if (p <= PHASE_FLATTEN_END) return 1.0;
  if (p <= WORD_REVEAL_END) {
    return 1.0 - ((p - PHASE_FLATTEN_END) / (WORD_REVEAL_END - PHASE_FLATTEN_END)) * 0.55;
  }
  if (p <= DWELL_END) return 0.45;
  if (p <= GUNSHOT_END) {
    return 0.45 - ((p - DWELL_END) / (GUNSHOT_END - DWELL_END)) * 0.35;
  }
  return 0.10;
}

/** Overall opacity of the whole sky composition: full through the dwell,
 *  fades hard across gunshot, tails off across smoking/buffers, and is
 *  exactly 0 by CONTAINER_START — the handoff `window.__ground` covers. */
export function skyPresence(p: number): number {
  if (p <= DWELL_END) return 1.0;
  if (p <= GUNSHOT_END) {
    return 1.0 - ((p - DWELL_END) / (GUNSHOT_END - DWELL_END)) * 0.85;
  }
  if (p <= CONTAINER_START) {
    return 0.15 * (1 - (p - GUNSHOT_END) / (CONTAINER_START - GUNSHOT_END));
  }
  return 0;
}

/** Monotonic drift value for stage 5's cloud bands to consume — plumbed
 *  through now so the vars contract is stable before there is anything to
 *  drive with it. Identity, clamped: strictly non-decreasing across [0, 1]. */
export function cloudDrift(p: number): number {
  return Math.max(0, Math.min(1, p));
}
