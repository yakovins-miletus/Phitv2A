import { alpha } from "@mui/material/styles";
import { NOIR } from "@/shared/theme/palette";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CodeIcon from "@mui/icons-material/Code";
import ScienceIcon from "@mui/icons-material/Science";
import MemoryIcon from "@mui/icons-material/Memory";

import { MONO } from "@/shared/theme/theme";
import { Reveal } from "@/shared/components/Reveal";
import { NAV_ANCHORS, useNavbarAnchor } from "@/shared/components/NavbarContext";
import { BACKGROUND_LOOP, useBackgroundVideo } from "@/shared/components/useBackgroundVideo";

export function InnovationHero() {
  const heroAnchorRef = useNavbarAnchor(NAV_ANCHORS.INNOVATION_HERO, { dark: true });
  const { containerRef, videoRef, shouldLoad, posterOnly } = useBackgroundVideo();

  return (
    <Box
      ref={heroAnchorRef}
      sx={{
        position: "relative",
        height: { xs: "80vh", md: "85vh" },
        width: "100%",
        bgcolor: NOIR.navyDeep,
        color: "common.white",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Background loop — see BlogVideoHero: same 62.8 MB / 251s file, same ungated
          autoplay. Now a 787 KB 12-second loop, viewport-gated, poster-only under
          reduced motion or on a low-power device. */}
      <Box
        ref={containerRef}
        aria-hidden
        sx={{ position: "absolute", inset: 0, filter: "brightness(0.88) contrast(1.05)" }}
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

      {/* Reduced Opacity Blue Gradient Overlay — Video is now vibrant and visible */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 60% 40%, rgba(6, 24, 59, 0.15) 0%, rgba(6, 24, 59, 0.5) 75%), linear-gradient(180deg, rgba(6, 24, 59, 0.2) 0%, rgba(6, 24, 59, 0.7) 100%)",
        }}
      />

      {/* Hero Content */}
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, px: { xs: 3, md: 8 } }}>
        <Stack spacing={3.5} sx={{ maxWidth: 880 }}>
          <Reveal>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
              <ScienceIcon sx={{ color: "var(--accent-ink)", fontSize: "1.3rem" }} />
              <Typography
                variant="overline"
                sx={{
                  color: "var(--accent-ink)",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  fontSize: "0.85rem",
                  fontFamily: MONO,
                  textShadow: "0 2px 8px rgba(0, 0, 0, 0.8)",
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
                textShadow: "0 4px 20px rgba(0, 0, 0, 0.85), 0 2px 6px rgba(0, 0, 0, 0.9)",
              }}
            >
              The tools we built for ourselves, opened up.
            </Typography>
          </Reveal>

          <Reveal delay={0.2}>
            <Typography
              variant="subtitle1"
              sx={{
                color: "rgba(255, 255, 255, 0.92)",
                fontSize: { xs: "1.1rem", md: "1.3rem" },
                lineHeight: 1.6,
                fontWeight: 400,
                maxWidth: 760,
                textShadow: "0 2px 12px rgba(0, 0, 0, 0.85)",
              }}
            >
              Discover open-source tools, machine learning signal prototypes, and high-performance C++ / Rust kernels created by our software engineers, quantitative researchers, and graduate fellows during their R&D pet project time.
            </Typography>
          </Reveal>

          {/* Hero Feature Badges */}
          <Reveal delay={0.3}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ pt: 1 }}>
              <Chip
                icon={<CodeIcon sx={{ color: `${NOIR.goldDark} !important` }} />}
                label="100% ENGINEER INITIATED"
                sx={{
                  bgcolor: "rgba(244, 247, 252, 0.95)",
                  backdropFilter: "blur(12px)",
                  color: "#0A2A66",
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  border: "1px solid rgba(10, 42, 102, 0.22)",
                  py: 2,
                }}
              />
              <Chip
                icon={<MemoryIcon sx={{ color: `${NOIR.live} !important` }} />}
                label="9 LIVE R&D EXPERIMENTS"
                sx={{
                  bgcolor: "rgba(244, 247, 252, 0.95)",
                  backdropFilter: "blur(12px)",
                  color: "#0A2A66",
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  border: `1px solid ${alpha(NOIR.live, 0.5)}`,
                  py: 2,
                }}
              />
              <Chip
                icon={<AutoAwesomeIcon sx={{ color: `${NOIR.goldDark} !important` }} />}
                label="C++ / RUST / PYTHON / AI"
                sx={{
                  bgcolor: "rgba(244, 247, 252, 0.95)",
                  backdropFilter: "blur(12px)",
                  color: "#0A2A66",
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  border: "1px solid rgba(10, 42, 102, 0.22)",
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
        </Box>
      </Container>
    </Box>
  );
}
