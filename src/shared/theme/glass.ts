/**
 * The TS face of the glass token layer.
 *
 * Every value returned from here is either a `var(--…)` reference or a static
 * keyword. Nothing is interpolated from props, theme state, or scroll position.
 *
 * That rule is not stylistic. src/features/hero/heroVars.ts documents the
 * measurement: interpolating values into `sx` on a scroll-driven surface
 * injected 1,335 stylesheet rules and dropped 32% of frames per scroll pass. The
 * fix there was static `sx` plus CSS custom properties, and this module is the
 * same fix generalised — a fixed, tiny set of Emotion classes whose *values*
 * change in the cascade rather than in JS.
 *
 * Results are memoised per option-set, so Emotion serializes each variant once
 * for the lifetime of the page instead of once per render.
 *
 * See src/shared/theme/glass.css for the tokens themselves and for why the
 * tint/understudy split exists.
 */

import type { SxProps, Theme } from "@mui/material/styles";

/** 1 = chrome and controls · 2 = cards and panels · 3 = overlays and sheets. */
export type GlassElevation = 1 | 2 | 3;

export type GlassRadius = "control" | "card" | "panel" | "pill";

export interface GlassOptions {
  /** Default 2. */
  elevation?: GlassElevation;
  /** Default "card". */
  radius?: GlassRadius;
  /** The brighter 1px top-edge highlight, drawn on ::before. Default true. */
  rim?: boolean;
  /** Adds the hover lift / pressed states and the --t-glass transition. */
  interactive?: boolean;
  /** Gold tint for primary actions: 15% at rest, 20% hover, 25% pressed. */
  accent?: boolean;
}

const FILL: Record<GlassElevation, string> = {
  1: "var(--glass-fill-1)",
  2: "var(--glass-fill-2)",
  3: "var(--glass-fill-3)",
};

const SHADOW: Record<GlassElevation, string> = {
  1: "var(--glass-shadow-1)",
  2: "var(--glass-shadow-2)",
  3: "var(--glass-shadow-3)",
};

/**
 * Hover lifts a surface one elevation, and elevation 3 has nowhere to go — a
 * modal sheet is already the top of the stack. An explicit map rather than
 * `elevation + 1` so that ceiling is stated rather than arithmetic.
 */
const NEXT_UP: Record<GlassElevation, GlassElevation> = { 1: 2, 2: 3, 3: 3 };

const RADIUS: Record<GlassRadius, string> = {
  control: "var(--r-control)",
  card: "var(--r-card)",
  panel: "var(--r-panel)",
  pill: "var(--r-pill)",
};

/**
 * The tint is applied as a `background-image` gradient rather than as
 * `background-color`, because `background-color` is where the opaque understudy
 * lives. Two layers, one element, no wrapper div.
 */
const tint = (fill: string) => `linear-gradient(${fill}, ${fill})`;

/**
 * Just the surface paint — for merging into an existing `sx` where the caller
 * owns radius, shadow and geometry.
 */
export function glassSurface(elevation: GlassElevation = 2): Record<string, string> {
  return {
    backgroundColor: "var(--glass-under)",
    backgroundImage: tint(FILL[elevation]),
    backdropFilter: "var(--glass-filter)",
    WebkitBackdropFilter: "var(--glass-filter)",
  };
}

const cache = new Map<string, SxProps<Theme>>();

/**
 * A complete macOS-style glass surface: tinted translucency over an opaque
 * understudy, a hairline border, a bright top rim, and a layered shadow.
 */
export function glass(options: GlassOptions = {}): SxProps<Theme> {
  const { elevation = 2, radius = "card", rim = true, interactive = false, accent = false } = options;

  const key = `${elevation}|${radius}|${rim ? 1 : 0}|${interactive ? 1 : 0}|${accent ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const restFill = accent ? "var(--accent-15)" : FILL[elevation];

  const sx: Record<string, unknown> = {
    position: "relative",
    // Contains the ::before rim so it cannot escape a rounded corner, and keeps
    // the backdrop-filter's sampling scoped to this element.
    isolation: "isolate",
    backgroundColor: "var(--glass-under)",
    backgroundImage: tint(restFill),
    backdropFilter: "var(--glass-filter)",
    WebkitBackdropFilter: "var(--glass-filter)",
    border: "1px solid",
    borderColor: accent ? "var(--accent-border)" : "var(--glass-border-1)",
    borderRadius: RADIUS[radius],
    boxShadow: SHADOW[elevation],
    color: accent ? "var(--accent-ink)" : "var(--text-1)",
  };

  if (rim) {
    sx["&::before"] = {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: "inherit",
      pointerEvents: "none",
      // A 1px band at the top edge only — light catching the rim of a macOS
      // window, not a glow around the whole shape.
      background: "linear-gradient(180deg, var(--glass-rim) 0 1px, transparent 1px)",
      zIndex: 0,
    };
  }

  if (interactive) {
    sx.transition = "var(--t-glass)";
    // Only ever transform and opacity-ish properties move. Never width, height,
    // top or left.
    sx["@media (hover: hover)"] = {
      "&:hover": {
        transform: "translateY(-2px)",
        backgroundImage: tint(accent ? "var(--accent-20)" : FILL[NEXT_UP[elevation]]),
        borderColor: accent ? "var(--accent)" : "var(--glass-border-2)",
        boxShadow: accent
          ? `${SHADOW[elevation]}, 0 0 24px var(--accent-25)`
          : `${SHADOW[NEXT_UP[elevation]]}, 0 0 20px var(--accent-15)`,
      },
    };
    sx["&:active"] = {
      transform: "translateY(0)",
      backgroundImage: tint(accent ? "var(--accent-25)" : FILL[elevation]),
      boxShadow: "var(--glass-inset)",
    };
    // The tokens already collapse to 0.01ms under reduce; the transform is what
    // has to be removed outright.
    sx["@media (prefers-reduced-motion: reduce)"] = {
      "&:hover, &:active": { transform: "none" },
    };
  }

  const frozen = Object.freeze(sx) as SxProps<Theme>;
  cache.set(key, frozen);
  return frozen;
}
