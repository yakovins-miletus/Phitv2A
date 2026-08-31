/**
 * Behind The Code — pinned expand-to-fullscreen film.
 *
 * Pure geometry / timing constants for `DailyLifeSection`'s desktop scrub, kept
 * out of the component so they are unit-testable the same way `closingPhases.ts`
 * and `beatThresholds.ts` are. The section is pinned for `DAILY_LIFE_PIN_VH`
 * viewport-heights: the video card starts inset on the left at `START_WIDTH_VW`,
 * grows to full-bleed by scrub progress `EXPAND_END`, then holds fullscreen for
 * the remaining `1 - EXPAND_END` (the scroll buffer) before the pin releases.
 */

/** Pin length as a multiple of `window.innerHeight`. ~55% of the range is the
 *  expand, the rest is the fullscreen dwell buffer before release. */
export const DAILY_LIFE_PIN_VH = 2.2;

/** Card width at the pin start, in `vw`. */
export const START_WIDTH_VW = 46;

/** Card `xPercent` at the pin start — negative biases it left so its left edge
 *  sits on the viewport edge. For a flex-centred card of width `START_WIDTH_VW`,
 *  the left edge reaches x=0 at translateX = -(100 - START_WIDTH_VW)/2 vw, which
 *  as a percentage of the card's own width is:
 *    -((100 - START_WIDTH_VW) / 2) / START_WIDTH_VW * 100
 */
export const START_SHIFT_PCT =
  -((100 - START_WIDTH_VW) / 2 / START_WIDTH_VW) * 100;

/** Scrub progress (0..1) at which the card has fully expanded to 100vw. */
export const EXPAND_END = 0.55;

/** Corner radius at the pin start; goes to 0 (full-bleed) by `EXPAND_END`. */
export const START_RADIUS_PX = 16;
