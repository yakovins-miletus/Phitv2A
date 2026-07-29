import React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MailIcon from "@mui/icons-material/Mail";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TwitterIcon from "@mui/icons-material/Twitter";
import SecurityIcon from "@mui/icons-material/Security";
import { alpha } from "@mui/material/styles";
import { motion, AnimatePresence } from "motion/react";

import { RouterLink, RouterButton } from "@/shared/components/RouterLink";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

interface SiteFooterProps {
  footerAnchorRef: React.RefObject<HTMLElement | null>;
  currentNarration: { next: string; label: string; to?: string } | undefined;
  transitionState: string;
  scrollPressure: number;
  renderNextPageIndicator: (nextTo: string, progress: number) => React.ReactNode;
}

export function SiteFooter({
  footerAnchorRef,
  currentNarration,
  transitionState,
  scrollPressure,
  renderNextPageIndicator,
}: SiteFooterProps) {
  return (
    <Box
      component="footer"
      ref={footerAnchorRef}
      sx={{
        bgcolor: "#06183B",
        color: "#FFFFFF",
        borderTop: `1px solid ${alpha(NOIR.gold, 0.25)}`,
        pt: { xs: 10, md: 14 },
        pb: { xs: 6, md: 8 },
        mt: "auto",
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      {/* Background Ambient Radial Glow & Watermark */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 0%, rgba(255, 199, 44, 0.08) 0%, transparent 65%), linear-gradient(180deg, rgba(6, 24, 59, 0.9) 0%, #04122E 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Giant Stylized Watermark Typography */}
      <Typography
        sx={{
          position: "absolute",
          bottom: { xs: -20, md: -40 },
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: MONO,
          fontWeight: 900,
          fontSize: { xs: "12vw", md: "15vw" },
          color: "rgba(255, 255, 255, 0.02)",
          letterSpacing: "-0.04em",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
      >
        PHITOPOLIS
      </Typography>

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Stack spacing={{ xs: 8, md: 12 }} alignItems="center" sx={{ width: "100%" }}>
          {/* ── 1. CONTINUOUS CHAPTER TRANSITION STAGE ── */}
          {currentNarration && (
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: { xs: 4, md: 6 },
                  px: { xs: 3, md: 6 },
                  borderRadius: 8,
                  bgcolor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 199, 44, 0.2)",
                  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
                  maxWidth: 860,
                  width: "100%",
                }}
              >
              <AnimatePresence mode="wait">
                {transitionState === "triggered" || transitionState === "closing" || transitionState === "loading" ? (
                  <motion.div
                    key="now-transitioning"
                    initial={{ y: -15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 15, opacity: 0 }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                  >
                    <Stack spacing={1} alignItems="center">
                      <Typography
                        sx={{
                          fontFamily: MONO,
                          fontSize: { xs: "0.95rem", md: "1.15rem" },
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: "#FFC72C",
                          fontWeight: 800,
                        }}
                      >
                        NOW TRANSITIONING TO {currentNarration.label.toUpperCase()}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: MONO,
                          fontSize: "0.75rem",
                          letterSpacing: "0.15em",
                          color: "rgba(255, 255, 255, 0.7)",
                          fontWeight: 700,
                        }}
                      >
                        [ SCROLL UP OR PRESS ESC TO CANCEL ]
                      </Typography>
                    </Stack>
                  </motion.div>
                ) : (
                  <motion.div
                    key="scroll-cue"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#FFC72C" }} />
                      <Typography
                        sx={{
                          fontFamily: MONO,
                          fontSize: "0.78rem",
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: "#FFC72C",
                          fontWeight: 800,
                        }}
                      >
                        [ SCROLL CONTINUOUSLY TO ENTER NEXT CHAPTER ↓ ]
                      </Typography>
                    </Box>

                    {/* Dynamic thematic progression bar */}
                    {renderNextPageIndicator(currentNarration.next, scrollPressure)}

                    <Typography
                      sx={{
                        fontFamily: MONO,
                        fontSize: "0.72rem",
                        letterSpacing: "0.15em",
                        color: "rgba(255, 255, 255, 0.6)",
                        textTransform: "uppercase",
                      }}
                    >
                      NEXT CHAPTER: {currentNarration.label.toUpperCase()} ({scrollPressure}%)
                    </Typography>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </Box>
        )}

          {/* ── 2. IMMERSIVE MULTI-COLUMN NAVIGATION & FIRM INFO ── */}
          <Grid container spacing={{ xs: 6, md: 8 }}>
            {/* Col 1: R&D Firm Identity & Locations */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={3.5}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: "common.white", fontSize: "1.8rem", letterSpacing: "-0.02em" }}>
                    Phitopolis<Typography component="span" sx={{ color: "#FFC72C" }}>.</Typography>
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: MONO,
                      color: "#FFC72C",
                      fontWeight: 800,
                      letterSpacing: "0.15em",
                      fontSize: "0.72rem",
                      display: "block",
                      mt: 0.5,
                    }}
                  >
                    SOFTWARE & QUANTITATIVE R&D FIRM
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.7, fontSize: "0.95rem" }}>
                  Engineering high-frequency financial platforms, distributed cloud architecture, and machine learning pipelines for international markets.
                </Typography>

                {/* HQ Address & Time Indicator */}
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <LocationOnIcon sx={{ color: "#FFC72C", fontSize: "1.2rem", mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "common.white" }}>
                        BGC Office (Taguig, Metro Manila)
                      </Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block" }}>
                        27/F Ecotower, 32nd St. cor. 9th Ave, Bonifacio Global City
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#00E676", boxShadow: "0 0 10px #00E676" }} />
                    <Typography variant="caption" sx={{ fontFamily: MONO, color: "#00E676", fontWeight: 700 }}>
                      BGC MANILA R&D LAB ACTIVE (GMT+8)
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Grid>

            {/* Col 2: Navigation Pathways */}
            <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
              <Stack spacing={2.5}>
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.75rem",
                    letterSpacing: "0.18em",
                    color: "#FFC72C",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  PATHWAYS
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    { label: "Home Core", to: "/" },
                    { label: "About Us", to: "/about" },
                    { label: "Core Services", to: "/services" },
                    { label: "Careers & Fellowships", to: "/careers" },
                    { label: "Blog & Intelligence", to: "/blog" },
                    { label: "Innovation Lab", to: "/innovation-hub" },
                    { label: "Contact Us", to: "/contact" },
                  ].map((link) => (
                    <RouterLink
                      key={link.to}
                      to={link.to}
                      sx={{
                        color: "rgba(255, 255, 255, 0.75)",
                        textDecoration: "none",
                        fontSize: "0.92rem",
                        fontWeight: 500,
                        transition: "all 0.2s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.8,
                        "&:hover": { color: "#FFC72C", transform: "translateX(4px)" },
                      }}
                    >
                      {link.label}
                    </RouterLink>
                  ))}
                </Stack>
              </Stack>
            </Grid>

            {/* Col 3: Graduate & Talent Programs */}
            <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
              <Stack spacing={2.5}>
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.75rem",
                    letterSpacing: "0.18em",
                    color: "#FFC72C",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  TALENT PROGRAMS
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    { label: "Graduate Program", to: "/careers/technical-graduate-program" },
                    { label: "R&D Internship", to: "/careers/rd-internship-program" },
                    { label: "Quant Researcher", to: "/careers/quant-researcher" },
                    { label: "Software Engineer", to: "/careers/software-engineer" },
                    { label: "Full Stack Developer", to: "/careers/full-stack-developer" },
                    { label: "Data Scientist", to: "/careers/data-scientist" },
                    { label: "DevOps Engineer", to: "/careers/devops-engineer" },
                  ].map((job) => (
                    <RouterLink
                      key={job.to}
                      to={job.to}
                      sx={{
                        color: "rgba(255, 255, 255, 0.75)",
                        textDecoration: "none",
                        fontSize: "0.92rem",
                        fontWeight: 500,
                        transition: "all 0.2s ease",
                        "&:hover": { color: "#FFC72C", transform: "translateX(4px)" },
                      }}
                    >
                      {job.label}
                    </RouterLink>
                  ))}
                </Stack>
              </Stack>
            </Grid>

            {/* Col 4: Contact & Enterprise Standards */}
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <Stack spacing={2.5}>
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.75rem",
                    letterSpacing: "0.18em",
                    color: "#FFC72C",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  ENTERPRISE CONTACT
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(255, 255, 255, 0.5)", display: "block", mb: 0.3 }}>
                      GENERAL INQUIRIES
                    </Typography>
                    <Typography
                      component="a"
                      href="mailto:info@phitopolis.com"
                      sx={{
                        color: "common.white",
                        textDecoration: "none",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        "&:hover": { color: "#FFC72C" },
                      }}
                    >
                      <MailIcon sx={{ fontSize: 16, color: "#FFC72C" }} />
                      info@phitopolis.com
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(255, 255, 255, 0.5)", display: "block", mb: 0.3 }}>
                      CAREERS & FELLOWSHIPS
                    </Typography>
                    <Typography
                      component="a"
                      href="mailto:careers@phitopolis.com"
                      sx={{
                        color: "common.white",
                        textDecoration: "none",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        "&:hover": { color: "#FFC72C" },
                      }}
                    >
                      <MailIcon sx={{ fontSize: 16, color: "#FFC72C" }} />
                      careers@phitopolis.com
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 1 }}>
                    <RouterButton
                      to="/contact"
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        bgcolor: "#FFC72C",
                        color: "#0A2A66",
                        fontFamily: MONO,
                        fontWeight: 800,
                        fontSize: "0.78rem",
                        py: 1.2,
                        px: 3,
                        borderRadius: 3,
                        "&:hover": {
                          bgcolor: "#FFE082",
                        },
                      }}
                    >
                      START A CONVERSATION
                    </RouterButton>
                  </Box>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Stack>

        {/* ── 3. BOTTOM SYSTEM BAR (Copyright, Social & Status) ── */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={3}
          sx={{
            pt: 6,
            mt: 8,
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            color: "rgba(255, 255, 255, 0.6)",
          }}
        >
          <Stack spacing={0.5}>
            <Typography variant="caption" sx={{ fontFamily: MONO, fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.8)" }}>
              © 2026 Phitopolis International Corp. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.5)" }}>
              Registered Software & Quantitative Research Firm • Bonifacio Global City, Manila
            </Typography>
          </Stack>

          {/* Social Icons & Security Badge */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mr: 1, opacity: 0.7 }}>
              <SecurityIcon sx={{ fontSize: 16, color: "#FFC72C" }} />
              <Typography variant="caption" sx={{ fontFamily: MONO, fontSize: "0.72rem" }}>
                ENTERPRISE ENCRYPTED
              </Typography>
            </Box>

            <IconButton component="a" href="#" aria-label="GitHub" sx={{ color: "common.white", "&:hover": { color: "#FFC72C" } }}>
              <GitHubIcon fontSize="small" />
            </IconButton>
            <IconButton component="a" href="#" aria-label="LinkedIn" sx={{ color: "common.white", "&:hover": { color: "#FFC72C" } }}>
              <LinkedInIcon fontSize="small" />
            </IconButton>
            <IconButton component="a" href="#" aria-label="Twitter" sx={{ color: "common.white", "&:hover": { color: "#FFC72C" } }}>
              <TwitterIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
