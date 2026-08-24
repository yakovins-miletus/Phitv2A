import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SchoolIcon from "@mui/icons-material/School";

import { Reveal, StaggerGroup, StaggerItem } from "@/shared/components/Reveal";
import { RouterButton } from "@/shared/components/RouterLink";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

interface ProgramPillar {
  title: string;
  description: string;
  image: string;
}

const INTERNSHIP_PILLARS: ProgramPillar[] = [
  {
    title: "University Engagement & Expos",
    description: "Active campus presence through technical career expos, student hackathons, and guest engineering lectures.",
    image: "/images/grads/DLSUexpo.webp",
  },
  {
    title: "1-on-1 Engineering Mentorship",
    description: "Interns build real features alongside principal staff engineers, receiving daily code reviews and technical guidance.",
    image: "/images/grads/Coordination.webp",
  },
  {
    title: "Production R&D Impact",
    description: "Work on live financial data pipelines, distributed computing modules, and modern web applications shipped globally.",
    image: "/images/grads/FocusedProgramming.webp",
  },
];

const CARD_RADIUS = 4;

export function InternshipProgramSection() {
  return (
    // `data-ground="dark"` switches this subtree's token set (glass.css):
    // --text-* and --glass-* flip to their navy-ground values. --accent-fg does
    // not - brand gold is the accent on both grounds.
    <Box component="section" data-ground="dark" sx={{ bgcolor: NOIR.navyField, color: 'common.white', py: { xs: 8, md: 12 } }}>
      <Container maxWidth="xl">
      <Stack spacing={{ xs: 6, md: 8 }} sx={{ width: "100%" }}>
        {/* Section Header */}
        <Stack spacing={2} sx={{ maxWidth: 740 }}>
          <Reveal>
            <Typography variant="h2" component="h2" sx={{ fontWeight: 800 }}>
              Phitopolis Internship Programs
            </Typography>
          </Reveal>
          <Reveal delay={0.1}>
            <Typography variant="subtitle1" color="rgba(255,255,255,0.7)" sx={{ fontSize: "1.15rem", lineHeight: 1.6 }}>
              Bridging academic excellence and industry leadership - providing top undergraduate talent with paid, immersive R&D internships and direct fast-track paths to our Technical Graduate Program.
            </Typography>
          </Reveal>
        </Stack>

        {/* Program pillars: even, predictable layout */}
        <StaggerGroup>
          <Grid container spacing={{ xs: 5, md: 6 }}>
            {INTERNSHIP_PILLARS.map((pillar) => (
              <Grid key={pillar.title} size={{ xs: 12, md: 4 }}>
                <StaggerItem>
                  <Stack spacing={3}>
                    <Box
                      sx={{
                        width: '100%',
                        aspectRatio: '4 / 3',
                        borderRadius: CARD_RADIUS,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        component="img"
                        loading="lazy"
                        decoding="async"
                        width={640}
                        height={480}
                        src={pillar.image}
                        alt={pillar.title}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </Box>
                    <Stack spacing={1.5}>
                      <Typography variant="h3" component="h3" sx={{ fontWeight: 800, fontSize: "1.4rem" }}>
                        {pillar.title}
                      </Typography>
                      <Typography variant="body1" color="rgba(255,255,255,0.7)" sx={{ lineHeight: 1.6 }}>
                        {pillar.description}
                      </Typography>
                    </Stack>
                  </Stack>
                </StaggerItem>
              </Grid>
            ))}
          </Grid>
        </StaggerGroup>

        {/* Section CTA */}
        <Reveal delay={0.2}>
          <Stack
            spacing={3}
            sx={{
              pt: { xs: 4, md: 5 },
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              alignItems: { xs: "flex-start", md: "center" },
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
            }}
          >
            <Typography variant="body1" color="rgba(255,255,255,0.7)" sx={{ lineHeight: 1.65, fontSize: "1.05rem", maxWidth: 560 }}>
              Top-performing interns receive priority evaluation and direct offers for our full-time Technical Graduate Program before graduation.
            </Typography>
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
                borderRadius: CARD_RADIUS,
                transition: `all 0.3s ${EASE_OUT_EXPO_CSS}`,
                flexShrink: 0,
                "&:hover": {
                  bgcolor: NOIR.gold,
                  color: NOIR.navyField,
                  transform: "translateY(-2px)",
                }
              }}
            >
              View Opportunities
            </RouterButton>
          </Stack>
        </Reveal>
      </Stack>
      </Container>
    </Box>
  );
}
