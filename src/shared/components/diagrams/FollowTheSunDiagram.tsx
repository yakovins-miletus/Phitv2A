import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";
import { MONO, TYPE_SCALE, TRACKING } from "@/shared/theme/theme";

const CX = 200;
const CY = 100;
const R = 68;
const TICK_R_OUT = R + 6;
const TICK_R_IN = R + 1;

function pointAt(deg: number, radius: number = R) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + Math.cos(rad) * radius, y: CY + Math.sin(rad) * radius };
}

// Three shifts, each covering 120 degrees, handing off to the next at
// each boundary so the dial reads as unbroken coverage. Shift 0 (the first
// third of the day) is the one currently live — the only element that
// carries gold; the other two shifts are structure, not accent.
const BOUNDARIES = [0, 120, 240, 360] as const;
const SHIFT_ARCS = [0, 1, 2].map((i) => {
  const start = pointAt(BOUNDARIES[i] ?? 0);
  const end = pointAt(BOUNDARIES[i + 1] ?? 360);
  return { d: `M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`, live: i === 0 };
});
// Handoff markers sit at the boundary between consecutive shifts.
const HANDOFFS = BOUNDARIES.slice(0, 3).map((deg) => pointAt(deg));
const liveHandoff = HANDOFFS[0] ?? pointAt(0);

// Twelve clock ticks around the dial, for an instrument read rather than a
// bare circle.
const HOUR_TICKS = Array.from({ length: 12 }, (_, i) => {
  const deg = (360 / 12) * i;
  const outer = pointAt(deg, TICK_R_OUT);
  const inner = pointAt(deg, TICK_R_IN);
  return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
});

export function FollowTheSunDiagram() {
  const reduced = useReducedMotion() === true;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.2 });
  const show = reduced || inView;

  const labelStyle = {
    fontFamily: MONO,
    fontSize: TYPE_SCALE.micro,
    letterSpacing: TRACKING.meta,
    textTransform: "uppercase" as const,
  };

  return (
    <Box
      ref={rootRef}
      sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 1, md: 2 } }}
    >
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        role="img"
        aria-label="Follow-the-sun coverage. Three shifts, each covering a third of a 24-hour dial, hand off to the next at three marked points; the currently live shift is highlighted."
        style={{ display: "block", maxHeight: 320 }}
      >
        {/* Base dial with hour ticks — structure only */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={NOIR.navyField} strokeWidth={1.25} opacity={0.5} />
        {HOUR_TICKS.map((t, i) => (
          <line key={`tick-${String(i)}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={NOIR.navyField} strokeWidth={1} opacity={0.35} />
        ))}

        {/* Three shift arcs, revealed in sequence around the dial */}
        {SHIFT_ARCS.map((arc, idx) => (
          <motion.path
            key={`shift-${String(idx)}`}
            d={arc.d}
            fill="none"
            stroke={arc.live ? "var(--accent-ink)" : NOIR.navyField}
            strokeWidth={arc.live ? 3.5 : 2.5}
            strokeLinecap="round"
            opacity={arc.live ? 1 : 0.55}
            initial={reduced ? false : { pathLength: 0 }}
            animate={show ? { pathLength: 1 } : false}
            transition={{ duration: 0.4, delay: idx * 0.32, ease: "easeOut" }}
          />
        ))}

        {/* Handoff markers: the point one shift passes to the next */}
        {HANDOFFS.map((pt, idx) => (
          <motion.circle
            key={`handoff-${String(idx)}`}
            cx={pt.x}
            cy={pt.y}
            r={idx === 0 ? 4.5 : 3.5}
            fill={idx === 0 ? "var(--accent-ink)" : NOIR.navyField}
            opacity={idx === 0 ? 1 : 0.7}
            initial={reduced ? false : { opacity: 0, scale: 0 }}
            animate={show ? { opacity: idx === 0 ? 1 : 0.7, scale: 1 } : false}
            transition={{ duration: 0.25, delay: 0.3 + idx * 0.32, ease: "easeOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
          />
        ))}

        <text x={CX} y={CY - R - 18} textAnchor="middle" style={{ ...labelStyle, fill: NOIR.navyField, opacity: 0.65 }}>
          24h coverage
        </text>
        <text x={liveHandoff.x + 12} y={liveHandoff.y + 3} style={{ ...labelStyle, fill: "var(--accent-ink)" }}>
          live now
        </text>
      </svg>
    </Box>
  );
}
