import type { Components, Theme } from "@mui/material/styles";

export const components: Components<Theme> = {
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
