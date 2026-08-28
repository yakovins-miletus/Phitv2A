import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

// Multi-point stochastic walk for clean raw market series (centered on baseline y=95)
const RAW_TICKS: Array<[number, number]> = [
  [30, 95], [42, 112], [54, 82], [66, 118], [78, 74], [90, 108],
  [102, 98], [114, 124], [126, 80], [138, 110], [150, 90], [162, 116],
  [174, 84], [186, 104], [198, 92], [210, 112], [222, 88], [234, 98],
];

const RAW_PATH = RAW_TICKS.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");

// Model gate converging bars
const BARS = [0.85, 0.45, 0.65, 0.35, 0.55, 0.25] as const;

// Smooth predictive signal trajectory rising into upper right
const SIGNAL_PATH = "M 280 95 C 330 95, 370 65, 410 45 S 460 28, 480 22";

export function SignalDiagram() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.2 });
  const show = reduced === true || inView;

  return (
    <Box
      ref={rootRef}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 1,
      }}
    >
      <svg
        viewBox="0 0 520 200"
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        role="img"
        aria-label="Clean signal extraction graph: raw noise passing through model gate into resolved predictive signal."
        style={{ display: "block", maxHeight: 320 }}
      >
        <defs>
          <linearGradient id="signalGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255, 199, 44, 0.4)" />
            <stop offset="100%" stopColor="#FFC72C" />
          </linearGradient>
        </defs>

        {/* ── 1. Minimal Background Coordinate Grid ── */}
        <g opacity={0.1}>
          <line x1="30" y1="35" x2="490" y2="35" stroke="#FFFFFF" strokeWidth="0.75" strokeDasharray="4 4" />
          <line x1="30" y1="95" x2="490" y2="95" stroke="#FFFFFF" strokeWidth="0.75" />
          <line x1="30" y1="155" x2="490" y2="155" stroke="#FFFFFF" strokeWidth="0.75" strokeDasharray="4 4" />

          <line x1="130" y1="15" x2="130" y2="165" stroke="#FFFFFF" strokeWidth="0.75" strokeDasharray="3 4" />
          <line x1="260" y1="15" x2="260" y2="165" stroke="#FFFFFF" strokeWidth="0.75" strokeDasharray="3 4" />
          <line x1="390" y1="15" x2="390" y2="165" stroke="#FFFFFF" strokeWidth="0.75" strokeDasharray="3 4" />
        </g>

        {/* ── 2. Raw Noise Stream ── */}
        <motion.path
          d={RAW_PATH}
          fill="none"
          stroke="rgba(255, 255, 255, 0.55)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? false : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />

        {/* Connector from Noise to Gate */}
        <motion.line
          x1={234}
          y1={98}
          x2={248}
          y2={95}
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth={1.5}
          initial={reduced ? false : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.2, delay: 0.55 }}
        />

        {/* ── 3. Minimal Model Filter Gate ── */}
        <g transform="translate(248, 38)">
          {/* Outer Gate Frame */}
          <rect
            x="0"
            y="0"
            width="24"
            height="114"
            rx="3"
            fill="rgba(10, 42, 102, 0.5)"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1.2"
          />

          {/* Center Reference Line */}
          <line x1="0" y1="57" x2="24" y2="57" stroke={NOIR.gold} strokeWidth="1.2" opacity={0.7} />

          {/* Converging Bars */}
          {BARS.map((h, i) => {
            const barH = h * 90;
            const barX = 3.5 + i * 3;
            return (
              <motion.rect
                key={i}
                x={barX}
                y={57 - barH / 2}
                width={2}
                height={barH}
                rx={1}
                fill="rgba(255, 255, 255, 0.75)"
                initial={reduced ? false : { scaleY: 0 }}
                animate={show ? { scaleY: 1 } : false}
                transition={{ duration: 0.3, delay: 0.6 + i * 0.05, ease: "easeOut" }}
                style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              />
            );
          })}
        </g>

        {/* Connector from Gate to Signal */}
        <motion.line
          x1={272}
          y1={95}
          x2={280}
          y2={95}
          stroke="rgba(255, 199, 44, 0.6)"
          strokeWidth={2}
          initial={reduced ? false : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.15, delay: 0.9 }}
        />

        {/* ── 4. Resolved Signal ── */}
        <motion.path
          d={SIGNAL_PATH}
          fill="none"
          stroke="url(#signalGradient)"
          strokeWidth={3}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 8px rgba(255, 199, 44, 0.7))" }}
          initial={reduced ? false : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.7, delay: 1.0, ease: "easeInOut" }}
        />

        {/* Signal Endpoint Node */}
        <motion.circle
          cx={480}
          cy={22}
          r={4.5}
          fill={NOIR.gold}
          style={{ filter: "drop-shadow(0 0 10px #FFC72C)" }}
          initial={reduced ? false : { scale: 0 }}
          animate={show ? { scale: 1 } : false}
          transition={{ duration: 0.25, delay: 1.6, ease: "easeOut" }}
        />

        {/* ── 5. Standardized Bottom Alignment for ALL THREE Labels ── */}
        <g fontFamily={MONO} fontSize="11" letterSpacing="0.2em" fontWeight="700">
          <text
            x="130"
            y="186"
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.65)"
          >
            NOISE
          </text>
          <text
            x="260"
            y="186"
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.65)"
          >
            MODEL
          </text>
          <text
            x="390"
            y="186"
            textAnchor="middle"
            fill={NOIR.gold}
          >
            SIGNAL
          </text>
        </g>
      </svg>
    </Box>
  );
}
