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
import { CONTAINER_START, PHASE_FLATTEN_END } from "./heroPhases";
import { heroFrameState } from "./heroScene";
import { createSprites, drawHeroFrame, type HeroSprites } from "./heroCanvasRenderer";

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

    const { sprites, ready } = createSprites(LOGO_SRC);

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
      drawHeroFrame(ctx, state, sprites, width, height, elapsed);
    };

    /** One static frame — reduced motion, low-power, or scrolled past the 3D phase. */
    const paintStill = () => paint(0);

    const frame = (now: number) => {
      if (disposed) return;
      // Past the flatten phase the scene is a flat logo; nothing is animating, so stop
      // burning frames. The driver restarts us if the user scrolls back up.
      if (!visible || document.hidden || progressRef.current > PHASE_FLATTEN_END) {
        raf = 0;
        return;
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

    /* ── Resize: debounced, and it repaints even when the loop is parked. ── */
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

    startLoop();

    /**
     * The driver writes progress into a ref, which by design triggers nothing. While the
     * loop is parked past PHASE_FLATTEN_END we still need the scene to update if the
     * user scrolls back into the 3D range, so poll the ref at a low rate — 4 Hz is
     * imperceptible for a restart check and costs nothing next to a 60 Hz render.
     */
    const restartPoll = window.setInterval(() => {
      if (disposed || isStatic) return;
      if (raf === 0 && visible && !document.hidden && progressRef.current <= PHASE_FLATTEN_END) {
        startLoop();
      }
    }, 250);

    return () => {
      disposed = true;
      stopLoop();
      window.clearTimeout(resizeTimer);
      window.clearInterval(restartPoll);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, [isStatic]);

  return (
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
  );
}

export type { HeroSprites };
