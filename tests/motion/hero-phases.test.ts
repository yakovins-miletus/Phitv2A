import {
  PHASE_FLATTEN_END,
  PHASE_MOVE_END,
  PHASE_MOVE_SPAN,
  WORD_REVEAL_END,
  WORD_REVEAL_SPAN,
  DWELL_END,
  GUNSHOT_END,
  GUNSHOT_SPAN,
  SMOKING_START,
  SMOKING_END,
  SMOKING_SPAN,
  CONTAINER_START,
  flattenProgress,
  moveLeftProgress,
  wordRevealProgress,
  gunshotProgress,
  smokingProgress,
  containerScale,
  topPanelX,
  bottomPanelX,
  leftFlankY,
  rightFlankY,
  flankOpacity,
  logoAtCrossfadeProgress,
  borderAnimProgress,
  atTightenProgress,
  panelOpacity,
  panelPointerEvents,
  sideFaceOpacity,
  wordLiftPercent,
  sunAltitude,
  hazeDensity,
  skyPresence,
  cloudDrift,
} from "@/features/hero/heroPhases";

test("phase boundaries are the values the design was built around", () => {
  expect(PHASE_FLATTEN_END).toBe(0.20);
  expect(PHASE_MOVE_END).toBe(0.35);
  expect(PHASE_MOVE_SPAN).toBe(0.15);
  expect(WORD_REVEAL_END).toBe(0.50);
  expect(WORD_REVEAL_SPAN).toBe(0.15);
  expect(DWELL_END).toBe(0.60);
  expect(GUNSHOT_END).toBe(0.70);
  expect(GUNSHOT_SPAN).toBe(0.10);
  expect(SMOKING_START).toBe(0.74);
  expect(SMOKING_END).toBe(0.82);
  expect(SMOKING_SPAN).toBe(0.08);
  expect(CONTAINER_START).toBe(0.86);
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
  [0.55, 1, 1, 1, 0, 0],       // Dwell buffer midpoint
  [0.60, 1, 1, 1, 0, 0],       // Dwell end / gunshot start
  [0.65, 1, 1, 1, 0.5, 0],     // Gunshot midpoint
  [0.70, 1, 1, 1, 1, 0],       // Gunshot end
  [0.72, 1, 1, 1, 1, 0],       // Post-gunshot buffer
  [0.74, 1, 1, 1, 1, 0],       // Smoking start
  [0.78, 1, 1, 1, 1, 0.5],     // Smoking midpoint
  [0.82, 1, 1, 1, 1, 1],       // Smoking end
  [0.84, 1, 1, 1, 1, 1],       // Post-smoking buffer
  [1.00, 1, 1, 1, 1, 1],       // End
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
  expect(smokingProgress(GUNSHOT_END)).toBe(0);      // buffer gap between gunshot and smoking
  expect(smokingProgress(SMOKING_START - 1e-6)).toBe(0);
});

test("buffer segments: nothing new starts during buffer zones", () => {
  // Post-gunshot buffer (0.70 → 0.74): gunshot done, smoking hasn't started
  expect(gunshotProgress(0.72)).toBe(1);
  expect(smokingProgress(0.72)).toBe(0);
  expect(containerScale(0.72)).toBeCloseTo(0.34, 6);  // container already scaled down
  expect(flankOpacity(0.72)).toBe(0);
  expect(topPanelX(0.72)).toBe(0);
  expect(bottomPanelX(0.72)).toBe(0);

  // Post-smoking buffer (0.82 → 0.86): smoking done, P/AT transform hasn't started
  expect(smokingProgress(0.84)).toBe(1);
  expect(containerScale(0.84)).toBeCloseTo(0.34, 6);
  expect(logoAtCrossfadeProgress(0.84)).toBe(0);
});

test("wordmark lift runs -110% (hidden) to 0% (in place)", () => {
  expect(wordLiftPercent(0)).toBeCloseTo(-110, 6);
  expect(wordLiftPercent(PHASE_MOVE_END)).toBeCloseTo(-110, 6);
  expect(wordLiftPercent(0.425)).toBeCloseTo(-55, 6);
  expect(wordLiftPercent(WORD_REVEAL_END)).toBeCloseTo(0, 6);
});

test("gunshot: images slide in AND container scales down together", () => {
  // Container scales during gunshot
  expect(containerScale(DWELL_END)).toBe(1);
  expect(containerScale(GUNSHOT_END)).toBeCloseTo(0.34, 6);
  // Container stays at 0.34 after gunshot
  expect(containerScale(0.72)).toBeCloseTo(0.34, 6);
  expect(containerScale(1.0)).toBeCloseTo(0.34, 6);
  // Flanking texts must stay invisible during gunshot
  expect(flankOpacity(0.65)).toBe(0);
  expect(flankOpacity(GUNSHOT_END)).toBe(0);
  // Images slide in during gunshot
  expect(topPanelX(DWELL_END)).toBeCloseTo(-100, 6);
  expect(topPanelX(GUNSHOT_END)).toBeCloseTo(0, 6);
  expect(bottomPanelX(DWELL_END)).toBeCloseTo(100, 6);
  expect(bottomPanelX(GUNSHOT_END)).toBeCloseTo(0, 6);
});

test("smoking: only texts appear vertically, container stays at 0.34", () => {
  expect(containerScale(SMOKING_START)).toBeCloseTo(0.34, 6);
  expect(containerScale(SMOKING_END)).toBeCloseTo(0.34, 6);
  // Flanking texts appear during smoking
  expect(flankOpacity(SMOKING_START)).toBe(0);
  expect(flankOpacity(SMOKING_END)).toBe(1);
  // Left text moves upward (negative Y)
  expect(leftFlankY(SMOKING_START)).toBe(0);
  expect(leftFlankY(SMOKING_END)).toBe(-18);
  // Right text moves downward (positive Y)
  expect(rightFlankY(SMOKING_START)).toBe(0);
  expect(rightFlankY(SMOKING_END)).toBe(18);
  // Images stay parked (no drift)
  expect(topPanelX(SMOKING_START)).toBe(0);
  expect(topPanelX(SMOKING_END)).toBe(0);
});

test("container transform: P/AT transitions fire only after CONTAINER_START in one continuous flow", () => {
  // P/AT crossfade (0.86 → 0.92)
  expect(logoAtCrossfadeProgress(CONTAINER_START)).toBe(0);
  expect(logoAtCrossfadeProgress(0.89)).toBeCloseTo(0.5, 6);
  expect(logoAtCrossfadeProgress(0.92)).toBe(1);

  // Tighten (0.92 → 0.95)
  expect(atTightenProgress(0.92)).toBe(0);
  expect(atTightenProgress(0.935)).toBeCloseTo(0.5, 6);
  expect(atTightenProgress(0.95)).toBe(1);

  // Border animation starts immediately after tighten (0.95 → 1.00)
  expect(borderAnimProgress(0.95)).toBe(0);
  expect(borderAnimProgress(0.975)).toBeCloseTo(0.5, 6);
  expect(borderAnimProgress(1.0)).toBe(1);
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

/* ── Stage 4: dawn sky choreography ────────────────────────────────────── */

test("sunAltitude: 0->0.35 through flatten, 0.35->1.0 through move+reveal, then holds", () => {
  expect(sunAltitude(0)).toBeCloseTo(0, 6);
  expect(sunAltitude(PHASE_FLATTEN_END)).toBeCloseTo(0.35, 6);
  expect(sunAltitude(WORD_REVEAL_END)).toBeCloseTo(1.0, 6);
  expect(sunAltitude(0.75)).toBeCloseTo(1.0, 6);
  expect(sunAltitude(1)).toBeCloseTo(1.0, 6);
});

test("hazeDensity: full through flatten, thins to 0.45 by reveal, holds through dwell, burns off by gunshot", () => {
  expect(hazeDensity(0)).toBeCloseTo(1.0, 6);
  expect(hazeDensity(PHASE_FLATTEN_END)).toBeCloseTo(1.0, 6);
  expect(hazeDensity(WORD_REVEAL_END)).toBeCloseTo(0.45, 6);
  expect(hazeDensity(DWELL_END)).toBeCloseTo(0.45, 6);
  expect(hazeDensity(GUNSHOT_END)).toBeCloseTo(0.10, 6);
  expect(hazeDensity(0.9)).toBeCloseTo(0.10, 6);
  expect(hazeDensity(1)).toBeCloseTo(0.10, 6);
});

test("skyPresence: full through dwell, 1.0->0.15 through gunshot, 0.15->0 to CONTAINER_START, then exactly 0", () => {
  expect(skyPresence(0)).toBeCloseTo(1.0, 6);
  expect(skyPresence(DWELL_END)).toBeCloseTo(1.0, 6);
  expect(skyPresence(GUNSHOT_END)).toBeCloseTo(0.15, 6);
  expect(skyPresence(CONTAINER_START)).toBe(0);
  for (let p = CONTAINER_START; p <= 1.0001; p += 0.01) {
    expect(skyPresence(p)).toBe(0);
  }
});

test("cloudDrift is monotonically non-decreasing across [0, 1]", () => {
  let prev = -1;
  for (let i = 0; i <= STEPS; i += 1) {
    const v = cloudDrift(at(i));
    expect(v).toBeGreaterThanOrEqual(prev);
    prev = v;
  }
});

test("all four dawn curves stay within [0, 1] and never NaN across the whole scrub", () => {
  for (let i = 0; i <= STEPS; i += 1) {
    for (const f of [sunAltitude, hazeDensity, skyPresence, cloudDrift]) {
      const v = f(at(i));
      expect(Number.isNaN(v)).toBe(false);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  }
});
