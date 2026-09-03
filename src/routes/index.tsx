import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { createFileRoute } from "@tanstack/react-router";

import { pageHead } from "@/shared/seo";
import { EyeFlow } from "@/shared/components/EyeFlow";
import { GroundLayer } from "@/shared/components/ground/GroundLayer";
import { BarTransitionSection } from "@/shared/components/ground/BarTransitionSection";
import { NAV_ANCHORS } from "@/shared/components/navbarAnchors";
import { SmoothScroll } from "@/shared/components/SmoothScroll";
import { refreshScrollTriggers } from "@/shared/motion/scrollTriggerBridge";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { homeSection } from "@/shared/sections";
import { SuperHeroSequence } from "@/features/hero/SuperHeroSequence";
import { MissionStatement } from "@/features/hero/description/MissionStatement";
import { OperatingPillars } from "@/features/hero/description/OperatingPillars";
import { GlobalMarketsStatement } from "@/features/home/components/GlobalMarketsStatement";
import { UseCasesNarrative } from "@/features/services/components/UseCasesNarrative";
import { ClosingVideoSection } from "@/features/home/components/ClosingVideoSection";
import { ProcessSection } from "@/features/home/components/ProcessSection";
import { ReachSection } from "@/features/home/components/ReachSection";
import { MiniEstablishingShot } from "@/shared/components/establishing/MiniEstablishingShot";

// No gsap/lenis imports at route-module scope: this file stays in the eager
// bundle even with autoCodeSplitting, so anything imported here ships to every
// visitor. Scroll wiring lives in <SmoothScroll /> and inside the section
// components, which ride the lazy home chunk.

// Blog + ClosingShelf. With Blog relocated to /about, ClosingShelf now
// follows ReachSection directly and paints its own "field" ground via
// GroundLayer, so neither is needed here any more — CurtainTransition moved
// to about.tsx, immediately ahead of the relocated BlogSection, preserving
// the same visual handoff for the content it was built for.

export const Route = createFileRoute("/")(
  {
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
            bgcolor: "background.default",
            borderTopLeftRadius: { xs: 28, md: 48 },
            borderTopRightRadius: { xs: 28, md: 48 },
          }}
        >
          <MissionStatement />
        </Box>

        {/* ── Bar Transition: hero-mission (panel) → global-markets (deep) ── */}
        <BarTransitionSection
          from="panel"
          to="deep"
          anchor={NAV_ANCHORS.HOME_BRIDGE_MARKETS}
        />

        <GlobalMarketsStatement />

        {/* ── Bar Transition: global-markets (deep) → hero-pillars (void) ── */}
        <BarTransitionSection
          from="deep"
          to="void"
          anchor={NAV_ANCHORS.HOME_BRIDGE_PILLARS}
        />

        {/* Operating Pillars — establishing shot now lives inside its own
            SectionBeat, driven on one timeline. See OperatingPillars.tsx. */}
        <OperatingPillars />

        {/* No bar transition here: hero-pillars and use-cases both sit on the
            same light ground (void/panel) today, so a wipe here was never a
            real color handoff — removed rather than recolored. */}

        {/* Mini Establishing Shot 2: Use Cases. `use-cases` is now a normal
            (non-bare) beat — the old pinned horizontal scrub is gone, replaced
            by a vertical scroll of ~90svh blocks with a sticky crossfading
            background (UseCasesNarrative). `alignItems: "stretch"` because the
            content is taller than the section and a centered flex row would let
            it overflow upward. UseCasesNarrative does its own full-bleed
            breakout out of SectionBeat's Container. */}
        <SectionBeat
          section={homeSection("use-cases")}
          sx={{ alignItems: "stretch" }}
          establishing={
            <MiniEstablishingShot
              category="PROVEN PRODUCTION PLATFORMS"
              title="Engineered & Proven"
              titleAccent="At Global Scale"
              tracer="Mission-critical platforms architected, delivered, and relied upon continuously by tier-one financial institutions worldwide."
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
          {/* No bar transition here: ProcessSection is itself a full-bleed navy
              slab with a gold hairline top border, so the panel → deep handoff
              already reads as a deliberate hard cut. The 60vh wipe that used to
              sit here bought nothing but dead scroll between the last use-case
              card and the "development powerhouse" heading — removed rather
              than shortened. The navbar keeps its dark state over the slab via
              ProcessSection's own PROCESS_IMMERSIVE anchor. */}

          {/* Problem To Production. Had a Major Establishing Shot 2 here, then
              inside ProcessSection's own SectionBeat; ADR-0002 dropped the shot
              entirely — a half-screen title card left nothing for the
              one-viewport composition it announced. The title is inline now. */}
          <ProcessSection />

          {/* ── Bar Transition: process (deep) → reach (white) ── */}
          <BarTransitionSection
            from="deep"
            to="white"
            anchor={NAV_ANCHORS.HOME_BRIDGE_REACH}
          />

          {/* Global Footprint — closes the SERVICES narrative. Mini
              Establishing Shot 4 now lives inside ReachSection's own
              SectionBeat, which renders `id="reach"`, `aria-label="Global
              Footprint"`, and `data-act="services"` directly (from the
              `reach` SectionDef in sections.ts) — the wrapper `<section
              id="reach-sequence">` that used to carry those attributes is
              gone; it existed only because SectionBeat had nowhere else to
              put them. */}
          <ReachSection />

          {/* No bar transition into the closing beat — ClosingLattice opens
              with its own pinned "P + vignette" build, which reads better as a
              hard cut straight from Reach than after a wipe. */}

          {/* Closing beat — full-bleed scroll-scrubbed video with centered,
              horizontally expanded 2-beat reveal sequence (Beat 1: statement,
              Beat 2: CTA). Directly follows Reach. */}
          <ClosingVideoSection />
        </Box>
      </Box>
    </>
  );
}
