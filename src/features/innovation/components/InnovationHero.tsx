import { useRef } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CodeIcon from "@mui/icons-material/Code";
import ScienceIcon from "@mui/icons-material/Science";
import MemoryIcon from "@mui/icons-material/Memory";
import { motion } from "motion/react";

import { MONO } from "@/shared/theme/theme";
import { Reveal } from "@/shared/components/Reveal";
import { NAV_ANCHORS, useNavbarAnchor } from "@/shared/components/NavbarContext";

export function InnovationHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroAnchorRef = useNavbarAnchor(NAV_ANCHORS.ABOUT_HERO, { dark: true });

  return (
    <Box
      ref={heroAnchorRef}
      sx={{
        position: "relative",
        height: { xs: "80vh", md: "85vh" },
        width: "100%",
        bgcolor: "#06183B",
        color: "common.white",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Background Loop Video */}
      <Box
        component="video"
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        src="/videos/daily-life.mp4"
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "brightness(0.5) contrast(1.1)",
        }}
      />

      {/* Dark Radial Gradient Overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 60% 40%, rgba(6, 24, 59, 0.4) 0%, rgba(6, 24, 59, 0.95) 80%), linear-gradient(180deg, rgba(6, 24, 59, 0.6) 0%, #06183B 100%)",
        }}
      />

      {/* Hero Content */}
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, px: { xs: 3, md: 8 } }}>
        <Stack spacing={3.5} sx={{ maxWidth: 880 }}>
          <Reveal>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
              <ScienceIcon sx={{ color: "#FFC72C", fontSize: "1.3rem" }} />
              <Typography
                variant="overline"
                sx={{
                  color: "#FFC72C",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  fontSize: "0.85rem",
                  fontFamily: MONO,
                }}
              >
                EMPLOYEE PET PROJECTS // INNOVATION LAB
              </Typography>
            </Box>
          </Reveal>

          <Reveal delay={0.1}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 900,
                fontSize: { xs: "2.4rem", sm: "3.5rem", md: "4.5rem" },
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                color: "common.white",
              }}
            >
              Where Phitopolis Engineers Build Next-Gen Experiments.
            </Typography>
          </Reveal>

          <Reveal delay={0.2}>
            <Typography
              variant="subtitle1"
              sx={{
                color: "rgba(255, 255, 255, 0.85)",
                fontSize: { xs: "1.1rem", md: "1.3rem" },
                lineHeight: 1.6,
                fontWeight: 400,
                maxWidth: 760,
              }}
            >
              Discover open-source tools, machine learning signal prototypes, and high-performance C++ / Rust kernels created by our software engineers, quantitative researchers, and graduate fellows during their R&D pet project time.
            </Typography>
          </Reveal>

          {/* Hero Feature Badges */}
          <Reveal delay={0.3}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ pt: 1 }}>
              <Chip
                icon={<CodeIcon sx={{ color: "#FFC72C !important" }} />}
                label="100% ENGINEER INITIATED"
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  color: "common.white",
                  fontFamily: MONO,
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  border: "1px solid rgba(255, 199, 44, 0.3)",
                  py: 2,
                }}
              />
              <Chip
                icon={<MemoryIcon sx={{ color: "#00E676 !important" }} />}
                label="6 LIVE R&D EXPERIMENTS"
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  color: "common.white",
                  fontFamily: MONO,
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  border: "1px solid rgba(0, 230, 118, 0.3)",
                  py: 2,
                }}
              />
              <Chip
                icon={<AutoAwesomeIcon sx={{ color: "#FFC72C !important" }} />}
                label="C++ / RUST / PYTHON / AI"
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  color: "common.white",
                  fontFamily: MONO,
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  py: 2,
                }}
              />
            </Stack>
          </Reveal>
        </Stack>

        {/* Floating Scroll Cue */}
        <Box
          sx={{
            position: "absolute",
            bottom: { xs: -60, md: -80 },
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1px solid rgba(255, 199, 44, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFC72C",
                bgcolor: "rgba(255, 199, 44, 0.1)",
              }}
            >
              <ArrowDownwardIcon fontSize="small" />
            </Box>
          </motion.div>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.72rem",
              letterSpacing: "0.18em",
              color: "#FFC72C",
              fontWeight: 800,
            }}
          >
            EXPLORE PET PROJECTS
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
