import Box from "@mui/material/Box";
import { motion } from "motion/react";

import { usePreloaderReady } from "@/shared/motion";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";

/** The About hero background, featuring the Manila city dusk skyline image with ambient golden lighting glow. */
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
      {/* Background Image Layer */}
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
        transition={{
          duration: 1.4,
          ease: EASE_OUT_EXPO,
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
        }}
      >
        <Box
          component="img"
          src="/images/about-hero-bg.webp"
          alt="Manila Skyline Dusk Hero Background"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 40%",
          }}
        />

        {/* Left Dark Gradient Overlay for optimal text legibility - Fades out earlier in the center */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, rgba(9, 18, 38, 0.94) 0%, rgba(9, 18, 38, 0.72) 22%, rgba(9, 18, 38, 0.22) 42%, rgba(9, 18, 38, 0.05) 65%, transparent 85%)",
            pointerEvents: "none",
          }}
        />

        {/* Vertical Vignette Overlays for smooth top/bottom integration */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(9, 18, 38, 0.5) 0%, transparent 25%, transparent 75%, rgba(9, 18, 38, 0.88) 100%)",
            pointerEvents: "none",
          }}
        />
      </motion.div>
    </Box>
  );
}