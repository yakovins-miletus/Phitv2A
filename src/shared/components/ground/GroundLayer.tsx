import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { usePreloaderReady, useReducedMotion } from "@/shared/motion";
import { GROUND_STOPS, rgbCss, sampleGround, type GroundStop } from "./groundStops";

/**
 * The page ground — flat-fill only.
 *
 * One fixed layer behind all content that owns the background colour and
 * tracks which section the user is reading. Each section now paints its own
 * opaque `bgcolor` (see `SectionBeat.tsx`), so this layer is effectively a
 * safety net behind every section and the `BarTransitionSection` blocks.
 *
 * The per-tile WebGL wipe that used to run here has been extracted — the
 * inter-section transition is now `BarTransitionSection`, an opaque
 * document-flow section of five horizontal bars that paints its own two
 * adjacent ground colours. This layer no longer runs any animation; it simply
 * sets a flat background color matching the current section.
 *
 * Degradation: under `prefers-reduced-motion`, a single static paint of the
 * first ground, then nothing runs.
 */
export interface GroundLayerProps {
  /** The ground track to paint. Defaults to the home page's `GROUND_STOPS`;
   *  /about passes `ABOUT_GROUND_STOPS` so its own sections' grounds paint
   *  instead of home's (see about.tsx). */
  stops?: readonly GroundStop[];
}

export function GroundLayer({ stops = GROUND_STOPS }: GroundLayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
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
    if (reduced === true) {
      host.style.backgroundColor = stops[0]?.color ?? "";
      return;
    }
    if (!ready) return;

    /**
     * Document offsets of each stop's section. Re-measured every tick so
     * pin-spacer insertions, lazy images, and font swaps don't leave
     * `positions[]` stale.
     */
    let positions: number[] = [];
    const measurePositions = () => {
      positions = stops.map((stop) => {
        const el = document.getElementById(stop.id);
        if (!el) return Number.POSITIVE_INFINITY;
        return window.scrollY + el.getBoundingClientRect().top;
      });
    };

    let lastCss = "";
    let lastDocH = 0;
    let stableTicks = 0;
    let layoutStable = false;

    const paint = () => {
      if (positions.length === 0) return;

      measurePositions();
      const docH = document.documentElement.scrollHeight;
      if (docH !== lastDocH) {
        lastDocH = docH;
        stableTicks = 0;
      } else {
        stableTicks++;
        if (stableTicks >= 2) layoutStable = true;
      }

      if (!layoutStable) {
        const flat = stops[0]?.color ?? "";
        if (flat !== lastCss) {
          lastCss = flat;
          host.style.backgroundColor = flat;
        }
        return;
      }

      // Flat fill only: read the current section's color, no blend/progress.
      const s = sampleGround(stops, positions, window.scrollY);
      // Use the "from" color (the section we're currently in) as a flat fill.
      // Progress is ignored — the visible transition lives in
      // BarTransitionSection components in the document flow.
      const css = rgbCss(s.from);
      if (css === lastCss) return;
      lastCss = css;
      host.style.backgroundColor = css;

      if (import.meta.env.DEV) {
        (window as unknown as { __ground?: unknown }).__ground = {
          renderer: "css-flat",
          color: css,
          progress: 0,
          stop: stops[s.fromIndex]?.id,
          act: stops[s.fromIndex]?.act,
          positions: positions.slice(),
        };
      }
    };

    measurePositions();
    paint();

    const onTick = () => paint();
    gsap.ticker.add(onTick);

    const remeasure = () => {
      measurePositions();
      lastCss = "";
      paint();
    };
    window.addEventListener("resize", remeasure, { passive: true });

    const onRefresh = () => {
      remeasure();
      layoutStable = true;
    };
    ScrollTrigger.addEventListener("refresh", onRefresh);
    const settleId = requestAnimationFrame(remeasure);

    return () => {
      cancelAnimationFrame(settleId);
      gsap.ticker.remove(onTick);
      window.removeEventListener("resize", remeasure);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      if (import.meta.env.DEV) {
        delete (window as unknown as { __ground?: unknown }).__ground;
      }
    };
  }, [reduced, ready, stops]);

  return (
    <Box
      ref={hostRef}
      aria-hidden
      data-ground-layer
      sx={{
        position: "fixed",
        inset: 0,
        // Behind every section and behind BarTransitionSection blocks.
        zIndex: -1,
        pointerEvents: "none",
        // Painted before the effect runs, so there is never a flash of white.
        backgroundColor: stops[0]?.color,
      }}
    />
  );
}
