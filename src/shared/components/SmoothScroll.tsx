import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { usePreloaderReady, useReducedMotion } from "@/shared/motion";
import { SCROLL_SPEED, scrollEase } from "@/shared/motion/scrollSpeed";

gsap.registerPlugin(ScrollTrigger);

/** GSAP's own lagSmoothing defaults, restored when Lenis tears down. */
const GSAP_LAG_THRESHOLD_MS = 500;
const GSAP_LAG_ADJUSTED_MS = 33;

// The live Lenis instance, for programmatic scrolls (section paging) that
// must run through Lenis rather than fight it. Null when smoothing is off
// (reduced motion, preloader, unmounted).
let activeLenis: Lenis | null = null;
export function getLenis(): Lenis | null {
  return activeLenis;
}

// Pause / resume helpers for overlay UIs (drawers, modals) that need their
// own internal scroll without the page scrolling underneath.
export function stopLenis() {
  activeLenis?.stop();
}
export function startLenis() {
  activeLenis?.start();
}
if (typeof window !== "undefined") {
  (window as any).ScrollTrigger = ScrollTrigger;
}

// Lenis smooth scroll wired to GSAP's ticker/ScrollTrigger. Lives in its own
// module (rendered by the lazy home chunk) so gsap and lenis never load on
// routes that don't scroll-animate. Renders nothing.
export function SmoothScroll() {
  const reduced = useReducedMotion();
  const ready = usePreloaderReady();

  useEffect(() => {
    if (reduced === true || !ready) return;
    const lenis = new Lenis({ duration: SCROLL_SPEED, easing: scrollEase });
    activeLenis = lenis;
    // Dev-only handle for the parity ladder in tests/e2e/. The probe must
    // drive Lenis rather than fight its rAF loop, or every recorded scroll
    // offset is whatever Lenis animated back to. Stripped from production.
    if (import.meta.env.DEV) {
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    }

    lenis.on("scroll", ScrollTrigger.update);
    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    // Lenis owns the frame loop while it lives, so GSAP must not compensate for
    // dropped frames underneath it. Restored on cleanup — this used to leak,
    // leaving lag smoothing off for the rest of the session on every route.
    gsap.ticker.lagSmoothing(0);

    // Recompute trigger positions once painted: layout may have shifted while
    // the preloader overlay was up (fonts, lazy content).
    const refreshId = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(refreshId);
      if (import.meta.env.DEV) {
        delete (window as unknown as { __lenis?: Lenis }).__lenis;
      }
      if (activeLenis) {
        activeLenis.start();
        activeLenis.destroy();
        activeLenis = null;
      }
      gsap.ticker.remove(onTick);
      gsap.ticker.lagSmoothing(GSAP_LAG_THRESHOLD_MS, GSAP_LAG_ADJUSTED_MS);
      lenis.off("scroll", ScrollTrigger.update);
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [reduced, ready]);

  return null;
}
