import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import { alpha } from "@mui/material/styles";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CONTENT } from "@/shared/content";
import { HeroSignalP } from "@/shared/components/HeroSignalP";
import { RouterButton, RouterLink } from "@/shared/components/RouterLink";
import { StageSection, useStagePresence } from "@/shared/components/StageSection";
import { STAGE_ATTR, homeSection } from "@/shared/sections";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";
import { ServiceVector } from "@/features/services/components/ServiceDrawer";
import MemoryIcon from "@mui/icons-material/Memory";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import StorageIcon from "@mui/icons-material/Storage";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SERVICE_ICONS = [
  MemoryIcon,
  QueryStatsIcon,
  StorageIcon,
  SettingsSuggestIcon,
];

const SERVICE_IDS = [
  "service-dev",
  "service-quant",
  "service-data",
  "service-ops",
] as const;



// Stage 01: Hero Signal Core Landing Stage (Pinned scroll sequence with 3D-to-2D transition)
export function HeroSignalCore() {
  const pinRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const reduced = useReducedMotion();

  useStagePresence(containerRef, "hero");

  useGSAP(
    () => {
      if (reduced) return;

      ScrollTrigger.create({
        trigger: pinRef.current,
        start: "top top",
        end: "+=300%",
        scrub: 0.6,
        pin: true,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        },
      });
    },
    { scope: pinRef }
  );

  return (
    <Box ref={pinRef} sx={{ position: "relative", height: "100vh" }}>
      <Box
        ref={containerRef}
        id="hero"
        {...{ [STAGE_ATTR]: "" }}
        sx={{
          position: "relative",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(ellipse at center, #FFFFFF 65%, ${alpha(NOIR.panel, 0.4)} 88%, ${alpha(NOIR.navyField, 0.02)} 100%)`,
          pt: { xs: 16, md: 12 },
          pb: { xs: 10, md: 6 },
          px: { xs: 4, md: 8 },
        }}
      >
        {/* Interactive Signal Canvas Layer */}
        <Box aria-hidden sx={{ position: "absolute", inset: 0, zIndex: 4, opacity: { xs: 0.4, md: 0.95 } }}>
          <HeroSignalP progress={scrollProgress} />
        </Box>

        {/* PHITOPOLIS Word Transition — Phase 3 */}
        {(reduced || scrollProgress > 0.6) && (
          <Box
            sx={{
              position: "absolute",
              top: { xs: "calc(50% + 90px)", sm: "50%", md: "50%" },
              left: { xs: "50%", sm: "calc(50% - 60px)", md: "calc(50% - 80px)" },
              width: "auto",
              textAlign: { xs: "center", sm: "left" },
              zIndex: 3,
              overflow: "visible",
              transform: {
                xs: "translate(-50%, -50%)",
                sm: "translate(0, -50%)",
              },
            }}
          >
            <Box sx={{ position: "relative", overflow: "visible" }}>
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: "2.6rem", sm: "4.0rem", md: "5.8rem" },
                  fontWeight: 900,
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                  textTransform: "uppercase",
                  userSelect: "none",
                  transform: reduced ? "translateY(0)" : `translateY(${ (1 - (scrollProgress <= 0.75 ? 0 : (scrollProgress - 0.75) / 0.25)) * -110 }%)`,
                  transition: "transform 0.05s linear",
                }}
              >
                PH<Box component="span" sx={{ color: NOIR.gold }}>IT</Box>OPOLIS
              </Typography>

              {/* White background covering element (with no shadow) placed on top of the word's upper path */}
              {!reduced && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: "95%",
                    left: "-50px",
                    right: "-50px",
                    height: "300px",
                    bgcolor: "#FFFFFF",
                    zIndex: 10,
                    boxShadow: "none",
                    pointerEvents: "none",
                  }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Ultra-Subtle Corner Vignette */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            background: `radial-gradient(ellipse at center, transparent 90%, ${alpha(NOIR.navyField, 0.03)} 100%)`,
          }}
        />

        {/* Bottom Left "WHAT WE DO" Button */}
        <Box
          component={RouterLink}
          to="/services"
          sx={{
            position: "absolute",
            bottom: { xs: 28, md: 44 },
            left: { xs: 24, md: 56 },
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            px: 3,
            py: 1.2,
            borderRadius: "6px",
            textDecoration: "none",
            border: `1px solid ${alpha(NOIR.navyField, 0.25)}`,
            bgcolor: alpha(NOIR.panel, 0.75),
            backdropFilter: "blur(12px)",
            boxShadow: `0 8px 24px ${alpha(NOIR.navyField, 0.08)}`,
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            opacity: Math.max(0, 1 - scrollProgress * 3),
            pointerEvents: scrollProgress > 0.3 ? "none" : "auto",
            "&:hover": {
              borderColor: NOIR.gold,
              color: NOIR.gold,
              bgcolor: alpha(NOIR.gold, 0.12),
              transform: "translateY(-3px)",
              boxShadow: `0 12px 30px ${alpha(NOIR.gold, 0.2)}`,
            },
          }}
        >
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "text.primary",
              textTransform: "uppercase",
            }}
          >
            WHAT WE DO →
          </Typography>
        </Box>

        {/* Bottom Scroll Cue */}
        <Box
          sx={{
            position: { xs: "relative", md: "absolute" },
            bottom: { md: 48 },
            right: { md: 56 },
            zIndex: 4,
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            opacity: Math.max(0, 1 - scrollProgress * 3),
          }}
        >
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.68rem",
              letterSpacing: "0.16em",
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              gap: 1,
              animation: "pulseBounce 2.4s ease-in-out infinite",
              "@keyframes pulseBounce": {
                "0%, 100%": { transform: "translateY(0)" },
                "50%": { transform: "translateY(5px)" },
              },
            }}
          >
            [ SCROLL TO EXPLORE ↓ ]
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// Appended Section right after the hero page presenting the core mission statement
export function HeroDescriptionSection() {
  const sectionDef = homeSection("hero-desc");
  return (
    <StageSection section={sectionDef} muted>
      <Box sx={{ py: { xs: 6, md: 10 }, textAlign: "center", maxWidth: 980, mx: "auto", px: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography
          variant="h2"
          component="h2"
          sx={{
            fontSize: { xs: "1.8rem", sm: "2.6rem", md: "3.4rem" },
            fontWeight: 800,
            lineHeight: 1.3,
            letterSpacing: "-0.02em",
            color: "text.primary",
          }}
        >
          {CONTENT.hero.description.split(/(R&D firm)/g).map((part, i) =>
            /^(R&D firm)$/.test(part) ? (
              <Box key={i} component="span" sx={{ color: NOIR.gold, fontWeight: 800 }}>
                {part}
              </Box>
            ) : (
              part
            )
          )}
        </Typography>
      </Box>
    </StageSection>
  );
}

// Stage Sub-Component for Service Display Inline
export function ServiceSuperStage({ index }: { index: number }) {
  const service = CONTENT.services[index];
  const sectionId = SERVICE_IDS[index] ?? "service-dev";
  const Icon = SERVICE_ICONS[index] || MemoryIcon;
  const sectionDef = homeSection(sectionId);

  if (!service) return null;

  return (
    <StageSection section={sectionDef} muted={index % 2 === 1}>
      <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
        {/* Left Column: Stage Identification & Core Story */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  p: 1.8,
                  borderRadius: 2,
                  bgcolor: alpha(NOIR.gold, 0.1),
                  color: NOIR.gold,
                  border: `1px solid ${alpha(NOIR.gold, 0.3)}`,
                  display: "flex",
                }}
              >
                <Icon sx={{ fontSize: 36 }} />
              </Box>
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontSize: { xs: "2rem", sm: "2.8rem", md: "3.4rem" },
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                {service.title}
              </Typography>
            </Stack>

            <Typography
              variant="h5"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                lineHeight: 1.4,
                fontSize: { xs: "1.1rem", md: "1.35rem" },
              }}
            >
              {service.summary}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                fontSize: { xs: "0.95rem", md: "1.05rem" },
                lineHeight: 1.7,
              }}
            >
              {service.details}
            </Typography>

            <Box sx={{ pt: 1 }}>
              <RouterButton
                to="/contact"
                variant="outlined"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.82rem",
                  letterSpacing: "0.1em",
                  px: 3,
                  py: 1.2,
                  borderRadius: "4px",
                }}
              >
                DISCUSS {service.title.toUpperCase()}
              </RouterButton>
            </Box>
          </Stack>
        </Grid>

        {/* Right Column: Clean Animated Service Vector Visualization */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: { xs: 260, md: 320 },
              width: "100%",
            }}
          >
            <Box sx={{ width: "100%", maxWidth: { xs: 380, sm: 460, md: 540 }, height: { xs: 300, sm: 360, md: 420 } }}>
              <ServiceVector id={SERVICE_IDS[index]} />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </StageSection>
  );
}

export function SuperHeroSequence() {
  return (
    <>
      <HeroSignalCore />
      <HeroDescriptionSection />
      {CONTENT.services.map((_, index) => (
        <ServiceSuperStage key={SERVICE_IDS[index]} index={index} />
      ))}
    </>
  );
}
