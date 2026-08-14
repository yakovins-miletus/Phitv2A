import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useRef, useId } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

// Ingestion feed bus curves converging to Stage 01 (x=180, y=160)
const SOURCE_BUS_PATHS = [
  "M 90 75 C 135 75 145 160 180 160",
  "M 90 160 L 180 160",
  "M 90 245 C 135 245 145 160 180 160",
];

// Inter-stage interconnect bus lines
const INTERSTAGE_PATHS = [
  "M 300 160 L 340 160", // Ingest -> Transform
  "M 460 160 L 500 160", // Transform -> Storage
  "M 620 160 L 660 160", // Storage -> Output
  "M 780 160 L 820 160", // Output -> Stream Out
];

// Unified through-path for primary continuous stream tracer
const PRIMARY_THROUGH_PATH = "M 90 160 L 820 160";

const STAGES = [
  { id: "01", x: 180, label: "INGEST", sub: "EVENT STREAM" },
  { id: "02", x: 340, label: "TRANSFORM", sub: "DISTRIBUTED ETL" },
  { id: "03", x: 500, label: "STORAGE", sub: "COLUMNAR CACHE" },
  { id: "04", x: 660, label: "ANALYTICS", sub: "REAL-TIME API" },
];

export function PipelineDiagram() {
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
        viewBox="0 0 840 320"
        width="100%"
        height="100%"
        role="img"
        aria-label="Cloud-native data pipeline. Three raw data sources converge into a pipeline of ingest, transform, store, and analyze stages, with data pulses flowing between them."
        style={{ display: "block", overflow: "visible", maxHeight: 360 }}
      >
        <defs>
          <linearGradient id={`pipeGoldGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={NOIR.navyField} stopOpacity="0.4" />
            <stop offset="60%" stopColor={NOIR.goldDark} stopOpacity="0.9" />
            <stop offset="100%" stopColor={NOIR.gold} stopOpacity="1" />
          </linearGradient>

          <filter id={`pipeGlow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Grid Reference Lines */}
        <line x1="30" y1="160" x2="810" y2="160" stroke="rgba(10, 42, 102, 0.06)" strokeWidth="1" strokeDasharray="4 6" />

        {/* 1. Input Sources (Feed 01, 02, 03) */}
        {[
          { y: 75, label: "FEED 01" },
          { y: 160, label: "FEED 02" },
          { y: 245, label: "FEED 03" },
        ].map((src, idx) => (
          <g key={src.label}>
            <motion.rect
              x="30"
              y={src.y - 20}
              width="60"
              height="40"
              rx="8"
              fill="rgba(255, 255, 255, 0.9)"
              stroke={NOIR.navyField}
              strokeWidth="1.5"
              initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
              animate={show ? { opacity: 1, scale: 1 } : false}
              transition={{ duration: 0.4, delay: idx * 0.1, ease: "easeOut" }}
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
            />
            {/* Pulsing indicator pip */}
            <circle cx="44" cy={src.y} r="3" fill={NOIR.live} />
            <text
              x="62"
              y={src.y + 4}
              fill={NOIR.navyField}
              fontFamily={MONO}
              fontSize="9"
              fontWeight="700"
              textAnchor="middle"
            >
              {`0${idx + 1}`}
            </text>
          </g>
        ))}

        {/* 2. Ingest Confluence Paths */}
        {SOURCE_BUS_PATHS.map((path, idx) => (
          <motion.path
            key={`src-bus-${String(idx)}`}
            d={path}
            fill="none"
            stroke="rgba(10, 42, 102, 0.25)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={show ? { pathLength: 1 } : false}
            transition={{ duration: 0.5, delay: 0.2 + idx * 0.08, ease: "easeInOut" }}
          />
        ))}

        {/* 3. Inter-Stage Interconnect Highways */}
        {INTERSTAGE_PATHS.map((path, idx) => (
          <motion.path
            key={`inter-stage-${String(idx)}`}
            d={path}
            fill="none"
            stroke={idx === INTERSTAGE_PATHS.length - 1 ? `url(#pipeGoldGrad-${uid})` : "rgba(10, 42, 102, 0.25)"}
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={show ? { pathLength: 1 } : false}
            transition={{ duration: 0.4, delay: 0.4 + idx * 0.1, ease: "easeInOut" }}
          />
        ))}

        {/* Output Arrow Terminal */}
        <polygon
          points="820,160 812,154 812,166"
          fill={NOIR.goldDark}
        />

        {/* 4. Pipeline Stages (01 INGEST, 02 TRANSFORM, 03 STORAGE, 04 ANALYTICS) */}
        {STAGES.map((stage, idx) => {
          const isFinal = idx === STAGES.length - 1;
          return (
            <g key={stage.id}>
              {/* Stage Card */}
              <motion.rect
                x={stage.x}
                y="105"
                width="120"
                height="110"
                rx="14"
                fill="rgba(255, 255, 255, 0.92)"
                stroke={isFinal ? NOIR.goldDark : NOIR.navyField}
                strokeWidth={isFinal ? 2 : 1.5}
                initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                animate={show ? { opacity: 1, scale: 1 } : false}
                transition={{ duration: 0.45, delay: 0.3 + idx * 0.12, ease: "easeOut" }}
                style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              />

              {/* Stage Tag Number Badge */}
              <rect
                x={stage.x + 12}
                y="118"
                width="24"
                height="16"
                rx="4"
                fill={isFinal ? "rgba(255, 199, 44, 0.15)" : "rgba(10, 42, 102, 0.06)"}
              />
              <text
                x={stage.x + 24}
                y="130"
                fill={isFinal ? NOIR.goldDark : NOIR.mist}
                fontFamily={MONO}
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
              >
                {stage.id}
              </text>

              {/* Stage Title */}
              <text
                x={stage.x + 60}
                y="158"
                fill={isFinal ? NOIR.goldDark : NOIR.navyField}
                fontFamily={MONO}
                fontSize="12"
                fontWeight="800"
                letterSpacing="1"
                textAnchor="middle"
              >
                {stage.label}
              </text>

              {/* Stage Subtitle */}
              <text
                x={stage.x + 60}
                y="174"
                fill={NOIR.mist}
                fontFamily={MONO}
                fontSize="8"
                fontWeight="600"
                letterSpacing="0.8"
                textAnchor="middle"
              >
                {stage.sub}
              </text>

              {/* Internal Stage Architectural Glyphs */}
              {idx === 0 && (
                /* Ingestion Stream Bars */
                <g opacity="0.6">
                  <line x1={stage.x + 36} y1="192" x2={stage.x + 36} y2="200" stroke={NOIR.navyField} strokeWidth="2" strokeLinecap="round" />
                  <line x1={stage.x + 48} y1="188" x2={stage.x + 48} y2="200" stroke={NOIR.navyField} strokeWidth="2" strokeLinecap="round" />
                  <line x1={stage.x + 60} y1="184" x2={stage.x + 60} y2="200" stroke={NOIR.navyField} strokeWidth="2" strokeLinecap="round" />
                  <line x1={stage.x + 72} y1="189" x2={stage.x + 72} y2="200" stroke={NOIR.navyField} strokeWidth="2" strokeLinecap="round" />
                  <line x1={stage.x + 84} y1="193" x2={stage.x + 84} y2="200" stroke={NOIR.navyField} strokeWidth="2" strokeLinecap="round" />
                </g>
              )}

              {idx === 1 && (
                /* Transformation Matrix Nodes */
                <g opacity="0.7">
                  <circle cx={stage.x + 44} cy="192" r="2.5" fill={NOIR.goldDark} />
                  <circle cx={stage.x + 60} cy="192" r="2.5" fill={NOIR.navyField} />
                  <circle cx={stage.x + 76} cy="192" r="2.5" fill={NOIR.goldDark} />
                  <line x1={stage.x + 44} y1="192" x2={stage.x + 76} y2="192" stroke="rgba(10, 42, 102, 0.2)" strokeWidth="1" />
                </g>
              )}

              {idx === 2 && (
                /* Storage Columnar Tier */
                <g opacity="0.6">
                  <rect x={stage.x + 38} y="186" width="44" height="4" rx="2" fill={NOIR.navyField} />
                  <rect x={stage.x + 38} y="193" width="44" height="4" rx="2" fill={NOIR.navyField} />
                </g>
              )}

              {idx === 3 && (
                /* Analytics High-Throughput Core */
                <g>
                  <circle cx={stage.x + 60} cy="192" r="5" fill={NOIR.goldDark} filter={`url(#pipeGlow-${uid})`} />
                  <circle cx={stage.x + 60} cy="192" r="2" fill={NOIR.white} />
                </g>
              )}
            </g>
          );
        })}

        {/* 5. Animated Data Packets / Pulses */}
        {!reduced && inView && (
          <>
            {/* Multi-source Ingestion Feed Pulses */}
            {SOURCE_BUS_PATHS.map((path, idx) => (
              <circle key={`src-pulse-${String(idx)}`} r="3.5" fill={NOIR.gold} filter={`url(#pipeGlow-${uid})`}>
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  begin={`${String(idx * 0.3)}s`}
                  path={path}
                />
              </circle>
            ))}

            {/* Continuous Stage-to-Stage Stream Pulse */}
            <circle r="4" fill={NOIR.goldLight} filter={`url(#pipeGlow-${uid})`}>
              <animateMotion
                dur="3s"
                repeatCount="indefinite"
                path={PRIMARY_THROUGH_PATH}
              />
            </circle>
            <circle r="2" fill={NOIR.white}>
              <animateMotion
                dur="3s"
                repeatCount="indefinite"
                path={PRIMARY_THROUGH_PATH}
              />
            </circle>
          </>
        )}
      </svg>
    </Box>
  );
}
