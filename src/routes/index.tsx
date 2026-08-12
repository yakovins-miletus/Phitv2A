import { useRef } from "react";
import Box from "@mui/material/Box";
import { createFileRoute } from "@tanstack/react-router";

import { pageHead } from "@/shared/seo";
import { EyeFlow } from "@/shared/components/EyeFlow";
import { GroundLayer } from "@/shared/components/ground/GroundLayer";
import { SmoothScroll } from "@/shared/components/SmoothScroll";
import { useStagePresence } from "@/shared/components/StageSection";
import { NAV_ANCHORS, useNavbarAnchor } from "@/shared/components/NavbarContext";
import { SuperHeroSequence } from "@/features/hero/SuperHeroSequence";
import { CloudProps } from "@/features/clouds/CloudProps";
import { MissionStatement } from "@/features/hero/description/MissionStatement";
import { OperatingPillars } from "@/features/hero/description/OperatingPillars";
import { MarketPosition } from "@/features/hero/description/MarketPosition";
import { CapabilityRack } from "@/features/services/components/CapabilityRack";
import { UseCasesNarrative } from "@/features/services/components/UseCasesNarrative";
import { BlogSection } from "@/features/home/components/BlogSection";
import { ClosingShelf } from "@/features/home/components/ClosingShelf";
import { CandidatesAndCareersSection } from "@/features/home/components/CandidatesAndCareersSection";
import { DailyLifeSection } from "@/features/home/components/DailyLifeSection/DailyLifeSection";
import { TestimonialsSection } from "@/features/home/components/TestimonialsSection";
import { ProcessSection } from "@/features/home/components/ProcessSection";
import { ReachSection } from "@/features/home/components/ReachSection";

// No gsap/lenis imports at route-module scope: this file stays in the eager
// bundle even with autoCodeSplitting, so anything imported here ships to every
// visitor. Scroll wiring lives in <SmoothScroll /> and inside the section
// components, which ride the lazy home chunk. (The comment said this before
// the sections were extracted, while the file imported gsap, ScrollTrigger and
// useGSAP directly above it. Now it is true.)

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Phitopolis — FinTech Engineering & Quantitative R&D",
      "A financial-sciences and engineering powerhouse turning global markets into deployable technology.",
    ),
  component: HomePage,
});

function HomePage() {
  const useCasesRef = useRef<HTMLElement>(null);
  const compactZoneRef = useNavbarAnchor(NAV_ANCHORS.HOME_COMPACT);
  useStagePresence(useCasesRef, "use-cases");

  return (
    <>
      <SmoothScroll />
      <GroundLayer />
      <EyeFlow />
      {/* Two acts, one per variety the firm sells: SERVICES (what we build) then
          PEOPLE (who builds it). The seam is between `reach-sequence` and
          `daily-life-sequence`, where `ledes.dailyLife` carries the written
          handover — "That is the work. These are the people who do it."

          `data-act` is tagged per SECTION rather than on two wrapper divs, and
          that is deliberate: `#compact-zone` spans process→blog, so the act
          boundary falls *inside* it. Wrapper divs per act would have forced the
          compact zone to shrink to process→reach, silently dropping the navbar's
          compact behaviour over the whole People act. The ground layer unions the
          rects of every element sharing an act, so it needs the tags, not a
          container.

          There are no <Divider />s here any more. A hairline at every seam
          announces the cut instead of absorbing it, and it fought the ground
          transitions directly. Separation is space and ground change now. */}
      <Box component="main" id="home-main" sx={{ position: "relative", overflowX: "clip" }}>
        {/* 01. Hero Sequence — stays GSAP-pinned (position: fixed) during
            the scroll animation. The overlay sheet below uses negative margin
            to slide up and cover it while it is still pinned. */}
        <Box
          component="section"
          id="hero-sequence"
          aria-label="Hero Sequence"
          data-act="services"
          sx={{ position: "relative", zIndex: 1 }}
        >
          <SuperHeroSequence />
        </Box>

        {/* 02-04. Parallax overlay sheet — negative margin pulls it up into
            the last 100vh of the hero pin, so it slides over the still-fixed
            hero content. Rounded corners + shadow = About-page card overlay. */}
        <Box
          data-act="services"
          sx={{
            position: "relative",
            zIndex: 2,
            mt: "-100vh",
            bgcolor: "background.default",
            borderTopLeftRadius: { xs: 28, md: 48 },
            borderTopRightRadius: { xs: 28, md: 48 },
          }}
        >
          {/* Cloud plates extracted from the Monolith source video
              (`scripts/extract-clouds.mjs`) — a parallax prop layer behind
              the section's own text, negative z-index so it never competes
              with it. See `CloudProps.tsx`'s module comment. */}
          <CloudProps />
          <MissionStatement />
          <OperatingPillars />
          <MarketPosition />
        </Box>

        {/* 05. Capabilities & Services */}
        <Box
          component="section"
          id="capabilities"
          aria-label="Capabilities and Services"
          data-act="services"
        >
          <CapabilityRack />
        </Box>

        {/* 03. Use Cases Narrative */}
        <Box
          ref={useCasesRef}
          component="section"
          id="use-cases"
          aria-label="Real-World Applications"
          data-act="services"
        >
          <UseCasesNarrative />
        </Box>

        {/* 04. Compact & Sequential Sections Zone — spans process→blog and so
            straddles the act seam. See the note above. */}
        <Box ref={compactZoneRef} id="compact-zone">
          <Box
            component="section"
            id="process-sequence"
            aria-label="Engineering Process"
            data-act="services"
          >
            <ProcessSection />
          </Box>

          {/* Global Footprint — closes Act I. */}
          <Box
            component="section"
            id="reach-sequence"
            aria-label="Global Footprint"
            data-act="services"
          >
            <ReachSection />
          </Box>

          {/* ── ACT II · PEOPLE ─────────────────────────────────────────────────
              Daily Life opens the act; the ground layer plays its one directional
              wipe at this boundary rather than a crossfade. */}
          <Box
            component="section"
            id="daily-life-sequence"
            aria-label="Daily Life Behind the Code"
            data-act="people"
          >
            <DailyLifeSection />
          </Box>

          <Box
            component="section"
            id="testimonials-sequence"
            aria-label="Hear From Our People"
            data-act="people"
          >
            <TestimonialsSection />
          </Box>

          <Box
            component="section"
            id="careers-sequence"
            aria-label="Talent and Technical Careers"
            data-act="people"
          >
            <CandidatesAndCareersSection />
          </Box>

          <Box
            component="section"
            id="blog-sequence"
            aria-label="Intelligence Feed and Blog"
            data-act="people"
          >
            <BlogSection />
          </Box>

          {/* The close. `sections.ts` has carried a `closing` entry ("Horizon
              Gateway") since the section list was written and nothing ever
              rendered it — this is that slot, finally filled. It looks back over
              both acts and resolves the hero's promise instead of repeating it. */}
          <ClosingShelf />
        </Box>
      </Box>
      {/* No footer here: AppShell renders the site footer for every route */}
    </>
  );
}

