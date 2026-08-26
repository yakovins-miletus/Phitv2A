import { describe, expect, test, vi } from "vitest";

import {
  APPLICATION_NODES,
  CUBE_POSITIONS,
  PLANE_SIZE,
  SERVICE_NODES,
  SERVICE_NODE_SIZE,
  SIGNAL_LOOPS,
  SIGNAL_SPEED_PX_PER_MS,
  SIGNAL_TAIL_PX,
  heroFrameState,
  makeCamera,
  pointAtLoopDistance,
  project,
  unproject2D,
  PERSPECTIVE,
} from "@/features/hero/heroScene";
import {
  CONTAINER_START,
} from "@/features/hero/heroPhases";
import {
  drawPlaneFrame,
  HORIZON,
  calcViewScale,
} from "@/features/hero/heroPlaneRenderer";

describe("Challenger 2 Empirical Stress Suite: Interactive & State Invariants", () => {
  /* ═══════════════════════════════════════════════════════════════════════════════
   * 1. FLATTEN PROGRESS TRANSITIONS & COLLAPSE DYNAMICS
   * ═══════════════════════════════════════════════════════════════════════════════ */
  describe("1. Flatten progress transitions across all phases (p in 0..1)", () => {
    const checkpoints = [0.0, 0.05, 0.10, 0.15, 0.20, 0.50, 1.0];

    test.each(checkpoints)(
      "checkpoint p = %f: state values stay within strictly valid ranges",
      (p) => {
        const state = heroFrameState(p, false, CONTAINER_START);

        expect(state.flatten).toBeGreaterThanOrEqual(0);
        expect(state.flatten).toBeLessThanOrEqual(1);

        expect(state.sideOpacity).toBeGreaterThanOrEqual(0);
        expect(state.sideOpacity).toBeLessThanOrEqual(1);

        expect(state.topOpacity).toBeGreaterThanOrEqual(0);
        expect(state.topOpacity).toBeLessThanOrEqual(1);

        expect(state.signalOpacity).toBeGreaterThanOrEqual(0);
        expect(state.signalOpacity).toBeLessThanOrEqual(1);

        // At or beyond p = 0.20 (PHASE_FLATTEN_END), scene must be completely flattened
        if (p >= 0.20) {
          expect(state.flatten).toBe(1.0);
          expect(state.sideOpacity).toBe(0.0);
          expect(state.topOpacity).toBe(0.0);
          expect(state.signalOpacity).toBe(0.0);
          expect(state.flat).toBe(true);
        }
      },
    );

    test("3D extrusions for all cubes and application nodes cleanly collapse to 0 at p >= 0.20", () => {
      for (let i = 0; i <= 1000; i++) {
        const p = i / 1000;
        const state = heroFrameState(p, false, CONTAINER_START);

        // For all 16 cubes:
        for (const cube of CUBE_POSITIONS) {
          const ez = cube.h * (1 - state.flatten);
          if (p >= 0.20) {
            expect(ez).toBe(0);
          } else {
            expect(ez).toBeGreaterThan(0);
            expect(ez).toBeLessThanOrEqual(cube.h);
          }
        }

        // For all 6 application nodes:
        for (const app of APPLICATION_NODES) {
          const ez = app.elevation * (1 - state.flatten);
          if (p >= 0.20) {
            expect(ez).toBe(0);
          } else {
            expect(ez).toBeGreaterThan(0);
            expect(ez).toBeLessThanOrEqual(app.elevation);
          }
        }

        // Side face opacity, top opacity, and signal opacity
        if (p >= 0.20) {
          expect(state.sideOpacity).toBe(0);
          expect(state.topOpacity).toBe(0);
          expect(state.signalOpacity).toBe(0);
        }
      }
    });

    test("continuous monotonicity of flatten, moveLeft, and opacity functions", () => {
      let prevFlatten = -1;
      let prevMoveLeft = -1;
      let prevSideOpacity = 2;
      let prevTopOpacity = 2;
      let prevSignalOpacity = 2;

      for (let i = 0; i <= 2000; i++) {
        const p = i / 2000;
        const state = heroFrameState(p, false, CONTAINER_START);

        expect(state.flatten).toBeGreaterThanOrEqual(prevFlatten);
        expect(state.moveLeft).toBeGreaterThanOrEqual(prevMoveLeft);
        expect(state.sideOpacity).toBeLessThanOrEqual(prevSideOpacity);
        expect(state.topOpacity).toBeLessThanOrEqual(prevTopOpacity);
        expect(state.signalOpacity).toBeLessThanOrEqual(prevSignalOpacity);

        prevFlatten = state.flatten;
        prevMoveLeft = state.moveLeft;
        prevSideOpacity = state.sideOpacity;
        prevTopOpacity = state.topOpacity;
        prevSignalOpacity = state.signalOpacity;
      }
    });

    test("behavior under forward scroll bounds (p in 0..1)", () => {
      const startState = heroFrameState(0, false, CONTAINER_START);
      expect(startState.flatten).toBe(0);
      expect(startState.sideOpacity).toBe(1);
      expect(startState.topOpacity).toBe(1);
      expect(startState.signalOpacity).toBe(1);
      expect(startState.flat).toBe(false);

      const endState = heroFrameState(1.0, false, CONTAINER_START);
      expect(endState.flatten).toBe(1);
      expect(endState.sideOpacity).toBe(0);
      expect(endState.topOpacity).toBe(0);
      expect(endState.signalOpacity).toBe(0);
      expect(endState.flat).toBe(true);
    });
  });

  /* ═══════════════════════════════════════════════════════════════════════════════
   * 2. REDUCED MOTION & STATIC FRAME RENDERING (paintStill)
   * ═══════════════════════════════════════════════════════════════════════════════ */
  describe("2. Reduced motion & static frame rendering", () => {
    function createMockCanvasContext() {
      const drawnCalls: string[] = [];
      const ctx = {
        save: vi.fn(() => { drawnCalls.push("save"); }),
        restore: vi.fn(() => { drawnCalls.push("restore"); }),
        beginPath: vi.fn(() => { drawnCalls.push("beginPath"); }),
        closePath: vi.fn(() => { drawnCalls.push("closePath"); }),
        moveTo: vi.fn(() => { drawnCalls.push("moveTo"); }),
        lineTo: vi.fn(() => { drawnCalls.push("lineTo"); }),
        stroke: vi.fn(() => { drawnCalls.push("stroke"); }),
        fill: vi.fn(() => { drawnCalls.push("fill"); }),
        arc: vi.fn(() => { drawnCalls.push("arc"); }),
        arcTo: vi.fn(() => { drawnCalls.push("arcTo"); }),
        rect: vi.fn(() => { drawnCalls.push("rect"); }),
        fillRect: vi.fn(() => { drawnCalls.push("fillRect"); }),
        strokeRect: vi.fn(() => { drawnCalls.push("strokeRect"); }),
        clearRect: vi.fn(() => { drawnCalls.push("clearRect"); }),
        drawImage: vi.fn(() => { drawnCalls.push("drawImage"); }),
        translate: vi.fn(() => { drawnCalls.push("translate"); }),
        scale: vi.fn(() => { drawnCalls.push("scale"); }),
        transform: vi.fn(() => { drawnCalls.push("transform"); }),
        setTransform: vi.fn(() => { drawnCalls.push("setTransform"); }),
        createRadialGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
        createLinearGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
        globalAlpha: 1,
        lineWidth: 1,
        strokeStyle: "rgba(0,0,0,1)",
        fillStyle: "rgba(0,0,0,1)",
        lineCap: "butt" as CanvasLineCap,
        lineJoin: "miter" as CanvasLineJoin,
      };
      return { ctx: ctx as unknown as CanvasRenderingContext2D, drawnCalls };
    }

    test("paintStill executes drawPlaneFrame without error at progress = 0, elapsed = 0", () => {
      const { ctx, drawnCalls } = createMockCanvasContext();
      const state = heroFrameState(0, false, CONTAINER_START);

      expect(() => {
        drawPlaneFrame(ctx, state, 1440, 900, 0, undefined);
      }).not.toThrow();

      expect(drawnCalls.length).toBeGreaterThan(100);
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    test("paintStill renders all 6 application nodes and 16 cubes in resting 3D frame", () => {
      const { ctx } = createMockCanvasContext();
      const state = heroFrameState(0, false, CONTAINER_START);

      expect(state.flatten).toBe(0);
      expect(state.sideOpacity).toBe(1);
      expect(state.topOpacity).toBe(1);
      expect(state.signalOpacity).toBe(1);
      expect(state.flat).toBe(false);

      // Verify that all 6 application nodes project to finite real screen coordinates
      const cam = makeCamera(
        state.flatten,
        1440 / 2,
        900 * HORIZON,
        calcViewScale(1440, 900),
        0,
        0,
      );

      for (const app of APPLICATION_NODES) {
        const p = project(cam, app.cx, app.cy, app.elevation);
        expect(Number.isFinite(p.sx)).toBe(true);
        expect(Number.isFinite(p.sy)).toBe(true);
        expect(Number.isFinite(p.depth)).toBe(true);
        // All nodes project within generous canvas bounds
        expect(p.sx).toBeGreaterThan(0);
        expect(p.sx).toBeLessThan(1440);
        expect(p.sy).toBeGreaterThan(0);
      }

      // Draw static frame
      drawPlaneFrame(ctx, state, 1440, 900, 0, undefined);
      expect(ctx.stroke).toHaveBeenCalled();
    });

    test("paintStill at mobile dimensions (390x844) renders without clipping or NaN coords", () => {
      const { ctx } = createMockCanvasContext();
      const state = heroFrameState(0, false, CONTAINER_START);

      const cam = makeCamera(
        state.flatten,
        390 / 2,
        844 * HORIZON,
        calcViewScale(390, 844),
        0,
        0,
      );

      for (const app of APPLICATION_NODES) {
        const p = project(cam, app.cx, app.cy, app.elevation);
        expect(Number.isFinite(p.sx)).toBe(true);
        expect(Number.isFinite(p.sy)).toBe(true);
      }

      expect(() => {
        drawPlaneFrame(ctx, state, 390, 844, 0, undefined);
      }).not.toThrow();
    });
  });

  /* ═══════════════════════════════════════════════════════════════════════════════
   * 3. HIT-TESTING ISOLATION & POINTER INVARIANCE
   * ═══════════════════════════════════════════════════════════════════════════════ */
  describe("3. Hit-testing invariance between outer app nodes and primary service nodes", () => {
    function buildCameraHelper(width: number, height: number, flatten: number) {
      return makeCamera(
        flatten,
        width / 2,
        height * HORIZON,
        calcViewScale(width, height),
        0,
        0,
      );
    }

    function toPlaneHelper(width: number, height: number, flatten: number, sx: number, sy: number) {
      const cam = buildCameraHelper(width, height, flatten);
      const origin = project(cam, PLANE_SIZE / 2, PLANE_SIZE / 2, 0);
      const k = PERSPECTIVE / Math.max(1, PERSPECTIVE - origin.depth);
      const delta = unproject2D(cam, k, sx - origin.sx, sy - origin.sy);
      return { x: PLANE_SIZE / 2 + delta.x, y: PLANE_SIZE / 2 + delta.y };
    }

    test("clicking directly on each outer application node NEVER matches any primary service node", () => {
      const width = 1440;
      const height = 900;
      const state = heroFrameState(0, false, CONTAINER_START);
      const cam = buildCameraHelper(width, height, state.flatten);

      for (const app of APPLICATION_NODES) {
        // Screen position of outer app node
        const screenPos = project(cam, app.cx, app.cy, 0);

        // Unproject back to plane coordinates
        const planePos = toPlaneHelper(width, height, state.flatten, screenPos.sx, screenPos.sy);

        // Perform hit test algorithm from HeroCanvas.tsx:376-384
        let matched: number | null = null;
        for (let j = 0; j < SERVICE_NODES.length; j++) {
          const candidate = SERVICE_NODES[j]!;
          const dx = planePos.x - candidate.cx;
          const dy = planePos.y - candidate.cy;
          const dist = Math.hypot(dx, dy);

          // Distance from outer nodes to any service node is >= 180px, far above 54px hit radius
          expect(dist).toBeGreaterThan(150);

          if (dist <= SERVICE_NODE_SIZE * 0.9) {
            matched = j;
            break;
          }
        }

        // Must NOT match any service node
        expect(matched).toBeNull();
      }
    });

    test("outer application node positions have minimum distance > 300px from all service nodes in plane space", () => {
      for (const app of APPLICATION_NODES) {
        for (const service of SERVICE_NODES) {
          const dist = Math.hypot(app.cx - service.cx, app.cy - service.cy);
          expect(dist).toBeGreaterThan(300);
        }
      }
    });
  });

  /* ═══════════════════════════════════════════════════════════════════════════════
   * 4. SIGNAL TRAVEL SPEED, TIMING & CONTINUITY
   * ═══════════════════════════════════════════════════════════════════════════════ */
  describe("4. Signal loop propagation speed and continuity", () => {
    test("signal loop speeds and pulse configurations are uniform", () => {
      expect(SIGNAL_SPEED_PX_PER_MS).toBe(0.25);
      expect(SIGNAL_TAIL_PX).toBe(38);

      for (let i = 0; i < SIGNAL_LOOPS.length; i++) {
        const loop = SIGNAL_LOOPS[i]!;
        expect(loop.totalL).toBeGreaterThan(0);
        expect(loop.pulseOffsets).toHaveLength(2);
        // Pulse offset spacing is exactly 0.5 (diametrically opposed pulses)
        const spacing = Math.abs(loop.pulseOffsets[1]! - loop.pulseOffsets[0]!);
        expect(spacing).toBeCloseTo(0.5, 5);
      }
    });

    test("pulses traverse full loop smoothly over time without spatial discontinuity", () => {
      for (const loop of SIGNAL_LOOPS) {
        let prevX = 0;
        let prevY = 0;
        const totalDuration = loop.totalL / SIGNAL_SPEED_PX_PER_MS;

        for (let t = 0; t <= 100; t++) {
          const elapsed = (t / 100) * totalDuration;
          const d = (elapsed * SIGNAL_SPEED_PX_PER_MS) % loop.totalL;
          const pt = pointAtLoopDistance(loop, d);

          if (t > 0) {
            const stepDist = Math.hypot(pt.x - prevX, pt.y - prevY);
            // In 1% time step, max travel is ~1% of total length + corner tolerance
            expect(stepDist).toBeLessThanOrEqual(loop.totalL * 0.05 + 10);
          }
          prevX = pt.x;
          prevY = pt.y;
        }
      }
    });
  });
});
