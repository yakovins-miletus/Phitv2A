import React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SpecularIconButton as IconButton } from "@/shared/components/ui/specular";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MailIcon from "@mui/icons-material/Mail";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TwitterIcon from "@mui/icons-material/Twitter";
import ExploreIcon from "@mui/icons-material/Explore";
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
import { useTransitionCurtain } from "@/shared/components/TransitionCurtain";
import { LogoParticleField } from "@/shared/components/LogoParticleField";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

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
    chapterNum: "THE FIRM",
    subtitle: "Origin story and research philosophy.",
    icon: <CorporateFareIcon sx={{ fontSize: 32, color: NOIR.gold }} />,
    tags: ["Growth", "Research", "HQ"],
  },
  "/services": {
    chapterNum: "CAPABILITIES",
    subtitle: "High-frequency trading and ML infrastructure.",
    icon: <TerminalIcon sx={{ fontSize: 32, color: NOIR.gold }} />,
    tags: ["HFT", "ML", "Cloud"],
  },
  "/careers": {
    chapterNum: "TALENT",
    subtitle: "Graduate fellowships and engineering roles.",
    icon: <RocketLaunchIcon sx={{ fontSize: 32, color: NOIR.gold }} />,
    tags: ["Graduates", "Quants", "Engineers"],
  },
  "/blog": {
    chapterNum: "INTELLIGENCE",
    subtitle: "Notes on systems engineering and algorithms.",
    icon: <ArticleIcon sx={{ fontSize: 32, color: NOIR.gold }} />,
    tags: ["Research", "Insights"],
  },
  "/innovation-hub": {
    chapterNum: "LAB DEMOS",
    subtitle: "Live prototypes and benchmarks.",
    icon: <ScienceIcon sx={{ fontSize: 32, color: NOIR.gold }} />,
    tags: ["Benchmarks", "Prototypes"],
  },
  "/contact": {
    chapterNum: "DISCOVERY",
    subtitle: "Connect with our engineering team.",
    icon: <SendIcon sx={{ fontSize: 32, color: NOIR.gold }} />,
    tags: ["Inquiries", "Partnerships"],
  },
  "/": {
    chapterNum: "MAIN CORE",
    subtitle: "Return to the primary showcase.",
    icon: <HomeIcon sx={{ fontSize: 32, color: NOIR.gold }} />,
    tags: ["System", "Overview"],
  },
};

export function SiteFooter({ footerAnchorRef, currentNarration }: SiteFooterProps) {
  const { navigateWithCurtain } = useTransitionCurtain();
  return (
    <Box
      component="footer"
      ref={footerAnchorRef}
      sx={{
        bgcolor: NOIR.navyDeep,
        color: "#FFFFFF",
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
      {/* Background Ambient Radial Glow */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 30%, rgba(var(--accent-rgb), 0.08) 0%, transparent 65%), linear-gradient(180deg, rgba(6, 24, 59, 0.95) 0%, #04122E 100%)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* Upper Main Area: Navigation Pathways on left, Particle P mark on right */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", py: { xs: 4, md: 5 } }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            {/* Left Column: Navigation Pathways (Dominant Element) */}
            <Grid size={{ xs: 12, md: 7.5, lg: 8 }}>
              <Stack spacing={2.5}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ExploreIcon sx={{ fontSize: 20, color: NOIR.gold }} />
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: "0.85rem",
                      letterSpacing: "0.15em",
                      color: NOIR.gold,
                      fontWeight: 800,
                      textTransform: "uppercase",
                    }}
                  >
                    PATHWAYS
                  </Typography>
                </Box>
                <Grid container spacing={1.5}>
                  {[
                    { label: "Home", to: "/", icon: <HomeIcon sx={{ fontSize: 18 }} /> },
                    { label: "About", to: "/about", icon: <CorporateFareIcon sx={{ fontSize: 18 }} /> },
                    { label: "Services", to: "/services", icon: <TerminalIcon sx={{ fontSize: 18 }} /> },
                    { label: "Careers", to: "/careers", badge: "HIRING", icon: <RocketLaunchIcon sx={{ fontSize: 18 }} /> },
                    { label: "Blog", to: "/blog", icon: <ArticleIcon sx={{ fontSize: 18 }} /> },
                    { label: "Innovation Lab", to: "/innovation-hub", badge: "DEMO", icon: <ScienceIcon sx={{ fontSize: 18 }} /> },
                    { label: "Contact", to: "/contact", icon: <SendIcon sx={{ fontSize: 18 }} /> },
                  ].map((link) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={link.to}>
                      <Box
                        component={RouterLink}
                        to={link.to}
                        underline="none"
                        onClick={(e: React.MouseEvent) => {
                          if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                            e.preventDefault();
                            navigateWithCurtain(link.to);
                          }
                        }}
                        sx={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          px: 1.5,
                          py: 1.1,
                          textDecoration: "none !important",
                          overflow: "hidden",
                          transition: "all 0.25s ease",
                          color: "rgba(255, 255, 255, 0.85)",
                          "&, &:hover, &:focus, &:active": {
                            textDecoration: "none !important",
                          },
                          "& *": {
                            textDecoration: "none !important",
                          },
                          "& .pathway-icon": {
                            color: "rgba(255, 255, 255, 0.45)",
                            transition: "color 0.25s ease",
                          },
                          "& .pathway-bar": {
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            height: "2px",
                            width: "0%",
                            bgcolor: NOIR.gold,
                            boxShadow: `0 0 8px ${NOIR.gold}`,
                            transition: `width 0.3s ${EASE_OUT_EXPO_CSS}`,
                          },
                          "&:hover": {
                            color: NOIR.goldLight,
                            "& .pathway-icon": {
                              color: NOIR.gold,
                            },
                            "& .pathway-bar": {
                              width: "100%",
                            },
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box className="pathway-icon" sx={{ display: "flex" }}>
                            {link.icon}
                          </Box>
                          <Typography
                            sx={{
                              fontSize: "1.1rem",
                              fontWeight: 700,
                              letterSpacing: "-0.01em",
                              textDecoration: "none !important",
                            }}
                          >
                            {link.label}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {link.badge && (
                            <Box
                              sx={{
                                px: 1,
                                py: 0.2,
                                borderRadius: "4px",
                                bgcolor: alpha(NOIR.gold, 0.15),
                                border: `1px solid ${alpha(NOIR.gold, 0.4)}`,
                                color: NOIR.gold,
                                fontFamily: MONO,
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                letterSpacing: "0.05em",
                              }}
                            >
                              {link.badge}
                            </Box>
                          )}
                          <ArrowForwardIcon className="pathway-icon" sx={{ fontSize: 16 }} />
                        </Box>
                        <Box className="pathway-bar" />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Grid>

            {/* Right Column: Particle P (Preserved on Right) */}
            <Grid size={{ xs: 12, md: 4.5, lg: 4 }}>
              <LogoParticleField />
            </Grid>
          </Grid>
        </Box>

        {/* ── 2. HORIZONTAL CONTACT SECTION (JUST ABOVE BOTTOM SYSTEM BAR) ── */}
        <Box
          sx={{
            py: 2.5,
            px: { xs: 3, sm: 4 },
            mb: 2,
            borderRadius: 3,
            bgcolor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <Grid container spacing={3} alignItems="center">
            {/* Contact Header & Action */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Stack spacing={1.2}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ContactMailIcon sx={{ fontSize: 20, color: NOIR.gold }} />
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: "0.85rem",
                      letterSpacing: "0.15em",
                      color: NOIR.gold,
                      fontWeight: 800,
                      textTransform: "uppercase",
                    }}
                  >
                    CONTACT
                  </Typography>
                </Box>
                <RouterButton
                  to="/contact"
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: NOIR.gold,
                    color: NOIR.navyField,
                    fontFamily: MONO,
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    py: 0.9,
                    px: 2.5,
                    borderRadius: 2.5,
                    width: "fit-content",
                    boxShadow: `0 4px 16px ${alpha(NOIR.gold, 0.25)}`,
                    "&:hover": {
                      bgcolor: NOIR.goldLight,
                      boxShadow: `0 6px 20px ${alpha(NOIR.gold, 0.4)}`,
                    },
                  }}
                >
                  CONTACT US
                </RouterButton>
              </Stack>
            </Grid>

            {/* Location */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(255, 255, 255, 0.55)", display: "block", mb: 0.5, fontSize: "0.7rem" }}>
                LOCATION
              </Typography>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <LocationOnIcon sx={{ color: NOIR.gold, fontSize: "1.1rem", mt: 0.2 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "common.white", fontSize: "0.9rem" }}>
                    BGC Office (Metro Manila)
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block", fontSize: "0.78rem", lineHeight: 1.3 }}>
                    27/F Ecotower, 32nd St. cor. 9th Ave, Bonifacio Global City
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Emails */}
            <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
              <Stack spacing={0.6}>
                <Box>
                  <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(255, 255, 255, 0.55)", display: "block", fontSize: "0.68rem" }}>
                    INQUIRIES
                  </Typography>
                  <Typography
                    component="a"
                    href="mailto:info@phitopolis.com"
                    sx={{
                      color: "common.white",
                      textDecoration: "none !important",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.8,
                      "&:hover, &:focus": { color: NOIR.gold, textDecoration: "none !important" },
                    }}
                  >
                    <MailIcon sx={{ fontSize: 15, color: NOIR.gold }} />
                    info@phitopolis.com
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(255, 255, 255, 0.55)", display: "block", fontSize: "0.68rem" }}>
                    CAREERS
                  </Typography>
                  <Typography
                    component="a"
                    href="mailto:careers@phitopolis.com"
                    sx={{
                      color: "common.white",
                      textDecoration: "none !important",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.8,
                      "&:hover, &:focus": { color: NOIR.gold, textDecoration: "none !important" },
                    }}
                  >
                    <MailIcon sx={{ fontSize: 15, color: NOIR.gold }} />
                    careers@phitopolis.com
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            {/* Social Links */}
            <Grid size={{ xs: 12, md: 2.5 }}>
              <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(255, 255, 255, 0.55)", display: "block", mb: 0.5, fontSize: "0.7rem" }}>
                CONNECT
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
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
            </Grid>
          </Grid>
        </Box>

        {/* ── 3. BOTTOM SYSTEM BAR (Copyright on left, Overhauled Next Page on Bottom Right) ── */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{
            pt: 2,
            pb: 1,
            color: "rgba(255, 255, 255, 0.6)",
          }}
        >
          <Typography variant="caption" sx={{ fontFamily: MONO, fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.8)" }}>
            © 2026 Phitopolis International Corp. All rights reserved.
          </Typography>

          {/* Overhauled Next Page Element at Bottom Right */}
          {currentNarration && (() => {
            const meta = CHAPTER_VISUAL_MAP[currentNarration.next] ?? {
              chapterNum: "NEXT",
              subtitle: "Discover the next phase.",
              icon: <AutoAwesomeIcon sx={{ fontSize: 16, color: NOIR.gold }} />,
            };

            return (
              <Box
                component={RouterLink}
                to={currentNarration.next}
                underline="none"
                onClick={(e: React.MouseEvent) => {
                  if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    navigateWithCurtain(currentNarration.next);
                  }
                }}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1.5,
                  textDecoration: "none !important",
                  color: "common.white",
                  py: 1,
                  px: 2.5,
                  borderRadius: "100px",
                  bgcolor: "rgba(255, 255, 255, 0.04)",
                  border: `1px solid ${alpha(NOIR.gold, 0.3)}`,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  "&, &:hover, &:focus, &:active": {
                    textDecoration: "none !important",
                  },
                  "& *": {
                    textDecoration: "none !important",
                  },
                  "&:hover": {
                    borderColor: NOIR.gold,
                    bgcolor: alpha(NOIR.gold, 0.12),
                    color: NOIR.goldLight,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    color: NOIR.gold,
                    textTransform: "uppercase",
                    textDecoration: "none !important",
                  }}
                >
                  NEXT ROUTE • {meta.chapterNum}
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", textDecoration: "none !important" }}>
                  {currentNarration.label}
                </Typography>
                <ArrowForwardIcon sx={{ fontSize: 16, color: NOIR.gold }} />
              </Box>
            );
          })()}
        </Stack>
      </Container>
    </Box>
  );
}
