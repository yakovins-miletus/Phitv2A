import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { createFileRoute } from "@tanstack/react-router";

import { pageHead } from "@/shared/seo";
import { EyeFlow } from "@/shared/components/EyeFlow";
import { GroundLayer } from "@/shared/components/ground/GroundLayer";
import { GroundTransitionBuffer } from "@/shared/components/ground/GroundTransitionBuffer";
import { SmoothScroll } from "@/shared/components/SmoothScroll";
import { refreshScrollTriggers } from "@/shared/motion/scrollTriggerBridge";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { homeSection } from "@/shared/sections";
import { SuperHeroSequence } from "@/features/hero/SuperHeroSequence";
import { MissionStatement } from "@/features/hero/description/MissionStatement";
import { OperatingPillars } from "@/features/hero/description/OperatingPillars";
import { GlobalMarketsStatement } from "@/features/home/components/GlobalMarketsStatement";
import { UseCasesNarrative } from "@/features/services/components/UseCasesNarrative";
import { ClosingShelf } from "@/features/home/components/ClosingShelf";
import { ProcessSection } from "@/features/home/components/ProcessSection";
import { ReachSection } from "@/features/home/components/ReachSection";
import { MiniEstablishingShot } from "@/shared/components/establishing/MiniEstablishingShot";

// No gsap/lenis imports at route-module scope: this file stays in the eager
// bundle even with autoCodeSplitting, so anything imported here ships to every
// visitor. Scroll wiring lives in <SmoothScroll /> and inside the section
// components, which ride the lazy home chunk.
//
// CapabilityRack ("four disciplines" capability grid) and the PEOPLE-act
// sections (DailyLifeSection, CandidatesAndCareersSection,
// TestimonialsSection, BlogSection) no longer mount here —
// PRD-home-client-focus §2b/§2c removed the duplicated capability grid and
// relocated the talent/culture narrative to /about. CapabilityRack itself is
// untouched and still exists for a future /services usage; the four
// relocated sections now live in routes/about.tsx with their own
// SectionBeat orders — see ABOUT_SECTIONS in shared/sections.ts.
//
// CurtainTransition (the row-slat reveal into the deep-navy PEOPLE finale)
// and the NOIR.navyField dark wrapper existed purely to hand off into
// Blog + ClosingShelf. With Blog relocated to /about, ClosingShelf now
// follows ReachSection directly and paints its own "field" ground via
// GroundLayer, so neither is needed here any more — CurtainTransition moved
// to about.tsx, immediately ahead of the relocated BlogSection, preserving
// the same visual handoff for the content it was built for.

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

        {/* 02. Parallax overlay sheet
         *
         * Partial reversal of the WS-02 re-order (explicit user decision):
         * mission core is back up front, running immediately after the hero
         * and ahead of the global-markets claim. `MissionStatement` used to
         * run here too, alongside a second identity section that has since
         * been deleted outright (it restated MissionStatement's job) — that
         * deletion still stands, only the ordering reverted. It still
         * lazy-mounts `ServiceGlobe` behind its own `useInView` gate; see
         * MissionStatement.tsx. GlobalMarketsStatement follows with the
         * claim, alone on its own screen, and OperatingPillars follows that
         * with what the claim means in practice. */}
        <Box
          data-act="services"
          sx={{
            position: "relative",
            zIndex: 2,
            mt: "-100vh",
          }}
        >
          <MissionStatement />
          <GroundTransitionBuffer />
          <GlobalMarketsStatement />

          <GroundTransitionBuffer />
          {/* Operating Pillars — establishing shot now lives inside its own
              SectionBeat, driven on one timeline. See OperatingPillars.tsx. */}
          <OperatingPillars />
        </Box>

        <GroundTransitionBuffer />
        {/* Mini Establishing Shot 2: Use Cases — paired with UseCasesNarrative
            via SectionBeat, which renders `bare` because `use-cases`
            declares `ownsPin: true` in HOME_SECTIONS (sections.ts). The pin
            is UseCasesNarrative's own (`trigger: wrap.current`,
            refreshPriorityFor(sectionOrder("use-cases")) — see
            UseCasesNarrative.tsx); `bare` guarantees it is never a descendant
            of anything SectionBeat transforms, so the pin geometry is
            unaffected by the shot/beat wrapper around it. */}
        <SectionBeat
          section={homeSection("use-cases")}
          establishing={
            <MiniEstablishingShot
              category="APPLIED ARCHITECTURES"
              title="Real-World"
              titleAccent="Applications"
              tracer="End-to-end telemetry and architectural breakdowns of institutional deployments across global venues."
              selfDriven={false}
            />
          }
        >
          <UseCasesNarrative />
        </SectionBeat>

        {/* 04. Compact & Sequential Sections Zone
         *
         * Used to carry the sole HOME_COMPACT navbar anchor, one giant
         * IntersectionObserver target spanning from here through ClosingShelf.
         * That's exactly the shape that broke NavbarContext's topmost-wins
         * precedence rewrite: IntersectionObserver only re-fires on a
         * threshold CROSSING, not on every scroll tick while an element stays
         * continuously intersecting — so once this box entered the detection
         * band near Process, its recorded geometry never updated again until
         * it finally exited past ClosingShelf. Every properly-scoped anchor
         * nested inside it (process, reach, closing) kept losing to that
         * frozen, stale entry the moment its own `top` drifted past whatever
         * HOME_COMPACT had recorded on first entry — the navbar read light
         * over sections registered dark.
         *
         * Every section that needs one has its own dedicated anchor (see
         * NavbarContext.tsx's NAV_ANCHORS and this file's per-section Boxes
         * below), so the giant catch-all is redundant, not just buggy — it's
         * been removed rather than resized. The stretches with no anchor at
         * all — global-markets/hero-mission/hero-pillars/use-cases, all
         * before this box starts — need none: with nothing registered,
         * `isOverDarkSection` resolves to false (see NavbarContext.tsx),
         * which is exactly correct for light-ground sections.
         *
         * PEOPLE-act sections (daily-life, candidates, testimonials, blog)
         * used to continue this zone below Reach — they relocated to /about
         * (PRD-home-client-focus §US-2), so the zone now ends at ClosingShelf. */}
        <Box id="compact-zone">
          <GroundTransitionBuffer />
          {/* Problem To Production. Had a Major Establishing Shot 2 here, then
              inside ProcessSection's own SectionBeat; ADR-0002 dropped the shot
              entirely — a half-screen title card left nothing for the
              one-viewport composition it announced. The title is inline now. */}
          <ProcessSection />

          <GroundTransitionBuffer />
          {/* Global Footprint — closes the SERVICES narrative. Mini
              Establishing Shot 4 now lives inside ReachSection's own
              SectionBeat, which renders `id="reach"`, `aria-label="Global
              Footprint"`, and `data-act="services"` directly (from the
              `reach` SectionDef in sections.ts) — the wrapper `<section
              id="reach-sequence">` that used to carry those attributes is
              gone; it existed only because SectionBeat had nowhere else to
              put them. */}
          <ReachSection />

          <GroundTransitionBuffer />
          {/* Closing beat — operational footprint / horizon gateway. Mini
              Establishing Shot 7 lives inside ClosingShelf's own SectionBeat,
              which drives it on one timeline. Directly follows Reach now that
              the PEOPLE act (daily-life/candidates/testimonials/blog) has
              relocated to /about. */}
          <ClosingShelf />
        </Box>
      </Box>
    </>
  );
}

