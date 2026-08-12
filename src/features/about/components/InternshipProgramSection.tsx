import React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SchoolIcon from "@mui/icons-material/School";
import CodeIcon from "@mui/icons-material/Code";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FastForwardIcon from "@mui/icons-material/FastForward";

import { Reveal, StaggerGroup, StaggerItem } from "@/shared/components/Reveal";
import { RouterButton } from "@/shared/components/RouterLink";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

interface ProgramPillar {
  icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

const INTERNSHIP_PILLARS: ProgramPillar[] = [
  {
    icon: SchoolIcon,
    title: "University Engagement & Expos",
    subtitle: "DLSU, ATENEO & UP PARTNERSHIPS",
    description: "Active campus presence through technical career expos, student hackathons, and guest engineering lectures.",
    image: "/images/grads/DLSUexpo.webp",
  },
  {
    icon: CodeIcon,
    title: "1-on-1 Engineering Mentorship",
    subtitle: "DIRECT STAFF ENGINEER PAIRING",
    description: "Interns build real features alongside principal staff engineers, receiving daily code reviews and technical guidance.",
    image: "/images/grads/Coordination.webp",
  },
  {
    icon: AutoAwesomeIcon,
    title: "Production R&D Impact",
    subtitle: "GLOBAL ENTERPRISE EXPOSURE",
    description: "Work on live financial data pipelines, distributed computing modules, and modern web applications shipped globally.",
    image: "/images/grads/FocusedProgramming.webp",
  },
];

export function InternshipProgramSection() {
  const pillar0 = INTERNSHIP_PILLARS[0]!;
  const pillar1 = INTERNSHIP_PILLARS[1]!;
  const pillar2 = INTERNSHIP_PILLARS[2]!;

  return (
    // `data-ground="dark"` switches this subtree's token set (glass.css):
    // --text-* and --glass-* flip to their navy-ground values. --accent-fg does
    // not — brand gold is the accent on both grounds — so the overline below is
    // the same colour as its counterparts in this file's light sections.
    <Box component="section" data-ground="dark" sx={{ bgcolor: NOIR.navyField, color: 'common.white', py: { xs: 8, md: 12 } }}>
      <Container maxWidth="2xl">
      <Stack spacing={{ xs: 6, md: 8 }} sx={{ width: "100%" }}>
        {/* Section Header */}
        <Stack spacing={2} sx={{ maxWidth: 740 }}>
          <Reveal>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
              <SchoolIcon sx={{ color: "var(--accent-fg)", fontSize: "1.2rem" }} />
              <Typography
                variant="overline"
                sx={{
                  color: "var(--accent-fg)",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  fontSize: "0.82rem",
                  fontFamily: MONO,
                }}
              >
                ACADEMIC PATHWAYS
              </Typography>
            </Box>
          </Reveal>
          <Reveal delay={0.1}>
            <Typography variant="h2" component="h2" sx={{ fontWeight: 800 }}>
              Phitopolis Internship Programs
            </Typography>
          </Reveal>
          <Reveal delay={0.2}>
            <Typography variant="subtitle1" color="rgba(255,255,255,0.7)" sx={{ fontSize: "1.15rem", lineHeight: 1.6 }}>
              Bridging academic excellence and industry leadership — providing top undergraduate talent with paid, immersive R&D internships and direct fast-track paths to our Technical Graduate Program.
            </Typography>
          </Reveal>
        </Stack>

        {/* Spatial Bento Grid */}
        <StaggerGroup>
          <Grid container spacing={{ xs: 3, md: 4 }}>
            {/* Pillar 0: University Engagement (Wide) */}
            <Grid size={{ xs: 12, md: 7 }}>
              <StaggerItem>
                <Box
                  sx={{
                    height: '100%',
                    minHeight: { xs: 400, md: 480 },
                    borderRadius: { xs: 5, md: 6 },
                    overflow: 'hidden',
                    bgcolor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                >
                  <Box sx={{ p: { xs: 4, md: 5 }, flex: 1, zIndex: 1 }}>
                    <Stack spacing={2} sx={{ maxWidth: { xs: 400, md: '42%' } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <SchoolIcon sx={{ color: "primary.main", fontSize: "1.1rem" }} />
                        <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: "0.68rem", fontFamily: MONO, letterSpacing: "0.1em" }}>
                          {pillar0.subtitle}
                        </Typography>
                      </Box>
                      <Typography variant="h3" component="h3" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", md: "1.8rem" } }}>
                        {pillar0.title}
                      </Typography>
                      <Typography variant="body1" color="rgba(255,255,255,0.7)" sx={{ lineHeight: 1.6 }}>
                        {pillar0.description}
                      </Typography>
                    </Stack>
                  </Box>
                  {/* Image placed spatially */}
                  <Box
                    sx={{
                      position: { xs: 'relative', md: 'absolute' },
                      right: { md: -1 },
                      bottom: { md: -1 },
                      width: { xs: '100%', md: '55%' },
                      height: { xs: 240, md: '75%' },
                      borderRadius: { xs: 0, md: '32px 0 0 0' },
                      overflow: 'hidden',
                      boxShadow: { md: '-10px -10px 40px rgba(0,0,0,0.05)' },
                      borderTop: { md: "1px solid rgba(255, 255, 255, 0.08)" },
                      borderLeft: { md: "1px solid rgba(255, 255, 255, 0.08)" },
                    }}
                  >
                    <Box component="img" loading="lazy" decoding="async" src={pillar0.image} alt={pillar0.title} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </Box>
                </Box>
              </StaggerItem>
            </Grid>

            {/* Pillar 1: 1-on-1 Mentorship (Tall) */}
            <Grid size={{ xs: 12, md: 5 }}>
              <StaggerItem>
                <Box
                  sx={{
                    height: '100%',
                    minHeight: { xs: 400, md: 480 },
                    borderRadius: { xs: 5, md: 6 },
                    overflow: 'hidden',
                    bgcolor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box sx={{ p: { xs: 4, md: 5 }, flex: 0 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CodeIcon sx={{ color: "primary.main", fontSize: "1.1rem" }} />
                        <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: "0.68rem", fontFamily: MONO, letterSpacing: "0.1em" }}>
                          {pillar1.subtitle}
                        </Typography>
                      </Box>
                      <Typography variant="h3" component="h3" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", md: "1.8rem" } }}>
                        {pillar1.title}
                      </Typography>
                      <Typography variant="body1" color="rgba(255,255,255,0.7)" sx={{ lineHeight: 1.6 }}>
                        {pillar1.description}
                      </Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ flex: 1, minHeight: 220, position: 'relative' }}>
                    <Box component="img" loading="lazy" decoding="async" src={pillar1.image} alt={pillar1.title} sx={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', display: 'block' }} />
                  </Box>
                </Box>
              </StaggerItem>
            </Grid>

            {/* Pillar 2: Production R&D (Full Width Horizontal) */}
            <Grid size={{ xs: 12, md: 12 }}>
              <StaggerItem>
                <Box
                  sx={{
                    borderRadius: { xs: 5, md: 6 },
                    overflow: 'hidden',
                    bgcolor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: 'flex',
                    flexDirection: { xs: 'column-reverse', md: 'row' },
                    alignItems: 'stretch',
                  }}
                >
                  <Box sx={{ p: { xs: 4, md: 6 }, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Stack spacing={2} sx={{ maxWidth: 500 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AutoAwesomeIcon sx={{ color: "primary.main", fontSize: "1.1rem" }} />
                        <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: "0.68rem", fontFamily: MONO, letterSpacing: "0.1em" }}>
                          {pillar2.subtitle}
                        </Typography>
                      </Box>
                      <Typography variant="h3" component="h3" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", md: "2rem" } }}>
                        {pillar2.title}
                      </Typography>
                      <Typography variant="body1" color="rgba(255,255,255,0.7)" sx={{ lineHeight: 1.6, fontSize: "1.05rem" }}>
                        {pillar2.description}
                      </Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ width: { xs: '100%', md: '45%' }, minHeight: { xs: 260, md: 360 }, position: 'relative' }}>
                    <Box component="img" loading="lazy" decoding="async" src={pillar2.image} alt={pillar2.title} sx={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', display: 'block' }} />
                  </Box>
                </Box>
              </StaggerItem>
            </Grid>
          </Grid>
        </StaggerGroup>

        {/* Fast-Track Career Banner */}
        <Reveal delay={0.2}>
          <Box
            data-ground="light"
            sx={{
              p: { xs: 4, md: 6 },
              borderRadius: { xs: 5, md: 7 },
              bgcolor: "rgba(244, 247, 252, 0.95)",
              border: "1px solid rgba(10, 42, 102, 0.18)",
              color: NOIR.navyField,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
              gap: 3,
              boxShadow: "0 8px 30px rgba(10, 42, 102, 0.08)",
            }}
          >
            <Stack spacing={1.5} sx={{ maxWidth: 680 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FastForwardIcon sx={{ color: "var(--accent-fg)", fontSize: "1.3rem" }} />
                <Typography
                  variant="overline"
                  sx={{
                    color: "var(--accent-fg)",
                    fontWeight: 800,
                    letterSpacing: "0.15em",
                    fontFamily: MONO,
                    fontSize: "0.78rem",
                  }}
                >
                  DIRECT PATHWAY TO FULL-TIME FELLOWSHIP
                </Typography>
              </Box>
              <Typography variant="h3" component="h3" sx={{ fontWeight: 800, color: NOIR.navyField, fontSize: { xs: "1.6rem", md: "2.1rem" } }}>
                Fast-Track to Technical Graduate Program
              </Typography>
              <Typography variant="body1" sx={{ color: "rgba(10, 42, 102, 0.82)", lineHeight: 1.65, fontSize: "1.05rem" }}>
                Top-performing interns receive priority evaluation and direct offers for our full-time Technical Graduate Program before graduation.
              </Typography>
            </Stack>
            
            <Box sx={{ flex: 1, display: "flex", justifyContent: "center", mt: { xs: 2, md: 0 }, minWidth: { md: 240 } }}>
              <RouterButton
                to="/careers"
                variant="contained"
                endIcon={<SchoolIcon />}
                sx={{
                  bgcolor: "primary.main",
                  color: "#FFFFFF",
                  fontFamily: MONO,
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  letterSpacing: "0.08em",
                  px: { xs: 4, md: 6 },
                  py: 1.5,
                  borderRadius: 12,
                  boxShadow: "0 6px 16px rgba(10, 42, 102, 0.15)",
                  transition: `all 0.3s ${EASE_OUT_EXPO_CSS}`,
                  "&:hover": {
                    bgcolor: NOIR.gold,
                    color: NOIR.navyField,
                    boxShadow: "0 8px 24px rgba(10, 42, 102, 0.25)",
                    transform: "translateY(-2px)",
                  }
                }}
              >
                View Opportunities
              </RouterButton>
            </Box>
          </Box>
        </Reveal>
      </Stack>
      </Container>
    </Box>
  );
}
