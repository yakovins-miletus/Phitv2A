/** The one scroll-navigation speed for the whole site — originally the
 *  In Practice section's use-case paging duration. Governs Lenis scrollTo
 *  calls and GSAP ScrollTrigger `scrub` lag; NOT scroll-reveal fades, hover
 *  transitions, or decorative animation choreography (those are a separate,
 *  intentionally distinct system). */
export const SCROLL_SPEED = 0.65;

/** Lenis's own wheel/trackpad smoothing duration — deliberately split from
 *  `SCROLL_SPEED` (which also drives programmatic `scrollTo` calls and every
 *  ScrollTrigger `scrub` value) so tightening the raw-scroll smoothing catch-up
 *  doesn't also speed up or slow down those unrelated behaviours. Lower than
 *  `SCROLL_SPEED` on purpose: fast, continuous scroll input (trackpad flicks,
 *  mobile momentum) was building up a perceptibly laggy gap between the raw
 *  scroll position and what ScrollTrigger reads at 0.65s; 0.45s keeps the
 *  smoothing (the reason Lenis exists) without the visible catch-up. */
export const LENIS_SMOOTH_DURATION = 0.45;

export function scrollEase(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}
