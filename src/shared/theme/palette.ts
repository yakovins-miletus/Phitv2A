import type { PaletteOptions } from "@mui/material/styles";

/** Quant-noir tokens — the single source of truth. Motion components that
    can't take theme callbacks (motion.div style, canvas) import NOIR directly
    so no raw hex ever lives outside this file. */
export const NOIR = {
  /* ── Legacy light grounds ──────────────────────────────────────────────────
     The site was light until the glass revamp. These four tokens described that
     palette and are still referenced by the components the sweep has not reached
     yet, so they stay until it does — deleting them here would turn the
     foundation change into a twelve-file redesign and break `tsc -b`.

     @deprecated Retired with the light palette. Do not reach for these in new
     code: on a dark ground use `frost` / `--text-1` for primary text,
     `--text-2` for secondary, and `--glass-divider` for hairlines. */
  void: "#F4F7FC", // Soft cool off-white with subtle primary blue hue
  /** @deprecated See `void` above. */
  panel: "#F8FAFC", // Surface (cool off-white, matches brand reference)
  gold: "#FFC72C",
  goldLight: "#FFD966",
  goldDark: "#E5B228",
  /** @deprecated Primary text on a *light* ground. On dark use `frost`. */
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
   *  alpha, not this token.
   *
   *  @deprecated The site has no light grounds. Use `--text-2` (white at 0.70). */
  mist: "#5C719D",
  /** @deprecated Light-ground divider. On dark use `--glass-divider`. */
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

  /**
   * Primary text on every dark ground — the off-white the glass system reads
   * against.
   *
   * Deliberately the same value as the retired light ground `void`: a cool
   * off-white was always the right neutral here, and only its role changed when
   * the palette inverted. Kept as its own token rather than an alias because
   * `void`'s meaning is "a light page background" and it is on its way out,
   * while this is load-bearing forever.
   *
   * Measured: 17.43:1 on navyInk, 12.73:1 on navyField, and 8.95:1 in the worst
   * case the design produces — elevation-3 glass over navyField. Pure #FFFFFF
   * would be harsher for no legibility gain.
   */
  frost: "#F4F7FC",

  /** rgb triplets for rgba() composition */
  goldRgb: "255, 199, 44",
  voidRgb: "244, 247, 252",
  frostRgb: "244, 247, 252",
  navyInkRgb: "6, 18, 38",
  navyDeepRgb: "6, 24, 59",
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
      that still reads as "live" without shouting.

      STATUS INDICATOR ONLY — never text. It clears AA on the dark grounds
      themselves (4.28–5.16:1) but measures 3.04–3.65:1 on glass over `navyField`,
      so a "live" *label* in this colour would fail on a lifted glass surface.
      Use it for the dot; use `--text-2` or `--accent-fg` for the word next to it.
      tests/a11y-contrast.test.ts pins that sub-AA reading deliberately, the same
      way it pins the two broken white alphas. */
  live: "#3AA189",
} as const;

/**
 * The dawn sky ramp for the default hero (stage 4 of `docs/hero-upgrade/`).
 *
 * A sibling of `NOIR`, not folded into it: `NOIR`'s docblock scopes it to
 * quant-noir *surface* tokens (grounds, glass, text), and a sky is a different
 * concern — it exists for exactly one feature, is a vertical ramp rather than
 * a set of independent roles, and its darkest stop is lighter than `NOIR`'s
 * lightest ground. Keeping it separate means neither file's docblock has to
 * carry an exception for the other.
 *
 * Eight stops, hue-walked top → bottom from navy (220°) to gold (44°) — the
 * same walk `CHAPTER_ACCENTS` above already establishes for the same brand,
 * just run once across a sky instead of eight times across a timeline.
 *
 * WHY THIS IS PHITOPOLIS AND NOT THE REFERENCE SITE: the award-site pattern
 * this borrows the "sky + disc" idea from ramps a cool teal into its warm
 * end. Every cool stop here (`zenith`, `upper`, `mid`) is instead our own
 * `RGB_STEEL` hue at high lightness, and every warm stop (`warm`, `ember`) is
 * our own `RGB_GOLD` hue walked down toward the horizon. No off-brand hue —
 * teal, violet, anything not already in this file's ramp family — enters the
 * palette. The sun core and lit cloud tops reuse `NOIR.gold` / `NOIR.white`
 * outright rather than duplicating them under a new name.
 *
 * WCAG. The only persistent text drawn over this sky is the hero motto
 * (`SuperHeroSequence.tsx`, `NOIR.navyField` at 2.0–2.6rem / 800 weight —
 * large text, so the floor is 3:1, not the 4.5:1 body-text floor). Computed
 * against every stop (`NOIR.navyField` vs. each hex below, WCAG relative
 * luminance):
 *     zenith 5.56:1 · upper 7.78:1 · mid 10.34:1 · haze 11.15:1
 *     warm 10.42:1 · ember 8.88:1
 * The coolest stop (`zenith`) is the worst case at 5.56:1 — comfortably
 * clear of even the 4.5:1 body-text floor, let alone the 3:1 large-text one.
 * `warm` (10.42:1) is pinned alongside it in tests/a11y-contrast.test.ts as
 * the second reference point, matching the two figures this token set was
 * designed around. Every other stop falls between these two.
 */
export const DAWN = {
  /** Top of frame — the `RGB_STEEL` hue at high lightness. */
  zenith: "#8FA6D0",
  /** Upper sky. */
  upper: "#B6C4DF",
  /** Neutral pivot — sits on `NOIR.void`'s own hue. */
  mid: "#DCE0E9",
  /** Cream, top of the cloud sea (stage 5's clouds sit on this). */
  haze: "#F2E6DC",
  /** Peach band. */
  warm: "#F8DCC2",
  /** Gold walked down to the horizon. */
  ember: "#F6C98B",
  /** Cream cloud body — stage 5. */
  cloudMid: "#F1E8E0",
  /** Cool shadowed cloud underside — stage 5. */
  cloudLo: "#C9C6D2",

  /** rgb triplets for rgba() composition, matching NOIR's goldRgb/voidRgb convention. */
  zenithRgb: "143, 166, 208",
  warmRgb: "248, 220, 194",
  cloudLoRgb: "201, 198, 210",
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
 *
 * RE-CUT FOR THE DARK PALETTE. The original ramp started at `#2E4C8F`, which was
 * a reasonable deep blue against an off-white page and measures **2.27:1 against
 * navyInk** — and JourneyTimeline renders it as *text*. `#2F6FA8` was 3.30:1.
 * When the page went dark the cold end of the ramp collapsed into the ground it
 * was drawn on. Every stop was lifted until the whole ramp clears AA on the two
 * grounds the timeline actually sits on, while preserving both contracts: strictly
 * monotonic luminance, and landing on the brand gold.
 *
 * Measured, on the grounds this ramp is allowed to appear on:
 *     navyInk  5.52 → 11.99      navyDeep  5.16 → 11.20
 *
 * CONSTRAINT: those two grounds only. On `navyField` the 2019 stop is 4.03:1, and
 * on elevation-3 glass over navyField it is 2.84:1. The timeline sits on `base`
 * and `deep` and must not be moved onto lifted or glass surfaces without lifting
 * 2019–2020 further. tests/a11y-contrast.test.ts pins the ink/deep floor.
 */
export const CHAPTER_ACCENTS: Record<string, string> = {
  "2019": "#698AD5",
  "2020": "#509BD9",
  "2021": "#42ABBE",
  "2022": "#4BB89B",
  "2023": "#7DBD71",
  "2024": "#AABD55",
  "2025": "#E5B228",
  "2026": "#FFC72C",
};

/**
 * Technology-category accents on the About page.
 *
 * `dev`/`infra`/`data` were Tailwind violet-400 / blue-400 / emerald-400 next to
 * a brand-gold `ai`. Re-cut from the same navy→gold ramp above so the four read
 * as one family — and re-cut again with it for the dark palette, where the old
 * `dev` (#2F6FA8) measured 3.30:1 on navyDeep. These are the 2020/2021/2022 stops.
 */
export const TECH_CAT_ACCENTS: Record<string, string> = {
  ai: NOIR.gold,
  dev: "#509BD9",
  infra: "#42ABBE",
  data: "#4BB89B",
};

export const palette: PaletteOptions = {
  mode: "light",
  background: { default: NOIR.void, paper: NOIR.panel },
  text: {
    primary: NOIR.navyField,
    secondary: "rgba(10, 42, 102, 0.82)",
    disabled: "rgba(10, 42, 102, 0.38)",
  },
  primary: {
    main: NOIR.navyField,
    light: "#14418D",
    dark: "#081F4D",
    contrastText: NOIR.white,
  },
  secondary: {
    main: NOIR.gold,
    light: NOIR.goldLight,
    dark: NOIR.goldDark,
    contrastText: NOIR.navyInk,
  },
  divider: "rgba(10, 42, 102, 0.18)",
  action: {
    hover: "rgba(10, 42, 102, 0.04)",
    selected: "rgba(10, 42, 102, 0.08)",
    disabledBackground: "rgba(10, 42, 102, 0.06)",
  },
};
