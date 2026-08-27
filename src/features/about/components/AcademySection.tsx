import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

import { Reveal } from "@/shared/components/Reveal";
import { RouterButton } from "@/shared/components/RouterLink";
import { MONO, TYPE_SCALE } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

// WS-16 #7: the two tracks used to be plain side-by-side cards, each with its
// own border/fill — exactly the containerization WS-01 removed sitewide. They
// are re-framed here as "halls" inside one built structure (a masthead/crest
// over a shared portico), not as bordered boxes: no per-hall fill or border,
// just a hairline `Divider` between them and a shared cornice rule above.
const HALLS = [
  {
    numeral: "I",
    label: "Graduate Program",
    tag: "FULL-TIME",
    description:
      "A structured 12-month R&D fellowship for new CS and engineering graduates. Work on live financial systems, quant pipelines, and distributed infrastructure alongside senior engineers.",
    image: "/images/grads/FocusedProgramming.webp",
    stat: "5 cohorts",
    statLabel: "since 2023",
  },
  {
    numeral: "II",
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
        {/* The structure: a masthead (crest + inscription) sits over a
            portico of two halls, closed by a single doorway (the CTA). One
            continuous built form top-to-bottom, not stacked components. */}
        <Box
          sx={{
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: { xs: 3, md: 4 },
            overflow: "hidden",
          }}
        >
          {/* ── Masthead: crest + inscription, the "pediment" of the house ── */}
          <Reveal>
            <Stack
              spacing={3}
              alignItems="center"
              sx={{
                textAlign: "center",
                px: { xs: 4, md: 10 },
                pt: { xs: 6, md: 9 },
                pb: { xs: 5, md: 7 },
                background:
                  "linear-gradient(180deg, rgba(255,199,44,0.06) 0%, rgba(255,199,44,0) 70%)",
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  border: `1.5px solid ${NOIR.gold}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AccountBalanceIcon sx={{ color: NOIR.gold, fontSize: "1.9rem" }} />
              </Box>
              <Typography
                variant="overline"
                sx={{
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  letterSpacing: "0.28em",
                  color: NOIR.gold,
                }}
              >
                PHITOPOLIS ACADEMY
              </Typography>
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "2.1rem", md: "2.9rem" },
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  color: "common.white",
                  maxWidth: 720,
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
                  maxWidth: 520,
                }}
              >
                Two structured halls — for graduates and undergraduates — to grow inside a
                production-grade R&D firm from day one.
              </Typography>
            </Stack>
          </Reveal>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.14)" }} />

          {/* ── The two halls: one portico, divided by a hairline column,
              never two independently bordered/filled cards. ── */}
          <Grid container>
            {HALLS.map((hall, i) => (
              <Grid key={hall.label} size={{ xs: 12, md: 6 }}>
                <Reveal delay={i * 0.1}>
                  <Box
                    sx={{
                      height: "100%",
                      p: { xs: 4, md: 6 },
                      borderLeft: {
                        xs: "none",
                        md: i === 1 ? "1px solid rgba(255,255,255,0.14)" : "none",
                      },
                      borderTop: {
                        xs: i === 1 ? "1px solid rgba(255,255,255,0.14)" : "none",
                        md: "none",
                      },
                    }}
                  >
                    <Stack spacing={3}>
                      {/* Hall numeral, inscribed rather than boxed */}
                      <Stack direction="row" spacing={1.5} alignItems="baseline">
                        <Typography
                          sx={{
                            fontFamily: MONO,
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            letterSpacing: "0.18em",
                            color: NOIR.gold,
                          }}
                        >
                          HALL {hall.numeral}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: MONO,
                            fontWeight: 700,
                            fontSize: "0.68rem",
                            letterSpacing: "0.14em",
                            color: "rgba(255,255,255,0.4)",
                          }}
                        >
                          {hall.tag}
                        </Typography>
                      </Stack>

                      {/* Image, framed rather than boxed — a doorway, not a card */}
                      <Box
                        sx={{
                          width: "100%",
                          aspectRatio: "16/9",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          component="img"
                          decoding="async"
                          loading="lazy"
                          src={hall.image}
                          alt={hall.label}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            filter: "brightness(0.85)",
                          }}
                        />
                      </Box>

                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={2} alignItems="baseline" flexWrap="wrap">
                          <Typography
                            variant="h4"
                            component="h3"
                            sx={{ fontWeight: 800, color: "common.white", fontSize: { xs: "1.3rem", md: "1.55rem" } }}
                          >
                            {hall.label}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                            <Typography sx={{ fontFamily: MONO, fontWeight: 800, fontSize: "0.85rem", color: NOIR.gold }}>
                              {hall.stat}
                            </Typography>
                            <Typography sx={{ fontFamily: MONO, fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
                              {hall.statLabel}
                            </Typography>
                          </Box>
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontSize: "0.97rem" }}
                        >
                          {hall.description}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Reveal>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.14)" }} />

          {/* ── The doorway: the one CTA out of the house ── */}
          <Reveal delay={0.15}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
                gap: 4,
                p: { xs: 4, md: 6 },
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
        </Box>
      </Container>
    </Box>
  );
}
