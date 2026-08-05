import Box from "@mui/material/Box";

import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

/**
 * The three-bar menu mark, with the outer bars spreading on hover.
 *
 * Moved out of AppShell unchanged except for one thing: the bars were painted from a
 * `color` prop threaded down through a four-branch colour ladder, and they now use
 * `currentColor`. The button above decides the colour; the icon only draws.
 *
 * Hover state is passed in rather than read from `:hover` here, because the trigger is
 * the parent button — a CSS-only version would need the parent's hover to reach three
 * children, which is what the prop already does.
 */
export function MenuBarsIcon({ isHovered }: { isHovered: boolean }) {
  const bar = {
    width: 18,
    height: 2,
    bgcolor: "currentColor",
    borderRadius: "1px",
    transition: `transform var(--dur-slow) ${EASE_OUT_EXPO_CSS}`,
    "@media (prefers-reduced-motion: reduce)": { transition: "none", transform: "none" },
  };

  return (
    <Box
      aria-hidden
      sx={{
        width: 20,
        height: 14,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        pointerEvents: "none",
        color: "inherit",
      }}
    >
      <Box sx={{ ...bar, transform: isHovered ? "translateY(-2px)" : "translateY(0)" }} />
      <Box sx={bar} />
      <Box sx={{ ...bar, transform: isHovered ? "translateY(2px)" : "translateY(0)" }} />
    </Box>
  );
}
