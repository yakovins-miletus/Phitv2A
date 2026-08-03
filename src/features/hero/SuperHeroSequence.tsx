import { useRef, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CONTENT } from "@/shared/content";
import { RouterLink } from "@/shared/components/RouterLink";
import { StageSection, useStagePresence } from "@/shared/components/StageSection";
import { STAGE_ATTR, homeSection } from "@/shared/sections";
import { NAV_ANCHORS, useNavbar } from "@/shared/components/NavbarContext";
import { HeroCanvas, type HeroCanvasHandle } from "./HeroCanvas";
import { heroStage, heroVars, sameStage, writeHeroVars, type HeroStage } from "./heroVars";
import { NOIR } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { useReducedMotion, usePreloaderReady } from "@/shared/motion";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The hero holds for viewport height to give room for 3 logo phases,
 *  an empty dwell threshold, the gunshot transition, smoking drift, and AT PHITOPOLIS mini transformation. */
const HERO_PIN_DISTANCE = "+=3000%";

// Stage 01: Hero Signal Core Landing Stage (Pinned scroll sequence with 3D-to-2D transition)
//
// Scroll drives this sequence WITHOUT React state. `onUpdate` writes CSS custom
// properties onto the hero container and pushes progress into the canvas through an
// imperative handle; every `sx` below is a static object that reads `var(--hp-*)`, so
// Emotion serializes each rule once at mount instead of re-injecting it per frame.
// Only the coarse `stage` — nine booleans that flip ~4 times across the whole pin —
// lives in state, because conditional mounts cannot be expressed in CSS.
//
// Before this change one scroll pass injected 1,335 stylesheet rules and dropped 32% of
// frames; see docs/perf-baseline.md.
export function HeroSignalCore() {
  const pinRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const canvasHandleRef = useRef<HeroCanvasHandle | null>(null);
  const reduced = useReducedMotion();
  const ready = usePreloaderReady();

  const [stage, setStage] = useState<HeroStage>(() => heroStage(0, reduced === true));
  const stageRef = useRef(stage);

  useStagePresence(containerRef, "hero");
  const { registerAnchor } = useNavbar();

  useEffect(() => {
    if (stage.navActive) {
      registerAnchor(NAV_ANCHORS.HERO_GUNSHOT, true, stage.navDark);
    } else {
      registerAnchor(NAV_ANCHORS.HERO_GUNSHOT, false, false);
    }
    return () => {
      registerAnchor(NAV_ANCHORS.HERO_GUNSHOT, false, false);
    };
  }, [stage.navActive, stage.navDark, registerAnchor]);

  // Seed the custom properties before first paint so the hero renders its settled state
  // even if no scroll ever happens (reduced motion, or a user who never scrolls).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isReduced = reduced === true;
    writeHeroVars(el, heroVars(0, isReduced));
    const next = heroStage(0, isReduced);
    stageRef.current = next;
    setStage(next);
  }, [reduced]);

  useGSAP(
    () => {
      if (reduced) return;

      const el = containerRef.current;
      if (!el) return;

      ScrollTrigger.create({
        trigger: pinRef.current,
        start: "top top",
        end: HERO_PIN_DISTANCE,
        scrub: 0.6,
        pin: true,
        onUpdate: (self) => {
          const p = self.progress;

          // Per-frame: one batch of custom-property writes. No React render.
          writeHeroVars(el, heroVars(p, false));
          canvasHandleRef.current?.setProgress(p);

          // Coarse state: only commit when a boolean actually flips, which happens
          // roughly four times across the entire 30-viewport pin.
          const next = heroStage(p, false);
          if (!sameStage(stageRef.current, next)) {
            stageRef.current = next;
            setStage(next);
          }
        },
      });
    },
    { scope: pinRef }
  );

  // Every continuous value now lives in a CSS custom property written by the driver
  // above (see heroVars.ts). Nothing below recomputes per frame.

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
        {stage.gunshot && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              pointerEvents: "none",
              overflow: "hidden",
              opacity: "var(--hp-g, 0)",
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
                component="img" decoding="async"
                src="/images/topHalfHero.jpg"
                alt=""
                sx={{
                  width: "140%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "brightness(0.85) contrast(1.05)",
                  willChange: "transform",
                  animation: "autoPanTop 25s linear infinite alternate",
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
                component="img" decoding="async"
                src="/images/botHalfHero.jpg"
                alt=""
                sx={{
                  width: "140%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "brightness(0.85) contrast(1.05)",
                  willChange: "transform",
                  animation: "autoPanBottom 25s linear infinite alternate",
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
        {stage.gunshot && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              bgcolor: alpha(NOIR.navyField, 0.60),
              pointerEvents: "none",
              opacity: "var(--hp-g, 0)",
            }}
          />
        )}

        {/* Flanking Text Elements (Appear during Smoking — vertical movement) */}
        {stage.flank && (
          <>
            {/* Top Text: 7 YEARS OF EXCELLENCE — starts at center, moves upward */}
            <Box
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, calc(-50% + var(--hp-lefty, 0) * 1vh))",
                opacity: "var(--hp-flank, 0)",
                pointerEvents: "none",
                zIndex: 4,
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "0.75rem", sm: "1.05rem", md: "1.35rem" },
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: stage.borderDone ? NOIR.gold : "#FFFFFF",
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
                transform: "translate(-50%, calc(-50% + var(--hp-righty, 0) * 1vh))",
                opacity: "var(--hp-flank, 0)",
                pointerEvents: "none",
                zIndex: 4,
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "0.75rem", sm: "1.05rem", md: "1.35rem" },
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: stage.borderDone ? NOIR.gold : "#FFFFFF",
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
            transform: "scale(var(--hp-scale, 1))",
            transformOrigin: "center center",
            // The card chrome switches once, at a threshold, instead of being recomputed
            // per frame. borderRadius and the shadow's alpha still track --hp-g smoothly.
            bgcolor: stage.chrome ? "#FFFFFF" : "transparent",
            borderRadius: stage.chrome ? "calc(var(--hp-g, 0) * 24px)" : "0px",
            border: stage.chrome ? "1px solid rgba(0,0,0,0.08)" : "none",
            boxShadow: stage.chrome
              ? "0 24px 60px rgba(0, 0, 0, calc(0.35 * var(--hp-g, 0)))"
              : "none",
            maxWidth: stage.chrome ? "1600px" : "100%",
            maxHeight: stage.chrome ? "720px" : "100%",
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
              clipPath:
                "polygon(0% 0%, 100% 0%, 100% calc(var(--hp-border, 0) * 100%), 0% calc(var(--hp-border, 0) * 100%))",
              opacity: "var(--hp-border, 0)",
              willChange: "clip-path",
            }
          }}
        >
          {/* Interactive Signal Canvas Layer (Grid, Signal lines, cubes, service nodes,
              and the extruded P mark) — one canvas replacing ~250 DOM nodes. */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 4,
              opacity: ready ? (reduced ? 0.4 : 0.95) : 0,
              // One short fade instead of the old 2.4s + 4.5s + 4.8s stack, which took
              // ~4.8s to resolve and made the scene look like it was loading piecemeal.
              transition: "opacity 0.6s ease-out",
            }}
          >
            <HeroCanvas handleRef={canvasHandleRef} />
          </Box>



          {/* PHITOPOLIS Word Transition — Phase 3 & Shift Left in Sub-Phase 2 */}
          <Box
            sx={{
              position: "absolute",
              top: { xs: "calc(50% + 90px)", sm: "50%", md: "50%" },
              left: {
                xs: "50%",
                sm: "calc(50% - (60px + var(--hp-tight, 0) * 90px))",
                md: "calc(50% - (80px + var(--hp-tight, 0) * 110px))",
              },
              width: "auto",
              textAlign: { xs: "center", sm: "left" },
              zIndex: 5,
              overflow: "hidden",
              clipPath: "inset(0 0 0 0)",
              opacity: "var(--hp-word, 0)",
              pointerEvents: "auto",
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
                  transform: "translateY(calc(var(--hp-wordlift, 0) * 1%))",
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
            opacity: ready ? "var(--hp-panel, 1)" : 0,
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
            opacity: ready ? "var(--hp-panel, 1)" : 0,
            pointerEvents: ready && stage.panelInteractive ? "auto" : "none",
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
            opacity: ready ? "var(--hp-panel, 1)" : 0,
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
