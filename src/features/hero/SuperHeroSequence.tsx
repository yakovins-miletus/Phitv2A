import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CONTENT } from "@/shared/content";
import { HeroSignalP } from "@/shared/components/HeroSignalP";
import { RouterLink } from "@/shared/components/RouterLink";
import { SectionLede } from "@/shared/components/SectionLede";
import { StageSection, useStagePresence } from "@/shared/components/StageSection";
import { STAGE_ATTR, homeSection } from "@/shared/sections";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);


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
        <Box
          sx={{
            position: "absolute",
            top: { xs: "calc(50% + 90px)", sm: "50%", md: "50%" },
            left: { xs: "50%", sm: "calc(50% - 60px)", md: "calc(50% - 80px)" },
            width: "auto",
            textAlign: { xs: "center", sm: "left" },
            zIndex: 3,
            overflow: "visible",
            opacity: 1,
            pointerEvents: "auto",
            transition: "opacity 0.2s ease-out",
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
                aria-label="Phitopolis"
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

        {/* Top Left "WHO WE ARE" Button with Description */}
        <Box
          sx={{
            position: "absolute",
            top: { xs: 60, md: 76 },
            left: { xs: 32, md: 72 },
            zIndex: 5,
            display: { xs: "none", sm: "flex" },
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 0.8,
            opacity: Math.max(0, 1 - scrollProgress * 3),
            pointerEvents: scrollProgress > 0.3 ? "none" : "auto",
            transition: "opacity 0.3s ease",
          }}
        >
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: alpha(NOIR.navyField, 0.88),
              textTransform: "uppercase",
            }}
          >
            WHO WE ARE // R&D FIRM MANILA
          </Typography>

          <Box
            component={RouterLink}
            to="/about"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              px: 3,
              py: 1.2,
              borderRadius: "6px",
              textDecoration: "none !important",
              border: `1px solid ${alpha(NOIR.navyField, 0.25)}`,
              bgcolor: alpha(NOIR.panel, 0.75),
              backdropFilter: "blur(12px)",
              boxShadow: `0 8px 24px ${alpha(NOIR.navyField, 0.08)}`,
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              "&, & *": {
                textDecoration: "none !important",
              },
              "&:hover": {
                bgcolor: NOIR.navyField,
                borderColor: NOIR.navyField,
                boxShadow: `0 10px 30px ${alpha(NOIR.navyField, 0.35)}`,
                "& .btn-text, & .btn-arrow": {
                  color: "#FFFFFF !important",
                },
              },
            }}
          >
            <Typography
              className="btn-text"
              sx={{
                fontFamily: MONO,
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "text.primary",
                textTransform: "uppercase",
                transition: "color 0.3s ease",
              }}
            >
              ABOUT PHITOPOLIS <Box component="span" className="btn-arrow" sx={{ color: "text.primary", transition: "color 0.3s ease", ml: 0.5 }}>→</Box>
            </Typography>
          </Box>
        </Box>

        {/* Top Right "EXPLORE OUR COMMUNITY" Button with Description */}
        <Box
          sx={{
            position: "absolute",
            top: { xs: 60, md: 76 },
            right: { xs: 32, md: 72 },
            zIndex: 5,
            display: { xs: "none", sm: "flex" },
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 0.8,
            opacity: Math.max(0, 1 - scrollProgress * 3),
            pointerEvents: scrollProgress > 0.3 ? "none" : "auto",
            transition: "opacity 0.3s ease",
          }}
        >
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: alpha(NOIR.navyField, 0.88),
              textTransform: "uppercase",
              textAlign: "right",
            }}
          >
            LATEST INSIGHTS & ENGINEERING BLOG
          </Typography>

          <Box
            component={RouterLink}
            to="/blog"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              px: 3,
              py: 1.2,
              borderRadius: "6px",
              textDecoration: "none !important",
              border: `1px solid ${alpha(NOIR.navyField, 0.25)}`,
              bgcolor: alpha(NOIR.panel, 0.75),
              backdropFilter: "blur(12px)",
              boxShadow: `0 8px 24px ${alpha(NOIR.navyField, 0.08)}`,
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              "&, & *": {
                textDecoration: "none !important",
              },
              "&:hover": {
                bgcolor: NOIR.navyField,
                borderColor: NOIR.navyField,
                boxShadow: `0 10px 30px ${alpha(NOIR.navyField, 0.35)}`,
                "& .btn-text, & .btn-arrow": {
                  color: "#FFFFFF !important",
                },
              },
            }}
          >
            <Typography
              className="btn-text"
              sx={{
                fontFamily: MONO,
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "text.primary",
                textTransform: "uppercase",
                transition: "color 0.3s ease",
              }}
            >
              EXPLORE OUR COMMUNITY <Box component="span" className="btn-arrow" sx={{ color: "text.primary", transition: "color 0.3s ease", ml: 0.5 }}>→</Box>
            </Typography>
          </Box>
        </Box>

        {/* Bottom Left "WHAT WE DO" Button with Description */}
        <Box
          sx={{
            position: "absolute",
            bottom: { xs: 28, md: 44 },
            left: { xs: 32, md: 72 },
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 0.8,
            opacity: Math.max(0, 1 - scrollProgress * 3),
            pointerEvents: scrollProgress > 0.3 ? "none" : "auto",
            transition: "opacity 0.3s ease",
          }}
        >
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: alpha(NOIR.navyField, 0.88),
              textTransform: "uppercase",
            }}
          >
            HIGH-PERFORMANCE R&D & FINTECH PLATFORMS
          </Typography>

          <Box
            component={RouterLink}
            to="/services"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              px: 3,
              py: 1.2,
              borderRadius: "6px",
              textDecoration: "none !important",
              border: `1px solid ${alpha(NOIR.navyField, 0.25)}`,
              bgcolor: alpha(NOIR.panel, 0.75),
              backdropFilter: "blur(12px)",
              boxShadow: `0 8px 24px ${alpha(NOIR.navyField, 0.08)}`,
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              "&, & *": {
                textDecoration: "none !important",
              },
              "&:hover": {
                bgcolor: NOIR.navyField,
                borderColor: NOIR.navyField,
                boxShadow: `0 10px 30px ${alpha(NOIR.navyField, 0.35)}`,
                "& .btn-text, & .btn-arrow": {
                  color: "#FFFFFF !important",
                },
              },
            }}
          >
            <Typography
              className="btn-text"
              sx={{
                fontFamily: MONO,
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "text.primary",
                textTransform: "uppercase",
                transition: "color 0.3s ease",
              }}
            >
              WHAT WE DO <Box component="span" className="btn-arrow" sx={{ color: "text.primary", transition: "color 0.3s ease", ml: 0.5 }}>→</Box>
            </Typography>
          </Box>
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

/** Core mission, as L0 + L1.
 *
 *  This used to set CONTENT.hero.description — a 40-word sentence — at
 *  3.4rem/800. Nothing that long is readable at display size, so the reader
 *  either scrubbed past it or stopped. The claim now leads with a number the
 *  site already owns (CONTENT.impact: 2ms → 18µs) and the reasoning drops to
 *  body size behind it. */
export function HeroDescriptionSection() {
  const sectionDef = homeSection("hero-desc");
  return (
    <StageSection section={sectionDef} muted>
      <Box sx={{ py: { xs: 6, md: 10 }, maxWidth: 980, mx: "auto", px: 2 }}>
        <SectionLede
          gunshot={CONTENT.ledes.mission.gunshot}
          tracer={CONTENT.ledes.mission.tracer}
          eyebrow="Core Mission"
          align="center"
        />
      </Box>
    </StageSection>
  );
}

/** Hero + core mission. The four per-service stages that used to trail this
 *  sequence now live in CapabilityRack, mounted directly by HomePage. */
export function SuperHeroSequence() {
  return (
    <>
      <HeroSignalCore />
      <HeroDescriptionSection />
    </>
  );
}
