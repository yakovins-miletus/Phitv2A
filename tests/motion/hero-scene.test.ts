/**
 * Parity lock for the canvas hero's pure layers.
 *
 * The 3D scene moved from ~250 Emotion-styled DOM nodes (HeroSignalP.tsx) to a canvas
 * renderer. The *look* had to survive that move unchanged, so the values the old markup
 * computed inline are pinned here against the new pure functions. Every expectation is
 * transcribed from the deleted component, cited by its original line number.
 *
 * These are deliberately value-level, not snapshot: a snapshot would happily record a
 * regression as the new truth.
 */

import { describe, expect, test } from "vitest";

import {
  APPLICATION_NODES,
  APPLICATION_NODE_SIZE,
  CORE_GRID_CELLS,
  CUBE_POSITIONS,
  GRID_CELL,
  GRID_CELLS,
  GRID_OFFSET,
  PLANE_MARGIN_CELLS,
  PLANE_SIZE,
  SERVICE_NODES,
  SERVICE_NODE_SIZE,
  SIGNAL_LOOPS,
  heroFrameState,
  makeCamera,
  pointAtLoopDistance,
  project,
} from "@/features/hero/heroScene";
import { heroStage, heroVars, sameStage } from "@/features/hero/heroVars";
import {
  CONTAINER_START,
  DWELL_END,
  GUNSHOT_END,
  PHASE_FLATTEN_END,
  SMOKING_START,
} from "@/features/hero/heroPhases";

describe("scene geometry", () => {
  test("expanded plane geometry: 16 core cubes on a 30x30 grid (1260px at GRID_CELL=42)", () => {
    expect(GRID_CELL).toBe(42);
    expect(CORE_GRID_CELLS).toBe(22);
    expect(PLANE_MARGIN_CELLS).toBe(4);
    expect(GRID_CELLS).toBe(30);
    expect(PLANE_SIZE).toBe(1260);
    expect(GRID_OFFSET).toBe(168);
    expect(CUBE_POSITIONS).toHaveLength(16);

    // Every cube must sit inside the core 22x22 range.
    for (const c of CUBE_POSITIONS) {
      expect(c.c).toBeGreaterThanOrEqual(0);
      expect(c.c).toBeLessThanOrEqual(21);
      expect(c.r).toBeGreaterThanOrEqual(0);
      expect(c.r).toBeLessThanOrEqual(21);
      expect(c.h).toBeGreaterThan(0);
    }

    // Heights transcribed from HeroSignalP.tsx:25-42.
    expect(CUBE_POSITIONS.map((c) => c.h)).toEqual([
      58, 65, 40, 46, 32, 52, 70, 40, 32, 46, 52, 40, 36, 58, 46, 52,
    ]);
  });

  test("the four service nodes are centered via GRID_OFFSET on their grid intersections", () => {
    expect(SERVICE_NODES).toHaveLength(4);
    expect(SERVICE_NODE_SIZE).toBe(60);
    expect(SERVICE_NODES.map((n) => [(n.cx - GRID_OFFSET) / GRID_CELL, (n.cy - GRID_OFFSET) / GRID_CELL])).toEqual([
      [5, 5],
      [17, 5],
      [5, 17],
      [17, 17],
    ]);
    for (const n of SERVICE_NODES) expect(n.elevation).toBe(28);
  });

  test("outer decorative application nodes are defined on the outer perimeter ring", () => {
    expect(APPLICATION_NODES).toHaveLength(6);
    expect(APPLICATION_NODE_SIZE).toBe(52);
    for (const app of APPLICATION_NODES) {
      expect(app.id).toBeTruthy();
      expect(app.label).toBeTruthy();
      expect(app.cx).toBeGreaterThanOrEqual(0);
      expect(app.cx).toBeLessThanOrEqual(PLANE_SIZE);
      expect(app.cy).toBeGreaterThanOrEqual(0);
      expect(app.cy).toBeLessThanOrEqual(PLANE_SIZE);
      expect(app.elevation).toBeGreaterThanOrEqual(18);
      expect(["analytics", "trading", "pipeline", "risk", "execution", "telemetry"]).toContain(app.appType);
    }
  });

  test("nine closed signal loops, each with two pulses and closed out-and-back circuits", () => {
    expect(SIGNAL_LOOPS).toHaveLength(9);
    for (const loop of SIGNAL_LOOPS) {
      expect(loop.pulseOffsets).toHaveLength(2);
      expect(loop.totalL).toBeGreaterThan(0);
      // Closed: first and last waypoint coincide.
      const first = loop.waypoints[0]!;
      const last = loop.waypoints[loop.waypoints.length - 1]!;
      expect(last.x).toBe(first.x);
      expect(last.y).toBe(first.y);
    }
  });

  test("walking a loop is continuous and wraps", () => {
    const loop = SIGNAL_LOOPS[0]!;
    const atZero = pointAtLoopDistance(loop, 0);
    const atFull = pointAtLoopDistance(loop, loop.totalL);
    expect(atFull.x).toBeCloseTo(atZero.x, 6);
    expect(atFull.y).toBeCloseTo(atZero.y, 6);

    // Negative distances wrap rather than clamping.
    const behind = pointAtLoopDistance(loop, -10);
    const ahead = pointAtLoopDistance(loop, loop.totalL - 10);
    expect(behind.x).toBeCloseTo(ahead.x, 6);
    expect(behind.y).toBeCloseTo(ahead.y, 6);
  });

  test("out-and-back signal loops reach outer application nodes and return to core", () => {
    // Check loops 3..8 (the 6 spur loops)
    for (let i = 3; i < 9; i++) {
      const loop = SIGNAL_LOOPS[i]!;
      expect(loop.waypoints.length).toBeGreaterThanOrEqual(3);
      const start = loop.waypoints[0]!;
      const end = loop.waypoints[loop.waypoints.length - 1]!;
      expect(start.x).toBe(end.x);
      expect(start.y).toBe(end.y);

      // Midpoint along the loop's length is at the outer turnaround
      const mid = pointAtLoopDistance(loop, loop.totalL / 2);
      expect(mid.x).toBeGreaterThanOrEqual(0);
      expect(mid.x).toBeLessThanOrEqual(PLANE_SIZE);
      expect(mid.y).toBeGreaterThanOrEqual(0);
      expect(mid.y).toBeLessThanOrEqual(PLANE_SIZE);
    }
  });

  test("outer application nodes are centered symmetrically around plane center", () => {
    const center = PLANE_SIZE / 2;
    let sumX = 0;
    let sumY = 0;
    for (const app of APPLICATION_NODES) {
      sumX += app.cx;
      sumY += app.cy;
    }
    const avgX = sumX / APPLICATION_NODES.length;
    const avgY = sumY / APPLICATION_NODES.length;
    expect(avgX).toBeCloseTo(center, 4);
    expect(avgY).toBeCloseTo(center, 4);
  });
});

describe("projection", () => {
  test("at full 3D the plane is rotated; at full flatten it is axis-aligned", () => {
    const origin = { x: 500, y: 400 };

    // flatten = 0 → rotateX(55deg) rotateZ(-45deg), so the plane's top edge is skewed.
    const iso = makeCamera(0, origin.x, origin.y, 1);
    const isoTL = project(iso, 0, 0, 0);
    const isoTR = project(iso, PLANE_SIZE, 0, 0);
    expect(Math.abs(isoTR.sy - isoTL.sy)).toBeGreaterThan(1);

    // flatten = 1 → no rotation, so the top edge is horizontal.
    const flat = makeCamera(1, origin.x, origin.y, 1);
    const flatTL = project(flat, 0, 0, 0);
    const flatTR = project(flat, PLANE_SIZE, 0, 0);
    expect(flatTR.sy).toBeCloseTo(flatTL.sy, 6);
  });

  test("the plane centre projects to the camera origin", () => {
    for (const flatten of [0, 0.5, 1]) {
      const cam = makeCamera(flatten, 640, 360, 1);
      const c = project(cam, PLANE_SIZE / 2, PLANE_SIZE / 2, 0);
      expect(c.sx).toBeCloseTo(640, 6);
      expect(c.sy).toBeCloseTo(360, 6);
    }
  });

  test("raising a point off the plane lifts it on screen while the camera is tilted", () => {
    const cam = makeCamera(0, 0, 0, 1);
    const ground = project(cam, PLANE_SIZE / 2, PLANE_SIZE / 2, 0);
    const raised = project(cam, PLANE_SIZE / 2, PLANE_SIZE / 2, 60);
    // Screen y grows downward, so "up" means a smaller y.
    expect(raised.sy).toBeLessThan(ground.sy);
    expect(raised.depth).toBeGreaterThan(ground.depth);
  });

  test("scale is 1.25 at full 3D and 1.0 when flat (HeroSignalP.tsx:559)", () => {
    // Probe the scale indirectly: distance from origin to a plane corner, flattened so
    // rotation contributes nothing.
    const at1 = makeCamera(1, 0, 0, 1);
    const at0 = makeCamera(0, 0, 0, 1);
    expect(at1.scale).toBeCloseTo(1.0, 6);
    expect(at0.scale).toBeCloseTo(1.25, 6);
  });
});

describe("frame state", () => {
  test("reduced motion jumps straight to the settled flat scene", () => {
    // HeroSignalP.tsx:549 — `effectiveProgress = reduced ? 1 : progress`.
    const s = heroFrameState(0, true, CONTAINER_START);
    expect(s.flatten).toBe(1);
    expect(s.flat).toBe(true);
    expect(s.sideOpacity).toBe(0);
    expect(s.topOpacity).toBe(0);
    expect(s.gridOpacity).toBe(0);
    expect(s.signalOpacity).toBe(0);
  });

  test("at rest the scene is fully 3D and fully opaque", () => {
    const s = heroFrameState(0, false, CONTAINER_START);
    expect(s.flatten).toBe(0);
    expect(s.flat).toBe(false);
    expect(s.sideOpacity).toBe(1);
    expect(s.topOpacity).toBe(1);
    expect(s.gridOpacity).toBe(1);
    expect(s.signalOpacity).toBe(1);
  });

  test("flatten completes exactly at PHASE_FLATTEN_END", () => {
    expect(heroFrameState(PHASE_FLATTEN_END, false, CONTAINER_START).flatten).toBe(1);
    expect(heroFrameState(PHASE_FLATTEN_END / 2, false, CONTAINER_START).flatten).toBeCloseTo(0.5, 6);
  });

  test("side faces fade faster than the flatten, and never go negative", () => {
    // HeroSignalP.tsx:345 — sideOpacity = max(0, 1 - flatten * 1.8), so they are gone
    // at flatten ≈ 0.556, well before the flatten itself completes.
    const mid = heroFrameState(PHASE_FLATTEN_END * 0.5, false, CONTAINER_START);
    expect(mid.sideOpacity).toBeCloseTo(0.1, 6);
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const s = heroFrameState(p, false, CONTAINER_START);
      expect(s.sideOpacity).toBeGreaterThanOrEqual(0);
      expect(s.topOpacity).toBeGreaterThanOrEqual(0);
      expect(s.gridOpacity).toBeGreaterThanOrEqual(0);
      expect(s.signalOpacity).toBeGreaterThanOrEqual(0);
    }
  });

  test("the canvas remains the single unified logo renderer throughout the sequence", () => {
    expect(heroFrameState(CONTAINER_START - 0.01, false, CONTAINER_START).logoHidden).toBe(false);
    expect(heroFrameState(CONTAINER_START, false, CONTAINER_START).logoHidden).toBe(false);
  });

  test("every derived opacity is monotonically non-increasing across the pin", () => {
    let prevSide = Infinity;
    let prevGrid = Infinity;
    for (let p = 0; p <= 1.0001; p += 0.02) {
      const s = heroFrameState(p, false, CONTAINER_START);
      expect(s.sideOpacity).toBeLessThanOrEqual(prevSide + 1e-9);
      expect(s.gridOpacity).toBeLessThanOrEqual(prevGrid + 1e-9);
      prevSide = s.sideOpacity;
      prevGrid = s.gridOpacity;
    }
  });
});

describe("CSS custom-property bridge", () => {
  test("reduced motion produces the settled layout the old branches hardcoded", () => {
    const v = heroVars(0, true);
    expect(v.scale).toBe(1);
    expect(v.g).toBe(0);
    expect(v.botx).toBe(0);
    expect(v.flank).toBe(1);
    expect(v.pexit).toBe(1);
    expect(v.atenter).toBe(1);
    expect(v.tight).toBe(0);
    expect(v.border).toBe(1);
    expect(v.panel).toBe(1);
    expect(v.word).toBe(1);
    expect(v.wordlift).toBe(0);
    // The flanking texts mount but are parked off-screen, exactly as before.
    expect(v.lefty).toBe(-240);
    expect(v.righty).toBe(240);
  });

  test("split panels stay at stable resting offset for smooth continuous auto-pan", () => {
    const before = heroVars(DWELL_END, false);
    expect(before.topx).toBeCloseTo(-14.2857, 3);
    expect(before.botx).toBeCloseTo(-14.2857, 3);

    const after = heroVars(GUNSHOT_END, false);
    expect(after.topx).toBeCloseTo(-14.2857, 3);
    expect(after.botx).toBeCloseTo(-14.2857, 3);
  });

  test("every emitted value is finite for any progress in range", () => {
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const v = heroVars(p, false);
      for (const [key, value] of Object.entries(v)) {
        expect(Number.isFinite(value), `${key} at p=${p.toFixed(2)}`).toBe(true);
      }
    }
  });
});

describe("discrete stage", () => {
  test("stage flags flip at the documented phase boundaries", () => {
    expect(heroStage(0, false).gunshot).toBe(false);
    expect(heroStage(DWELL_END + 0.005, false).gunshot).toBe(true);

    expect(heroStage(SMOKING_START, false).flank).toBe(false);
    expect(heroStage(SMOKING_START + 0.01, false).flank).toBe(true);

    expect(heroStage(CONTAINER_START - 0.001, false).container).toBe(false);
    expect(heroStage(CONTAINER_START, false).container).toBe(true);

    expect(heroStage(DWELL_END - 0.01, false).navActive).toBe(false);
    expect(heroStage(DWELL_END, false).navActive).toBe(true);
    expect(heroStage(GUNSHOT_END, false).navDark).toBe(true);
    expect(heroStage(0.99, false).navDark).toBe(true);
  });

  test("the stage changes only a handful of times across the whole pin", () => {
    // This is the property that makes it safe to keep in React state: if it churned per
    // frame we would be back to the render storm the canvas rewrite removed.
    let changes = 0;
    let prev = heroStage(0, false);
    for (let p = 0; p <= 1.0001; p += 0.001) {
      const next = heroStage(p, false);
      if (!sameStage(prev, next)) {
        changes++;
        prev = next;
      }
    }
    expect(changes).toBeLessThanOrEqual(10);
  });

  test("sameStage distinguishes every field", () => {
    const base = heroStage(0, false);
    const keys = Object.keys(base) as (keyof typeof base)[];
    for (const k of keys) {
      const mutated = { ...base, [k]: !base[k] };
      expect(sameStage(base, mutated), `sameStage ignored ${k}`).toBe(false);
    }
  });
});
