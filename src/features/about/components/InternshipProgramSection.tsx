import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SchoolIcon from "@mui/icons-material/School";
import CodeIcon from "@mui/icons-material/Code";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FastForwardIcon from "@mui/icons-material/FastForward";

import { Section } from "@/shared/components/Section";
import { Reveal, StaggerGroup, StaggerItem } from "@/shared/components/Reveal";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

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
    image: "/images/grads/Coordination.JPG",
  },
  {
    icon: AutoAwesomeIcon,
    title: "Production R&D Impact",
    subtitle: "GLOBAL ENTERPRISE EXPOSURE",
    description: "Work on live financial data pipelines, distributed computing modules, and modern web applications shipped globally.",
    image: "/images/grads/FocusedProgramming.JPG",
  },
];

export function InternshipProgramSection() {
  return (
    <Section>
      <Stack spacing={{ xs: 6, md: 8 }} sx={{ width: "100%" }}>
        {/* Section Header */}
        <Stack spacing={2} sx={{ maxWidth: 740 }}>
          <Reveal>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
              <SchoolIcon sx={{ color: "#FFC72C", fontSize: "1.2rem" }} />
              <Typography
                variant="overline"
                sx={{
                  color: "#FFC72C",
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
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: "1.15rem", lineHeight: 1.6 }}>
              Bridging academic excellence and industry leadership — providing top undergraduate talent with paid, immersive R&D internships and direct fast-track paths to our Technical Graduate Program.
            </Typography>
          </Reveal>
        </Stack>

        {/* Bounded Pillars Grid */}
        <StaggerGroup>
          <Grid container spacing={{ xs: 5, md: 6 }}>
            {INTERNSHIP_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Grid size={{ xs: 12, md: 4 }} key={pillar.title}>
                  <StaggerItem>
                    <Stack spacing={3}>
                      {/* Frameless Floating Image Frame */}
                      <Box
                        sx={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "16/10",
                          borderRadius: { xs: 5, md: 6 },
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          component="img" decoding="async" loading="lazy"
                          src={pillar.image}
                          alt={pillar.title}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </Box>

                      {/* Clean Text Content */}
                      <Stack spacing={1.5}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                          <Icon sx={{ color: "primary.main", fontSize: "1.1rem" }} />
                          <Typography
                            variant="overline"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 700,
                              fontSize: "0.68rem",
                              fontFamily: MONO,
                              letterSpacing: "0.1em",
                            }}
                          >
                            {pillar.subtitle}
                          </Typography>
                        </Box>

                        <Typography variant="h4" component="h3" sx={{ fontWeight: 800, fontSize: { xs: "1.35rem", md: "1.55rem" }, minHeight: { md: "3.8rem" }, display: "flex", alignItems: "flex-start" }}>
                          {pillar.title}
                        </Typography>

                        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65, fontSize: "1rem" }}>
                          {pillar.description}
                        </Typography>
                      </Stack>
                    </Stack>
                  </StaggerItem>
                </Grid>
              );
            })}
          </Grid>
        </StaggerGroup>

        {/* Fast-Track Career Banner */}
        <Reveal delay={0.2}>
          <Box
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
                <FastForwardIcon sx={{ color: NOIR.goldDark, fontSize: "1.3rem" }} />
                <Typography
                  variant="overline"
                  sx={{
                    color: NOIR.goldDark,
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
          </Box>
        </Reveal>
      </Stack>
    </Section>
  );
}
