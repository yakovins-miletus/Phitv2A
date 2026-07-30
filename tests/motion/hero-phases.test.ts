import {
  PHASE_FLATTEN_END,
  PHASE_MOVE_END,
  PHASE_MOVE_SPAN,
  WORD_REVEAL_END,
  WORD_REVEAL_SPAN,
  DWELL_END,
  GUNSHOT_END,
  GUNSHOT_SPAN,
  SMOKING_SPAN,
  flattenProgress,
  moveLeftProgress,
  wordRevealProgress,
  gunshotProgress,
  smokingProgress,
  containerScale,
  topPanelX,
  bottomPanelX,
  leftFlankX,
  rightFlankX,
  flankOpacity,
  pExitProgress,
  atEnterProgress,
  atTightenProgress,
  panelOpacity,
  panelPointerEvents,
  sideFaceOpacity,
  wordLiftPercent,
} from "@/features/hero/heroPhases";

test("phase boundaries are the values the design was built around", () => {
  expect(PHASE_FLATTEN_END).toBe(0.20);
  expect(PHASE_MOVE_END).toBe(0.35);
  expect(PHASE_MOVE_SPAN).toBe(0.15);
  expect(WORD_REVEAL_END).toBe(0.50);
  expect(WORD_REVEAL_SPAN).toBe(0.15);
  expect(DWELL_END).toBe(0.60);
  expect(GUNSHOT_END).toBe(0.80);
  expect(GUNSHOT_SPAN).toBe(0.20);
  expect(SMOKING_SPAN).toBe(0.20);
  expect(PHASE_MOVE_END - PHASE_FLATTEN_END).toBeCloseTo(PHASE_MOVE_SPAN, 10);
  expect(WORD_REVEAL_END - PHASE_MOVE_END).toBeCloseTo(WORD_REVEAL_SPAN, 10);
});

test.each([
  // p,     flatten, moveLeft, wordReveal, gunshot, smoking
  [0, 0, 0, 0, 0, 0],
  [0.10, 0.5, 0, 0, 0, 0],
  [0.20, 1, 0, 0, 0, 0],
  [0.275, 1, 0.5, 0, 0, 0],
  [0.35, 1, 1, 0, 0, 0],
  [0.425, 1, 1, 0.5, 0, 0],
  [0.50, 1, 1, 1, 0, 0],
  [0.55, 1, 1, 1, 0, 0], // Dwell hold
  [0.70, 1, 1, 1, 0.5, 0], // Gunshot midpoint
  [0.80, 1, 1, 1, 1, 0], // Gunshot finish
  [0.90, 1, 1, 1, 1, 0.5], // Smoking midpoint
  [1.00, 1, 1, 1, 1, 1], // Smoking finish
])("progress %f -> flatten %f, moveLeft %f, wordReveal %f, gunshot %f, smoking %f", (p, flat, move, word, gun, smoke) => {
  expect(flattenProgress(p)).toBeCloseTo(flat, 6);
  expect(moveLeftProgress(p)).toBeCloseTo(move, 6);
  expect(wordRevealProgress(p)).toBeCloseTo(word, 6);
  expect(gunshotProgress(p)).toBeCloseTo(gun, 6);
  expect(smokingProgress(p)).toBeCloseTo(smoke, 6);
});

const STEPS = 200;
const at = (i: number) => i / STEPS;

test("all phases stay within 0..1 across the whole scrub", () => {
  for (let i = 0; i <= STEPS; i += 1) {
    for (const f of [flattenProgress, moveLeftProgress, wordRevealProgress, gunshotProgress, smokingProgress]) {
      const v = f(at(i));
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  }
});

test("all phases are monotonically non-decreasing", () => {
  for (const f of [flattenProgress, moveLeftProgress, wordRevealProgress, gunshotProgress, smokingProgress]) {
    let prev = -1;
    for (let i = 0; i <= STEPS; i += 1) {
      const v = f(at(i));
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  }
});

test("phases do not overlap: each starts only once the previous has finished", () => {
  expect(moveLeftProgress(PHASE_FLATTEN_END - 1e-6)).toBe(0);
  expect(wordRevealProgress(PHASE_MOVE_END - 1e-6)).toBe(0);
  expect(flattenProgress(PHASE_FLATTEN_END)).toBe(1);
  expect(gunshotProgress(DWELL_END - 1e-6)).toBe(0);
  expect(smokingProgress(GUNSHOT_END - 1e-6)).toBe(0);
});

test("wordmark lift runs -110% (hidden) to 0% (in place)", () => {
  expect(wordLiftPercent(0)).toBeCloseTo(-110, 6);
  expect(wordLiftPercent(PHASE_MOVE_END)).toBeCloseTo(-110, 6);
  expect(wordLiftPercent(0.425)).toBeCloseTo(-55, 6);
  expect(wordLiftPercent(WORD_REVEAL_END)).toBeCloseTo(0, 6);
});

test("gunshot transition scales container 1.0 to 0.4 and translates split panels with ease-out", () => {
  expect(containerScale(0.50)).toBe(1);
  expect(containerScale(DWELL_END)).toBe(1);
  expect(containerScale(GUNSHOT_END)).toBeCloseTo(0.4, 6);
  expect(containerScale(1.0)).toBeCloseTo(0.4, 6);

  expect(topPanelX(DWELL_END)).toBeCloseTo(-100, 6);
  expect(topPanelX(GUNSHOT_END)).toBeCloseTo(0, 6);
  expect(topPanelX(1.0)).toBeCloseTo(10, 6);

  expect(bottomPanelX(DWELL_END)).toBeCloseTo(100, 6);
  expect(bottomPanelX(GUNSHOT_END)).toBeCloseTo(0, 6);
  expect(bottomPanelX(1.0)).toBeCloseTo(-10, 6);

  expect(leftFlankX(DWELL_END)).toBeCloseTo(0, 6);
  expect(leftFlankX(GUNSHOT_END)).toBeCloseTo(-580, 6);
  expect(leftFlankX(1.0)).toBeCloseTo(-580, 6);

  expect(rightFlankX(DWELL_END)).toBeCloseTo(0, 6);
  expect(rightFlankX(GUNSHOT_END)).toBeCloseTo(580, 6);
  expect(rightFlankX(1.0)).toBeCloseTo(580, 6);

  expect(flankOpacity(DWELL_END)).toBeCloseTo(0, 6);
  expect(flankOpacity(GUNSHOT_END)).toBeCloseTo(1, 6);
  expect(flankOpacity(1.0)).toBeCloseTo(1, 6);
});

test("mini transformation transitions P to AT and pulls AT PHITOPOLIS close together", () => {
  expect(pExitProgress(0.72)).toBe(0);
  expect(pExitProgress(0.745)).toBeCloseTo(0.5, 6);
  expect(pExitProgress(0.77)).toBe(1);

  expect(atEnterProgress(0.77)).toBe(0);
  expect(atEnterProgress(0.80)).toBeCloseTo(0.5, 6);
  expect(atEnterProgress(0.83)).toBe(1);

  expect(atTightenProgress(0.87)).toBe(0);
  expect(atTightenProgress(0.905)).toBeCloseTo(0.5, 6);
  expect(atTightenProgress(0.94)).toBe(1);
});

test.each([
  [0, 1, "auto"],
  [0.1, 0.6, "auto"],
  [0.2, 0.2, "auto"],
  [0.20001, 0.19996, "none"],
  [0.25, 0, "none"],
  [0.5, 0, "none"],
  [1, 0, "none"],
])("panel at %f -> opacity %f, pointerEvents %s", (p, opacity, pe) => {
  expect(panelOpacity(p)).toBeCloseTo(opacity, 6);
  expect(panelPointerEvents(p)).toBe(pe);
});

test("panels stop taking clicks no later than they become invisible", () => {
  for (let p = 0; p <= 1.0001; p += 0.005) {
    if (panelOpacity(p) === 0) expect(panelPointerEvents(p)).toBe("none");
  }
});

test("logo side faces fade out before flattening completes", () => {
  expect(sideFaceOpacity(0)).toBeCloseTo(1, 6);
  expect(sideFaceOpacity(0.25)).toBeCloseTo(0.55, 6);
  expect(sideFaceOpacity(5 / 9)).toBeCloseTo(0, 6);
  expect(sideFaceOpacity(1)).toBe(0);
});

