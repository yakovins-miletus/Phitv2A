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
      <Box sx={{ position: 'relative', overflowX: 'clip' }}>
        <SuperHeroSequence />
        {/* CONTENT.impact, not CONTENT.stats: the strip is the page's first
            hard claim, and "2 R&D offices / 6 open roles" spent it on filler
            while the real numbers (100x latency, 99.4% accuracy) sat unused. */}
        <Box id="stats">
          <StatStrip stats={CONTENT.impact} />
        </Box>
        <Divider />
        <CapabilityRack />
        <Box ref={useCasesRef} id="use-cases">
          <UseCasesNarrative />
        </Box>
        <Divider />
        <Box ref={compactZoneRef}>
          <ProcessSection />
          <ReachSection />
          <DailyLifeSection />
          <CandidatesAndCareersSection />
          <BlogSection />
        </Box>
      </Box>
      {/* No footer here: AppShell renders the site footer for every route, and
          this page used to stack a second one directly on top of it. */}
    </>
  );
}
