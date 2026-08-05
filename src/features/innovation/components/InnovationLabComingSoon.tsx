import { useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import ScienceIcon from "@mui/icons-material/Science";
import MemoryIcon from "@mui/icons-material/Memory";
import StorageIcon from "@mui/icons-material/Storage";
import TerminalIcon from "@mui/icons-material/Terminal";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SendIcon from "@mui/icons-material/Send";

import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { Reveal, StaggerGroup, StaggerItem } from "@/shared/components/Reveal";
import { BACKGROUND_LOOP, useBackgroundVideo } from "@/shared/components/useBackgroundVideo";

const UPCOMING_PILLARS = [
  {
    icon: MemoryIcon,
    tag: "SYSTEMS & KERNELS",
    title: "Microsecond C++ & Rust Engines",
    description:
      "Zero-copy queue structures, lock-free memory allocators, and ultra-fast market data parsing routines battle-tested in internal production environments.",
  },
  {
    icon: ScienceIcon,
    tag: "QUANT & ML SIGNALS",
    title: "Statistical Signal Notebooks",
    description:
      "Jupyter notebooks and Python libraries for time-series anomaly detection, alpha signal backtesting, and quantitative data exploration.",
  },
  {
    icon: StorageIcon,
    tag: "CLOUD & INFRASTRUCTURE",
    title: "DevOps & Observability Modules",
    description:
      "Production-ready Kubernetes manifests, Terraform templates, and custom Prometheus/Grafana monitoring exporters for high-frequency infrastructure.",
  },
  {
    icon: TerminalIcon,
    tag: "OPEN SOURCE TOOLS",
    title: "Developer Libraries & CLI Utilities",
    description:
      "Internal CLI toolkits, React/TypeScript UI primitives, and developer productivity tools engineered during R&D hackathons.",
  },
];

export function InnovationLabComingSoon() {
  const { containerRef, videoRef, shouldLoad, posterOnly } = useBackgroundVideo();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().length > 0) {
      setSubmitted(true);
    }
  };

  return (
    <Box sx={{ width: "100%", bgcolor: NOIR.navyDeep, minHeight: "100vh", position: "relative" }}>
      {/* ── Background Video / Ambient Stage ── */}
      <Box
        ref={containerRef}
        aria-hidden
        sx={{ position: "absolute", inset: 0, filter: "brightness(0.7) contrast(1.1)", pointerEvents: "none" }}
      >
        <Box
          component="video"
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={BACKGROUND_LOOP.poster}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        >
          {!posterOnly && shouldLoad && (
            <>
              <source src={BACKGROUND_LOOP.webm} type="video/webm" />
              <source src={BACKGROUND_LOOP.mp4} type="video/mp4" />
            </>
          )}
        </Box>
      </Box>

      {/* Radial Wash Overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 30%, rgba(10, 42, 102, 0.45) 0%, rgba(6, 24, 59, 0.88) 75%), linear-gradient(180deg, rgba(6, 24, 59, 0.4) 0%, rgba(6, 24, 59, 0.98) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Main Hero Section ── */}
      <Container
        maxWidth="xl"
        sx={{
          position: "relative",
          zIndex: 2,
          pt: { xs: 14, md: 20 },
          pb: { xs: 10, md: 14 },
          px: { xs: 3, md: 8 },
        }}
      >
        <Stack spacing={{ xs: 6, md: 8 }} alignItems="center" textAlign="center">
          {/* Header & Status Pill */}
          <Stack spacing={3} alignItems="center" sx={{ maxWidth: 900 }}>
            <Reveal>
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    bgcolor: "rgba(255, 199, 44, 0.15)",
                    border: `1px solid ${NOIR.goldDark}`,
                    borderRadius: "100px",
                    px: 2.2,
                    py: 0.8,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: NOIR.gold,
                      boxShadow: `0 0 10px ${NOIR.gold}`,
                      animation: "pulse 2s infinite ease-in-out",
                      "@keyframes pulse": {
                        "0%": { opacity: 0.4, transform: "scale(0.8)" },
                        "50%": { opacity: 1, transform: "scale(1.2)" },
                        "100%": { opacity: 0.4, transform: "scale(0.8)" },
                      },
                    }}
                  />
                  <Typography
                    variant="overline"
                    sx={{
                      color: NOIR.gold,
                      fontWeight: 800,
                      letterSpacing: "0.18em",
                      fontSize: "0.78rem",
                      fontFamily: MONO,
                    }}
                  >
                    COMING SOON // R&D REPOSITORY
                  </Typography>
                </Box>
              </Box>
            </Reveal>

            <Reveal delay={0.1}>
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: "2.6rem", sm: "4rem", md: "5rem" },
                  lineHeight: 1.05,
                  letterSpacing: "-0.025em",
                  color: "common.white",
                  textShadow: "0 4px 24px rgba(0,0,0,0.8)",
                }}
              >
                Innovation Labs
              </Typography>
            </Reveal>

            <Reveal delay={0.2}>
              <Typography
                variant="h5"
                sx={{
                  color: "rgba(255, 255, 255, 0.88)",
                  fontSize: { xs: "1.1rem", md: "1.35rem" },
                  lineHeight: 1.6,
                  fontWeight: 400,
                  maxWidth: 780,
                }}
              >
                A public repository for developer tools, microsecond C++ kernels, ML signal prototypes, and open-source utilities built by internal Phitopolis engineering teams to be shared with the public.
              </Typography>
            </Reveal>
          </Stack>

          {/* ── Upcoming Tool Preview Cards ── */}
          <Box sx={{ width: "100%", pt: 2 }}>
            <StaggerGroup>
              <Grid container spacing={{ xs: 3, md: 4 }}>
                {UPCOMING_PILLARS.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={pillar.title}>
                      <StaggerItem>
                        <Box
                          sx={{
                            p: { xs: 3.5, md: 4 },
                            borderRadius: 5,
                            bgcolor: "rgba(244, 247, 252, 0.96)",
                            border: "1px solid rgba(10, 42, 102, 0.18)",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            textAlign: "left",
                            boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
                            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                            "&:hover": {
                              transform: "translateY(-6px)",
                              boxShadow: "0 20px 48px rgba(10, 42, 102, 0.25)",
                              borderColor: NOIR.goldDark,
                            },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 3,
                                bgcolor: "rgba(10, 42, 102, 0.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: NOIR.navyField,
                              }}
                            >
                              <Icon sx={{ fontSize: "1.4rem" }} />
                            </Box>
                            <Chip
                              label={pillar.tag}
                              size="small"
                              sx={{
                                fontFamily: MONO,
                                fontSize: "0.62rem",
                                fontWeight: 800,
                                bgcolor: "rgba(10, 42, 102, 0.06)",
                                color: NOIR.navyField,
                                border: "1px solid rgba(10, 42, 102, 0.12)",
                              }}
                            />
                          </Box>

                          <Typography variant="h5" component="h3" sx={{ fontWeight: 800, color: NOIR.navyField, mb: 1.5, fontSize: "1.25rem", lineHeight: 1.25 }}>
                            {pillar.title}
                          </Typography>

                          <Typography variant="body2" sx={{ color: "rgba(10, 42, 102, 0.82)", lineHeight: 1.65, fontSize: "0.92rem" }}>
                            {pillar.description}
                          </Typography>
                        </Box>
                      </StaggerItem>
                    </Grid>
                  );
                })}
              </Grid>
            </StaggerGroup>
          </Box>

          {/* ── Early Access / Notification Section ── */}
          <Box
            sx={{
              width: "100%",
              maxWidth: 720,
              mt: { xs: 4, md: 6 },
              p: { xs: 4, md: 6 },
              borderRadius: 6,
              bgcolor: "rgba(244, 247, 252, 0.96)",
              border: "1px solid rgba(10, 42, 102, 0.18)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
            }}
          >
            <Stack spacing={3} alignItems="center">
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                <AutoAwesomeIcon sx={{ color: NOIR.goldDark, fontSize: "1.2rem" }} />
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
                  BE FIRST TO ACCESS OUR RELEASE REPO
                </Typography>
              </Box>

              <Typography variant="h3" component="h2" sx={{ fontWeight: 800, color: NOIR.navyField, fontSize: { xs: "1.5rem", md: "1.8rem" } }}>
                Want Early Access to Our Open Source Releases?
              </Typography>

              <Typography variant="body1" sx={{ color: "rgba(10, 42, 102, 0.82)", fontSize: "1rem", lineHeight: 1.6, maxWidth: 540 }}>
                Drop your email to receive direct notifications when internal software tools, C++ kernels, and research notebooks are published.
              </Typography>

              {submitted ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 2,
                    px: 3,
                    borderRadius: "100px",
                    bgcolor: "rgba(58, 161, 137, 0.12)",
                    border: "1px solid rgba(38, 166, 154, 0.4)",
                    color: "#00695C",
                  }}
                >
                  <CheckCircleOutlineIcon sx={{ color: "#00695C" }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: MONO, fontSize: "0.85rem" }}>
                    You're on the early access VIP list! We will notify you at launch.
                  </Typography>
                </Box>
              ) : (
                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 1.5,
                    width: "100%",
                    maxWidth: 500,
                  }}
                >
                  <TextField
                    type="email"
                    required
                    placeholder="enter.your.email@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{
                      flexGrow: 1,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "100px",
                        bgcolor: "common.white",
                        fontFamily: MONO,
                        fontSize: "0.85rem",
                        "& fieldset": { borderColor: "rgba(10, 42, 102, 0.25)" },
                        "&:hover fieldset": { borderColor: NOIR.navyField },
                        "&.Mui-focused fieldset": { borderColor: NOIR.navyField },
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    endIcon={<SendIcon />}
                    sx={{
                      borderRadius: "100px",
                      px: 3.5,
                      py: 1.2,
                      bgcolor: NOIR.navyField,
                      color: "common.white",
                      fontWeight: 800,
                      fontFamily: MONO,
                      fontSize: "0.8rem",
                      whiteSpace: "nowrap",
                      "&:hover": {
                        bgcolor: "#081F4D",
                      },
                    }}
                  >
                    NOTIFY ME
                  </Button>
                </Box>
              )}
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
