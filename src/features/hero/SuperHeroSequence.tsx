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
import { getLenis } from "@/shared/components/SmoothScroll";
import {
  DWELL_END,
  GUNSHOT_END,
  CONTAINER_START,
  borderAnimProgress,
  atTightenProgress,
  containerScale,
  flankOpacity,
  gunshotProgress,
  leftFlankY,
  panelOpacity,
  panelPointerEvents,
  rightFlankY,
  wordLiftPercent,
  wordRevealProgress,
} from "./heroPhases";
import { NOIR } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { useReducedMotion, usePreloaderReady } from "@/shared/motion";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The hero holds for viewport height to give room for 3 logo phases,
 *  an empty dwell threshold, the gunshot transition, smoking drift, and AT PHITOPOLIS mini transformation. */
const HERO_PIN_DISTANCE = "+=3000%";


// Stage 01: Hero Signal Core Landing Stage (Pinned scroll sequence with 3D-to-2D transition)
export function HeroSignalCore() {
  const pinRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const reduced = useReducedMotion();
  const ready = usePreloaderReady();
  const isSnappingRef = useRef(false);

  useStagePresence(containerRef, "hero");
  const { registerAnchor } = useNavbar();

  // Dark mode navbar activation starting when Phase 6 hits (GUNSHOT_END = 0.70)
  const isHeroActive = !reduced && scrollProgress >= DWELL_END && scrollProgress < 0.98;
  const isHeroDark = !reduced && scrollProgress >= GUNSHOT_END && scrollProgress < 0.98;

  useEffect(() => {
    if (isHeroActive) {
      registerAnchor(NAV_ANCHORS.HERO_GUNSHOT, true, isHeroDark);
    } else {
      registerAnchor(NAV_ANCHORS.HERO_GUNSHOT, false, false);
    }
    return () => {
      registerAnchor(NAV_ANCHORS.HERO_GUNSHOT, false, false);
    };
  }, [isHeroActive, isHeroDark, registerAnchor]);

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

          if (isSnappingRef.current) return;

          const p = self.progress;
          const dir = self.direction; // 1 = scroll down, -1 = scroll up

          if (dir === 1 && p > DWELL_END && p < GUNSHOT_END - 0.01) {
            isSnappingRef.current = true;
            const targetScroll = self.start + GUNSHOT_END * (self.end - self.start);
            const lenis = getLenis();
            if (lenis) {
              lenis.scrollTo(targetScroll, {
                force: true,
                duration: 1.5,
                onComplete: () => {
                  isSnappingRef.current = false;
                },
              });
            } else {
              const obj = { y: window.scrollY };
              gsap.to(obj, {
                y: targetScroll,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => window.scrollTo(0, obj.y),
                onComplete: () => {
                  isSnappingRef.current = false;
                },
              });
            }
          } else if (dir === -1 && p < GUNSHOT_END && p > DWELL_END + 0.01) {
            isSnappingRef.current = true;
            const targetScroll = self.start + DWELL_END * (self.end - self.start);
            const lenis = getLenis();
            if (lenis) {
              lenis.scrollTo(targetScroll, {
                force: true,
                duration: 1.5,
                onComplete: () => {
                  isSnappingRef.current = false;
                },
              });
            } else {
              const obj = { y: window.scrollY };
              gsap.to(obj, {
                y: targetScroll,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => window.scrollTo(0, obj.y),
                onComplete: () => {
                  isSnappingRef.current = false;
                },
              });
            }
          } else if (dir === 1 && p > CONTAINER_START && p < 0.95 - 0.01) {
            isSnappingRef.current = true;
            const targetScroll = self.start + 0.95 * (self.end - self.start);
            const lenis = getLenis();
            if (lenis) {
              lenis.scrollTo(targetScroll, {
                force: true,
                duration: 1.5,
                onComplete: () => {
                  isSnappingRef.current = false;
                },
              });
            } else {
              const obj = { y: window.scrollY };
              gsap.to(obj, {
                y: targetScroll,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => window.scrollTo(0, obj.y),
                onComplete: () => {
                  isSnappingRef.current = false;
                },
              });
            }
          } else if (dir === -1 && p < 0.95 && p > CONTAINER_START + 0.01) {
            isSnappingRef.current = true;
            const targetScroll = self.start + CONTAINER_START * (self.end - self.start);
            const lenis = getLenis();
            if (lenis) {
              lenis.scrollTo(targetScroll, {
                force: true,
                duration: 1.5,
                onComplete: () => {
                  isSnappingRef.current = false;
                },
              });
            } else {
              const obj = { y: window.scrollY };
              gsap.to(obj, {
                y: targetScroll,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => window.scrollTo(0, obj.y),
                onComplete: () => {
                  isSnappingRef.current = false;
                },
              });
            }
          }
        },
      });
    },
    { scope: pinRef }
  );

  const scaleVal = reduced ? 1 : containerScale(scrollProgress);
  const gProgress = reduced ? 0 : gunshotProgress(scrollProgress);
  
  const EXTRA_WIDTH_PCT = 40;
  const MAX_TRAVEL_PCT = EXTRA_WIDTH_PCT / 1.4; // 28.5714%
  const topXVal = reduced ? -MAX_TRAVEL_PCT : -100 + gProgress * (100 - MAX_TRAVEL_PCT);
  const bottomXVal = reduced ? 0 : 100 - gProgress * 100;

  const leftY = reduced ? -240 : leftFlankY(scrollProgress);
  const rightY = reduced ? 240 : rightFlankY(scrollProgress);
  const flankOp = reduced ? 1 : flankOpacity(scrollProgress);
  const pExitProgressVal = (p: number) => {
    if (p <= CONTAINER_START) return 0;
    if (p >= 0.89) return 1;
    return (p - CONTAINER_START) / 0.03;
  };
  const atEnterProgressVal = (p: number) => {
    if (p <= 0.89) return 0;
    if (p >= 0.92) return 1;
    return (p - 0.89) / 0.03;
  };

  const pExitVal = reduced ? 1 : pExitProgressVal(scrollProgress);
  const atEnterVal = reduced ? 1 : atEnterProgressVal(scrollProgress);
  const tightVal = reduced ? 0 : atTightenProgress(scrollProgress);
  const borderProgress = reduced ? 1 : borderAnimProgress(scrollProgress);

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
          pt: 0,
          pb: 0,
          px: 0,
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
                src="/images/topHalfHero.jpg"
                alt=""
                sx={{
                  width: "140%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `translateX(${topXVal.toFixed(4)}%)`,
                  filter: "brightness(0.85) contrast(1.05)",
                  willChange: "transform",
                  animation: (gProgress > 0.99 && scrollProgress < 0.98) ? "autoPanTop 20s linear infinite alternate" : "none",
                  "@keyframes autoPanTop": {
                    "0%": { transform: "translateX(-28.5714%)" },
                    "100%": { transform: "translateX(0%)" },
                  },
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
                src="/images/botHalfHero.jpg"
                alt=""
                sx={{
                  width: "140%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `translateX(${bottomXVal.toFixed(4)}%)`,
                  filter: "brightness(0.85) contrast(1.05)",
                  willChange: "transform",
                  animation: (gProgress > 0.99 && scrollProgress < 0.98) ? "autoPanBottom 20s linear infinite alternate" : "none",
                  "@keyframes autoPanBottom": {
                    "0%": { transform: "translateX(0%)" },
                    "100%": { transform: "translateX(-28.5714%)" },
                  },
                }}
              />
            </Box>
          </Box>
        )}

        {/* Primary Navy Layer (60% transparent) */}
        {gProgress > 0.01 && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              bgcolor: alpha(NOIR.navyField, 0.60),
              pointerEvents: "none",
              opacity: gProgress,
              transition: scrollProgress > 0 ? "none" : "opacity 0.8s ease-out",
            }}
          />
        )}

        {/* Flanking Text Elements (Appear during Smoking — vertical movement) */}
        {flankOp > 0.01 && (
          <>
            {/* Top Text: 7 YEARS OF EXCELLENCE — starts at center, moves upward */}
            <Box
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(-50%, calc(-50% + ${leftY.toFixed(1)}vh))`,
                opacity: flankOp,
                pointerEvents: "none",
                zIndex: 4,
                whiteSpace: "nowrap",
                textAlign: "center",
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
                  color: borderProgress >= 0.99 ? NOIR.gold : "#FFFFFF",
                  textShadow: "0 4px 20px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.8)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  transition: "color 0.15s ease-out",
                }}
              >
                7 YEARS OF EXCELLENCE
              </Typography>
            </Box>

            {/* Bottom Text: GENERATIONS OF COMPETITIVENESS — starts at center, moves downward */}
            <Box
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(-50%, calc(-50% + ${rightY.toFixed(1)}vh))`,
                opacity: flankOp,
                pointerEvents: "none",
                zIndex: 4,
                whiteSpace: "nowrap",
                textAlign: "center",
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
                  color: borderProgress >= 0.99 ? NOIR.gold : "#FFFFFF",
                  textShadow: "0 4px 20px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.8)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  transition: "color 0.15s ease-out",
                }}
              >
                GENERATIONS OF COMPETITIVENESS
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
            zIndex: 5,
            transform: `scale(${scaleVal.toFixed(3)})`,
            transformOrigin: "center center",
            // Disable CSS transform transitions when scroll-driven to eliminate layout lag
            transition: scrollProgress > 0 ? "none" : "transform 0.05s linear",
            bgcolor: gProgress > 0.05 ? "#FFFFFF" : "transparent",
            borderRadius: gProgress > 0.05 ? `${(gProgress * 24).toFixed(0)}px` : "0px",
            border: gProgress > 0.05 ? "1px solid rgba(0,0,0,0.08)" : "none",
            boxShadow: gProgress > 0.05 ? `0 24px 60px rgba(0,0,0,${(0.35 * gProgress).toFixed(2)})` : "none",
            maxWidth: gProgress > 0.05 ? "1600px" : "100%",
            maxHeight: gProgress > 0.05 ? "720px" : "100%",
            m: "auto",
            // Secondary border animation from top to bottom drawing after AT & PHITOPOLIS align
            "&::after": {
              content: '""',
              position: "absolute",
              inset: "-1px",
              border: "6px solid",
              borderColor: NOIR.gold,
              borderRadius: "inherit",
              pointerEvents: "none",
              clipPath: `polygon(0% 0%, 100% 0%, 100% ${(borderProgress * 100).toFixed(1)}%, 0% ${(borderProgress * 100).toFixed(1)}%)`,
              opacity: borderProgress > 0.01 ? 1 : 0,
              willChange: "clip-path, opacity",
            }
          }}
        >
          {/* Interactive Signal Canvas Layer (Grid, Signal lines, and cubes) */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 4,
              opacity: ready ? (reduced ? 0.4 : 0.95) : 0,
              transform: "none",
              transition: scrollProgress > 0 ? "none" : "opacity 2.4s ease-out",
            }}
          >
            <HeroSignalP progress={scrollProgress} />
          </Box>

          {/* Grouped P-Logo & AT Container (Linked crossfade on scroll) */}
          {scrollProgress >= CONTAINER_START && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: {
                  xs: "50%",
                  sm: "calc(50% - 220px)",
                  md: "calc(50% - 320px)",
                },
                transform: "translate(-50%, -50%)",
                width: "100%",
                maxWidth: { xs: "200px", sm: "280px", md: "380px" },
                height: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 6,
                pointerEvents: "none",
              }}
            >
              {/* Flat P Logo - fades out and slides down */}
              <Box
                component="img"
                src="/phitopolis_logo_hero.svg"
                alt=""
                sx={{
                  width: "100%",
                  height: "auto",
                  opacity: 1 - pExitVal,
                  transform: `translateY(${(pExitVal * 60).toFixed(1)}px) scale(${(1 - pExitVal * 0.15).toFixed(3)})`,
                  willChange: "opacity, transform",
                  transition: scrollProgress > 0 ? "none" : "opacity 0.3s ease-out, transform 0.3s ease-out",
                }}
              />

              {/* AT Text - fades in and slides down into view */}
              <Typography
                variant="h1"
                sx={{
                  position: "absolute",
                  fontWeight: 900,
                  fontSize: { xs: "2.8rem", sm: "4.5rem", md: "6rem" },
                  letterSpacing: "-0.04em",
                  color: NOIR.gold,
                  textShadow: "0 2px 10px rgba(0,0,0,0.15)",
                  opacity: atEnterVal,
                  transform: `translateY(${((1 - atEnterVal) * -60).toFixed(1)}px) scale(${(0.85 + atEnterVal * 0.15).toFixed(3)})`,
                  willChange: "opacity, transform",
                  transition: scrollProgress > 0 ? "none" : "opacity 0.3s ease-out, transform 0.3s ease-out",
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
              transition: scrollProgress > 0 ? "none" : "opacity 0.45s ease-out, left 0.3s ease-out",
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
                  transition: scrollProgress > 0 ? "none" : "transform 0.15s linear",
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
            opacity: ready ? panelOpacity(scrollProgress) : 0,
            transform: ready ? "translateY(0)" : "translateY(16px)",
            transition: `opacity 2.4s ${EASE_OUT_EXPO_CSS}, transform 2.4s ${EASE_OUT_EXPO_CSS}`,
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
            opacity: ready ? panelOpacity(scrollProgress) : 0,
            pointerEvents: ready ? panelPointerEvents(scrollProgress) : "none",
            transform: ready ? "translateY(0)" : "translateY(16px)",
            transition: `opacity 2.4s ${EASE_OUT_EXPO_CSS}, transform 2.4s ${EASE_OUT_EXPO_CSS}`,
            transitionDelay: ready ? "0.45s" : "0s",
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
                transition: `all 0.9s ${EASE_OUT_EXPO_CSS}`,
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
                  transition: "color 0.9s ease",
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
                transition: `all 0.9s ${EASE_OUT_EXPO_CSS}`,
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
                  transition: "color 0.9s ease",
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
                transition: `all 0.9s ${EASE_OUT_EXPO_CSS}`,
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
                  transition: "color 0.9s ease",
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
            opacity: ready ? panelOpacity(scrollProgress) : 0,
            transition: "opacity 2.4s ease-out",
            transitionDelay: ready ? "0.9s" : "0s",
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
              animation: "pulseBounce 7.2s ease-in-out infinite",
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
