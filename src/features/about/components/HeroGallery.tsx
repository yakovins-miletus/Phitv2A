import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import VerifiedIcon from "@mui/icons-material/Verified";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import { motion } from "motion/react";

import { MONO } from "@/shared/theme/theme";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";

export function HeroGallery() {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 860,
        mx: "auto",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(12, 1fr)" },
        gridTemplateRows: { xs: "auto auto auto", sm: "repeat(2, 1fr)" },
        gap: { xs: 3, sm: 3, md: 4 },
        height: { xs: "auto", sm: 540, md: 640 },
        alignItems: "stretch",
      }}
    >
      {/* ── Image 1: Primary Focal Centerpiece (Large Left) ── */}
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
          borderRadius: 5,
          overflow: "hidden",
          border: "2.5px solid rgba(var(--accent-rgb), 0.8)",
          boxShadow: "0 28px 60px rgba(0, 0, 0, 0.4), 0 0 25px var(--accent-15)",
          bgcolor: "rgba(10, 42, 102, 0.6)",
          minHeight: { xs: 300, sm: "auto" },
          transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <Box
          component="img" decoding="async"
          src="/images/AboutPage1.webp"
          alt="Phitopolis Headquarters & Engineers"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(5, 15, 38, 0.85) 0%, rgba(5, 15, 38, 0.1) 60%)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: 24,
            left: 24,
            right: 24,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <VerifiedIcon sx={{ color: "var(--accent-fg)", fontSize: "1.4rem" }} />
            <Typography
              sx={{
                color: "common.white",
                fontSize: "1rem",
                fontWeight: 700,
                fontFamily: MONO,
                letterSpacing: "0.08em",
                textShadow: "0 2px 4px rgba(0,0,0,0.8)",
              }}
            >
              PHITOPOLIS R&D FIRM
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Image 2: Secondary Background Card (Top Right) ── */}
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
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid rgba(10, 42, 102, 0.18)",
          boxShadow: "0 12px 36px rgba(10, 42, 102, 0.15)",
          bgcolor: "rgba(244, 247, 252, 0.85)",
          minHeight: { xs: 200, sm: "auto" },
          transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <Box
          component="img" decoding="async"
          src="/images/AboutPageHero2.webp"
          alt="Phitopolis Engineering Team Collaboration"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.92) contrast(1.05)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(10, 42, 102, 0.7) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <Chip
          icon={<GroupsIcon sx={{ fontSize: "1rem !important", color: "var(--accent-fg) !important" }} />}
          label="COLLABORATION"
          size="small"
          sx={{
            position: "absolute",
            bottom: 16,
            left: 16,
            bgcolor: "rgba(10, 42, 102, 0.85)",
            color: "common.white",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(var(--accent-rgb), 0.3)",
            fontFamily: MONO,
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            py: 1,
          }}
        />
      </Box>

      {/* ── Image 3: Tertiary Overlay Card (Bottom Right) ── */}
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
          borderRadius: 4,
          overflow: "hidden",
          border: "1.5px solid rgba(10, 42, 102, 0.25)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
          bgcolor: "rgba(10, 42, 102, 0.5)",
          minHeight: { xs: 200, sm: "auto" },
          transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <Box
          component="img" decoding="async"
          src="/images/AteneoQR.webp"
          alt="Academic Engagement & Ateneo"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(10, 42, 102, 0.8) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <Chip
          icon={<SchoolIcon sx={{ fontSize: "1rem !important", color: "var(--accent-fg) !important" }} />}
          label="ACADEMIC ENGAGEMENT"
          size="small"
          sx={{
            position: "absolute",
            bottom: 16,
            left: 16,
            bgcolor: "rgba(10, 42, 102, 0.9)",
            color: "common.white",
            border: "1px solid rgba(10, 42, 102, 0.2)",
            fontFamily: MONO,
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            py: 1,
          }}
        />
      </Box>
    </Box>
  );
}
