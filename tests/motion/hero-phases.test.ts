import {
  PHASE_FLATTEN_END,
  PHASE_MOVE_END,
  PHASE_MOVE_SPAN,
  WORD_REVEAL_SPAN,
  flattenProgress,
  moveLeftProgress,
  panelOpacity,
  panelPointerEvents,
  sideFaceOpacity,
  wordLiftPercent,
  wordRevealProgress,
} from "@/features/hero/heroPhases";

// THE CONTRACT for the hero's scroll choreography.
//
// These expectations were computed from the expressions as they were written
// inline in SuperHeroSequence.tsx and HeroSignalP.tsx before extraction. They
// exist so that Stage 10 — which replaces the per-scrub-frame React setState
// with CSS custom properties — can change HOW the hero is driven while proving
// WHAT it renders is unchanged. If a change here is intentional, the numbers in
// this file and the ladder baseline must move together, deliberately.

test("phase boundaries are the values the design was built around", () => {
  expect(PHASE_FLATTEN_END).toBe(0.45);
  expect(PHASE_MOVE_END).toBe(0.75);
  expect(PHASE_MOVE_SPAN).toBe(0.3);
  expect(WORD_REVEAL_SPAN).toBe(0.25);
  // Phase 2 must exactly span the gap between the two boundaries, or the logo
  // either stops short of its resting place or overshoots and clamps.
  expect(PHASE_MOVE_END - PHASE_FLATTEN_END).toBeCloseTo(PHASE_MOVE_SPAN, 10);
  // Phase 3 must run from PHASE_MOVE_END to exactly 1.0.
  expect(PHASE_MOVE_END + WORD_REVEAL_SPAN).toBeCloseTo(1, 10);
});

test.each([
  // p,     flatten, moveLeft, wordReveal
  [0, 0, 0, 0],
  [0.225, 0.5, 0, 0],
  [0.45, 1, 0, 0],
  [0.6, 1, 0.5, 0],
  [0.75, 1, 1, 0],
  [0.875, 1, 1, 0.5],
  [1, 1, 1, 1],
])("progress %f -> flatten %f, moveLeft %f, wordReveal %f", (p, flat, move, word) => {
  expect(flattenProgress(p)).toBeCloseTo(flat, 6);
  expect(moveLeftProgress(p)).toBeCloseTo(move, 6);
  expect(wordRevealProgress(p)).toBeCloseTo(word, 6);
});

// Integer-stepped so accumulated float error never pushes p past 1. That
// matters here: ScrollTrigger clamps its own progress to [0,1], and
// wordRevealProgress relies on it — the expression has no upper clamp of its
// own (faithful to the original inline code), so feeding it 1 + 1e-15 returns
// slightly more than 1.
const STEPS = 200;
const at = (i: number) => i / STEPS;

test("the three phases stay within 0..1 across the whole scrub", () => {
  for (let i = 0; i <= STEPS; i += 1) {
    for (const f of [flattenProgress, moveLeftProgress, wordRevealProgress]) {
      const v = f(at(i));
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  }
});

test("all three phases are monotonically non-decreasing", () => {
  for (const f of [flattenProgress, moveLeftProgress, wordRevealProgress]) {
    let prev = -1;
    for (let i = 0; i <= STEPS; i += 1) {
      const v = f(at(i));
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  }
});

test("phases do not overlap: each starts only once the previous has finished", () => {
  // Just before the flatten boundary the logo has not begun moving.
  expect(moveLeftProgress(PHASE_FLATTEN_END - 1e-6)).toBe(0);
  // Just before the move boundary the wordmark has not begun rising.
  expect(wordRevealProgress(PHASE_MOVE_END - 1e-6)).toBe(0);
  // Flatten is complete before the move starts.
  expect(flattenProgress(PHASE_FLATTEN_END)).toBe(1);
});

test("wordmark lift runs -110% (hidden) to 0% (in place)", () => {
  expect(wordLiftPercent(0)).toBeCloseTo(-110, 6);
  expect(wordLiftPercent(PHASE_MOVE_END)).toBeCloseTo(-110, 6);
  expect(wordLiftPercent(0.875)).toBeCloseTo(-55, 6);
  expect(wordLiftPercent(1)).toBeCloseTo(0, 6);
});

test.each([
  [0, 1, "auto"],
  [0.1, 0.7, "auto"],
  [0.3, 0.1, "auto"],
  // One float past the cutoff: pointer events flip, opacity is still non-zero.
  [0.30001, 0.09997, "none"],
  [1 / 3, 0, "none"],
  [0.5, 0, "none"],
  [1, 0, "none"],
])("panel at %f -> opacity %f, pointerEvents %s", (p, opacity, pe) => {
  expect(panelOpacity(p)).toBeCloseTo(opacity, 6);
  expect(panelPointerEvents(p)).toBe(pe);
});

test("panels stop taking clicks no later than they become invisible", () => {
  // A panel that is transparent but still swallowing pointer events is the
  // classic invisible-click-blocker bug. Opacity hits 0 at p = 1/3; the pointer
  // cutoff is 0.3, so it always fires first.
  for (let p = 0; p <= 1.0001; p += 0.005) {
    if (panelOpacity(p) === 0) expect(panelPointerEvents(p)).toBe("none");
  }
});

test("logo side faces fade out before flattening completes", () => {
  expect(sideFaceOpacity(0)).toBeCloseTo(1, 6);
  expect(sideFaceOpacity(0.25)).toBeCloseTo(0.55, 6);
  // Gone by 5/9 of the way through flattening, so no side face survives to
  // ghost over the flat 2D logo.
  expect(sideFaceOpacity(5 / 9)).toBeCloseTo(0, 6);
  expect(sideFaceOpacity(1)).toBe(0);
});
