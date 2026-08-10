import Box from "@mui/material/Box";
import { motion } from "motion/react";

import { usePreloaderReady } from "@/shared/motion";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";

/** The About hero background, featuring a subtle ambient lighting glow without curtain wipes. */
export function BackgroundReveal() {
  const ready = usePreloaderReady();

  return (
    <Box
      className="background-reveal-container"
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Background Atmospheric Base */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : { opacity: 0 }}
        transition={{
          duration: 1.2,
          ease: EASE_OUT_EXPO,
        }}
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 80% 80% at 50% -20%, rgba(10, 42, 102, 0.45), rgba(5, 15, 38, 0.95))",
          zIndex: 1,
        }}
      />

      {/* Decorative Gold Radial Mesh Glow */}
      <Box
        sx={{
          position: "absolute",
          top: "-15%",
          right: "-10%",
          width: "60vw",
          height: "60vw",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(var(--accent-rgb), 0.08) 0%, rgba(var(--accent-rgb), 0) 70%)",
          filter: "blur(60px)",
          zIndex: 1.2,
        }}
      />
    </Box>
  );
}