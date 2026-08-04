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
  /** Secondary text.
   *
   *  Was `#6B7FA8`, which measured **3.74:1** on `void`, 3.84:1 on `panel` and
   *  4.02:1 on white — below the WCAG AA floor of 4.5:1 for body text, across
   *  108 usages in 38 files. This is the same hue (220.3deg) and saturation
   *  (26%) walked down in lightness only until it clears on the lightest ground
   *  it appears against, so the palette's character is unchanged:
   *      void 4.54:1 · panel 4.66:1 · white 4.88:1
   *  Light grounds only — on the navy sections, secondary text uses white at
   *  alpha, not this token. */
  mist: "#5C719D",
  hairline: "#D1D5DB", // Divider/Border
  /**
   * Pure white.
   *
   * Added when the scroll-driven ground layer took over painting page backgrounds:
   * the hero's ground was a `radial-gradient(..., #FFFFFF 65%, ...)` written inline,
   * and the layer needs that exact value as a stop to hand off to `void` without a
   * visible step. It is a real ground in this design — not the same thing as
   * `void` (#F4F7FC) — so it earns a token rather than another inline literal.
   */
  white: "#FFFFFF",
  /** rgb triplets for rgba() composition */
  goldRgb: "255, 199, 44",
  voidRgb: "244, 247, 252",
  /** Phitopolis brand navy — the sitewide primary color. */
  navyField: "#0A2A66",
  navyFieldRgb: "10, 42, 102",

  /* ── Dark grounds ──────────────────────────────────────────────────────
     These four navies were already load-bearing — the footer, the mega-drawer,
     the blog and innovation heroes and the services terminal graphic all used
     them — but as raw hex scattered across 19 call sites, none of them in this
     file. Named here so there is one place to change them. */
  /** Footer / hero ground. Was `#06183B` in 6 places. */
  navyDeep: "#06183B",
  /** Panel inset on a dark ground. Was `#0A1833`. */
  navyPanel: "#0A1833",
  /** The darkest ground, used for insets and the terminal fill. Was `#061226`. */
  navyInk: "#061226",
  /** Footer gradient floor. Was `#04122E`. */
  navyFloor: "#04122E",

  /** "Live" status indicator — the footer's lab-active dot, the innovation-lab
      badges. Was a raw `#00E676` neon green in four places, a colour in no token
      file and off-key next to navy and gold. Re-cut as a desaturated signal green
      that still reads as "live" without shouting. */
  live: "#3AA189",
} as const;

/**
 * The About timeline's per-chapter accents.
 *
 * These were the Tailwind default palette — violet-400, sky-400, blue-400,
 * emerald-400, fuchsia-400, amber-500, pink-400 — dropped unchanged into a
 * navy-and-gold brand. Seven arbitrary rainbow hues that said nothing about the
 * years they labelled.
 *
 * They are now a single navy → gold ramp walked in chronological order, so the
 * colour carries the same information the timeline does: the story warms toward
 * the present, ending on the brand's own gold. Chapter colour becomes meaning
 * rather than decoration.
 */
export const CHAPTER_ACCENTS: Record<string, string> = {
  "2019": "#2E4C8F",
  "2020": "#2F6FA8",
  "2021": "#2E8C9E",
  "2022": "#3AA189",
  "2023": "#6FAE6A",
  "2024": "#B3B14E",
  "2025": "#E5B228",
  "2026": "#FFC72C",
};

/**
 * Technology-category accents on the About page.
 *
 * `dev`/`infra`/`data` were Tailwind violet-400 / blue-400 / emerald-400 next to
 * a brand-gold `ai`. Re-cut from the same navy→gold ramp above so the four read
 * as one family.
 */
export const TECH_CAT_ACCENTS: Record<string, string> = {
  ai: NOIR.gold,
  dev: "#2F6FA8",
  infra: "#2E8C9E",
  data: "#3AA189",
};

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
