import { useRef } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import { createFileRoute } from "@tanstack/react-router";

import { CONTENT } from "@/shared/content";
import { pageHead } from "@/shared/seo";
import { EyeFlow } from "@/shared/components/EyeFlow";
import { SmoothScroll } from "@/shared/components/SmoothScroll";
import { StatStrip } from "@/shared/components/StatStrip";
import { useStagePresence } from "@/shared/components/StageSection";
import { NAV_ANCHORS, useNavbarAnchor } from "@/shared/components/NavbarContext";
import { SuperHeroSequence } from "@/features/hero/SuperHeroSequence";
import { CapabilityRack } from "@/features/services/components/CapabilityRack";
import { UseCasesNarrative } from "@/features/services/components/UseCasesNarrative";
import { BlogSection } from "@/features/home/components/BlogSection";
import { CandidatesAndCareersSection } from "@/features/home/components/CandidatesAndCareersSection";
import { DailyLifeSection } from "@/features/home/components/DailyLifeSection/DailyLifeSection";
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
      <EyeFlow />
      <Box component="main" id="home-main" sx={{ position: 'relative', overflowX: 'clip' }}>
        {/* 01. Hero Sequence */}
        <Box component="section" id="hero-sequence" aria-label="Hero Sequence">
          <SuperHeroSequence />
        </Box>

        <Divider />

        {/* 02. Impact Stats */}
        <Box component="section" id="stats" aria-label="Impact Metrics" sx={{ py: { xs: 4, md: 6 } }}>
          <StatStrip stats={CONTENT.impact} />
        </Box>

        <Divider />

        {/* 03. Capabilities & Services */}
        <Box component="section" id="capabilities" aria-label="Capabilities and Services">
          <CapabilityRack />
        </Box>

        <Divider />

        {/* 04. Use Cases Narrative */}
        <Box ref={useCasesRef} component="section" id="use-cases" aria-label="Real-World Applications">
          <UseCasesNarrative />
        </Box>

        <Divider />

        {/* 05. Compact & Sequential Sections Zone */}
        <Box ref={compactZoneRef} id="compact-zone">
          <Box component="section" id="process-sequence" aria-label="Engineering Process">
            <ProcessSection />
          </Box>
          <Divider />

          <Box component="section" id="reach-sequence" aria-label="Global Footprint">
            <ReachSection />
          </Box>
          <Divider />

          <Box component="section" id="daily-life-sequence" aria-label="Daily Life Behind the Code">
            <DailyLifeSection />
          </Box>
          <Divider />

          <Box component="section" id="careers-sequence" aria-label="Talent and Technical Careers">
            <CandidatesAndCareersSection />
          </Box>
          <Divider />

          <Box component="section" id="blog-sequence" aria-label="Intelligence Feed and Blog">
            <BlogSection />
          </Box>
        </Box>
      </Box>
      {/* No footer here: AppShell renders the site footer for every route */}
    </>
  );
}

