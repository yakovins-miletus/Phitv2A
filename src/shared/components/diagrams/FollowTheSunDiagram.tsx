import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useState, useRef, useId } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

interface NodeItem {
  id: string;
  label: string;
  utc: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  textAnchor: "middle" | "start" | "end";
  color: string;
}

const CX = 390;
const CY = 145;
const RADIUS = 96;

// 3 Abstract shift rotation nodes (120° equidistant distribution, no geographical names)
const NODES: readonly NodeItem[] = [
  {
    id: "shift-01",
    label: "SHIFT 01",
    utc: "00:00 — 08:00 UTC",
    x: 390,
    y: 49,
    labelX: 390,
    labelY: 30,
    textAnchor: "middle",
    color: NOIR.gold,
  },
  {
    id: "shift-02",
    label: "SHIFT 02",
    utc: "08:00 — 16:00 UTC",
    x: 473.14,
    y: 193,
    labelX: 492,
    labelY: 198,
    textAnchor: "start",
    color: NOIR.goldDark,
  },
  {
    id: "shift-03",
    label: "SHIFT 03",
    utc: "16:00 — 24:00 UTC",
    x: 306.86,
    y: 193,
    labelX: 288,
    labelY: 198,
    textAnchor: "end",
    color: NOIR.live,
  },
];

// Circular trajectory
const ORBIT_PATH = `M 390 49 A 96 96 0 1 1 390 241 A 96 96 0 1 1 390 49`;

// Handover arcs connecting the 3 shift nodes
const HANDOVER_ARCS = [
  { path: "M 390 49 A 96 96 0 0 1 473.14 193", stroke: NOIR.gold },
  { path: "M 473.14 193 A 96 96 0 0 1 306.86 193", stroke: NOIR.goldDark },
  { path: "M 306.86 193 A 96 96 0 0 1 390 49", stroke: NOIR.live },
];

export function FollowTheSunDiagram() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.2 });
  const uid = useId();

  const [activeNodeId, setActiveNodeId] = useState<string>("shift-01");

  const show = reduced === true || inView;

  return (
    <Box
      ref={rootRef}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 1, md: 2 },
      }}
    >
      <svg
        viewBox="0 0 780 340"
        width="100%"
        height="100%"
        role="img"
        aria-label="Follow-the-sun coverage. Three shift rotations handed off around a 24-hour dial, with a timeline below showing continuous, gap-free coverage."
        style={{ display: "block", overflow: "visible", maxHeight: 360 }}
      >
        <defs>
          <filter id={`ftsGlow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Orbit Guide Halo Rings */}
        <circle cx={CX} cy={CY} r={RADIUS + 20} fill="none" stroke="rgba(10, 42, 102, 0.05)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="rgba(10, 42, 102, 0.1)" strokeWidth="1.5" strokeDasharray="3 5" />
        <circle cx={CX} cy={CY} r={RADIUS - 28} fill="none" stroke="rgba(10, 42, 102, 0.05)" strokeWidth="1" />

        {/* Handover Arcs */}
        {HANDOVER_ARCS.map((arc, index) => (
          <motion.path
            key={`handover-arc-${String(index)}`}
            d={arc.path}
            fill="none"
            stroke={arc.stroke}
            strokeWidth="3"
            strokeLinecap="round"
            filter={`url(#ftsGlow-${uid})`}
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={show ? { pathLength: 1 } : false}
            transition={{ duration: 0.8, delay: index * 0.2, ease: "easeInOut" }}
          />
        ))}

        {/* Central Core Radar Ping */}
        {!reduced && inView && [0, 1].map((ring) => (
          <motion.circle
            key={`radar-${String(ring)}`}
            cx={CX}
            cy={CY}
            r="16"
            fill="none"
            stroke={NOIR.gold}
            strokeWidth="1.5"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: ring * 1.25, ease: "easeOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
          />
        ))}

        {/* Center Node Core */}
        <circle cx={CX} cy={CY} r="10" fill={NOIR.navyPanel} stroke={NOIR.goldDark} strokeWidth="2" />
        <circle cx={CX} cy={CY} r="4" fill={NOIR.goldLight} />

        <text
          x={CX}
          y={CY + 32}
          fill={NOIR.navyField}
          fontFamily={MONO}
          fontSize="10"
          fontWeight="700"
          letterSpacing="1.4"
          textAnchor="middle"
        >
          24/7 CONTINUITY
        </text>

        {/* 3 Abstract Shift Nodes */}
        {NODES.map((node) => {
          const isSelected = activeNodeId === node.id;
          return (
            <g
              key={node.id}
              onClick={() => setActiveNodeId(node.id)}
              style={{ cursor: "pointer" }}
            >
              {/* Outer target circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isSelected ? 14 : 10}
                fill={NOIR.white}
                stroke={isSelected ? NOIR.gold : node.color}
                strokeWidth={isSelected ? 3 : 2}
                filter={isSelected ? `url(#ftsGlow-${uid})` : undefined}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={isSelected ? 5 : 3.5}
                fill={isSelected ? NOIR.goldDark : node.color}
              />

              {/* Node Title & Timestamp Subtitle */}
              <text
                x={node.labelX}
                y={node.labelY}
                fill={isSelected ? NOIR.goldDark : NOIR.navyField}
                fontFamily={MONO}
                fontSize="11"
                fontWeight="800"
                letterSpacing="1.2"
                textAnchor={node.textAnchor}
              >
                {node.label}
              </text>
              <text
                x={node.labelX}
                y={node.labelY + (node.textAnchor === "middle" ? 14 : 13)}
                fill={NOIR.mist}
                fontFamily={MONO}
                fontSize="9"
                fontWeight="600"
                letterSpacing="0.8"
                textAnchor={node.textAnchor}
              >
                {node.utc}
              </text>
            </g>
          );
        })}

        {/* Orbit Photon Tracer */}
        {!reduced && inView && (
          <>
            <circle r="5" fill={NOIR.goldLight} filter={`url(#ftsGlow-${uid})`}>
              <animateMotion dur="5s" repeatCount="indefinite" path={ORBIT_PATH} />
            </circle>
            <circle r="2.5" fill={NOIR.white}>
              <animateMotion dur="5s" repeatCount="indefinite" path={ORBIT_PATH} />
            </circle>
          </>
        )}

        {/* Bottom Latency Performance Ruler */}
        <line x1="120" y1="290" x2="660" y2="290" stroke="rgba(10, 42, 102, 0.12)" strokeWidth="1" />
        <motion.line
          x1="120"
          y1="290"
          x2="660"
          y2="290"
          stroke={NOIR.goldDark}
          strokeWidth="2"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
        />

        {/* Marker Points along timeline */}
        {[200, 320, 440, 560].map((x) => (
          <g key={`marker-${String(x)}`}>
            <circle cx={x} cy="290" r="3.5" fill={NOIR.navyPanel} stroke={NOIR.goldDark} strokeWidth="1.5" />
            <circle cx={x} cy="290" r="1.5" fill={NOIR.goldLight} />
          </g>
        ))}

        <text
          x={CX}
          y="314"
          fill={NOIR.navyField}
          fontFamily={MONO}
          fontSize="10"
          fontWeight="700"
          letterSpacing="1.8"
          textAnchor="middle"
        >
          THREE SHIFTS · NO GAP IN COVERAGE
        </text>
      </svg>
    </Box>
  );
}
