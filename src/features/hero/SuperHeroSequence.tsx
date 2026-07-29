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
import { StageSection, useStagePresence } from "@/shared/components/StageSection";
import { STAGE_ATTR, homeSection } from "@/shared/sections";
import { panelOpacity, panelPointerEvents, wordLiftPercent } from "./heroPhases";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The hero holds for three viewport heights, which is what gives the three
 *  phases in heroPhases.ts room to read as distinct beats rather than a blur. */
const HERO_PIN_DISTANCE = "+=300%";


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
        end: HERO_PIN_DISTANCE,
        scrub: 0.6,
        pin: true,
        // PARITY-LOCKED, and the obvious fix does not work — measured, not assumed.
        //
        // This fires on every scrub frame, so the whole hero subtree re-renders
        // and emotion re-serialises every `sx` that interpolates the value. One
        // pass of this pin at 1440x900 injects ~2,648 new CSS rules and pushes
        // p95 frame time to ~46ms.
        //
        // The textbook fix — write the continuous values as CSS custom
        // properties instead of state — was implemented and measured here. It
        // removed only 485 of those 2,648 rules (18%) and left frame times
        // unchanged, because the cost is not in this file. It is in
        // HeroSignalP, which interpolates `progress` into its own sx at a dozen
        // sites AND is structurally dependent on it: numLayers is
        // round(16 * (1 - progress)), so the hero subtree goes from 241 DOM
        // nodes to 33 across the pin. No custom property can express that.
        //
        // A real fix has to change how HeroSignalP renders its extrusion
        // layers. That is a redesign of that component, not a refactor of this
        // one, so it was reverted rather than shipped as a half-measure.
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
                  transform: reduced ? "translateY(0)" : `translateY(${wordLiftPercent(scrollProgress)}%)`,
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
            opacity: panelOpacity(scrollProgress),
            pointerEvents: panelPointerEvents(scrollProgress),
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
              transition: `all 0.3s ${EASE_OUT_EXPO_CSS}`,
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
            opacity: panelOpacity(scrollProgress),
            pointerEvents: panelPointerEvents(scrollProgress),
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
              transition: `all 0.3s ${EASE_OUT_EXPO_CSS}`,
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
            opacity: panelOpacity(scrollProgress),
            pointerEvents: panelPointerEvents(scrollProgress),
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
              transition: `all 0.3s ${EASE_OUT_EXPO_CSS}`,
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
            opacity: panelOpacity(scrollProgress),
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
      <Box
        sx={{
          py: { xs: 6, md: 10 },
          textAlign: "center",
          maxWidth: 980,
          // alignSelf, NOT mx:"auto". StageSection wraps children in a MUI
          // Stack, and Stack's spacing emits `& > :not(style):not(style) {
          // margin: 0 }` on its direct children — a two-class selector that
          // outranks this Box's own single-class sx rule. So `mx: "auto"`
          // computed to 0px and this block sat 86px left of centre at 1440px
          // wide, dented by exactly half the slack between its 980px cap and
          // the 1152px stage. alignSelf is flex-native and unaffected.
          alignSelf: "center",
          width: "100%",
          px: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
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
