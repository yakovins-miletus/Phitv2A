import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/shared/motion";
import { MONO } from "@/shared/theme/theme";

// Hairline-separated count-up figures — the "by the numbers" rail.
// Content-driven sibling of MetricCard (which is bound to the API KPI schema).

export interface Stat {
  value: number;
  label: string;
  suffix?: string;
  /** Optional context line under the label — e.g. "HFT pipeline · 2ms → 18µs". */
  caption?: string;
}

// Fractional targets (e.g. 99.4) keep one decimal; integers stay whole.
function formatStat(n: number, decimals: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function CountUpNumber({ value, suffix = "" }: { value: number; suffix?: string | undefined }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const decimals = Number.isInteger(value) ? 0 : 1;

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, {
      duration: 1.2,
      onUpdate: (latest) => setShown(latest),
    });
    return () => controls.stop();
  }, [inView, reduced, value]);

  return (
    <span ref={ref}>
      {formatStat(reduced ? value : shown, decimals)}
      {suffix}
    </span>
  );
}

export function StatStrip({ stats }: { stats: readonly Stat[] }) {
  return (
    <Grid container spacing={{ xs: 4, md: 3 }}>
      {stats.map((stat) => (
        <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
          <Box sx={{ borderLeft: 2, borderColor: "divider", pl: 3 }}>
            <Typography variant="h2" component="p" color="primary">
              <CountUpNumber value={stat.value} suffix={stat.suffix} />
            </Typography>
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.75rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "text.secondary",
                mt: 1,
              }}
            >
              {stat.label}
            </Typography>
            {stat.caption === undefined ? null : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {stat.caption}
              </Typography>
            )}
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
