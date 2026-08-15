import { useRef } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { createFileRoute } from "@tanstack/react-router";

import { pageHead } from "@/shared/seo";
import { EyeFlow } from "@/shared/components/EyeFlow";
import { GroundLayer } from "@/shared/components/ground/GroundLayer";
import { SmoothScroll } from "@/shared/components/SmoothScroll";
import { useStagePresence } from "@/shared/components/StageSection";
import { NAV_ANCHORS, useNavbarAnchor } from "@/shared/components/NavbarContext";
import { SuperHeroSequence } from "@/features/hero/SuperHeroSequence";
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
import { PillarsEstablishingShot } from "@/features/home/components/establishing/PillarsEstablishingShot";
import { ProcessEstablishingShot } from "@/features/home/components/establishing/ProcessEstablishingShot";
import { SeamEstablishingShot } from "@/features/home/components/establishing/SeamEstablishingShot";
import { MiniEstablishingShot } from "@/shared/components/establishing/MiniEstablishingShot";
import { CurtainTransition } from "@/shared/components/CurtainTransition";
import { NOIR } from "@/shared/theme/palette";

// No gsap/lenis imports at route-module scope: this file stays in the eager
// bundle even with autoCodeSplitting, so anything imported here ships to every
// visitor. Scroll wiring lives in <SmoothScroll /> and inside the section
// components, which ride the lazy home chunk.

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
      <Box component="main" id="home-main" sx={{ position: "relative", overflowX: "clip" }}>
        {/* 01. Hero Sequence */}
        <Box
          component="section"
          id="hero-sequence"
          aria-label="Hero Sequence"
          data-act="services"
          sx={{ position: "relative", zIndex: 1 }}
        >
          <SuperHeroSequence />
        </Box>

        {/* 02-04. Parallax overlay sheet */}
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
          <MissionStatement />

          {/* Major Establishing Shot 1: Operating Pillars */}
          <PillarsEstablishingShot />
          <OperatingPillars />

          {/* Mini Establishing Shot 1: Market Position */}
          <Container maxWidth="2xl" sx={{ pt: { xs: 4, md: 6 } }}>
            <MiniEstablishingShot
              indexTag="01.MINI"
              category="MARKET POSITIONING"
              title="Professional"
              titleAccent="Leadership"
              tracer="Decades of institutional Wall Street domain mastery paired with disciplined engineering execution."
              status="ONLINE"
            />
          </Container>
          <MarketPosition />
        </Box>

        {/* Mini Establishing Shot 2: Capabilities */}
        <Box
          component="section"
          id="capabilities"
          aria-label="Capabilities and Services"
          data-act="services"
        >
          <Container maxWidth="2xl" sx={{ pt: { xs: 6, md: 10 } }}>
            <MiniEstablishingShot
              indexTag="02.MINI"
              category="CORE DISCIPLINES"
              title="Four disciplines."
              titleAccent="One delivery contract."
              tracer="High-performance computing, systematic execution engines, and mathematical research frameworks."
              status="04 DISCIPLINES"
            />
          </Container>
          <CapabilityRack />
        </Box>

        {/* Mini Establishing Shot 3: Use Cases */}
        <Box
          ref={useCasesRef}
          component="section"
          id="use-cases"
          aria-label="Real-World Applications"
          data-act="services"
        >
          <Container maxWidth="2xl" sx={{ pt: { xs: 6, md: 8 } }}>
            <MiniEstablishingShot
              indexTag="03.MINI"
              category="APPLIED ARCHITECTURES"
              title="Real-World"
              titleAccent="Applications"
              tracer="End-to-end telemetry and architectural breakdowns of institutional deployments across global venues."
              status="PROD_READY"
            />
          </Container>
          <UseCasesNarrative />
        </Box>

        {/* 04. Compact & Sequential Sections Zone */}
        <Box ref={compactZoneRef} id="compact-zone">
          {/* Major Establishing Shot 2: Process Pipeline */}
          <ProcessEstablishingShot />
          <Box
            component="section"
            id="process-sequence"
            aria-label="Engineering Process"
            data-act="services"
          >
            <ProcessSection />
          </Box>

          {/* Mini Establishing Shot 4: Global Footprint */}
          <Container maxWidth="2xl" sx={{ pt: { xs: 6, md: 8 } }}>
            <MiniEstablishingShot
              indexTag="04.MINI"
              category="GLOBAL FABRIC"
              title="Worldwide Low-Latency"
              titleAccent="Interconnect"
              tracer="Co-located execution presence spanning London, New York, Singapore, and Tokyo financial hubs."
              status="SYNC: <1ms"
            />
          </Container>

          {/* Global Footprint — closes Act I */}
          <Box
            component="section"
            id="reach-sequence"
            aria-label="Global Footprint"
            data-act="services"
          >
            <ReachSection />
          </Box>

          {/* Major Establishing Shot 3: The Seam / Handover between Act I (Services) and Act II (People) */}
          <SeamEstablishingShot />

          {/* ── ACT II · PEOPLE ───────────────────────────────────────────────── */}
          <Box
            component="section"
            id="daily-life-sequence"
            aria-label="Daily Life Behind the Code"
            data-act="people"
          >
            <DailyLifeSection />
          </Box>

          {/* Mini Establishing Shot 5: Talent & Careers */}
          <Container maxWidth="2xl" sx={{ pt: { xs: 6, md: 8 } }}>
            <MiniEstablishingShot
              indexTag="05.MINI"
              category="HUMAN CAPITAL"
              title="For talents that outgrow"
              titleAccent="large institutions"
              tracer="Work alongside extraordinary researchers, system architects, and algorithmic specialists."
              status="HIRING // GLOBAL"
            />
          </Container>
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
            id="testimonials-sequence"
            aria-label="Hear From Our People"
            data-act="people"
          >
            <TestimonialsSection />
          </Box>

          {/* Dynamic Row-by-Row Curtain Transition into Deep Navy Act II Finale */}
          <CurtainTransition rows={6} />

          {/* Deep Navy Dark Zone for Intelligence Feed & Horizon Gateway */}
          <Box sx={{ bgcolor: NOIR.navyField, width: "100%", position: "relative", zIndex: 1 }}>
            {/* Mini Establishing Shot 6: Intelligence Feed */}
            <Container maxWidth="2xl" sx={{ pt: { xs: 6, md: 8 } }}>
              <MiniEstablishingShot
                indexTag="06.MINI"
                category="TECHNICAL DISPATCHES"
                title="Inside"
                titleAccent="Phitopolis"
                tracer="Fresh technical dispatches from our quantitative labs, systems engineers, and market strategists."
                status="FEED: LIVE"
                dark
              />
            </Container>
            <Box
              component="section"
              id="blog-sequence"
              aria-label="Intelligence Feed and Blog"
              data-act="people"
            >
              <BlogSection />
            </Box>

            {/* Mini Establishing Shot 7: Horizon Gateway */}
            <Container maxWidth="2xl" sx={{ pt: { xs: 6, md: 8 } }}>
              <MiniEstablishingShot
                indexTag="07.MINI"
                category="GATEWAY TERMINAL"
                title="In"
                titleAccent="closing"
                tracer="Direct line to our technical leadership and quantitative engineering directors."
                status="READY"
                dark
              />
            </Container>
            <ClosingShelf />
          </Box>
        </Box>
      </Box>
    </>
  );
}

