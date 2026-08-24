import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";

// Jagged noise, feeding into the model gate.
const NOISE_PATH = "M 20 130 L 45 80 L 70 150 L 95 70 L 120 140 L 150 105";
// Clean resolved signal, emerging from the gate, rising left to right.
const SIGNAL_PATH = "M 250 105 L 380 45";

// Model gate: a rectangle the noise passes through, with internal rungs
// so it reads as "something operates on this" rather than a divider.
const GATE_X = 165;
const GATE_Y = 65;
const GATE_W = 70;
const GATE_H = 80;
const GATE_CX = GATE_X + GATE_W / 2;
const GATE_CY = GATE_Y + GATE_H / 2;
const GATE_RUNGS = [0.25, 0.5, 0.75].map((t) => GATE_Y + GATE_H * t);

export function SignalDiagram() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.2 });
  const show = reduced === true || inView;

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
        aria-label="Noise, model, signal. A jagged noisy line enters a processing gate and a clean rising signal line emerges from it."
        style={{ display: "block", maxHeight: 320 }}
      >
        {/* Noise: raw, jagged input */}
        <motion.path
          d={NOISE_PATH}
          fill="none"
          stroke={NOIR.navyField}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? false : { opacity: 0 }}
          animate={show ? { opacity: 1 } : false}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        <text x={20} y={155} fontFamily="monospace" fontSize={9} fill={NOIR.navyField} opacity={0.7}>
          noise
        </text>

        {/* Bridge from noise into the gate */}
        <motion.line
          x1={150}
          y1={105}
          x2={GATE_X}
          y2={GATE_CY}
          stroke={NOIR.navyField}
          strokeWidth={1.5}
          initial={reduced ? false : { opacity: 0 }}
          animate={show ? { opacity: 1 } : false}
          transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
        />

        {/* Model: the gate that operates on the noise */}
        <motion.g
          initial={reduced ? false : { opacity: 0, scale: 0.85 }}
          animate={show ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        >
          <rect x={GATE_X} y={GATE_Y} width={GATE_W} height={GATE_H} fill="none" stroke={NOIR.goldDark} strokeWidth={1.5} />
          {GATE_RUNGS.map((y) => (
            <line key={y} x1={GATE_X + 10} y1={y} x2={GATE_X + GATE_W - 10} y2={y} stroke={NOIR.goldDark} strokeWidth={1.5} opacity={0.45} />
          ))}
          <circle cx={GATE_CX} cy={GATE_CY} r={4} fill={NOIR.goldDark} />
        </motion.g>
        <text x={GATE_CX} y={GATE_Y + GATE_H + 16} textAnchor="middle" fontFamily="monospace" fontSize={9} fill={NOIR.goldDark} opacity={0.85}>
          model
        </text>

        {/* Bridge from the gate into the signal */}
        <motion.line
          x1={GATE_X + GATE_W}
          y1={GATE_CY}
          x2={250}
          y2={105}
          stroke={NOIR.goldDark}
          strokeWidth={1.5}
          initial={reduced ? false : { opacity: 0 }}
          animate={show ? { opacity: 0.6 } : false}
          transition={{ duration: 0.3, delay: 0.65, ease: "easeOut" }}
        />

        {/* Signal: the clean, resolved output */}
        <motion.path
          d={SIGNAL_PATH}
          fill="none"
          stroke={NOIR.goldDark}
          strokeWidth={3}
          strokeLinecap="round"
          initial={reduced ? false : { opacity: 0, scaleX: 0 }}
          animate={show ? { opacity: 1, scaleX: 1 } : false}
          transition={{ duration: 0.5, delay: 0.75, ease: "easeInOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }}
        />
        <text x={315} y={35} fontFamily="monospace" fontSize={9} fill={NOIR.goldDark}>
          signal
        </text>
      </svg>
    </Box>
  );
}
