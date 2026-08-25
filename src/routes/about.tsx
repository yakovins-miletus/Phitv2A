import { lazy, Suspense } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";

import { CONTENT } from "@/shared/content";
import { Reveal } from "@/shared/components/Reveal";
import { NAV_ANCHORS, useNavbarAnchor } from "@/shared/components/NavbarContext";
import { JourneyTimeline } from "@/features/about/components/JourneyTimeline";
import { BackgroundReveal } from "@/features/about/components/BackgroundReveal";
import { HeroGallery } from "@/features/about/components/HeroGallery";
import { SmoothSection } from "@/features/about/components/SmoothSection";
import { PoweredBySection } from "@/features/about/components/PoweredBySection";
import { GraduateHallOfFameSection } from "@/features/about/components/GraduateHallOfFameSection";
import { CertificationsSection } from "@/features/about/components/CertificationsSection";
import { PrinciplesValuesShowcase } from "@/features/about/components/PrinciplesValuesShowcase";
import { TalentSection } from "@/features/about/components/TalentSection";
import { AcademySection } from "@/features/about/components/AcademySection";
import { pageHead } from "@/shared/seo";
import { NOIR } from "@/shared/theme/palette";
import { MONO, TYPE_SCALE } from "@/shared/theme/theme";

// ── Talent/culture narrative, relocated from the home page ──────────────────
// (PRD-home-client-focus §US-2: home became client-facing only, so the
// culture film, careers, testimonials, and blog moved here intact.)
//
// /about has no `SectionBeat`/ground-per-section stage system of its own —
// it uses `Section`/`Reveal`/`SmoothSection` instead. But `SectionBeat` looks
// its section up via `aboutSection()` against `ABOUT_SECTIONS` (throws on an
// unknown id) and declares a `ground` that only `GroundLayer` paints, and
// PRD-home-client-focus §US-2 AC-2 requires the culture film's pinned
// ScrollTrigger to "pin, play and release exactly as it did on the home
// page" — so this route now also mounts `<SmoothScroll />` + `<GroundLayer
// stops={ABOUT_GROUND_STOPS} />`, exactly like home does, rather than
// unwrapping the four sections out of the beat system. `<EyeFlow />` (home's
// chapter rail) is deliberately NOT added: it is hard-coded to a 10-chapter,
// two-act journey model (see EyeFlow.tsx's `measure()`/`ACT_GROUPS`) built
// for the whole home page, About's own sections do not participate in that
// journey, and no PRD-home-client-focus AC asks for a chapter rail on
// About — adding one would be new UI, not a like-for-like relocation.
import { SmoothScroll } from "@/shared/components/SmoothScroll";
import { GroundLayer } from "@/shared/components/ground/GroundLayer";
import { ABOUT_GROUND_STOPS } from "@/shared/components/ground/groundStops";
import { aboutSection } from "@/shared/sections";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { SeamEstablishingShot } from "@/features/home/components/establishing/SeamEstablishingShot";
import { DailyLifeSection } from "@/features/home/components/DailyLifeSection/DailyLifeSection";
import { CandidatesAndCareersSection } from "@/features/home/components/CandidatesAndCareersSection";
import { TestimonialsSection } from "@/features/home/components/TestimonialsSection";
import { BlogSection } from "@/features/home/components/BlogSection";

// CurtainTransition statically imports gsap + ScrollTrigger at module scope
// (see that file's own comment), so — same as routes/index.tsx — it is
// reached only through `lazy()`, keeping gsap out of this eager route chunk.
// It hands off into the deep-navy Blog beat, exactly as it did on home.
const CurtainTransition = lazy(() =>
  import("@/shared/components/CurtainTransition").then((m) => ({ default: m.CurtainTransition })),
);

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "About · Phitopolis",
      "Seven years building a top-tier R&D firm in Manila for global markets — our story, mission and values, proven impact, certifications, and our offices.",
    ),
  component: AboutPage,
});

function AboutPage() {
  const heroAnchorRef = useNavbarAnchor(NAV_ANCHORS.ABOUT_HERO, { dark: true });
  const timelineAnchorRef = useNavbarAnchor(NAV_ANCHORS.ABOUT_TIMELINE, { dark: true });

  return (
    <>
      <SmoothScroll />
      <GroundLayer stops={ABOUT_GROUND_STOPS} />
      <Box sx={{ pt: 0, pb: 0, position: "relative" }}>
      {/* ── Document-Flow Sentinel for Navbar Dark Mode ──
          Positioned absolute relative to page flow (not sticky container) so when the sheet
          scrolls up over the hero, the sentinel leaves the navbar strip and navbar reverts to light mode. */}
      <Box
        ref={heroAnchorRef}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: { xs: "35vh", md: "50vh" },
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Sticky Parallax Hero Section ── */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 1,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          px: { xs: 3, sm: 6, md: 8, lg: 12 },
        }}
      >
        <BackgroundReveal />
        <Grid
          container
          spacing={{ xs: 6, md: 4 }}
          alignItems="center"
          justifyContent="center"
          sx={{ position: "relative", zIndex: 2, width: "100%", mx: "auto" }}
        >
          {/* Left Column: Centralized Left-Aligned Text Block */}
          <Grid size={{ xs: 12, md: 5.5 }}>
            <Reveal>
              <Stack spacing={3} sx={{ textAlign: "left", maxWidth: 620 }}>
                <Box sx={{ display: "inline-flex" }}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: NOIR.gold,
                      fontWeight: 800,
                      letterSpacing: "0.22em",
                      fontSize: TYPE_SCALE.body2,
                      fontFamily: MONO,
                      textTransform: "uppercase",
                    }}
                  >
                    {CONTENT.about.overline}
                  </Typography>
                </Box>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "2.3rem", sm: "3.1rem", md: "3.6rem" },
                    lineHeight: 1.15,
                    letterSpacing: "-0.025em",
                  }}
                >
                  <Box component="span" sx={{ color: NOIR.gold, display: "inline" }}>
                    {CONTENT.about.headingAccent}{" "}
                  </Box>
                  <Box component="span" sx={{ color: NOIR.white, display: "inline" }}>
                    {CONTENT.about.headingRest}
                  </Box>
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "rgba(255, 255, 255, 0.85)",
                    fontSize: { xs: "1.05rem", md: "1.2rem" },
                    lineHeight: 1.6,
                    fontWeight: 400,
                    maxWidth: 540,
                  }}
                >
                  {CONTENT.about.lead}
                </Typography>
              </Stack>
            </Reveal>
          </Grid>

          {/* Right Column: 3-Image Composition with Glowing Center Piece */}
          <Grid size={{ xs: 12, md: 6.5 }}>
            <Reveal delay={0.2}>
              <HeroGallery />
            </Reveal>
          </Grid>
        </Grid>
      </Box>

      {/* ── Parallax Overlay Sheet (Slides up and covers the Hero section) ── */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          bgcolor: "background.default",
          borderTopLeftRadius: { xs: 28, md: 48 },
          borderTopRightRadius: { xs: 28, md: 48 },
          boxShadow: "0 -16px 48px rgba(0, 0, 0, 0.22)",
          pt: { xs: 8, md: 14 },
          pb: 0,
          display: "flex",
          flexDirection: "column",
          gap: { xs: 12, md: 20 },
        }}
      >
        <SmoothSection>
          <PoweredBySection />
        </SmoothSection>
        
        <PrinciplesValuesShowcase />
        
        <SmoothSection>
          <Box ref={timelineAnchorRef}>
            <JourneyTimeline />
          </Box>
        </SmoothSection>
        
        <SmoothSection>
          <TalentSection />
        </SmoothSection>



        <GraduateHallOfFameSection />
        
        <SmoothSection>
          <CertificationsSection />
        </SmoothSection>

        {/* ── Talent/culture narrative (relocated from home) ──────────────
            Relative order preserved exactly as it was on the home page:
            Daily Life → Careers → Testimonials → Blog. */}

        {/* Behind The Code — the culture film. Major Establishing Shot (the
            Act I → Act II handover on home) is paired with DailyLifeSection
            via SectionBeat, which renders `bare` because `daily-life`
            declares `ownsPin: true` in ABOUT_SECTIONS (sections.ts). The pin
            is DailyLifeSection's own (`trigger: sectionRef.current`,
            refreshPriorityFor(sectionOrder("daily-life")) — see
            DailyLifeSection.tsx); `bare` guarantees it is never a descendant
            of anything SectionBeat transforms, so the pin geometry — and
            therefore AC-2's "pins, plays and releases exactly as it did on
            the home page" — is unaffected by the move. Order is /about's own
            first beat order (index 0 in ABOUT_SECTIONS), independent of
            home's numbering.

            Wrapped in its own opaque navy Box for the same reason the Blog
            + Academy zone below is: the "Parallax Overlay Sheet" this whole
            page lives inside paints `background.default` (light) at
            `zIndex: 2` for its entire height, in front of GroundLayer's
            scroll-driven canvas. `candidates`/`testimonials` never notice
            because their own declared ground is light too — `daily-life` is
            the one `deep` (navy) section in this run with nothing of its
            own to occlude that sheet, so its GroundLayer navy was rendering
            as the sheet's light `background.default` instead. Match
            `GROUNDS.deep.bg` (`NOIR.navyDeep`) explicitly, the same pattern
            the Blog/Academy Box below already uses. */}
        <Box sx={{ bgcolor: NOIR.navyDeep, width: "100%", position: "relative", zIndex: 1 }}>
          <SectionBeat
            section={aboutSection("daily-life")}
            establishing={<SeamEstablishingShot selfDriven={false} />}
          >
            <DailyLifeSection />
          </SectionBeat>
        </Box>

        {/* `CandidatesAndCareersSection`'s own SectionBeat renders
            `id="candidates"`, `aria-label="Talent and Technical Careers"`,
            and `data-act="people"` directly (from the `candidates`
            SectionDef) — the wrapper `<section id="careers-sequence">` that
            used to carry those attributes is gone. */}
        <CandidatesAndCareersSection />

        {/* Same consolidation as above: `testimonials`'s SectionBeat now
            carries `aria-label="Hear From Our People"` and
            `data-act="people"` itself. */}
        <TestimonialsSection />

        {/* Dynamic Row-by-Row Curtain Transition into Deep Navy Blog beat —
            moved here from routes/index.tsx (see that file's comment): it
            handed off into Blog + ClosingShelf together on home, and
            ClosingShelf stayed on home, so the curtain now leads only into
            the relocated Blog. */}
        <Suspense fallback={null}>
          <CurtainTransition rows={6} />
        </Suspense>

        {/* Deep Navy Dark Zone for the Intelligence Feed + Academy.
            Both sections share the navy ground so they flow seamlessly
            with no white gap between them and the footer. */}
        <Box sx={{ bgcolor: NOIR.navyField, width: "100%", position: "relative", zIndex: 1 }}>
          <BlogSection />
          <AcademySection />
        </Box>
      </Box>
    </Box>
    </>
  );
}
