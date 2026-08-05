import { useRef, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { RouterLink } from "@/shared/components/RouterLink";
import { useStagePresence } from "@/shared/components/StageSection";
import { STAGE_ATTR, setActiveSection } from "@/shared/sections";
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
/** Pin distance: 1800% for the hero animation + 100% extra overlap window
 *  where the overlay sheet slides up over the still-pinned hero. */
const HERO_PIN_DISTANCE = "+=1900%";
const ANIM_LIMIT = 1800 / 1900;

/**
 * The three directory link pills below the hero card.
 *
 * These were three byte-identical 17-line `sx` blocks — a repeated treatment, so it
 * earns a token rather than a third copy. Glass is safe here: the pills are siblings
 * of the scaled card, not children of it, so nothing re-samples their backdrop per
 * frame. (Anything *inside* the pin must stay opaque — see the note on the card's own
 * bgcolor.)
 *
 * The old `transition: all 0.9s` is gone twice over: `all` swept in `backdrop-filter`,
 * which recomputes the blur on every frame of the transition, and 0.9s is nearly three
 * times the interaction ceiling.
 */
const LINK_PILL_SX = {
  borderRadius: "var(--r-control)",
  textDecoration: "none !important",
  border: `1px solid rgba(10, 42, 102, 0.28)`,
  backgroundColor: "rgba(244, 247, 252, 0.92)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  boxShadow: "0 4px 16px rgba(10, 42, 102, 0.08)",
  transition: "all 0.25s ease",
  "&, & *": {
    textDecoration: "none !important",
  },
  "@media (hover: hover)": {
    "&:hover": {
      transform: "translateY(-2px)",
      borderColor: NOIR.gold,
      backgroundColor: NOIR.navyField,
      boxShadow: `0 4px 20px rgba(10, 42, 102, 0.25), 0 0 12px ${NOIR.gold}40`,
      "& .btn-text": {
        color: `${NOIR.gold} !important`,
      },
    },
  },
  "&:active": { transform: "translateY(0)" },
  "@media (prefers-reduced-motion: reduce)": {
    "&:hover, &:active": { transform: "none" },
  },
} as const;

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
          // Clamp so animations complete at 1800/1900 of the pin.
          // The final 100vh of pin time is dead air for the overlay transition.
          const p = Math.min(1.0, self.progress / ANIM_LIMIT);

          // Per-frame: one batch of custom-property writes. No React render.
          writeHeroVars(el, heroVars(p, false));
          canvasHandleRef.current?.setProgress(p);

          // Parallax drift: during the overlap phase (progress > ANIM_LIMIT),
          // translate the hero content upward at ~30% of the scroll rate.
          // This makes the hero appear to recede slowly while the overlay
          // sheet slides over it at full scroll speed — true parallax.
          if (self.progress > ANIM_LIMIT) {
            const overlapT = (self.progress - ANIM_LIMIT) / (1 - ANIM_LIMIT);
            const drift = overlapT * -30; // up to -30vh upward drift
            el.style.transform = `translateY(${drift}vh)`;
          } else {
            el.style.transform = "";
          }

          // Update active section ID dynamically to match the current phase
          if (p < 0.20) {
            setActiveSection("hero-flatten");
          } else if (p < 0.35) {
            setActiveSection("hero-align");
          } else if (p < 0.50) {
            setActiveSection("hero-reveal");
          } else if (p < 0.60) {
            setActiveSection("hero-dwell");
          } else {
            setActiveSection("hero");
          }

          // Coarse state: only commit when a boolean actually flips, which happens
          // roughly four times across the whole 30-viewport pin.
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
          // The centre stop was an opaque `#FFFFFF`, which made the hero its own
          // ground and produced the hard cut into the mission section below it.
          // GroundLayer owns the hero's ground (`base`) now, so this is only the
          // vignette — transparent in the middle, darkening toward the edges — and
          // the ground can interpolate into `deep` below instead of switching.
          //
          // The tint inverted with the palette: it used to be navy-at-low-alpha
          // darkening a white page, and is now black darkening a dark one.
          // Standard plain black radial vignette: transparent 60% -> rgba(0,0,0,0.40) at 100%
          background: "radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.40) 100%)",
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
                borderBottom: "1px solid rgba(10, 42, 102, 0.15)",
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
                  filter: "brightness(0.92) contrast(1.02)",
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
                borderTop: "1px solid rgba(10, 42, 102, 0.15)",
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
                  filter: "brightness(0.92) contrast(1.02)",
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

        {/* Primary Soft Overlay during Gunshot (80% opacity overlay) */}
        {stage.gunshot && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              bgcolor: alpha(NOIR.navyField, 0.80),
              pointerEvents: "none",
            }}
          />
        )}

        {/* Flanking Text Elements (Appear during Smoking — vertical movement) */}
        {stage.flank && (
          <>
            {/* Top Text: 7 YEARS OF EXCELLENCE — 2 rows fitting top 50vh, vertically centered */}
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: "50vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                // Translate using a tighter drift parameter to keep it centered on its half
                transform: "translateY(calc(var(--hp-lefty, 0) * 0.45vh))",
                opacity: "var(--hp-flank, 0)",
                pointerEvents: "none",
                zIndex: 4,
                overflow: "hidden",
                px: { xs: 2, md: 4 },
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "clamp(1.8rem, 6.2vw, 5.0rem)", md: "clamp(4.2rem, 7.8vw, 7.5rem)" },
                  fontWeight: 950,
                  lineHeight: 0.9,
                  letterSpacing: "-0.03em",
                  textTransform: "uppercase",
                  background: `linear-gradient(90deg, ${NOIR.gold} calc(var(--hp-border, 0) * 100%), rgba(255, 255, 255, 0.98) calc(var(--hp-border, 0) * 100%))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 6px 24px rgba(6, 24, 59, 0.85))",
                  textAlign: "center",
                }}
              >
                7 YEARS OF
              </Typography>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "clamp(1.8rem, 6.2vw, 5.0rem)", md: "clamp(4.2rem, 7.8vw, 7.5rem)" },
                  fontWeight: 950,
                  lineHeight: 0.9,
                  letterSpacing: "-0.03em",
                  textTransform: "uppercase",
                  background: `linear-gradient(90deg, ${NOIR.gold} calc(var(--hp-border, 0) * 100%), rgba(255, 255, 255, 0.98) calc(var(--hp-border, 0) * 100%))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 6px 24px rgba(6, 24, 59, 0.85))",
                  textAlign: "center",
                }}
              >
                EXCELLENCE
              </Typography>
            </Box>

            {/* Bottom Text: GENERATIONS OF COMPETITIVENESS — 2 rows fitting bottom 50vh, vertically centered */}
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "50vh",
                height: "50vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                // Translate using a tighter drift parameter to keep it centered on its half
                transform: "translateY(calc(var(--hp-righty, 0) * 0.45vh))",
                opacity: "var(--hp-flank, 0)",
                pointerEvents: "none",
                zIndex: 4,
                overflow: "hidden",
                px: { xs: 2, md: 4 },
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "clamp(1.8rem, 6.2vw, 5.0rem)", md: "clamp(4.2rem, 7.8vw, 7.5rem)" },
                  fontWeight: 950,
                  lineHeight: 0.9,
                  letterSpacing: "-0.03em",
                  textTransform: "uppercase",
                  background: `linear-gradient(90deg, ${NOIR.gold} calc(var(--hp-border, 0) * 100%), rgba(255, 255, 255, 0.98) calc(var(--hp-border, 0) * 100%))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 6px 24px rgba(6, 24, 59, 0.85))",
                  textAlign: "center",
                }}
              >
                GENERATIONS OF
              </Typography>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "clamp(1.8rem, 6.2vw, 5.0rem)", md: "clamp(4.2rem, 7.8vw, 7.5rem)" },
                  fontWeight: 950,
                  lineHeight: 0.9,
                  letterSpacing: "-0.03em",
                  textTransform: "uppercase",
                  background: `linear-gradient(90deg, ${NOIR.gold} calc(var(--hp-border, 0) * 100%), rgba(255, 255, 255, 0.98) calc(var(--hp-border, 0) * 100%))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 6px 24px rgba(6, 24, 59, 0.85))",
                  textAlign: "center",
                }}
              >
                COMPETITIVENESS
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
            transform: "scale(calc(1.0 - (1.0 - var(--hp-scale, 1)) * 1.15))",
            transformOrigin: "center center",
            /**
             * Soft primary color with ~98% whiter ground (NOIR.void - #F4F7FC),
             * synced with webpage background color.
             */
            bgcolor: NOIR.void,
            borderRadius: "calc(var(--hp-g, 0) * 24px)",
            border: "1px solid rgba(10,42,102,calc(0.12 * var(--hp-g, 0)))",
            boxShadow: "0 20px 50px rgba(10, 42, 102, calc(0.12 * var(--hp-g, 0)))",
            maxWidth: "100%",
            maxHeight: "100%",
            m: "auto",
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
                sm: "calc(50% - 65px)",
                md: "calc(50% - 95px)",
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
                  color: NOIR.navyField,
                  transform: "translateY(calc(var(--hp-wordlift, 0) * 1%))",
                }}
              >
                PH<Box component="span" sx={{ color: NOIR.gold }}>IT</Box>OPOLIS
              </Typography>
            </Box>
          </Box>
        </Box>


        {/* Plain Black Radial Vignette */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            pointerEvents: "none",
            background: "radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.40) 100%)",
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
              fontWeight: 800,
              letterSpacing: "0.16em",
              color: NOIR.navyField,
              textTransform: "uppercase",
            }}
          >
            EXPLORE PHITOPOLIS // DIRECTORY | (PoC Draft, yet to be presentable)
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
                ...LINK_PILL_SX,
              }}
            >
              <Typography
                className="btn-text"
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  color: NOIR.navyField,
                  textTransform: "uppercase",
                  transition: "color var(--dur) var(--ease-out)",
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
                ...LINK_PILL_SX,
              }}
            >
              <Typography
                className="btn-text"
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  color: NOIR.navyField,
                  textTransform: "uppercase",
                  transition: "color var(--dur) var(--ease-out)",
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
                ...LINK_PILL_SX,
              }}
            >
              <Typography
                className="btn-text"
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  color: NOIR.navyField,
                  textTransform: "uppercase",
                  transition: "color var(--dur) var(--ease-out)",
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

// Appended Section right after the hero page: Immersive Executive Sales Pitch Section
/**
 * The hero.
 *
 * This used to also render `HeroDescriptionSection` — a pinned 100vh four-beat deck
 * that lived below the signal core. Those beats are now three real scrolling
 * sections under `./description/`, rendered by the route rather than nested here,
 * so each can own its ground and choreo and none of them depends on a scroll pin to
 * become reachable.
 */
export function SuperHeroSequence() {
  return <HeroSignalCore />;
}
