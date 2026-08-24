import { createTheme } from "@mui/material/styles";

import { components } from "./components";
import { palette } from "./palette";

declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    "3xl": true;
  }
}

/** The display font — headings and interactive elements. */
export const DISPLAY_FONT = "'Outfit', -apple-system, 'Helvetica Neue', Arial, sans-serif";

/** The body font — sitewide default for text and paragraphs. */
export const BODY_FONT = "'Inter', -apple-system, 'Helvetica Neue', Arial, sans-serif";

/** Legacy export — maps to the body font for backward compatibility. */
export const FONT = BODY_FONT;

/** The mono meta rail — exported for sx use on meta-labels and data readouts. */
export const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

/**
 * The type scale — the whole ramp, as raw values.
 *
 * ## Why this exists
 *
 * The variants below are the preferred way to set type (`<Typography
 * variant="caption">`), but a large share of the site's text is not a
 * `Typography`: labels inside buttons, chips, spans, `component="span"` bits
 * of a larger sentence. Those reach for `sx={{ fontSize }}`, and with no token
 * to reach for they reached for a literal — which is how the codebase ended up
 * with **57 distinct literal `fontSize` values plus 76 responsive
 * `fontSize:{}` objects** (measured 2026-08-23).
 *
 * Most of that is not variety, it is noise: 0.68 / 0.6875 / 0.7rem are the
 * same size to the eye, as are 0.72 / 0.74 / 0.75 / 0.76 / 0.78. Eight steps
 * cover every real typographic need on the site; the rest were accidents.
 *
 * ## Using it
 *
 * Prefer `variant` on a `Typography`. Reach for `TYPE_SCALE` when the element
 * is not a `Typography` and a variant would mean wrapping content in one just
 * to get a size. **Do not add a step** without deciding it is genuinely a new
 * tier rather than a nudge of an existing one — the nudges are what this
 * replaces.
 */
export const TYPE_SCALE = {
  /** Mono meta-rail labels. Pairs with `MONO` + uppercase + wide tracking. */
  micro: "0.6875rem",
  /** Small UI text: captions, helper text, dense table cells. */
  caption: "0.75rem",
  /** Secondary body text. */
  body2: "0.875rem",
  /** Default body text. */
  body1: "1rem",
  /** Lead paragraphs and section ledes. */
  subtitle1: "1.125rem",
  /** Small headings. */
  h4: "1.25rem",
  /** Section headings. */
  h3: "1.75rem",
  /** Page headings. */
  h2: "2.5rem",
} as const;

/**
 * Line heights, tied to the scale rather than chosen per call site (16 distinct
 * values were in use). Inverse to size: display type is set tight, body copy
 * open enough to read at a 65ch measure.
 */
export const LINE_HEIGHT = {
  /** Display/headline. */
  tight: 1.15,
  /** Headings and short UI strings. */
  snug: 1.4,
  /** Body copy. */
  relaxed: 1.65,
} as const;

/**
 * Letter spacing. Three intents, replacing the 20+ ad-hoc values:
 * display type is optically tightened, body sits at the font's own metrics,
 * and the mono meta-rail is deliberately opened up.
 */
export const TRACKING = {
  /** Large display type — negative, because big type sets loose optically. */
  display: "-0.03em",
  /** Body and UI. */
  normal: "0",
  /** Uppercase mono labels. */
  meta: "0.16em",
} as const;

export const theme = createTheme({
  palette,
  /**
   * `2xl` used to sit here at 1536 — the SAME value as `xl`. Every
   * `<Container maxWidth="2xl">` was therefore indistinguishable from `xl`,
   * so the wider tier the call sites believed they were opting into never
   * existed. Removed rather than given a real value: a fourth tier above `lg`
   * is the variant sprawl this theme is meant to prevent, and nothing was
   * actually asking for a width between 1536 and 1920.
   *
   * If a genuinely wider container is ever needed, add a named container token
   * (`--container-wide`) rather than a breakpoint — breakpoints are about when
   * layout changes, not how wide one container happens to be.
   *
   * `3xl` is currently unused by any call site but is a real, distinct value;
   * kept for wide-display work rather than removed as dead config.
   */
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      "3xl": 1920,
    },
  },
  /**
   * Stays 4 — do not "align" this with the glass system's 12px control radius.
   *
   * In `sx`, `borderRadius: n` means n × this value, and the codebase has ~40 such
   * multiplier call sites (`borderRadius: 3` appears 13 times, `4` nine times,
   * `5` in SiteFooter). Raising the base to 12 would silently triple every one of
   * them — a 12px card corner becoming 36px with nothing in the diff to show it.
   *
   * The corner language is owned explicitly instead, by --r-control / --r-card /
   * --r-panel / --r-pill in glass.css, applied through the component overrides in
   * ./components.ts. Since those overrides cover every MUI surface the site
   * actually renders, this default is only ever a fallback.
   */
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: BODY_FONT,
    h1: {
      fontFamily: DISPLAY_FONT,
      fontSize: "clamp(3rem, 8vw, 6rem)",
      lineHeight: 1.02,
      fontWeight: 700,
      letterSpacing: TRACKING.display,
    },
    h2: { fontFamily: DISPLAY_FONT, fontSize: TYPE_SCALE.h2, lineHeight: 1.1, fontWeight: 700 },
    h3: { fontFamily: DISPLAY_FONT, fontSize: TYPE_SCALE.h3, lineHeight: 1.2, fontWeight: 500 },
    h4: { fontFamily: DISPLAY_FONT, fontSize: TYPE_SCALE.h4, lineHeight: 1.3, fontWeight: 500 },
    h5: { fontFamily: DISPLAY_FONT, fontSize: "1.1rem", lineHeight: 1.4, fontWeight: 500 },
    h6: { fontFamily: DISPLAY_FONT, fontSize: TYPE_SCALE.body1, lineHeight: 1.4, fontWeight: 500 },
    subtitle1: { fontSize: TYPE_SCALE.subtitle1, lineHeight: 1.6 },
    body1: { fontSize: TYPE_SCALE.body1, lineHeight: LINE_HEIGHT.relaxed },
    body2: { fontSize: TYPE_SCALE.body2, lineHeight: 1.6 },
    /** MUI ships `caption`; it simply had no theme entry, so it inherited
     *  defaults while the codebase hand-rolled 0.72-0.78rem equivalents. */
    caption: { fontSize: TYPE_SCALE.caption, lineHeight: LINE_HEIGHT.snug },
    /** The tier below `overline` on the mono meta-rail. See muiAugmentation.d.ts. */
    micro: {
      fontFamily: MONO,
      fontSize: TYPE_SCALE.micro,
      fontWeight: 500,
      lineHeight: LINE_HEIGHT.snug,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    },
    overline: {
      fontFamily: MONO,
      fontSize: TYPE_SCALE.caption,
      fontWeight: 500,
      letterSpacing: TRACKING.meta,
    },
    button: { fontFamily: DISPLAY_FONT, fontWeight: 500, textTransform: "none" },
  },
  components,
});

