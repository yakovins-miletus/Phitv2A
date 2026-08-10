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
import ExploreIcon from "@mui/icons-material/Explore";
import WorkIcon from "@mui/icons-material/Work";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import TerminalIcon from "@mui/icons-material/Terminal";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ArticleIcon from "@mui/icons-material/Article";
import ScienceIcon from "@mui/icons-material/Science";
import SendIcon from "@mui/icons-material/Send";
import HomeIcon from "@mui/icons-material/Home";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { alpha } from "@mui/material/styles";

import { RouterLink, RouterButton } from "@/shared/components/RouterLink";
import { LogoParticleField } from "@/shared/components/LogoParticleField";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

interface SiteFooterProps {
  footerAnchorRef: React.RefObject<HTMLElement | null>;
  /** The next chapter in the site's reading order, or undefined on unknown routes. */
  currentNarration: { next: string; label: string; to?: string } | undefined;
}

interface ChapterVisualMeta {
  chapterNum: string;
  subtitle: string;
  icon: React.ReactNode;
  tags: string[];
}

const CHAPTER_VISUAL_MAP: Record<string, ChapterVisualMeta> = {
  "/about": {
    chapterNum: "02 • THE FIRM",
    subtitle: "Origin story, R&D philosophy, and 2019–2026 growth timeline",
    icon: <CorporateFareIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
    tags: ["Growth Timeline", "Quant R&D", "Manila HQ"],
  },
  "/services": {
    chapterNum: "03 • CAPABILITIES",
    subtitle: "High-frequency trading engines, ML pipelines, & cloud architecture",
    icon: <TerminalIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
    tags: ["Low-Latency HFT", "ML Infrastructure", "Cloud Arch"],
  },
  "/careers": {
    chapterNum: "04 • TALENT",
    subtitle: "Graduate fellowships, quant roles, & engineering opportunities",
    icon: <RocketLaunchIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
    tags: ["Graduate Program", "Quant Roles", "Fellowships"],
  },
  "/blog": {
    chapterNum: "05 • INTELLIGENCE",
    subtitle: "Deep-dives into systems engineering, algorithms, & market tech",
    icon: <ArticleIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
    tags: ["Research Papers", "Tech Insights", "Quant Notes"],
  },
  "/innovation-hub": {
    chapterNum: "06 • LAB DEMOS",
    subtitle: "WebAssembly benchmarks, GPU acceleration, & live prototypes",
    icon: <ScienceIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
    tags: ["GPU Benchmarks", "Wasm Prototypes", "Live Demos"],
  },
  "/contact": {
    chapterNum: "07 • DISCOVERY",
    subtitle: "Connect with our engineering team for partnerships & inquiries",
    icon: <SendIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
    tags: ["Direct Inquiries", "BGC Lab Access", "Partnerships"],
  },
  "/": {
    chapterNum: "01 • MAIN CORE",
    subtitle: "Return to the primary Phitopolis interactive system showcase",
    icon: <HomeIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
    tags: ["Hero System", "Core Overview", "Lab Active"],
  },
};

export function SiteFooter({ footerAnchorRef, currentNarration }: SiteFooterProps) {
  return (
    <Box
      component="footer"
      ref={footerAnchorRef}
      sx={{
        bgcolor: NOIR.navyDeep,
        color: "#FFFFFF",
        borderTop: `1px solid ${alpha(NOIR.gold, 0.25)}`,
        pt: { xs: 6, md: 8 },
        pb: { xs: 4, md: 6 },
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
          background: "radial-gradient(circle at 50% 30%, rgba(var(--accent-rgb), 0.08) 0%, transparent 65%), linear-gradient(180deg, rgba(6, 24, 59, 0.95) 0%, #04122E 100%)",
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
        {/* Vertically centred: the brand mark on the left, navigation on the right. */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", py: { xs: 4, md: 6 } }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            {/* Left column. This held a "signal or noise" minigame — four sparkline
                cards with rounds, scoring and a streak counter — which put a second
                interactive system in the footer competing with the navigation next
                to it. It is now the mark itself, as particles that move away from
                the cursor and settle back. */}
            <Grid size={{ xs: 12, md: 4.5, lg: 4 }}>
              <LogoParticleField />
            </Grid>

            {/* Right Area: Spans Columns 2 to 4 */}
            <Grid size={{ xs: 12, md: 7.5, lg: 8 }}>
              <Stack spacing={{ xs: 4, md: 5 }} justifyContent="space-between" sx={{ height: "100%" }}>
                {/* ── ROW 1: 3 NAVIGATION COLUMNS (PATHWAYS, TALENT, ENTERPRISE CONTACT) ── */}
                <Grid container spacing={{ xs: 4, md: 4 }}>
                  {/* Col 2: Navigation Pathways */}
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Stack spacing={2.5}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ExploreIcon sx={{ fontSize: 16, color: NOIR.gold }} />
                        <Typography
                          sx={{
                            fontFamily: MONO,
                            fontSize: "0.75rem",
                            letterSpacing: "0.18em",
                            color: NOIR.gold,
                            fontWeight: 800,
                            textTransform: "uppercase",
                          }}
                        >
                          PATHWAYS
                        </Typography>
                      </Box>
                      <Stack spacing={1.4}>
                        {[
                          { label: "Home Core", to: "/" },
                          { label: "About Us", to: "/about" },
                          { label: "Core Services", to: "/services" },
                          { label: "Careers & Fellowships", to: "/careers", badge: "HIRING" },
                          { label: "Blog & Intelligence", to: "/blog" },
                          { label: "Innovation Lab", to: "/innovation-hub", badge: "LIVE DEMO" },
                          { label: "Contact Us", to: "/contact" },
                        ].map((link) => (
                          <Box key={link.to} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <RouterLink
                              to={link.to}
                              sx={{
                                color: "rgba(255, 255, 255, 0.75)",
                                textDecoration: "none",
                                fontSize: "0.9rem",
                                fontWeight: 500,
                                transition: "all 0.2s ease",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.8,
                                "&:hover": { color: NOIR.gold, transform: "translateX(4px)" },
                              }}
                            >
                              {link.label}
                            </RouterLink>
                            {link.badge && (
                              <Box
                                sx={{
                                  px: 0.8,
                                  py: 0.1,
                                  borderRadius: "4px",
                                  bgcolor: alpha(NOIR.gold, 0.15),
                                  border: `1px solid ${alpha(NOIR.gold, 0.4)}`,
                                  color: NOIR.gold,
                                  fontFamily: MONO,
                                  fontSize: "0.58rem",
                                  fontWeight: 800,
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {link.badge}
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Stack>
                  </Grid>

                  {/* Col 3: Graduate & Talent Programs */}
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Stack spacing={2.5}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <WorkIcon sx={{ fontSize: 16, color: NOIR.gold }} />
                        <Typography
                          sx={{
                            fontFamily: MONO,
                            fontSize: "0.75rem",
                            letterSpacing: "0.18em",
                            color: NOIR.gold,
                            fontWeight: 800,
                            textTransform: "uppercase",
                          }}
                        >
                          TALENT PROGRAMS
                        </Typography>
                      </Box>
                      <Stack spacing={1.4}>
                        {[
                          { label: "Graduate Program", to: "/careers/technical-graduate-program", badge: "FELLOWSHIP" },
                          { label: "R&D Internship", to: "/careers/rd-internship-program" },
                          { label: "Quant Researcher", to: "/careers/quant-researcher", badge: "OPEN" },
                          { label: "Software Engineer", to: "/careers/software-engineer" },
                          { label: "Full Stack Developer", to: "/careers/full-stack-developer" },
                          { label: "Data Scientist", to: "/careers/data-scientist" },
                          { label: "DevOps Engineer", to: "/careers/devops-engineer" },
                        ].map((job) => (
                          <Box key={job.to} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <RouterLink
                              to={job.to}
                              sx={{
                                color: "rgba(255, 255, 255, 0.75)",
                                textDecoration: "none",
                                fontSize: "0.9rem",
                                fontWeight: 500,
                                transition: "all 0.2s ease",
                                display: "inline-flex",
                                alignItems: "center",
                                "&:hover": { color: NOIR.gold, transform: "translateX(4px)" },
                              }}
                            >
                              {job.label}
                            </RouterLink>
                            {job.badge && (
                              <Box
                                sx={{
                                  px: 0.8,
                                  py: 0.1,
                                  borderRadius: "4px",
                                  bgcolor: "rgba(58, 161, 137, 0.15)",
                                  border: `1px solid ${alpha(NOIR.live, 0.4)}`,
                                  color: NOIR.live,
                                  fontFamily: MONO,
                                  fontSize: "0.58rem",
                                  fontWeight: 800,
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {job.badge}
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Stack>
                  </Grid>

                  {/* Col 4: Contact & Enterprise Standards (With BGC Office moved above General Inquiries) */}
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Stack spacing={2.5}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ContactMailIcon sx={{ fontSize: 16, color: NOIR.gold }} />
                        <Typography
                          sx={{
                            fontFamily: MONO,
                            fontSize: "0.75rem",
                            letterSpacing: "0.18em",
                            color: NOIR.gold,
                            fontWeight: 800,
                            textTransform: "uppercase",
                          }}
                        >
                          ENTERPRISE CONTACT
                        </Typography>
                      </Box>
                      <Stack spacing={2}>
                        {/* BGC Office moved above General Inquiries */}
                        <Box>
                          <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(255, 255, 255, 0.62)", display: "block", mb: 0.8, fontSize: "0.68rem" }}>
                            LOCATION
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                            <LocationOnIcon sx={{ color: NOIR.gold, fontSize: "1.1rem", mt: 0.2 }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "common.white", fontSize: "0.88rem" }}>
                                BGC Office (Taguig, Metro Manila)
                              </Typography>
                              <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block", fontSize: "0.72rem" }}>
                                27/F Ecotower, 32nd St. cor. 9th Ave, Bonifacio Global City
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(255, 255, 255, 0.62)", display: "block", mb: 0.3, fontSize: "0.68rem" }}>
                            GENERAL INQUIRIES
                          </Typography>
                          <Typography
                            component="a"
                            href="mailto:info@phitopolis.com"
                            sx={{
                              color: "common.white",
                              textDecoration: "none",
                              fontWeight: 700,
                              fontSize: "0.92rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 1,
                              "&:hover": { color: NOIR.gold },
                            }}
                          >
                            <MailIcon sx={{ fontSize: 16, color: NOIR.gold }} />
                            info@phitopolis.com
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(255, 255, 255, 0.62)", display: "block", mb: 0.3, fontSize: "0.68rem" }}>
                            CAREERS & FELLOWSHIPS
                          </Typography>
                          <Typography
                            component="a"
                            href="mailto:careers@phitopolis.com"
                            sx={{
                              color: "common.white",
                              textDecoration: "none",
                              fontWeight: 700,
                              fontSize: "0.92rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 1,
                              "&:hover": { color: NOIR.gold },
                            }}
                          >
                            <MailIcon sx={{ fontSize: 16, color: NOIR.gold }} />
                            careers@phitopolis.com
                          </Typography>
                        </Box>

                        <Box sx={{ pt: 0.5 }}>
                          <RouterButton
                            to="/contact"
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                              bgcolor: NOIR.gold,
                              color: NOIR.navyField,
                              fontFamily: MONO,
                              fontWeight: 800,
                              fontSize: "0.75rem",
                              py: 1,
                              px: 2.5,
                              borderRadius: 3,
                              boxShadow: `0 4px 16px ${alpha(NOIR.gold, 0.25)}`,
                              "&:hover": {
                                bgcolor: NOIR.goldLight,
                                boxShadow: `0 6px 20px ${alpha(NOIR.gold, 0.4)}`,
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

                {/* ── ROW 2: DYNAMIC NEXT PAGE / NEXT CHAPTER SECTION (SPANS COLUMNS 2 TO 4) ── */}
                {currentNarration && (() => {
                  const meta = CHAPTER_VISUAL_MAP[currentNarration.next] ?? {
                    chapterNum: "NEXT ROUTE",
                    subtitle: "Discover the next phase of the Phitopolis journey",
                    icon: <AutoAwesomeIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
                    tags: ["Explore", "Phitopolis"],
                  };

                  return (
                    <Box
                      sx={{
                        width: "100%",
                        pt: { xs: 1, md: 2 },
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          alignItems: { xs: "flex-start", sm: "center" },
                          justifyContent: "space-between",
                          gap: { xs: 2.5, sm: 3.5 },
                          py: 2.5,
                          px: { xs: 3, sm: 4 },
                          borderRadius: 5,
                          bgcolor: "rgba(10, 24, 51, 0.75)",
                          border: `1px solid ${alpha(NOIR.gold, 0.35)}`,
                          backdropFilter: "blur(20px)",
                          boxShadow: `0 16px 40px rgba(0, 0, 0, 0.4), inset 0 1px 1px ${alpha(NOIR.gold, 0.2)}`,
                          width: "100%",
                          overflow: "hidden",
                          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                          "&:hover": {
                            borderColor: NOIR.gold,
                            transform: "translateY(-3px)",
                            boxShadow: `0 24px 50px ${alpha(NOIR.gold, 0.22)}, inset 0 1px 1px ${alpha(NOIR.gold, 0.4)}`,
                            bgcolor: "rgba(14, 32, 66, 0.85)",
                          },
                        }}
                      >
                        {/* Ambient Glow */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: "-50%",
                            right: "-20%",
                            width: 220,
                            height: 220,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${alpha(NOIR.gold, 0.12)} 0%, transparent 70%)`,
                            pointerEvents: "none",
                          }}
                        />

                        <Stack direction="row" spacing={2.5} alignItems="center">
                          {/* Visual Aid Icon Badge */}
                          <Box
                            sx={{
                              display: { xs: "none", sm: "flex" },
                              alignItems: "center",
                              justifyContent: "center",
                              width: 50,
                              height: 50,
                              borderRadius: "16px",
                              bgcolor: "rgba(var(--accent-rgb), 0.08)",
                              border: `1px solid ${alpha(NOIR.gold, 0.3)}`,
                              boxShadow: `0 0 20px ${alpha(NOIR.gold, 0.15)}`,
                              flexShrink: 0,
                            }}
                          >
                            {meta.icon}
                          </Box>

                          <Stack spacing={0.5}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  bgcolor: NOIR.gold,
                                  boxShadow: `0 0 8px ${NOIR.gold}`,
                                }}
                              />
                              <Typography
                                sx={{
                                  fontFamily: MONO,
                                  fontSize: "0.68rem",
                                  letterSpacing: "0.18em",
                                  textTransform: "uppercase",
                                  color: NOIR.gold,
                                  fontWeight: 800,
                                }}
                              >
                                NEXT CHAPTER • {meta.chapterNum}
                              </Typography>
                            </Box>

                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 800,
                                color: "#FFFFFF",
                                fontSize: "1.05rem",
                                letterSpacing: "-0.01em",
                                lineHeight: 1.2,
                              }}
                            >
                              {currentNarration.label}
                            </Typography>

                            <Typography
                              variant="caption"
                              sx={{
                                color: "rgba(255, 255, 255, 0.68)",
                                fontSize: "0.78rem",
                                display: "block",
                                lineHeight: 1.3,
                              }}
                            >
                              {meta.subtitle}
                            </Typography>

                            {/* Visual Feature Tags */}
                            <Stack direction="row" spacing={1} sx={{ pt: 0.5, flexWrap: "wrap", gap: 0.5 }}>
                              {meta.tags.map((tag) => (
                                <Box
                                  key={tag}
                                  sx={{
                                    px: 1,
                                    py: 0.2,
                                    borderRadius: "6px",
                                    bgcolor: "rgba(255, 255, 255, 0.06)",
                                    border: "1px solid rgba(255, 255, 255, 0.12)",
                                    color: "rgba(255, 255, 255, 0.75)",
                                    fontFamily: MONO,
                                    fontSize: "0.62rem",
                                    fontWeight: 600,
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  {tag}
                                </Box>
                              ))}
                            </Stack>
                          </Stack>
                        </Stack>

                        <RouterButton
                          to={currentNarration.next}
                          variant="contained"
                          endIcon={<ArrowForwardIcon sx={{ fontSize: "1.1rem !important" }} />}
                          sx={{
                            borderRadius: "100px",
                            px: 3.5,
                            py: 1.2,
                            fontFamily: MONO,
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            letterSpacing: "0.14em",
                            bgcolor: NOIR.gold,
                            color: NOIR.navyField,
                            whiteSpace: "nowrap",
                            alignSelf: { xs: "stretch", sm: "center" },
                            boxShadow: `0 4px 20px ${alpha(NOIR.gold, 0.3)}`,
                            "&:hover": {
                              bgcolor: NOIR.goldLight,
                              boxShadow: `0 8px 25px ${alpha(NOIR.gold, 0.5)}`,
                              transform: "translateX(2px)",
                            },
                          }}
                        >
                          EXPLORE
                        </RouterButton>
                      </Box>
                    </Box>
                  );
                })()}
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* ── 3. BOTTOM SYSTEM BAR (Copyright & Social links only) ── */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{
            pt: 3,
            pb: 1,
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            color: "rgba(255, 255, 255, 0.6)",
          }}
        >
          <Typography variant="caption" sx={{ fontFamily: MONO, fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.8)" }}>
            © 2026 Phitopolis International Corp. All rights reserved.
          </Typography>

          {/* Social Icons */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton component="a" href="#" aria-label="GitHub" sx={{ color: "common.white", "&:hover": { color: NOIR.gold } }}>
              <GitHubIcon fontSize="small" />
            </IconButton>
            <IconButton component="a" href="#" aria-label="LinkedIn" sx={{ color: "common.white", "&:hover": { color: NOIR.gold } }}>
              <LinkedInIcon fontSize="small" />
            </IconButton>
            <IconButton component="a" href="#" aria-label="Twitter" sx={{ color: "common.white", "&:hover": { color: NOIR.gold } }}>
              <TwitterIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
