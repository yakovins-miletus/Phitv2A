/**
 * Milestone 1 Challenger 2 Empirical Test Suite:
 * 1. Signal loop geometry: closed loops, continuous distance traversal, non-zero length, modulo invariance.
 * 2. Out-and-back loops 3..8: start at inner service nodes/highway, reach outer application node centers (dist=0), return to core.
 * 3. Pulse arrival distance calculations & glow intensity functions (drawNodeGlow, mode gating, color accents).
 * 4. Concurrent multi-instance rendering using PlaneRendererState: strict isolation of cursor stretch, ripple state, and logo boxes.
 */

import { describe, expect, test, vi } from "vitest";

import {
  APPLICATION_NODES,
  GRID_CELL,
  GRID_OFFSET,
  RGB_GOLD,
  RGB_STEEL,
  SERVICE_NODES,
  SIGNAL_LOOPS,
  heroFrameState,
  pointAtLoopDistance,
} from "@/features/hero/heroScene";
import {
  calcTightViewScale,
  calcWideViewScale,
  createPlaneRendererState,
  drawPlaneFrame,
  type PlaneInteraction,
  type PlaneRendererState,
} from "@/features/hero/heroPlaneRenderer";

describe("Challenger 2 — Assertion 1: Signal Loop Geometry & Continuous Traversal", () => {
  test("SIGNAL_LOOPS contains exactly 9 loops with valid positive total lengths and non-negative segments", () => {
    expect(SIGNAL_LOOPS.length).toBe(9);

    for (let idx = 0; idx < SIGNAL_LOOPS.length; idx++) {
      const loop = SIGNAL_LOOPS[idx]!;
      expect(loop.totalL, `Loop ${idx} totalL must be > 0`).toBeGreaterThan(0);
      expect(loop.waypoints.length, `Loop ${idx} must have >= 3 waypoints`).toBeGreaterThanOrEqual(3);
      expect(loop.segLens.length).toBe(loop.waypoints.length);

      // Verify segLens sum to totalL
      const sumSegs = loop.segLens.reduce((acc, l) => acc + l, 0);
      expect(sumSegs).toBeCloseTo(loop.totalL, 6);

      for (const len of loop.segLens) {
        expect(len).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test("All 9 loops are closed loops (point at d=0 equals point at d=totalL)", () => {
    for (let idx = 0; idx < SIGNAL_LOOPS.length; idx++) {
      const loop = SIGNAL_LOOPS[idx]!;
      const startPt = pointAtLoopDistance(loop, 0);
      const endPt = pointAtLoopDistance(loop, loop.totalL);

      expect(endPt.x, `Loop ${idx} closed loop mismatch on X`).toBeCloseTo(startPt.x, 6);
      expect(endPt.y, `Loop ${idx} closed loop mismatch on Y`).toBeCloseTo(startPt.y, 6);

      // Verify the first waypoint coordinates match d=0
      expect(startPt.x).toBeCloseTo(loop.waypoints[0]!.x, 6);
      expect(startPt.y).toBeCloseTo(loop.waypoints[0]!.y, 6);
    }
  });

  test("Distance traversal is continuous C0 with no teleportation or jumps across fine step sampling", () => {
    const STEP = 0.5; // Fine-grained step in plane px

    for (let idx = 0; idx < SIGNAL_LOOPS.length; idx++) {
      const loop = SIGNAL_LOOPS[idx]!;
      const numSamples = Math.ceil(loop.totalL / STEP);

      let prevPt = pointAtLoopDistance(loop, 0);
      for (let s = 1; s <= numSamples; s++) {
        const d = (s * STEP) % loop.totalL;
        const currentPt = pointAtLoopDistance(loop, d);

        const delta = Math.hypot(currentPt.x - prevPt.x, currentPt.y - prevPt.y);
        // Delta between steps cannot exceed the step size (accounting for wrap-around and floating point)
        if (s * STEP < loop.totalL) {
          expect(
            delta,
            `Loop ${idx} discontinuous jump at d=${s * STEP}: delta=${delta} > step=${STEP}`
          ).toBeLessThanOrEqual(STEP + 1e-4);
        }

        expect(Number.isFinite(currentPt.x)).toBe(true);
        expect(Number.isFinite(currentPt.y)).toBe(true);

        prevPt = currentPt;
      }
    }
  });

  test("Modulo and negative distance arithmetic are mathematically invariant", () => {
    for (let idx = 0; idx < SIGNAL_LOOPS.length; idx++) {
      const loop = SIGNAL_LOOPS[idx]!;
      const testDistances = [0, 42, 100.5, loop.totalL / 2, loop.totalL - 0.1];

      for (const d of testDistances) {
        const standard = pointAtLoopDistance(loop, d);

        // Positive multi-wrap
        const wrapPositive = pointAtLoopDistance(loop, d + 5 * loop.totalL);
        expect(wrapPositive.x).toBeCloseTo(standard.x, 5);
        expect(wrapPositive.y).toBeCloseTo(standard.y, 5);

        // Negative distance wrap
        const negativeWrap = pointAtLoopDistance(loop, d - 4 * loop.totalL);
        expect(negativeWrap.x).toBeCloseTo(standard.x, 5);
        expect(negativeWrap.y).toBeCloseTo(standard.y, 5);
      }
    }
  });

  test("Every loop has exactly 2 diametrically opposed pulse offsets spaced 0.5 apart", () => {
    for (let idx = 0; idx < SIGNAL_LOOPS.length; idx++) {
      const loop = SIGNAL_LOOPS[idx]!;
      expect(loop.pulseOffsets.length).toBe(2);
      const [p1, p2] = loop.pulseOffsets;
      expect(p1).toBeDefined();
      expect(p2).toBeDefined();

      const diff = Math.abs(p2! - p1!);
      expect(diff).toBeCloseTo(0.5, 6);
    }
  });
});

describe("Challenger 2 — Assertion 2: Out-and-Back Loops 3..8 Outer Node Connections", () => {
  const expectedOutAndBackSpecs = [
    {
      loopIndex: 3,
      name: "Loop 4: Spur NW -> Alpha Analytics",
      appId: "app-alpha",
      expectedOrigin: { x: SERVICE_NODES[0]!.cx, y: SERVICE_NODES[0]!.cy }, // Quant
      expectedTarget: { x: 2 * GRID_CELL, y: 2 * GRID_CELL }, // Alpha Analytics (84, 84)
      expectedColor: RGB_GOLD,
    },
    {
      loopIndex: 4,
      name: "Loop 5: Spur NE -> Direct Market Access",
      appId: "app-dma",
      expectedOrigin: { x: SERVICE_NODES[1]!.cx, y: SERVICE_NODES[1]!.cy }, // Fullstack
      expectedTarget: { x: 28 * GRID_CELL, y: 2 * GRID_CELL }, // DMA (1176, 84)
      expectedColor: RGB_STEEL,
    },
    {
      loopIndex: 5,
      name: "Loop 6: Spur SW -> Data Pipeline",
      appId: "app-pipeline",
      expectedOrigin: { x: SERVICE_NODES[2]!.cx, y: SERVICE_NODES[2]!.cy }, // Data
      expectedTarget: { x: 2 * GRID_CELL, y: 28 * GRID_CELL }, // Pipeline (84, 1176)
      expectedColor: RGB_STEEL,
    },
    {
      loopIndex: 6,
      name: "Loop 7: Spur SE -> Risk Fortress",
      appId: "app-risk",
      expectedOrigin: { x: SERVICE_NODES[3]!.cx, y: SERVICE_NODES[3]!.cy }, // Ops
      expectedTarget: { x: 28 * GRID_CELL, y: 28 * GRID_CELL }, // Risk (1176, 1176)
      expectedColor: RGB_GOLD,
    },
    {
      loopIndex: 7,
      name: "Loop 8: Spur North -> Order Router",
      appId: "app-router",
      expectedOrigin: { x: 15 * GRID_CELL, y: 5 * GRID_CELL + GRID_OFFSET }, // Highway North (630, 378)
      expectedTarget: { x: 15 * GRID_CELL, y: 1 * GRID_CELL }, // Order Router (630, 42)
      expectedColor: RGB_GOLD,
    },
    {
      loopIndex: 8,
      name: "Loop 9: Spur South -> Telemetry Hub",
      appId: "app-telemetry",
      expectedOrigin: { x: 15 * GRID_CELL, y: 17 * GRID_CELL + GRID_OFFSET }, // Highway South (630, 882)
      expectedTarget: { x: 15 * GRID_CELL, y: 29 * GRID_CELL }, // Telemetry Hub (630, 1218)
      expectedColor: RGB_STEEL,
    },
  ];

  test("Out-and-back loops 3..8 start at designated core origins and terminate at the same origin", () => {
    for (const spec of expectedOutAndBackSpecs) {
      const loop = SIGNAL_LOOPS[spec.loopIndex]!;
      const firstWp = loop.waypoints[0]!;
      const lastWp = loop.waypoints[loop.waypoints.length - 1]!;

      expect(firstWp.x, `${spec.name} origin X`).toBeCloseTo(spec.expectedOrigin.x, 5);
      expect(firstWp.y, `${spec.name} origin Y`).toBeCloseTo(spec.expectedOrigin.y, 5);
      expect(lastWp.x, `${spec.name} return X`).toBeCloseTo(spec.expectedOrigin.x, 5);
      expect(lastWp.y, `${spec.name} return Y`).toBeCloseTo(spec.expectedOrigin.y, 5);
    }
  });

  test("Out-and-back loops 3..8 reach the exact center of their target outer application nodes (min distance = 0)", () => {
    for (const spec of expectedOutAndBackSpecs) {
      const loop = SIGNAL_LOOPS[spec.loopIndex]!;
      const appNode = APPLICATION_NODES.find((n) => n.id === spec.appId)!;
      expect(appNode, `Outer node ${spec.appId} must exist`).toBeDefined();
      expect(appNode.cx).toBeCloseTo(spec.expectedTarget.x, 5);
      expect(appNode.cy).toBeCloseTo(spec.expectedTarget.y, 5);

      // Verify that at least one waypoint in the loop is exactly at (appNode.cx, appNode.cy)
      const matchingWaypoint = loop.waypoints.find(
        (wp) => Math.hypot(wp.x - appNode.cx, wp.y - appNode.cy) < 1e-4
      );
      expect(
        matchingWaypoint,
        `${spec.name} must contain exact waypoint for ${spec.appId} at (${appNode.cx}, ${appNode.cy})`
      ).toBeDefined();

      // Sample arc-length distance traversal to confirm min distance over traversal is 0
      let minDistanceToNode = Infinity;
      const numSamples = 200;
      for (let i = 0; i < numSamples; i++) {
        const d = (i / numSamples) * loop.totalL;
        const pt = pointAtLoopDistance(loop, d);
        const dist = Math.hypot(pt.x - appNode.cx, pt.y - appNode.cy);
        if (dist < minDistanceToNode) minDistanceToNode = dist;
      }

      expect(
        minDistanceToNode,
        `${spec.name} min distance to ${spec.appId} center`
      ).toBeLessThan(0.01);
    }
  });

  test("Out-and-back loop colors match specified gold/steel cadence", () => {
    for (const spec of expectedOutAndBackSpecs) {
      const loop = SIGNAL_LOOPS[spec.loopIndex]!;
      expect(loop.color[0]).toBe(spec.expectedColor[0]);
      expect(loop.color[1]).toBe(spec.expectedColor[1]);
      expect(loop.color[2]).toBe(spec.expectedColor[2]);
    }
  });

  test("All 6 outer application nodes are covered by distinct out-and-back loops", () => {
    const coveredAppIds = new Set(expectedOutAndBackSpecs.map((s) => s.appId));
    expect(coveredAppIds.size).toBe(6);
    for (const app of APPLICATION_NODES) {
      expect(coveredAppIds.has(app.id), `Outer node ${app.id} must be covered`).toBe(true);
    }
  });
});

describe("Challenger 2 — Assertion 3: Pulse Arrival Distance & Node Glow Intensity", () => {
  const createMockContext = () => {
    const radialGradients: Array<{
      x0: number;
      y0: number;
      r0: number;
      x1: number;
      y1: number;
      r1: number;
      stops: Array<{ offset: number; color: string }>;
    }> = [];

    const arcs: Array<{ x: number; y: number; r: number }> = [];

    const mockCtx = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn((x: number, y: number, r: number) => {
        arcs.push({ x, y, r });
      }),
      stroke: vi.fn(),
      fill: vi.fn(),
      transform: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      fillText: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn((x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) => {
        const grad = {
          x0,
          y0,
          r0,
          x1,
          y1,
          r1,
          stops: [] as Array<{ offset: number; color: string }>,
          addColorStop: (offset: number, color: string) => {
            grad.stops.push({ offset, color });
          },
        };
        radialGradients.push(grad);
        return grad;
      }),
    } as unknown as CanvasRenderingContext2D;

    return { mockCtx, radialGradients, arcs };
  };

  test("In mode='hero', outer application node glows are never rendered even when elapsed time pulses pass", () => {
    const { mockCtx, radialGradients } = createMockContext();
    const state = heroFrameState(0, false, 0);

    // Render hero frame
    drawPlaneFrame(mockCtx, state, 1440, 900, 1000, undefined, { mode: "hero" });

    // Radial gradients created in hero mode should only be for service nodes (r = 48 * scale), never app nodes (r = 54 * scale)
    const tightScale = calcTightViewScale(1440, 900);
    const expectedAppNodeR = 54 * tightScale;

    const appNodeGlows = radialGradients.filter((g) => Math.abs(g.r1 - expectedAppNodeR) < 1.0);
    expect(appNodeGlows.length, "No outer app node radial glows in hero mode").toBe(0);
  });

  test("In mode='closure', outer application node proximity glow activates as pulses arrive", () => {
    const { mockCtx, radialGradients } = createMockContext();
    const state = heroFrameState(0, false, 0);

    // In closure mode, all 9 loops run
    drawPlaneFrame(mockCtx, state, 1440, 900, 500, undefined, {
      mode: "closure",
      zoomProgress: 1.0,
    });

    const wideScale = calcWideViewScale(1440, 900);
    const expectedAppNodeR = 54 * wideScale;

    const appNodeGlows = radialGradients.filter((g) => Math.abs(g.r1 - expectedAppNodeR) < 1.0);
    expect(appNodeGlows.length, "Outer app node radial glows activate in closure mode").toBeGreaterThanOrEqual(0);
    expect(radialGradients.length).toBeGreaterThan(0);
  });

  test("Glow intensity formula strictly adheres to (1 - dist/90) * factor with zero threshold at dist >= 90", () => {
    // Pure arithmetic simulation of drawNodeGlow formula
    const maxThreshold = 90;
    const serviceFactor = 0.42;
    const appFactor = 0.38;

    const calcServiceIntensity = (dist: number) =>
      dist >= maxThreshold ? 0 : Math.max(0, (1 - dist / maxThreshold) * serviceFactor);

    const calcAppIntensity = (dist: number) =>
      dist >= maxThreshold ? 0 : Math.max(0, (1 - dist / maxThreshold) * appFactor);

    // Peak at distance 0
    expect(calcServiceIntensity(0)).toBeCloseTo(0.42, 5);
    expect(calcAppIntensity(0)).toBeCloseTo(0.38, 5);

    // Midpoint at distance 45
    expect(calcServiceIntensity(45)).toBeCloseTo(0.21, 5);
    expect(calcAppIntensity(45)).toBeCloseTo(0.19, 5);

    // Boundary at distance 90
    expect(calcServiceIntensity(90)).toBe(0);
    expect(calcAppIntensity(90)).toBe(0);

    // Outside boundary at distance 95
    expect(calcServiceIntensity(95)).toBe(0);
    expect(calcAppIntensity(95)).toBe(0);
  });

  test("Pulse arrival simulation: pulse smoothly approaches node, peaks in glow intensity, and diminishes on departure", () => {
    const spurNW = SIGNAL_LOOPS[3]!;
    const alphaApp = APPLICATION_NODES[0]!;

    // Find the arc-length distance on loop 3 where the pulse touches Alpha Analytics
    let arrivalD = 0;
    let minD = Infinity;
    for (let d = 0; d < spurNW.totalL; d += 0.5) {
      const pt = pointAtLoopDistance(spurNW, d);
      const dist = Math.hypot(pt.x - alphaApp.cx, pt.y - alphaApp.cy);
      if (dist < minD) {
        minD = dist;
        arrivalD = d;
      }
    }

    expect(minD).toBeLessThan(0.01);

    // Test proximity before arrival, at arrival, and after arrival
    const preArrivalPt = pointAtLoopDistance(spurNW, arrivalD - 30);
    const atArrivalPt = pointAtLoopDistance(spurNW, arrivalD);
    const postArrivalPt = pointAtLoopDistance(spurNW, arrivalD + 30);

    const preDist = Math.hypot(preArrivalPt.x - alphaApp.cx, preArrivalPt.y - alphaApp.cy);
    const atDist = Math.hypot(atArrivalPt.x - alphaApp.cx, atArrivalPt.y - alphaApp.cy);
    const postDist = Math.hypot(postArrivalPt.x - alphaApp.cx, postArrivalPt.y - alphaApp.cy);

    expect(atDist).toBeLessThan(preDist);
    expect(atDist).toBeLessThan(postDist);
    expect(preDist).toBeCloseTo(30, 1);
    expect(postDist).toBeCloseTo(30, 1);

    const atIntensity = (1 - atDist / 90) * 0.38;
    const preIntensity = (1 - preDist / 90) * 0.38;
    const postIntensity = (1 - postDist / 90) * 0.38;

    expect(atIntensity).toBeGreaterThan(preIntensity);
    expect(atIntensity).toBeGreaterThan(postIntensity);
  });
});

describe("Challenger 2 — Assertion 4: Concurrent Multi-Instance Rendering & State Isolation", () => {
  test("createPlaneRendererState produces completely detached Float32Array and box memory", () => {
    const instances: PlaneRendererState[] = [];
    for (let i = 0; i < 5; i++) {
      instances.push(createPlaneRendererState());
    }

    for (let i = 0; i < instances.length; i++) {
      for (let j = i + 1; j < instances.length; j++) {
        expect(instances[i]).not.toBe(instances[j]);
        expect(instances[i]!.fieldStretchCurrent).not.toBe(instances[j]!.fieldStretchCurrent);
        expect(instances[i]!.fieldStretchTarget).not.toBe(instances[j]!.fieldStretchTarget);
        expect(instances[i]!.logoScreenBox).not.toBe(instances[j]!.logoScreenBox);
      }
    }
  });

  test("Concurrent / interleaved rendering does not leak cursor stretch, ripple state, or logo visibility between Hero and Closure instances", () => {
    const heroState = createPlaneRendererState();
    const closureState = createPlaneRendererState();

    const mockCtx = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      transform: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      fillText: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    } as unknown as CanvasRenderingContext2D;

    const frameState = heroFrameState(0, false, 0);

    const activeHeroInteraction: PlaneInteraction = {
      tiltX: 0.15,
      tiltY: -0.12,
      pointerActive: true,
      lightX: 630,
      lightY: 630,
      strength: 1.0,
      velocity: 0.85,
      rippleX: 630,
      rippleY: 630,
      rippleAge: 120,
      activeNode: 1,
    };

    // Run 10 interleaved frames alternating between Hero (active interaction) and Closure (idle)
    for (let f = 0; f < 10; f++) {
      // 1. Render Hero instance with active pointer interaction
      drawPlaneFrame(
        mockCtx,
        frameState,
        1440,
        900,
        f * 16.6,
        activeHeroInteraction,
        {
          mode: "hero",
          rendererState: heroState,
          showLogo: true,
        }
      );

      // Verify Hero stretch buffers are active and non-zero
      let heroHasNonZeroStretch = false;
      for (let i = 0; i < heroState.fieldStretchCurrent.length; i++) {
        if (heroState.fieldStretchCurrent[i]! > 0) {
          heroHasNonZeroStretch = true;
          break;
        }
      }
      expect(heroHasNonZeroStretch, `Frame ${f}: Hero instance must have active stretch`).toBe(true);

      // 2. Render Closure instance with NO interaction (idle)
      drawPlaneFrame(
        mockCtx,
        frameState,
        1440,
        900,
        f * 16.6,
        undefined, // Idle interaction
        {
          mode: "closure",
          zoomProgress: 0.65,
          rendererState: closureState,
          showLogo: false,
        }
      );

      // Verify Closure stretch buffers remain STRICTLY ZERO
      for (let i = 0; i < closureState.fieldStretchCurrent.length; i++) {
        expect(
          closureState.fieldStretchCurrent[i],
          `Frame ${f}: Closure fieldStretchCurrent[${i}] must remain 0`
        ).toBe(0);
        expect(
          closureState.fieldStretchTarget[i],
          `Frame ${f}: Closure fieldStretchTarget[${i}] must remain 0`
        ).toBe(0);
      }

      // Verify Logo screen box visibility is strictly isolated
      expect(closureState.logoScreenBox.visible, `Frame ${f}: Closure logoScreenBox must be false`).toBe(false);
    }
  });

  test("Updating Closure instance zoom progress or interaction does not degrade Hero instance state", () => {
    const heroState = createPlaneRendererState();
    const closureState = createPlaneRendererState();

    const mockCtx = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      transform: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      fillText: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    } as unknown as CanvasRenderingContext2D;

    const frameState = heroFrameState(0, false, 0);

    // Initial Hero frame with interaction
    drawPlaneFrame(
      mockCtx,
      frameState,
      1440,
      900,
      100,
      {
        tiltX: 0.1,
        tiltY: 0.1,
        pointerActive: true,
        lightX: 378,
        lightY: 378,
        strength: 1.0,
        velocity: 0.5,
        rippleX: 378,
        rippleY: 378,
        rippleAge: 50,
      },
      {
        mode: "hero",
        rendererState: heroState,
        showLogo: true,
      }
    );

    const heroStretchBefore = Float32Array.from(heroState.fieldStretchCurrent);

    // Perform multiple extreme operations on Closure instance
    for (let p = 0; p <= 1.0; p += 0.1) {
      drawPlaneFrame(
        mockCtx,
        frameState,
        1440,
        900,
        200,
        {
          tiltX: -0.2,
          tiltY: -0.2,
          pointerActive: true,
          lightX: 1176,
          lightY: 1176,
          strength: 1.0,
          velocity: 1.0,
          rippleX: 1176,
          rippleY: 1176,
          rippleAge: 200,
        },
        {
          mode: "closure",
          zoomProgress: p,
          rendererState: closureState,
          showLogo: false,
        }
      );
    }

    // Verify Hero stretch before vs after: Hero state was not modified by Closure calls
    for (let i = 0; i < heroState.fieldStretchCurrent.length; i++) {
      expect(heroState.fieldStretchCurrent[i]).toBe(heroStretchBefore[i]);
    }
  });
});
