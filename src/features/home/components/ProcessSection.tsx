import { useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { CONTENT } from "@/shared/content";
import { ProcessDiagram } from "@/shared/components/diagrams/ProcessDiagram";
import { NOIR } from "@/shared/theme/palette";
import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { useNavbarAnchor } from "@/shared/components/navbarHooks";
import { useStagePresence } from "@/shared/components/stage/stagePresence";
import { useReducedMotion } from "@/shared/motion";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { homeSection } from "@/shared/sections";
import { ProcessScrubStage } from "./process/ProcessScrubStage";

const HEADLINE = (
  <Typography
    variant="h2"
    sx={{
      fontSize: { xs: "1.4rem", md: "2.15rem" },
      fontWeight: 800,
      lineHeight: 1.15,
      color: NOIR.frost,
    }}
  >
    From our practices, our business gradually grew into a{" "}
    <Box component="span" sx={{ color: NOIR.gold }}>
      development powerhouse.
    </Box>
  </Typography>
);

/** Mobile + reduced-motion: the original static three-up ascending collage,
 *  minus the pin. */
function ProcessStaticStack() {
  return (
    <Box sx={{ width: "100%", px: { xs: 2, md: 6, lg: 8 }, position: "relative", zIndex: 2 }}>
      <Box sx={{ maxWidth: 1320, mx: "auto", mb: { xs: 1.5, md: 3 } }}>{HEADLINE}</Box>
      <Box sx={{ pr: { lg: 16 } }}>
        <ProcessDiagram model={CONTENT.process} />
      </Box>
    </Box>
  );
}

/**
 * "From our practices…" — the growth story.
 *
 * `process` declares `ownsPin: true` + `noExitDim: true` in `HOME_SECTIONS`, so
 * `SectionBeat` renders this in the un-transformed `.beat-bare-content` sibling
 * (outside its `Container`, no reveal tween, no exit dim). Three render modes:
 *
 *   A. Desktop scrub (md+, not reduced) — `ProcessScrubStage`: one pinned
 *      ScrollTrigger scrubs through 2019 → 2020‑2025 → 2026 with `PixelSwap`
 *      dissolves and a 60→70→80vw frame, then releases.
 *   B. Mobile static (down("md")) — `ProcessStaticStack` (the original collage).
 *   C. Reduced motion — same static collage.
 *
 * No `establishing` shot, unlike every other beat on this page (ADR-0002): the
 * growth composition is itself the establishing image.
 */
export function ProcessSection() {
  const containerRef = useRef<HTMLElement>(null);
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.PROCESS_IMMERSIVE, { dark: true });

  const theme = useTheme();
  const reduced = useReducedMotion();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const staticLayout = reduced === true || isMobile;

  // Bare / ownsPin beats don't get presence tracking from SectionBeat — register
  // here so the dot rail still highlights `process` while it's pinned.
  useStagePresence(containerRef, "process");

  return (
    <SectionBeat section={homeSection("process")}>
      {/* id is "process-stage", NOT "process": SectionBeat's own root carries
          id="process" (the scroll-to anchor). */}
      <Box
        component="section"
        ref={containerRef}
        id="process-stage"
        sx={{
          position: "relative",
          width: "100%",
          color: NOIR.frost,
          borderTop: "1px solid rgba(255, 199, 44, 0.2)",
          ...(staticLayout
            ? {
                minHeight: "auto",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                py: { xs: 6, md: 10 },
                bgcolor: NOIR.navyDeep,
                borderBottom: "1px solid rgba(255, 199, 44, 0.2)",
              }
            : {
                // Scrub mode: a plain block wrapper. `.process-stage` (100vh) and
                // its ScrollTrigger pin-spacer define the height — a flex box
                // with `overflow: hidden` here CLIPS the pin-spacer's padding, so
                // the pin range never gets reserved in flow and the bar
                // transition after it overlaps the still-pinned stage.
                display: "block",
                py: 0,
                // Transparent so ProcessScrubStage's own navy backdrop (which
                // fades in on lock) reads.
                bgcolor: "transparent",
              }),
        }}
      >
        {/* Navbar anchor + industrial grid — on an absolute inset child so the
            pin's transform never disturbs the anchor rect. */}
        <Box ref={anchorRef} aria-hidden sx={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />

        {staticLayout ? <ProcessStaticStack /> : <ProcessScrubStage />}
      </Box>
    </SectionBeat>
  );
}
