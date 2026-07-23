import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

// Authored SVG — raw sources converge into an ingest → transform → store →
// analyze pipeline, with gold pulses relaying between stages.

const SOURCE_LINKS = [
  "M 76 90 C 120 90 130 160 170 160",
  "M 76 160 L 170 160",
  "M 76 230 C 120 230 130 160 170 160",
];
const STAGE_LINKS = ["M 260 160 L 300 160", "M 390 160 L 430 160", "M 510 160 L 550 160"];
const STAGES = [
  { x: 170, width: 90, label: "INGEST", labelX: 215 },
  { x: 300, width: 90, label: "TRANSFORM", labelX: 345 },
  { x: 430, width: 80, label: "STORE", labelX: 470 },
  { x: 550, width: 90, label: "ANALYZE", labelX: 595 },
];

export function PipelineDiagram() {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const dots = theme.palette.divider;
  const rootRef = useRef<HTMLDivElement>(null);
  // Looping pulses mount only while on screen (see SignalDiagram).
  const inView = useInView(rootRef, { amount: 0.2 });

  // Lock animation once triggered — acts as `once: true` without relying on
  // per-element IntersectionObservers that fail inside GSAP's pinned scrub.
  const hasPlayed = useRef(false);
  if (inView) hasPlayed.current = true;
  const show = reduced === true || hasPlayed.current;

  return (
    <Box ref={rootRef} sx={{ width: 1, overflow: "hidden" }}>
      <svg
        viewBox="0 0 680 300"
        width="100%"
        role="img"
        aria-label="Cloud-native data pipeline. Three raw data sources converge into a pipeline of ingest, transform, store, and analyze stages, with data pulses flowing between them."
        style={{ display: "block" }}
      >
        <defs>
          <pattern id="pipe-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill={dots} />
          </pattern>
        </defs>
        <rect width="680" height="300" fill="url(#pipe-dots)" />

        {[72, 142, 212].map((y, index) => (
          <motion.rect
            key={`src-${String(index)}`}
            x="40"
            y={y}
            width="36"
            height="36"
            rx="6"
            fill={NOIR.panel}
            stroke={NOIR.mist}
            strokeWidth="1.5"
            initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
            animate={show ? { opacity: 1, scale: 1 } : false}
            transition={{ duration: 0.4, delay: index * 0.12, ease: "easeOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
          />
        ))}

        {[...SOURCE_LINKS, ...STAGE_LINKS].map((path, index) => (
          <motion.path
            key={`link-${String(index)}`}
            d={path}
            fill="none"
            stroke={NOIR.hairline}
            strokeWidth="1.5"
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={show ? { pathLength: 1 } : false}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: "easeInOut" }}
          />
        ))}

        {STAGES.map((stage, index) => (
          <motion.rect
            key={stage.label}
            x={stage.x}
            y="130"
            width={stage.width}
            height="60"
            rx="8"
            fill={NOIR.panel}
            stroke={index === STAGES.length - 1 ? NOIR.gold : NOIR.ink}
            strokeWidth="2"
            initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            animate={show ? { opacity: 1, scale: 1 } : false}
            transition={{ duration: 0.45, delay: 0.5 + index * 0.15, ease: "easeOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
          />
        ))}

        {/* Stage glyphs: transform = process lines, store = layers, analyze = bars */}
        {[145, 160, 175].map((y) => (
          <line key={`tf-${String(y)}`} x1="316" y1={y} x2="374" y2={y} stroke={NOIR.gold} strokeWidth="2" />
        ))}
        {[150, 170].map((y) => (
          <line key={`st-${String(y)}`} x1="430" y1={y} x2="510" y2={y} stroke={NOIR.hairline} strokeWidth="1.5" />
        ))}
        <rect x="566" y="166" width="10" height="14" fill={NOIR.goldDark} />
        <rect x="582" y="154" width="10" height="26" fill={NOIR.gold} />
        <rect x="598" y="142" width="10" height="38" fill={NOIR.goldLight} />

        {reduced === true || !inView
          ? null
          : [...SOURCE_LINKS, ...STAGE_LINKS].map((path, index) => (
              <circle key={`pulse-${String(index)}`} r="2.5" fill={NOIR.gold} opacity="0.9">
                <animateMotion
                  dur="1.6s"
                  repeatCount="indefinite"
                  begin={`${String(1.4 + index * 0.4)}s`}
                  path={path}
                />
              </circle>
            ))}

        <text
          x="58"
          y="272"
          fill={NOIR.mist}
          fontFamily={MONO}
          fontSize="13"
          letterSpacing="2"
          textAnchor="middle"
        >
          SOURCES
        </text>
        {STAGES.map((stage) => (
          <text
            key={`label-${stage.label}`}
            x={stage.labelX}
            y="230"
            fill={NOIR.mist}
            fontFamily={MONO}
            fontSize="13"
            letterSpacing="2"
            textAnchor="middle"
          >
            {stage.label}
          </text>
        ))}
      </svg>
    </Box>
  );
}
