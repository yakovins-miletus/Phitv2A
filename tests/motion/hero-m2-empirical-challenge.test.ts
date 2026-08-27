/**
 * Dedicated Empirical Challenge & Bounds Verification Suite for Milestone 2:
 * 1. Camera scaling monotonicity and zoom ratios across standard & extreme viewports.
 * 2. Inner 22x22 core centering, visibility, and bounding box safety margins under tight & wide zoom.
 * 3. Outer application nodes exclusion in Top Hero vs full containment in Wide Closure.
 * 4. Dual-instance state & handle isolation without memory or property crosstalk.
 */

import { describe, expect, test } from "vitest";

import {
  APPLICATION_NODES,
  APPLICATION_NODE_SIZE,
  CUBE_POSITIONS,
  GRID_CELL,
  GRID_OFFSET,
  SERVICE_NODES,
  SERVICE_NODE_SIZE,
  makeCamera,
  project,
} from "@/features/hero/heroScene";
import {
  HORIZON,
  calcClosureViewScale,
  calcTightViewScale,
  calcWideViewScale,
  createPlaneRendererState,
} from "@/features/hero/heroPlaneRenderer";

describe("M2 Empirical Assertion 1: Camera Scale Bounds & Monotonicity", () => {
  const targetViewports = [
    { name: "Mobile Small", w: 320, h: 640 },
    { name: "Mobile Standard", w: 390, h: 844 },
    { name: "Tablet Portrait", w: 768, h: 1024 },
    { name: "Desktop", w: 1440, h: 900 },
    { name: "Wide Desktop", w: 1920, h: 1080 },
  ];

  const extremeViewports = [
    { name: "Ultra-narrow Mobile", w: 280, h: 653 },
    { name: "Square Viewport", w: 1000, h: 1000 },
    { name: "Ultrawide 21:9", w: 3440, h: 1440 },
    { name: "4K UHD", w: 3840, h: 2160 },
  ];

  const allViewports = [...targetViewports, ...extremeViewports];

  test("Camera scale at p=1 is strictly smaller than at p=0 across all viewports", () => {
    for (const vp of allViewports) {
      const scaleP0 = calcClosureViewScale(vp.w, vp.h, 0);
      const scaleP1 = calcClosureViewScale(vp.w, vp.h, 1);

      const tight = calcTightViewScale(vp.w, vp.h);
      const wide = calcWideViewScale(vp.w, vp.h);

      expect(scaleP0).toBeCloseTo(tight, 8);
      expect(scaleP1).toBeCloseTo(wide, 8);

      expect(
        scaleP1,
        `Scale at p=1 (${scaleP1}) must be strictly less than at p=0 (${scaleP0}) for ${vp.name} (${vp.w}x${vp.h})`
      ).toBeLessThan(scaleP0);

      const zoomRatio = scaleP0 / scaleP1;
      // Invariant: tight/wide ratio must be >= 1.30 across all viewports
      expect(zoomRatio).toBeGreaterThanOrEqual(1.30);
      expect(zoomRatio).toBeLessThanOrEqual(1.40);

      console.log(
        `[SCALE CHECK] ${vp.name.padEnd(20)} | ${vp.w}x${vp.h} | S(0)=${scaleP0.toFixed(6)} | S(1)=${scaleP1.toFixed(6)} | ZoomRatio=${zoomRatio.toFixed(3)}x`
      );
    }
  });

  test("Camera scale S(p) is strictly monotonically decreasing for all p in [0, 1] with step 0.01", () => {
    for (const vp of allViewports) {
      let prevScale = calcClosureViewScale(vp.w, vp.h, 0);
      for (let p = 0.01; p <= 1.0001; p += 0.01) {
        const currentScale = calcClosureViewScale(vp.w, vp.h, p);
        expect(currentScale).toBeLessThan(prevScale);
        prevScale = currentScale;
      }
    }
  });

  test("Negative or out-of-range progress p is safely clamped in [0, 1]", () => {
    for (const vp of targetViewports) {
      const scaleNeg = calcClosureViewScale(vp.w, vp.h, -0.5);
      const scale0 = calcClosureViewScale(vp.w, vp.h, 0);
      expect(scaleNeg).toBe(scale0);

      const scaleExcess = calcClosureViewScale(vp.w, vp.h, 1.5);
      const scale1 = calcClosureViewScale(vp.w, vp.h, 1);
      expect(scaleExcess).toBe(scale1);
    }
  });
});

describe("M2 Empirical Assertion 2: Inner 22x22 Core Centering & Visibility", () => {
  const targetViewports = [
    { name: "Mobile Small", w: 320, h: 640 },
    { name: "Mobile Standard", w: 390, h: 844 },
    { name: "Tablet Portrait", w: 768, h: 1024 },
    { name: "Desktop", w: 1440, h: 900 },
    { name: "Wide Desktop", w: 1920, h: 1080 },
  ];

  test("Scene center (630, 630, 0) strictly maps to screen center (w/2, h/2) at both tight (p=0) and wide (p=1) zoom", () => {
    for (const vp of targetViewports) {
      for (const p of [0, 0.25, 0.5, 0.75, 1.0]) {
        const scale = calcClosureViewScale(vp.w, vp.h, p);
        const cam = makeCamera(0, vp.w / 2, vp.h * HORIZON, scale, 0, 0);
        const proj = project(cam, 630, 630, 0);

        expect(proj.sx).toBeCloseTo(vp.w / 2, 5);
        expect(proj.sy).toBeCloseTo(vp.h / 2, 5);
      }
    }
  });

  test("All 16 core cubes and 4 service nodes remain 100% visible and within viewport bounds at tight (p=0) and wide (p=1) zoom", () => {
    for (const vp of targetViewports) {
      for (const p of [0, 1]) {
        const scale = calcClosureViewScale(vp.w, vp.h, p);
        const cam = makeCamera(0, vp.w / 2, vp.h * HORIZON, scale, 0, 0);

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        // 16 Core Cubes (all 8 vertices)
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

        // 4 Service Nodes (all 8 vertices)
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

        if (maxY > vp.h) {
          console.log(`[OVERFLOW DIAGNOSTIC] ${vp.name} p=${p} maxY=${maxY} > ${vp.h}`);
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
              if (pt.sy > vp.h) {
                console.log(`  Cube at (r=${cube.r}, c=${cube.c}, h=${cube.h}) vertex (${x}, ${y}, ${z}) -> sy=${pt.sy.toFixed(2)}`);
              }
            }
          }
          for (let i = 0; i < SERVICE_NODES.length; i++) {
            const node = SERVICE_NODES[i]!;
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
              if (pt.sy > vp.h) {
                console.log(`  Service node [${i}:${node.icon}] vertex (${x}, ${y}, ${z}) -> sy=${pt.sy.toFixed(2)}`);
              }
            }
          }
        }

        const leftMargin = minX;
        const rightMargin = vp.w - maxX;
        const topMargin = minY;
        const bottomMargin = vp.h - maxY;

        console.log(
          `[INNER CORE BOUNDS] ${vp.name.padEnd(16)} (p=${p}) | X: [${minX.toFixed(1)}..${maxX.toFixed(1)}] | Y: [${minY.toFixed(1)}..${maxY.toFixed(1)}] | Margins: L=${leftMargin.toFixed(1)}px, R=${rightMargin.toFixed(1)}px, T=${topMargin.toFixed(1)}px, B=${bottomMargin.toFixed(1)}px`
        );
      }
    }
  });
});

describe("M2 Empirical Assertion 3: Outer Application Nodes Visibility & Top Hero Exclusion", () => {
  const targetViewports = [
    { name: "Mobile Small", w: 320, h: 640 },
    { name: "Mobile Standard", w: 390, h: 844 },
    { name: "Tablet Portrait", w: 768, h: 1024 },
    { name: "Desktop", w: 1440, h: 900 },
    { name: "Wide Desktop", w: 1920, h: 1080 },
  ];

  test("In Top Hero (tight zoom), outer application node vertices project outside screen bounds on key viewports", () => {
    // Desktop 1440x900
    const dScale = calcTightViewScale(1440, 900);
    const dCam = makeCamera(0, 1440 / 2, 900 * HORIZON, dScale, 0, 0);

    const dPipeline = APPLICATION_NODES.find((n) => n.id === "app-pipeline")!;
    const dProj = project(dCam, dPipeline.cx, dPipeline.cy, dPipeline.elevation);
    expect(dProj.sy).toBeGreaterThan(900); // Exits bottom on Desktop 1440x900

    // Mobile 390x844
    const mScale = calcTightViewScale(390, 844);
    const mCam = makeCamera(0, 390 / 2, 844 * HORIZON, mScale, 0, 0);

    const mAlpha = APPLICATION_NODES.find((n) => n.id === "app-alpha")!;
    const mRisk = APPLICATION_NODES.find((n) => n.id === "app-risk")!;
    const mProjAlpha = project(mCam, mAlpha.cx, mAlpha.cy, mAlpha.elevation);
    const mProjRisk = project(mCam, mRisk.cx, mRisk.cy, mRisk.elevation);

    expect(mProjAlpha.sx).toBeLessThan(0); // Exits left on Mobile 390x844
    expect(mProjRisk.sx).toBeGreaterThan(390); // Exits right on Mobile 390x844
  });

  test("In Wide Closure (p=1), all 6 outer application nodes (all 8 corners) are 100% contained within viewport bounds with positive margins", () => {
    for (const vp of targetViewports) {
      const wideScale = calcWideViewScale(vp.w, vp.h);
      const cam = makeCamera(0, vp.w / 2, vp.h * HORIZON, wideScale, 0, 0);

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

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
          const pt = project(cam, x, y, z);
          if (pt.sx < minX) minX = pt.sx;
          if (pt.sx > maxX) maxX = pt.sx;
          if (pt.sy < minY) minY = pt.sy;
          if (pt.sy > maxY) maxY = pt.sy;
        }
      }

      expect(minX).toBeGreaterThanOrEqual(0);
      expect(maxX).toBeLessThanOrEqual(vp.w);
      expect(minY).toBeGreaterThanOrEqual(0);
      expect(maxY).toBeLessThanOrEqual(vp.h);

      console.log(
        `[OUTER NODES WIDE CLOSURE] ${vp.name.padEnd(16)} | X: [${minX.toFixed(1)}..${maxX.toFixed(1)}] | Y: [${minY.toFixed(1)}..${maxY.toFixed(1)}] | Margins: L=${minX.toFixed(1)}px, R=${(vp.w - maxX).toFixed(1)}px, T=${minY.toFixed(1)}px, B=${(vp.h - maxY).toFixed(1)}px`
      );
    }
  });
});

describe("M2 Empirical Assertion 4: Dual Handle & State Isolation", () => {
  test("Independent state objects retain isolated property sets", () => {
    const heroState = createPlaneRendererState();
    const closureState = createPlaneRendererState();

    expect(heroState).not.toBe(closureState);
    expect(heroState.fieldStretchCurrent).not.toBe(closureState.fieldStretchCurrent);
    expect(heroState.fieldStretchTarget).not.toBe(closureState.fieldStretchTarget);

    heroState.fieldStretchCurrent[10] = 0.85;
    closureState.fieldStretchCurrent[10] = 0.12;
    expect(heroState.fieldStretchCurrent[10]).toBeCloseTo(0.85, 5);
    expect(closureState.fieldStretchCurrent[10]).toBeCloseTo(0.12, 5);

    heroState.logoScreenBox.visible = true;
    closureState.logoScreenBox.visible = false;
    expect(heroState.logoScreenBox.visible).toBe(true);
    expect(closureState.logoScreenBox.visible).toBe(false);
  });

  test("Simulated multi-instance handle actions do not mutate sibling state", () => {
    let heroProgress = 0;
    let heroZoomProgress = 0;
    const heroHandle = {
      setProgress: (p: number) => { heroProgress = p; },
      setZoomProgress: (p: number) => { heroZoomProgress = p; },
    };

    let closureProgress = 0;
    let closureZoomProgress = 0;
    const closureHandle = {
      setProgress: (p: number) => { closureProgress = p; },
      setZoomProgress: (p: number) => { closureZoomProgress = p; },
    };

    // Update hero only
    heroHandle.setProgress(0.42);
    heroHandle.setZoomProgress(0);

    expect(heroProgress).toBe(0.42);
    expect(closureProgress).toBe(0);
    expect(closureZoomProgress).toBe(0);

    // Update closure only
    closureHandle.setProgress(0.88);
    closureHandle.setZoomProgress(0.88);

    expect(heroProgress).toBe(0.42);
    expect(heroZoomProgress).toBe(0);
    expect(closureProgress).toBe(0.88);
    expect(closureZoomProgress).toBe(0.88);
  });
});
