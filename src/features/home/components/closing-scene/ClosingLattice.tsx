/**
 * Closing Lattice
 *
 * Replaces the SVG IsometricTechLattice with an independent instance of HeroCanvas
 * in "closure" mode. The opening headline "We create exciting technologies" fades
 * in while the P mark pans left (sharing the top hero's own moveLeftProgress
 * timing), then the sequence stops driving the instant the P settles — no further
 * zoom-out — and the CTA fades in beside the settled P.
 *
 * Micro-choreography runs with zero React re-renders via GSAP ScrollTrigger and
 * CSS custom properties.
 */

import { useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
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
import { PHASE_MOVE_END, moveLeftProgress } from "@/features/hero/heroPhases";

// Register ScrollTrigger plugin once at module load
gsap.registerPlugin(ScrollTrigger);

/**
 * Main closing lattice section.
 *
 * Hosts the secondary isometric canvas with pinned scroll-driven zoom-out and
 * choreographed opening headline and CTA transitions.
 */
export function ClosingLatticeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const closureHandleRef = useRef<HeroCanvasHandle>(null);
  const reduced = useReducedMotion();

  // Scroll-driven choreography: P pans left and settles, then holds — 1.3vh pin
  useGSAP(
    () => {
      // Skip if reduced motion is enabled or container not yet mounted
      if (reduced === true || !containerRef.current) return;

      const el = containerRef.current;

      const scrollTrigger = ScrollTrigger.create({
        trigger: el,
        pin: true,
        start: "top top",
        end: () => `+=${String(window.innerHeight * 1.3)}`,
        scrub: SCROLL_SPEED,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: refreshPriorityFor(sectionOrder("closing")),
        onUpdate: (self) => {
          const p = self.progress;

          // Clamp what the canvas sees at the P's own settle point
          // (PHASE_MOVE_END, shared with the top hero's moveLeftProgress) so
          // it never reaches the hero's later phases (gunshot/smoking/
          // container-transform) — those would fade the P out and fade in a
          // ghost "AT" glyph, which makes no sense in this scene.
          const heroProgress = Math.min(p, PHASE_MOVE_END);
          closureHandleRef.current?.setProgress(heroProgress);

          // Intro + headline pan left in sync with the P's own leftward pan.
          // `textShift` is 0 for the entire flatten window (p<=0.20, P still
          // centred and transforming) and only starts moving once the P
          // itself starts moving — so deriving both text fade-ins from this
          // same value (instead of an independent p-based ramp) guarantees
          // the text can never appear while it would overlap the P's own
          // 3D->2D transform.
          const textShift = moveLeftProgress(heroProgress);

          // Fully visible by 60%/75% of the way through the pan (staggered so
          // the headline reads as following the intro, not simultaneous).
          const introOpacity = p > PHASE_MOVE_END
            ? Math.max(0, 1 - (p - PHASE_MOVE_END) / 0.11)
            : Math.min(1, textShift / 0.6);
          const headlineOpacity = p > PHASE_MOVE_END
            ? Math.max(0, 1 - (p - PHASE_MOVE_END) / 0.12)
            : Math.min(1, Math.max(0, (textShift - 0.15) / 0.6));

          // Final CTA fades in beside the settled P once the text has handed
          // off, overlapping its fade-out so there is no dead gap.
          const ctaOpacity = p <= 0.33 ? 0 : p <= 0.50 ? (p - 0.33) / 0.17 : 1;
          const ctaPointer = p >= 0.44 ? "auto" : "none";

          el.style.setProperty("--closure-intro-opacity", introOpacity.toFixed(3));
          el.style.setProperty("--closure-headline-opacity", headlineOpacity.toFixed(3));
          el.style.setProperty("--closure-textshift", textShift.toFixed(3));
          el.style.setProperty("--closure-cta-opacity", ctaOpacity.toFixed(3));
          el.style.setProperty("--closure-cta-pointer", ctaPointer);
        },
      });

      return () => {
        scrollTrigger.kill();
      };
    },
    { scope: containerRef, dependencies: [reduced] },
  );

  return (
    <Box
      ref={containerRef}
      data-testid="closing-lattice-section"
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: { xs: 580, md: 680 },
        bgcolor: "#FFFFFF",
        color: NOIR.navyField,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        px: { xs: 2, md: 4 },
      }}
    >
      {/* 1. Background Isometric HeroCanvas in Closure Mode */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <HeroCanvas
          handleRef={closureHandleRef}
          varsHostRef={containerRef}
          mode="closure"
          showLogo={true}
          initialZoomProgress={reduced ? 1 : 0}
        />
      </Box>

      {/* 2. Opening Headline Sequence — pans left in sync with the P mark
          (--closure-textshift, 0..1), then hands off to the CTA. */}
      <Box
        aria-hidden={reduced ? true : undefined}
        style={{
          display: reduced ? "none" : "block",
          transform: reduced
            ? undefined
            : "translateX(calc(var(--closure-textshift, 0) * -1 * var(--closure-textshift-vw, 0vw)))",
        }}
        sx={{
          position: "relative",
          zIndex: 4,
          textAlign: "center",
          pointerEvents: "none",
          px: 3,
          maxWidth: "800px",
          mx: "auto",
          "--closure-textshift-vw": { xs: "0vw", md: "18vw" },
        }}
      >
        <Box
          style={{
            opacity: reduced ? 1 : "var(--closure-intro-opacity, 0)",
          }}
          sx={{ position: "relative", display: "inline-block", mb: 1.5 }}
        >
          {/* Blurred backdrop so navy "HERE"/"PHITOPOLIS" stay legible over the navy P mark.
              Bound to the same wrapper as the text, so backdrop and text fade in lockstep. */}
          <Box
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

        <Box
          style={{
            opacity: reduced ? 1 : "var(--closure-headline-opacity, 0)",
          }}
          sx={{
            position: "relative",
            display: "inline-block",
          }}
        >
          {/* Same blurred backdrop treatment as the intro line, above. */}
          <Box
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
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: "2.2rem", sm: "3.5rem", md: "4.5rem" },
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              fontWeight: 800,
              color: NOIR.navyField,
            }}
          >
            We create exciting technologies
          </Typography>
        </Box>
      </Box>

      {/* 3. Final Statement and CTA — sits beside the settled P mark at md+
          (using its published --hp-px/--hp-py/--hp-pw screen box), and as a
          bottom sheet on mobile where the P doesn't pan horizontally. */}
      <Box
        style={{
          opacity: reduced ? 1 : "var(--closure-cta-opacity, 0)",
          pointerEvents: (reduced ? "auto" : "var(--closure-cta-pointer, none)") as React.CSSProperties["pointerEvents"],
        }}
        sx={{
          position: "absolute",
          bottom: { xs: 24, sm: 36, md: "auto" },
          top: { xs: "auto", md: "50%" },
          right: { xs: "auto", md: "auto" },
          left: {
            xs: "50%",
            md: "calc(var(--hp-px, 0.3) * 100% + var(--hp-pw, 0.2) * 50% + 32px)",
          },
          transform: { xs: "translateX(-50%)", md: "translateY(-50%)" },
          width: { xs: "calc(100% - 32px)", md: "auto" },
          maxWidth: { xs: "560px", md: 440 },
          zIndex: 6,
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
        {/* Faint gold glow anchored to the top-left corner — an inviting
            accent rather than a flat navy card. */}
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
    </Box>
  );
}
