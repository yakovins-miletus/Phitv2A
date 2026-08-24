import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";

// Jagged noise signal (left half)
const NOISE_PATH = "M 20 130 L 55 80 L 90 150 L 125 70 L 160 140 L 190 110";

// Clean resolved signal (right half), rising left to right
const SIGNAL_PATH = "M 210 110 L 380 40";

export function SignalDiagram() {
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
        p: { xs: 1, md: 2 },
      }}
    >
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        role="img"
        aria-label="Noise to alpha. Mathematical models extract trading signals from noisy market data."
        style={{ display: "block", maxHeight: 320 }}
      >
        <motion.path
          d={NOISE_PATH}
          fill="none"
          stroke={NOIR.navyField}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? false : { opacity: 0 }}
          animate={show ? { opacity: 1 } : false}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        <motion.path
          d={SIGNAL_PATH}
          fill="none"
          stroke={NOIR.goldDark}
          strokeWidth={3}
          strokeLinecap="round"
          initial={reduced ? false : { opacity: 0, scaleX: 0 }}
          animate={show ? { opacity: 1, scaleX: 1 } : false}
          transition={{ duration: 0.6, delay: 0.35, ease: "easeInOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }}
        />
      </svg>
    </Box>
  );
}
