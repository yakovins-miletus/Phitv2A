import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";

// Three source feeds converging into the first pipeline stage.
const SOURCE_Y = [50, 100, 150];
const STAGE_1_X0 = 130;
const STAGE_1_X1 = 175;
const STAGE_2_X0 = 220;
const STAGE_2_X1 = 265;
const STAGE_Y0 = 80;
const STAGE_Y1 = 120;
const STAGE_CY = (STAGE_Y0 + STAGE_Y1) / 2;

const SOURCE_LINES = SOURCE_Y.map((y) => `M 20 ${y} C 80 ${y} 100 ${STAGE_CY} ${STAGE_1_X0} ${STAGE_CY}`);

export function PipelineDiagram() {
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
        aria-label="Sources, pipeline stages, served output. Three separate feeds converge and pass through two processing stages before emerging as a single served line."
        style={{ display: "block", maxHeight: 320 }}
      >
        {/* Sources: three separate feeds */}
        {SOURCE_LINES.map((path, idx) => (
          <motion.path
            key={`source-${String(idx)}`}
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
        <text x={20} y={40} fontFamily="monospace" fontSize={9} fill={NOIR.navyField} opacity={0.7}>
          sources
        </text>

        {/* Stage 1: first processing step */}
        <motion.rect
          x={STAGE_1_X0}
          y={STAGE_Y0}
          width={STAGE_1_X1 - STAGE_1_X0}
          height={STAGE_Y1 - STAGE_Y0}
          fill="none"
          stroke={NOIR.navyField}
          strokeWidth={1.5}
          initial={reduced ? false : { opacity: 0, scale: 0.85 }}
          animate={show ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />

        {/* Link between the two stages */}
        <motion.line
          x1={STAGE_1_X1}
          y1={STAGE_CY}
          x2={STAGE_2_X0}
          y2={STAGE_CY}
          stroke={NOIR.navyField}
          strokeWidth={1.5}
          initial={reduced ? false : { opacity: 0 }}
          animate={show ? { opacity: 0.6 } : false}
          transition={{ duration: 0.25, delay: 0.5, ease: "easeOut" }}
        />

        {/* Stage 2: second processing step, accented */}
        <motion.rect
          x={STAGE_2_X0}
          y={STAGE_Y0}
          width={STAGE_2_X1 - STAGE_2_X0}
          height={STAGE_Y1 - STAGE_Y0}
          fill="none"
          stroke={NOIR.goldDark}
          strokeWidth={1.5}
          initial={reduced ? false : { opacity: 0, scale: 0.85 }}
          animate={show ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.3, delay: 0.58, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />
        <text x={(STAGE_1_X0 + STAGE_2_X1) / 2} y={STAGE_Y1 + 20} textAnchor="middle" fontFamily="monospace" fontSize={9} fill={NOIR.goldDark} opacity={0.85}>
          pipeline
        </text>

        {/* Served output */}
        <motion.line
          x1={STAGE_2_X1}
          y1={STAGE_CY}
          x2={380}
          y2={STAGE_CY}
          stroke={NOIR.goldDark}
          strokeWidth={3}
          strokeLinecap="round"
          initial={reduced ? false : { opacity: 0, scaleX: 0 }}
          animate={show ? { opacity: 1, scaleX: 1 } : false}
          transition={{ duration: 0.4, delay: 0.85, ease: "easeOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }}
        />
        <text x={340} y={STAGE_CY - 12} textAnchor="middle" fontFamily="monospace" fontSize={9} fill={NOIR.goldDark}>
          served
        </text>
      </svg>
    </Box>
  );
}
