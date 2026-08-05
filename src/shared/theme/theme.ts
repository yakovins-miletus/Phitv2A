import { createTheme } from "@mui/material/styles";

import { components } from "./components";
import { palette } from "./palette";

declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    "2xl": true;
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

export const theme = createTheme({
  palette,
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      "2xl": 1536,
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
      letterSpacing: "-0.03em",
    },
    h2: { fontFamily: DISPLAY_FONT, fontSize: "2.5rem", lineHeight: 1.1, fontWeight: 700 },
    h3: { fontFamily: DISPLAY_FONT, fontSize: "1.75rem", lineHeight: 1.2, fontWeight: 500 },
    h4: { fontFamily: DISPLAY_FONT, fontSize: "1.25rem", lineHeight: 1.3, fontWeight: 500 },
    h5: { fontFamily: DISPLAY_FONT, fontSize: "1.1rem", lineHeight: 1.4, fontWeight: 500 },
    h6: { fontFamily: DISPLAY_FONT, fontSize: "1rem", lineHeight: 1.4, fontWeight: 500 },
    subtitle1: { fontSize: "1.125rem", lineHeight: 1.6 },
    body1: { fontSize: "1rem", lineHeight: 1.65 },
    body2: { fontSize: "0.875rem", lineHeight: 1.6 },
    overline: {
      fontFamily: MONO,
      fontSize: "0.75rem",
      fontWeight: 500,
      letterSpacing: "0.16em",
    },
    button: { fontFamily: DISPLAY_FONT, fontWeight: 500, textTransform: "none" },
  },
  components,
});

