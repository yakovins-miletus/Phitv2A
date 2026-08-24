import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";

const CX = 200;
const CY = 100;
const R = 70;

// Three shift ticks at 0/120/240 degrees
const TICKS = [0, 120, 240].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  const x1 = CX + Math.cos(rad) * (R - 8);
  const y1 = CY + Math.sin(rad) * (R - 8);
  const x2 = CX + Math.cos(rad) * (R + 8);
  const y2 = CY + Math.sin(rad) * (R + 8);
  return { deg, x1, y1, x2, y2 };
});

export function FollowTheSunDiagram() {
  const reduced = useReducedMotion() === true;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.2 });
  const show = reduced || inView;

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
        aria-label="Follow-the-sun coverage. Three shift rotations around a 24-hour dial, handing off without a gap."
        style={{ display: "block", maxHeight: 320 }}
      >
        {/* Base dial */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={NOIR.navyField} strokeWidth={1.5} />

        {/* Shift ticks */}
        {TICKS.map((t) => (
          <line
            key={t.deg}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={NOIR.navyField}
            strokeWidth={1.5}
          />
        ))}

        {/* Gold sweep arc, comes to rest */}
        <motion.g
          initial={reduced ? { rotate: 270, opacity: 1 } : { rotate: -90, opacity: 0 }}
          animate={show ? { rotate: 270, opacity: 1 } : {}}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        >
          <path
            d={`M ${CX + R} ${CY} A ${R} ${R} 0 0 1 ${CX} ${CY - R}`}
            fill="none"
            stroke={NOIR.goldDark}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </motion.g>
      </svg>
    </Box>
  );
}
