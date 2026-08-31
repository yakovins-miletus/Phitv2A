/**
 * Closing Lattice
 *
 * The page's final beat: the closing statement ("We create exciting
 * technologies") builds in word-by-word on a right-hand stage, recedes with
 * depth, then hands off to a single CTA card ("Start a Conversation" ->
 * /contact) that rises into the same stage. Headline and CTA never share an
 * opacity window.
 *
 * The closure `HeroCanvas` sits behind everything as atmosphere: the P is held
 * SOLID and 3D (canvas progress pinned at 0 — never the particle-converge
 * window), the camera holds a moderate pull-back so the extended node lattice
 * reads wide, a radial mask dissolves the outermost nodes into the frame, and a
 * navy vignette fades in as the viewer scrolls past the "In closing" header.
 *
 * Three render modes:
 *   A. Desktop scrub  (md+ and not reduced) — one pinned ScrollTrigger; the
 *      headline + CTA share one right-hand grid cell; a scrubbed GSAP timeline
 *      drives per-word / recede / rise motion + a subtle canvas drift while
 *      pure-math `onUpdate` writes `--closure-*` custom props. Zero React
 *      re-renders.
 *   B. Mobile static  (down("md"), not reduced) — bespoke single-column stack
 *      with a compact closure canvas band, no ScrollTrigger.
 *   C. Reduced motion (any width) — the settled final frame, headline wrapper
 *      hidden, CTA lit and interactive immediately.
 */

import { useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Link } from "@tanstack/react-router";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

import { CONTENT } from "@/shared/content";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";
import { sectionOrder } from "@/shared/sections";
import { HeroCanvas, type HeroCanvasHandle } from "@/features/hero/HeroCanvas";
import {
  CLOSING_PIN_VH,
  CLOSURE_DRIFT_X_FROM,
  CLOSURE_DRIFT_X_TO,
  CLOSURE_DRIFT_Y_FROM,
  CLOSURE_DRIFT_Y_TO,
  CLOSURE_ZOOM_HOLD,
  CTA_IN_END,
  CTA_IN_START,
  EYEBROW_IN_END,
  EYEBROW_IN_START,
  HEADLINE_OUT_END,
  HEADLINE_OUT_START,
  WORD_IN_START,
  WORD_IN_END,
  ctaOpacityFor,
  ctaPointerFor,
  headlineOpacityFor,
  vignetteOpacityFor,
} from "./closingPhases";

// Register plugins once at module load
gsap.registerPlugin(ScrollTrigger, SplitText);

/** Navy radial vignette — copied from the hero's treatment
 *  (`SuperHeroSequence.tsx`) but lighter, so it never fights the navy headline
 *  sitting in the (transparent) core. Shared by Mode A (scroll-driven opacity)
 *  and Mode C (static). */
const CLOSURE_VIGNETTE_BG =
  "radial-gradient(ellipse 66% 68% at 48% 50%, transparent 30%, " +
  "rgba(10, 42, 102, 0.14) 58%, rgba(10, 42, 102, 0.4) 82%, rgba(10, 42, 102, 0.62) 100%)";

/** Single-stop radial alpha mask on the closure canvas layer — the outermost
 *  lattice nodes dissolve softly into the frame instead of hard-clipping at the
 *  canvas rect. Single stop → `sx` is safe (no `mask-composite`). */
const CLOSURE_CANVAS_MASK =
  "radial-gradient(ellipse 55% 60% at 50% 50%, #000 12%, transparent 100%)";

/**
 * Closing scrub phase model — a six-beat "cinematic hand-off" across a 2.6vh
 * pin. The full phase table + the pure ramp math live in `./closingPhases.ts`;
 * this component only wires them to a ScrollTrigger.
 *
 *   1 P settles → 2 headline builds word-by-word → 3 hold → 4 headline recedes
 *   with depth → (disjoint gap) → 5 CTA card rises + scales in → 6 settled.
 *
 * Two mechanisms on ONE ScrollTrigger, both zero React re-render:
 *   • pure-math `onUpdate` → CSS custom props + imperative canvas pushes. Owns
 *     the disjointness contract (headline vs CTA opacity never both > 0), the
 *     pointer gate, and the canvas `setProgress` / `setZoomProgress`.
 *   • a scrubbed `gsap.timeline` (`animation: tl`) → per-word SplitText rise +
 *     blur clear, eyebrow fade, headline recede (scale/y/blur), CTA rise
 *     (y/scale/blur). Tween positions match the p-values in `closingPhases.ts`.
 *
 * `closing` is a `bare` (`ownsPin`) beat, so the SectionBeat `fromTo` invariant
 * does not bind here — but its spirit holds: the CSS-var fallbacks below bias to
 * the lit/settled state so a never-firing trigger still shows a usable CTA.
 */

/**
 * The CTA card — the last thing on the page and the primary conversion.
 * Same navy-glass / gold-accent styling in every mode; the wrapper `style`
 * (opacity + pointer-events) and the surrounding layout differ per mode.
 */
function ClosingCtaCard({
  fullWidth = false,
  style,
}: {
  fullWidth?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <Box
      style={style}
      sx={{
        position: "relative",
        width: fullWidth ? "100%" : "auto",
        maxWidth: fullWidth ? 560 : 460,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2.5,
        p: { xs: 3, sm: 3.5, md: 4.5 },
        borderRadius: "28px",
        bgcolor: "rgba(6, 18, 38, 0.94)",
        border: "1px solid rgba(255, 199, 44, 0.22)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 24px 70px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 199, 44, 0.06) inset",
        overflow: "hidden",
      }}
    >
      {/* Faint gold glow anchored to the top-left corner. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: -60,
          left: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,199,44,0.16) 0%, rgba(255,199,44,0) 70%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontFamily: MONO,
          fontSize: "0.7rem",
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: NOIR.gold,
        }}
      >
        <Box sx={{ width: 16, height: "1px", bgcolor: NOIR.gold }} />
        Let&apos;s Build Together
      </Box>

      <Box>
        <Typography
          variant="h3"
          component="h3"
          sx={{
            fontSize: { xs: "1.5rem", sm: "1.9rem", md: "2.25rem" },
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            fontWeight: 800,
            color: NOIR.white,
            mb: 1.25,
          }}
        >
          {CONTENT.closing.statement}
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: "0.88rem", md: "0.95rem" },
            lineHeight: 1.5,
            color: NOIR.frost,
            opacity: 0.85,
          }}
        >
          {CONTENT.closing.subline}
        </Typography>
      </Box>

      <Box
        component={Link}
        to="/contact"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.25,
          px: 4,
          py: 1.85,
          mt: 0.5,
          bgcolor: NOIR.gold,
          color: NOIR.navyField,
          fontFamily: MONO,
          fontSize: "0.8rem",
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          borderRadius: "100px",
          textDecoration: "none",
          whiteSpace: "nowrap",
          boxShadow: "0 8px 24px rgba(255, 199, 44, 0.25)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
          "&:hover": {
            bgcolor: NOIR.white,
            transform: "scale(1.03)",
            boxShadow: "0 10px 30px rgba(255, 199, 44, 0.35)",
          },
        }}
      >
        {CONTENT.closing.farewell} →
      </Box>
    </Box>
  );
}

/** The intro line + headline. `compact` trims the h2 for Mode A, where the
 *  headline shares the right-hand stage column with the CTA card. */
function HeadlineBlock({
  compact = false,
  eyebrowRef,
  headlineRef,
}: {
  compact?: boolean;
  /** Mode A only — the scrubbed timeline fades and lifts the eyebrow wrapper. */
  eyebrowRef?: React.Ref<HTMLDivElement>;
  /** Mode A only — SplitText splits this `<h2>` into per-word spans. */
  headlineRef?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <>
      <Box ref={eyebrowRef} sx={{ display: "inline-block", mb: 1.5 }}>
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: { xs: "0.72rem", md: "0.82rem" },
            fontWeight: 800,
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            m: 0,
          }}
        >
          <Box component="span" sx={{ color: NOIR.navyField }}>HERE</Box>{" "}
          <Box component="span" sx={{ color: NOIR.gold }}>AT</Box>{" "}
          <Box component="span" sx={{ color: NOIR.navyField }}>PHITOPOLIS</Box>
        </Typography>
      </Box>

      <Typography
        ref={headlineRef}
        variant="h2"
        component="h2"
        sx={{
          fontSize: compact
            ? { xs: "2rem", sm: "2.4rem", md: "2.9rem" }
            : { xs: "2.2rem", sm: "3rem", md: "4.5rem" },
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          fontWeight: 800,
          color: NOIR.navyField,
        }}
      >
        We create exciting technologies
      </Typography>
    </>
  );
}

/**
 * Main closing lattice section. Hosts the choreographed headline -> CTA
 * hand-off. Mode selection: `staticLayout` (reduced motion OR mobile) renders
 * a stacked layout and creates NO ScrollTrigger.
 */
export function ClosingLatticeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const closureHandleRef = useRef<HeroCanvasHandle>(null);
  const canvasDriftRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // reduced === true -> mode C. mobile (non-reduced) -> mode B. Otherwise -> mode A.
  const staticLayout = reduced === true || isMobile;

  useGSAP(
    () => {
      // No ScrollTrigger under reduced motion or on mobile — those modes are
      // static by design.
      if (staticLayout || !containerRef.current) return;

      const el = containerRef.current;
      const headlineEl = headlineRef.current;
      const ctaEl = el.querySelector<HTMLElement>("[data-closing-cta]");

      // Start every scrub var at the phase-1 entrance state so the first paint
      // matches the pin start (the DOM fallbacks below keep the CTA lit if this
      // trigger never runs at all).
      el.style.setProperty("--closure-headline-opacity", "0");
      el.style.setProperty("--closure-cta-opacity", "0");
      el.style.setProperty("--closure-cta-pointer", "none");
      el.style.setProperty("--closure-vignette-opacity", "0");

      // The closure canvas is atmosphere, not choreography: hold the P solid and
      // 3D (progress 0 never enters the 0.20–0.35 particle-converge window) and
      // hold a moderate camera pull-back so the extended node lattice reads wide.
      closureHandleRef.current?.setProgress(0);
      closureHandleRef.current?.setZoomProgress?.(CLOSURE_ZOOM_HOLD);

      // SplitText breaks the rendered <h2> into per-word spans, each wrapped in
      // its own `overflow: clip` parent (`mask: "words"`). `aria: "auto"` stamps
      // the full string onto the <h2> as `aria-label` and hides the split
      // copies, so AT sees one heading, not 4 spans. `type: "words"` splits on
      // whitespace — layout-free, no resize re-measure. (If ever switched to
      // "lines", this must revert + re-split on ScrollTrigger refreshInit.)
      const split = headlineEl
        ? SplitText.create(headlineEl, { type: "words", mask: "words", wordsClass: "closing-word" })
        : null;
      const words = split?.words ?? [];

      // Scrubbed timeline. A full-span no-op spacer forces total duration 1, so
      // every tween's absolute position == the pin's scrub progress `p` and the
      // motion stays locked to the `--closure-*` opacity ramps written in
      // `onUpdate`.
      //
      // The reveals use `gsap.set(hidden) + .to(shown)` — NOT `.from()`. On a
      // scrubbed staggered `.from()`, words that haven't started yet render at
      // their natural (visible) state, so the last word appears before the
      // first. Explicitly setting the hidden state fixes the order and stops any
      // flash of the raw <h2> before the trigger engages.
      const tl = gsap.timeline();
      tl.to(el, { duration: 1 }, 0);

      if (words.length > 0) {
        gsap.set(words, { yPercent: 120, opacity: 0, filter: "blur(10px)" });
        tl.to(
          words,
          {
            yPercent: 0,
            opacity: 1,
            filter: "blur(0px)",
            ease: "power3.out",
            stagger: 0.4 * (WORD_IN_END - WORD_IN_START) / words.length,
            duration: 0.6 * (WORD_IN_END - WORD_IN_START),
          },
          WORD_IN_START,
        );
      }

      if (eyebrowRef.current) {
        gsap.set(eyebrowRef.current, { y: 10, opacity: 0 });
        tl.to(
          eyebrowRef.current,
          { y: 0, opacity: 1, ease: "power2.out", duration: EYEBROW_IN_END - EYEBROW_IN_START },
          EYEBROW_IN_START,
        );
      }

      if (headlineEl) {
        // Headline recedes with depth — scale + lift + blur — as it dims out.
        tl.to(
          headlineEl,
          {
            scale: 0.86,
            yPercent: -14,
            filter: "blur(6px)",
            ease: "power2.in",
            duration: HEADLINE_OUT_END - HEADLINE_OUT_START,
          },
          HEADLINE_OUT_START,
        );
      }

      if (ctaEl) {
        gsap.set(ctaEl, { yPercent: 44, scale: 0.92, filter: "blur(8px)" });
        tl.to(
          ctaEl,
          {
            yPercent: 0,
            scale: 1,
            filter: "blur(0px)",
            ease: "power3.out",
            duration: 0.85 * (CTA_IN_END - CTA_IN_START),
          },
          CTA_IN_START,
        );
      }

      // The canvas layer sits biased left (so the 3D P clears the right-hand
      // stage) and drifts a touch further across the pin. `ease: "none"` on a
      // scrubbed timeline == drift proportional to scroll; `fromTo` so both ends
      // are deterministic.
      if (canvasDriftRef.current) {
        tl.fromTo(
          canvasDriftRef.current,
          { xPercent: CLOSURE_DRIFT_X_FROM, yPercent: CLOSURE_DRIFT_Y_FROM },
          {
            xPercent: CLOSURE_DRIFT_X_TO,
            yPercent: CLOSURE_DRIFT_Y_TO,
            ease: "none",
            duration: 1,
          },
          0,
        );
      }

      const scrollTrigger = ScrollTrigger.create({
        trigger: el,
        pin: true,
        start: "top top",
        // Retuned 1.3 -> 2.0 -> 2.6 -> 3.0: the buffered spine needs the room.
        end: () => `+=${String(window.innerHeight * CLOSING_PIN_VH)}`,
        scrub: SCROLL_SPEED,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: refreshPriorityFor(sectionOrder("closing")),
        animation: tl,
        onUpdate: (self) => {
          const p = self.progress;

          el.style.setProperty("--closure-headline-opacity", headlineOpacityFor(p).toFixed(3));
          el.style.setProperty("--closure-cta-opacity", ctaOpacityFor(p).toFixed(3));
          el.style.setProperty("--closure-cta-pointer", ctaPointerFor(p));
          el.style.setProperty("--closure-vignette-opacity", vignetteOpacityFor(p).toFixed(3));
        },
      });

      return () => {
        scrollTrigger.kill();
        tl.kill();
        split?.revert();
      };
    },
    { scope: containerRef, dependencies: [reduced, isMobile] },
  );

  // ── Mode C: reduced motion — settled final frame ──────────────────────────
  if (reduced === true) {
    return (
      <Box
        ref={containerRef}
        data-testid="closing-lattice-section"
        sx={{
          position: "relative",
          width: "100%",
          height: "100vh",
          minHeight: { xs: "auto", md: 680 },
          bgcolor: NOIR.white,
          color: NOIR.navyField,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: { xs: 2, md: 6 },
          py: { xs: 10, md: 0 },
        }}
      >
        <Box sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <HeroCanvas
            handleRef={closureHandleRef}
            varsHostRef={containerRef}
            mode="closure"
            showLogo
            initialZoomProgress={1}
          />
        </Box>

        {/* Static navy vignette — reduced motion gets the settled frame. */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            background: CLOSURE_VIGNETTE_BG,
            opacity: 0.5,
          }}
        />

        {/* One wrapper carries BOTH `display: none` and `opacity: 0` so the
            reduced-motion assertion has a single element to resolve. */}
        <Box aria-hidden="true" style={{ display: "none", opacity: 0 }}>
          <HeadlineBlock />
        </Box>

        <Box
          sx={{
            position: "relative",
            zIndex: 6,
            width: "100%",
            maxWidth: 560,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <ClosingCtaCard fullWidth style={{ opacity: 1, pointerEvents: "auto" }} />
        </Box>
      </Box>
    );
  }

  // ── Mode B: mobile static — bespoke single-column stack ───────────────────
  if (isMobile) {
    return (
      <Box
        ref={containerRef}
        data-testid="closing-lattice-section"
        sx={{
          position: "relative",
          width: "100%",
          height: "auto",
          minHeight: "auto",
          bgcolor: NOIR.white,
          color: NOIR.navyField,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: { xs: 5 },
          px: { xs: 3 },
          py: { xs: 10 },
        }}
      >
        {/* Compact canvas band — the P sits small, top-centre. */}
        <Box aria-hidden sx={{ position: "relative", width: "100%", height: { xs: 240 } }}>
          <HeroCanvas
            handleRef={closureHandleRef}
            mode="closure"
            showLogo
            initialZoomProgress={1}
          />
        </Box>

        <Box sx={{ position: "relative", zIndex: 4, color: NOIR.navyField }}>
          <HeadlineBlock />
        </Box>

        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <ClosingCtaCard fullWidth />
        </Box>
      </Box>
    );
  }

  // ── Mode A: desktop scrub ─────────────────────────────────────────────────
  return (
    <Box
      ref={containerRef}
      data-testid="closing-lattice-section"
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: { md: 680 },
        bgcolor: NOIR.white,
        color: NOIR.navyField,
        overflow: "hidden",
      }}
    >
      {/* Layer 1 — closure canvas as atmosphere. Drifted by the scrubbed
          timeline; radially masked so the outermost lattice nodes dissolve into
          the frame instead of hard-clipping. */}
      <Box
        ref={canvasDriftRef}
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          willChange: "transform",
          WebkitMaskImage: CLOSURE_CANVAS_MASK,
          maskImage: CLOSURE_CANVAS_MASK,
        }}
      >
        <HeroCanvas
          handleRef={closureHandleRef}
          varsHostRef={containerRef}
          mode="closure"
          showLogo
          initialProgress={0}
          initialZoomProgress={CLOSURE_ZOOM_HOLD}
        />
      </Box>

      {/* Layer 2 — navy radial vignette, opacity driven by scroll (fades in once
          the "In closing" header has scrolled past). */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background: CLOSURE_VIGNETTE_BG,
          opacity: "var(--closure-vignette-opacity, 0)",
        }}
      />

      {/* Layer 3 — content grid: an empty breathing column on the left, the
          stage column on the right. The headline builds in on that stage,
          recedes, then hands off to the CTA card in the SAME cell (disjoint in
          time). */}
      <Box
        sx={{
          position: "relative",
          zIndex: 4,
          height: "100%",
          display: "grid",
          gridTemplateColumns: "1fr minmax(0, 460px)",
          alignItems: "center",
          columnGap: { md: 6, lg: 10 },
          pl: { md: 6, lg: 10 },
          // Extra right inset so the stage column clears the fixed dot-rail nav.
          pr: { md: 12, lg: 22 },
          maxWidth: 1400,
          mx: "auto",
        }}
      >
        <Box aria-hidden />

        {/* Right stage: headline + CTA stacked in one grid cell. */}
        <Box
          sx={{
            display: "grid",
            alignContent: "center",
            justifyItems: "start",
            "& > *": { gridArea: "1 / 1", width: "100%" },
          }}
        >
          {/* Headline. The wrapper carries the disjoint opacity var; the
              scrubbed timeline transforms the inner <h2>/eyebrow directly. The
              frost `::before` plate keeps the navy text legible over the lattice
              canvas + vignette; it fades with the headline (inside the var). */}
          <Box
            style={{ opacity: "var(--closure-headline-opacity, 0)" }}
            sx={{
              textAlign: "left",
              pointerEvents: "none",
              alignSelf: "center",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: "-12px -22px",
                borderRadius: "18px",
                background: "rgba(247, 250, 252, 0.32)",
                backdropFilter: "blur(3px)",
                WebkitBackdropFilter: "blur(3px)",
                WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, #000 40%, transparent 100%)",
                maskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, #000 40%, transparent 100%)",
                zIndex: -1,
              },
            }}
          >
            <HeadlineBlock compact eyebrowRef={eyebrowRef} headlineRef={headlineRef} />
          </Box>

          {/* CTA card. `data-closing-cta` marks the wrapper the timeline
              lifts/scales in (transform/filter only — opacity stays on the
              card's own `--closure-cta-opacity` var). */}
          <Box
            data-closing-cta
            style={{
              opacity: "var(--closure-cta-opacity, 1)",
              pointerEvents: "var(--closure-cta-pointer, auto)" as React.CSSProperties["pointerEvents"],
            }}
            sx={{ display: "flex", justifyContent: "flex-start", alignSelf: "center" }}
          >
            <ClosingCtaCard />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
