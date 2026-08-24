import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { Reveal } from "@/shared/components/Reveal";
import { RouterButton } from "@/shared/components/RouterLink";
import { MONO, TYPE_SCALE } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

const TRACKS = [
  {
    label: "Graduate Program",
    tag: "FULL-TIME",
    description:
      "A structured 12-month R&D fellowship for new CS and engineering graduates. Work on live financial systems, quant pipelines, and distributed infrastructure alongside senior engineers.",
    image: "/images/grads/FocusedProgramming.webp",
    stat: "5 cohorts",
    statLabel: "since 2023",
  },
  {
    label: "Internship Program",
    tag: "PART-TIME / OJT",
    description:
      "Paid, immersive internships for top undergraduate talent. Build real features, receive daily code reviews, and earn a fast-track path to the Graduate Program.",
    image: "/images/grads/Coordination.webp",
    stat: "30+ interns",
    statLabel: "placed to date",
  },
];

export function AcademySection() {
  return (
    <Box
      component="section"
      id="academy"
      data-ground="deep"
      sx={{
        bgcolor: NOIR.navyField,
        color: "common.white",
        py: { xs: 10, md: 16 },
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={{ xs: 10, md: 14 }}>
          {/* Header */}
          <Reveal>
            <Stack spacing={2} sx={{ maxWidth: 680 }}>
              <Typography
                variant="overline"
                sx={{
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  letterSpacing: "0.22em",
                  color: NOIR.gold,
                }}
              >
                // PHITOPOLIS ACADEMY
              </Typography>
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "2.1rem", md: "2.8rem" },
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  color: "common.white",
                }}
              >
                Learn by{" "}
                <Box component="span" sx={{ color: NOIR.gold }}>
                  building
                </Box>{" "}
                what ships.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.7,
                  fontSize: "1.05rem",
                  maxWidth: 560,
                }}
              >
                Two structured pathways — for graduates and undergraduates — to grow inside a
                production-grade R&D firm from day one.
              </Typography>
            </Stack>
          </Reveal>

          {/* Two tracks */}
          <Grid container spacing={{ xs: 4, md: 6 }}>
            {TRACKS.map((track, i) => (
              <Grid key={track.label} size={{ xs: 12, md: 6 }}>
                <Reveal delay={i * 0.1}>
                  <Stack spacing={3} sx={{ height: "100%" }}>
                    {/* Image */}
                    <Box
                      sx={{
                        width: "100%",
                        aspectRatio: "16/9",
                        borderRadius: 3,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <Box
                        component="img"
                        decoding="async"
                        loading="lazy"
                        src={track.image}
                        alt={track.label}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          filter: "brightness(0.85)",
                        }}
                      />
                      {/* Tag pill */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 16,
                          left: 16,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "100px",
                          bgcolor: NOIR.gold,
                          display: "inline-flex",
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: MONO,
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            letterSpacing: "0.14em",
                            color: NOIR.navyField,
                          }}
                        >
                          {track.tag}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Text */}
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={2} alignItems="baseline">
                        <Typography
                          variant="h4"
                          component="h3"
                          sx={{ fontWeight: 800, color: "common.white", fontSize: { xs: "1.3rem", md: "1.55rem" } }}
                        >
                          {track.label}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                          <Typography sx={{ fontFamily: MONO, fontWeight: 800, fontSize: "0.85rem", color: NOIR.gold }}>
                            {track.stat}
                          </Typography>
                          <Typography sx={{ fontFamily: MONO, fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
                            {track.statLabel}
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontSize: "0.97rem" }}
                      >
                        {track.description}
                      </Typography>
                    </Stack>
                  </Stack>
                </Reveal>
              </Grid>
            ))}
          </Grid>

          {/* CTA */}
          <Reveal delay={0.15}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
                gap: 4,
                pt: { xs: 4, md: 6 },
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Stack spacing={0.5}>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, color: "common.white", fontSize: { xs: "1.15rem", md: "1.35rem" } }}
                >
                  Start your career at Phitopolis.
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.92rem" }}>
                  Applications for grad and internship intakes are open now.
                </Typography>
              </Stack>
              <RouterButton
                to="/careers"
                variant="contained"
                sx={{
                  bgcolor: NOIR.gold,
                  color: NOIR.navyField,
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: TYPE_SCALE.body2,
                  letterSpacing: "0.1em",
                  px: 4,
                  py: 1.75,
                  borderRadius: 2,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  "&:hover": { bgcolor: NOIR.goldLight },
                }}
              >
                VIEW OPEN POSITIONS
              </RouterButton>
            </Box>
          </Reveal>
        </Stack>
      </Container>
    </Box>
  );
}
