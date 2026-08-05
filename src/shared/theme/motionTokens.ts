/**
 * Interaction motion tokens — the numeric twins of the `--dur-*` / `--stagger`
 * custom properties in ./glass.css.
 *
 * Both shapes exist for the same reason `easing.ts` exports a tuple *and* a
 * cubic-bezier string: CSS `transition` wants the token, and Motion's JS API wants a
 * number. Duplicating the value in two forms from one source beats retyping `0.2` at
 * a hundred call sites.
 *
 * ── WHAT THE CEILING APPLIES TO ──────────────────────────────────────────────────
 *
 * `DUR_MAX` is a **micro-interaction** budget: hover, focus, press, toggle, menu
 * open. Those must feel instant, and anything over ~0.35s on a control reads as
 * sluggish rather than smooth.
 *
 * It is deliberately NOT a ceiling on scroll-entrance choreography. `Reveal` runs at
 * 0.6s and `StaggerItem` at 0.5s with EASE_OUT_EXPO, and that is the site's narrative
 * cadence across ~40 sections — shortening it to satisfy a number meant for buttons
 * would change the feel of every page for no gain. Same for `StageSection`'s pin
 * choreography in `stageChoreo.ts`, which owns its own durations.
 *
 * Kept next to — not inside — `glass()` because this is choreography rather than
 * surface, the same separation `easing.ts` keeps from `scrollSpeed.ts`.
 */

/** The default interaction duration. Everything hover/press-shaped uses this. */
export const DUR_FAST = 0.2;

/** The hard ceiling for interaction states. See the note above on what it covers. */
export const DUR_MAX = 0.35;

/**
 * Entrance stagger between siblings, in seconds. The brief asks for 40–60ms; 50ms
 * sits in the middle. `Reveal`'s `staggerChildren` was an independent `0.06` — in
 * range, but a second home for the same idea.
 */
export const STAGGER = 0.05;

/** Hover lift, in px. Negative because it rises. Pressed returns to 0. */
export const HOVER_LIFT = -2;
