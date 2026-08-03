import type { Components, Theme } from "@mui/material/styles";

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
  // A second, darker ring so the gold stays visible on light grounds too.
  boxShadow: `0 0 0 4px ${theme.palette.primary.main}33`,
  borderRadius: "4px",
});

export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: (theme) => ({
      "*:focus-visible": focusRing(theme),
      // Skip link: off-screen until focused, then pinned top-left.
      ".skip-to-content": {
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: theme.zIndex.tooltip + 10,
        padding: theme.spacing(1.5, 3),
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
        fontWeight: 700,
        textDecoration: "none",
        borderBottomRightRadius: "8px",
        transform: "translateY(-120%)",
        "&:focus-visible": {
          transform: "translateY(0)",
          ...focusRing(theme),
        },
      },
      "@media (prefers-reduced-motion: no-preference)": {
        ".skip-to-content": { transition: "transform 0.2s ease-out" },
      },
    }),
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: ({ theme }) => ({ padding: theme.spacing(1, 2.75) }),
    },
  },
  MuiCard: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => ({
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        backgroundImage: "none",
      }),
    },
  },
  MuiAppBar: {
    defaultProps: { elevation: 0, color: "transparent" },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.default,
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
        backgroundImage: "none",
      }),
    },
  },
  MuiChip: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: "transparent",
        border: `1px solid ${theme.palette.divider}`,
      }),
    },
  },
  MuiLink: {
    defaultProps: { underline: "hover" },
  },
  MuiTextField: {
    defaultProps: { variant: "outlined" },
  },
  MuiPaper: {
    styleOverrides: {
      root: { backgroundImage: "none" },
    },
  },
};
