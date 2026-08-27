import Lenis from "lenis";

// The live Lenis instance. Null whenever smoothing is off — and note that this
// module is only ever imported by the lazy home chunk, so on every route other
// than "/" it is null for the entire visit. That is by design (Lenis smoothing
// is a home-page treatment), but it means the three accessors below are silent
// no-ops elsewhere: CandidatesAndCareersSection's stopLenis/startLenis pairs
// around its drawer do nothing off the home page. Documented rather than
// "fixed", because hoisting SmoothScroll to the root would turn smoothing on
// site-wide.
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

/** Set the active Lenis instance. */
export function setActiveLenis(lenis: Lenis | null): void {
  activeLenis = lenis;
}
