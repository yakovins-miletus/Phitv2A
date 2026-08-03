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
        maxWidth: 820,
        height: { xs: 520, sm: 580, md: 640 },
        mx: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* ── Image 2: Secondary Background Card (Spread Far Top-Left) ── */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -12 }}
        animate={{ opacity: 1, y: 0, rotate: -8 }}
        transition={{ duration: 1.2, ease: EASE_OUT_EXPO, delay: 0.15 }}
        whileHover={{ scale: 1.04, rotate: -4, zIndex: 4 }}
        style={{
          position: "absolute",
          top: "-4%",
          left: "-12%",
          width: "60%",
          maxWidth: 390,
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
            border: "1px solid rgba(255, 255, 255, 0.25)",
            boxShadow: "0 20px 44px rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(12px)",
            bgcolor: "rgba(10, 42, 102, 0.4)",
          }}
        >
          <Box
            component="img" decoding="async"
            src="/images/AboutPageHero2.JPG"
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
            }}
          />
          <Chip
            icon={<GroupsIcon sx={{ fontSize: "0.95rem !important", color: "#FFC72C !important" }} />}
            label="COLLABORATION"
            size="small"
            sx={{
              position: "absolute",
              top: 14,
              left: 14,
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
          width: "82%",
          maxWidth: 490,
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
            border: "2.5px solid rgba(255, 199, 44, 0.8)",
            boxShadow: "0 28px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(255, 199, 44, 0.25)",
            bgcolor: "rgba(10, 42, 102, 0.6)",
          }}
        >
          <Box
            component="img" decoding="async"
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
              bottom: 18,
              left: 18,
              right: 18,
              display: "flex",
              alignItems: "center",
              justify: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <VerifiedIcon sx={{ color: "#FFC72C", fontSize: "1.2rem" }} />
              <Typography
                sx={{
                  color: "common.white",
                  fontSize: "0.85rem",
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
      </motion.div>

      {/* ── Image 3: Tertiary Overlay Card (Spread Far Bottom-Right) ── */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotate: 10 }}
        animate={{ opacity: 1, y: 0, rotate: 7 }}
        transition={{ duration: 1.2, ease: EASE_OUT_EXPO, delay: 0.45 }}
        whileHover={{ scale: 1.05, rotate: 3, zIndex: 6 }}
        style={{
          position: "absolute",
          bottom: "-4%",
          right: "-10%",
          width: "55%",
          maxWidth: 350,
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
            component="img" decoding="async"
            src="/images/AteneoQR.jpg"
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
            }}
          />
          <Chip
            icon={<SchoolIcon sx={{ fontSize: "0.9rem !important", color: "#FFC72C !important" }} />}
            label="ACADEMIC ENGAGEMENT"
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
