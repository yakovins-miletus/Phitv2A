/**
 * Closing Lattice
 *
 * The page's final beat: an independent instance of HeroCanvas in "closure"
 * mode paints the P mark, which settles left-of-centre, the opening headline
 * ("We create exciting technologies") resolves over it, then clears, and a
 * single CTA card ("Start a Conversation" -> /contact) reveals in a disjoint
 * phase afterwards. Headline and CTA never share an opacity window.
 *
 * Three render modes:
 *   A. Desktop scrub  (md+ and not reduced) — one pinned ScrollTrigger, a CSS
 *      grid (headline left, CTA right, canvas absolutely behind), 5 disjoint
 *      scrub phases driven purely through `el.style.setProperty("--closure-*")`
 *      with zero React re-renders.
 *   B. Mobile static  (down("md"), not reduced) — bespoke single-column stack,
 *      no ScrollTrigger, no scroll-driven fade (no pan -> nothing to fade).
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
import { useGSAP } from "@gsap/react";

import { CONTENT } from "@/shared/content";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";
import { sectionOrder } from "@/shared/sections";
import { HeroCanvas, type HeroCanvasHandle } from "@/features/hero/HeroCanvas";
import { PHASE_MOVE_END } from "@/features/hero/heroPhases";

// Register ScrollTrigger plugin once at module load
gsap.registerPlugin(ScrollTrigger);

/**
 * Closing scrub phase model — 5 DISJOINT phases across a 2.0vh pin.
 *
 * Pin length was retuned from `innerHeight * 1.3` to `innerHeight * 2.0` to give
 * the five discrete phases room (re-check `tests/e2e/ladder-probe.js` — the
 * `#closing` pin end moves deliberately).
 *
 * | phase           | p range   | canvas heroProgress          | --closure-headline-opacity | --closure-cta-opacity      | --closure-cta-pointer |
 * |-----------------|-----------|------------------------------|----------------------------|----------------------------|-----------------------|
 * | 1 settle P      | 0.00–0.28 | (p/0.28)*PHASE_MOVE_END       | ramp 0→1 over [0.06,0.24]  | 0                          | none                  |
 * | 2 hold          | 0.28–0.42 | PHASE_MOVE_END                | 1                          | 0                          | none                  |
 * | 3 headline out  | 0.42–0.58 | PHASE_MOVE_END                | ramp 1→0 over [0.42,0.56]  | 0                          | none                  |
 * | 4 CTA reveals   | 0.60–0.82 | PHASE_MOVE_END                | 0                          | ramp 0→1 over [0.60,0.80]  | auto at p≥0.66         |
 * | 5 settled       | 0.82–1.00 | PHASE_MOVE_END                | 0                          | 1                          | auto                  |
 *
 * Disjointness: headline-opacity is 0 for all p ≥ 0.56 and cta-opacity is 0 for
 * all p ≤ 0.60 — they are never both > 0.
 */
const CLOSING_PIN_VH = 2.0;
const P_SETTLE_END = 0.28;
const HEADLINE_IN_START = 0.06;
const HEADLINE_IN_END = 0.24;
const HEADLINE_OUT_START = 0.42;
const HEADLINE_OUT_END = 0.56;
const CTA_IN_START = 0.6;
const CTA_IN_END = 0.8;
const CTA_POINTER_AT = 0.66;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

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

/** The intro line + headline. `withBackdrop` adds the blurred white plate that
 *  keeps navy text legible over the navy canvas P (mode A only — nothing sits
 *  behind the text in the stacked modes). */
function HeadlineBlock({ withBackdrop }: { withBackdrop: boolean }) {
  return (
    <>
      <Box sx={{ position: "relative", display: "inline-block", mb: 1.5 }}>
        {withBackdrop ? (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "130%",
              height: "260%",
              borderRadius: "999px",
              bgcolor: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              zIndex: -1,
              pointerEvents: "none",
            }}
          />
        ) : null}
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

      <Box sx={{ position: "relative", display: "inline-block" }}>
        {withBackdrop ? (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "140%",
              height: "180%",
              borderRadius: "999px",
              bgcolor: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              zIndex: -1,
              pointerEvents: "none",
            }}
          />
        ) : null}
        <Typography
          variant="h2"
          component="h2"
          sx={{
            fontSize: { xs: "2.2rem", sm: "3rem", md: "4.5rem" },
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            fontWeight: 800,
            color: NOIR.navyField,
          }}
        >
          We create exciting technologies
        </Typography>
      </Box>
    </>
  );
}

/**
 * Main closing lattice section.
 *
 * Hosts the secondary closure canvas plus the choreographed headline -> CTA
 * hand-off. Mode selection: `staticLayout` (reduced motion OR mobile) renders
 * a stacked layout and creates NO ScrollTrigger.
 */
export function ClosingLatticeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const closureHandleRef = useRef<HeroCanvasHandle>(null);
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

      // Start every scrub var at the phase-1 entrance state so the first paint
      // matches the pin start (the DOM fallbacks below keep the CTA lit if this
      // trigger never runs at all).
      el.style.setProperty("--closure-headline-opacity", "0");
      el.style.setProperty("--closure-cta-opacity", "0");
      el.style.setProperty("--closure-cta-pointer", "none");

      const scrollTrigger = ScrollTrigger.create({
        trigger: el,
        pin: true,
        start: "top top",
        // Retuned from 1.3 -> 2.0: five disjoint phases need the room.
        end: () => `+=${String(window.innerHeight * CLOSING_PIN_VH)}`,
        scrub: SCROLL_SPEED,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: refreshPriorityFor(sectionOrder("closing")),
        onUpdate: (self) => {
          const p = self.progress;

          // The canvas never sees past PHASE_MOVE_END — it must not enter the
          // top hero's later gunshot/smoke/container-transform phases.
          const heroProgress = Math.min((p / P_SETTLE_END) * PHASE_MOVE_END, PHASE_MOVE_END);
          closureHandleRef.current?.setProgress(heroProgress);

          // Headline: rises 0→1, holds, then falls 1→0 — all before the CTA
          // window opens. Expressed as the difference of two clamped ramps so
          // it is continuous and self-bounded to [0, 1].
          const headlineOpacity =
            clamp01((p - HEADLINE_IN_START) / (HEADLINE_IN_END - HEADLINE_IN_START)) -
            clamp01((p - HEADLINE_OUT_START) / (HEADLINE_OUT_END - HEADLINE_OUT_START));

          const ctaOpacity = clamp01((p - CTA_IN_START) / (CTA_IN_END - CTA_IN_START));
          const ctaPointer = p >= CTA_POINTER_AT ? "auto" : "none";

          el.style.setProperty("--closure-headline-opacity", headlineOpacity.toFixed(3));
          el.style.setProperty("--closure-cta-opacity", ctaOpacity.toFixed(3));
          el.style.setProperty("--closure-cta-pointer", ctaPointer);
        },
      });

      return () => {
        scrollTrigger.kill();
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

        {/* One wrapper carries BOTH `display: none` and `opacity: 0` so the
            reduced-motion assertion has a single element to resolve. */}
        <Box aria-hidden="true" style={{ display: "none", opacity: 0 }}>
          <HeadlineBlock withBackdrop={false} />
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
          <HeadlineBlock withBackdrop={false} />
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
      {/* Canvas — absolutely behind everything. The P pans left, under the
          left column; it never sits under the right column. */}
      <Box sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <HeroCanvas
          handleRef={closureHandleRef}
          varsHostRef={containerRef}
          mode="closure"
          showLogo
          initialZoomProgress={0}
        />
      </Box>

      {/* Layout grid: headline left, CTA right, canvas behind. Real flow — the
          CTA is NOT positioned off a canvas var, so no first-paint snap. */}
      <Box
        sx={{
          position: "relative",
          zIndex: 4,
          height: "100%",
          display: "grid",
          gridTemplateColumns: "1fr minmax(0, 460px)",
          alignItems: "center",
          columnGap: { md: 6, lg: 10 },
          px: { md: 6, lg: 10 },
          maxWidth: 1400,
          mx: "auto",
        }}
      >
        {/* Left: headline block. Single opacity var for the whole block. */}
        <Box
          style={{ opacity: "var(--closure-headline-opacity, 0)" }}
          sx={{ textAlign: "left", pointerEvents: "none" }}
        >
          <HeadlineBlock withBackdrop />
        </Box>

        {/* Right: CTA card, in normal flow. */}
        <Box
          sx={{ display: "flex", justifyContent: "flex-end" }}
        >
          <ClosingCtaCard
            style={{
              opacity: "var(--closure-cta-opacity, 1)",
              pointerEvents: "var(--closure-cta-pointer, auto)" as React.CSSProperties["pointerEvents"],
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
