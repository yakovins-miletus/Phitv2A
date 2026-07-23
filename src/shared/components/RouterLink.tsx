import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import { createLink } from "@tanstack/react-router";

/** MUI Link/Button wired into the typed router (preloading, active states). */
export const RouterLink = createLink(MuiLink);
export const RouterButton = createLink(Button);
