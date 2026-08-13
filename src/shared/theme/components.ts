import type { Components, Theme } from "@mui/material/styles";

import { EASE_SPRING_SOFT_CSS } from "@/shared/motion/easing";

/**
 * The glass component layer.
 *
 * Everything MUI renders on this site gets its surface from here, so a call site that
 * writes no `sx` at all still comes out as glass. That is the point: the sweep's job
 * is then to *delete* bespoke surface styling rather than to rewrite it.
 *
 * ── WHY THIS CANNOT BE THE WHOLE JOB ─────────────────────────────────────────────
 *
 * In MUI v7 both `styleOverrides` and `sx` compile to Emotion classes, and the `sx`
 * class is injected last, so it wins at equal specificity. Six identical
 * `bgcolor: "rgba(10,42,102,0.06)"` blocks in JobDetailsDrawer will keep painting a
 * light navy wash straight over a glass Card default. Theme work shrinks each edit in
 * the sweep; it does not remove one.
 *
 * ── THE BUTTON MAPPING ───────────────────────────────────────────────────────────
 *
 * No new Button variants. The three built-ins are re-pointed at the design's three
 * tiers, so ~60 existing call sites need no prop change:
 *
 *   text       transparent, and the hover *is* a glass pill  (= the nav-item spec)
 *   outlined   the neutral glass pill
 *   contained  primary — a faint accent tint over glass
 *   contained + color="error"   destructive — a red tint at the same 15%
 *
 * ── TRANSITIONS ──────────────────────────────────────────────────────────────────
 *
 * Only `background-color`, `background-image`, `border-color`, `box-shadow` and
 * `transform` are ever animated. `backdrop-filter` is never in a transition list:
 * transitioning a blur recomputes it on every frame, which is the single most
 * expensive thing in this design. Reduced motion is handled twice — the `--dur-*`
 * tokens collapse to 0.01ms in glass.css, and each interactive rule additionally
 * drops its transform, because collapsing a duration still leaves the movement.
 */

/**
 * The sitewide keyboard-focus indicator.
 *
 * There was none. `:focus-visible` appeared exactly twice across 150 files, and four
 * places set `outline: none` with nothing in its place, so a keyboard user could lose
 * track of where they were entirely. This applies one visible ring to every focusable
 * element, including plain `<a>`/`<div tabindex>` that MUI never sees.
 *
 * `:focus-visible` (not `:focus`) so mouse clicks don't draw a ring — the reason people
 * reach for `outline: none` in the first place.
 */
const focusRing = (theme: Theme) => ({
  outline: `2px solid ${theme.palette.secondary.main}`,
  outlineOffset: "2px",
  /**
   * A halo behind the gold ring, so the ring survives on whatever surface it
   * lands on — the lightest the design produces is elevation-3 glass over
   * `field`, where gold measures 6.16:1 on its own.
   *
   * This was `primary.main + "33"` — navy at 20% — then a hard
   * `rgba(0, 0, 0, 0.6)` when the palette was assumed to be all-dark. Neither is
   * right on both grounds, and the site has both: navy-on-navy is invisible, and
   * a black halo on the off-white page draws a bruise around every focused
   * control. `--focus-halo` is navy at 22% on light and black at 60% on dark, so
   * the ring's surround always darkens *away* from the ring.
   */
  boxShadow: "0 0 0 4px var(--focus-halo)",
  borderRadius: "var(--r-control)",
});

/** The glass surface paint, as a reusable fragment for the overrides below. */
const surface = (fill: string) => ({
  backgroundColor: "var(--glass-under)",
  backgroundImage: `linear-gradient(${fill}, ${fill})`,
  backdropFilter: "var(--glass-filter)",
  WebkitBackdropFilter: "var(--glass-filter)",
});

/** Interaction transition list. Never includes backdrop-filter — see the docblock. */
const T_GLASS = "var(--t-glass)";

/** Reduced motion still needs the *movement* removed, not just the duration. */
const NO_TRANSFORM_ON_REDUCE = {
  "@media (prefers-reduced-motion: reduce)": {
    "&:hover, &:active": { transform: "none" },
  },
};

export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: (theme) => ({
      // The layered base. Painted on `body` rather than `html` so the home page's
      // scroll-driven GroundLayer can still transparentise both and take over —
      // see GroundLayer's note on painting order.
      body: {
        backgroundColor: "var(--g-void)",
        color: "var(--text-1)",
      },
      "*:focus-visible": focusRing(theme),
      // Skip link: off-screen until focused, then pinned top-left. A glass pill now,
      // but the translateY mechanic and the reduced-motion guard are unchanged.
      ".skip-to-content": {
        display: "inline-block",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: theme.zIndex.tooltip + 10,
        padding: theme.spacing(1.5, 3),
        ...surface("var(--glass-fill-3)"),
        border: "1px solid var(--glass-border-2)",
        borderTop: "none",
        color: "var(--text-1)",
        fontWeight: 700,
        textDecoration: "none",
        borderBottomRightRadius: "var(--r-control)",
        boxShadow: "none",
        transform: "translateY(-120%)",
        "&:focus-visible": {
          transform: "translateY(0)",
          ...focusRing(theme),
        },
      },
      "@media (prefers-reduced-motion: no-preference)": {
        ".skip-to-content": { transition: "transform 0.2s ease-out" },
      },
      // Scrollbars are UA-painted. `color-scheme` (glass.css, per ground) already
      // tunes them; this only narrows the gutter so it reads as chrome rather than
      // a rail.
      "*::-webkit-scrollbar": { width: 10, height: 10 },
      "*::-webkit-scrollbar-thumb": {
        backgroundColor: "var(--glass-border-1)",
        borderRadius: "var(--r-pill)",
      },
      "*::-webkit-scrollbar-thumb:hover": { backgroundColor: "var(--glass-border-2)" },
      "*::-webkit-scrollbar-track": { backgroundColor: "transparent" },
    }),
  },

  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        borderRadius: "var(--r-control)",
        // 12/24 per the brief, replacing theme.spacing(1, 2.75) (8/22). Every button
        // grows ~8px in height; the careers and services grids may reflow one row on
        // mobile, which is a screenshot check rather than a test failure.
        padding: "12px 24px",
        fontSize: "0.875rem",
        letterSpacing: "0.5px",
        fontWeight: 500,
        transition: T_GLASS,
        ...NO_TRANSFORM_ON_REDUCE,
      },
    },
    variants: [
      {
        props: { variant: "outlined" },
        style: {
          ...surface("var(--glass-fill-1)"),
          border: "1px solid var(--glass-border-1)",
          color: "var(--text-1)",
          "@media (hover: hover)": {
            "&:hover": {
              transform: "translateY(-2px)",
              // +3% fill, and the border brightens — the brief's "+4%" expressed as
              // the next fill tier so it stays a token rather than an arithmetic.
              ...surface("var(--glass-fill-2)"),
              borderColor: "var(--glass-border-2)",
              boxShadow: "var(--glass-shadow-1), 0 0 20px var(--accent-15)",
            },
          },
          "&:active": { transform: "translateY(0)", boxShadow: "var(--glass-inset)" },
        },
      },
      {
        props: { variant: "text" },
        style: {
          backgroundColor: "transparent",
          border: "1px solid transparent",
          color: "var(--text-2)",
          "@media (hover: hover)": {
            "&:hover": {
              // The hover pill. This is the nav-item treatment; nav items are text
              // buttons and get it for free.
              ...surface("var(--glass-fill-1)"),
              borderColor: "var(--glass-border-1)",
              color: "var(--text-1)",
            },
          },
        },
      },
      {
        props: { variant: "contained" },
        style: {
          ...surface("var(--accent-15)"),
          border: "1px solid var(--accent-border)",
          color: "var(--accent-fg)",
          boxShadow: "none",
          "@media (hover: hover)": {
            "&:hover": {
              transform: "translateY(-2px)",
              ...surface("var(--accent-20)"),
              borderColor: "var(--accent)",
              boxShadow: "var(--glass-shadow-1), 0 0 24px var(--accent-25)",
            },
          },
          "&:active": {
            transform: "translateY(0)",
            ...surface("var(--accent-25)"),
            boxShadow: "var(--glass-inset)",
          },
        },
      },
      {
        props: { variant: "contained", color: "error" },
        style: {
          ...surface("var(--danger-15)"),
          border: "1px solid var(--danger-border)",
          color: "var(--danger-fg)",
          "@media (hover: hover)": {
            "&:hover": {
              ...surface("var(--danger-15)"),
              borderColor: "var(--danger-fg)",
              boxShadow: "var(--glass-shadow-1)",
            },
          },
        },
      },
    ],
  },

  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: "var(--r-control)",
        color: "var(--text-2)",
        border: "1px solid transparent",
        transition: T_GLASS,
        "@media (hover: hover)": {
          "&:hover": {
            // Same hover-pill idea as a text button, at icon proportions.
            ...surface("var(--glass-fill-1)"),
            borderColor: "var(--glass-border-1)",
            color: "var(--text-1)",
          },
        },
        ...NO_TRANSFORM_ON_REDUCE,
      },
    },
  },

  MuiPaper: {
    styleOverrides: {
      // Load-bearing under `mode: "dark"`: MUI otherwise overlays an elevation
      // gradient on Paper, which fights a translucent surface.
      root: { backgroundImage: "none" },
    },
    variants: [
      {
        props: { variant: "glass" },
        style: {
          ...surface("var(--glass-fill-2)"),
          border: "1px solid var(--glass-border-1)",
          borderRadius: "var(--r-card)",
          boxShadow: "var(--glass-shadow-2)",
          color: "var(--text-1)",
        },
      },
      {
        props: { variant: "glassRaised" },
        style: {
          ...surface("var(--glass-fill-3)"),
          border: "1px solid var(--glass-border-2)",
          borderRadius: "var(--r-panel)",
          boxShadow: "var(--glass-shadow-3)",
          color: "var(--text-1)",
        },
      },
    ],
  },

  MuiCard: {
    // Every bare <Card> becomes glass without touching its call site.
    defaultProps: { elevation: 0, variant: "glass" },
    styleOverrides: {
      root: {
        // The old override set `border: 1px solid divider` and an opaque
        // `background.paper` here. Both are now the variant's job — leaving them
        // would double the hairline and paint an opaque fill under the tint.
        padding: "24px",
        transition: T_GLASS,
        "@media (hover: hover)": {
          "&:hover": {
            // Border opacity doubles (0.15 -> 0.30), the shadow deepens, and the
            // surface scales a hair. Subtle by construction: 1.01, not 1.05.
            borderColor: "var(--glass-border-2)",
            boxShadow: "var(--glass-shadow-3)",
            transform: "scale(1.01)",
          },
        },
        ...NO_TRANSFORM_ON_REDUCE,
      },
    },
  },

  MuiCardActionArea: {
    styleOverrides: {
      root: { borderRadius: "inherit" },
      focusHighlight: { display: "none" },
    },
  },

  MuiAppBar: {
    defaultProps: { elevation: 0, color: "transparent" },
    styleOverrides: {
      root: {
        // Deliberately does NOT paint a background or a border. AppShell drives its
        // own chrome across six navbar modes; the previous hard
        // `backgroundColor: background.default` + `borderBottom: divider` here meant
        // AppShell spent its own rules fighting the theme.
        backgroundImage: "none",
        color: "var(--text-1)",
      },
    },
  },

  MuiToolbar: {
    styleOverrides: {
      root: { minHeight: 64 },
    },
  },

  MuiChip: {
    styleOverrides: {
      root: {
        ...surface("var(--glass-fill-1)"),
        border: "1px solid var(--glass-border-1)",
        // Pill, per the brief's tag treatment.
        borderRadius: "var(--r-pill)",
        color: "var(--text-2)",
        fontSize: "0.75rem",
        letterSpacing: "0.5px",
        transition: T_GLASS,
      },
      label: { paddingLeft: 12, paddingRight: 12 },
      clickable: {
        "@media (hover: hover)": {
          "&:hover": {
            ...surface("var(--glass-fill-2)"),
            borderColor: "var(--glass-border-2)",
            color: "var(--text-1)",
          },
        },
      },
      filled: {
        // `color="primary"`/`"secondary"` chips: the accent tint, not an opaque fill.
        "&.MuiChip-colorPrimary, &.MuiChip-colorSecondary": {
          ...surface("var(--accent-15)"),
          borderColor: "var(--accent-border)",
          color: "var(--accent-fg)",
        },
      },
    },
  },

  MuiLink: {
    defaultProps: { underline: "hover" },
    styleOverrides: {
      root: {
        color: "var(--accent-fg)",
        textDecorationColor: "var(--accent-40)",
        transition: `color var(--dur) var(--ease-out)`,
      },
    },
  },

  MuiDivider: {
    styleOverrides: {
      root: { borderColor: "var(--glass-divider)" },
    },
  },

  MuiTextField: { defaultProps: { variant: "outlined" } },

  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: "var(--r-control)",
        ...surface("var(--glass-fill-1)"),
        // The well. An input should read as pressed into the surface, not sitting on
        // it — the one place an inset shadow is the whole affordance.
        boxShadow: "var(--glass-inset)",
        color: "var(--text-1)",
        transition: `box-shadow var(--dur) var(--ease-out)`,
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--glass-border-1)",
          transition: `border-color var(--dur) var(--ease-out)`,
        },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--glass-border-2)" },
        "&.Mui-focused": {
          // The soft outer glow ring the brief asks for, over the existing well.
          boxShadow: "var(--glass-inset), 0 0 0 4px var(--accent-15)",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderWidth: 1,
          borderColor: "var(--accent-40)",
        },
        "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: "var(--danger-border)" },
      },
      input: {
        fontSize: "0.875rem",
        letterSpacing: "0.5px",
        "&::placeholder": { color: "var(--text-3)", opacity: 1 },
        // Without this the global `*:focus-visible` ring draws *inside* the field, on
        // top of the .Mui-focused treatment above — a ring inside a ring.
        "&:focus-visible": { outline: "none" },
      },
    },
  },

  MuiInputBase: {
    styleOverrides: {
      root: { color: "var(--text-1)" },
    },
  },

  MuiInputLabel: {
    styleOverrides: {
      root: {
        color: "var(--text-3)",
        "&.Mui-focused": { color: "var(--accent-fg)" },
        "&.Mui-error": { color: "var(--danger-fg)" },
      },
    },
  },

  MuiFormHelperText: {
    styleOverrides: {
      root: {
        color: "var(--text-3)",
        "&.Mui-error": { color: "var(--danger-fg)" },
      },
    },
  },

  MuiSwitch: {
    defaultProps: { disableRipple: true },
    styleOverrides: {
      // 48x28 track with a 22px thumb, per the brief.
      root: { width: 48, height: 28, padding: 0, overflow: "visible" },
      switchBase: {
        padding: 3,
        // The spring. MUI's SwitchBase is not a `motion` component, so the overshoot
        // is a timing function rather than a physics sim — see EASE_SPRING_SOFT.
        transition: `transform var(--dur-slow) ${EASE_SPRING_SOFT_CSS}`,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        "&.Mui-checked": {
          // 48 - 22 - 3 - 3 = 20
          transform: "translateX(20px)",
          "& + .MuiSwitch-track": {
            backgroundColor: "var(--accent-25)",
            borderColor: "var(--accent-border)",
            opacity: 1,
          },
          "& .MuiSwitch-thumb": { backgroundColor: "var(--accent-fg)" },
        },
      },
      thumb: {
        width: 22,
        height: 22,
        backgroundColor: "var(--text-1)",
        boxShadow: "var(--glass-shadow-1)",
        transition: `background-color var(--dur) var(--ease-out)`,
      },
      track: {
        borderRadius: 14,
        ...surface("var(--glass-fill-2)"),
        border: "1px solid var(--glass-border-1)",
        boxShadow: "var(--glass-inset)",
        opacity: 1,
        transition: T_GLASS,
      },
    },
  },

  MuiTooltip: {
    defaultProps: { arrow: false, enterDelay: 300, leaveDelay: 0 },
    styleOverrides: {
      tooltip: {
        ...surface("var(--glass-fill-3)"),
        border: "1px solid var(--glass-border-2)",
        borderRadius: "10px",
        padding: "8px 12px",
        color: "var(--text-1)",
        fontSize: "0.6875rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        boxShadow: "var(--glass-shadow-2)",
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        display: "none",
        borderColor: "transparent",
      },
    },
  },

  // The single highest-leverage override here: it retires four hand-written scrim
  // definitions (CommandPalette, JobDetailsDrawer, BrochureDrawer, TopNavMegaDrawer).
  // Two of those want NO blur for good reasons and must now opt out explicitly.
  MuiBackdrop: {
    styleOverrides: {
      root: {
        backgroundColor: "var(--scrim)",
        backdropFilter: "var(--scrim-filter)",
        WebkitBackdropFilter: "var(--scrim-filter)",
      },
      invisible: { backgroundColor: "transparent", backdropFilter: "none" },
    },
  },

  MuiDrawer: {
    styleOverrides: {
      paper: {
        ...surface("var(--glass-fill-3)"),
        borderColor: "var(--glass-border-2)",
        backgroundImage: "linear-gradient(var(--glass-fill-3), var(--glass-fill-3))",
      },
    },
  },

  MuiMenu: {
    defaultProps: { slotProps: { paper: { variant: "glassRaised" } } },
    styleOverrides: {
      list: { padding: 6 },
    },
  },

  MuiPopover: {
    defaultProps: { slotProps: { paper: { variant: "glassRaised" } } },
  },

  MuiSelect: {
    defaultProps: { MenuProps: { slotProps: { paper: { variant: "glassRaised" } } } },
    styleOverrides: {
      icon: { color: "var(--text-3)" },
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: "8px",
        margin: "2px 0",
        fontSize: "0.875rem",
        letterSpacing: "0.5px",
        transition: `background-color var(--dur) var(--ease-out)`,
        "&:hover": { backgroundColor: "var(--glass-fill-2)" },
        "&.Mui-selected, &.Mui-selected:hover": {
          backgroundColor: "var(--accent-15)",
          color: "var(--accent-fg)",
        },
      },
    },
  },

  MuiAccordion: {
    defaultProps: { disableGutters: true, elevation: 0, square: false },
    styleOverrides: {
      root: {
        ...surface("var(--glass-fill-1)"),
        border: "1px solid var(--glass-border-1)",
        borderRadius: "var(--r-card)",
        marginBottom: 8,
        transition: T_GLASS,
        "&::before": { display: "none" },
        "&.Mui-expanded": {
          borderColor: "var(--glass-border-2)",
          boxShadow: "var(--glass-shadow-1)",
        },
      },
    },
  },

  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        borderRadius: "var(--r-card)",
        padding: "0 20px",
        "@media (hover: hover)": {
          "&:hover": { backgroundColor: "var(--glass-fill-1)" },
        },
      },
      content: { margin: "16px 0" },
      expandIconWrapper: { color: "var(--text-3)" },
    },
  },

  MuiAccordionDetails: {
    styleOverrides: {
      root: {
        padding: "0 20px 20px",
        borderTop: "1px solid var(--glass-divider)",
        paddingTop: 16,
        color: "var(--text-2)",
      },
    },
  },

  MuiAlert: {
    defaultProps: { variant: "outlined" },
    styleOverrides: {
      root: {
        ...surface("var(--glass-fill-2)"),
        borderRadius: "var(--r-card)",
        color: "var(--text-1)",
      },
      outlinedError: { borderColor: "var(--danger-border)", color: "var(--text-1)" },
      outlinedSuccess: { borderColor: "var(--glass-border-2)", color: "var(--text-1)" },
      outlinedInfo: { borderColor: "var(--glass-border-2)", color: "var(--text-1)" },
      outlinedWarning: { borderColor: "var(--accent-border)", color: "var(--text-1)" },
    },
  },

  MuiCircularProgress: {
    styleOverrides: {
      colorPrimary: { color: "var(--accent-fg)" },
    },
  },

  // Deliberately absent: MuiTable*, MuiTabs, MuiDialog. Verified zero usages —
  // adding dead overrides is the same debt this file is here to remove, in a new
  // place. Add them when something actually renders one.
};
