/**
 * The hero scene as a single canvas — the React surface of the canvas hero.
 *
 * This replaces HeroSignalP.tsx, which mounted ~250 Emotion-styled DOM elements inside
 * nested `preserve-3d` contexts and re-rendered all of them on every ScrollTrigger tick.
 * Measured before the change (docs/perf-baseline.md): one scroll pass through the pin
 * injected **1,335 new CSS rules** and dropped **32% of frames** on an unthrottled
 * M-series Mac serving a production build over localhost.
 *
 * The fix is architectural, not incremental:
 *  - Scroll progress arrives through an imperative handle, never through state, so
 *    scrolling causes **zero React renders**.
 *  - The rAF loop *stops* when off-screen or when the tab is hidden. The old loop
 *    re-scheduled itself in those cases (HeroSignalP.tsx:176-179), leaving a permanent
 *    frame callback alive for the whole session.
 *  - Canvas dimensions are cached and recomputed on a debounced resize, so nothing
 *    reads layout inside the frame loop (the old code read `offsetWidth`/`offsetHeight`
 *    every frame, forcing a synchronous reflow).
 *  - Under reduced motion or on a low-power device it paints one static final frame
 *    and never starts a loop at all.
 */

import { useEffect, useImperativeHandle, useRef, type RefObject } from "react";
import { useReducedMotion, useIsLowPowerDevice } from "@/shared/motion";
import { CONTAINER_START } from "./heroPhases";
import {
  heroFrameState,
  CUBE_POSITIONS,
  SERVICE_NODES,
  GRID_CELL,
  PLANE_SIZE,
  makeCamera,
  project,
} from "./heroScene";
import {
  createSprites,
  drawHeroFrame,
  logoRasterSize,
  type HeroSprites,
} from "./heroCanvasRenderer";

const LOGO_SRC = "/phitopolis_logo_hero.svg";
/** Resize work is debounced by this much; reallocating the backing store is expensive. */
const RESIZE_DEBOUNCE_MS = 120;

export interface HeroCanvasHandle {
  /** Push the pin's 0..1 progress. Cheap, synchronous, causes no render. */
  setProgress: (p: number) => void;
}

interface HeroCanvasProps {
  /** Imperative handle the scroll driver writes progress into. */
  handleRef: RefObject<HeroCanvasHandle | null>;
  /** Initial progress, used for the first paint and for the static fallback frame. */
  initialProgress?: number;
}

export function HeroCanvas({ handleRef, initialProgress = 0 }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(initialProgress);
  const reduced = useReducedMotion();
  const lowPower = useIsLowPowerDevice();

  // Static means: paint one frame, never animate. Both reduced motion and low-power
  // devices take this path.
  const isStatic = reduced === true || lowPower;

  useImperativeHandle(
    handleRef,
    () => ({
      setProgress: (p: number) => {
        progressRef.current = p;
      },
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let disposed = false;
    let raf = 0;
    let visible = true;
    let width = 0;
    let height = 0;
    const start = performance.now();

    // Mouse tracking variables for tilting and interactive play
    const mouseTarget = { x: 0, y: 0 };
    const mouseCurrent = { x: 0, y: 0 };

    // Springs for node and cube bounce heights
    const cubeVels = new Array(CUBE_POSITIONS.length).fill(0);
    const cubePos = new Array(CUBE_POSITIONS.length).fill(0);
    const nodeVels = new Array(SERVICE_NODES.length).fill(0);
    const nodePos = new Array(SERVICE_NODES.length).fill(0);

    // Match the logo raster to the same DPR ceiling the backing store uses, so the
    // tinted extrusion layers are sampled at the resolution they are drawn at
    // rather than upscaled from the SVG's declared 320x320.
    const { sprites, ready } = createSprites(
      LOGO_SRC,
      logoRasterSize(window.devicePixelRatio || 1),
    );

    /** Recompute the backing store. Reads layout — never called from inside a frame. */
    const measure = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = (elapsed: number) => {
      if (width === 0 || height === 0) return;
      const state = heroFrameState(progressRef.current, isStatic, CONTAINER_START);

      // Compute playground values
      const playground = isStatic
        ? undefined
        : {
            tiltX: mouseCurrent.x * 0.14, // Max tilt: ~8 deg left/right
            tiltY: mouseCurrent.y * 0.14, // Max tilt: ~8 deg up/down
            cubeBounceOffsets: cubePos,
            nodeBounceOffsets: nodePos,
          };

      drawHeroFrame(ctx, state, sprites, width, height, elapsed, playground);
    };

    /** One static frame — reduced motion, low-power, or scrolled past the 3D phase. */
    const paintStill = () => paint(0);

    const frame = (now: number) => {
      if (disposed) return;
      // Scene animates signals and logo movement until container phase takes over at CONTAINER_START (0.86).
      if (!visible || document.hidden || progressRef.current >= CONTAINER_START) {
        raf = 0;
        return;
      }

      // Update interactive pointerEvents state and target values based on scroll
      const isPlaygroundActive = progressRef.current < 0.02 && !isStatic;
      canvas.style.pointerEvents = isPlaygroundActive ? "auto" : "none";

      if (indicatorRef.current) {
        if (isPlaygroundActive) {
          const state = heroFrameState(progressRef.current, isStatic, CONTAINER_START);
          const mobile = width < 900;
          const baseW = width < 600 ? 200 : width < 900 ? 280 : 380;
          
          let textX = PLANE_SIZE / 2;
          let textY = PLANE_SIZE / 2;
          let translateStyle = "translate(-50%, -50%)";
          
          if (!mobile) {
            const padding = 32;
            textX = PLANE_SIZE / 2 - baseW / 2 - padding;
            textY = PLANE_SIZE / 2;
            translateStyle = "translate(-100%, -50%)";
          } else {
            textX = PLANE_SIZE / 2;
            textY = PLANE_SIZE / 2 + baseW / 2 + 80;
            translateStyle = "translate(-50%, -50%)";
          }

          const textZ = 8 * (1 - state.flatten);
          const viewScale = Math.min(width, height) / (PLANE_SIZE * 1.05);
          const cam = makeCamera(state.flatten, width / 2, height / 2, viewScale, mouseCurrent.x * 0.14, mouseCurrent.y * 0.14);
          const proj = project(cam, textX, textY, textZ);

          indicatorRef.current.style.opacity = Math.max(0, 1 - progressRef.current / 0.02).toString();
          indicatorRef.current.style.left = `${proj.sx}px`;
          indicatorRef.current.style.top = `${proj.sy}px`;
          indicatorRef.current.style.bottom = "auto";
          indicatorRef.current.style.transform = translateStyle;
          indicatorRef.current.style.textAlign = mobile ? "center" : "right";
        } else {
          indicatorRef.current.style.opacity = "0";
        }
      }

      if (!isPlaygroundActive) {
        mouseTarget.x = 0;
        mouseTarget.y = 0;
      }

      // Smooth mouse lerping
      mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * 0.08;
      mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * 0.08;

      // Update bounce spring physics
      const stiffness = 0.14;
      const damping = 0.86;
      for (let i = 0; i < cubePos.length; i++) {
        cubeVels[i] += (0 - cubePos[i]) * stiffness;
        cubeVels[i] *= damping;
        cubePos[i] += cubeVels[i];
      }
      for (let i = 0; i < nodePos.length; i++) {
        nodeVels[i] += (0 - nodePos[i]) * stiffness;
        nodeVels[i] *= damping;
        nodePos[i] += nodeVels[i];
      }

      paint(now - start);
      raf = requestAnimationFrame(frame);
    };

    const startLoop = () => {
      if (disposed || isStatic || raf !== 0) return;
      raf = requestAnimationFrame(frame);
    };

    const stopLoop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    measure();
    paintStill();
    void ready.then(() => {
      if (disposed) return;
      // The logo decoded after the first paint; repaint so it appears.
      paintStill();
      startLoop();
    });

    /* ── Mouse/Pointer Interaction Handlers ── */
    const onMouseMove = (e: MouseEvent) => {
      if (progressRef.current >= 0.02) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseTarget.x = (x / rect.width) * 2 - 1;
      mouseTarget.y = (y / rect.height) * 2 - 1;
    };

    const onMouseLeave = () => {
      mouseTarget.x = 0;
      mouseTarget.y = 0;
    };

    const triggerCascade = (sourceType: "cube" | "node", sourceIdx: number) => {
      let sx = 0, sy = 0;
      if (sourceType === "cube") {
        const c = CUBE_POSITIONS[sourceIdx]!;
        sx = c.c * GRID_CELL + GRID_CELL / 2;
        sy = c.r * GRID_CELL + GRID_CELL / 2;
      } else {
        const n = SERVICE_NODES[sourceIdx]!;
        sx = n.cx;
        sy = n.cy;
      }

      const waveSpeed = 1.0; // grid pixels per millisecond
      CUBE_POSITIONS.forEach((cube, i) => {
        if (sourceType === "cube" && i === sourceIdx) return;
        const cx = cube.c * GRID_CELL + GRID_CELL / 2;
        const cy = cube.r * GRID_CELL + GRID_CELL / 2;
        const dist = Math.hypot(cx - sx, cy - sy);
        const delay = dist / waveSpeed;
        setTimeout(() => {
          if (!disposed && progressRef.current < 0.02) {
            cubeVels[i] = 16;
          }
        }, delay);
      });

      SERVICE_NODES.forEach((node, i) => {
        if (sourceType === "node" && i === sourceIdx) return;
        const dist = Math.hypot(node.cx - sx, node.cy - sy);
        const delay = dist / waveSpeed;
        setTimeout(() => {
          if (!disposed && progressRef.current < 0.02) {
            nodeVels[i] = 16;
          }
        }, delay);
      });
    };

    const onClick = (e: MouseEvent) => {
      if (progressRef.current >= 0.02) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Project current positions to screen coordinates to find closest target
      const state = heroFrameState(progressRef.current, isStatic, CONTAINER_START);
      const viewScale = Math.min(width, height) / (PLANE_SIZE * 1.05);
      const cam = makeCamera(
        state.flatten,
        width / 2,
        height / 2,
        viewScale,
        mouseCurrent.x * 0.14,
        mouseCurrent.y * 0.14
      );

      let closestType: "cube" | "node" | null = null;
      let closestIdx = -1;
      let minDist = Infinity;

      for (let i = 0; i < CUBE_POSITIONS.length; i++) {
        const cube = CUBE_POSITIONS[i]!;
        const hz = Math.max(0, cube.h * (1 - state.flatten));
        const proj = project(cam, cube.c * GRID_CELL + GRID_CELL / 2, cube.r * GRID_CELL + GRID_CELL / 2, hz);
        const dist = Math.hypot(clickX - proj.sx, clickY - proj.sy);
        if (dist < minDist) {
          minDist = dist;
          closestType = "cube";
          closestIdx = i;
        }
      }

      for (let i = 0; i < SERVICE_NODES.length; i++) {
        const node = SERVICE_NODES[i]!;
        const ez = Math.max(0, node.elevation * (1 - state.flatten));
        const proj = project(cam, node.cx, node.cy, ez);
        const dist = Math.hypot(clickX - proj.sx, clickY - proj.sy);
        if (dist < minDist) {
          minDist = dist;
          closestType = "node";
          closestIdx = i;
        }
      }

      // If clicked close enough, trigger bounce and ripple wave!
      if (minDist < 60 && closestIdx !== -1) {
        if (closestType === "cube") {
          cubeVels[closestIdx] = 30;
          triggerCascade("cube", closestIdx);
        } else if (closestType === "node") {
          nodeVels[closestIdx] = 30;
          triggerCascade("node", closestIdx);
        }
      }
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("click", onClick);

    /* ── Visibility: stop the loop entirely rather than idling in it. ── */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        visible = entry.isIntersecting;
        if (visible) startLoop();
        else stopLoop();
      },
      { threshold: 0.02 },
    );
    observer.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* ── Resize: ResizeObserver on canvas container prevents aspect ratio squishing when container scale/maxHeight changes ── */
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (disposed) return;
        measure();
        paintStill();
        startLoop();
      }, RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener("resize", onResize, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      if (disposed) return;
      measure();
      paintStill();
      if (visible) startLoop();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    startLoop();

    /**
     * The driver writes progress into a ref, which by design triggers nothing. While the
     * loop is parked past CONTAINER_START we still need the scene to update if the
     * user scrolls back into range, so poll the ref at a low rate.
     */
    const restartPoll = window.setInterval(() => {
      if (disposed || isStatic) return;
      if (raf === 0 && visible && !document.hidden && progressRef.current < CONTAINER_START) {
        startLoop();
      }
    }, 250);

    return () => {
      disposed = true;
      stopLoop();
      window.clearTimeout(resizeTimer);
      window.clearInterval(restartPoll);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [isStatic]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        data-testid="hero-canvas"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div
        ref={indicatorRef}
        style={{
          position: "absolute",
          color: "rgba(105, 138, 213, 0.7)",
          fontFamily: "monospace",
          fontSize: "0.7rem",
          letterSpacing: "0.18em",
          pointerEvents: "none",
          transition: "opacity 0.3s ease",
          zIndex: 10,
          opacity: 0,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        [ Playground active: move cursor to tilt // click elements to ripple ]
      </div>
    </>
  );
}

export type { HeroSprites };
