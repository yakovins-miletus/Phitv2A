import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";
import { MONO, TYPE_SCALE, TRACKING } from "@/shared/theme/theme";

// Three source feeds converging into the first pipeline stage.
const SOURCE_Y = [50, 100, 150];
const STAGE_1_X0 = 132;
const STAGE_1_X1 = 178;
const STAGE_2_X0 = 224;
const STAGE_2_X1 = 270;
const STAGE_Y0 = 76;
const STAGE_Y1 = 124;
const STAGE_CY = (STAGE_Y0 + STAGE_Y1) / 2;

const SOURCE_LINES = SOURCE_Y.map((y) => `M 22 ${y} C 76 ${y} 96 ${STAGE_CY} ${STAGE_1_X0} ${STAGE_CY}`);

/**
 * Deterministic tick offsets along each source feed — small perpendicular
 * marks at fixed fractions of the run, so a feed reads as discretely sampled
 * data rather than a single smooth idealised curve. Hand-set, not random:
 * three feeds, three fixed cadences (dense / medium / sparse) so they read
 * as distinguishable channels rather than three copies of the same line.
 */
const TICK_FRACTIONS: readonly (readonly number[])[] = [
  [0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84],
  [0.15, 0.35, 0.55, 0.75],
  [0.2, 0.5, 0.8],
];

function pointOnSourceLine(y: number, t: number) {
  // Matches the cubic bezier above: P0=(22,y) P1=(76,y) P2=(96,STAGE_CY) P3=(STAGE_1_X0,STAGE_CY)
  const p0x = 22;
  const p1x = 76;
  const p2x = 96;
  const p3x = STAGE_1_X0;
  const mt = 1 - t;
  const x = mt ** 3 * p0x + 3 * mt ** 2 * t * p1x + 3 * mt * t ** 2 * p2x + t ** 3 * p3x;
  const yy = mt ** 3 * y + 3 * mt ** 2 * t * y + 3 * mt * t ** 2 * STAGE_CY + t ** 3 * STAGE_CY;
  return { x, y: yy };
}

// Windowed-transform mechanism inside stage 1: a small grid of weighted taps.
const STAGE1_GRID_COLS = 3;
const STAGE1_GRID_ROWS = 2;
const STAGE1_WEIGHTS = [0.9, 0.35, 0.7, 0.5, 0.85, 0.4] as const;

// Aggregation mechanism inside stage 2: overlapping windows collapsing to one band.
const STAGE2_BANDS = [0.85, 0.6, 0.4] as const;

export function PipelineDiagram() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.2 });
  const show = reduced === true || inView;

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
        aria-label="Sources, pipeline stages, served output. Three sampled feeds converge, pass through a weighted transform stage and an aggregation stage, and emerge as a single served line."
        style={{ display: "block", maxHeight: 320 }}
      >
        {/* Sources: three separately-sampled feeds, each with its own cadence */}
        {SOURCE_LINES.map((path, idx) => (
          <g key={`source-${String(idx)}`}>
            <motion.path
              d={path}
              fill="none"
              stroke={NOIR.navyField}
              strokeWidth={1.25}
              strokeLinecap="round"
              opacity={0.7}
              initial={reduced ? false : { pathLength: 0 }}
              animate={show ? { pathLength: 1 } : false}
              transition={{ duration: 0.4, delay: idx * 0.08, ease: "easeOut" }}
            />
            {(TICK_FRACTIONS[idx] ?? []).map((t, ti) => {
              const p = pointOnSourceLine(SOURCE_Y[idx] ?? 0, t);
              return (
                <motion.circle
                  key={`tick-${String(idx)}-${String(ti)}`}
                  cx={p.x}
                  cy={p.y}
                  r={1.4}
                  fill={NOIR.navyField}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={show ? { opacity: 0.55 } : false}
                  transition={{ duration: 0.2, delay: 0.15 + idx * 0.08 + ti * 0.03 }}
                />
              );
            })}
          </g>
        ))}
        <text x={22} y={34} style={{ ...labelStyle, fill: NOIR.navyField, opacity: 0.65 }}>
          sources
        </text>

        {/* Stage 1: weighted-transform mechanism */}
        <motion.g
          initial={reduced ? false : { opacity: 0 }}
          animate={show ? { opacity: 1 } : false}
          transition={{ duration: 0.2, delay: 0.36 }}
        >
          <rect
            x={STAGE_1_X0}
            y={STAGE_Y0}
            width={STAGE_1_X1 - STAGE_1_X0}
            height={STAGE_Y1 - STAGE_Y0}
            fill="none"
            stroke={NOIR.navyField}
            strokeWidth={1.25}
            opacity={0.6}
          />
          {STAGE1_WEIGHTS.map((w, i) => {
            const col = i % STAGE1_GRID_COLS;
            const row = Math.floor(i / STAGE1_GRID_COLS);
            const cellW = (STAGE_1_X1 - STAGE_1_X0 - 12) / STAGE1_GRID_COLS;
            const cellH = (STAGE_Y1 - STAGE_Y0 - 12) / STAGE1_GRID_ROWS;
            const cx = STAGE_1_X0 + 6 + cellW * col + cellW / 2;
            const cy = STAGE_Y0 + 6 + cellH * row + cellH / 2;
            return (
              <motion.rect
                key={`w-${String(i)}`}
                x={cx - cellW * 0.36}
                y={cy - cellH * 0.36}
                width={cellW * 0.72}
                height={cellH * 0.72}
                rx={1}
                fill={NOIR.navyField}
                opacity={0.25 + w * 0.4}
                initial={reduced ? false : { scale: 0 }}
                animate={show ? { scale: 1 } : false}
                transition={{ duration: 0.25, delay: 0.5 + i * 0.05, ease: "easeOut" }}
                style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              />
            );
          })}
        </motion.g>

        {/* Link between the two stages */}
        <motion.line
          x1={STAGE_1_X1}
          y1={STAGE_CY}
          x2={STAGE_2_X0}
          y2={STAGE_CY}
          stroke={NOIR.navyField}
          strokeWidth={1.25}
          opacity={0.5}
          initial={reduced ? false : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.2, delay: 0.85, ease: "easeOut" }}
        />

        {/* Stage 2: aggregation mechanism — overlapping windows collapsing to one band */}
        <motion.g
          initial={reduced ? false : { opacity: 0 }}
          animate={show ? { opacity: 1 } : false}
          transition={{ duration: 0.2, delay: 0.95 }}
        >
          <rect
            x={STAGE_2_X0}
            y={STAGE_Y0}
            width={STAGE_2_X1 - STAGE_2_X0}
            height={STAGE_Y1 - STAGE_Y0}
            fill="none"
            stroke={NOIR.navyField}
            strokeWidth={1.25}
            opacity={0.6}
          />
          {STAGE2_BANDS.map((frac, i) => {
            const bandW = (STAGE_2_X1 - STAGE_2_X0 - 14) * frac;
            return (
              <motion.rect
                key={`band-${String(i)}`}
                x={STAGE_2_X0 + 7 + ((STAGE_2_X1 - STAGE_2_X0 - 14) - bandW) / 2}
                y={STAGE_Y0 + 10 + i * 10}
                width={bandW}
                height={4}
                rx={2}
                fill={NOIR.navyField}
                opacity={0.35 + i * 0.15}
                initial={reduced ? false : { scaleX: 0 }}
                animate={show ? { scaleX: 1 } : false}
                transition={{ duration: 0.3, delay: 1.05 + i * 0.08, ease: "easeOut" }}
                style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              />
            );
          })}
        </motion.g>
        <text x={(STAGE_1_X0 + STAGE_2_X1) / 2} y={STAGE_Y1 + 22} textAnchor="middle" style={{ ...labelStyle, fill: NOIR.navyField, opacity: 0.65 }}>
          pipeline
        </text>

        {/* Served output — the one element that carries meaning */}
        <motion.line
          x1={STAGE_2_X1}
          y1={STAGE_CY}
          x2={380}
          y2={STAGE_CY}
          stroke="var(--accent-ink)"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.4, delay: 1.4, ease: "easeOut" }}
        />
        <motion.circle
          cx={380}
          cy={STAGE_CY}
          r={2.75}
          fill="var(--accent-ink)"
          initial={reduced ? false : { opacity: 0, scale: 0 }}
          animate={show ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.25, delay: 1.75, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />
        <text x={340} y={STAGE_CY - 12} textAnchor="middle" style={{ ...labelStyle, fill: "var(--accent-ink)" }}>
          served
        </text>
      </svg>
    </Box>
  );
}
