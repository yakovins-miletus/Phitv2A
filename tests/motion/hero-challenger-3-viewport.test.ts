/**
 * Comprehensive Empirical Stress Suite for Challenger 3:
 * Viewport Containment, Camera Perspective Scaling & Center of Mass Invariants.
 */

import { describe, expect, test } from "vitest";

import {
  APPLICATION_NODES,
  APP_NODE_WIDTH,
  APP_NODE_HEIGHT,
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
  project,
} from "@/features/hero/heroScene";
import {
  HORIZON,
  TIGHT_FIT_X,
  TIGHT_FIT_Y,
  WIDE_FIT_X,
  WIDE_FIT_Y,
  VIEW_FIT_X,
  VIEW_FIT_Y,
  calcClosureViewScale,
  calcTightViewScale,
  calcWideViewScale,
  calcViewScale,
} from "@/features/hero/heroPlaneRenderer";

describe("Challenger 3 Empirical Stress Suite: Center of Mass & Center Origin Alignment", () => {
  const CENTER = 630; // PLANE_SIZE / 2 = 1260 / 2

  test("grid geometry: 30x30 cells, 42px cell size, 1260px total plane size", () => {
    expect(GRID_CELLS).toBe(30);
    expect(GRID_CELL).toBe(42);
    expect(PLANE_SIZE).toBe(1260);
    expect(GRID_OFFSET).toBe(168);
    expect(GRID_OFFSET * 2 + 22 * GRID_CELL).toBe(PLANE_SIZE);
  });

  test("center of mass of 6 outer application nodes equals (630, 630) exactly", () => {
    const sum = APPLICATION_NODES.reduce(
      (acc, node) => ({ x: acc.x + node.cx, y: acc.y + node.cy }),
      { x: 0, y: 0 }
    );
    const meanX = sum.x / APPLICATION_NODES.length;
    const meanY = sum.y / APPLICATION_NODES.length;

    expect(meanX).toBe(CENTER);
    expect(meanY).toBe(CENTER);
  });

  test("center of mass of 4 service nodes equals (630, 630) exactly", () => {
    const sum = SERVICE_NODES.reduce(
      (acc, node) => ({ x: acc.x + node.cx, y: acc.y + node.cy }),
      { x: 0, y: 0 }
    );
    const meanX = sum.x / SERVICE_NODES.length;
    const meanY = sum.y / SERVICE_NODES.length;

    expect(meanX).toBe(CENTER);
    expect(meanY).toBe(CENTER);
  });

  test("center of plane (630, 630, 0) strictly maps to screen center (w/2, h/2) for all viewports and progress steps", () => {
    const testViewports = [
      { w: 320, h: 640 },
      { w: 390, h: 844 },
      { w: 768, h: 1024 },
      { w: 1024, h: 768 },
      { w: 1440, h: 900 },
      { w: 1920, h: 1080 },
      { w: 2560, h: 1440 },
      { w: 3440, h: 1440 },
      { w: 3840, h: 2160 },
      { w: 280, h: 653 },
      { w: 844, h: 390 },
    ];

    const progressSteps = [0.0, 0.05, 0.10, 0.15, 0.20, 0.50, 0.80, 1.00];

    for (const vp of testViewports) {
      for (const p of progressSteps) {
        const state = heroFrameState(p, false, 0);
        const viewScale = calcViewScale(vp.w, vp.h);
        const cam = makeCamera(state.flatten, vp.w / 2, vp.h * HORIZON, viewScale, 0, 0);

        const projected = project(cam, CENTER, CENTER, 0);
        expect(projected.sx).toBeCloseTo(vp.w / 2, 5);
        expect(projected.sy).toBeCloseTo(vp.h / 2, 5);
        expect(HORIZON).toBe(0.5);
      }
    }
  });

  test("center of plane projection invariance holds under dynamic tilt angles (tiltX, tiltY)", () => {
    const vp = { w: 1440, h: 900 };
    const tiltAngles = [-3.5, -2.0, -1.0, 0, 1.0, 2.0, 3.5];

    for (const tiltX of tiltAngles) {
      for (const tiltY of tiltAngles) {
        const viewScale = calcViewScale(vp.w, vp.h);
        const cam = makeCamera(0, vp.w / 2, vp.h * HORIZON, viewScale, tiltX, tiltY);

        const projected = project(cam, CENTER, CENTER, 0);
        // Plane center (630, 630, 0) has px=0, py=0, rx1=0, ry1=0 -> ry2=0, rz2=0 -> origin (w/2, h/2)
        expect(projected.sx).toBeCloseTo(vp.w / 2, 5);
        expect(projected.sy).toBeCloseTo(vp.h / 2, 5);
      }
    }
  });
});

describe("Challenger 3 Empirical Stress Suite: Viewport Bounds Containment Across Screen Sizes", () => {
  const mandatoryViewports = [
    { name: "Mobile Small (320x640)", w: 320, h: 640 },
    { name: "Mobile Standard (390x844)", w: 390, h: 844 },
    { name: "Tablet Portrait (768x1024)", w: 768, h: 1024 },
    { name: "Desktop (1440x900)", w: 1440, h: 900 },
    { name: "Wide Desktop (1920x1080)", w: 1920, h: 1080 },
  ];

  for (const vp of mandatoryViewports) {
    test(`${vp.name}: 100% screen bounds containment for all 3D object vertices at rest (p=0)`, () => {
      const state = heroFrameState(0, false, 0);
      const viewScale = calcViewScale(vp.w, vp.h);
      const cam = makeCamera(state.flatten, vp.w / 2, vp.h * HORIZON, viewScale, 0, 0);

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      // 1. Application nodes (all 8 box corners)
      for (const app of APPLICATION_NODES) {
        const halfW = (app.width ?? APP_NODE_WIDTH) / 2;
        const halfH = (app.height ?? APP_NODE_HEIGHT) / 2;
        const corners = [
          [app.cx - halfW, app.cy - halfH, 0],
          [app.cx + halfW, app.cy - halfH, 0],
          [app.cx + halfW, app.cy + halfH, 0],
          [app.cx - halfW, app.cy + halfH, 0],
          [app.cx - halfW, app.cy - halfH, app.elevation],
          [app.cx + halfW, app.cy - halfH, app.elevation],
          [app.cx + halfW, app.cy + halfH, app.elevation],
          [app.cx - halfW, app.cy + halfH, app.elevation],
        ] as const;

        for (const [x, y, z] of corners) {
          const pt = project(cam, x, y, z);
          if (pt.sx < minX) minX = pt.sx;
          if (pt.sx > maxX) maxX = pt.sx;
          if (pt.sy < minY) minY = pt.sy;
          if (pt.sy > maxY) maxY = pt.sy;
        }
      }

      // 2. Service nodes (all 8 box corners)
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
          const pt = project(cam, x, y, z);
          if (pt.sx < minX) minX = pt.sx;
          if (pt.sx > maxX) maxX = pt.sx;
          if (pt.sy < minY) minY = pt.sy;
          if (pt.sy > maxY) maxY = pt.sy;
        }
      }

      // 3. Core cubes (all 8 box corners)
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
          const pt = project(cam, x, y, z);
          if (pt.sx < minX) minX = pt.sx;
          if (pt.sx > maxX) maxX = pt.sx;
          if (pt.sy < minY) minY = pt.sy;
          if (pt.sy > maxY) maxY = pt.sy;
        }
      }

      // 4. Signal Loops (all waypoints)
      for (const loop of SIGNAL_LOOPS) {
        for (const wp of loop.waypoints) {
          const pt = project(cam, wp.x, wp.y, 0);
          if (pt.sx < minX) minX = pt.sx;
          if (pt.sx > maxX) maxX = pt.sx;
          if (pt.sy < minY) minY = pt.sy;
          if (pt.sy > maxY) maxY = pt.sy;
        }
      }

      // Assertions: 100% containment within [0, w] and [0, h]
      expect(minX).toBeGreaterThanOrEqual(0);
      expect(maxX).toBeLessThanOrEqual(vp.w);
      expect(minY).toBeGreaterThanOrEqual(0);
      expect(maxY).toBeLessThanOrEqual(vp.h);

      // Verify positive safety margin
      const leftMargin = minX;
      const rightMargin = vp.w - maxX;
      const topMargin = minY;
      const bottomMargin = vp.h - maxY;

      console.log(`[VIEWPORT ${vp.name}] bounds: [X: ${minX.toFixed(1)}..${maxX.toFixed(1)}, Y: ${minY.toFixed(1)}..${maxY.toFixed(1)}] | margins: (L: ${leftMargin.toFixed(1)}px, R: ${rightMargin.toFixed(1)}px, T: ${topMargin.toFixed(1)}px, B: ${bottomMargin.toFixed(1)}px)`);

      expect(leftMargin).toBeGreaterThan(0);
      expect(rightMargin).toBeGreaterThan(0);
      expect(topMargin).toBeGreaterThan(0);
      expect(bottomMargin).toBeGreaterThan(0);
    });

    test(`${vp.name}: containment under maximum hover tilt (+/- 3.5 deg)`, () => {
      const state = heroFrameState(0, false, 0);
      const viewScale = calcViewScale(vp.w, vp.h);

      // Test extreme tilt corners (+/- 3.5 deg in radians)
      const MAX_TILT = (3.5 * Math.PI) / 180;
      const tiltCorners = [
        [-MAX_TILT, -MAX_TILT],
        [-MAX_TILT, MAX_TILT],
        [MAX_TILT, -MAX_TILT],
        [MAX_TILT, MAX_TILT],
      ] as const;

      for (const [tiltX, tiltY] of tiltCorners) {
        const cam = makeCamera(state.flatten, vp.w / 2, vp.h * HORIZON, viewScale, tiltX, tiltY);

        for (const app of APPLICATION_NODES) {
          const pt = project(cam, app.cx, app.cy, app.elevation);
          expect(pt.sx).toBeGreaterThanOrEqual(0);
          expect(pt.sx).toBeLessThanOrEqual(vp.w);
          expect(pt.sy).toBeGreaterThanOrEqual(0);
          expect(pt.sy).toBeLessThanOrEqual(vp.h);
        }
      }
    });

    test(`${vp.name}: containment throughout scroll flattening progression (p in 0..1)`, () => {
      const progressSteps = [0.0, 0.05, 0.10, 0.15, 0.20, 0.40, 0.70, 1.00];

      for (const p of progressSteps) {
        const state = heroFrameState(p, false, 0);
        const viewScale = calcViewScale(vp.w, vp.h);
        const cam = makeCamera(state.flatten, vp.w / 2, vp.h * HORIZON, viewScale, 0, 0);

        for (const app of APPLICATION_NODES) {
          const ez = app.elevation * (1 - state.flatten);
          const pt = project(cam, app.cx, app.cy, ez);
          expect(pt.sx).toBeGreaterThanOrEqual(0);
          expect(pt.sx).toBeLessThanOrEqual(vp.w);
          expect(pt.sy).toBeGreaterThanOrEqual(0);
          expect(pt.sy).toBeLessThanOrEqual(vp.h);
        }
      }
    });
  }
});

describe("Challenger 3 Empirical Stress Suite: Scaling Function Robustness", () => {
  test("calcViewScale handles boundary inputs cleanly", () => {
    expect(calcViewScale(0, 0)).toBe(0);
    expect(calcViewScale(0, 900)).toBe(0);
    expect(calcViewScale(1440, 0)).toBe(0);
    expect(calcViewScale(-500, 1000)).toBe(0);
    expect(calcViewScale(1000, -500)).toBe(0);
  });

  test("calcViewScale is continuous and monotonically non-decreasing", () => {
    let prevScale = 0;
    for (let w = 100; w <= 3840; w += 50) {
      const scale = calcViewScale(w, 900);
      expect(scale).toBeGreaterThanOrEqual(prevScale);
      prevScale = scale;
    }
  });

  test("aspect ratio transition point between width-bound and height-bound scaling", () => {
    // Transition occurs when w / VIEW_FIT_X == h / VIEW_FIT_Y
    // => w / h == VIEW_FIT_X / VIEW_FIT_Y = 1.85 / 1.40 = 1.32142857...
    const criticalRatio = VIEW_FIT_X / VIEW_FIT_Y;

    const h = 1000;
    const wBelow = (criticalRatio - 0.01) * h;
    const wAbove = (criticalRatio + 0.01) * h;

    const scaleBelow = calcViewScale(wBelow, h);
    const scaleAbove = calcViewScale(wAbove, h);

    // Below critical ratio, it is bounded by width: scale == (wBelow / 1.85) / 1260
    expect(scaleBelow).toBeCloseTo((wBelow / VIEW_FIT_X) / PLANE_SIZE, 6);

    // Above critical ratio, it is bounded by height: scale == (h / 1.40) / 1260
    expect(scaleAbove).toBeCloseTo((h / VIEW_FIT_Y) / PLANE_SIZE, 6);
  });

  test("camera fit divisors constants are locked", () => {
    expect(TIGHT_FIT_X).toBe(1.36);
    expect(TIGHT_FIT_Y).toBe(1.05);
    expect(WIDE_FIT_X).toBe(1.85);
    expect(WIDE_FIT_Y).toBe(1.40);
  });

  test("tight scale exceeds wide scale (zoom ratio >= 1.30x) across all standard viewports", () => {
    const viewports = [
      { w: 320, h: 640 },
      { w: 390, h: 844 },
      { w: 768, h: 1024 },
      { w: 1440, h: 900 },
      { w: 1920, h: 1080 },
    ];

    for (const vp of viewports) {
      const tight = calcTightViewScale(vp.w, vp.h);
      const wide = calcWideViewScale(vp.w, vp.h);
      expect(tight).toBeGreaterThan(wide);
      expect(tight / wide).toBeGreaterThanOrEqual(1.30);
    }
  });

  test("closure camera scale at progress=1 is strictly smaller than at progress=0 (zoom-out requirement)", () => {
    const viewports = [
      { name: "Mobile Small", w: 320, h: 640 },
      { name: "Mobile Standard", w: 390, h: 844 },
      { name: "Tablet Portrait", w: 768, h: 1024 },
      { name: "Desktop", w: 1440, h: 900 },
      { name: "Wide Desktop", w: 1920, h: 1080 },
    ];

    for (const vp of viewports) {
      const scaleAtZero = calcClosureViewScale(vp.w, vp.h, 0);
      const scaleAtOne = calcClosureViewScale(vp.w, vp.h, 1);

      // Explicit acceptance criteria assertion: scale at 1.0 < scale at 0.0
      expect(
        scaleAtOne,
        `Closure camera scale at progress=1 must be strictly less than at progress=0 for ${vp.name}`
      ).toBeLessThan(scaleAtZero);

      expect(scaleAtZero).toBeCloseTo(calcTightViewScale(vp.w, vp.h), 6);
      expect(scaleAtOne).toBeCloseTo(calcWideViewScale(vp.w, vp.h), 6);
    }
  });
});

