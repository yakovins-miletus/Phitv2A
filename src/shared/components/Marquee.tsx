import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useReducedMotion } from "@/shared/motion";
import { MONO } from "@/shared/theme/theme";

interface MarqueeProps {
  items: string[];
  reverse?: boolean;
  /** seconds per loop. */
  duration?: number;
}

/** Market-tape ticker: infinite transform loop, pause on hover, second copy
    aria-hidden. Under reduced motion: a single static wrapped row. */
export function Marquee({ items, reverse = false, duration = 28 }: MarqueeProps) {
  const reduced = useReducedMotion();
  const row = items.join(" · ") + " · ";

  if (reduced === true) {
    return (
      <Typography
        sx={{ fontFamily: MONO, fontSize: "0.8rem", letterSpacing: "0.2em", color: "text.secondary", py: 1.5, px: 2 }}
      >
        {items.join(" · ")}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        overflow: "hidden",
        whiteSpace: "nowrap",
        py: 1.5,
        "&:hover .marquee-track": { animationPlayState: "paused" },
        "@keyframes phitoMarquee": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      }}
    >
      <Box
        className="marquee-track"
        sx={{
          display: "inline-flex",
          animation: `phitoMarquee ${String(duration)}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {[false, true].map((hidden) => (
          <Typography
            key={hidden ? "copy" : "original"}
            aria-hidden={hidden || undefined}
            component="span"
            sx={{ fontFamily: MONO, fontSize: "0.8rem", letterSpacing: "0.2em", color: "text.secondary", pr: 2 }}
          >
            {row}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
