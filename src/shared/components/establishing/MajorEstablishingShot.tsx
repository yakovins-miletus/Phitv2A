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

gsap.registerPlugin(ScrollTrigger);

export interface MajorEstablishingShotProps {
  id: string;
  phaseCode: string;
  category: string;
  title: string;
  titleAccent?: string;
  description: string;
  tagline?: string;
  dark?: boolean;
}

export function MajorEstablishingShot({
  id,
  phaseCode,
  category,
  title,
  titleAccent,
  description,
  tagline,
  dark = false,
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

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 78%",
          once: true,
        },
      });

      // 1. Reveal metadata bar & ruler
      if (metaRef.current) {
        tl.fromTo(
          metaRef.current,
          { autoAlpha: 0, y: -8 },
          { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" },
          0,
        );
      }

      if (rulerRef.current) {
        tl.fromTo(
          rulerRef.current,
          { scaleX: 0, transformOrigin: "left center" },
          { scaleX: 1, duration: 0.85, ease: "expo.out" },
          0.05,
        );
      }

      // 2. Left-to-Right Mask Reveal on the 1-Liner Headline & Pitch
      if (maskWrapRef.current) {
        tl.fromTo(
          maskWrapRef.current,
          { clipPath: "inset(0% 100% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 0.95, ease: "power3.inOut" },
          0.1,
        );
      }

      // 3. Sliding Laser Sweep Line
      if (laserBarRef.current) {
        tl.fromTo(
          laserBarRef.current,
          { left: "0%", autoAlpha: 1 },
          { left: "100%", duration: 0.95, ease: "power3.inOut" },
          0.1,
        ).to(laserBarRef.current, { autoAlpha: 0, duration: 0.25 }, "-=0.15");
      }
    },
    { scope: containerRef, dependencies: [reduced, dark] },
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
        <Box
          ref={metaRef}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
              px: 1.75,
              py: 0.5,
              borderRadius: "100px",
              backgroundColor: dark ? "rgba(255, 255, 255, 0.08)" : "rgba(10, 42, 102, 0.05)",
              border: `1px solid ${dark ? "rgba(255, 255, 255, 0.15)" : "rgba(10, 42, 102, 0.14)"}`,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: NOIR.goldDark,
                boxShadow: `0 0 6px ${NOIR.goldDark}`,
              }}
            />
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
              {phaseCode} // {category}
            </Typography>
          </Box>

          <Typography
            variant="overline"
            sx={{
              fontFamily: MONO,
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: dark ? "rgba(255, 255, 255, 0.7)" : "rgba(10, 42, 102, 0.75)",
              display: { xs: "none", sm: "block" },
            }}
          >
            {tagline ?? "SYSTEM SEQUENCE"}
          </Typography>
        </Box>

        {/* Kinetic Caliper Measurement Hairline */}
        <Box
          ref={rulerRef}
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
              aria-hidden="true"
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
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
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
