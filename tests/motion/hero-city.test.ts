/**
 * The dawn-halftone city's pure layers: the plan, the cursor light, the ripple, and
 * the brand mark's raster contract.
 *
 * These are value-level and property-level, never snapshots — a snapshot happily
 * records a regression as the new truth. Where a value encodes a *design* decision
 * (block size, sun direction, the mark's altitude) the test says so, because those
 * are the numbers that must not drift silently.
 */

import { describe, expect, test } from "vitest";

import {
  ALPHA_TIERS,
  AVENUE_SPACING,
  BATCH_COUNT,
  CITY_RAMP,
  DOTS_PER_AXIS,
  DOT_COUNT,
  DOT_COLOUR,
  DOT_DENSITY,
  DOT_HEIGHT,
  DOT_STEP,
  DOT_STOREYS,
  DOT_X,
  DOT_Y,
  DISTRICTS,
  MAX_STOREYS,
  SHADOW_DIR,
  SUN_REACH,
  alphaTier,
  batchIndex,
  blockJitter,
  clamp01,
  districtHeight,
  dotRadius,
  isAvenue,
  latticeIndexRect,
  quantizeStoreys,
  smoothstep01,
  sunAxis,
  tierAlpha,
} from "@/features/hero/heroCity";
import { GRID_CELL, PLANE_SIZE } from "@/features/hero/heroScene";
import {
  CURSOR_RADIUS,
  HIT_TEST_END,
  INTERACT_END,
  LIFT_STRETCH,
  RIPPLE_DURATION_MS,
  VELOCITY_GAIN,
  cursorFalloff,
  easeToward,
  interactStrength,
  rippleCrest,
  skylineStretch,
  smoothVelocity,
  warmthShift,
} from "@/features/hero/heroPointer";
import {
  LOGO_STOREYS,
  getBeaconCount,
  rasteriseLogo,
  resetLogoMask,
} from "@/features/hero/heroLogoMask";

/* ────────────────────────────── The plan ────────────────────────────── */

describe("the lattice", () => {
  test("is commensurate with the old cell grid, so avenues land on cell boundaries", () => {
    expect(DOT_STEP).toBe(GRID_CELL / 2);
    expect(DOTS_PER_AXIS * DOT_STEP).toBe(PLANE_SIZE);
    expect(DOT_COUNT).toBe(DOTS_PER_AXIS * DOTS_PER_AXIS);
  });

  test("every buffer is sized to the lattice", () => {
    for (const buf of [DOT_X, DOT_Y, DOT_HEIGHT, DOT_DENSITY, DOT_STOREYS, DOT_COLOUR]) {
      expect(buf.length).toBe(DOT_COUNT);
    }
  });

  test("positions are the cell centres, in plane space, and finite", () => {
    for (let i = 0; i < DOT_COUNT; i++) {
      const col = i % DOTS_PER_AXIS;
      const row = (i / DOTS_PER_AXIS) | 0;
      expect(DOT_X[i]).toBeCloseTo(col * DOT_STEP + DOT_STEP / 2, 6);
      expect(DOT_Y[i]).toBeCloseTo(row * DOT_STEP + DOT_STEP / 2, 6);
    }
  });

  test("the plan is deterministic — no Math.random anywhere in the massing", () => {
    // `blockJitter` is the only source of variation, and it is a pure integer hash.
    // Same input, same output, every load: a screenshot diff means the design moved.
    for (const [c, r] of [[0, 0], [7, 3], [21, 21], [43, 43], [12, 30]] as const) {
      expect(blockJitter(c, r)).toBe(blockJitter(c, r));
      expect(blockJitter(c, r)).toBeGreaterThanOrEqual(-1);
      expect(blockJitter(c, r)).toBeLessThanOrEqual(1);
      expect(Number.isNaN(blockJitter(c, r))).toBe(false);
    }
  });

  test("a whole block shares one jitter value — a block is a building, not noise", () => {
    for (let d = 1; d < AVENUE_SPACING; d++) {
      expect(blockJitter(4 + d, 8)).toBe(blockJitter(4, 8));
      expect(blockJitter(4, 8 + d)).toBe(blockJitter(4, 8));
    }
  });
});

describe("the street grid", () => {
  test("avenues are at ground level by definition", () => {
    for (let row = 0; row < DOTS_PER_AXIS; row++) {
      for (let col = 0; col < DOTS_PER_AXIS; col++) {
        if (!isAvenue(col, row)) continue;
        expect(DOT_STOREYS[row * DOTS_PER_AXIS + col]).toBe(0);
      }
    }
  });

  test("blocks are AVENUE_SPACING - 1 cells square, which is the composition control", () => {
    // At 7 the blocks merged into a solid dome; at 4 they read as separated towers.
    expect(AVENUE_SPACING).toBe(4);
    let run = 0;
    let maxRun = 0;
    for (let col = 0; col < DOTS_PER_AXIS; col++) {
      run = isAvenue(col, 1) ? 0 : run + 1;
      if (run > maxRun) maxRun = run;
    }
    expect(maxRun).toBe(AVENUE_SPACING - 1);
  });
});

describe("massing", () => {
  test("heights are whole storeys inside the scale", () => {
    for (let i = 0; i < DOT_COUNT; i++) {
      const n = DOT_STOREYS[i]!;
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(MAX_STOREYS);
      expect(DOT_HEIGHT[i]).toBeCloseTo(n / MAX_STOREYS, 6);
    }
  });

  test("the city is mostly sky — a skyline is not a carpet", () => {
    let built = 0;
    for (let i = 0; i < DOT_COUNT; i++) if (DOT_STOREYS[i]! > 0) built++;
    const ratio = built / DOT_COUNT;
    expect(ratio).toBeGreaterThan(0.1);
    expect(ratio).toBeLessThan(0.5);
  });

  test("every district's peak leaves the scale's ceiling to the brand mark", () => {
    for (const d of DISTRICTS) {
      expect(d.peak).toBeLessThan(1);
      expect(d.peak).toBeGreaterThan(0);
    }
  });

  test("districtHeight is zero outside its footprint, for every profile", () => {
    for (const d of DISTRICTS) {
      expect(districtHeight(d, d.cx + d.rx + 1, d.cy)).toBe(0);
      expect(districtHeight(d, d.cx, d.cy + d.ry + 1)).toBe(0);
      expect(districtHeight(d, -50, -50)).toBe(0);
    }
  });

  test("districtHeight never exceeds its peak and is never NaN", () => {
    for (const d of DISTRICTS) {
      for (let col = 0; col < DOTS_PER_AXIS; col++) {
        for (let row = 0; row < DOTS_PER_AXIS; row++) {
          const h = districtHeight(d, col, row);
          expect(Number.isNaN(h)).toBe(false);
          expect(h).toBeGreaterThanOrEqual(0);
          expect(h).toBeLessThanOrEqual(d.peak + 1e-9);
        }
      }
    }
  });

  test("quantizeStoreys snaps to whole storeys and never overflows the scale", () => {
    expect(quantizeStoreys(0)).toBe(0);
    expect(quantizeStoreys(-1)).toBe(0);
    expect(quantizeStoreys(1)).toBe(MAX_STOREYS);
    expect(quantizeStoreys(5)).toBe(MAX_STOREYS);
    for (let t = 0; t <= 1; t += 0.01) {
      const n = quantizeStoreys(t);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeLessThanOrEqual(MAX_STOREYS);
    }
  });

  test("a built cell always survives the density mask", () => {
    // Thinning may open the ground between buildings; it may never punch holes in
    // one, or a district's silhouette stops being readable.
    for (let i = 0; i < DOT_COUNT; i++) {
      // `DOT_DENSITY` is a Float32Array, so 0.9 round-trips as 0.89999997.
      if (DOT_STOREYS[i]! > 0) expect(DOT_DENSITY[i]).toBeGreaterThan(0.89);
    }
  });
});

/* ────────────────────────────── The dawn light ────────────────────────────── */

describe("the dawn sun", () => {
  test("is directional: one unit vector, not a point light", () => {
    expect(Math.hypot(SHADOW_DIR.x, SHADOW_DIR.y)).toBeCloseTo(1, 9);
  });

  test("throws every shadow toward screen-right, away from the sun", () => {
    // The camera rotates the plane -45deg about Z, so screen-x is proportional to
    // (x + y). A shadow direction with both components positive therefore moves
    // every shadow rightward across the frame, whatever cell casts it.
    expect(SHADOW_DIR.x).toBeGreaterThan(0);
    expect(SHADOW_DIR.y).toBeGreaterThan(0);
    for (let i = 0; i < DOT_COUNT; i += 37) {
      const before = sunAxis(DOT_X[i]!, DOT_Y[i]!);
      const after = sunAxis(DOT_X[i]! + SHADOW_DIR.x * 50, DOT_Y[i]! + SHADOW_DIR.y * 50);
      expect(after).toBeGreaterThan(before);
    }
  });

  test("sunAxis runs 0 at the screen-left corner to 1 at the screen-right", () => {
    expect(sunAxis(0, 0)).toBeCloseTo(0, 9);
    expect(sunAxis(PLANE_SIZE, PLANE_SIZE)).toBeCloseTo(1, 9);
  });

  test("warmth reaches across the whole visible city, not just its left corner", () => {
    // At 0.66 every visible building sat in the two coolest ramp steps and the
    // dawn read as something happening beside the city rather than to it.
    expect(SUN_REACH).toBeGreaterThan(0.8);
  });

  test("the colour ramp is walked end to end by the plan", () => {
    const seen = new Set<number>();
    for (let i = 0; i < DOT_COUNT; i++) seen.add(DOT_COLOUR[i]!);
    expect(seen.size).toBe(CITY_RAMP.length);
    for (const c of seen) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(CITY_RAMP.length);
    }
  });

  test("no ramp step is opaque — dots are atmosphere, not interface", () => {
    for (const step of CITY_RAMP) {
      const peak = tierAlpha(ALPHA_TIERS - 1) * step.alphaScale;
      expect(peak).toBeLessThan(0.8);
      expect(peak).toBeGreaterThan(0.2);
    }
  });
});

describe("batching", () => {
  test("every (colour, tier) pair maps to a distinct slot inside BATCH_COUNT", () => {
    const seen = new Set<number>();
    for (let c = 0; c < CITY_RAMP.length; c++) {
      for (let t = 0; t < ALPHA_TIERS; t++) {
        const b = batchIndex(c, t);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThan(BATCH_COUNT);
        seen.add(b);
      }
    }
    expect(seen.size).toBe(BATCH_COUNT);
  });

  test("alphaTier stays inside the tier range for any input", () => {
    for (const h of [-1, 0, 0.5, 1, 2, Number.MAX_SAFE_INTEGER]) {
      const t = alphaTier(h);
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThan(ALPHA_TIERS);
    }
  });

  test("dot radius grows with height — scale is the depth cue on a white ground", () => {
    expect(dotRadius(1)).toBeGreaterThan(dotRadius(0.5));
    expect(dotRadius(0.5)).toBeGreaterThan(dotRadius(0));
    expect(dotRadius(1) / dotRadius(0)).toBeGreaterThan(3);
  });
});

/* ─────────────────────── The bounded cursor query ─────────────────────── */

describe("latticeIndexRect", () => {
  const out = new Int32Array(4);

  test("returns only cells that can possibly be within the radius", () => {
    const px = 400;
    const py = 380;
    const radius = CURSOR_RADIUS;
    expect(latticeIndexRect(px, py, radius, out)).toBe(true);
    // Nothing outside the returned rectangle is within the radius.
    for (let row = 0; row < DOTS_PER_AXIS; row++) {
      for (let col = 0; col < DOTS_PER_AXIS; col++) {
        const inside = col >= out[0]! && col <= out[1]! && row >= out[2]! && row <= out[3]!;
        if (inside) continue;
        const i = row * DOTS_PER_AXIS + col;
        expect(Math.hypot(DOT_X[i]! - px, DOT_Y[i]! - py)).toBeGreaterThan(radius);
      }
    }
  });

  test("covers every cell that IS within the radius", () => {
    const px = 300;
    const py = 700;
    expect(latticeIndexRect(px, py, CURSOR_RADIUS, out)).toBe(true);
    for (let row = 0; row < DOTS_PER_AXIS; row++) {
      for (let col = 0; col < DOTS_PER_AXIS; col++) {
        const i = row * DOTS_PER_AXIS + col;
        if (Math.hypot(DOT_X[i]! - px, DOT_Y[i]! - py) > CURSOR_RADIUS) continue;
        expect(col).toBeGreaterThanOrEqual(out[0]!);
        expect(col).toBeLessThanOrEqual(out[1]!);
        expect(row).toBeGreaterThanOrEqual(out[2]!);
        expect(row).toBeLessThanOrEqual(out[3]!);
      }
    }
  });

  test("is O(1) in the size of the city, not O(n)", () => {
    // The whole point: the cursor touches a bounded neighbourhood whose size is set
    // by the radius and the pitch, never by how many dots exist.
    expect(latticeIndexRect(PLANE_SIZE / 2, PLANE_SIZE / 2, CURSOR_RADIUS, out)).toBe(true);
    const touched = (out[1]! - out[0]! + 1) * (out[3]! - out[2]! + 1);
    expect(touched).toBeLessThan(DOT_COUNT / 3);
    const expected = Math.pow((2 * CURSOR_RADIUS) / DOT_STEP, 2);
    expect(touched).toBeLessThan(expected * 1.3);
  });

  test("clamps to the lattice and misses cleanly when the cursor is off it", () => {
    expect(latticeIndexRect(-9000, -9000, 10, out)).toBe(false);
    expect(latticeIndexRect(PLANE_SIZE + 9000, 0, 10, out)).toBe(false);
    expect(latticeIndexRect(0, 0, CURSOR_RADIUS, out)).toBe(true);
    expect(out[0]).toBeGreaterThanOrEqual(0);
    expect(out[2]).toBeGreaterThanOrEqual(0);
    expect(out[1]).toBeLessThan(DOTS_PER_AXIS);
    expect(out[3]).toBeLessThan(DOTS_PER_AXIS);
  });

  test("allocates nothing — it writes into a caller-owned buffer", () => {
    const buf = new Int32Array(4);
    const before = buf.buffer;
    for (let i = 0; i < 500; i++) latticeIndexRect(i, i * 2, CURSOR_RADIUS, buf);
    expect(buf.buffer).toBe(before);
  });
});

/* ─────────────────────── The cursor as a second light ─────────────────────── */

describe("the cursor light", () => {
  test("is 1 at the cursor, 0 at and beyond the radius, monotone between", () => {
    expect(cursorFalloff(0, 0, CURSOR_RADIUS)).toBe(1);
    expect(cursorFalloff(CURSOR_RADIUS, 0, CURSOR_RADIUS)).toBe(0);
    expect(cursorFalloff(CURSOR_RADIUS * 3, 0, CURSOR_RADIUS)).toBe(0);
    let prev = Infinity;
    for (let d = 0; d <= CURSOR_RADIUS; d += CURSOR_RADIUS / 40) {
      const f = cursorFalloff(d, 0, CURSOR_RADIUS);
      expect(Number.isNaN(f)).toBe(false);
      expect(f).toBeLessThanOrEqual(prev + 1e-12);
      prev = f;
    }
  });

  test("is radially symmetric and degenerate-radius safe", () => {
    const a = cursorFalloff(30, 40, CURSOR_RADIUS);
    expect(cursorFalloff(-30, 40, CURSOR_RADIUS)).toBeCloseTo(a, 12);
    expect(cursorFalloff(40, 30, CURSOR_RADIUS)).toBeCloseTo(a, 12);
    expect(cursorFalloff(0, 0, 0)).toBe(0);
  });

  test("pointer speed scales the lift but never gates it off entirely", () => {
    const still = skylineStretch(1, 1, 0);
    const sweeping = skylineStretch(1, 1, 1);
    expect(sweeping).toBeCloseTo(LIFT_STRETCH, 9);
    expect(still).toBeCloseTo(LIFT_STRETCH * (1 - VELOCITY_GAIN), 9);
    // A motionless cursor still lights the city — the effect must not require
    // motion to exist, only to peak.
    expect(still).toBeGreaterThan(0);
    expect(sweeping).toBeGreaterThan(still);
  });

  test("stretch is zero wherever the light does not reach, or the scroll has faded it", () => {
    expect(skylineStretch(0, 1, 1)).toBe(0);
    expect(skylineStretch(1, 0, 1)).toBe(0);
    for (const [f, s, v] of [[-1, 5, 9], [2, -1, -3], [0.5, 0.5, 12]] as const) {
      const out = skylineStretch(f, s, v);
      expect(Number.isNaN(out)).toBe(false);
      expect(out).toBeGreaterThanOrEqual(0);
      expect(out).toBeLessThanOrEqual(LIFT_STRETCH);
    }
  });

  test("warmth shifts by whole ramp steps, so a lit dot reuses an existing batch", () => {
    for (let f = 0; f <= 1; f += 0.05) {
      const shift = warmthShift(f, 1);
      expect(Number.isInteger(shift)).toBe(true);
      expect(shift).toBeGreaterThanOrEqual(0);
      expect(shift).toBeLessThan(CITY_RAMP.length);
    }
    expect(warmthShift(0, 1)).toBe(0);
    expect(warmthShift(1, 0)).toBe(0);
  });

  test("smoothed velocity is clamped and converges", () => {
    let v = 0;
    for (let i = 0; i < 400; i++) v = smoothVelocity(v, 10_000);
    expect(v).toBeGreaterThan(0.95);
    expect(v).toBeLessThanOrEqual(1);
    for (let i = 0; i < 400; i++) v = smoothVelocity(v, 0);
    expect(v).toBeLessThan(0.05);
    expect(v).toBeGreaterThanOrEqual(0);
  });

  test("easeToward is monotone toward its target from both directions", () => {
    let up = 0;
    let down = 1;
    for (let i = 0; i < 60; i++) {
      const nextUp = easeToward(up, 1, 0.12);
      const nextDown = easeToward(down, 0, 0.12);
      expect(nextUp).toBeGreaterThanOrEqual(up);
      expect(nextDown).toBeLessThanOrEqual(down);
      up = nextUp;
      down = nextDown;
    }
    expect(up).toBeGreaterThan(0.99);
    expect(down).toBeLessThan(0.01);
  });
});

describe("the interaction gate", () => {
  test("INTERACT_END is derived from the flatten phase, not restated", () => {
    expect(INTERACT_END).toBeGreaterThan(0);
    expect(HIT_TEST_END).toBeLessThan(INTERACT_END);
  });

  test("is exactly 1 at rest and exactly 0 at the end, with no cliff between", () => {
    expect(interactStrength(0)).toBe(1);
    expect(interactStrength(INTERACT_END)).toBe(0);
    let prev = 1;
    for (let p = 0; p <= INTERACT_END; p += INTERACT_END / 200) {
      const s = interactStrength(p);
      expect(Number.isNaN(s)).toBe(false);
      expect(s).toBeLessThanOrEqual(prev + 1e-12);
      expect(prev - s).toBeLessThan(0.05); // no snap
      prev = s;
    }
  });

  test("clamps outside its range", () => {
    expect(interactStrength(-5)).toBe(1);
    expect(interactStrength(99)).toBe(0);
  });
});

describe("the click ripple", () => {
  test("is silent before the click and after it expires", () => {
    expect(rippleCrest(100, -1)).toBe(0);
    expect(rippleCrest(100, RIPPLE_DURATION_MS)).toBe(0);
    expect(rippleCrest(100, RIPPLE_DURATION_MS * 2)).toBe(0);
  });

  test("travels outward: the crest is at a larger radius as the wave ages", () => {
    const peakAt = (age: number) => {
      let best = -1;
      let bestVal = -1;
      for (let d = 0; d < 2000; d += 5) {
        const v = rippleCrest(d, age);
        if (v > bestVal) {
          bestVal = v;
          best = d;
        }
      }
      return best;
    };
    expect(peakAt(400)).toBeGreaterThan(peakAt(150));
    expect(peakAt(800)).toBeGreaterThan(peakAt(400));
  });

  test("decays over its lifetime rather than vanishing mid-travel", () => {
    const early = rippleCrest(150 * 0.9, 150);
    const late = rippleCrest(1200 * 0.9, 1200);
    expect(early).toBeGreaterThan(0);
    expect(late).toBeGreaterThanOrEqual(0);
    expect(late).toBeLessThan(early);
  });

  test("is a pure function — no queue, nothing to cancel, never NaN", () => {
    for (const [d, a] of [[0, 0], [-5, 10], [1e9, 10], [0, 1e9]] as const) {
      const v = rippleCrest(d, a);
      expect(Number.isNaN(v)).toBe(false);
      expect(v).toBeGreaterThanOrEqual(0);
    }
    expect(rippleCrest(300, 400)).toBe(rippleCrest(300, 400));
  });
});

/* ────────────────────────────── The brand mark ────────────────────────────── */

describe("the P mark", () => {
  test("hangs at a single, uniform altitude — the reason it stays legible", () => {
    // A mark made of varying heights is smeared vertically by projection. Equal
    // altitude turns that smear into a rigid translation, and the letterform
    // survives. This constant is the design decision, not a tuning value.
    expect(Number.isInteger(LOGO_STOREYS)).toBe(true);
    expect(LOGO_STOREYS).toBeGreaterThan(MAX_STOREYS / 2);
  });

  test("the null-2D-context contract: jsdom must not throw, and yields no mark", () => {
    // jsdom's getContext("2d") returns null. An empty mask is a valid state — it is
    // also the state on every real page load until the SVG decodes.
    resetLogoMask();
    const stub = document.createElement("canvas");
    expect(() => rasteriseLogo(stub)).not.toThrow();
    expect(getBeaconCount()).toBe(0);
  });

  test("a failed decode leaves a city without its mark, not a broken scene", () => {
    resetLogoMask();
    expect(getBeaconCount()).toBe(0);
  });
});

/* ────────────────────────────── Shared math ────────────────────────────── */

describe("shared primitives", () => {
  test("clamp01", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(2)).toBe(1);
  });

  test("smoothstep01 is clamped, symmetric about its midpoint, and monotone", () => {
    expect(smoothstep01(-1)).toBe(0);
    expect(smoothstep01(0)).toBe(0);
    expect(smoothstep01(0.5)).toBeCloseTo(0.5, 9);
    expect(smoothstep01(1)).toBe(1);
    expect(smoothstep01(5)).toBe(1);
    for (let t = 0; t <= 1; t += 0.05) {
      expect(smoothstep01(t) + smoothstep01(1 - t)).toBeCloseTo(1, 9);
    }
  });
});
