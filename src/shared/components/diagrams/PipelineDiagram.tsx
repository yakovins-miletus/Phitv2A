import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";

// Four hairline inputs converging into a single gold output line.
const INPUT_LINES = [
  "M 20 40 C 140 40 160 100 200 100",
  "M 20 80 C 140 80 160 100 200 100",
  "M 20 120 C 140 120 160 100 200 100",
  "M 20 160 C 140 160 160 100 200 100",
];

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
        p: { xs: 1, md: 2 },
      }}
    >
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        role="img"
        aria-label="Cloud-native data pipeline. Several separate data feeds converge into a single processed stream."
        style={{ display: "block", maxHeight: 320 }}
      >
        {/* Four converging input feeds */}
        {INPUT_LINES.map((path, idx) => (
          <motion.path
            key={`input-${String(idx)}`}
            d={path}
            fill="none"
            stroke={NOIR.navyField}
            strokeWidth={1.5}
            strokeLinecap="round"
            initial={reduced ? false : { opacity: 0 }}
            animate={show ? { opacity: 1 } : false}
            transition={{ duration: 0.3, delay: idx * 0.06, ease: "easeOut" }}
          />
        ))}

        {/* Single converged accent line */}
        <motion.path
          d="M 200 100 L 380 100"
          fill="none"
          stroke={NOIR.goldDark}
          strokeWidth={3}
          strokeLinecap="round"
          initial={reduced ? false : { opacity: 0, scaleX: 0 }}
          animate={show ? { opacity: 1, scaleX: 1 } : false}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }}
        />

        {/* Join marker */}
        <motion.rect
          x={196}
          y={96}
          width={8}
          height={8}
          rx={2}
          fill={NOIR.goldDark}
          initial={reduced ? false : { opacity: 0, scale: 0 }}
          animate={show ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />
      </svg>
    </Box>
  );
}
