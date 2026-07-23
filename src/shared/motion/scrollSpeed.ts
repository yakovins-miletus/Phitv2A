/** The one scroll-navigation speed for the whole site — originally the
 *  In Practice section's use-case paging duration. Governs Lenis scrollTo
 *  calls and GSAP ScrollTrigger `scrub` lag; NOT scroll-reveal fades, hover
 *  transitions, or decorative animation choreography (those are a separate,
 *  intentionally distinct system). */
export const SCROLL_SPEED = 0.65;

export function scrollEase(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}
