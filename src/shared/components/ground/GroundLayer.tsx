import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { useIsLowPowerDevice, usePreloaderReady, useReducedMotion } from "@/shared/motion";
import { GROUND_STOPS, rgbCss, sampleGround, type GroundStop } from "./groundStops";
import { createGlGround, type GlGround } from "./glGround";

/** Blend distance before a section boundary, in px. Long enough to read as a
 *  transition rather than a switch, short enough that the middle of a section
 *  holds one stable colour while you read it. The same distance is used at
 *  every boundary now — see `groundStops.ts`'s `sampleGround` header for why
 *  there is no longer a wider runway reserved for the former "act break". */
const BLEND_PX = 560;

/**
 * The page ground.
 *
 * One fixed layer behind all content that owns the background colour and moves
 * it with scroll. Before this, every section painted its own opaque `bgcolor`
 * and `routes/index.tsx` put a `<Divider />` at each seam, which meant every
 * ground change on the page was a hard cut with a hairline drawing attention to
 * it — most visibly hero → mission, where two full-viewport sections met with
 * opposite grounds.
 *
 * The WebGL rung no longer cross-fades: every section boundary plays a
 * scroll-scrubbed per-tile wipe (`glGround.ts`), the same visual language the
 * site used to reserve for route transitions (the retired `PixelWipe`) and,
 * before that, for a single "act break" partway down the home page. Once every
 * boundary gets the same treatment there is no reason to special-case one of
 * them, so the wipe simply replaced the crossfade outright. The CSS/low-power
 * rung still crossfades, for want of a per-tile hash on a compositor-only
 * background colour — see the comment at its render branch below.
 *
 * Degradation ladder, in order. Each rung is a real product, not an error state:
 *
 *   1. `prefers-reduced-motion`  → static ground, no loop at all.
 *   2. low-power device           → CSS renderer (compositor-only).
 *   3. no WebGL2 / context lost   → CSS renderer.
 *   4. otherwise                  → WebGL renderer.
 *
 * Decorative and behind everything: `aria-hidden`, `z-index: -1`, and never a
 * candidate for LCP.
 */
export interface GroundLayerProps {
  /** The ground track to paint. Defaults to the home page's `GROUND_STOPS`;
   *  /about passes `ABOUT_GROUND_STOPS` so its own sections' grounds paint
   *  instead of home's (see about.tsx). */
  stops?: readonly GroundStop[];
}

export function GroundLayer({ stops = GROUND_STOPS }: GroundLayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const lowPower = useIsLowPowerDevice();
  const ready = usePreloaderReady();

  /**
   * Clear the opaque root backgrounds while this layer owns the page ground.
   *
   * This is load-bearing, not tidiness. `index.html` paints `html { background:
   * #f8fafc }` as a pre-JS anti-flash colour and MUI's CssBaseline paints `body`
   * with `background.default`. Because *html* carries a background of its own,
   * body's no longer propagates to the viewport canvas — so body paints as an
   * ordinary in-flow block, which per CSS painting order happens **after**
   * negative-z-index descendants. A `z-index: -1` layer therefore renders
   * underneath body's opaque fill and is never seen.
   *
   * Restored on unmount so every other route keeps its background, and so the
   * anti-flash paint is back in place before the next navigation.
   */
  useEffect(() => {
    const root = document.documentElement;
    const prevHtml = root.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    root.style.backgroundColor = "transparent";
    document.body.style.backgroundColor = "transparent";
    return () => {
      root.style.backgroundColor = prevHtml;
      document.body.style.backgroundColor = prevBody;
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Rung 1. A single static paint of the first ground, then nothing runs.
    // Deliberately not "the ground you would have at your scroll position": under
    // reduce the page must not repaint as you move.
    if (reduced === true) {
      host.style.backgroundColor = stops[0]?.color ?? "";
      return;
    }
    if (!ready) return;

    const canvas = canvasRef.current;
    // Rungs 2-4.
    let gl: GlGround | null = null;
    if (!lowPower && canvas) gl = createGlGround(canvas);
    const useGl = gl !== null;
    if (canvas) canvas.style.opacity = useGl ? "1" : "0";

    /**
     * Document offsets of each stop's section.
     *
     * These MUST be re-measured after every ScrollTrigger refresh, not just at
     * GSAP inserts pin-spacer elements when it builds those triggers — which moves
     * every section below them. Measuring once at mount produced offsets from the
     * pre-pin layout, and the sampler then never advanced past `reach`: the People
     * act kept painting the Services ground.
     */
    let positions: number[] = [];
    const measure = () => {
      positions = stops.map((stop) => {
        const el = document.getElementById(stop.id);
        if (!el) return Number.POSITIVE_INFINITY;
        return window.scrollY + el.getBoundingClientRect().top;
      });
      if (gl) {
        gl.resize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio || 1, 2));
      }
    };

    let lastCss = "";
    let lastKey = "";
    let lastDocH = 0;

    const paint = () => {
      if (positions.length === 0) return;

      // The page keeps growing after mount — pin spacers get sized, fonts swap,
      // lazy media resolves — and each of those moves every section below it.
      // ScrollTrigger's refresh event covers the pin case but fires before some of
      // the rest, which left the People act still painting the Services ground
      // because `daily-life`'s stored offset was from an earlier, shorter document.
      // One cached height comparison per tick is enough to catch all of it.
      const docH = document.documentElement.scrollHeight;
      if (docH !== lastDocH) {
        lastDocH = docH;
        measure();
      }

      const s = sampleGround(stops, positions, window.scrollY, BLEND_PX);

      // Dev-only probe. The GL path runs with `preserveDrawingBuffer: false`, so
      // `readPixels` returns an empty buffer outside the render callback and there
      // is otherwise no way to assert what the layer actually painted. Mirrors the
      // `window.__lenis` handle SmoothScroll exposes for the same reason. Stripped
      // from production.
      if (import.meta.env.DEV) {
        (window as unknown as { __ground?: unknown }).__ground = {
          renderer: gl ? "webgl2" : "css",
          color: rgbCss(s.color),
          progress: s.progress,
          stop: stops[s.fromIndex]?.id,
          act: stops[s.fromIndex]?.act,
          positions: positions.slice(),
        };
      }

      if (gl) {
        // Skip redundant draws: the ground holds one colour through most of a
        // section, so this idles at zero GPU work while you read. `from`/`to`
        // only change when `fromIndex` changes, so keying on that plus
        // `progress` is enough.
        const key = `${s.fromIndex}|${s.progress.toFixed(3)}`;
        if (key === lastKey) return;
        lastKey = key;
        gl.render(s.from, s.to, s.progress);
        return;
      }

      // CSS rung: no per-tile hash available on a compositor-only background
      // colour, so this keeps the plain crossfade `sampleGround` still computes
      // into `s.color` for exactly this purpose. A real, if plainer, product —
      // matching `GroundLayer`'s own degradation-ladder philosophy above.
      const css = rgbCss(s.color);
      if (css === lastCss) return;
      lastCss = css;
      host.style.backgroundColor = css;
    };

    measure();
    paint();

    // Ride the existing GSAP ticker rather than adding a second rAF loop or a
    // scroll listener. SmoothScroll already drives that ticker and feeds Lenis
    // into it, so this samples the same clock everything else animates on.
    const onTick = () => paint();
    gsap.ticker.add(onTick);

    const remeasure = () => {
      measure();
      lastKey = "";
      lastCss = "";
      paint();
    };
    window.addEventListener("resize", remeasure, { passive: true });
    // Fires after GSAP has built every pin and inserted its spacers, which is the
    // only point at which section offsets are final.
    ScrollTrigger.addEventListener("refresh", remeasure);
    // ScrollTrigger may already have refreshed before this effect ran; catch that
    // case once on the next frame rather than waiting for a resize.
    const settleId = requestAnimationFrame(remeasure);

    // A lost context must not leave a dead canvas on screen: fall back to CSS.
    const onLost = (e: Event) => {
      e.preventDefault();
      gl?.dispose();
      gl = null;
      if (canvas) canvas.style.opacity = "0";
      lastCss = "";
      paint();
    };
    canvas?.addEventListener("webglcontextlost", onLost);

    return () => {
      cancelAnimationFrame(settleId);
      gsap.ticker.remove(onTick);
      window.removeEventListener("resize", remeasure);
      ScrollTrigger.removeEventListener("refresh", remeasure);
      canvas?.removeEventListener("webglcontextlost", onLost);
      gl?.dispose();
      if (import.meta.env.DEV) {
        delete (window as unknown as { __ground?: unknown }).__ground;
      }
    };
  }, [reduced, lowPower, ready, stops]);

  return (
    <Box
      ref={hostRef}
      aria-hidden
      data-ground-layer
      sx={{
        position: "fixed",
        inset: 0,
        // Behind every section. Sections are transparent so this shows through.
        zIndex: -1,
        pointerEvents: "none",
        // Painted before the effect runs, so there is never a flash of white.
        backgroundColor: stops[0]?.color,
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{ display: "block", width: "100%", height: "100%", opacity: 0 }}
      />
    </Box>
  );
}
