import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

// Authored SVG — noisy market data enters a model node and exits as a clean
// rising signal. Structure in ink, signal in gold, labels on the mono rail.

const NOISE_PATH =
  "M 20 160 L 40 120 L 60 190 L 80 140 L 100 200 L 120 110 L 140 180 L 160 130 L 180 175 L 200 145 L 225 172 L 258 160";
const ALPHA_PATH = "M 382 160 C 430 155 455 140 490 128 C 525 116 560 104 620 84";
// Straight-through path — the model box is painted AFTER the pulse in SVG
// order so the dot disappears behind the box (z-axis occlusion).
const PULSE_PATH = `${NOISE_PATH} L 382 160 C 430 155 455 140 490 128 C 525 116 560 104 620 84`;
const ALPHA_DOTS = [
  { x: 490, y: 128 },
  { x: 557, y: 105 },
  { x: 620, y: 84 },
];

export function SignalDiagram() {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const dots = theme.palette.divider;
  const rootRef = useRef<HTMLDivElement>(null);
  // The looping pulse mounts only while on screen — SMIL otherwise animates
  // (and forces compositing) even when scrolled far away.
  const inView = useInView(rootRef, { amount: 0.2 });

  // Lock animation once triggered — acts as `once: true` without relying on
  // per-element IntersectionObservers that fail inside GSAP's pinned scrub.
  const hasPlayed = useRef(false);
  if (inView) hasPlayed.current = true;
  const show = reduced === true || hasPlayed.current;

  return (
    <Box ref={rootRef} sx={{ width: 1, overflow: "hidden" }}>
      <svg
        viewBox="0 0 640 300"
        width="100%"
        role="img"
        aria-label="Noise to alpha. A noisy market-data waveform enters a model node and leaves as a clean, rising trading signal."
        style={{ display: "block" }}
      >
        <defs>
          <pattern id="sig-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill={dots} />
          </pattern>
        </defs>
        <rect width="640" height="300" fill="url(#sig-dots)" />

        <motion.path
          d={NOISE_PATH}
          fill="none"
          stroke={NOIR.mist}
          strokeWidth="1.5"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {/* Pulse rendered BEFORE the model box so the box occludes it (SVG
            z-order = document order — later elements paint on top). */}
        {reduced === true || !inView ? null : (
          <circle r="3" fill={NOIR.gold} opacity="0.9">
            <animateMotion dur="4s" repeatCount="indefinite" begin="2.2s" path={PULSE_PATH} />
          </circle>
        )}

        <motion.rect
          x="260"
          y="100"
          width="120"
          height="120"
          rx="14"
          fill={NOIR.panel}
          stroke={NOIR.ink}
          strokeWidth="2"
          initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
          animate={show ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />
        <motion.rect
          x="288"
          y="128"
          width="64"
          height="64"
          rx="10"
          fill="none"
          stroke={NOIR.gold}
          strokeWidth="2"
          initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
          animate={show ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />
        <motion.circle
          cx="320"
          cy="160"
          r="6"
          fill={NOIR.gold}
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={show ? { opacity: 1 } : false}
          transition={{ duration: 0.4, delay: 1 }}
        />

        <motion.path
          d={ALPHA_PATH}
          fill="none"
          stroke={NOIR.gold}
          strokeWidth="2"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.9, delay: 1.1, ease: "easeInOut" }}
        />
        {ALPHA_DOTS.map((dot, index) => (
          <motion.circle
            key={`alpha-${String(index)}`}
            cx={dot.x}
            cy={dot.y}
            r="4"
            fill={NOIR.gold}
            initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            animate={show ? { opacity: 1, scale: 1 } : false}
            transition={{ duration: 0.35, delay: 1.5 + index * 0.15 }}
            style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
          />
        ))}

        {[
          { x: 130, label: "NOISE" },
          { x: 320, label: "MODEL" },
          { x: 520, label: "SIGNAL" },
        ].map((item) => (
          <text
            key={item.label}
            x={item.x}
            y="272"
            fill={NOIR.mist}
            fontFamily={MONO}
            fontSize="13"
            letterSpacing="2"
            textAnchor="middle"
          >
            {item.label}
          </text>
        ))}
      </svg>
    </Box>
  );
}
