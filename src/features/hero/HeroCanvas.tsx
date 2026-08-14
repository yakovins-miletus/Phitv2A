/**
 * The hero city as a single canvas — the React surface of the canvas hero.
 *
 * The architectural commitments here are inherited from the canvas rewrite that
 * replaced HeroSignalP.tsx's ~250 Emotion-styled DOM nodes, and they are the reason
 * this file looks the way it does (measured before that change, in
 * docs/perf-baseline.md: one scroll pass through the pin injected **1,335 new CSS
 * rules** and dropped **32% of frames**):
 *
 *  - Scroll progress arrives through an imperative handle, never through state, so
 *    scrolling causes **zero React renders**.
 *  - The rAF loop *stops* when off-screen, when the tab is hidden, or once the pin
 *    has scrolled past the interactive phase. It does not idle.
 *  - Canvas dimensions are cached and recomputed on a debounced resize, so nothing
 *    reads layout inside the frame loop.
 *  - Under reduced motion or on a low-power device it paints one static frame and
 *    never starts a loop at all.
 *
 * What this file no longer carries, since the scene became a lattice:
 *  - the anchor buffer, `writeAnchors`, and nearest-anchor hit-testing (there are
 *    no discrete scene objects; the cursor addresses cells by arithmetic);
 *  - per-cube and per-node bounce springs, hover strengths and magnet offsets;
 *  - the `RippleScheduler` drain (the ripple is a pure function of distance and
 *    age, evaluated during the frame it is drawn);
 *  - the on-canvas hint `[ move cursor to tilt // click to ripple ]`. If an
 *    interaction needs a caption, the interaction failed. The skyline visibly
 *    rising under the pointer is its own instruction.
 */

import { useEffect, useImperativeHandle, useRef, type RefObject } from "react";
import { useReducedMotion, useIsLowPowerDevice, usePointerFine } from "@/shared/motion";
import {
  CONTAINER_START,
} from "./heroPhases";
import {
  SERVICE_NODES,
  SERVICE_NODE_SIZE,
  heroFrameState,
  PERSPECTIVE,
  PLANE_SIZE,
  makeCamera,
  project,
  unproject2D,
} from "./heroScene";
import { loadLogoMask } from "./heroLogoMask";
import {
  HORIZON,
  VIEW_FIT,
  drawPlaneFrame,
  getLogoScreenBox,
  type PlaneInteraction,
} from "./heroPlaneRenderer";
import {
  HIT_TEST_END,
  INTERACT_END,
  RIPPLE_DURATION_MS,
  interactStrength,
  smoothVelocity,
} from "./heroPointer";

const LOGO_SRC = "/phitopolis_logo_hero.svg";

/** Resize work is debounced by this much; reallocating the backing store is expensive. */
const RESIZE_DEBOUNCE_MS = 120;

/** Lerp the normalised pointer position eases with, for the camera tilt and CSS parallax. */
const POINTER_LERP = 0.09;

/** Maximum camera tilt contributed by the pointer, in radians (~11deg). */
const TILT_AMOUNT = 0.19;

export interface HeroCanvasHandle {
  /** Push the pin's 0..1 progress. Cheap, synchronous, causes no render. */
  setProgress: (p: number) => void;
}

interface HeroCanvasProps {
  /** Imperative handle the scroll driver writes progress into. */
  handleRef: RefObject<HeroCanvasHandle | null>;
  /** Initial progress, used for the first paint and for the static fallback frame. */
  initialProgress?: number;
  /**
   * The `#hero` container. The frame loop publishes its lerped pointer here as
   * `--hp-mx` / `--hp-my` every frame, so the dawn ground can read cursor
   * parallax without a second lerp or a value lifted into React — and, since
   * this change, the P mark's screen box as `--hp-px` / `--hp-py` / `--hp-pw`,
   * which is how the motto (a DOM sibling of the canvas, not a descendant of
   * it) knows where to sit. `--hp-mx`/`--hp-my` are never written under
   * `isStatic`: the loop that would write them never starts, so the ground's
   * `var(--hp-mx, 0)` reads fall back to 0 for free. The P box IS written once
   * under `isStatic` — from `paintStill()` — because the motto needs a real
   * position in the reduced-motion resting frame too.
   */
  varsHostRef?: RefObject<HTMLElement | null>;
  /** Currently selected service node index (0..3) or null. */
  activeNode?: number | null;
  /** Callback fired when a service node (0..3) is clicked on canvas. */
  onNodeSelect?: (index: number) => void;
}

export function HeroCanvas({
  handleRef,
  initialProgress = 0,
  varsHostRef,
  activeNode = null,
  onNodeSelect,
}: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(initialProgress);
  const activeNodeRef = useRef<number | null>(activeNode);
  activeNodeRef.current = activeNode;
  const reduced = useReducedMotion();
  const lowPower = useIsLowPowerDevice();
  // Gates affordances, never cost. A pointer-type change (hybrid devices) must
  // re-wire the listeners, so this feeds the main effect's deps below.
  const pointerFine = usePointerFine();

  // Static means: paint one frame, never animate. Both reduced motion and
  // low-power devices take this path.
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

    // Normalised -1..1 pointer position, lerped. Drives the camera tilt and the
    // CSS parallax on the dawn ground.
    const tiltTarget = { x: 0, y: 0 };
    const tiltCurrent = { x: 0, y: 0 };

    // Raw pointer position in canvas CSS px, plus presence. Distinct from
    // `tiltTarget`, which defaults to (0, 0) even when no pointer is present —
    // every cursor-relative effect gates on `pointerActive`, so a scene with no
    // pointer never lights up just because the tilt target sits at centre.
    const pointerScreen = { x: 0, y: 0 };
    let pointerPrev = { x: 0, y: 0 };
    let pointerActive = false;
    let velocity = 0;
    let rawSpeed = 0;

    let rippleAt = -Infinity;

    // Last-published P screen box, so `publishLogoBox` can skip the
    // `setProperty` calls once the mark has settled — it barely moves at rest,
    // and a per-frame write that changes nothing still costs style
    // invalidation. Mutated in place; never reallocated.
    const lastLogoBox = { x: -1, y: -1, w: -1 };

    /** Push the P's current screen box onto `varsHostRef` as `--hp-px` /
     *  `--hp-py` / `--hp-pw`, if it moved enough to matter. Called after every
     *  `drawPlaneFrame`, including the static one. */
    const publishLogoBox = () => {
      const host = varsHostRef?.current;
      if (!host) return;
      const box = getLogoScreenBox();
      if (!box) return;
      if (
        Math.abs(box.x - lastLogoBox.x) < 0.0005 &&
        Math.abs(box.y - lastLogoBox.y) < 0.0005 &&
        Math.abs(box.w - lastLogoBox.w) < 0.0005
      ) {
        return;
      }
      lastLogoBox.x = box.x;
      lastLogoBox.y = box.y;
      lastLogoBox.w = box.w;
      const s = host.style;
      s.setProperty("--hp-px", box.x.toFixed(4));
      s.setProperty("--hp-py", box.y.toFixed(4));
      s.setProperty("--hp-pw", box.w.toFixed(4));
    };

    // The single interaction object, mutated in place every frame rather than
    // reallocated. Held by reference across the whole effect's lifetime.
    const interaction: PlaneInteraction = {
      tiltX: 0,
      tiltY: 0,
      pointerActive: false,
      lightX: 0,
      lightY: 0,
      strength: 0,
      velocity: 0,
      rippleX: 0,
      rippleY: 0,
      rippleAge: -1,
    };

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

    /**
     * Build the same camera `drawPlaneFrame` will, so screen-to-plane unprojection
     * agrees with what is on screen. Kept in one place precisely because a
     * disagreement here is invisible until the cursor lights the wrong buildings.
     */
    const buildCamera = (flatten: number) =>
      makeCamera(
        flatten,
        width / 2,
        height * HORIZON,
        Math.min(width, height) / (PLANE_SIZE * VIEW_FIT),
        tiltCurrent.x * TILT_AMOUNT * interaction.strength,
        tiltCurrent.y * TILT_AMOUNT * interaction.strength,
      );

    /** Turn a canvas-relative screen point into plane coordinates. */
    const toPlane = (flatten: number, sx: number, sy: number) => {
      const cam = buildCamera(flatten);
      const origin = project(cam, PLANE_SIZE / 2, PLANE_SIZE / 2, 0);
      const k = PERSPECTIVE / Math.max(1, PERSPECTIVE - origin.depth);
      const delta = unproject2D(cam, k, sx - origin.sx, sy - origin.sy);
      return { x: PLANE_SIZE / 2 + delta.x, y: PLANE_SIZE / 2 + delta.y };
    };

    /**
     * One frame, no loop. This is the reduced-motion and low-power path, and it is
     * a *designed* state rather than an absence: the full dawn composition —
     * skyline standing, long shadows, the mark in the air — simply held still. It
     * should look like a printed halftone poster of the city.
     *
     * Note the deliberate `false` for `heroFrameState`'s `reduced` flag. Passing
     * `true` there forces progress to 1, which is correct for the DOM (the settled
     * wordmark layout a reduced-motion visitor should land on) and exactly wrong
     * for the canvas: at progress 1 the city has collapsed into its flat plan, so
     * the one frame these users ever see would be the emptiest one in the whole
     * pin. They get the scene at rest instead.
     */
    const paintStill = () => {
      if (width === 0 || height === 0) return;
      const progress = isStatic ? 0 : progressRef.current;
      drawPlaneFrame(ctx, heroFrameState(progress, false, CONTAINER_START), width, height, 0, undefined);
      publishLogoBox();
    };

    const frame = (now: number) => {
      if (disposed) return;
      if (!visible || document.hidden || progressRef.current >= CONTAINER_START) {
        raf = 0;
        return;
      }
      if (width === 0 || height === 0) {
        raf = requestAnimationFrame(frame);
        return;
      }

      const elapsed = now - start;
      const progress = progressRef.current;
      const strength = interactStrength(progress);
      const state = heroFrameState(progress, false, CONTAINER_START);

      // Pointer capture: coarse pointers never take pointer events, fine ones do
      // for as long as the interaction has any strength left.
      canvas.style.pointerEvents = pointerFine && strength > 0 ? "auto" : "none";

      if (progress >= INTERACT_END) {
        tiltTarget.x = 0;
        tiltTarget.y = 0;
      }
      tiltCurrent.x += (tiltTarget.x - tiltCurrent.x) * POINTER_LERP;
      tiltCurrent.y += (tiltTarget.y - tiltCurrent.y) * POINTER_LERP;

      // Pointer speed. Sampled once per frame from the position delta rather than
      // per pointermove event, so a burst of events in one frame cannot inflate it.
      velocity = smoothVelocity(velocity, pointerActive ? rawSpeed : 0);
      rawSpeed = 0;

      interaction.strength = strength;
      interaction.velocity = velocity;
      interaction.tiltX = tiltCurrent.x * TILT_AMOUNT * strength;
      interaction.tiltY = tiltCurrent.y * TILT_AMOUNT * strength;
      interaction.pointerActive = pointerActive;
      interaction.activeNode = activeNodeRef.current;

      if (pointerActive) {
        const p = toPlane(state.flatten, pointerScreen.x, pointerScreen.y);
        interaction.lightX = p.x;
        interaction.lightY = p.y;
      }

      const rippleAge = elapsed - rippleAt;
      interaction.rippleAge = rippleAge >= 0 && rippleAge < RIPPLE_DURATION_MS ? rippleAge : -1;

      // Publish the lerped pointer onto the card, in the same -1..1 space
      // `tiltTarget` uses. The dawn ground reads this as `var(--hp-mx, 0)` /
      // `var(--hp-my, 0)` for parallax — no second lerp, nothing in React.
      if (varsHostRef?.current) {
        varsHostRef.current.style.setProperty("--hp-mx", tiltCurrent.x.toFixed(4));
        varsHostRef.current.style.setProperty("--hp-my", tiltCurrent.y.toFixed(4));
      }

      drawPlaneFrame(ctx, state, width, height, elapsed, interaction);
      publishLogoBox();
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
    // First paint happens immediately, without waiting on the mark's SVG. The city
    // is complete without it — the P is one district among twelve — so nothing on
    // the critical path blocks on a network round trip.
    paintStill();
    void loadLogoMask(LOGO_SRC).then(() => {
      if (disposed) return;
      paintStill();
      startLoop();
    });

    let hoveredNode: number | null = null;

    /* ── Pointer ── */

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (pointerActive) {
        rawSpeed = Math.max(rawSpeed, Math.hypot(x - pointerPrev.x, y - pointerPrev.y));
      }
      pointerPrev = { x, y };
      pointerScreen.x = x;
      pointerScreen.y = y;
      pointerActive = true;

      if (progressRef.current >= INTERACT_END) {
        hoveredNode = null;
        canvas.style.cursor = "default";
        return;
      }
      tiltTarget.x = (x / rect.width) * 2 - 1;
      tiltTarget.y = (y / rect.height) * 2 - 1;

      // Hit-test the 4 elevated service nodes in plane space
      const state = heroFrameState(progressRef.current, false, CONTAINER_START);
      const p = toPlane(state.flatten, x, y);
      let matched: number | null = null;
      for (let i = 0; i < SERVICE_NODES.length; i++) {
        const node = SERVICE_NODES[i]!;
        const dx = p.x - node.cx;
        const dy = p.y - node.cy;
        if (Math.hypot(dx, dy) <= SERVICE_NODE_SIZE * 0.9) {
          matched = i;
          break;
        }
      }
      hoveredNode = matched;
      canvas.style.cursor = matched !== null ? "pointer" : "default";
    };

    const onPointerLeave = () => {
      tiltTarget.x = 0;
      tiltTarget.y = 0;
      pointerActive = false;
      rawSpeed = 0;
      hoveredNode = null;
      canvas.style.cursor = "default";
    };

    const onClick = (e: MouseEvent) => {
      // A coarse pointer never has `pointerEvents: "auto"` in the first place, but
      // guard explicitly since the handler is attached regardless of pointer type.
      if (!pointerFine || progressRef.current >= HIT_TEST_END) return;
      if (hoveredNode !== null) {
        const targetNode = SERVICE_NODES[hoveredNode];
        if (targetNode) {
          interaction.rippleX = targetNode.cx;
          interaction.rippleY = targetNode.cy;
          rippleAt = performance.now() - start;
        }
        onNodeSelect?.(hoveredNode);
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const state = heroFrameState(progressRef.current, false, CONTAINER_START);
      const p = toPlane(state.flatten, e.clientX - rect.left, e.clientY - rect.top);
      interaction.rippleX = p.x;
      interaction.rippleY = p.y;
      rippleAt = performance.now() - start;
    };

    // Reduced motion and coarse pointers never get a listener at all — not a
    // listener that early-returns. Both branches, not either.
    if (!isStatic && pointerFine) {
      canvas.addEventListener("pointermove", onPointerMove, { passive: true });
      canvas.addEventListener("pointerleave", onPointerLeave, { passive: true });
      canvas.addEventListener("click", onClick);
    }

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

    /* ── Resize ── */
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
     * Progress arrives in a ref, which by design triggers nothing. While the loop
     * is parked past CONTAINER_START the scene still needs to come back if the
     * user scrolls into range, so poll the ref at a low rate.
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
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [isStatic, pointerFine, varsHostRef]);

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
