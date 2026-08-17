import { useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";
import { BEAT_START } from "@/shared/motion/beatThresholds";
import {
  MAJOR_ESTABLISH,
  laserSweepX,
  rulerTransformOrigin,
} from "@/shared/components/stage/establishChoreo";

gsap.registerPlugin(ScrollTrigger);

export interface MajorEstablishingShotProps {
  id: string;
  category?: string;
  title: string;
  titleAccent?: string;
  description?: string;
  dark?: boolean;
  /**
   * When `true` (the default, i.e. every call site today) the shot owns its own
   * ScrollTrigger and timeline and behaves exactly as it always has. When
   * `false` it renders markup only — no trigger, no timeline — and a parent
   * (`SectionBeat`) drives the same steps off the `.est-*` class hooks so the
   * shot and the section it announces share one clock.
   */
  selfDriven?: boolean;
}

export function MajorEstablishingShot({
  id,
  category,
  title,
  titleAccent,
  description,
  dark = false,
  selfDriven = true,
}: MajorEstablishingShotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const maskWrapRef = useRef<HTMLDivElement>(null);
  const laserBarRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !containerRef.current) return;
      // Presentational mode: a parent owns the beat. Build nothing at all.
      if (!selfDriven) return;

      const c = MAJOR_ESTABLISH;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: BEAT_START,
          once: true,
        },
      });

      // 1. Reveal metadata bar & ruler
      if (metaRef.current) {
        tl.fromTo(
          metaRef.current,
          c.meta.from,
          { ...c.meta.to, duration: c.meta.duration, ease: c.meta.ease },
          c.meta.at,
        );
      }

      if (rulerRef.current) {
        tl.fromTo(
          rulerRef.current,
          { ...c.ruler.from, transformOrigin: rulerTransformOrigin("left") },
          { ...c.ruler.to, duration: c.ruler.duration, ease: c.ruler.ease },
          c.ruler.at,
        );
      }

      // 2. Left-to-Right Mask Reveal on the 1-Liner Headline & Pitch
      if (maskWrapRef.current) {
        tl.fromTo(
          maskWrapRef.current,
          c.mask.from,
          { ...c.mask.to, duration: c.mask.duration, ease: c.mask.ease },
          c.mask.at,
        );
      }

      // 3. Sliding Laser Sweep Line — a transform, not `left`, so it composites.
      if (laserBarRef.current) {
        const bar = laserBarRef.current;
        tl.fromTo(
          bar,
          c.laser.from,
          {
            ...c.laser.to,
            x: () => laserSweepX(bar),
            duration: c.laser.duration,
            ease: c.laser.ease,
          },
          c.laser.at,
        ).to(bar, { ...c.laserOut.to, duration: c.laserOut.duration }, c.laserOut.at);
      }
    },
    { scope: containerRef, dependencies: [reduced, dark, selfDriven] },
  );

  return (
    <Box
      component="section"
      id={id}
      aria-label={`Establishing Sequence: ${title}`}
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        height: { xs: "auto", md: "50svh" },
        minHeight: { xs: "300px", md: "50svh" },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 6, md: 0 },
        bgcolor: "transparent",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="2xl" sx={{ position: "relative", zIndex: 1, width: "100%" }}>
        {/* Minimal Kicker Metadata Bar */}
        {category && (
          <Box
            ref={metaRef}
            className="est-meta"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 2,
            }}
          >
            <Typography
              variant="overline"
              sx={{
                fontFamily: MONO,
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.2em",
                color: dark ? NOIR.frost : NOIR.navyField,
              }}
            >
              // {category}
            </Typography>
          </Box>
        )}

        {/* Kinetic Caliper Measurement Hairline */}
        <Box
          ref={rulerRef}
          className="est-ruler"
          sx={{
            height: "2px",
            width: "100%",
            background: `linear-gradient(90deg, ${NOIR.goldDark} 0%, ${dark ? "rgba(255, 255, 255, 0.25)" : "rgba(10, 42, 102, 0.25)"} 70%, transparent 100%)`,
            mb: { xs: 2.5, md: 3 },
          }}
        />

        {/* Left-to-Right Masked 1-Liner Hero Block */}
        <Box sx={{ position: "relative", width: "100%", overflow: "visible" }}>
          {/* Laser Wipe Beam */}
          {!reduced && (
            <Box
              ref={laserBarRef}
              className="est-laser"
              aria-hidden="true"
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                // Anchored at the left edge; the sweep is a transform (see
                // `laserSweepX`), never an animated `left`.
                left: 0,
                width: "2px",
                backgroundColor: dark ? NOIR.gold : NOIR.goldDark,
                boxShadow: dark
                  ? `0 0 16px ${NOIR.gold}, 0 0 32px ${NOIR.gold}`
                  : `0 0 16px ${NOIR.goldDark}, 0 0 28px ${NOIR.goldDark}`,
                zIndex: 4,
                pointerEvents: "none",
              }}
            />
          )}

          {/* Mask Container */}
          <Box
            ref={maskWrapRef}
            className="est-mask"
            sx={{
              position: "relative",
              zIndex: 2,
              clipPath: reduced ? "none" : "inset(0% 0% 0% 0%)",
            }}
          >
            {/* GSAP-style Massive 1-Liner Statement */}
            <Typography
              variant="h1"
              component="h2"
              sx={{
                fontFamily: DISPLAY_FONT,
                fontSize: { xs: "2.25rem", sm: "3.25rem", md: "4.25rem", lg: "5rem" },
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: "-0.04em",
                color: dark ? NOIR.frost : NOIR.navyField,
                textTransform: "uppercase",
                mb: 1.5,
              }}
            >
              {title}{" "}
              {titleAccent && (
                <Box
                  component="span"
                  sx={{
                    color: dark ? NOIR.gold : NOIR.goldDark,
                    display: "inline",
                    fontWeight: 800,
                  }}
                >
                  {titleAccent}
                </Box>
              )}
            </Typography>

            {/* Direct 1-Line Value Pitch */}
            {description && (
              <Typography
                sx={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.4rem" },
                  lineHeight: 1.45,
                  letterSpacing: "-0.015em",
                  color: dark ? "rgba(255, 255, 255, 0.82)" : NOIR.navyField,
                  opacity: dark ? 1 : 0.88,
                  maxWidth: { xs: "100%", md: "78ch" },
                  fontWeight: 500,
                }}
              >
                {description}
              </Typography>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
