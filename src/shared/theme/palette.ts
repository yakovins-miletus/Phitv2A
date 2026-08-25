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
  /**
   * Phitopolis brand gold — the sitewide secondary/accent, and the only one.
   *
   * Fill, border and TEXT, on light grounds and dark alike: this is
   * `--accent-fg` in both scopes of `glass.css` and `palette.secondary.main`
   * below. A per-ground bronze (`goldInk`, #8C5F09) used to carry the text role
   * on light grounds for contrast; it was retired because half the call sites
   * wrote the gold literally and never picked it up, so one brand role rendered
   * in four different colours across the site.
   *
   * The trade-off is deliberate: as text on a light ground this measures 1.45:1
   * on `void`, below the AA floor. `tests/a11y-contrast.test.ts` pins that ratio
   * rather than hiding it.
   */
  gold: "#FFC72C",
  goldLight: "#FFD966",
  goldDark: "#E5B228",
  /** Brand gold walked down in lightness until it clears AA as TEXT on the
   *  light grounds. Measured: void 5.21:1, panel 5.34:1, white 5.59:1, against
   *  gold's own 1.45 / 1.49 / 1.56. (Worst case across the glass-tinted light
   *  surfaces `tests/a11y-contrast.test.ts` checks is 4.59:1, still ≥ AA_BODY.)
   *
   *  This token was retired once before, and the note above records why: half
   *  the call sites wrote the gold literally and never picked the bronze up, so
   *  one brand role rendered in four colours. It is back on a narrower contract
   *  than last time, and the contract is the point:
   *
   *    Use it ONLY where brand gold is TEXT sitting on a light ground.
   *    Not for fills. Not for borders. Not for icons. Not on dark grounds,
   *    where `gold` itself measures 9:1 and up and should be used.
   *
   *  Everything outside that one role stays `gold`, so there is still exactly
   *  one accent; this is the same accent made readable where it has to be read.
   *
   *  ── THE FULL RULE ──────────────────────────────────────────────────────
   *
   *  | Context                                                | Token      |
   *  |---------------------------------------------------------|------------|
   *  | Any ground — fills, borders, icons, decorative marks    | `gold`     |
   *  | Text on a light ground (overlines, eyebrows, mailto     |            |
   *  | links, active nav label, contained-button labels)       | `goldInk`  |
   *  | Text on a dark ground (measures ≥9:1)                   | `gold`     |
   *  | Large display type on light, ≥24px / ≥19px bold,        |            |
   *  | decorative — case by case                                | `gold`     |
   *
   *  A logotype/wordmark ("IT" in PHITOPOLIS) is WCAG 1.4.3-exempt and stays
   *  `gold` unconditionally on both grounds — it is not a text role for the
   *  purposes of this table. */
  /**
   * @deprecated No longer the text token. The user made a deliberate brand
   * call to use `gold` (#FFC72C) as the accent on every ground, including as
   * TEXT on light grounds, accepting that it falls below the WCAG AA
   * contrast floor there (see `tests/a11y-contrast.test.ts`, which pins the
   * resulting ratio as a known, accepted value rather than a regression).
   * This bronze walk-down is kept only so the token still resolves for any
   * stray reference; do not use it in new code and do not reintroduce
   * `dark ? gold : goldInk` branching — it's `gold` unconditionally now.
   */
  goldInk: "#8C5F09",
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
  /** The light ground's glass understudy — `--glass-under-rgb` inside `:root`. */
  whiteRgb: "255, 255, 255",
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
 * The 3D playground's atmosphere — a sky with a hue arc in it, and a cloud deck.
 *
 * A third sibling to `NOIR` and `DAWN` rather than more `DAWN` stops, for two
 * reasons that both have to hold or these belong upstairs:
 *
 * **1. Different job.** `DAWN` is the 2D hero's CSS sky: eight stops of a
 * vertical linear-gradient behind a static card. This set feeds a *lit* room —
 * `SkyDome`'s five-stop dome ramp, its scattering lobe and sun core, and
 * `CloudSea`'s three-value deck. Half of these tokens are never a background at
 * all; they are cloud shading, and a cloud is only convincing when its lit face,
 * its shoulder and its underside are three different **hues** rather than three
 * brightnesses of one.
 *
 * **2. Different contrast contract.** `DAWN`'s docblock pins per-stop WCAG
 * figures against the hero motto, which sits at top-left in both states. What
 * differs here is the *foreground*: over this sky the motto flips to frost
 * whenever `isPhaseDark` says the room is dark, so the lit stops are measured
 * against navy and the night stops against frost, each only against the
 * foreground it can actually appear behind. Folding them into `DAWN` would have
 * meant either failing its all-tokens-vs-navy loop or keeping the clouds too
 * pale to shade — which was the bug this set exists to fix.
 *
 * **The violet is deliberate, and it is the point.** `DAWN`'s docblock rules
 * out "teal, violet, anything not already in this file's ramp family". That rule
 * was written for a gradient that walks navy (220°) straight to gold (44°) — and
 * a straight walk between those two in linear sRGB is exactly what produced the
 * washed-out middle this set replaces. A real sunset does not interpolate from
 * blue to gold; it goes **around**, through periwinkle, violet, mauve and rose,
 * and every one of those hues is on the cool-to-warm arc our own steel and gold
 * already bracket. The arc below is that walk made explicit in eight stops, so
 * the middle of the sky is a colour someone chose instead of a colour a `mix()`
 * landed on. It is scoped to the 3D room and nothing else consumes it.
 *
 * WCAG, computed against `NOIR.navyField` (the motto's navy on the three lit
 * phases) and against `NOIR.frost` (the motto at night, after `isPhaseDark`
 * flips the chrome). Both foregrounds are 2.0–2.6rem/800 — large text, 3:1
 * floor — and every stop below clears it with margin on the foreground it can
 * actually appear behind:
 *
 *     lit arc vs navyField:  deepBlue 4.81 · periwinkle 6.34 · violet 6.69
 *                            mauve 7.32 · rose 8.50 · blush 9.61
 *                            peach 10.15 · cream 11.81 · sunCore 12.78
 *     deck vs navyField:     cloudLit 11.34 · cloudMauve 7.03 · cloudDeep 4.33
 *     night vs frost:        zenith 15.57 · upper 12.91 · mid 10.00
 *                            lower 7.09 · horizon 4.59 · cloudLit 3.59
 *                            cloudMauve 6.49 · cloudDeep 10.13
 *
 * `cloudDeep` (4.33) and `nightCloudLit` (3.59) are the two worst cases and both
 * are pinned in `tests/a11y-contrast.test.ts`. Every figure improved with the
 * softening pass, which is not a coincidence: desaturating toward a stop's own
 * lightness moves it away from mid-grey in luminance terms, and the two
 * foregrounds here sit at the extremes.
 */
export const SKY = {
  /* ── The lit hue arc, top of frame → horizon ────────────────────────────
   * Eight stops walking 232° → 45° the long way round: blue, periwinkle,
   * violet, mauve, rose, blush, peach, cream. A phase picks five of them; the
   * ones it skips are usually doing the glow instead.
   *
   * **Every stop here was desaturated by ~40% from its first cut**, with the
   * lightness lifted proportionally into whatever headroom it had left. The
   * first version put the arc's hues in the right places at full chroma, and
   * full chroma is not what a sunset looks like from inside one — the air is
   * hazy, and haze is the thing that mutes a sky toward its own average as it
   * goes. Saturated pastels read as a gradient someone chose; muted ones read
   * as distance.
   *
   * The desaturation is uniform *by ratio*, not by amount, which is the part
   * that matters: scaling every stop's saturation by the same factor keeps the
   * hue walk intact and only lowers its amplitude. A flat subtraction would
   * have collapsed the low-chroma stops (`cream`, `sunCore`) to grey while
   * barely touching `rose`, turning an arc into a smear. Pushed further — half
   * chroma was tried — `violet` and `mauve` converge on the same lilac-grey and
   * the middle this set exists to provide disappears again. */
  /** Zenith on the warm phases, and the darkest value in any lit sky. */
  deepBlue: "#8C97C9",
  /** Upper band. Still blue, already turning. */
  periwinkle: "#A7AFD5",
  /** **The first missing middle.** Blue's warm neighbour, and the stop that
   *  stops a blue→cream mix passing through grey. */
  violet: "#BBB0D4",
  /** Violet → rose pivot. */
  mauve: "#CFB6CF",
  /** **The second missing middle** — the pink band a real sunset carries, and
   *  still the most chromatic stop in the set even after the softening. */
  rose: "#E8C2D0",
  /** Rose → peach. Where the sky stops being pink and starts being warm. */
  blush: "#EED3C5",
  /** The warm band above the sun. */
  peach: "#EDDCBF",
  /** Horizon wash on the cool phases. */
  cream: "#F5EEDB",
  /** The centre of the scattering lobe. Off-white rather than white: a clipped
   *  core is a hole in the sky, and this set is meant to be soft everywhere.
   *  Never drawn as a disc — see `SkyDome`'s core term, which is a power lobe
   *  and therefore has no edge. */
  sunCore: "#FBF7ED",

  /* ── The deck, lit ──────────────────────────────────────────────────────
   * Three values, not two. `cloudDeep` is a *mid mauve* rather than a dark
   * grey on purpose: an underside is lit by the sky, so it goes blue-violet
   * rather than black, and a deck with a near-black valley in it reads as
   * rock. */
  cloudLit: "#F4E8DB",
  cloudMauve: "#C0B6CC",
  cloudDeep: "#968CAC",

  /* ── Night ──────────────────────────────────────────────────────────────
   * The same architecture an octave and a half down, and softened on the same
   * ratio. Measured against frost, not navy: at night `isPhaseDark` has
   * already flipped the motto. */
  nightZenith: "#181C35",
  nightUpper: "#252B47",
  nightMid: "#353C5D",
  nightLower: "#4A5276",
  nightHorizon: "#696F8E",
  nightCloudLit: "#7C8198",
  nightCloudMauve: "#535873",
  nightCloudDeep: "#373C52",
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
  divider: "rgba(0, 0, 0, 0)",
  action: {
    hover: "rgba(10, 42, 102, 0.04)",
    selected: "rgba(10, 42, 102, 0.08)",
    disabledBackground: "rgba(10, 42, 102, 0.06)",
  },
};

/**
 * The Monolith room's one authored look — a dawn/twilight sky, cut to a fixed
 * colour budget rather than to a mood.
 *
 * The budget IS the brief, and it is what the previous cut missed: that one ran
 * a violet at 0.4–1.0 weight through the whole ramp and every surface under it,
 * so the room read as a purple photograph with a mark in it. The ratios below
 * are the corrective, measured by rough share of the rendered frame:
 *
 *   ~60%  `white` / `paper` — the dominant. Most of the sky and most of the
 *         cloud deck sit at or within a hair of these.
 *   ~20%  `warm` / `ember` — the soft secondary. Brand gold (`NOIR.gold`,
 *         #FFC72C) walked most of the way to white: the band above the
 *         horizon, the scattering core, and the deck's lit crests.
 *   ~10%  `cool` — soft blue-violet, the primary navy (#0A2A66) desaturated
 *         and lifted. The zenith and the deck's valleys, nothing else.
 *   ~10%  `blendCool` / `blendWarm` — the two bridges. They exist for the
 *         reason `SKY`'s arc does: a straight lerp from a blue to a cream
 *         passes through grey, and the grey is what a viewer reads as "muddy".
 *
 * Every stop is deliberately low-chroma. "Soft" in the brief is not a hedge —
 * a saturated sky out-shouts the mark, and the mark is the subject.
 */
export const TWILIGHT = {
  /** The dominant. Near-pure white, the faintest cool cast so it reads as
   *  light rather than as paper stock. */
  white: "#FDFEFF",
  /** The off-white body the bulk of the frame actually sits at — `NOIR.void`'s
   *  cool tint, a shade lighter. */
  paper: "#F2F5FB",
  /** The soft secondary: a pale warm cream. Kept light enough that the horizon
   *  band still reads as the brightest part of the sky, which is what a real
   *  dawn does. */
  warm: "#FBEBD2",
  /** The deepest warm note, and the only stop with real chroma. The scattering
   *  core and the deck's most-lit crests — never a band. */
  ember: "#F7D9A8",
  /** The soft blue-violet. Navy at ~18% saturation and high lightness: enough
   *  to be identifiably the brand's own blue, nowhere near enough to tint the
   *  frame. */
  cool: "#BEC7E0",
  /** cool → white. */
  blendCool: "#DEE4F2",
  /** white → warm. */
  blendWarm: "#F7F4EE",
} as const;
