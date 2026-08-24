import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";

const CX = 200;
const CY = 100;
const R = 70;

function pointAt(deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + Math.cos(rad) * R, y: CY + Math.sin(rad) * R };
}

// Three shifts, each covering 120 degrees, handing off to the next at
// each boundary so the dial reads as unbroken coverage.
const BOUNDARIES = [0, 120, 240, 360] as const;
const SHIFT_ARCS = [0, 1, 2].map((i) => {
  const start = pointAt(BOUNDARIES[i] ?? 0);
  const end = pointAt(BOUNDARIES[i + 1] ?? 360);
  return { d: `M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`, opacity: 0.45 + i * 0.28 };
});
// Handoff markers sit at the boundary between consecutive shifts.
const HANDOFFS = BOUNDARIES.slice(0, 3).map((deg) => pointAt(deg));
const firstHandoff = HANDOFFS[0] ?? pointAt(0);

export function FollowTheSunDiagram() {
  const reduced = useReducedMotion() === true;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.2 });
  const show = reduced || inView;

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
        aria-label="Follow-the-sun coverage. Three shifts, each covering a third of the dial, hand off to the next at three marked points for unbroken coverage."
        style={{ display: "block", maxHeight: 320 }}
      >
        {/* Base dial */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={NOIR.navyField} strokeWidth={1.5} />

        {/* Three shift arcs, revealed in sequence around the dial */}
        {SHIFT_ARCS.map((arc, idx) => (
          <motion.path
            key={`shift-${String(idx)}`}
            d={arc.d}
            fill="none"
            stroke={NOIR.goldDark}
            strokeWidth={3}
            strokeLinecap="round"
            initial={reduced ? false : { opacity: 0 }}
            animate={show ? { opacity: arc.opacity } : false}
            transition={{ duration: 0.4, delay: idx * 0.4, ease: "easeOut" }}
          />
        ))}

        {/* Handoff markers: the point one shift passes to the next */}
        {HANDOFFS.map((pt, idx) => (
          <motion.circle
            key={`handoff-${String(idx)}`}
            cx={pt.x}
            cy={pt.y}
            r={5}
            fill={NOIR.goldDark}
            initial={reduced ? false : { opacity: 0, scale: 0 }}
            animate={show ? { opacity: 1, scale: 1 } : false}
            transition={{ duration: 0.25, delay: 0.35 + idx * 0.4, ease: "easeOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
          />
        ))}

        <text x={CX} y={CY - R - 14} textAnchor="middle" fontFamily="monospace" fontSize={9} fill={NOIR.navyField} opacity={0.7}>
          24h coverage
        </text>
        <text x={firstHandoff.x + 10} y={firstHandoff.y + 4} fontFamily="monospace" fontSize={9} fill={NOIR.goldDark}>
          handoff
        </text>
      </svg>
    </Box>
  );
}
