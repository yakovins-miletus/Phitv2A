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
 * Mirrors the disjoint-ramp style of `closing-scene/closingPhases.ts`: no React
 * state, no GSAP timeline — the component just calls these on every `onUpdate`
 * and writes the result to a CSS custom property.
 */

/** Number of horizontal bars. Fixed at every viewport. */
export const BAR_COUNT = 5;

/** Fraction of total scroll progress a single bar's wipe occupies. Its
 *  neighbours' windows overlap it so the leading edge never stalls. */
export const BAR_WINDOW = 0.5;

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Reveal amount for one bar: 0 = fully covered by the `from` colour,
 * 1 = fully revealed to the `to` colour.
 *
 * `barIndex` 0 is the top bar, `BAR_COUNT - 1` the bottom bar.
 */
export function barRevealFor(barIndex: number, p: number): number {
  const slot = BAR_COUNT - 1 - barIndex; // bottom bar => slot 0 (starts first)
  const start = (slot * (1 - BAR_WINDOW)) / (BAR_COUNT - 1);
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
