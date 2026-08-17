import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { createFileRoute } from "@tanstack/react-router";

import { pageHead } from "@/shared/seo";
import { EyeFlow } from "@/shared/components/EyeFlow";
import { GroundLayer } from "@/shared/components/ground/GroundLayer";
import { SmoothScroll } from "@/shared/components/SmoothScroll";
import { NAV_ANCHORS, useNavbarAnchor } from "@/shared/components/NavbarContext";
import { refreshScrollTriggers } from "@/shared/motion/scrollTriggerBridge";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { homeSection } from "@/shared/sections";
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

// Debounce for the home-page ResizeObserver refresh below. Long enough that a
// burst of layout changes (e.g. several lazy images settling in quick
// succession) collapses into one ScrollTrigger.refresh() instead of many.
const HOME_RESIZE_REFRESH_DEBOUNCE_MS = 150;

function HomePage() {
  const homeMainRef = useRef<HTMLElement>(null);
  const compactZoneRef = useNavbarAnchor(NAV_ANCHORS.HOME_COMPACT);

  // General staleness fix for issues 1+2 (mistimed establishing shots, hero/
  // mission overlap): any height change on the home page during this visit —
  // HeroImageWall mounting mid-scroll, a MiniEstablishingShot reveal, future
  // lazy content — recomputes every ScrollTrigger's start/end. Scoped to the
  // home route only (this effect never runs on other routes, since this
  // component only mounts here) and goes through the gsap-free bridge module
  // rather than importing ScrollTrigger directly, since this route file stays
  // in the eager bundle.
  useEffect(() => {
    const el = homeMainRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refreshScrollTriggers();
      }, HOME_RESIZE_REFRESH_DEBOUNCE_MS);
    });
    observer.observe(el);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <SmoothScroll />
      <GroundLayer />
      <EyeFlow />
      <Box component="main" id="home-main" ref={homeMainRef} sx={{ position: "relative", overflowX: "clip" }}>
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

          {/* Operating Pillars — establishing shot now lives inside its own
              SectionBeat, driven on one timeline. See OperatingPillars.tsx. */}
          <OperatingPillars />

          {/* Market Position — establishing shot now lives inside its own
              SectionBeat, driven on one timeline. See MarketPosition.tsx. */}
          <MarketPosition />
        </Box>

        {/* Mini Establishing Shot 2: Capabilities — the shot now lives inside
            CapabilityRack's own SectionBeat, which drives it on one timeline. */}
        <Box
          component="section"
          id="capabilities"
          aria-label="Capabilities and Services"
          data-act="services"
        >
          <CapabilityRack />
        </Box>

        {/* Mini Establishing Shot 3: Use Cases — paired with UseCasesNarrative
            via SectionBeat in `bare` mode. The pin is UseCasesNarrative's own
            (`trigger: wrap.current`, refreshPriorityFor(5) — see
            UseCasesNarrative.tsx); `bare` guarantees it is never a descendant
            of anything SectionBeat transforms, so the pin geometry is
            unaffected by the shot/beat wrapper around it. order=5 is the gap
            between Capabilities (4) and Process (6). */}
        <SectionBeat
          section={homeSection("use-cases")}
          establishing={
            <MiniEstablishingShot
              indexTag="03.MINI"
              category="APPLIED ARCHITECTURES"
              title="Real-World"
              titleAccent="Applications"
              tracer="End-to-end telemetry and architectural breakdowns of institutional deployments across global venues."
              status="PROD_READY"
              selfDriven={false}
            />
          }
          establishScale="mini"
          order={5}
          bare
          noExitDim
        >
          <UseCasesNarrative />
        </SectionBeat>

        {/* 04. Compact & Sequential Sections Zone */}
        <Box ref={compactZoneRef} id="compact-zone">
          {/* Major Establishing Shot 2: Process Pipeline — the shot now lives
              inside ProcessSection's own SectionBeat, driven on one timeline. */}
          <ProcessSection />

          {/* Global Footprint — closes Act I. Mini Establishing Shot 4 now
              lives inside ReachSection's own SectionBeat. */}
          <Box
            component="section"
            id="reach-sequence"
            aria-label="Global Footprint"
            data-act="services"
          >
            <ReachSection />
          </Box>

          {/* ── ACT II · PEOPLE ───────────────────────────────────────────────── */}
          {/* Major Establishing Shot 3 (the Seam / Act I → Act II handover) is
              paired with DailyLifeSection via SectionBeat in `bare` mode. The
              pin is DailyLifeSection's own (`trigger: sectionRef.current`,
              refreshPriorityFor(10) — see DailyLifeSection.tsx); `bare`
              guarantees it is never a descendant of anything SectionBeat
              transforms, so the pin geometry is unaffected. order=10 matches
              the refreshPriority DailyLifeSection already declared for its
              own pin (page position 10, between Reach=8 and Careers=11). */}
          <SectionBeat
            section={homeSection("daily-life")}
            establishing={<SeamEstablishingShot selfDriven={false} />}
            establishScale="major"
            order={10}
            bare
            noExitDim
          >
            <DailyLifeSection />
          </SectionBeat>

          {/* Mini Establishing Shot 5 now lives inside
              CandidatesAndCareersSection's own SectionBeat. */}
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
            {/* Mini Establishing Shot 6 now lives inside BlogSection's own
                SectionBeat. */}
            <Box
              component="section"
              id="blog-sequence"
              aria-label="Intelligence Feed and Blog"
              data-act="people"
            >
              <BlogSection />
            </Box>

            {/* Mini Establishing Shot 7: Horizon Gateway — now lives inside
                ClosingShelf's own SectionBeat, which drives it on one timeline. */}
            <ClosingShelf />
          </Box>
        </Box>
      </Box>
    </>
  );
}

