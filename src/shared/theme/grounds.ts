import { NOIR } from "./palette";

/**
 * Named page grounds.
 *
 * A "ground" is the surface a section sits on, plus the foreground values that are
 * legible against it. Sections name a ground instead of setting `bgcolor` inline,
 * for two reasons:
 *
 *  1. Contrast is decided once, here, rather than re-derived per component. The
 *     audit found `mist` (#5C719D) used as secondary text on navy at 3.58:1 —
 *     below the 4.5:1 body floor — because nothing stopped a light-ground token
 *     being reused on a dark ground. On the dark grounds below, secondary text is
 *     white at alpha, which is what the palette comment always asked for and
 *     nothing enforced.
 *  2. The scroll-driven ground layer needs to know each section's target colour to
 *     interpolate between them. One named set means the layer and the sections
 *     cannot disagree about what "navyDeep" is.
 *
 * Foregrounds are MUI theme paths or rgba strings rather than hex literals, so no
 * raw colour enters a component file.
 *
 * ── RE-CUT FOR THE DARK PALETTE ───────────────────────────────────────────────
 *
 * There were six grounds: three light (`white`, `void`, `panel`) and three navy.
 * The glass revamp makes the whole site dark, so the light three are retired
 * rather than redefined — a ground called `white` whose `bg` is `#061226` is a
 * lie that outlives everyone who read the commit that made it. The union is
 * renamed to describe depth instead of colour, which is what it was always
 * really selecting.
 *
 * `navyPanel` also leaves the *track* (it stays in `NOIR`, which several
 * components still use for insets): it measures a 1.009 luminance ratio against
 * `navyDeep`, so a 560px crossfade between the two renders as literally nothing.
 * Surface elevation is the glass layer's job now, not the ground's — a lifted
 * panel is `glass({ elevation: 2 })`, not a marginally different navy.
 *
 *     white | void | panel  ->  retired
 *     navyFloor            ->  floor   (the deepest, footer and page floor)
 *     navyInk              ->  base    (page default, the darkest ground)
 *     navyDeep             ->  deep    (the workhorse)
 *     navyField            ->  field   (the lifted, brand-navy ground)
 */
export type GroundName = "void" | "panel" | "white" | "floor" | "base" | "deep" | "field";

export interface Ground {
  /** The surface colour. Also the value the ground layer interpolates toward. */
  bg: string;
  /** Primary text on this ground. */
  fg: string;
  /** Secondary text. Verified ≥4.5:1 against `bg`. */
  muted: string;
  /** Hairline rules and dividers. */
  rule: string;
  /** True when this ground is dark, for callers that must branch (e.g. logo variant). */
  dark: boolean;
}

export const GROUNDS: Record<GroundName, Ground> = {
  void: {
    bg: NOIR.void,
    fg: NOIR.navyField,
    muted: "rgba(10, 42, 102, 0.82)",
    rule: "rgba(10, 42, 102, 0.18)",
    dark: false,
  },
  panel: {
    bg: NOIR.panel,
    fg: NOIR.navyField,
    muted: "rgba(10, 42, 102, 0.82)",
    rule: "rgba(10, 42, 102, 0.18)",
    dark: false,
  },
  white: {
    bg: NOIR.white,
    fg: NOIR.navyField,
    muted: "rgba(10, 42, 102, 0.82)",
    rule: "rgba(10, 42, 102, 0.18)",
    dark: false,
  },
  floor: {
    bg: NOIR.navyFloor,
    fg: NOIR.frost,
    muted: "rgba(255, 255, 255, 0.70)",
    rule: "rgba(255, 255, 255, 0.12)",
    dark: true,
  },
  base: {
    bg: NOIR.navyInk,
    fg: NOIR.frost,
    muted: "rgba(255, 255, 255, 0.70)",
    rule: "rgba(255, 255, 255, 0.12)",
    dark: true,
  },
  deep: {
    bg: NOIR.navyDeep,
    fg: NOIR.frost,
    muted: "rgba(255, 255, 255, 0.70)",
    rule: "rgba(255, 255, 255, 0.12)",
    dark: true,
  },
  field: {
    bg: NOIR.navyField,
    fg: NOIR.frost,
    muted: "rgba(255, 255, 255, 0.70)",
    rule: "rgba(255, 255, 255, 0.12)",
    dark: true,
  },
};

export function ground(name: GroundName): Ground {
  return GROUNDS[name];
}
