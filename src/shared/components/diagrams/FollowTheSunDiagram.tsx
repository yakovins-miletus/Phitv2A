import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

// Authored SVG — three shift arcs hand off around the clock from the
// Philippine hubs, while the latency line below stays flat.

const CX = 320;
const CY = 120;
const SHIFT_ARCS = [
  { path: "M 320 30 A 90 90 0 0 1 397.9 165", stroke: NOIR.gold },
  { path: "M 397.9 165 A 90 90 0 0 1 242.1 165", stroke: NOIR.goldDark },
  { path: "M 242.1 165 A 90 90 0 0 1 320 30", stroke: NOIR.goldLight },
];
const HANDOFFS = [
  { x: 320, y: 30, label: "SHIFT 01", tx: 320, ty: 16, anchor: "middle" },
  { x: 397.9, y: 165, label: "SHIFT 02", tx: 414, ty: 186, anchor: "start" },
  { x: 242.1, y: 165, label: "SHIFT 03", tx: 226, ty: 186, anchor: "end" },
] as const;
const ORBIT_PATH = "M 320 30 A 90 90 0 1 1 320 210 A 90 90 0 1 1 320 30";

export function FollowTheSunDiagram() {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const dots = theme.palette.divider;
  const rootRef = useRef<HTMLDivElement>(null);
  // The orbiting pulse mounts only while on screen (see SignalDiagram).
  const inView = useInView(rootRef, { amount: 0.2 });

  // Lock animation once triggered — acts as `once: true` without relying on
  // per-element IntersectionObservers that fail inside GSAP's pinned scrub.
  const hasPlayed = useRef(false);
  if (inView) hasPlayed.current = true;
  const show = reduced === true || hasPlayed.current;

  return (
    <Box ref={rootRef} sx={{ width: 1, overflow: "hidden" }}>
      <svg
        viewBox="0 0 640 320"
        width="100%"
        role="img"
        aria-label="24/7 Global Operational Coverage. Multi-region shift handover around a 24-hour dial centered on the Philippine hubs, while a flat line below shows constant millisecond-level latency."
        style={{ display: "block" }}
      >
        <defs>
          <pattern id="fts-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill={dots} />
          </pattern>
        </defs>
        <rect width="640" height="320" fill="url(#fts-dots)" />

        <circle cx={CX} cy={CY} r="90" fill="none" stroke={NOIR.hairline} strokeWidth="1" strokeDasharray="3 6" />

        {SHIFT_ARCS.map((arc, index) => (
          <motion.path
            key={`arc-${String(index)}`}
            d={arc.path}
            fill="none"
            stroke={arc.stroke}
            strokeWidth="2.5"
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={show ? { pathLength: 1 } : false}
            transition={{ duration: 0.7, delay: index * 0.35, ease: "easeInOut" }}
          />
        ))}

        {HANDOFFS.map((node) => (
          <g key={node.label}>
            <circle cx={node.x} cy={node.y} r="5" fill={NOIR.panel} stroke={NOIR.ink} strokeWidth="2" />
            <text
              x={node.tx}
              y={node.ty}
              fill={NOIR.mist}
              fontFamily={MONO}
              fontSize="13"
              letterSpacing="2"
              textAnchor={node.anchor}
            >
              {node.label}
            </text>
          </g>
        ))}

        {reduced === true || !inView ? null : (
          <circle r="3" fill={NOIR.gold} opacity="0.9">
            <animateMotion dur="6s" repeatCount="indefinite" begin="1.4s" path={ORBIT_PATH} />
          </circle>
        )}

        {reduced === true
          ? null
          : [0, 1].map((ring) => (
              <motion.circle
                key={`radar-${String(ring)}`}
                cx={CX}
                cy={CY}
                r="10"
                fill="none"
                stroke={NOIR.gold}
                strokeWidth="1"
                initial={{ scale: 1, opacity: 0 }}
                animate={show ? { scale: [1, 3], opacity: [0.5, 0] } : false}
                transition={{ duration: 2, repeat: 2, delay: 1.2 + ring }}
                style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              />
            ))}
        <circle cx={CX} cy={CY} r="6" fill={NOIR.gold} />
        <text
          x={CX}
          y={CY + 28}
          fill={NOIR.mist}
          fontFamily={MONO}
          fontSize="13"
          letterSpacing="2"
          textAnchor="middle"
        >
          PH HUBS · 24/7
        </text>

        <line x1="80" y1="262" x2="560" y2="262" stroke={NOIR.hairline} strokeWidth="1" />
        <motion.path
          d="M 80 252 L 560 252"
          fill="none"
          stroke={NOIR.gold}
          strokeWidth="2"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 1, delay: 1.1, ease: "easeInOut" }}
        />
        {[160, 320, 480].map((x) => (
          <circle key={`tick-${String(x)}`} cx={x} cy="252" r="3" fill={NOIR.gold} />
        ))}
        <text
          x="320"
          y="296"
          fill={NOIR.mist}
          fontFamily={MONO}
          fontSize="13"
          letterSpacing="2"
          textAnchor="middle"
        >
          MS LATENCY — FLAT
        </text>
      </svg>
    </Box>
  );
}
