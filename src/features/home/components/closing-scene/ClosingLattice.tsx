/**
 * Closing Lattice with Scroll-Driven Zoom
 *
 * Wraps the IsometricLattice in scroll-driven animation that causes zero React
 * re-renders. Uses GSAP ScrollTrigger to map scroll progress to lattice scale
 * via the imperative handle.
 *
 * Gated behind useInView + Suspense, matching the ServiceGlobe pattern in
 * MissionStatement.tsx.
 */

import { useRef, Suspense, lazy } from "react";
import { useInView } from "motion/react";
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

import type { IsometricLatticeHandle } from "./IsometricTechLattice";

// Register ScrollTrigger plugin once at module load
gsap.registerPlugin(ScrollTrigger);

// Lazy-load the lattice component so it doesn't enter the eager home chunk
const IsometricLattice = lazy(
  () =>
    import("./IsometricTechLattice").then((m) => ({
      default: m.IsometricLattice,
    })),
);

/** How early the lattice chunk starts fetching, in px below the fold. */
const LATTICE_PREFETCH_MARGIN = "0px 0px 600px 0px";

/**
 * Scroll-driven lattice with zoom animation.
 *
 * The lattice is rendered at a reduced scale under reduced-motion; otherwise,
 * it starts at full scale and zooms out as you scroll through the section.
 * The parentRef is used to position the scroll trigger; the latticeRef is
 * updated via the imperative handle on scroll.
 */
function DeferredClosingLattice({
  latticeRef,
}: {
  latticeRef: React.RefObject<IsometricLatticeHandle | null>;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const near = useInView(sentinelRef, {
    once: true,
    margin: LATTICE_PREFETCH_MARGIN,
  });

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      />
      {near ? (
        <Suspense fallback={<Box sx={{ aspectRatio: "4 / 3", bgcolor: NOIR.navyField }} />}>
          <IsometricLattice ref={latticeRef} reduced={reduced === true} />
        </Suspense>
      ) : null}
    </>
  );
}

/**
 * Main closing lattice section.
 *
 * Replaces ClosingShelf's four polaroid frames with an isometric tech-stack
 * lattice that zooms out to reveal the supporting structure as you scroll.
 *
 * Preserves the CTAs to /contact and /careers.
 */
export function ClosingLatticeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const latticeRef = useRef<IsometricLatticeHandle>(null);
  const reduced = useReducedMotion();

  // Scroll-driven zoom animation: lattice zooms out (scale 1 to 0.5) as section scrolls
  useGSAP(
    () => {
      // Skip if reduced motion is enabled or container not yet mounted
      if (reduced === true || !containerRef.current) return;

      // Create scroll-driven zoom effect
      const scrollTrigger = ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: SCROLL_SPEED,
        onUpdate: (self) => {
          // Map scroll progress (0 to 1) to scale (1 to 0.5)
          // Progress 0: full scale (1), Progress 1: half scale (0.5)
          const scale = 1 - self.progress * 0.5;
          latticeRef.current?.setScale(scale);
        },
      });

      return () => {
        scrollTrigger.kill();
      };
    },
    { dependencies: [reduced] },
  );

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        bgcolor: NOIR.navyField,
        color: NOIR.frost,
        py: { xs: 8, md: 12 },
        px: { xs: 2, md: 4 },
      }}
    >
      {/* The deferred lattice */}
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: { xs: "100%", md: "900px" },
          mx: "auto",
          mb: { xs: 8, md: 12 },
          aspectRatio: { xs: "1 / 1", md: "4 / 3" },
        }}
      >
        <DeferredClosingLattice latticeRef={latticeRef} />
      </Box>

      {/* Statement and CTAs */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 4,
          position: "relative",
          bgcolor: NOIR.navyField,
          p: { xs: 4, md: 6 },
          borderRadius: "20px",
          border: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          maxWidth: { xs: "100%", md: "900px" },
          mx: "auto",
        }}
      >
        <Typography
          variant="h2"
          component="h2"
          sx={{
            fontSize: { xs: "2rem", md: "3.5rem" },
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            fontWeight: 700,
            maxWidth: "24ch",
            color: NOIR.white,
          }}
        >
          {CONTENT.closing.statement}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Box
            component={Link}
            to="/contact"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
              px: 4,
              py: 2,
              bgcolor: "transparent",
              color: NOIR.white,
              border: `1px solid rgba(255,255,255,0.3)`,
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
                bgcolor: "rgba(255,255,255,0.05)",
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
              gap: 1.5,
              px: 4,
              py: 2,
              bgcolor: NOIR.white,
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
                bgcolor: NOIR.gold,
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
