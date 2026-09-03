/**
 * "From our practices…" pinned reveal — pure phase math.
 *
 * The section pins, a hysteretic 3-stage machine picks the year from the pin's
 * 0..1 progress, and every stage change fires a spiral `PixelSwap` dissolve.
 * There is no frame resize — only the dissolve + a segmented progress bar. These
 * are the pure functions the component wires to the ScrollTrigger.
 */

import { describe, expect, test } from "vitest";

import {
  PROCESS_PHOTOS,
  PROCESS_PIN_VH,
  SEG_BOUNDS,
  STAGE_1_DOWN,
  STAGE_1_UP,
  STAGE_2_DOWN,
  STAGE_2_UP,
  bgOpacityFor,
  pixelSwapStateFor,
  processStageFor,
  segmentFillFor,
  type ProcessStage,
} from "@/features/home/components/process/processPhases";

describe("PROCESS_PIN_VH", () => {
  test("end formula floor >= 900px across the viewport ladder", () => {
    expect(PROCESS_PIN_VH).toBeGreaterThan(1);
    for (const h of [667, 768, 800, 844, 900, 1024, 1080, 1440, 2160]) {
      expect(h * PROCESS_PIN_VH).toBeGreaterThanOrEqual(900);
    }
  });
});

describe("processStageFor — hysteresis", () => {
  test("advances only at the _UP thresholds", () => {
    expect(processStageFor(STAGE_1_UP - 0.02, 0)).toBe(0);
    expect(processStageFor(STAGE_1_UP, 0)).toBe(1);
    expect(processStageFor(STAGE_2_UP - 0.02, 1)).toBe(1);
    expect(processStageFor(STAGE_2_UP, 1)).toBe(2);
  });

  test("retreats only below the lower _DOWN thresholds", () => {
    expect(processStageFor(STAGE_1_DOWN + 0.02, 1)).toBe(1);
    expect(processStageFor(STAGE_1_DOWN - 0.02, 1)).toBe(0);
    expect(processStageFor(STAGE_2_DOWN + 0.02, 2)).toBe(2);
    expect(processStageFor(STAGE_2_DOWN - 0.02, 2)).toBe(1);
  });

  test("_DOWN thresholds sit below their _UP counterparts (real hysteresis)", () => {
    expect(STAGE_1_DOWN).toBeLessThan(STAGE_1_UP);
    expect(STAGE_2_DOWN).toBeLessThan(STAGE_2_UP);
  });

  test("a fast scroll straight past both _UP thresholds lands on stage 2", () => {
    expect(processStageFor(0.99, 0)).toBe(2);
  });

  test("result is always one of 0 | 1 | 2", () => {
    for (const start of [0, 1, 2] as ProcessStage[]) {
      for (let p = -0.2; p <= 1.2; p += 0.017) {
        expect([0, 1, 2]).toContain(processStageFor(p, start));
      }
    }
  });
});

describe("pixelSwapStateFor", () => {
  test("stage 0: nothing swapped, second layer hidden", () => {
    expect(pixelSwapStateFor(0)).toEqual({
      swap1Active: false,
      swap2Active: false,
      swap2Visible: false,
    });
  });

  test("stage 1: first swap done, second layer painted but not swapped", () => {
    expect(pixelSwapStateFor(1)).toEqual({
      swap1Active: true,
      swap2Active: false,
      swap2Visible: true,
    });
  });

  test("stage 2: both swaps done", () => {
    expect(pixelSwapStateFor(2)).toEqual({
      swap1Active: true,
      swap2Active: true,
      swap2Visible: true,
    });
  });

  test("invariant: swap2Active implies swap1Active", () => {
    for (const stage of [0, 1, 2] as ProcessStage[]) {
      const s = pixelSwapStateFor(stage);
      if (s.swap2Active) expect(s.swap1Active).toBe(true);
    }
  });
});

describe("segmentFillFor", () => {
  test("each segment fills 0 → 1 across its own progress band", () => {
    expect(segmentFillFor(0, 0)).toBe(0);
    expect(segmentFillFor(SEG_BOUNDS[0], 0)).toBe(1);
    expect(segmentFillFor(SEG_BOUNDS[0], 1)).toBe(0);
    expect(segmentFillFor(SEG_BOUNDS[1], 1)).toBe(1);
    expect(segmentFillFor(SEG_BOUNDS[1], 2)).toBe(0);
    expect(segmentFillFor(1, 2)).toBe(1);
  });

  test("a segment is empty before its band and full after", () => {
    expect(segmentFillFor(0.05, 1)).toBe(0);
    expect(segmentFillFor(0.95, 0)).toBe(1);
    expect(segmentFillFor(0.95, 1)).toBe(1);
  });

  test("every fill is within [0, 1] and monotonic in p", () => {
    for (const i of [0, 1, 2] as const) {
      let prev = segmentFillFor(0, i);
      for (let p = 0; p <= 1.0001; p += 0.01) {
        const f = segmentFillFor(p, i);
        expect(f).toBeGreaterThanOrEqual(0);
        expect(f).toBeLessThanOrEqual(1);
        expect(f).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = f;
      }
    }
  });

  test("SEG_BOUNDS are the _UP thresholds so the bar and the dissolves agree", () => {
    expect(SEG_BOUNDS).toEqual([STAGE_1_UP, STAGE_2_UP]);
  });
});

describe("bgOpacityFor", () => {
  test("0 at the top of the pin, 1 once locked, held", () => {
    expect(bgOpacityFor(0)).toBe(0);
    expect(bgOpacityFor(0.035)).toBeCloseTo(1, 5);
    expect(bgOpacityFor(0.5)).toBe(1);
    expect(bgOpacityFor(1)).toBe(1);
  });

  test("monotonic non-decreasing, self-bounded to [0, 1]", () => {
    let prev = bgOpacityFor(0);
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const o = bgOpacityFor(p);
      expect(o).toBeGreaterThanOrEqual(0);
      expect(o).toBeLessThanOrEqual(1);
      expect(o).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = o;
    }
  });
});

describe("PROCESS_PHOTOS", () => {
  test("three entries, positionally keyed, with intrinsic dimensions", () => {
    expect(PROCESS_PHOTOS).toHaveLength(3);
    for (const photo of PROCESS_PHOTOS) {
      expect(photo.src).toMatch(/^\/images\/.+\.(webp|jpe?g|png)$/);
      expect(photo.width).toBeGreaterThan(0);
      expect(photo.height).toBeGreaterThan(0);
    }
  });

  test("alt text keeps the substrings process-diagram.test matches", () => {
    expect(PROCESS_PHOTOS[0]!.alt).toMatch(/2019 .* focused engineering team/i);
    expect(PROCESS_PHOTOS[1]!.alt).toMatch(/2020 to 2025 .* expansion/i);
    expect(PROCESS_PHOTOS[2]!.alt).toMatch(/2026 .* whole company/i);
  });
});
