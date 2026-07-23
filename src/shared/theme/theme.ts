import { createTheme } from "@mui/material/styles";

import { components } from "./components";
import { palette } from "./palette";

/** Single sitewide font — headings and body both render in Outfit. */
export const FONT = "'Outfit', -apple-system, 'Helvetica Neue', Arial, sans-serif";

/** The mono meta rail — exported for sx use on meta-labels and data readouts. */
export const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

export const theme = createTheme({
  palette,
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: FONT,
    h1: {
      fontFamily: FONT,
      fontSize: "clamp(3rem, 8vw, 6rem)",
      lineHeight: 1.02,
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    h2: { fontFamily: FONT, fontSize: "2.5rem", lineHeight: 1.1, fontWeight: 700 },
    h3: { fontFamily: FONT, fontSize: "1.75rem", lineHeight: 1.2, fontWeight: 500 },
    h4: { fontFamily: FONT, fontSize: "1.25rem", lineHeight: 1.3, fontWeight: 500 },
    subtitle1: { fontSize: "1.125rem", lineHeight: 1.6 },
    body1: { fontSize: "1rem", lineHeight: 1.65 },
    body2: { fontSize: "0.875rem", lineHeight: 1.6 },
    overline: {
      fontFamily: MONO,
      fontSize: "0.75rem",
      fontWeight: 500,
      letterSpacing: "0.16em",
    },
    button: { fontFamily: FONT, fontWeight: 500, textTransform: "none" },
  },
  components,
});
