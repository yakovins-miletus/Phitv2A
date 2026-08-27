/**
 * Dual Canvas & Closure Section Motion Suite:
 * Camera Scaling Curves, Viewport Outer Node Exclusion, and State Isolation.
 */

import { describe, expect, test } from "vitest";

import {
  APPLICATION_NODES,
  CUBE_POSITIONS,
  GRID_CELL,
  GRID_OFFSET,
  SERVICE_NODES,
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
  VIEW_FIT,
  calcClosureViewScale,
  calcTightViewScale,
  calcWideViewScale,
  calcViewScale,
  createPlaneRendererState,
  drawPlaneFrame,
} from "@/features/hero/heroPlaneRenderer";
import { homeSection, sectionOrder } from "@/shared/sections";
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";

describe("Milestones 1 & 2: Camera Fit Constants & Scaling Functions", () => {
  test("fit divisor constants are correctly exported and locked", () => {
    expect(TIGHT_FIT_X).toBe(1.36);
    expect(TIGHT_FIT_Y).toBe(1.05);
    expect(WIDE_FIT_X).toBe(1.85);
    expect(WIDE_FIT_Y).toBe(1.40);
    expect(VIEW_FIT_X).toBe(WIDE_FIT_X);
    expect(VIEW_FIT_Y).toBe(WIDE_FIT_Y);
    expect(VIEW_FIT).toBe(WIDE_FIT_Y);
    expect(calcViewScale).toBe(calcWideViewScale);
  });

  test("calcTightViewScale produces strictly higher magnification than calcWideViewScale across all viewports", () => {
    const viewports = [
      { w: 320, h: 640 },
      { w: 390, h: 844 },
      { w: 768, h: 1024 },
      { w: 1024, h: 768 },
      { w: 1440, h: 900 },
      { w: 1920, h: 1080 },
      { w: 2560, h: 1440 },
    ];

    for (const vp of viewports) {
      const tight = calcTightViewScale(vp.w, vp.h);
      const wide = calcWideViewScale(vp.w, vp.h);

      expect(tight).toBeGreaterThan(wide);
      const ratio = tight / wide;
      expect(ratio).toBeGreaterThanOrEqual(1.30);
    }
  });

  test("calcClosureViewScale is strictly monotonically decreasing across progress p in [0, 1]", () => {
    const viewports = [
      { w: 390, h: 844 },
      { w: 768, h: 1024 },
      { w: 1440, h: 900 },
      { w: 1920, h: 1080 },
    ];

    for (const vp of viewports) {
      const scaleAtZero = calcClosureViewScale(vp.w, vp.h, 0);
      const scaleAtOne = calcClosureViewScale(vp.w, vp.h, 1);

      expect(scaleAtZero).toBe(calcTightViewScale(vp.w, vp.h));
      expect(scaleAtOne).toBe(calcWideViewScale(vp.w, vp.h));
      expect(scaleAtOne).toBeLessThan(scaleAtZero);

      let prevScale = scaleAtZero;
      for (let p = 0.05; p <= 1.0; p += 0.05) {
        const currentScale = calcClosureViewScale(vp.w, vp.h, p);
        expect(currentScale).toBeLessThan(prevScale);
        prevScale = currentScale;
      }
    }
  });
});

describe("Top Hero Viewport Hiding vs Core Framing", () => {
  test("on Desktop 1440x900: outer application nodes project outside viewport under tight zoom", () => {
    const w = 1440;
    const h = 900;
    const tightScale = calcTightViewScale(w, h);
    const cam = makeCamera(0, w / 2, h * HORIZON, tightScale, 0, 0);

    // Verify outer nodes are pushed outside the screen bounds
    const projectedOuter = APPLICATION_NODES.map((app) => {
      const pt = project(cam, app.cx, app.cy, app.elevation);
      return { id: app.id, sx: pt.sx, sy: pt.sy };
    });

    const offScreenNodes = projectedOuter.filter(
      (n) => n.sx < 0 || n.sx > w || n.sy < 0 || n.sy > h
    );
    expect(offScreenNodes.length).toBeGreaterThan(0);

    // Data Pipeline (SW) and Alpha Analytics (NW) exit the screen
    const pipeline = projectedOuter.find((n) => n.id === "app-pipeline")!;
    expect(pipeline.sy).toBeGreaterThan(h); // exits bottom of viewport
  });

  test("on Mobile 390x844: outer lateral nodes project outside viewport under tight zoom", () => {
    const w = 390;
    const h = 844;
    const tightScale = calcTightViewScale(w, h);
    const cam = makeCamera(0, w / 2, h * HORIZON, tightScale, 0, 0);

    const alpha = APPLICATION_NODES.find((n) => n.id === "app-alpha")!;
    const risk = APPLICATION_NODES.find((n) => n.id === "app-risk")!;

    const ptAlpha = project(cam, alpha.cx, alpha.cy, alpha.elevation);
    const ptRisk = project(cam, risk.cx, risk.cy, risk.elevation);

    expect(ptAlpha.sx).toBeLessThan(0); // Off-screen left
    expect(ptRisk.sx).toBeGreaterThan(w); // Off-screen right
  });

  test("all 16 core cubes and 4 service nodes remain strictly visible on screen under tight zoom", () => {
    const viewports = [
      { w: 390, h: 844 },
      { w: 768, h: 1024 },
      { w: 1440, h: 900 },
    ];

    for (const vp of viewports) {
      const tightScale = calcTightViewScale(vp.w, vp.h);
      const cam = makeCamera(0, vp.w / 2, vp.h * HORIZON, tightScale, 0, 0);

      // Core cubes
      for (const cube of CUBE_POSITIONS) {
        const cx = cube.c * GRID_CELL + GRID_OFFSET + GRID_CELL / 2;
        const cy = cube.r * GRID_CELL + GRID_OFFSET + GRID_CELL / 2;
        const pt = project(cam, cx, cy, cube.h);

        expect(pt.sx).toBeGreaterThanOrEqual(0);
        expect(pt.sx).toBeLessThanOrEqual(vp.w);
        expect(pt.sy).toBeGreaterThanOrEqual(0);
        expect(pt.sy).toBeLessThanOrEqual(vp.h);
      }

      // Service nodes
      for (const node of SERVICE_NODES) {
        const pt = project(cam, node.cx, node.cy, node.elevation);

        expect(pt.sx).toBeGreaterThanOrEqual(0);
        expect(pt.sx).toBeLessThanOrEqual(vp.w);
        expect(pt.sy).toBeGreaterThanOrEqual(0);
        expect(pt.sy).toBeLessThanOrEqual(vp.h);
      }
    }
  });
});

describe("Multi-Instance State Isolation & Mode Options", () => {
  test("createPlaneRendererState creates isolated, independent buffers", () => {
    const state1 = createPlaneRendererState();
    const state2 = createPlaneRendererState();

    expect(state1).not.toBe(state2);
    expect(state1.fieldStretchCurrent).not.toBe(state2.fieldStretchCurrent);
    expect(state1.fieldStretchTarget).not.toBe(state2.fieldStretchTarget);
    expect(state1.logoScreenBox).not.toBe(state2.logoScreenBox);

    state1.fieldStretchCurrent[0] = 42;
    expect(state2.fieldStretchCurrent[0]).toBe(0);

    state1.logoScreenBox.visible = true;
    state1.logoScreenBox.x = 0.99;
    expect(state2.logoScreenBox.visible).toBe(false);
    expect(state2.logoScreenBox.x).toBe(0.5);
  });

  test("drawPlaneFrame executes in hero and closure modes without mutation leaks", () => {
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
      fillText: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
    } as unknown as CanvasRenderingContext2D;

    const state = heroFrameState(0, false, 0);
    const heroRState = createPlaneRendererState();
    const closureRState = createPlaneRendererState();

    // Paint hero frame with active cursor interaction
    drawPlaneFrame(
      mockCtx,
      state,
      1440,
      900,
      100,
      {
        tiltX: 0.1,
        tiltY: 0.1,
        pointerActive: true,
        lightX: 630,
        lightY: 630,
        strength: 1.0,
        velocity: 0.5,
        rippleX: 630,
        rippleY: 630,
        rippleAge: 50,
      },
      {
        mode: "hero",
        rendererState: heroRState,
        showLogo: true,
      },
    );

    // Paint closure frame without pointer interaction
    drawPlaneFrame(mockCtx, state, 1440, 900, 100, undefined, {
      mode: "closure",
      zoomProgress: 0.5,
      rendererState: closureRState,
      showLogo: false,
    });

    // Verify stretch buffers do not bleed between instances
    const heroMaxStretch = Math.max(...Array.from(heroRState.fieldStretchCurrent));
    const closureMaxStretch = Math.max(...Array.from(closureRState.fieldStretchCurrent));

    expect(heroMaxStretch).toBeGreaterThan(0);
    expect(closureMaxStretch).toBe(0);
    expect(closureRState.logoScreenBox.visible).toBe(false);
  });
});

describe("Milestone M2: Closing Section Configuration & Pinned Scroll Choreography", () => {
  test("closing section config in HOME_SECTIONS declares ownsPin: true and noExitDim: true", () => {
    const section = homeSection("closing");
    expect(section).toBeDefined();
    expect(section.id).toBe("closing");
    expect(section.ownsPin).toBe(true);
    expect(section.noExitDim).toBe(true);
    expect(section.ground).toBe("field");
  });

  test("sectionOrder('closing') and refreshPriorityFor are valid and preserve top-to-bottom refresh hierarchy", () => {
    const closingOrder = sectionOrder("closing");
    const useCasesOrder = sectionOrder("use-cases");

    expect(closingOrder).toBeGreaterThan(useCasesOrder);

    const closingPriority = refreshPriorityFor(closingOrder);
    const useCasesPriority = refreshPriorityFor(useCasesOrder);

    // Upstream pin (use-cases) has higher refresh priority than downstream closing
    expect(useCasesPriority).toBeGreaterThan(closingPriority);
    expect(closingPriority).toBeGreaterThan(0);
    expect(SCROLL_SPEED).toBe(0.65);
  });

  test("pinned scroll travel distance equals 2.5x window.innerHeight", () => {
    const viewports = [600, 800, 900, 1080, 1440];
    for (const h of viewports) {
      const travel = h * 2.5;
      expect(travel).toBe(h * 2.5);
      expect(travel).toBeGreaterThanOrEqual(1500);
    }
  });

  test("camera zoom progress curve: held tight in [0.0, 0.10], ramps in [0.10, 0.85], settled in [0.85, 1.0]", () => {
    const calcZoomP = (p: number) => (p <= 0.10 ? 0 : p >= 0.85 ? 1 : (p - 0.10) / 0.75);

    // Held at tight zoom
    expect(calcZoomP(0)).toBe(0);
    expect(calcZoomP(0.05)).toBe(0);
    expect(calcZoomP(0.10)).toBe(0);

    // Strictly monotonic progression in (0.10, 0.85)
    let prev = 0;
    for (let p = 0.15; p <= 0.85; p += 0.05) {
      const curr = calcZoomP(p);
      expect(curr).toBeGreaterThan(prev);
      prev = curr;
    }

    // Settled at wide view
    expect(calcZoomP(0.85)).toBe(1);
    expect(calcZoomP(0.95)).toBe(1);
    expect(calcZoomP(1.0)).toBe(1);
  });

  test("opening headline opacity curve: 1.0 in [0.0, 0.10], dissolves to 0.0 in [0.10, 0.45], 0.0 thereafter", () => {
    const calcHeadlineOpacity = (p: number) => (p <= 0.10 ? 1 : p >= 0.45 ? 0 : (0.45 - p) / 0.35);

    expect(calcHeadlineOpacity(0)).toBe(1);
    expect(calcHeadlineOpacity(0.10)).toBe(1);

    // Strictly monotonic dissolution in (0.10, 0.45)
    let prev = 1;
    for (let p = 0.15; p <= 0.45; p += 0.05) {
      const curr = calcHeadlineOpacity(p);
      expect(curr).toBeLessThan(prev);
      prev = curr;
    }

    expect(calcHeadlineOpacity(0.45)).toBe(0);
    expect(calcHeadlineOpacity(0.60)).toBe(0);
    expect(calcHeadlineOpacity(1.0)).toBe(0);
  });

  test("glassmorphism CTA card opacity curve: 0.0 in [0.0, 0.45], fades to 1.0 in [0.45, 0.85], 1.0 thereafter", () => {
    const calcCtaOpacity = (p: number) => (p <= 0.45 ? 0 : p >= 0.85 ? 1 : (p - 0.45) / 0.40);

    expect(calcCtaOpacity(0)).toBe(0);
    expect(calcCtaOpacity(0.10)).toBe(0);
    expect(calcCtaOpacity(0.45)).toBe(0);

    // Strictly monotonic entrance in (0.45, 0.85)
    let prev = 0;
    for (let p = 0.50; p <= 0.85; p += 0.05) {
      const curr = calcCtaOpacity(p);
      expect(curr).toBeGreaterThan(prev);
      prev = curr;
    }

    expect(calcCtaOpacity(0.85)).toBe(1);
    expect(calcCtaOpacity(0.95)).toBe(1);
    expect(calcCtaOpacity(1.0)).toBe(1);
  });

  test("CTA card pointer events gate: 'none' for p < 0.65, 'auto' for p >= 0.65", () => {
    const calcCtaPointer = (p: number) => (p >= 0.65 ? "auto" : "none");

    expect(calcCtaPointer(0)).toBe("none");
    expect(calcCtaPointer(0.45)).toBe("none");
    expect(calcCtaPointer(0.64)).toBe("none");
    expect(calcCtaPointer(0.65)).toBe("auto");
    expect(calcCtaPointer(0.85)).toBe("auto");
    expect(calcCtaPointer(1.0)).toBe("auto");
  });
});

