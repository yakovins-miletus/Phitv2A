import React, { useState } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PsychologyIcon from "@mui/icons-material/Psychology";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import CodeIcon from "@mui/icons-material/Code";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import ShieldIcon from "@mui/icons-material/Shield";
import VerifiedIcon from "@mui/icons-material/Verified";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

const VALUE_ICONS: Record<string, React.ComponentType<any>> = {
  "Integrity": ShieldIcon,
  "Accountability": VerifiedIcon,
  "Forward Thinking": TrendingUpIcon,
  "Excellence": WorkspacePremiumIcon,
};
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


// Section 1: The four values.
function PrinciplesSection() {
  const { values } = CONTENT.principles;
  return (
    <Section muted>
      <Stack spacing={{ xs: 6, md: 8 }}>
        <Stack spacing={3}>
          <Reveal>
            <Typography variant="h2" component="h2">
              Rooted in values
            </Typography>
          </Reveal>
          <StaggerGroup>
            <Stack divider={<Divider />} sx={{ borderTop: 1, borderBottom: 1, borderColor: "divider" }}>
              {values.map((value) => {
                const Icon = VALUE_ICONS[value.label] || ShieldIcon;
                return (
                  <StaggerItem key={value.label}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={{ xs: 1.5, md: 6 }}
                      sx={{ 
                        py: 3, px: 2, borderRadius: 2, alignItems: { md: "baseline" },
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover .value-title": { 
                          color: "transparent", 
                          backgroundImage: "linear-gradient(135deg, #FFC72C 35%, #FFF6D6 50%, #FFC72C 65%)",
                          backgroundSize: "200% 100%",
                          animation: "valueShimmer 1.8s infinite linear",
                          transition: "color 0.3s ease",
                        },
                        "&:hover .value-def": { 
                          color: "transparent", 
                          backgroundImage: "linear-gradient(135deg, #0A2A66 35%, #3B5585 50%, #0A2A66 65%)",
                          backgroundSize: "200% 100%",
                          animation: "valueShimmer 1.8s infinite linear",
                          transition: "color 0.3s ease",
                        },
                        "&:hover .value-client": { 
                          color: "transparent", 
                          backgroundImage: "linear-gradient(135deg, #6B7FA8 35%, #A2B2D1 50%, #6B7FA8 65%)",
                          backgroundSize: "200% 100%",
                          animation: "valueShimmer 1.8s infinite linear",
                          transition: "color 0.3s ease",
                        },
                        "&:hover .value-icon-container": { width: { xs: "28px", md: "36px" }, opacity: 1, marginRight: { xs: "8px", md: "12px" } },
                        "@keyframes valueShimmer": {
                          "0%": { backgroundPosition: "150% 0" },
                          "100%": { backgroundPosition: "-50% 0" }
                        }
                      }}
                    >
                      {/* Left header group (Icon + Title) */}
                      <Box sx={{ display: "flex", alignItems: "center", flexBasis: { md: 260 }, flexShrink: 0 }}>
                        {/* Inline Push Icon */}
                        <Box
                          className="value-icon-container"
                          sx={{
                            width: 0,
                            opacity: 0,
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "secondary.main",
                            transition: "all 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
                            pointerEvents: "none",
                            "& svg": {
                              fontSize: { xs: "24px", md: "28px" },
                            }
                          }}
                        >
                          <Icon />
                        </Box>

                        <Typography
                          variant="h4"
                          className="value-title"
                          sx={{ 
                            color: "primary.main",
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            transition: "none",
                          }}
                        >
                          {value.label}
                        </Typography>
                      </Box>

                      <Stack spacing={1.5} sx={{ position: "relative", zIndex: 1 }}>
                        <Typography 
                          variant="body1" 
                          className="value-def"
                          sx={{
                            color: "text.primary",
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            transition: "none",
                          }}
                        >
                          {value.definition}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          className="value-client"
                          sx={{
                            color: "text.secondary",
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            transition: "none",
                          }}
                        >
                          {value.valueToClient}
                        </Typography>
                      </Stack>
                    </Stack>
                  </StaggerItem>
                );
              })}
            </Stack>
          </StaggerGroup>
        </Stack>
      </Stack>
    </Section>
  );
}

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

// Section 3: Proven impact — outcome stats.
function ImpactSection() {
  return (
    <Section muted>
      <Stack spacing={{ xs: 4, md: 6 }}>
        <Reveal>
          <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
            <MetaLabel>Proven Impact</MetaLabel>
            <Typography variant="h2" component="h2">
              Results that speak in numbers
            </Typography>
          </Stack>
        </Reveal>
        <Reveal delay={0.1}>
          <StatStrip stats={CONTENT.impact} />
        </Reveal>
      </Stack>
    </Section>
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
                        <Box component="img" src={school.logo} alt={school.name} sx={{ width: 20, height: 20, objectFit: "contain", borderRadius: "50%", bgcolor: "white" }} />
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

// Section 5: Certifications — grouped by provider, framed as insight.
function CertificationsSection() {
  const { headline, note, groups } = CONTENT.certifications;
  return (
    <Section muted>
      <Stack spacing={{ xs: 6, md: 8 }}>
        <Reveal>
          <Stack spacing={2} sx={{ maxWidth: 720 }}>
            <MetaLabel>Certifications</MetaLabel>
            <Typography variant="h2" component="h2" sx={{ fontWeight: 700 }}>
              {headline}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {note}
            </Typography>
          </Stack>
        </Reveal>

        <StaggerGroup>
          <Grid container spacing={4}>
            {groups.map((group) => (
              <Grid size={{ xs: 12 }} key={group.provider}>
                <StaggerItem>
                  <Box sx={{ 
                    p: { xs: 3, md: 5 }, 
                    border: 1, 
                    borderColor: "divider", 
                    borderRadius: 3, 
                    bgcolor: "background.default",
                    overflow: "hidden"
                  }}>
                    {/* Shelf Header */}
                    <Box sx={{ mb: 4, pb: 2, borderBottom: 1, borderColor: "divider" }}>
                      <Typography variant="h3" color="primary.main" sx={{ fontWeight: 600 }}>
                        {group.provider}
                      </Typography>
                    </Box>

                    {/* Trophy Display Grid */}
                    <Grid container spacing={3}>
                      {group.items.map((item) => (
                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.name}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              textAlign: "center",
                              p: 3,
                              height: 1,
                              border: 1,
                              borderColor: "divider",
                              borderRadius: 2,
                              bgcolor: "background.paper",
                              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              "&:hover": {
                                borderColor: "secondary.main",
                                "& .cert-logo-container": {
                                  borderColor: "secondary.main",
                                  transform: "scale(1.08)",
                                },
                                "& .cert-name": {
                                  color: "primary.main"
                                }
                              }
                            }}
                          >
                            {/* Large Trophy Logo container */}
                            <Box
                              className="cert-logo-container"
                              sx={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                border: "2px solid",
                                borderColor: "divider",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "white",
                                p: 1.5,
                                mb: 2,
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              }}
                            >
                              <Box component="img" src={item.logo} alt="" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            </Box>

                            <Typography 
                              className="cert-name"
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                lineHeight: 1.4,
                                transition: "color 0.3s ease",
                                maxWidth: 150
                              }}
                            >
                              {item.name}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </StaggerItem>
              </Grid>
            ))}
          </Grid>
        </StaggerGroup>
      </Stack>
    </Section>
  );
}

function AboutPage() {
  const heroAnchorRef = useNavbarAnchor(NAV_ANCHORS.ABOUT_HERO, { dark: true });
  const timelineAnchorRef = useNavbarAnchor(NAV_ANCHORS.ABOUT_TIMELINE, { dark: true });

  return (
    <Box sx={{ pt: 0, pb: { xs: 12, md: 16 }, display: "flex", flexDirection: "column", gap: { xs: 8, md: 20 } }}>
      <SmoothSection>
        <Box
          ref={heroAnchorRef}
          sx={{
            position: "relative",
            minHeight: "100vh",
            height: { xs: "auto", md: "100vh" },
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            pt: { xs: 12, md: 8 },
            pb: { xs: 8, md: 8 },
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
                        letterSpacing: "0.18em",
                        fontSize: "0.8rem",
                        fontFamily: MONO,
                        bgcolor: "rgba(255, 199, 44, 0.12)",
                        px: 2,
                        py: 0.6,
                        borderRadius: 10,
                        border: "1px solid rgba(255, 199, 44, 0.3)",
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
      </SmoothSection>

      <SmoothSection>
        <PoweredBySection />
      </SmoothSection>
      
      <SmoothSection>
        <PrinciplesSection />
      </SmoothSection>
      
      <SmoothSection>
        <CultureSection />
      </SmoothSection>
      
      <SmoothSection>
        <Box ref={timelineAnchorRef}>
          <JourneyTimeline />
        </Box>
      </SmoothSection>
      
      <SmoothSection>
        <ImpactSection />
      </SmoothSection>
      
      <SmoothSection>
        <TalentSection />
      </SmoothSection>
      
      <SmoothSection>
        <CertificationsSection />
      </SmoothSection>
    </Box>
  );
}
