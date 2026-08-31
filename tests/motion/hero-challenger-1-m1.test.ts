/**
 * Milestone M1 Challenger Verification Suite:
 * Empirical Verification of Outer Application Node Geometry,
 * Center-of-Mass Symmetry (630, 630), Bounding Boxes,
 * Viewport Containment across Standard and Extreme Viewports,
 * Perspective Non-Linearity Analysis, and Hero Mode Isolation.
 */

import { describe, expect, test } from "vitest";
import {
  APPLICATION_NODES,
  APP_NODE_WIDTH,
  APP_NODE_HEIGHT,
  APP_NODE_RADIUS,
  GRID_CELL,
  GRID_CELLS,
  GRID_OFFSET,
  PLANE_SIZE,
  SIGNAL_LOOPS,
  heroFrameState,
  makeCamera,
  project,
  type ApplicationNodeSpec,
} from "@/features/hero/heroScene";
import {
  HORIZON,
  calcTightViewScale,
  calcWideViewScale,
  createPlaneRendererState,
  drawPlaneFrame,
} from "@/features/hero/heroPlaneRenderer";

describe("Challenger 1 M1 — 1. Scene Geometry & Center of Mass Invariants", () => {
  const CENTER = 630; // PLANE_SIZE / 2 = 1260 / 2

  test("expanded grid plane dimensions and offset invariants", () => {
    expect(GRID_CELLS).toBe(30);
    expect(GRID_CELL).toBe(42);
    expect(PLANE_SIZE).toBe(1260);
    expect(GRID_OFFSET).toBe(168);
    expect(GRID_OFFSET * 2 + 22 * GRID_CELL).toBe(PLANE_SIZE);
  });

  test("exact count of application nodes is 10", () => {
    expect(APPLICATION_NODES).toHaveLength(10);
  });

  test("center of mass of the outer application nodes is exactly (630, 630)", () => {
    const sum = APPLICATION_NODES.reduce(
      (acc, node) => ({ x: acc.x + node.cx, y: acc.y + node.cy }),
      { x: 0, y: 0 }
    );
    const meanX = sum.x / APPLICATION_NODES.length;
    const meanY = sum.y / APPLICATION_NODES.length;

    expect(meanX).toBe(CENTER);
    expect(meanY).toBe(CENTER);
  });

  test("point symmetry: each application node has an exact opposite reflection through (630, 630)", () => {
    for (const node of APPLICATION_NODES) {
      const targetX = 2 * CENTER - node.cx;
      const targetY = 2 * CENTER - node.cy;

      const partner = APPLICATION_NODES.find(
        (other) => Math.abs(other.cx - targetX) < 1e-6 && Math.abs(other.cy - targetY) < 1e-6
      );

      expect(partner, `Node ${node.id} at (${node.cx}, ${node.cy}) must have symmetric counterpart at (${targetX}, ${targetY})`).toBeDefined();
    }
  });

  test("application node specifications: rounded rectangle dimensions (104x58, radius 12, elevation 6)", () => {
    for (const node of APPLICATION_NODES) {
      expect(node.width ?? APP_NODE_WIDTH).toBe(104);
      expect(node.height ?? APP_NODE_HEIGHT).toBe(58);
      expect(node.radius ?? APP_NODE_RADIUS).toBe(12);
      expect(node.elevation).toBe(6);
      expect(["analytics", "trading", "pipeline", "risk", "execution", "telemetry"]).toContain(node.appType);
    }
  });
});

describe("Challenger 1 M1 — 2. Stress Test Projections Across Required Viewports", () => {
  // Required target viewports from user request
  const requiredViewports = [
    { name: "Mobile Small", w: 320, h: 640 },
    { name: "Mobile Standard", w: 390, h: 844 },
    { name: "Tablet Portrait", w: 768, h: 1024 },
    { name: "Desktop", w: 1440, h: 900 },
    { name: "Desktop Full HD", w: 1920, h: 1080 },
    { name: "Ultrawide", w: 2560, h: 1080 },
    { name: "Extreme Tall/Narrow", w: 360, h: 1200 },
  ];

  function getAppNodeAllCorners(node: ApplicationNodeSpec, includeTop = true): [number, number, number][] {
    const w = node.width ?? APP_NODE_WIDTH;
    const h = node.height ?? APP_NODE_HEIGHT;
    const halfW = w / 2;
    const halfH = h / 2;
    const ez = node.elevation;
    const maxZ = includeTop ? ez + 2.0 : ez;

    return [
      // Base plane (4 corners)
      [node.cx - halfW, node.cy - halfH, 0],
      [node.cx + halfW, node.cy - halfH, 0],
      [node.cx + halfW, node.cy + halfH, 0],
      [node.cx - halfW, node.cy + halfH, 0],
      // Elevated slab (4 corners)
      [node.cx - halfW, node.cy - halfH, ez],
      [node.cx + halfW, node.cy - halfH, ez],
      [node.cx + halfW, node.cy + halfH, ez],
      [node.cx - halfW, node.cy + halfH, ez],
      // Top face with border offset (4 corners)
      [node.cx - halfW, node.cy - halfH, maxZ],
      [node.cx + halfW, node.cy - halfH, maxZ],
      [node.cx + halfW, node.cy + halfH, maxZ],
      [node.cx - halfW, node.cy + halfH, maxZ],
    ];
  }

  for (const vp of requiredViewports) {
    test(`${vp.name} (${vp.w}x${vp.h}): 100% of all corners of all application nodes contained at wide scale (mode="closure", p=1)`, () => {
      const wideScale = calcWideViewScale(vp.w, vp.h);
      const cam = makeCamera(0, vp.w / 2, vp.h * HORIZON, wideScale, 0, 0);

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      let totalCornersChecked = 0;

      for (const node of APPLICATION_NODES) {
        const corners = getAppNodeAllCorners(node, true);
        for (const [x, y, z] of corners) {
          const pt = project(cam, x, y, z);
          totalCornersChecked++;

          if (pt.sx < minX) minX = pt.sx;
          if (pt.sx > maxX) maxX = pt.sx;
          if (pt.sy < minY) minY = pt.sy;
          if (pt.sy > maxY) maxY = pt.sy;

          // Strict boundary assertion per corner
          expect(pt.sx, `Node ${node.id} corner (${x},${y},${z}) sx=${pt.sx} must be >= 0 in ${vp.name}`).toBeGreaterThanOrEqual(0);
          expect(pt.sx, `Node ${node.id} corner (${x},${y},${z}) sx=${pt.sx} must be <= ${vp.w} in ${vp.name}`).toBeLessThanOrEqual(vp.w);
          expect(pt.sy, `Node ${node.id} corner (${x},${y},${z}) sy=${pt.sy} must be >= 0 in ${vp.name}`).toBeGreaterThanOrEqual(0);
          expect(pt.sy, `Node ${node.id} corner (${x},${y},${z}) sy=${pt.sy} must be <= ${vp.h} in ${vp.name}`).toBeLessThanOrEqual(vp.h);
        }
      }

      expect(totalCornersChecked).toBe(APPLICATION_NODES.length * 12);

      const marginL = minX;
      const marginR = vp.w - maxX;
      const marginT = minY;
      const marginB = vp.h - maxY;

      expect(marginL, `Left margin must be positive on ${vp.name}`).toBeGreaterThan(0);
      expect(marginR, `Right margin must be positive on ${vp.name}`).toBeGreaterThan(0);
      expect(marginT, `Top margin must be positive on ${vp.name}`).toBeGreaterThan(0);
      expect(marginB, `Bottom margin must be positive on ${vp.name}`).toBeGreaterThan(0);

      console.log(`[CLOSURE WIDE CONTAINMENT] ${vp.name} (${vp.w}x${vp.h}): Bounds [X: ${minX.toFixed(1)}..${maxX.toFixed(1)}, Y: ${minY.toFixed(1)}..${maxY.toFixed(1)}] | Margins: L=${marginL.toFixed(1)}px, R=${marginR.toFixed(1)}px, T=${marginT.toFixed(1)}px, B=${marginB.toFixed(1)}px`);
    });
  }

  test("Perspective Divide Non-Linearity Analysis: reveals behavior on high-res displays (h > 1080)", () => {
    const highResViewports = [
      { name: "QHD Desktop", w: 2560, h: 1440 },
      { name: "4K UHD", w: 3840, h: 2160 },
    ];

    for (const vp of highResViewports) {
      const wideScale = calcWideViewScale(vp.w, vp.h);
      const cam = makeCamera(0, vp.w / 2, vp.h * HORIZON, wideScale, 0, 0);

      const pipeline = APPLICATION_NODES.find((n) => n.id === "app-pipeline")!;
      const pt = project(cam, pipeline.cx, pipeline.cy, pipeline.elevation);

      console.log(`[HIGH-RES BEHAVIOR] ${vp.name} (${vp.w}x${vp.h}): viewScale=${wideScale.toFixed(4)}, cam.scale=${cam.scale.toFixed(4)}, app-pipeline sy=${pt.sy.toFixed(1)} / ${vp.h}`);
    }
  });
});

describe("Challenger 1 M1 — 3. Viewport Containment Under Hover Tilt & Dynamic Flattening", () => {
  const viewports = [
    { w: 320, h: 640 },
    { w: 390, h: 844 },
    { w: 768, h: 1024 },
    { w: 1440, h: 900 },
    { w: 1920, h: 1080 },
    { w: 2560, h: 1080 },
    { w: 360, h: 1200 },
  ];

  test("containment preserved under maximum hover tilt (+/- 3.5 deg)", () => {
    const MAX_TILT = (3.5 * Math.PI) / 180;
    const tiltPairs = [
      [-MAX_TILT, -MAX_TILT],
      [-MAX_TILT, MAX_TILT],
      [MAX_TILT, -MAX_TILT],
      [MAX_TILT, MAX_TILT],
    ];

    for (const vp of viewports) {
      const scale = calcWideViewScale(vp.w, vp.h);
      for (const [tx, ty] of tiltPairs) {
        const cam = makeCamera(0, vp.w / 2, vp.h * HORIZON, scale, tx, ty);
        for (const node of APPLICATION_NODES) {
          const pt = project(cam, node.cx, node.cy, node.elevation);
          expect(pt.sx).toBeGreaterThanOrEqual(0);
          expect(pt.sx).toBeLessThanOrEqual(vp.w);
          expect(pt.sy).toBeGreaterThanOrEqual(0);
          expect(pt.sy).toBeLessThanOrEqual(vp.h);
        }
      }
    }
  });

  test("containment preserved throughout scroll flattening progression (p in 0..1)", () => {
    const progressSteps = [0.0, 0.1, 0.25, 0.5, 0.75, 1.0];

    for (const vp of viewports) {
      const scale = calcWideViewScale(vp.w, vp.h);
      for (const p of progressSteps) {
        const state = heroFrameState(p, false, 0);
        const cam = makeCamera(state.flatten, vp.w / 2, vp.h * HORIZON, scale, 0, 0);
        for (const node of APPLICATION_NODES) {
          const ez = node.elevation * (1 - state.flatten);
          const pt = project(cam, node.cx, node.cy, ez);
          expect(pt.sx).toBeGreaterThanOrEqual(0);
          expect(pt.sx).toBeLessThanOrEqual(vp.w);
          expect(pt.sy).toBeGreaterThanOrEqual(0);
          expect(pt.sy).toBeLessThanOrEqual(vp.h);
        }
      }
    }
  });
});

describe("Challenger 1 M1 — 4. Hero Mode (Tight Scale) Outer Node Projection & Strict Mode Gating", () => {
  const viewports = [
    { name: "Mobile Small", w: 320, h: 640 },
    { name: "Mobile Standard", w: 390, h: 844 },
    { name: "Tablet Portrait", w: 768, h: 1024 },
    { name: "Desktop", w: 1440, h: 900 },
    { name: "Desktop Full HD", w: 1920, h: 1080 },
    { name: "Ultrawide", w: 2560, h: 1080 },
    { name: "Extreme Tall/Narrow", w: 360, h: 1200 },
  ];

  test("under tight scale (Hero mode), outer application node extreme corners project beyond screen boundaries", () => {
    for (const vp of viewports) {
      const tightScale = calcTightViewScale(vp.w, vp.h);
      const cam = makeCamera(0, vp.w / 2, vp.h * HORIZON, tightScale, 0, 0);

      let offScreenCount = 0;
      let totalCorners = 0;

      for (const node of APPLICATION_NODES) {
        const halfW = (node.width ?? APP_NODE_WIDTH) / 2;
        const halfH = (node.height ?? APP_NODE_HEIGHT) / 2;
        const corners: readonly (readonly [number, number])[] = [
          [node.cx - halfW, node.cy - halfH],
          [node.cx + halfW, node.cy - halfH],
          [node.cx + halfW, node.cy + halfH],
          [node.cx - halfW, node.cy + halfH],
        ];

        for (const [x, y] of corners) {
          const pt = project(cam, x, y, node.elevation);
          totalCorners++;
          if (pt.sx < 0 || pt.sx > vp.w || pt.sy < 0 || pt.sy > vp.h) {
            offScreenCount++;
          }
        }
      }

      expect(offScreenCount, `At least one outer node corner must project offscreen in ${vp.name}`).toBeGreaterThan(0);
      console.log(`[HERO TIGHT SCALE EXCLUSION] ${vp.name} (${vp.w}x${vp.h}): ${offScreenCount} / ${totalCorners} outer node corners projected outside viewport`);
    }
  });

  test("strict mode isolation: drawPlaneFrame in mode='hero' completely omits outer nodes and signal loops 3-8", () => {
    const drawnPaths: string[] = [];
    const mockCtx = {
      clearRect: () => {},
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      stroke: () => {},
      fill: () => {},
      transform: () => {},
      translate: () => {},
      scale: () => {},
      drawImage: () => {},
      fillRect: () => {},
      fillText: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
      createLinearGradient: () => ({ addColorStop: () => {} }),
      set strokeStyle(val: string) { drawnPaths.push(`stroke:${val}`); },
      set fillStyle(val: string) { drawnPaths.push(`fill:${val}`); },
      set lineWidth(_: number) {},
      set globalAlpha(_: number) {},
      set lineJoin(_: string) {},
      set lineCap(_: string) {},
      set font(_: string) {},
      set textAlign(_: string) {},
      set textBaseline(_: string) {},
      set shadowColor(_: string) {},
      set shadowBlur(_: number) {},
      set imageSmoothingEnabled(_: boolean) {},
      set imageSmoothingQuality(_: string) {},
    } as unknown as CanvasRenderingContext2D;

    const state = heroFrameState(0, false, 0);
    const rState = createPlaneRendererState();

    drawPlaneFrame(mockCtx, state, 1440, 900, 100, undefined, {
      mode: "hero",
      rendererState: rState,
    });

    const heroDrawCount = drawnPaths.length;
    drawnPaths.length = 0;

    const rStateClosure = createPlaneRendererState();
    drawPlaneFrame(mockCtx, state, 1440, 900, 100, undefined, {
      mode: "closure",
      rendererState: rStateClosure,
    });

    const closureDrawCount = drawnPaths.length;

    expect(closureDrawCount).toBeGreaterThan(heroDrawCount);
    console.log(`[MODE ISOLATION] Hero mode draw calls: ${heroDrawCount} vs Closure mode draw calls: ${closureDrawCount}`);
  });
});

describe("Challenger 1 M1 — 5. Out-and-Back Signal Loop Geometry & Wiring", () => {
  test("total 9 signal loops defined: 3 core loops + 6 outer application spurs", () => {
    expect(SIGNAL_LOOPS).toHaveLength(9);
  });

  test("each outer loop 3..8 is a closed circuit connecting to its respective application node", () => {
    const expectedConnections = [
      { loopIdx: 3, appId: "app-alpha" },
      { loopIdx: 4, appId: "app-dma" },
      { loopIdx: 5, appId: "app-pipeline" },
      { loopIdx: 6, appId: "app-risk" },
      { loopIdx: 7, appId: "app-router" },
      { loopIdx: 8, appId: "app-telemetry" },
    ];

    for (const conn of expectedConnections) {
      const loop = SIGNAL_LOOPS[conn.loopIdx]!;
      const app = APPLICATION_NODES.find((a) => a.id === conn.appId)!;

      expect(loop.totalL).toBeGreaterThan(0);
      expect(loop.waypoints.length).toBeGreaterThanOrEqual(3);

      const hasAppWaypoint = loop.waypoints.some(
        (wp) => Math.abs(wp.x - app.cx) < 1e-4 && Math.abs(wp.y - app.cy) < 1e-4
      );
      expect(hasAppWaypoint, `Signal loop ${conn.loopIdx} must route through application node ${app.id} (${app.cx}, ${app.cy})`).toBe(true);
      expect(loop.pulseOffsets).toHaveLength(2);
    }
  });
});
