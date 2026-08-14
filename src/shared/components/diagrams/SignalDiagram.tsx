import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useRef, useId } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

// Mathematical waveform coordinate models
// Stochastic noise waveform (raw input on left side)
const NOISE_PRIMARY =
  "M 40 160 C 65 95 85 225 125 115 C 155 35 185 245 225 135 C 255 85 285 215 325 160 L 370 160";
const NOISE_SECONDARY =
  "M 40 160 C 65 210 95 110 135 190 C 165 250 200 80 235 180 C 265 220 295 120 330 160 L 370 160";

// Pure alpha trajectory (right side)
const ALPHA_MAIN =
  "M 430 160 C 490 158 540 128 600 106 C 655 86 705 68 760 54";

// Unified continuous path for data particle pulse
const FULL_PULSE_PATH =
  "M 40 160 C 65 95 85 225 125 115 C 155 35 185 245 225 135 C 255 85 285 215 325 160 L 430 160 C 490 158 540 128 600 106 C 655 86 705 68 760 54";

// Target conviction nodes along alpha curve
const ALPHA_NODES = [
  { x: 520, y: 136, label: "t₁" },
  { x: 610, y: 102, label: "t₂" },
  { x: 700, y: 72, label: "t₃" },
  { x: 760, y: 54, label: "α" },
];

export function SignalDiagram() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.2 });
  const uid = useId();

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
        viewBox="0 0 800 320"
        width="100%"
        height="100%"
        role="img"
        aria-label="Noise to alpha. Mathematical models extract trading signals from noisy market data."
        style={{ display: "block", overflow: "visible", maxHeight: 360 }}
      >
        <defs>
          <linearGradient id={`goldStream-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={NOIR.goldDark} stopOpacity="0.4" />
            <stop offset="50%" stopColor={NOIR.gold} stopOpacity="0.9" />
            <stop offset="100%" stopColor={NOIR.goldLight} stopOpacity="1" />
          </linearGradient>

          <linearGradient id={`confidenceRamp-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={NOIR.gold} stopOpacity="0.04" />
            <stop offset="60%" stopColor={NOIR.gold} stopOpacity="0.14" />
            <stop offset="100%" stopColor={NOIR.goldLight} stopOpacity="0.22" />
          </linearGradient>

          <filter id={`goldGlow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`kernelGlow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Precision Coordinate Grid */}
        <line x1="40" y1="160" x2="760" y2="160" stroke="rgba(10, 42, 102, 0.08)" strokeWidth="1" strokeDasharray="4 6" />
        <line x1="400" y1="24" x2="400" y2="296" stroke="rgba(10, 42, 102, 0.08)" strokeWidth="1" strokeDasharray="4 6" />

        {/* Coordinate tick marks */}
        {[80, 160, 240, 320, 480, 560, 640, 720].map((x) => (
          <line key={`tick-x-${String(x)}`} x1={x} y1="156" x2={x} y2="164" stroke="rgba(10, 42, 102, 0.12)" strokeWidth="1" />
        ))}
        {[60, 110, 210, 260].map((y) => (
          <line key={`tick-y-${String(y)}`} x1="396" y1={y} x2="404" y2={y} stroke="rgba(10, 42, 102, 0.12)" strokeWidth="1" />
        ))}

        {/* Section Labels */}
        <text
          x="44"
          y="42"
          fill={NOIR.mist}
          fontFamily={MONO}
          fontSize="11"
          fontWeight="700"
          letterSpacing="1.8"
        >
          01 · STOCHASTIC NOISE STREAM
        </text>

        <text
          x="400"
          y="42"
          fill={NOIR.navyField}
          fontFamily={MONO}
          fontSize="11"
          fontWeight="700"
          letterSpacing="1.8"
          textAnchor="middle"
        >
          KERNEL TRANSFORMATION
        </text>

        <text
          x="756"
          y="42"
          fill={NOIR.goldDark}
          fontFamily={MONO}
          fontSize="11"
          fontWeight="700"
          letterSpacing="1.8"
          textAnchor="end"
        >
          02 · PURE ALPHA VECTOR
        </text>

        {/* 1. Stochastic Noise Inputs (Raw high-entropy waves) */}
        {/* Ghost wave */}
        <motion.path
          d={NOISE_SECONDARY}
          fill="none"
          stroke="rgba(10, 42, 102, 0.22)"
          strokeWidth="1.75"
          strokeDasharray="4 4"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.9, delay: 0.1, ease: "easeInOut" }}
        />

        {/* Primary Noise Wave */}
        <motion.path
          d={NOISE_PRIMARY}
          fill="none"
          stroke={NOIR.mist}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        />

        {/* 2. Alpha Confidence Ribbon Envelope (Right side) */}
        <motion.path
          d="M 430 160 C 490 152 540 118 600 94 C 655 72 705 52 760 36 L 760 72 C 705 88 655 108 600 126 C 540 144 490 168 430 160 Z"
          fill={`url(#confidenceRamp-${uid})`}
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={show ? { opacity: 1 } : false}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        />

        {/* Upper and Lower Confidence Bounds */}
        <motion.path
          d="M 430 160 C 490 152 540 118 600 94 C 655 72 705 52 760 36"
          fill="none"
          stroke="rgba(255, 199, 44, 0.4)"
          strokeWidth="1"
          strokeDasharray="3 3"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeInOut" }}
        />
        <motion.path
          d="M 430 160 C 490 168 540 144 600 126 C 655 108 705 88 760 72"
          fill="none"
          stroke="rgba(255, 199, 44, 0.4)"
          strokeWidth="1"
          strokeDasharray="3 3"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeInOut" }}
        />

        {/* Main Golden Alpha Trajectory */}
        <motion.path
          d={ALPHA_MAIN}
          fill="none"
          stroke={`url(#goldStream-${uid})`}
          strokeWidth="3.5"
          strokeLinecap="round"
          filter={`url(#goldGlow-${uid})`}
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.9, delay: 0.7, ease: "easeInOut" }}
        />

        {/* Alpha Discrete Evaluation Nodes */}
        {ALPHA_NODES.map((node, idx) => (
          <g key={`alpha-node-${node.label}`}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="6"
              fill={NOIR.navyPanel}
              stroke={NOIR.goldDark}
              strokeWidth="2"
              filter={`url(#goldGlow-${uid})`}
              initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
              animate={show ? { opacity: 1, scale: 1 } : false}
              transition={{ duration: 0.35, delay: 0.9 + idx * 0.1, ease: "easeOut" }}
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
            />
            <circle cx={node.x} cy={node.y} r="2.5" fill={NOIR.goldLight} />
            <text
              x={node.x}
              y={node.y + 18}
              fill={NOIR.goldDark}
              fontFamily={MONO}
              fontSize="9"
              fontWeight="700"
              textAnchor="middle"
            >
              {node.label}
            </text>
          </g>
        ))}

        {/* 3. Central Mathematical Processing Kernel */}
        {/* Outer Halo */}
        <motion.circle
          cx="400"
          cy="160"
          r="48"
          fill="rgba(255, 199, 44, 0.05)"
          stroke="rgba(255, 199, 44, 0.25)"
          strokeWidth="1"
          strokeDasharray="4 4"
          filter={`url(#kernelGlow-${uid})`}
          initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          animate={show ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.5, delay: 0.35 }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />

        {/* Diamond Aperture Frame */}
        <motion.polygon
          points="400,105 455,160 400,215 345,160"
          fill="rgba(255, 255, 255, 0.95)"
          stroke={NOIR.navyField}
          strokeWidth="2"
          initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
          animate={show ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />

        {/* Inner Gold Diamond */}
        <motion.polygon
          points="400,122 438,160 400,198 362,160"
          fill="rgba(10, 42, 102, 0.04)"
          stroke={NOIR.goldDark}
          strokeWidth="1.5"
          initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
          animate={show ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.45, delay: 0.5, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />

        {/* Central Core Signal Emitter */}
        <motion.circle
          cx="400"
          cy="160"
          r="8"
          fill={NOIR.goldDark}
          filter={`url(#goldGlow-${uid})`}
          initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          animate={show ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.4, delay: 0.6 }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />
        <circle cx="400" cy="160" r="3.5" fill={NOIR.white} />

        {/* Core Mathematical Notation */}
        <text
          x="400"
          y="238"
          fill={NOIR.navyField}
          fontFamily={MONO}
          fontSize="10"
          fontWeight="700"
          letterSpacing="1"
          textAnchor="middle"
        >
          f(x) · σ → α
        </text>

        {/* 4. Dynamic Data Stream Particle Flow */}
        {!reduced && inView && (
          <>
            <circle r="5" fill={NOIR.goldLight} filter={`url(#goldGlow-${uid})`}>
              <animateMotion dur="3.2s" repeatCount="indefinite" path={FULL_PULSE_PATH} />
            </circle>
            <circle r="2.5" fill={NOIR.white}>
              <animateMotion dur="3.2s" repeatCount="indefinite" path={FULL_PULSE_PATH} />
            </circle>

            {/* Trailing secondary pulse */}
            <circle r="3.5" fill={NOIR.gold} filter={`url(#goldGlow-${uid})`}>
              <animateMotion dur="3.2s" begin="1.6s" repeatCount="indefinite" path={FULL_PULSE_PATH} />
            </circle>
          </>
        )}
      </svg>
    </Box>
  );
}
