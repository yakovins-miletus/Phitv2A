/**
 * Empirical Challenge & Stress Suite for B4 Hero Outer Application Nodes.
 *
 * Authored by Challenger 1 (Empirical Challenger) to stress-test:
 * 1. Exact coordinate symmetry around (630, 630) for core grid, service nodes, and outer application nodes.
 * 2. 2D projection bounds and screen-space containment across desktop (1440x900) and mobile (390x844).
 * 3. Out-and-back loop continuity, cyclic wrapping, extreme distances, and Lipschitz continuity.
 * 4. Flatten / scroll progression invariants and reduced-motion static frame guarantees.
 */

import { describe, expect, test } from "vitest";

import {
  APPLICATION_NODES,
  APPLICATION_NODE_SIZE,
  CUBE_POSITIONS,
  GRID_CELL,
  GRID_CELLS,
  GRID_OFFSET,
  PLANE_SIZE,
  SERVICE_NODES,
  SERVICE_NODE_SIZE,
  SIGNAL_LOOPS,
  heroFrameState,
  makeCamera,
  pointAtLoopDistance,
  project,
} from "@/features/hero/heroScene";
import {
  HORIZON,
  VIEW_FIT,
  VIEW_FIT_X,
  VIEW_FIT_Y,
  calcViewScale,
} from "@/features/hero/heroPlaneRenderer";

describe("Empirical Challenge: 1. Coordinate Symmetry & Center of Mass", () => {
  const CENTER = 630; // PLANE_SIZE / 2 = 1260 / 2

  test("expanded plane geometry matches 30x30 cells (1260px) and center is exactly 630px", () => {
    expect(GRID_CELLS * GRID_CELL).toBe(PLANE_SIZE);
    expect(PLANE_SIZE).toBe(1260);
    expect(PLANE_SIZE / 2).toBe(CENTER);
    expect(GRID_OFFSET).toBe(168);
  });

  test("grid midpoint (c=10.5, r=10.5) maps to exact center (630, 630)", () => {
    const midX = 10.5 * GRID_CELL + GRID_OFFSET + GRID_CELL / 2;
    const midY = 10.5 * GRID_CELL + GRID_OFFSET + GRID_CELL / 2;
    expect(midX).toBe(CENTER);
    expect(midY).toBe(CENTER);
  });

  test("center of mass of the 4 service nodes is exactly (630, 630)", () => {
    let sumX = 0;
    let sumY = 0;
    for (const node of SERVICE_NODES) {
      sumX += node.cx;
      sumY += node.cy;
    }
    const comX = sumX / SERVICE_NODES.length;
    const comY = sumY / SERVICE_NODES.length;

    expect(comX).toBeCloseTo(CENTER, 5);
    expect(comY).toBeCloseTo(CENTER, 5);
  });

  test("center of mass of the 6 outer application nodes is exactly (630, 630)", () => {
    let sumX = 0;
    let sumY = 0;
    for (const node of APPLICATION_NODES) {
      sumX += node.cx;
      sumY += node.cy;
    }
    const comX = sumX / APPLICATION_NODES.length;
    const comY = sumY / APPLICATION_NODES.length;

    expect(comX).toBeCloseTo(CENTER, 5);
    expect(comY).toBeCloseTo(CENTER, 5);
  });

  test("empirical center of mass of 16 legacy core cubes", () => {
    let sumX = 0;
    let sumY = 0;
    for (const cube of CUBE_POSITIONS) {
      const cx = cube.c * GRID_CELL + GRID_OFFSET + GRID_CELL / 2;
      const cy = cube.r * GRID_CELL + GRID_OFFSET + GRID_CELL / 2;
      sumX += cx;
      sumY += cy;
    }
    const comX = sumX / CUBE_POSITIONS.length;
    const comY = sumY / CUBE_POSITIONS.length;

    // The legacy 16 cubes are transcribed verbatim from HeroSignalP.tsx with mean grid index 10.6875
    // giving plane center of mass at (637.875, 637.875) — offset by only 7.875px (< 0.2 cells)
    expect(comX).toBe(637.875);
    expect(comY).toBe(637.875);
  });

  test("outer application nodes are placed strictly outside the 22x22 core cluster boundary", () => {
    const coreMin = GRID_OFFSET; // 168
    const coreMax = GRID_OFFSET + 22 * GRID_CELL; // 1092

    for (const node of APPLICATION_NODES) {
      const isOutside =
        node.cx < coreMin || node.cx > coreMax || node.cy < coreMin || node.cy > coreMax;
      expect(isOutside, `Node ${node.id} at (${node.cx}, ${node.cy}) should sit on the outer ring`).toBe(true);
    }
  });
});

describe("Empirical Challenge: 2. 2D Projection Bounds & Screen Containment", () => {
  function getCameraForViewport(width: number, height: number, flatten: number) {
    const viewScale = calcViewScale(width, height);
    return makeCamera(flatten, width / 2, height * HORIZON, viewScale, 0, 0);
  }

  test("calcViewScale handles edge cases and follows aspect-ratio adaptive scaling", () => {
    expect(VIEW_FIT_X).toBe(1.85);
    expect(VIEW_FIT_Y).toBe(1.40);
    expect(VIEW_FIT).toBe(1.40);
    expect(calcViewScale(0, 900)).toBe(0);
    expect(calcViewScale(1440, 0)).toBe(0);
    expect(calcViewScale(-100, 900)).toBe(0);

    // Desktop 1440x900: height-constrained (900 / 1.40 < 1440 / 1.85)
    expect(calcViewScale(1440, 900)).toBeCloseTo((900 / 1.40) / 1260, 6);

    // Mobile 390x844: width-constrained (390 / 1.85 < 844 / 1.40)
    expect(calcViewScale(390, 844)).toBeCloseTo((390 / 1.85) / 1260, 6);
  });

  const viewports = [
    { name: "Mobile Small 320x640", w: 320, h: 640 },
    { name: "Mobile Standard 390x844", w: 390, h: 844 },
    { name: "Tablet 768x1024", w: 768, h: 1024 },
    { name: "Desktop 1440x900", w: 1440, h: 900 },
    { name: "Wide Desktop 1920x1080", w: 1920, h: 1080 },
  ];

  const progressSteps = [0, 0.05, 0.1, 0.2, 0.5, 0.8, 1.0];

  for (const vp of viewports) {
    test(`${vp.name}: compute exact projected 2D screen bounding boxes for all scene objects with 100% viewport containment at rest`, () => {
      // 1. Strict full bounding box containment (all node/cube corners) at rest p=0
      const restState = heroFrameState(0, false, 0);
      const restCam = getCameraForViewport(vp.w, vp.h, restState.flatten);

      let restMinSx = Infinity, restMaxSx = -Infinity;
      let restMinSy = Infinity, restMaxSy = -Infinity;

      for (const app of APPLICATION_NODES) {
        const half = APPLICATION_NODE_SIZE / 2;
        const corners = [
          [app.cx - half, app.cy - half, 0],
          [app.cx + half, app.cy - half, 0],
          [app.cx + half, app.cy + half, 0],
          [app.cx - half, app.cy + half, 0],
          [app.cx - half, app.cy - half, app.elevation],
          [app.cx + half, app.cy - half, app.elevation],
          [app.cx + half, app.cy + half, app.elevation],
          [app.cx - half, app.cy + half, app.elevation],
        ] as const;

        for (const [x, y, z] of corners) {
          const projected = project(restCam, x, y, z);
          if (projected.sx < restMinSx) restMinSx = projected.sx;
          if (projected.sx > restMaxSx) restMaxSx = projected.sx;
          if (projected.sy < restMinSy) restMinSy = projected.sy;
          if (projected.sy > restMaxSy) restMaxSy = projected.sy;
        }
      }

      for (const node of SERVICE_NODES) {
        const half = SERVICE_NODE_SIZE / 2;
        const corners = [
          [node.cx - half, node.cy - half, 0],
          [node.cx + half, node.cy - half, 0],
          [node.cx + half, node.cy + half, 0],
          [node.cx - half, node.cy + half, 0],
          [node.cx - half, node.cy - half, node.elevation],
          [node.cx + half, node.cy - half, node.elevation],
          [node.cx + half, node.cy + half, node.elevation],
          [node.cx - half, node.cy + half, node.elevation],
        ] as const;

        for (const [x, y, z] of corners) {
          const projected = project(restCam, x, y, z);
          if (projected.sx < restMinSx) restMinSx = projected.sx;
          if (projected.sx > restMaxSx) restMaxSx = projected.sx;
          if (projected.sy < restMinSy) restMinSy = projected.sy;
          if (projected.sy > restMaxSy) restMaxSy = projected.sy;
        }
      }

      for (const cube of CUBE_POSITIONS) {
        const x0 = cube.c * GRID_CELL + GRID_OFFSET;
        const y0 = cube.r * GRID_CELL + GRID_OFFSET;
        const x1 = x0 + GRID_CELL;
        const y1 = y0 + GRID_CELL;
        const corners = [
          [x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0],
          [x0, y0, cube.h], [x1, y0, cube.h], [x1, y1, cube.h], [x0, y1, cube.h],
        ] as const;

        for (const [x, y, z] of corners) {
          const projected = project(restCam, x, y, z);
          if (projected.sx < restMinSx) restMinSx = projected.sx;
          if (projected.sx > restMaxSx) restMaxSx = projected.sx;
          if (projected.sy < restMinSy) restMinSy = projected.sy;
          if (projected.sy > restMaxSy) restMaxSy = projected.sy;
        }
      }

      expect(restMinSx).toBeGreaterThanOrEqual(0);
      expect(restMaxSx).toBeLessThanOrEqual(vp.w);
      expect(restMinSy).toBeGreaterThanOrEqual(0);
      expect(restMaxSy).toBeLessThanOrEqual(vp.h);

      // 2. Projection across all progression steps remains well-formed and node centers strictly contained
      for (const p of progressSteps) {
        const state = heroFrameState(p, false, 0);
        const cam = getCameraForViewport(vp.w, vp.h, state.flatten);

        for (const app of APPLICATION_NODES) {
          const ez = app.elevation * (1 - state.flatten);
          const centerProj = project(cam, app.cx, app.cy, ez);
          expect(centerProj.sx).toBeGreaterThanOrEqual(0);
          expect(centerProj.sx).toBeLessThanOrEqual(vp.w);
          expect(centerProj.sy).toBeGreaterThanOrEqual(0);
          expect(centerProj.sy).toBeLessThanOrEqual(vp.h);
        }
      }
    });

    test(`${vp.name}: center of plane (630, 630) projects exactly to (${vp.w / 2}, ${vp.h * HORIZON}) at all progress steps`, () => {
      for (const p of progressSteps) {
        const state = heroFrameState(p, false, 0);
        const cam = getCameraForViewport(vp.w, vp.h, state.flatten);

        const centerProjected = project(cam, 630, 630, 0);
        expect(centerProjected.sx).toBeCloseTo(vp.w / 2, 4);
        expect(centerProjected.sy).toBeCloseTo(vp.h * HORIZON, 4);
      }
    });
  }

  test("Desktop (1440x900): projected nodes at rest p=0 span comfortably across canvas", () => {
    const cam = getCameraForViewport(1440, 900, 0);
    const bounds: Record<string, { sx: number; sy: number }> = {};
    for (const app of APPLICATION_NODES) {
      const p = project(cam, app.cx, app.cy, app.elevation);
      bounds[app.id] = { sx: Math.round(p.sx), sy: Math.round(p.sy) };
    }

    // Alpha Analytics (NW) -> far left of diamond
    expect(bounds["app-alpha"]?.sx).toBe(225);
    expect(bounds["app-alpha"]?.sy).toBe(438);

    // Direct Market Access (NE) -> top apex of diamond
    expect(bounds["app-dma"]?.sx).toBe(720);
    expect(bounds["app-dma"]?.sy).toBe(214);

    // Risk Fortress (SE) -> far right of diamond
    expect(bounds["app-risk"]?.sx).toBe(1215);
    expect(bounds["app-risk"]?.sy).toBe(438);

    // Data Pipeline (SW) -> bottom apex of diamond
    expect(bounds["app-pipeline"]?.sx).toBe(720);
    expect(bounds["app-pipeline"]?.sy).toBe(815);

    // Order Router (North)
    expect(bounds["app-router"]?.sx).toBe(486);
    expect(bounds["app-router"]?.sy).toBe(306);

    // Telemetry Hub (South)
    expect(bounds["app-telemetry"]?.sx).toBe(1028);
    expect(bounds["app-telemetry"]?.sy).toBe(615);
  });

  test("Mobile (390x844): projected nodes at rest p=0 scale proportionally to viewport width", () => {
    const cam = getCameraForViewport(390, 844, 0);
    const bounds: Record<string, { sx: number; sy: number }> = {};
    for (const app of APPLICATION_NODES) {
      const p = project(cam, app.cx, app.cy, app.elevation);
      bounds[app.id] = { sx: Math.round(p.sx), sy: Math.round(p.sy) };
    }

    // Exact calibrated coordinate expectations
    expect(bounds["app-alpha"]?.sx).toBe(33);
    expect(bounds["app-alpha"]?.sy).toBe(418);

    expect(bounds["app-dma"]?.sx).toBe(195);
    expect(bounds["app-dma"]?.sy).toBe(333);

    expect(bounds["app-risk"]?.sx).toBe(357);
    expect(bounds["app-risk"]?.sy).toBe(418);

    expect(bounds["app-pipeline"]?.sx).toBe(195);
    expect(bounds["app-pipeline"]?.sy).toBe(519);

    expect(bounds["app-router"]?.sx).toBe(112);
    expect(bounds["app-router"]?.sy).toBe(371);

    expect(bounds["app-telemetry"]?.sx).toBe(286);
    expect(bounds["app-telemetry"]?.sy).toBe(471);

    // DMA (NE) and Pipeline (SW) are vertically aligned with center origin (sx = 195)
    expect(bounds["app-dma"]?.sx).toBe(195);
    expect(bounds["app-pipeline"]?.sx).toBe(195);

    // Alpha (NW) and Risk (SE) are horizontally symmetrical across center origin
    const distAlpha = 195 - (bounds["app-alpha"]?.sx ?? 0);
    const distRisk = (bounds["app-risk"]?.sx ?? 0) - 195;
    expect(distAlpha).toBe(distRisk);
  });
});

describe("Empirical Challenge: 3. Out-and-Back Loop Continuity & Stress", () => {
  test("all 9 signal loops are closed (waypoints[0] === waypoints[length - 1])", () => {
    expect(SIGNAL_LOOPS.length).toBe(9);
    for (let i = 0; i < SIGNAL_LOOPS.length; i++) {
      const loop = SIGNAL_LOOPS[i]!;
      const start = loop.waypoints[0]!;
      const end = loop.waypoints[loop.waypoints.length - 1]!;
      expect(start.x).toBe(end.x);
      expect(start.y).toBe(end.y);
      expect(loop.totalL).toBeGreaterThan(0);
    }
  });

  test("loops 3..8 (outer spurs) are bidirectional out-and-back conduits", () => {
    for (let i = 3; i < 9; i++) {
      const loop = SIGNAL_LOOPS[i]!;
      const midIdx = Math.floor(loop.waypoints.length / 2);
      const apex = loop.waypoints[midIdx]!;

      const matchApp = APPLICATION_NODES.some(
        (app) => Math.hypot(app.cx - apex.x, app.cy - apex.y) < 1
      );
      expect(matchApp, `Loop ${i} apex (${apex.x}, ${apex.y}) should reach an outer node`).toBe(true);

      const halfL = loop.totalL / 2;
      const atApex = pointAtLoopDistance(loop, halfL);
      expect(atApex.x).toBeCloseTo(apex.x, 2);
      expect(atApex.y).toBeCloseTo(apex.y, 2);
    }
  });

  test("pointAtLoopDistance handles extreme distances without precision loss or divergence", () => {
    for (const loop of SIGNAL_LOOPS) {
      const p0 = pointAtLoopDistance(loop, 0);

      // Millions of cycles forward
      const pExtremePos = pointAtLoopDistance(loop, 1_000_000 * loop.totalL);
      expect(pExtremePos.x).toBeCloseTo(p0.x, 4);
      expect(pExtremePos.y).toBeCloseTo(p0.y, 4);

      // Millions of cycles backward (negative distance)
      const pExtremeNeg = pointAtLoopDistance(loop, -1_000_000 * loop.totalL);
      expect(pExtremeNeg.x).toBeCloseTo(p0.x, 4);
      expect(pExtremeNeg.y).toBeCloseTo(p0.y, 4);

      // Fractional cycle backwards vs forwards
      const pNegFrac = pointAtLoopDistance(loop, -0.25 * loop.totalL);
      const pPosFrac = pointAtLoopDistance(loop, 0.75 * loop.totalL);
      expect(pNegFrac.x).toBeCloseTo(pPosFrac.x, 4);
      expect(pNegFrac.y).toBeCloseTo(pPosFrac.y, 4);
    }
  });

  test("pointAtLoopDistance is Lipschitz continuous (no jumps greater than delta distance)", () => {
    for (const loop of SIGNAL_LOOPS) {
      const step = 0.5; // 0.5px
      let prev = pointAtLoopDistance(loop, 0);

      for (let d = step; d <= loop.totalL + step; d += step) {
        const curr = pointAtLoopDistance(loop, d);
        const delta = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        expect(delta).toBeLessThanOrEqual(step + 1e-4);
        prev = curr;
      }
    }
  });
});

describe("Empirical Challenge: 4. State Transitions & Reduced Motion", () => {
  test("outer nodes collapse smoothly during flatten phase [0, 0.20]", () => {
    for (let p = 0; p <= 0.20; p += 0.02) {
      const state = heroFrameState(p, false, 0);
      expect(state.flatten).toBeGreaterThanOrEqual(0);
      expect(state.flatten).toBeLessThanOrEqual(1);

      for (const app of APPLICATION_NODES) {
        const ez = app.elevation * (1 - state.flatten);
        expect(ez).toBeGreaterThanOrEqual(0);
        expect(ez).toBeLessThanOrEqual(app.elevation);
      }
    }
  });

  test("reduced-motion state yields complete resting frame at progress 0 for paintStill", () => {
    const stillState = heroFrameState(0, false, 0);
    expect(stillState.flatten).toBe(0);
    expect(stillState.sideOpacity).toBe(1);
    expect(stillState.topOpacity).toBe(1);
    expect(stillState.signalOpacity).toBe(1);
  });
});
