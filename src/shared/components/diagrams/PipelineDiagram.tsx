import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

// Directed DAG Interconnect Paths
const CONNECTIONS = [
  // Source 1 -> Pipeline 1 & 2
  "M 140 60 C 170 60, 170 60, 200 60",
  "M 140 60 C 170 60, 170 120, 200 120",
  // Source 2 -> Pipeline 1 & 2
  "M 140 120 C 170 120, 170 60, 200 60",
  "M 140 120 C 170 120, 170 120, 200 120",
  // Pipeline 1 & 2 -> Delivery Node
  "M 320 60 C 350 60, 350 90, 380 90",
  "M 320 120 C 350 120, 350 90, 380 90",
] as const;

export function PipelineDiagram() {
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
        viewBox="0 0 520 210"
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        role="img"
        aria-label="Pure visual data science pipeline graph: multi-source ingestion cards connecting to feature compute matrix and low-latency delivery."
        style={{ display: "block", maxHeight: 320 }}
      >
        <defs>
          <linearGradient id="deliveryGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255, 199, 44, 0.18)" />
            <stop offset="100%" stopColor="rgba(6, 24, 59, 0.85)" />
          </linearGradient>
        </defs>

        {/* ── 1. Minimal Coordinate Grid ── */}
        <g opacity={0.08}>
          <line x1="20" y1="30" x2="500" y2="30" stroke="#FFFFFF" strokeWidth="0.75" strokeDasharray="3 3" />
          <line x1="20" y1="90" x2="500" y2="90" stroke="#FFFFFF" strokeWidth="0.75" />
          <line x1="20" y1="150" x2="500" y2="150" stroke="#FFFFFF" strokeWidth="0.75" strokeDasharray="3 3" />

          <line x1="85" y1="15" x2="85" y2="170" stroke="#FFFFFF" strokeWidth="0.75" strokeDasharray="3 3" />
          <line x1="260" y1="15" x2="260" y2="170" stroke="#FFFFFF" strokeWidth="0.75" strokeDasharray="3 3" />
          <line x1="435" y1="15" x2="435" y2="170" stroke="#FFFFFF" strokeWidth="0.75" strokeDasharray="3 3" />
        </g>

        {/* ── 2. Directed Interconnect Links & Precise Path-Locked Data Pulses ── */}
        {CONNECTIONS.map((path, idx) => (
          <g key={`conn-${idx}`}>
            <motion.path
              d={path}
              fill="none"
              stroke="rgba(255, 255, 255, 0.28)"
              strokeWidth={1.25}
              strokeDasharray="3 3"
              initial={reduced ? false : { pathLength: 0 }}
              animate={show ? { pathLength: 1 } : false}
              transition={{ duration: 0.5, delay: 0.2 + idx * 0.05, ease: "easeOut" }}
            />
          </g>
        ))}

        {/* Pixel-Perfect Path-Locked Data Pulses via Native SVG Motion */}
        {show && !reduced && (
          <g>
            {/* Pulse 1: Source 1 -> Pipeline 1 */}
            <rect
              x="-2.5"
              y="-2.5"
              width="5"
              height="5"
              rx="1.5"
              fill={NOIR.gold}
              style={{ filter: "drop-shadow(0 0 6px #FFC72C)" }}
            >
              <animateMotion
                dur="1.8s"
                repeatCount="indefinite"
                path="M 140 60 C 170 60, 170 60, 200 60"
              />
            </rect>

            {/* Pulse 2: Source 1 -> Pipeline 2 (diagonal) */}
            <rect
              x="-2.5"
              y="-2.5"
              width="5"
              height="5"
              rx="1.5"
              fill={NOIR.gold}
              style={{ filter: "drop-shadow(0 0 6px #FFC72C)" }}
            >
              <animateMotion
                dur="2.2s"
                begin="0.6s"
                repeatCount="indefinite"
                path="M 140 60 C 170 60, 170 120, 200 120"
              />
            </rect>

            {/* Pulse 3: Source 2 -> Pipeline 1 (diagonal) */}
            <rect
              x="-2.5"
              y="-2.5"
              width="5"
              height="5"
              rx="1.5"
              fill={NOIR.gold}
              style={{ filter: "drop-shadow(0 0 6px #FFC72C)" }}
            >
              <animateMotion
                dur="2.2s"
                begin="0.3s"
                repeatCount="indefinite"
                path="M 140 120 C 170 120, 170 60, 200 60"
              />
            </rect>

            {/* Pulse 4: Source 2 -> Pipeline 2 */}
            <rect
              x="-2.5"
              y="-2.5"
              width="5"
              height="5"
              rx="1.5"
              fill={NOIR.gold}
              style={{ filter: "drop-shadow(0 0 6px #FFC72C)" }}
            >
              <animateMotion
                dur="1.8s"
                begin="0.9s"
                repeatCount="indefinite"
                path="M 140 120 C 170 120, 170 120, 200 120"
              />
            </rect>

            {/* Pulse 5: Pipeline 1 -> Delivery */}
            <rect
              x="-2.5"
              y="-2.5"
              width="5"
              height="5"
              rx="1.5"
              fill={NOIR.gold}
              style={{ filter: "drop-shadow(0 0 6px #FFC72C)" }}
            >
              <animateMotion
                dur="1.6s"
                begin="0.2s"
                repeatCount="indefinite"
                path="M 320 60 C 350 60, 350 90, 380 90"
              />
            </rect>

            {/* Pulse 6: Pipeline 2 -> Delivery */}
            <rect
              x="-2.5"
              y="-2.5"
              width="5"
              height="5"
              rx="1.5"
              fill={NOIR.gold}
              style={{ filter: "drop-shadow(0 0 6px #FFC72C)" }}
            >
              <animateMotion
                dur="1.6s"
                begin="1.0s"
                repeatCount="indefinite"
                path="M 320 120 C 350 120, 350 90, 380 90"
              />
            </rect>
          </g>
        )}

        {/* ── 3. Stage 1 Nodes: SOURCES (Micro Waveform & Depth Histogram) ── */}

        {/* Source Node 1 (Raw Series Waveform) */}
        <g transform="translate(30, 36)">
          <motion.rect
            x="0"
            y="0"
            width="110"
            height="48"
            rx="5"
            fill="rgba(10, 42, 102, 0.65)"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1"
            initial={reduced ? false : { opacity: 0, scale: 0.95 }}
            animate={show ? { opacity: 1, scale: 1 } : false}
            transition={{ duration: 0.35, delay: 0.1 }}
          />
          {/* Header State Dot */}
          <circle cx="14" cy="14" r="2.5" fill="#4ADE80" />
          <line x1="22" y1="14" x2="48" y2="14" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />

          {/* Internal Micro Waveform Line */}
          <path
            d="M 14 34 L 26 28 L 38 38 L 50 26 L 62 32 L 74 24 L 86 36 L 96 30"
            fill="none"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Source Node 2 (Market Depth Tier Histogram) */}
        <g transform="translate(30, 96)">
          <motion.rect
            x="0"
            y="0"
            width="110"
            height="48"
            rx="5"
            fill="rgba(10, 42, 102, 0.65)"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1"
            initial={reduced ? false : { opacity: 0, scale: 0.95 }}
            animate={show ? { opacity: 1, scale: 1 } : false}
            transition={{ duration: 0.35, delay: 0.18 }}
          />
          {/* Header State Dot */}
          <circle cx="14" cy="14" r="2.5" fill="#4ADE80" />
          <line x1="22" y1="14" x2="48" y2="14" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />

          {/* Internal Depth Histogram Bars */}
          {[
            { x: 14, h: 18 },
            { x: 26, h: 12 },
            { x: 38, h: 22 },
            { x: 50, h: 16 },
            { x: 62, h: 24 },
            { x: 74, h: 14 },
            { x: 86, h: 20 },
          ].map((bar, i) => (
            <rect
              key={i}
              x={bar.x}
              y={40 - bar.h}
              width="6"
              height={bar.h}
              rx="1"
              fill="rgba(255, 255, 255, 0.45)"
            />
          ))}
        </g>

        {/* ── 4. Stage 2 Nodes: PIPELINE (Matrix Compute & Stream Normalization) ── */}

        {/* Pipeline Node 1 (Weighted Feature Matrix Grid) */}
        <g transform="translate(200, 36)">
          <motion.rect
            x="0"
            y="0"
            width="120"
            height="48"
            rx="5"
            fill="rgba(6, 24, 59, 0.85)"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1"
            initial={reduced ? false : { opacity: 0, scale: 0.95 }}
            animate={show ? { opacity: 1, scale: 1 } : false}
            transition={{ duration: 0.35, delay: 0.25 }}
          />
          {/* Header State Indicator */}
          <rect x="12" y="11" width="5" height="5" rx="1" fill={NOIR.gold} />
          <line x1="22" y1="13.5" x2="52" y2="13.5" stroke="rgba(255, 199, 44, 0.4)" strokeWidth="1" />

          {/* 4x2 Feature Weight Matrix Cells */}
          {[0.9, 0.4, 0.7, 0.85, 0.35, 0.6, 0.95, 0.5].map((val, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            return (
              <rect
                key={i}
                x={12 + col * 24}
                y={24 + row * 10}
                width="16"
                height="6"
                rx="1"
                fill={NOIR.gold}
                opacity={0.25 + val * 0.6}
              />
            );
          })}
        </g>

        {/* Pipeline Node 2 (Stream Normalization & Converging Rails) */}
        <g transform="translate(200, 96)">
          <motion.rect
            x="0"
            y="0"
            width="120"
            height="48"
            rx="5"
            fill="rgba(6, 24, 59, 0.85)"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1"
            initial={reduced ? false : { opacity: 0, scale: 0.95 }}
            animate={show ? { opacity: 1, scale: 1 } : false}
            transition={{ duration: 0.35, delay: 0.32 }}
          />
          {/* Header State Indicator */}
          <rect x="12" y="11" width="5" height="5" rx="1" fill={NOIR.gold} />
          <line x1="22" y1="13.5" x2="52" y2="13.5" stroke="rgba(255, 199, 44, 0.4)" strokeWidth="1" />

          {/* Converging Stream Horizontal Rails */}
          <line x1="12" y1="26" x2="108" y2="26" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
          <line x1="12" y1="33" x2="108" y2="33" stroke={NOIR.gold} strokeWidth="2" />
          <line x1="12" y1="40" x2="108" y2="40" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
        </g>

        {/* ── 5. Stage 3 Node: DELIVERY (Inference & Broadcast Hub) ── */}
        <g transform="translate(380, 52)">
          <motion.rect
            x="0"
            y="0"
            width="115"
            height="76"
            rx="6"
            fill="url(#deliveryGrad)"
            stroke={NOIR.gold}
            strokeWidth="1.5"
            style={{ filter: "drop-shadow(0 0 10px rgba(255, 199, 44, 0.35))" }}
            initial={reduced ? false : { opacity: 0, scale: 0.95 }}
            animate={show ? { opacity: 1, scale: 1 } : false}
            transition={{ duration: 0.4, delay: 0.4 }}
          />
          {/* Header Active Node */}
          <circle cx="14" cy="16" r="3" fill="#FFE082" style={{ filter: "drop-shadow(0 0 6px #FFC72C)" }} />
          <line x1="24" y1="16" x2="60" y2="16" stroke="rgba(255, 199, 44, 0.5)" strokeWidth="1" />

          {/* Smooth Predictive Trajectory Inside Delivery Hub */}
          <path
            d="M 14 56 C 36 56, 55 42, 75 32 S 95 24, 102 20"
            fill="none"
            stroke={NOIR.gold}
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(255, 199, 44, 0.8))" }}
          />
          <circle cx="102" cy="20" r="3.5" fill="#FFE082" style={{ filter: "drop-shadow(0 0 8px #FFC72C)" }} />

          {/* Micro Output Bus Pins */}
          <line x1="115" y1="20" x2="128" y2="20" stroke={NOIR.gold} strokeWidth="1.5" />
          <line x1="115" y1="38" x2="128" y2="38" stroke={NOIR.gold} strokeWidth="1.5" />
          <line x1="115" y1="56" x2="128" y2="56" stroke={NOIR.gold} strokeWidth="1.5" />
        </g>

        {/* ── 6. Bottom Stage Baseline Titles (SOURCES, PIPELINE, DELIVERY) ── */}
        <g fontFamily={MONO} fontSize="11" letterSpacing="0.22em" fontWeight="700">
          <text x="85" y="196" textAnchor="middle" fill="rgba(255, 255, 255, 0.65)">
            SOURCES
          </text>
          <text x="260" y="196" textAnchor="middle" fill="rgba(255, 255, 255, 0.65)">
            PIPELINE
          </text>
          <text x="435" y="196" textAnchor="middle" fill={NOIR.gold}>
            DELIVERY
          </text>
        </g>
      </svg>
    </Box>
  );
}
