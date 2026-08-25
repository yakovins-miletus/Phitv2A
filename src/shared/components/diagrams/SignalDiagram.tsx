import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";
import { MONO, TYPE_SCALE, TRACKING } from "@/shared/theme/theme";

/**
 * Deterministic pseudo-random generator (mulberry32) — the noise trace below
 * must look like sampled series data, not a hand-drawn zigzag, but it also
 * has to render identically on every pass (SSR/CSR parity, snapshot tests,
 * re-theme). `Math.random()` would satisfy neither. Fixed seed, pure
 * function of `i`, computed once at module scope.
 */
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Noise: a mean-reverting random walk sampled at many points, so it reads as
// real market-data density (many small irregular steps) rather than a six
// point zigzag. Mean reversion keeps it inside the lane instead of drifting
// off into the gate at an arbitrary height.
// ---------------------------------------------------------------------------
const NOISE_X0 = 24;
const NOISE_X1 = 148;
const NOISE_SAMPLES = 46;
const NOISE_BASELINE = 108;
const NOISE_BAND = 32;

function buildNoisePath(): string {
  const rand = mulberry32(0x51a5_bea7);
  let y = NOISE_BASELINE;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= NOISE_SAMPLES; i += 1) {
    const x = NOISE_X0 + (i / NOISE_SAMPLES) * (NOISE_X1 - NOISE_X0);
    y += (rand() - 0.5) * 20;
    y = NOISE_BASELINE + (y - NOISE_BASELINE) * 0.8; // pull back toward the lane
    y = Math.max(NOISE_BASELINE - NOISE_BAND, Math.min(NOISE_BASELINE + NOISE_BAND, y));
    pts.push([x, y]);
  }
  return pts.map(([x, py], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${py.toFixed(1)}`).join(" ");
}

const NOISE_PATH = buildNoisePath();
const NOISE_EXIT_Y = Number(NOISE_PATH.split(" ").slice(-1)[0]);

// ---------------------------------------------------------------------------
// Model gate: a windowed operation that narrows a wide, volatile distribution
// down to a stable one. Six bars, hand-set (not random — the shape itself is
// the point) so each is visibly closer to the centreline than the last.
// ---------------------------------------------------------------------------
const GATE_X = 172;
const GATE_Y = 62;
const GATE_W = 66;
const GATE_H = 86;
const GATE_CX = GATE_X + GATE_W / 2;
const GATE_CY = GATE_Y + GATE_H / 2;

const GATE_BAR_HEIGHTS = [0.92, 0.27, 0.68, 0.4, 0.56, 0.48] as const;
const GATE_BAR_GAP = GATE_W / GATE_BAR_HEIGHTS.length;

export function SignalDiagram() {
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
        aria-label="Noise, model, signal. A dense, irregular noise trace narrows through a windowed model gate — six bars converging toward a stable centre — and a single smooth signal line rises out of it."
        style={{ display: "block", maxHeight: 320 }}
      >
        {/* Noise: dense sampled trace, read first, left to right */}
        <motion.path
          d={NOISE_PATH}
          fill="none"
          stroke={NOIR.navyField}
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? false : { pathLength: 0, opacity: 0.85 }}
          animate={show ? { pathLength: 1, opacity: 0.85 } : false}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        <text x={NOISE_X0} y={NOISE_BASELINE - NOISE_BAND - 10} style={{ ...labelStyle, fill: NOIR.navyField, opacity: 0.65 }}>
          noise
        </text>

        {/* Bridge from noise into the gate */}
        <motion.line
          x1={NOISE_X1}
          y1={NOISE_EXIT_Y}
          x2={GATE_X}
          y2={GATE_CY}
          stroke={NOIR.navyField}
          strokeWidth={1.25}
          initial={reduced ? false : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.3, delay: 0.55, ease: "easeOut" }}
        />

        {/* Model gate: the window that narrows the distribution */}
        <motion.g
          initial={reduced ? false : { opacity: 0 }}
          animate={show ? { opacity: 1 } : false}
          transition={{ duration: 0.2, delay: 0.68 }}
        >
          <rect
            x={GATE_X}
            y={GATE_Y}
            width={GATE_W}
            height={GATE_H}
            fill="none"
            stroke={NOIR.navyField}
            strokeWidth={1.25}
            opacity={0.55}
          />
          {/* Centreline the bars converge toward — the "narrowing" target */}
          <line
            x1={GATE_X + 4}
            y1={GATE_CY}
            x2={GATE_X + GATE_W - 4}
            y2={GATE_CY}
            stroke={NOIR.navyField}
            strokeWidth={0.75}
            strokeDasharray="2 3"
            opacity={0.35}
          />
          {GATE_BAR_HEIGHTS.map((h, i) => {
            const barH = h * (GATE_H - 16);
            const barX = GATE_X + GATE_BAR_GAP * i + GATE_BAR_GAP * 0.5;
            const barW = GATE_BAR_GAP * 0.5;
            return (
              <motion.rect
                key={`bar-${String(i)}`}
                x={barX - barW / 2}
                width={barW}
                y={GATE_CY - barH / 2}
                height={barH}
                rx={1}
                fill={NOIR.navyField}
                opacity={0.32 + i * 0.09}
                initial={reduced ? false : { scaleY: 0 }}
                animate={show ? { scaleY: 1 } : false}
                transition={{ duration: 0.35, delay: 0.8 + i * 0.07, ease: "easeOut" }}
                style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              />
            );
          })}
        </motion.g>
        <text x={GATE_CX} y={GATE_Y + GATE_H + 18} textAnchor="middle" style={{ ...labelStyle, fill: NOIR.navyField, opacity: 0.65 }}>
          model
        </text>

        {/* Bridge from the gate into the resolved signal */}
        <motion.line
          x1={GATE_X + GATE_W}
          y1={GATE_CY}
          x2={252}
          y2={GATE_CY - 8}
          stroke={NOIR.navyField}
          strokeWidth={1.25}
          opacity={0.55}
          initial={reduced ? false : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.25, delay: 1.35, ease: "easeOut" }}
        />

        {/* Signal: the one element that carries meaning — gold, and gold alone */}
        <motion.path
          d="M 252 100 C 280 84 296 52 322 44 C 344 37 360 30 380 26"
          fill="none"
          stroke="var(--accent-ink)"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.5, delay: 1.55, ease: "easeInOut" }}
        />
        <motion.circle
          cx={380}
          cy={26}
          r={2.75}
          fill="var(--accent-ink)"
          initial={reduced ? false : { opacity: 0, scale: 0 }}
          animate={show ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.25, delay: 2.0, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />
        <text x={296} y={70} style={{ ...labelStyle, fill: "var(--accent-ink)" }}>
          signal
        </text>
      </svg>
    </Box>
  );
}
