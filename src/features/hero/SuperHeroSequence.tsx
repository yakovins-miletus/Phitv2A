import { useRef, useState, useEffect } from "react";
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
import { NAV_ANCHORS, useNavbar } from "@/shared/components/NavbarContext";
import {
  DWELL_END,
  atEnterProgress,
  atTightenProgress,
  bottomPanelX,
  containerScale,
  flankOpacity,
  gunshotProgress,
  leftFlankX,
  pExitProgress,
  panelOpacity,
  panelPointerEvents,
  rightFlankX,
  topPanelX,
  wordLiftPercent,
  wordRevealProgress,
} from "./heroPhases";
import { NOIR } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The hero holds for viewport height to give room for 3 logo phases,
 *  an empty dwell threshold, the gunshot transition, smoking drift, and AT PHITOPOLIS mini transformation. */
const HERO_PIN_DISTANCE = "+=1000%";


// Stage 01: Hero Signal Core Landing Stage (Pinned scroll sequence with 3D-to-2D transition)
export function HeroSignalCore() {
  const pinRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const reduced = useReducedMotion();

  useStagePresence(containerRef, "hero");
  const { registerAnchor } = useNavbar();

  // Dark mode navbar activation strictly across the gunshot transition and smoking drift sections
  const isGunshotActive = !reduced && scrollProgress >= DWELL_END && scrollProgress < 0.98;

  useEffect(() => {
    if (isGunshotActive) {
      registerAnchor(NAV_ANCHORS.HERO_GUNSHOT, true, false);
    } else {
      registerAnchor(NAV_ANCHORS.HERO_GUNSHOT, false, false);
    }
    return () => {
      registerAnchor(NAV_ANCHORS.HERO_GUNSHOT, false, false);
    };
  }, [isGunshotActive, registerAnchor]);

  useGSAP(
    () => {
      if (reduced) return;

      ScrollTrigger.create({
        trigger: pinRef.current,
        start: "top top",
        end: HERO_PIN_DISTANCE,
        scrub: 0.6,
        pin: true,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        },
      });
    },
    { scope: pinRef }
  );

  const scaleVal = reduced ? 1 : containerScale(scrollProgress);
  const gProgress = reduced ? 0 : gunshotProgress(scrollProgress);
  const topX = reduced ? 0 : topPanelX(scrollProgress);
  const bottomX = reduced ? 0 : bottomPanelX(scrollProgress);
  const leftX = reduced ? -580 : leftFlankX(scrollProgress);
  const rightX = reduced ? 580 : rightFlankX(scrollProgress);
  const flankOp = reduced ? 1 : flankOpacity(scrollProgress);
  const pExitVal = reduced ? 0 : pExitProgress(scrollProgress);
  const atEnterVal = reduced ? 0 : atEnterProgress(scrollProgress);
  const tightVal = reduced ? 0 : atTightenProgress(scrollProgress);

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
        {/* Dual Split-Pane Images Layer (Gunshot & Smoking Section) */}
        {gProgress > 0.01 && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            {/* Top Split Panel (Left -> Right) */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "50vh",
                overflow: "hidden",
                borderBottom: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <Box
                component="img"
                src="/images/quant-research-banner.jpg"
                alt=""
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `translateX(${topX.toFixed(2)}%)`,
                  filter: "brightness(0.85) contrast(1.05)",
                  willChange: "transform",
                }}
              />
            </Box>

            {/* Bottom Split Panel (Right -> Left) */}
            <Box
              sx={{
                position: "absolute",
                top: "50vh",
                left: 0,
                width: "100%",
                height: "50vh",
                overflow: "hidden",
                borderTop: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <Box
                component="img"
                src="/images/data-science-banner.png"
                alt=""
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `translateX(${bottomX.toFixed(2)}%) scale(1.05)`,
                  filter: "brightness(0.85) contrast(1.05)",
                  willChange: "transform",
                }}
              />
            </Box>
          </Box>
        )}

        {/* Flanking Outward Text Elements (Gunshot Outward Motion -> Static in Smoking) */}
        {flankOp > 0.01 && (
          <>
            {/* Left Text: 7 YEARS OF EXCELLENCE */}
            <Box
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${leftX.toFixed(1)}px), -50%)`,
                opacity: flankOp,
                pointerEvents: "none",
                zIndex: 3,
                whiteSpace: "nowrap",
                textAlign: "right",
                transition: "transform 0.05s linear, opacity 0.05s linear",
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "0.75rem", sm: "1.05rem", md: "1.35rem" },
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#FFFFFF",
                  textShadow: "0 4px 20px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.8)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Box component="span" sx={{ color: NOIR.gold, fontWeight: 900 }}>01 //</Box> 7 YEARS OF EXCELLENCE
              </Typography>
            </Box>

            {/* Right Text: GENERATIONS OF COMPETITIVENESS */}
            <Box
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${rightX.toFixed(1)}px), -50%)`,
                opacity: flankOp,
                pointerEvents: "none",
                zIndex: 3,
                whiteSpace: "nowrap",
                textAlign: "left",
                transition: "transform 0.05s linear, opacity 0.05s linear",
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "0.75rem", sm: "1.05rem", md: "1.35rem" },
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#FFFFFF",
                  textShadow: "0 4px 20px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.8)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                YEARS OF COMPETITIVENESS <Box component="span" sx={{ color: NOIR.gold, fontWeight: 900 }}>// 02</Box>
              </Typography>
            </Box>
          </>
        )}

        {/* Scaled Hero Container (Houses P Logo, AT Text & Wordmark) */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 4,
            transform: `scale(${scaleVal.toFixed(3)})`,
            transformOrigin: "center center",
            transition: "transform 0.05s linear",
            bgcolor: gProgress > 0.05 ? "#FFFFFF" : "transparent",
            borderRadius: gProgress > 0.05 ? `${(gProgress * 24).toFixed(0)}px` : "0px",
            border: gProgress > 0.05 ? "1px solid rgba(0,0,0,0.08)" : "none",
            boxShadow: gProgress > 0.05 ? `0 24px 60px rgba(0,0,0,${(0.35 * gProgress).toFixed(2)})` : "none",
            maxWidth: gProgress > 0.05 ? "1200px" : "100%",
            maxHeight: gProgress > 0.05 ? "720px" : "100%",
            m: "auto",
          }}
        >
          {/* Interactive Signal Canvas Layer (P Logo drops down out first) */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 4,
              opacity: (1 - pExitVal) * (reduced ? 0.4 : 0.95),
              transform: `translateY(${pExitVal * 180}px)`,
              transition: "transform 0.1s ease-out, opacity 0.1s ease-out",
            }}
          >
            <HeroSignalP progress={scrollProgress} />
          </Box>

          {/* "AT" Wordmark Transition — Enters from top delayed after P drops away */}
          {atEnterVal > 0.01 && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: { xs: "50%", sm: "calc(50% - 280px)", md: "calc(50% - 330px)" },
                transform: `translate(-50%, calc(-50% + ${(1 - atEnterVal) * -160}px))`,
                opacity: atEnterVal,
                zIndex: 6,
                pointerEvents: "none",
                transition: "opacity 0.1s ease-out, transform 0.1s ease-out",
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: "2.8rem", sm: "4.5rem", md: "6rem" },
                  letterSpacing: "-0.04em",
                  color: NOIR.gold,
                  textShadow: "0 2px 10px rgba(0,0,0,0.15)",
                }}
              >
                AT
              </Typography>
            </Box>
          )}

          {/* PHITOPOLIS Word Transition — Phase 3 & Shift Left in Sub-Phase 2 */}
          <Box
            sx={{
              position: "absolute",
              top: { xs: "calc(50% + 90px)", sm: "50%", md: "50%" },
              left: {
                xs: "50%",
                sm: `calc(50% - ${60 + tightVal * 90}px)`,
                md: `calc(50% - ${80 + tightVal * 110}px)`,
              },
              width: "auto",
              textAlign: { xs: "center", sm: "left" },
              zIndex: 5,
              overflow: "hidden",
              clipPath: "inset(0 0 0 0)",
              opacity: reduced ? 1 : wordRevealProgress(scrollProgress),
              pointerEvents: "auto",
              transition: "opacity 0.15s ease-out, left 0.1s ease-out",
              transform: {
                xs: "translate(-50%, -50%)",
                sm: "translate(0, -50%)",
              },
            }}
          >
            <Box sx={{ position: "relative", overflow: "hidden", py: 0.5 }}>
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
            </Box>
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

        {/* Top Left Motto Section */}
        <Box
          sx={{
            position: "absolute",
            top: { xs: 60, md: 76 },
            left: { xs: 32, md: 72 },
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            opacity: panelOpacity(scrollProgress),
            transition: "opacity 0.3s ease",
            maxWidth: { xs: "320px", sm: "600px", md: "780px" },
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 800,
              fontSize: { xs: "2.0rem", md: "2.60rem" },
              lineHeight: 1.15,
              color: NOIR.navyField,
              letterSpacing: "-0.03em",
            }}
          >
            Making Tomorrow's Technology Available Today
          </Typography>
        </Box>

        {/* Bottom Left Navigation Launcher: Clumped links */}
        <Box
          sx={{
            position: "absolute",
            bottom: { xs: 28, md: 44 },
            left: { xs: 32, md: 72 },
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            gap: 1.2,
            opacity: panelOpacity(scrollProgress),
            pointerEvents: panelPointerEvents(scrollProgress),
            transition: "opacity 0.3s ease",
            maxWidth: { xs: "calc(100% - 64px)", md: "850px" },
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
            EXPLORE PHITOPOLIS // DIRECTORY
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: "stretch",
            }}
          >
            {/* Link 1: ABOUT */}
            <Box
              component={RouterLink}
              to="/about"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                px: 3,
                py: 1.2,
                borderRadius: "8px",
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
                  "& .btn-text": {
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
                ABOUT PHITOPOLIS <Box component="span" sx={{ ml: 0.5 }}>→</Box>
              </Typography>
            </Box>

            {/* Link 2: SERVICES */}
            <Box
              component={RouterLink}
              to="/services"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                px: 3,
                py: 1.2,
                borderRadius: "8px",
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
                  "& .btn-text": {
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
                WHAT WE DO <Box component="span" sx={{ ml: 0.5 }}>→</Box>
              </Typography>
            </Box>

            {/* Link 3: BLOG */}
            <Box
              component={RouterLink}
              to="/blog"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                px: 3,
                py: 1.2,
                borderRadius: "8px",
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
                  "& .btn-text": {
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
                EXPLORE COMMUNITY <Box component="span" sx={{ ml: 0.5 }}>→</Box>
              </Typography>
            </Box>
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
