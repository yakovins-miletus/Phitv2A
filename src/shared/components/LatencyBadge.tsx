import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";

function readPaintMs(): number | null {
  if (typeof performance === "undefined") return null;
  const entry = performance
    .getEntriesByType("paint")
    .find((e) => e.name === "first-contentful-paint");
  if (entry) return Math.round(entry.startTime);
  // final fallback: time since navigation start at mount
  const now = performance.now();
  return now > 0 ? Math.round(now) : null;
}

type LatencyBadgeProps = { sx?: SxProps<Theme> };

export function LatencyBadge({ sx }: LatencyBadgeProps) {
  const reduced = useReducedMotion();
  // Measured once at first render; the paint entry exists long before the
  // footer mounts, so a lazy initializer beats a setState-in-effect cascade.
  const [target] = useState<number | null>(() => readPaintMs());
  const [counted, setCounted] = useState(0);
  // Reduced motion never animates — derive the final value, no effect needed.
  const shown = reduced ? (target ?? 0) : counted;

  useEffect(() => {
    if (target === null || reduced) return;
    const start = performance.now();
    const DURATION = 600;
    let raf = 0;
    const tick = () => {
      const t = Math.min((performance.now() - start) / DURATION, 1);
      // ease-out cubic
      setCounted(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, target]);

  if (target === null) return null;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        px: 1.25,
        py: 0.5,
        border: `1px solid ${NOIR.hairline}`,
        borderRadius: "2px",
        fontFamily: MONO,
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: NOIR.mist,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
        "@keyframes latencyPulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.25 },
        },
        ...(Array.isArray(sx) ? Object.assign({}, ...sx) : sx),
      }}
    >
      <Box
        component="span"
        aria-hidden
        sx={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          bgcolor: NOIR.gold,
          flexShrink: 0,
          animation: reduced ? "none" : "latencyPulse 2.4s ease-in-out infinite",
        }}
      />
      <span>
        PAGE PAINT {shown}MS —{" "}
        <Box component="span" sx={{ color: NOIR.gold }}>
          WE THINK IN MICROSECONDS
        </Box>
      </span>
    </Box>
  );
}
