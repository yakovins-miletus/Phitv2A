import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PsychologyIcon from "@mui/icons-material/Psychology";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import CodeIcon from "@mui/icons-material/Code";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import { createFileRoute } from "@tanstack/react-router";

import { CONTENT } from "@/shared/content";
import { FillText } from "@/shared/components/FillText";
import { Reveal, StaggerGroup, StaggerItem } from "@/shared/components/Reveal";
import { Section } from "@/shared/components/Section";
import { StatStrip } from "@/shared/components/StatStrip";
import { NAV_ANCHORS, useNavbarAnchor } from "@/shared/components/NavbarContext";
import { JourneyTimeline } from "@/features/about/components/JourneyTimeline";
import { BackgroundReveal } from "@/features/about/components/BackgroundReveal";
import { HeroGallery } from "@/features/about/components/HeroGallery";
import { MetaLabel } from "@/features/about/components/MetaLabel";
import { SmoothSection } from "@/features/about/components/SmoothSection";
import { PoweredBySection } from "@/features/about/components/PoweredBySection";
import { GraduateHallOfFameSection } from "@/features/about/components/GraduateHallOfFameSection";
import { InternshipProgramSection } from "@/features/about/components/InternshipProgramSection";
import { CertificationsSection } from "@/features/about/components/CertificationsSection";
import { PrinciplesValuesShowcase } from "@/features/about/components/PrinciplesValuesShowcase";
import { pageHead } from "@/shared/seo";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "About · Phitopolis",
      "Seven years building a top-tier R&D firm in Manila for global markets — our story, mission and values, proven impact, certifications, and our offices.",
    ),
  component: AboutPage,
});


// Section 2: Core Culture — moved here from the Home page, underneath Values.
const CULTURE_ICONS = [
  PsychologyIcon,
  LightbulbIcon,
  RecordVoiceOverIcon,
  CodeIcon,
  GroupWorkIcon,
];
function CultureSection() {
  const [isFilled, setIsFilled] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <Section>
        <Box sx={{ mb: { xs: 3, md: 4 } }}>
          <FillText text="Core Competencies" onComplete={setIsFilled} />
        </Box>
        <StaggerGroup>
          <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="center">
            {CONTENT.culture.map((val, i) => {
              const Icon = CULTURE_ICONS[i % CULTURE_ICONS.length] || PsychologyIcon;
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={val}>
                  <StaggerItem>
                    <Box sx={{
                      p: 3,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      bgcolor: isFilled ? `rgba(${NOIR.navyFieldRgb}, 0.03)` : 'transparent',
                      transform: isFilled ? 'translateY(-4px)' : 'none',
                      boxShadow: isFilled ? `0 8px 24px rgba(${NOIR.navyFieldRgb}, 0.12)` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: "-1px",
                        border: 1,
                        borderColor: 'primary.main',
                        borderRadius: 'inherit',
                        pointerEvents: 'none',
                        clipPath: isFilled ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' : 'polygon(0 0, 0 0, 0 100%, 0 100%)',
                        transition: 'clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        transitionDelay: `${i * 0.1}s`,
                      }
                    }}>
                      <Box sx={{
                        opacity: isFilled ? 1 : 0,
                        transform: isFilled ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(-45deg)',
                        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transitionDelay: `${i * 0.1}s`,
                        color: 'primary.main',
                        display: 'flex'
                      }}>
                         <Icon fontSize="large" />
                      </Box>
                      <Typography variant="h4" color={isFilled ? 'primary.main' : 'text.primary'} sx={{
                         transition: 'color 0.5s ease',
                         transitionDelay: `${i * 0.1}s`,
                      }}>
                         {val}
                      </Typography>
                    </Box>
                  </StaggerItem>
                </Grid>
              );
            })}
          </Grid>
        </StaggerGroup>
      </Section>
    </Box>
  );
}

// Section 4: Talent credibility — education and disciplines as insight.
function TalentSection() {
  const { highlights, disciplines, schools } = CONTENT.talent;
  return (
    <Section>
      <Stack spacing={{ xs: 5, md: 7 }}>
        <Reveal>
          <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
            <MetaLabel>Where Our Talent Comes From</MetaLabel>
            <Typography variant="h2" component="h2">
              Recruited from the top programs in the Philippines and Asia
            </Typography>
          </Stack>
        </Reveal>

        <Reveal delay={0.1}>
          <StatStrip stats={highlights} />
        </Reveal>

        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Reveal>
              <Stack spacing={2}>
                <MetaLabel>Disciplines</MetaLabel>
                <StaggerGroup>
                  <Stack spacing={2}>
                    {disciplines.map((discipline) => (
                      <StaggerItem key={discipline.label}>
                        <Box sx={{
                          p: 1.5, borderRadius: 1, ml: -1.5,
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": { bgcolor: "action.hover", transform: "translateX(8px)" }
                        }}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                            <Typography variant="body2" color="text.primary">
                              {discipline.label}
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: MONO, color: "text.secondary" }}>
                              {discipline.pct}%
                            </Typography>
                          </Stack>
                          <Box sx={{ height: 4, borderRadius: 2, bgcolor: "divider", overflow: "hidden" }}>
                            <Box sx={{ width: `${String(discipline.pct)}%`, height: 1, bgcolor: NOIR.gold }} />
                          </Box>
                        </Box>
                      </StaggerItem>
                    ))}
                  </Stack>
                </StaggerGroup>
              </Stack>
            </Reveal>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Reveal delay={0.1}>
              <Stack spacing={2}>
                <MetaLabel>Alma Maters</MetaLabel>
                <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
                  {schools.map((school) => (
                    <Stack
                      key={school.name}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      title={school.name}
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        bgcolor: "background.default",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          borderColor: "primary.main",
                        }
                      }}
                    >
                      {school.logo ? (
                        <Box component="img" decoding="async" loading="lazy" src={school.logo} alt={school.name} sx={{ width: 20, height: 20, objectFit: "contain", borderRadius: "50%", bgcolor: "white" }} />
                      ) : (
                        <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: "divider" }} />
                      )}
                      <Typography variant="body2" sx={{ fontFamily: MONO, fontSize: "0.75rem", fontWeight: 500, color: "text.primary" }}>
                        {school.abbr}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
                  A multi-disciplined team covering every layer of the stack — from the country's
                  leading computer-science programs to internationally educated specialists
                </Typography>
              </Stack>
            </Reveal>
          </Grid>
        </Grid>
      </Stack>
    </Section>
  );
}

function AboutPage() {
  const heroAnchorRef = useNavbarAnchor(NAV_ANCHORS.ABOUT_HERO, { dark: true });
  const timelineAnchorRef = useNavbarAnchor(NAV_ANCHORS.ABOUT_TIMELINE, { dark: true });

  return (
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
          spacing={{ xs: 6, md: 8 }}
          alignItems="center"
          sx={{ position: "relative", zIndex: 2, width: "100%", mx: "auto" }}
        >
          {/* Left Column: Centralized Left-Aligned Text Block */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Reveal>
              <Stack spacing={3} sx={{ textAlign: "left", maxWidth: 620 }}>
                <Box sx={{ display: "inline-flex" }}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: "#FFC72C",
                      fontWeight: 800,
                      letterSpacing: "0.2em",
                      fontSize: "0.85rem",
                      fontFamily: MONO,
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
                    color: "common.white",
                    fontSize: { xs: "2.2rem", sm: "2.8rem", md: "3.4rem" },
                    lineHeight: 1.15,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {CONTENT.about.heading}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "rgba(255, 255, 255, 0.85)",
                    fontSize: { xs: "1rem", md: "1.15rem" },
                    lineHeight: 1.65,
                    fontWeight: 400,
                  }}
                >
                  {CONTENT.about.lead}
                </Typography>
              </Stack>
            </Reveal>
          </Grid>

          {/* Right Column: 3-Image Dynamic Composition */}
          <Grid size={{ xs: 12, md: 6 }}>
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
          pb: { xs: 12, md: 16 },
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
          <CultureSection />
        </SmoothSection>
        
        <SmoothSection>
          <Box ref={timelineAnchorRef}>
            <JourneyTimeline />
          </Box>
        </SmoothSection>
        
        <SmoothSection>
          <TalentSection />
        </SmoothSection>

        <GraduateHallOfFameSection />

        <InternshipProgramSection />
        
        <SmoothSection>
          <CertificationsSection />
        </SmoothSection>
      </Box>
    </Box>
  );
}
