import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { usePreloaderReady, useReducedMotion } from "@/shared/motion";
import { SCROLL_SPEED, scrollEase } from "@/shared/motion/scrollSpeed";
import { publishScrollTriggerRefresh } from "@/shared/motion/scrollTriggerBridge";

gsap.registerPlugin(ScrollTrigger);

/** GSAP's own lagSmoothing defaults, restored when Lenis tears down. */
const GSAP_LAG_THRESHOLD_MS = 500;
const GSAP_LAG_ADJUSTED_MS = 33;

// The live Lenis instance. Null whenever smoothing is off — and note that this
// module is only ever imported by the lazy home chunk, so on every route other
// than "/" it is null for the entire visit. That is by design (Lenis smoothing
// is a home-page treatment), but it means the three accessors below are silent
// no-ops elsewhere: CapabilityRack's stopLenis/startLenis pairs around its
// drawer do nothing on /services. Documented rather than "fixed", because
// hoisting SmoothScroll to the root would turn smoothing on site-wide.
let activeLenis: Lenis | null = null;

/** The live Lenis instance, or null when smoothing is off (reduced motion,
 *  preloader still up, unmounted, or any route other than "/"). */
export function getLenis(): Lenis | null {
  return activeLenis;
}

/** Pause page scrolling under an overlay UI. No-op when Lenis isn't live. */
export function stopLenis(): void {
  activeLenis?.stop();
}
/** Resume after stopLenis. No-op when Lenis isn't live. */
export function startLenis(): void {
  activeLenis?.start();
}

// Published for AppShell, which is eager and must not import gsap. See
// scrollTriggerBridge.ts. Module scope, matching the previous
// window.ScrollTrigger assignment: AppShell may refresh before this component
// mounts, and the plugin is usable as soon as the module is evaluated.
publishScrollTriggerRefresh(() => { ScrollTrigger.refresh(); });

// Dev-only handle for the parity ladder in tests/e2e/ladder-probe.js, which
// needs to read every trigger's resolved start/end. This used to be assigned
// unconditionally and shipped to production; app code now goes through the
// bridge above, so only the probe needs it and only in dev.
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { ScrollTrigger?: typeof ScrollTrigger }).ScrollTrigger = ScrollTrigger;
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
