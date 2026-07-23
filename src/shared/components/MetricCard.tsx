import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/shared/motion";

type KpiUnit = "count" | "percent" | "ratio" | "millions_per_day";

interface MetricCardProps {
  label: string;
  value: number;
  unit: KpiUnit;
  deltaPct?: number | null;
  caption?: string;
  /** Count up from zero on first scroll-into-view (inventory row 10). */
  countUp?: boolean;
}

function formatValue(value: number, unit: KpiUnit): string {
  switch (unit) {
    case "count":
      return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
    case "percent":
      return `${value.toFixed(1)}%`;
    case "ratio":
      return value.toFixed(2);
    case "millions_per_day":
      return `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}M/day`;
    default: {
      const exhaustive: never = unit;
      throw new Error(`Unhandled unit: ${String(exhaustive)}`);
    }
  }
}

function formatDelta(deltaPct: number): string {
  const sign = deltaPct >= 0 ? "+" : "";
  return `${sign}${deltaPct.toFixed(1)}%`;
}

function CountUpValue({ value, unit }: { value: number; unit: KpiUnit }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, {
      duration: 1.2,
      onUpdate: (latest) => setShown(latest),
    });
    return () => controls.stop();
  }, [inView, reduced, value]);

  return <span ref={ref}>{formatValue(reduced ? value : shown, unit)}</span>;
}

export function MetricCard({
  label,
  value,
  unit,
  deltaPct = null,
  caption,
  countUp = false,
}: MetricCardProps) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="baseline">
        <Typography variant="h3" component="p">
          {countUp ? <CountUpValue value={value} unit={unit} /> : formatValue(value, unit)}
        </Typography>
        {deltaPct === null ? null : (
          <Typography
            variant="body2"
            sx={{ color: deltaPct >= 0 ? "success.main" : "error.main", fontWeight: 600 }}
          >
            {formatDelta(deltaPct)}
          </Typography>
        )}
      </Stack>
      {caption === undefined ? null : (
        <Typography variant="body2" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Stack>
  );
}
