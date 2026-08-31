/**
 * Bar-transition phase math — pure functions of a ScrollTrigger's 0..1
 * scrub progress `p`.
 *
 * The inter-section transition is five stacked horizontal bars. As the reader
 * scrolls through the section, each bar wipes its `from`-colour cover upward to
 * reveal the `to` colour rising from the bottom edge. Bars resolve in
 * bottom-to-top order: the bottom bar (highest index) starts first, the top bar
 * (index 0) last. Windows overlap so the sweep reads as one continuous rise
 * rather than five discrete steps.
 *
 * The whole sweep finishes at `TRANSITION_DONE` (well before `p = 1`), so the
 * new ground has fully taken the screen by the time the section is centred in
 * the viewport — not only once it has scrolled entirely past. The tail of the
 * scrub (p `TRANSITION_DONE`→1) is then just the settled new ground sliding up
 * as the next section arrives beneath it (same colour, so it reads seamless).
 *
 * Mirrors the disjoint-ramp style of `closing-scene/closingPhases.ts`: no React
 * state, no GSAP timeline — the component just calls these on every `onUpdate`
 * and writes the result to a CSS custom property.
 */

/** Number of horizontal bars. Fixed at every viewport. */
export const BAR_COUNT = 5;

/** Scrub progress at which every bar has finished its wipe. The section is
 *  centred in the viewport at p ≈ 0.5, so the transition is visually complete
 *  by the time the reader is "past the middle" of it. */
export const TRANSITION_DONE = 0.5;

/** Scroll-progress span of a single bar's wipe. Neighbours overlap so the
 *  leading edge never stalls. */
export const BAR_WINDOW = 0.26;

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Reveal amount for one bar: 0 = fully covered by the `from` colour,
 * 1 = fully revealed to the `to` colour.
 *
 * `barIndex` 0 is the top bar, `BAR_COUNT - 1` the bottom bar.
 */
export function barRevealFor(barIndex: number, p: number): number {
  const slot = BAR_COUNT - 1 - barIndex; // bottom bar => slot 0 (starts first)
  const spread = TRANSITION_DONE - BAR_WINDOW; // total stagger across all bars
  const start = (slot / (BAR_COUNT - 1)) * spread;
  return clamp01((p - start) / BAR_WINDOW);
}

/**
 * `clip-path` for a bar's `from`-colour cover. As `reveal` goes 0 → 1 the cover
 * collapses toward its top edge (`inset(0%…)` → `inset(100%…)`), so the `to`
 * colour underneath is uncovered from the bottom up.
 */
export function barClipFor(reveal: number): string {
  return `inset(${(clamp01(reveal) * 100).toFixed(2)}% 0% 0% 0%)`;
}

/** Fully-revealed cover clip — the DOM default so a bar that never animates
 *  still shows the `to` colour. */
export const BAR_CLIP_LIT = barClipFor(1);
