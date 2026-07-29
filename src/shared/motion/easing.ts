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
