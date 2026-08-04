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
 */
export type GroundName = "white" | "void" | "panel" | "navyField" | "navyPanel" | "navyDeep";

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
  // Light grounds — `ink` is 12.73:1 on void, `mist` 4.54:1 (and 4.88:1 on white).
  // All verified by computation, not by eye.
  white: { bg: NOIR.white, fg: NOIR.ink, muted: NOIR.mist, rule: NOIR.hairline, dark: false },
  void: { bg: NOIR.void, fg: NOIR.ink, muted: NOIR.mist, rule: NOIR.hairline, dark: false },
  panel: { bg: NOIR.panel, fg: NOIR.ink, muted: NOIR.mist, rule: NOIR.hairline, dark: false },

  // Dark grounds — white is 17.5:1 on navyDeep, so white at 0.72 alpha still clears
  // 4.5:1 comfortably. `mist` is deliberately absent here: it fails on navy at
  // 3.58:1, which is the exact pairing the audit caught the palette permitting.
  navyField: {
    bg: NOIR.navyField,
    fg: "common.white",
    muted: "rgba(255, 255, 255, 0.72)",
    rule: "rgba(255, 255, 255, 0.16)",
    dark: true,
  },
  navyPanel: {
    bg: NOIR.navyPanel,
    fg: "common.white",
    muted: "rgba(255, 255, 255, 0.72)",
    rule: "rgba(255, 255, 255, 0.16)",
    dark: true,
  },
  navyDeep: {
    bg: NOIR.navyDeep,
    fg: "common.white",
    muted: "rgba(255, 255, 255, 0.72)",
    rule: "rgba(255, 255, 255, 0.16)",
    dark: true,
  },
};

export function ground(name: GroundName): Ground {
  return GROUNDS[name];
}
