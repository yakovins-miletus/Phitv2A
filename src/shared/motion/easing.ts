/**
 * The site's two shared easing curves.
 *
 * Before this module the expo-out tuple [0.16, 1, 0.3, 1] appeared at nineteen
 * call sites in eleven files, and was independently declared as a local const
 * named EASE_OUT_EXPO in three of them (Reveal, CapabilityRack, ServiceDrawer).
 * The quart-in-out curtain curve [0.76, 0, 0.24, 1] appeared at four. Motion
 * wants the tuple; CSS `transition` wants the cubic-bezier() string, so both
 * shapes are exported from one source rather than being retyped per call site.
 *
 * These are decorative choreography, deliberately separate from SCROLL_SPEED in
 * ./scrollSpeed — that one governs scroll navigation and ScrollTrigger scrub
 * lag. Don't merge them.
 */

type CubicBezier = readonly [number, number, number, number];

const css = (e: CubicBezier) => `cubic-bezier(${e.join(", ")})`;

/** Fast out, long settle. The default for reveals, hovers and drawer motion. */
export const EASE_OUT_EXPO: CubicBezier = [0.16, 1, 0.3, 1];
export const EASE_OUT_EXPO_CSS = css(EASE_OUT_EXPO);

/** Symmetric and heavy at both ends — the page-curtain and preloader wipe. */
export const EASE_IN_OUT_QUART: CubicBezier = [0.76, 0, 0.24, 1];
export const EASE_IN_OUT_QUART_CSS = css(EASE_IN_OUT_QUART);

/**
 * Overshoot-then-settle — the only curve here that leaves the 0..1 range.
 *
 * Added for the glass toggle, whose spec asks for a "spring-like" thumb. MUI's
 * SwitchBase is not a `motion` component, so the spring has to be a CSS timing
 * function rather than a physics simulation; a bezier with a control point above 1
 * gives the same read — the thumb passes its mark and comes back — in one
 * declaration and on the compositor.
 *
 * Reserved for small, discrete state flips (a thumb, a checkmark). Do not use it on
 * anything large or scroll-driven: an overshoot on a big surface reads as a bounce,
 * which is the opposite of what this design is after.
 */
export const EASE_SPRING_SOFT: CubicBezier = [0.34, 1.56, 0.64, 1];
export const EASE_SPRING_SOFT_CSS = css(EASE_SPRING_SOFT);

/** Subtle overshoot for interactive transforms. */
export const EASE_SPRING_SUBTLE: CubicBezier = [0.175, 0.885, 0.32, 1.275];
export const EASE_SPRING_SUBTLE_CSS = css(EASE_SPRING_SUBTLE);
