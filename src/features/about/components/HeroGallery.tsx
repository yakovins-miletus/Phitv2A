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
        position: "relative",
        width: "100%",
        maxWidth: 620,
        height: { xs: 440, sm: 500, md: 540 },
        mx: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* ── Image 2: Secondary Background Card (Top-Left) ── */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -8 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ duration: 1.2, ease: EASE_OUT_EXPO, delay: 0.15 }}
        whileHover={{ scale: 1.04, rotate: -2, zIndex: 4 }}
        style={{
          position: "absolute",
          top: "4%",
          left: "4%",
          width: "55%",
          maxWidth: 320,
          aspectRatio: "4/3",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 16px 36px rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(12px)",
            bgcolor: "rgba(10, 42, 102, 0.4)",
          }}
        >
          <Box
            component="img"
            src="/images/AboutPageHero2.JPG"
            alt="Phitopolis Engineering Team Collaboration"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.92) contrast(1.05)",
            }}
          />
          {/* Subtle gradient overlay & Pill */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(10, 42, 102, 0.7) 0%, transparent 60%)",
            }}
          />
          <Chip
            icon={<GroupsIcon sx={{ fontSize: "0.95rem !important", color: "#FFC72C !important" }} />}
            label="COLLABORATION"
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              bgcolor: "rgba(10, 42, 102, 0.85)",
              color: "common.white",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 199, 44, 0.3)",
              fontFamily: MONO,
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          />
        </Box>
      </motion.div>

      {/* ── Image 1: Primary Focal Centerpiece (Center Elevated) ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.3, ease: EASE_OUT_EXPO, delay: 0.3 }}
        whileHover={{ scale: 1.03, zIndex: 5 }}
        style={{
          position: "relative",
          width: "75%",
          maxWidth: 420,
          aspectRatio: "16/11",
          zIndex: 3,
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: 5,
            overflow: "hidden",
            position: "relative",
            border: "2px solid rgba(255, 199, 44, 0.75)",
            boxShadow: "0 24px 50px rgba(0, 0, 0, 0.55), 0 0 30px rgba(255, 199, 44, 0.2)",
            bgcolor: "rgba(10, 42, 102, 0.6)",
          }}
        >
          <Box
            component="img"
            src="/images/AboutPage1.JPG"
            alt="Phitopolis Headquarters & Engineers"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.5s ease",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(5, 15, 38, 0.85) 0%, rgba(5, 15, 38, 0.1) 60%)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              left: 16,
              right: 16,
              display: "flex",
              alignItems: "center",
              justify: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <VerifiedIcon sx={{ color: "#FFC72C", fontSize: "1.1rem" }} />
              <Typography
                sx={{
                  color: "common.white",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  fontFamily: MONO,
                  letterSpacing: "0.08em",
                  textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                }}
              >
                PHITOPOLIS R&D HUB
              </Typography>
            </Box>
            <Chip
              label="PRIMARY"
              size="small"
              sx={{
                bgcolor: "#FFC72C",
                color: "#0A2A66",
                fontFamily: MONO,
                fontSize: "0.65rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
                height: 22,
              }}
            />
          </Box>
        </Box>
      </motion.div>

      {/* ── Image 3: Tertiary Overlay Card (Bottom-Right) ── */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotate: 6 }}
        animate={{ opacity: 1, y: 0, rotate: 3 }}
        transition={{ duration: 1.2, ease: EASE_OUT_EXPO, delay: 0.45 }}
        whileHover={{ scale: 1.05, rotate: 1, zIndex: 6 }}
        style={{
          position: "absolute",
          bottom: "6%",
          right: "2%",
          width: "48%",
          maxWidth: 270,
          aspectRatio: "4/3",
          zIndex: 4,
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
            border: "1.5px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(12px)",
            bgcolor: "rgba(10, 42, 102, 0.5)",
          }}
        >
          <Box
            component="img"
            src="/images/AteneoQR.jpg"
            alt="Academic Partnership & Ateneo Engagement"
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
            }}
          />
          <Chip
            icon={<SchoolIcon sx={{ fontSize: "0.9rem !important", color: "#FFC72C !important" }} />}
            label="ACADEMIC PARTNERSHIP"
            size="small"
            sx={{
              position: "absolute",
              bottom: 12,
              left: 12,
              bgcolor: "rgba(10, 42, 102, 0.9)",
              color: "common.white",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              fontFamily: MONO,
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          />
        </Box>
      </motion.div>
    </Box>
  );
}
