import type { PaletteOptions } from "@mui/material/styles";

/** Quant-noir tokens — the single source of truth. Motion components that
    can't take theme callbacks (motion.div style, canvas) import NOIR directly
    so no raw hex ever lives outside this file. */
export const NOIR = {
  void: "#F4F7FC", // Soft cool off-white with subtle primary blue hue
  panel: "#F8FAFC", // Surface (cool off-white, matches brand reference)
  gold: "#FFC72C",
  goldLight: "#FFD966",
  goldDark: "#E5B228",
  ink: "#0A2A66", // Primary text uses Phitopolis Navy
  mist: "#6B7FA8", // Secondary text
  hairline: "#D1D5DB", // Divider/Border
  /** rgb triplets for rgba() composition */
  goldRgb: "255, 199, 44",
  voidRgb: "244, 247, 252",
  /** Phitopolis brand navy — the sitewide primary color. */
  navyField: "#0A2A66",
  navyFieldRgb: "10, 42, 102",
} as const;

export const palette: PaletteOptions = {
  mode: "light",
  background: { default: NOIR.void, paper: NOIR.panel },
  text: { primary: NOIR.ink, secondary: NOIR.mist },
  primary: {
    main: NOIR.navyField,
    light: "#14418D",
    dark: "#081F4D",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: NOIR.gold,
    light: NOIR.goldLight,
    dark: NOIR.goldDark,
    contrastText: "#FFFFFF",
  },
  divider: NOIR.hairline,
};
