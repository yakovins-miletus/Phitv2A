import { NOIR } from "@/shared/theme/palette";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { motion } from "motion/react";

import { MONO } from "@/shared/theme/theme";
import { Reveal } from "@/shared/components/Reveal";
import { NAV_ANCHORS, useNavbarAnchor } from "@/shared/components/NavbarContext";
import { BACKGROUND_LOOP, useBackgroundVideo } from "@/shared/components/useBackgroundVideo";

export function BlogVideoHero() {
  const heroAnchorRef = useNavbarAnchor(NAV_ANCHORS.ABOUT_HERO, { dark: true });
  const { containerRef, videoRef, shouldLoad, posterOnly } = useBackgroundVideo();

  return (
    <Box
      ref={heroAnchorRef}
      sx={{
        position: "relative",
        height: { xs: "75vh", md: "85vh" },
        width: "100%",
        bgcolor: NOIR.navyDeep,
        color: "common.white",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Background loop.
          This used to be `<video autoPlay src="/videos/daily-life.mp4">` with no gate —
          a 62.8 MB, 251-second file behind a brightness filter. It is now a 787 KB
          12-second loop that only loads when the hero is near the viewport, and never
          loads at all under reduced motion or on a low-power device (poster instead). */}
      <Box
        ref={containerRef}
        aria-hidden
        sx={{ position: "absolute", inset: 0, filter: "brightness(0.55) contrast(1.1)" }}
      >
        <Box
          component="video"
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={BACKGROUND_LOOP.poster}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        >
          {!posterOnly && shouldLoad && (
            <>
              <source src={BACKGROUND_LOOP.webm} type="video/webm" />
              <source src={BACKGROUND_LOOP.mp4} type="video/mp4" />
            </>
          )}
        </Box>
      </Box>

      {/* Dark Radial Gradient Overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 30%, rgba(6, 24, 59, 0.4) 0%, rgba(6, 24, 59, 0.92) 80%), linear-gradient(180deg, rgba(6, 24, 59, 0.6) 0%, #06183B 100%)",
        }}
      />

      {/* Hero Content */}
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, px: { xs: 3, md: 8 } }}>
        <Stack spacing={3} sx={{ maxWidth: 840 }}>
          <Reveal>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
              <AutoAwesomeIcon sx={{ color: "#FFC72C", fontSize: "1.2rem" }} />
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
                INSIGHTS & ENGINEERING LOGS
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
              Direct Logs from the Phitopolis R&D Team.
            </Typography>
          </Reveal>

          <Reveal delay={0.2}>
            <Typography
              variant="subtitle1"
              sx={{
                color: "rgba(255, 255, 255, 0.82)",
                fontSize: { xs: "1.1rem", md: "1.3rem" },
                lineHeight: 1.6,
                fontWeight: 400,
                maxWidth: 720,
              }}
            >
              What we shipped, benchmarked, and broke across microsecond C++ engines, machine learning signal pipelines, and cloud data architecture.
            </Typography>
          </Reveal>
        </Stack>

        {/* Floating Scroll Down Cue */}
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
            EXPLORE ARTICLES
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
