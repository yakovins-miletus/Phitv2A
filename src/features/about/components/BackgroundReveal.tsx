import Box from "@mui/material/Box";
import { motion } from "motion/react";

import { usePreloaderReady } from "@/shared/motion";
import { EASE_IN_OUT_QUART, EASE_OUT_EXPO } from "@/shared/motion/easing";

/** The About hero's curtain reveal, gated on the preloader having finished.
 *  A page-local cousin of AppShell's entrance-phase machinery. */
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
      {/* Background Image */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={ready ? { scale: 1, opacity: 1 } : { scale: 1.1, opacity: 0 }}
        transition={{
          duration: 1.8,
          ease: EASE_OUT_EXPO, // easeOutExpo
          delay: 0.1,
        }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/images/AboutPageHero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 1,
        }}
      />

      {/* White Curtain (reveals first) */}
      <motion.div
        initial={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
        animate={ready ? { clipPath: "polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)" } : {}}
        transition={{
          duration: 1.6,
          ease: EASE_IN_OUT_QUART, // Custom cubic-bezier for curtain reveal
          delay: 0.1,
        }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#FFFFFF", // Default background color instead of primary
          zIndex: 4,
        }}
      />

      {/* Gold Curtain (reveals second, creating a trailing border effect) */}
      <motion.div
        initial={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
        animate={ready ? { clipPath: "polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)" } : {}}
        transition={{
          duration: 1.6,
          ease: EASE_IN_OUT_QUART,
          delay: 0.22, // Lagged behind Navy
        }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#FFC72C", // Phitopolis Gold
          zIndex: 3,
        }}
      />

      {/* Static Overlay for typography legibility (dark navy for white text contrast) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(10, 42, 102, 0.8) 0%, rgba(10, 42, 102, 0.55) 50%, rgba(10, 42, 102, 0.3) 100%)",
          zIndex: 1.5,
        }}
      />
    </Box>
  );
}