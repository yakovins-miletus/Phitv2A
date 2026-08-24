import Box from "@mui/material/Box";
import { motion } from "motion/react";

import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";

export function HeroGallery() {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 880,
        mx: "auto",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(12, 1fr)" },
        gridTemplateRows: { xs: "auto auto auto", sm: "repeat(2, 1fr)" },
        gap: { xs: 3, sm: 3, md: 4 },
        height: { xs: "auto", sm: 520, md: 600 },
        alignItems: "stretch",
      }}
    >
      {/* ── Image 1: Primary Focal Centerpiece ── */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.3, ease: EASE_OUT_EXPO, delay: 0.1 }}
        whileHover={{ scale: 1.02 }}
        sx={{
          gridColumn: { xs: "1 / -1", sm: "1 / 8" },
          gridRow: { xs: "auto", sm: "1 / 3" },
          position: "relative",
          borderRadius: "24px",
          overflow: "hidden",
          border: `2.5px solid ${NOIR.gold}`,
          minHeight: { xs: 320, sm: "auto" },
          transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <Box
          component="img"
          decoding="async"
          src="/images/AboutPage1.webp"
          alt="Phitopolis Headquarters & Engineers"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        {/* Subtle Dark Gradient Overlay for bottom text legibility */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(9, 18, 38, 0.88) 0%, rgba(9, 18, 38, 0.1) 60%)",
            pointerEvents: "none",
          }}
        />
      </Box>

      {/* ── Image 2: Secondary Card (Top Right) ── */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: EASE_OUT_EXPO, delay: 0.2 }}
        whileHover={{ scale: 1.03 }}
        sx={{
          gridColumn: { xs: "1 / -1", sm: "8 / 13" },
          gridRow: { xs: "auto", sm: "1 / 2" },
          position: "relative",
          borderRadius: "20px",
          overflow: "hidden",
          border: "1.5px solid rgba(255, 255, 255, 0.18)",
          minHeight: { xs: 200, sm: "auto" },
          transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <Box
          component="img"
          decoding="async"
          src="/images/AboutPageHero2.webp"
          alt="Phitopolis Engineering Team Collaboration"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            filter: "brightness(0.95) contrast(1.05)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(9, 18, 38, 0.85) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
      </Box>

      {/* ── Image 3: Tertiary Card (Bottom Right) ── */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: EASE_OUT_EXPO, delay: 0.3 }}
        whileHover={{ scale: 1.03 }}
        sx={{
          gridColumn: { xs: "1 / -1", sm: "8 / 13" },
          gridRow: { xs: "auto", sm: "2 / 3" },
          position: "relative",
          borderRadius: "20px",
          overflow: "hidden",
          border: "1.5px solid rgba(255, 255, 255, 0.18)",
          minHeight: { xs: 200, sm: "auto" },
          transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <Box
          component="img"
          decoding="async"
          src="/images/AteneoQR.webp"
          alt="Academic Engagement & Presentation"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(9, 18, 38, 0.85) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
      </Box>
    </Box>
  );
}
