import { Suspense, lazy, useCallback, useRef, useState, useEffect, useTransition } from "react";
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
import { HeroCanvas as LegacyHeroCanvas, type HeroCanvasHandle } from "./HeroCanvas";
import { WORDMARK_INSET_MD, WORDMARK_INSET_SM } from "./heroPlaneRenderer";
import { PlaygroundTabs } from "./playground/PlaygroundTabs";
import {
  DEFAULT_VARIANT_ID,
  VARIANTS,
  type PlaygroundVariantId,
} from "./playground/variants";
/**
 * The 3D PoC gallery.
 *
 * `React.lazy` keeps `three` + `@react-three/fiber` + `drei` out of the route chunk
 * and behind a dynamic import that only runs when someone flips the toggle, so a
 * visitor who never opens it pays nothing. Each of the four *scenes* is then lazy
 * again inside `playground/variants.ts`, so switching a tab fetches only that scene.
 *
 * `docs/hero-upgrade/README.md` standing rule 1 ("the 3D playground variant is out
 * of scope; `PlaygroundScene.tsx` and `R3FHeroCanvas.tsx` internals must show no
 * diff") is **retired as of this change** — the gallery IS the work now, and
 * `PlaygroundScene.tsx` is deleted. That file records the retirement.
 */
const R3FHeroCanvas = lazy(() =>
  import("./R3FHeroCanvas").then((m) => ({ default: m.R3FHeroCanvas })),
);
import { heroStage, heroVars, sameStage, writeHeroVars, type HeroStage } from "./heroVars";
import Switch from "@mui/material/Switch";
import { NOIR, DAWN } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { useReducedMotion, usePreloaderReady } from "@/shared/motion";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The hero holds for viewport height to give room for 3 logo phases,
 *  an empty dwell threshold, the gunshot transition, smoking drift, and AT PHITOPOLIS mini transformation. */
/** Pin distance: 1800% for the hero animation + 100% extra overlap window
 *  where the overlay sheet slides up over the still-pinned hero. */
/**
 * How tall the pin is.
 *
 * Was `+=1900%` — nineteen viewport heights of scroll for nine phases, most of it
 * buffer. The phase boundaries in `heroPhases.ts` are all *fractions* of the pin's
 * 0..1 progress, so shortening the pin moves none of them and every assertion in
 * `tests/motion/hero-phases.test.ts` holds unchanged; only the amount of wheel
 * travel each fraction costs the reader changes. Eight is still generous.
 */
const HERO_PIN_DISTANCE = "+=800%";

/** Session key remembering which gallery design was last open. */
const VARIANT_STORAGE_KEY = "phit:hero:poc-variant";

/**
 * The dark-room flip.
 *
 * The gallery scenes are staged in a near-black room (`PALETTE.navyInk`), and the
 * hero's own chrome is designed for a near-white card — navy headline, navy motto,
 * white pills. Left alone, turning the PoC on rendered navy text on black, which is
 * how the toggle shipped. These selectors invert the chrome for exactly as long as
 * the PoC is on.
 *
 * Static, and attached once to the container's `sx`: Emotion serialises this object
 * a single time at mount and the flip is then a lone attribute write, not a
 * restyle. Nothing here runs per frame, and no extra React state exists for it —
 * `use3D` is the only source of truth.
 *
 * Contrast, both directions, measured against the tokens in `palette.ts`:
 * `frost` on `navyInk` is 17.43:1; the pills invert to `navyField` text on `frost`,
 * which is the same pair the site already ships at 12.73:1.
 */
const PLAYGROUND_FLIP_SX = {
  '&[data-playground="on"]': {
    "& .hero-card": { backgroundColor: NOIR.navyInk },
    // The dawn sky is the thing that actually paints the card's interior — a
    // near-white horizontal gradient at `zIndex: 0`, sitting ON TOP of the card's
    // own `bgcolor`. Flipping the card without retiring this leaves the white
    // exactly where it was and the flip looks like it did nothing.
    "& .hero-sky": { opacity: 0 },
    "& .hero-motto, & .hero-wordmark": { color: NOIR.frost },
    "& .hero-eyebrow": { color: `rgba(${NOIR.frostRgb}, 0.72)` },
    "& .hero-chip": {
      backgroundColor: NOIR.navyInk,
      borderColor: `rgba(${NOIR.frostRgb}, 0.18)`,
    },
    "& .hero-chip-label": { color: NOIR.gold },
    "& .hero-pill": {
      backgroundColor: `rgba(${NOIR.frostRgb}, 0.08)`,
      boxShadow: "none",
      "& .btn-text": { color: NOIR.frost },
    },
  },
  "& .hero-card, & .hero-motto, & .hero-eyebrow, & .hero-chip, & .hero-pill": {
    transition: "background-color 0.32s ease, color 0.32s ease, border-color 0.32s ease",
  },
  "@media (prefers-reduced-motion: reduce)": {
    "& .hero-card, & .hero-motto, & .hero-eyebrow, & .hero-chip, & .hero-pill": {
      transition: "none",
    },
  },
} as const;
const ANIM_LIMIT = 700 / 800;

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
  borderRadius: "100px",
  textDecoration: "none !important",
  border: "none",
  backgroundColor: "#FFFFFF",
  boxShadow: "0 4px 16px rgba(10, 42, 102, 0.08)",
  transition: "all 0.25s ease",
  "&, & *": {
    textDecoration: "none !important",
  },
  "@media (hover: hover)": {
    "&:hover": {
      transform: "translateY(-2px)",
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
/**
 * Whether the "3D PoC" chip is offered in the hero.
 *
 * Off for now — the gallery is a developer affordance and is not something the
 * live hero should advertise. Flip to `true` to bring the chip back; the
 * gallery itself is untouched and still renders whenever `use3D` is on.
 */
const SHOW_3D_TOGGLE = false;

export function HeroSignalCore() {
  const pinRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  // Stage 4: the scaled card's own element — the sky/disc parallax publisher
  // target. A distinct ref from `containerRef` (the outer #hero box) so the
  // vars are written on the same element the sky Box is a direct child of.
  const cardRef = useRef<HTMLElement>(null);
  const canvasHandleRef = useRef<HeroCanvasHandle | null>(null);
  const reduced = useReducedMotion();
  const ready = usePreloaderReady();

  const [use3D, setUse3D] = useState(false);

  /**
   * Which gallery design is showing.
   *
   * Seeded from `sessionStorage` so flipping the toggle off and on, or navigating
   * away and back, returns you to the design you were looking at — the whole point
   * of the gallery is comparison, and losing your place on every toggle makes that
   * harder than it needs to be. Session, not local: this is a review affordance, not
   * a preference worth remembering next week.
   *
   * Every read is guarded. `sessionStorage` throws outright in a Safari private
   * window rather than returning null, and an unrecognised stored id (a variant
   * renamed since the tab was opened) has to fall back rather than render nothing.
   */
  const [variantId, setVariantId] = useState<PlaygroundVariantId>(() => {
    try {
      const stored = sessionStorage.getItem(VARIANT_STORAGE_KEY);
      if (stored && VARIANTS.some((v) => v.id === stored)) {
        return stored as PlaygroundVariantId;
      }
    } catch {
      /* private mode, or storage disabled. The default is a fine answer. */
    }
    return DEFAULT_VARIANT_ID;
  });

  /**
   * Tab switching runs inside a transition, so React keeps the *current* scene on
   * screen while the next one's chunk downloads instead of tearing the canvas down
   * to a Suspense fallback. `pendingId` is set synchronously alongside it because
   * `variantId` deliberately lags until the transition commits, and the strip needs
   * to show its loading state on the tab you actually clicked.
   */
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<PlaygroundVariantId | null>(null);

  // Derived, not stored-and-cleared. An effect that reset `pendingId` when
  // `isPending` went false would be a setState inside an effect — a second render
  // pass for a value that is a pure function of two things we already have. Gating
  // on `isPending` makes a stale `pendingId` unobservable, so there is nothing to
  // clean up.
  const loadingId = isPending ? pendingId : null;

  const selectVariant = useCallback(
    (id: PlaygroundVariantId) => {
      setPendingId(id);
      startTransition(() => setVariantId(id));
      try {
        sessionStorage.setItem(VARIANT_STORAGE_KEY, id);
      } catch {
        /* Losing the memory is not worth losing the interaction over. */
      }
    },
    [],
  );

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
    if (pinRef.current) {
      writeHeroVars(pinRef.current, heroVars(0, isReduced));
    }
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
          const p = Math.min(1.1, self.progress / ANIM_LIMIT);

          // Per-frame: one batch of custom-property writes. No React render.
          writeHeroVars(el, heroVars(p, false));
          if (pinRef.current) {
            writeHeroVars(pinRef.current, heroVars(p, false));
          }
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
        data-playground={use3D ? "on" : "off"}
        sx={{
          ...PLAYGROUND_FLIP_SX,
          position: "relative",
          height: "100vh",
          // `100%`, not `100vw`. `100vw` includes the scrollbar gutter, so this box
          // was ~10px wider than the header's container and everything positioned
          // against its right edge sat that far off the header's right edge. (It is
          // also the classic source of a phantom horizontal scrollbar; `overflowX:
          // clip` on `#home-main` was hiding that rather than preventing it.)
          width: "100%",
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
                src="/images/topHalfHero.webp"
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
                src="/images/botHalfHero.webp"
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
                mixBlendMode: "difference",
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
                mixBlendMode: "difference",
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
          ref={cardRef}
          className="hero-card"
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
          {/*
            The dawn ground. Lives INSIDE this card — the card is opaque
            (bgcolor: NOIR.void) and full-bleed at progress 0, so anything
            placed behind it is invisible (see "the one hard structural
            fact" in docs/hero-upgrade/stage-4.md). Still no image assets:
            two `background-image` layers on one Box.

            REPLACES the six-stop vertical DAWN gradient. That gradient ran
            zenith -> ember top to bottom and filled the frame, which made
            the card read as *sky*; the brief is a card that reads as
            *white*, ~70% of it, with the dawn arriving from the left. Two
            changes carry that:

              1. The sun moved from `82% 20%` (right) to `10% 30%` (left),
                 and its shine is now a wide, weak warm wash rather than a
                 hard disc. `--hp-sun` still scales the gold core, so
                 `sunAltitude()` drives it exactly as before.
              2. The base gradient runs *horizontally* (100deg), warm at the
                 left edge and pure white by ~62% across, instead of
                 vertically through six saturated stops.

            The canvas city's own light agrees with this by construction:
            `heroCity.ts`'s SHADOW_DIR points along +(1,1) in plane space,
            which the -45deg camera maps to screen-right — i.e. away from
            this sun. One light source, two layers, no disagreement.

            No clouds. `DAWN.cloudMid`/`cloudLo` are deliberately unused
            here; see the decision log.

            Parallax: each layer gets its own `background-position` offset
            off the same `--hp-mx`/`--hp-my` the canvas's pointer lerp
            publishes onto `cardRef` — sun 8px (front-most), wash 3px.
            `backgroundSize` is padded past 100% so parallax travel never
            exposes an edge.

            Fully gone by CONTAINER_START: opacity is `var(--hp-sky, 1)`,
            and skyPresence(CONTAINER_START) === 0 exactly (pinned in
            tests/motion/hero-phases.test.ts), so the card interior returns
            to pure NOIR.void — byte-identical to what GroundLayer already
            paints behind it at that point in the pin.
          */}
          <Box
            aria-hidden
            className="hero-sky"
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              opacity: "var(--hp-sky, 1)",
              backgroundImage: [
                `radial-gradient(circle at 8% 26%, rgba(${NOIR.goldRgb}, calc(0.26 * var(--hp-sun, 1))) 0%, rgba(${DAWN.warmRgb}, 0.20) 11%, rgba(${DAWN.warmRgb}, 0.07) 26%, rgba(${DAWN.warmRgb}, 0.00) 44%)`,
                `linear-gradient(100deg, ${DAWN.haze} 0%, ${NOIR.void} 22%, ${NOIR.white} 52%)`,
              ].join(", "),
              backgroundRepeat: "no-repeat, no-repeat",
              backgroundSize: "150% 150%, 108% 108%",
              backgroundPosition:
                "calc(10% + var(--hp-mx, 0) * 8px) calc(30% + var(--hp-my, 0) * 8px), calc(50% + var(--hp-mx, 0) * 3px) calc(50% + var(--hp-my, 0) * 3px)",
            }}
          />

          {/* The city: streets, buildings, dawn shadows, signal pulses and the P
              mark's own district — one canvas, no DOM per scene object. */}
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
            {use3D ? (
              <Suspense fallback={null}>
                <R3FHeroCanvas
                  handleRef={canvasHandleRef}
                  varsHostRef={cardRef}
                  variantId={variantId}
                />
              </Suspense>
            ) : (
              <LegacyHeroCanvas handleRef={canvasHandleRef} varsHostRef={cardRef} />
            )}
          </Box>

          {/*
            The stage-4 in-card vignette used to live here: a centred ellipse
            darkening the frame's edges toward `DAWN.cloudLo`. It is gone.

            It existed to give a saturated six-stop sky somewhere to fall off
            to. Against a ground that is now ~70% white it did the opposite of
            its job — a grey ring around a white card reads as a rendering
            artifact, and it fought the one thing the composition is built on,
            which is that the light comes from a single point off the left
            edge and nowhere else. A vignette is light coming from everywhere
            at once.

            Not replaced. The density mask in `heroCity.ts` already fades the
            lattice toward the plane's margins, so the field has no visible
            rectangular boundary without painting one.
          */}


          {/* PHITOPOLIS Word Transition — Phase 3 & Shift Left in Sub-Phase 2 */}
          <Box
            sx={{
              position: "absolute",
              top: { xs: "calc(50% + 90px)", sm: "50%", md: "50%" },
              // These two insets are half of a lockup: the canvas solves the P's
              // travel against them so the mark lands a fixed gap to their left
              // (see `LOCKUP_GAP` in heroPlaneRenderer.ts). Import them rather than
              // restating the numbers — a silent drift here collides the two.
              left: {
                xs: "50%",
                sm: `calc(50% - ${WORDMARK_INSET_SM}px)`,
                md: `calc(50% - ${WORDMARK_INSET_MD}px)`,
              },
              width: "auto",
              textAlign: { xs: "center", sm: "left" },
              zIndex: 5,
              overflow: "hidden",
              clipPath: "inset(0 0 0 0)",
              opacity: "var(--hp-word, 0)",
              // Stage 4 fix (README open question, assigned here): this box sits
              // at plane centre and was swallowing pointer events even while
              // invisible (opacity driven by --hp-word, which is 0 for most of
              // the pin), killing cursor interaction with the canvas underneath
              // over the middle of the scene. The wordmark inside is decorative
              // for sighted users and load-bearing only for crawlers (aria-label
              // "Phitopolis" on the h1) — it must never take input.
              pointerEvents: "none",
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
                className="hero-wordmark"
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


        {/* Plain Navy Radial Vignette */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            pointerEvents: "none",
            background: "radial-gradient(ellipse at center, transparent 60%, rgba(10, 42, 102, 0.15) 100%)",
            opacity: "var(--hp-panel, 1)",
          }}
        />

        {/* Toggle Switch */}
        {SHOW_3D_TOGGLE && (
        <Box
          className="hero-chip"
          sx={{
            position: "absolute",
            // Desktop only. At 375px it sat on top of the three-line headline —
            // the chip is a developer affordance, and covering the page's single
            // most important line to expose it is the wrong trade at any width.
            // A WebGL playground is also the last thing a phone wants offered.
            display: { xs: "none", md: "flex" },
            top: 84,
            // Shares the header toolbar's own gutter so the chip's right edge lines
            // up with the menu button's, rather than floating on an unrelated inset.
            // Measured before this change: menu right edge 1246, chip right edge
            // 1208 at a 1280 viewport — 38px adrift, and visibly so once the header
            // compacts into its white button.
            right: { md: 24, lg: 24 },
            zIndex: 10,
            opacity: ready ? "var(--hp-panel, 1)" : 0,
            transition: `opacity 2.4s ${EASE_OUT_EXPO_CSS}`,
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 0.75,
            borderRadius: "9999px",
            border: `1px solid rgba(10, 42, 102, 0.15)`,
            // Opaque, not translucent-with-blur. These two `backdrop-filter`
            // declarations were the hero's last two blur layers, against a
            // standing target of zero (docs/hero-upgrade/README.md rule 5, and
            // the perf-baseline table). Over a ground that is now ~70% white
            // there is nothing behind the chip worth blurring, so raising the
            // fill to full opacity costs nothing visually and retires the rule's
            // last violation.
            backgroundColor: NOIR.void,
            boxShadow: "0 4px 16px rgba(10, 42, 102, 0.06)",
          }}
        >
          <Typography
            className="hero-chip-label"
            sx={{
              fontFamily: MONO,
              fontSize: "0.7rem",
              color: use3D ? NOIR.gold : NOIR.navyField,
              fontWeight: "bold",
              letterSpacing: "0.12em",
              userSelect: "none",
              lineHeight: 1,
            }}
          >
            3D PoC
          </Typography>
          <Switch
            checked={use3D}
            onChange={(e) => setUse3D(e.target.checked)}
            size="small"
            sx={{
              margin: 0,
              padding: 0,
              width: 32,
              height: 18,
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              // The thumb is centred by padding on the (absolutely positioned)
              // switchBase, not by a margin. A margin here left the 14px thumb
              // hanging off the track's baseline — the switchBase is pinned to
              // the root's top-left, so only its own padding box actually moves
              // the thumb, and 2px of padding is the exact (18 - 14) / 2 inset.
              "& .MuiSwitch-switchBase": {
                padding: "2px",
                margin: 0,
                transitionDuration: "250ms",
                color: "rgba(10, 42, 102, 0.6)",
                "&.Mui-checked": {
                  transform: "translateX(14px)",
                  color: "#ffffff",
                  "& + .MuiSwitch-track": {
                    backgroundColor: NOIR.gold,
                    opacity: 1,
                    border: 0,
                  },
                },
              },
              "& .MuiSwitch-thumb": {
                boxSizing: "border-box",
                width: 14,
                height: 14,
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              },
              "& .MuiSwitch-track": {
                borderRadius: 9,
                backgroundColor: "rgba(10, 42, 102, 0.15)",
                opacity: 1,
                transition: "background-color 250ms",
              },
            }}
          />
        </Box>
        )}

        {/* The gallery's tab strip. Mounted only while the PoC is on — there is
            nothing to switch between otherwise, and an empty tablist is worse than
            no tablist. */}
        {use3D && (
          <PlaygroundTabs
            activeId={variantId}
            onSelect={selectVariant}
            loadingId={loadingId}
          />
        )}

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
            className="hero-motto"
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
            className="hero-eyebrow"
            sx={{
              fontFamily: MONO,
              fontSize: "0.65rem",
              fontWeight: 800,
              letterSpacing: "0.16em",
              color: NOIR.navyField,
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
              className="hero-pill"
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
              className="hero-pill"
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
              className="hero-pill"
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
