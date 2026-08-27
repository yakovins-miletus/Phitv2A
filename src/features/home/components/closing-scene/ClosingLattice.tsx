/**
 * Closing Lattice with Scroll-Driven Zoom
 *
 * Replaces the SVG IsometricTechLattice with an independent instance of HeroCanvas
 * in "closure" mode. Starts tightly zoomed at p=0 with the opening headline
 * "We create exciting technologies", and zooms out on scroll (p -> 1) to reveal
 * all 6 outer application nodes, 9 signal loops, and the final Call-To-Action (CTA).
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

  // Scroll-driven zoom animation: canvas zooms out from tight (p=0) to wide (p=1) over 2.5vh pin
  useGSAP(
    () => {
      // Skip if reduced motion is enabled or container not yet mounted
      if (reduced === true || !containerRef.current) return;

      const el = containerRef.current;

      const scrollTrigger = ScrollTrigger.create({
        trigger: el,
        pin: true,
        start: "top top",
        end: () => `+=${String(window.innerHeight * 2.5)}`,
        scrub: SCROLL_SPEED,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: refreshPriorityFor(sectionOrder("closing")),
        onUpdate: (self) => {
          const p = self.progress;

          // Camera Zoom: tight zoom at p in [0.0, 0.10], ramps to wide view at p in [0.10, 0.85]
          const zoomProgress = p <= 0.10 ? 0 : p >= 0.85 ? 1 : (p - 0.10) / 0.75;
          closureHandleRef.current?.setZoomProgress?.(zoomProgress);
          closureHandleRef.current?.setProgress(p);

          // Opening Headline: hold at 1.0 for p in [0.0, 0.10], fades out 1.0 -> 0.0 for p in [0.10, 0.45]
          const headlineOpacity = p <= 0.10 ? 1 : p >= 0.45 ? 0 : (0.45 - p) / 0.35;

          // Final CTA Card: 0.0 for p in [0.0, 0.45], fades in 0.0 -> 1.0 for p in [0.45, 0.85]
          const ctaOpacity = p <= 0.45 ? 0 : p >= 0.85 ? 1 : (p - 0.45) / 0.40;
          const ctaPointer = p >= 0.65 ? "auto" : "none";

          el.style.setProperty("--closure-headline-opacity", headlineOpacity.toFixed(3));
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
          mode="closure"
          showLogo={true}
          initialZoomProgress={reduced ? 1 : 0}
        />
      </Box>

      {/* 2. Opening Headline (p: 0.0 -> 0.45) */}
      <Box
        aria-hidden={reduced ? true : undefined}
        style={{
          opacity: reduced ? 0 : "var(--closure-headline-opacity, 1)",
          display: reduced ? "none" : "block",
        }}
        sx={{
          position: "relative",
          zIndex: 4,
          textAlign: "center",
          pointerEvents: "none",
          px: 3,
          maxWidth: "800px",
          mx: "auto",
        }}
      >
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: { xs: "0.72rem", md: "0.82rem" },
            fontWeight: 800,
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: NOIR.gold,
            mb: 1.5,
          }}
        >
          CAPABILITY // PLATFORM
        </Typography>
        <Typography
          variant="h2"
          component="h2"
          sx={{
            fontSize: { xs: "2.2rem", sm: "3.5rem", md: "4.5rem" },
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            fontWeight: 800,
            color: NOIR.navyField,
            textShadow: "0 4px 28px rgba(255, 255, 255, 0.85)",
          }}
        >
          We create exciting technologies
        </Typography>
      </Box>

      {/* 3. Final Statement and CTA Overlay (p: 0.45 -> 0.85) */}
      <Box
        style={{
          opacity: reduced ? 1 : "var(--closure-cta-opacity, 0)",
          pointerEvents: (reduced ? "auto" : "var(--closure-cta-pointer, none)") as React.CSSProperties["pointerEvents"],
        }}
        sx={{
          position: "absolute",
          bottom: { xs: 24, sm: 36, md: 48 },
          right: { xs: "auto", md: 48 },
          left: { xs: "50%", md: "auto" },
          transform: { xs: "translateX(-50%)", md: "none" },
          width: { xs: "calc(100% - 32px)", md: "auto" },
          maxWidth: { xs: "560px", md: "640px" },
          zIndex: 6,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 2.5, md: 3 },
          p: { xs: 3, sm: 3.5, md: 4 },
          borderRadius: "24px",
          bgcolor: "rgba(6, 18, 38, 0.92)",
          border: "1px solid rgba(6, 18, 38, 0.18)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
        }}
      >
        <Box sx={{ maxWidth: { xs: "100%", sm: "340px", md: "380px" } }}>
          <Typography
            variant="h3"
            component="h3"
            sx={{
              fontSize: { xs: "1.35rem", sm: "1.75rem", md: "2.1rem" },
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              fontWeight: 700,
              color: NOIR.white,
              mb: 1,
            }}
          >
            {CONTENT.closing.statement}
          </Typography>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: { xs: "0.72rem", md: "0.80rem" },
              color: NOIR.frost,
              opacity: 0.8,
            }}
          >
            Direct line to our technical leadership and quantitative engineering directors.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", width: { xs: "100%", sm: "auto" } }}>
          <Box
            component={Link}
            to="/contact"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              px: 3.5,
              py: 1.75,
              bgcolor: "transparent",
              color: NOIR.white,
              border: "1px solid rgba(255, 255, 255, 0.35)",
              fontFamily: MONO,
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              borderRadius: "100px",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: NOIR.white,
                transform: "scale(1.02)",
                bgcolor: "rgba(255, 255, 255, 0.08)",
              },
            }}
          >
            Contact
          </Box>
          <Box
            component={Link}
            to="/careers"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              px: 3.5,
              py: 1.75,
              bgcolor: NOIR.gold,
              color: NOIR.navyField,
              fontFamily: MONO,
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              borderRadius: "100px",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "transform 0.2s ease, background-color 0.2s ease",
              "&:hover": {
                bgcolor: NOIR.white,
                transform: "scale(1.02)",
              },
            }}
          >
            {CONTENT.closing.farewell} →
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
