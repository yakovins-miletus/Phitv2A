import { useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { alpha } from "@mui/material/styles";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useLocation } from "@tanstack/react-router";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { EASE_OUT_EXPO, EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

export interface NavSectionItem {
  to: string;
  label: string;
  sub: string;
  preview: string;
  tag: string;
}

export const MEGA_NAV_ITEMS: NavSectionItem[] = [
  {
    to: "/",
    label: "Home",
    sub: "Signal Core & Super Hero Platforms",
    preview: "/images/software-engineer-banner.png",
    tag: "FINTECH ENGINE",
  },
  {
    to: "/about",
    label: "About",
    sub: "Who We Are, Values & Culture",
    preview: "/images/AboutPageHero.png",
    tag: "R&D FIRM MANILA",
  },
  {
    to: "/services",
    label: "Services",
    sub: "Full-Stack, Quant, Data & Ops",
    preview: "/images/quant-research-banner.jpg",
    tag: "CORE DISCIPLINES",
  },
  {
    to: "/careers",
    label: "Careers",
    sub: "Graduate Fellowships & Internships",
    preview: "/images/grads/FocusedProgramming.JPG",
    tag: "TALENT PATHWAYS",
  },
  {
    to: "/blog",
    label: "Blog",
    sub: "Latest Insights, People & CSR",
    preview: "/images/ops-support-banner.jpg",
    tag: "INTELLIGENCE FEED",
  },
  {
    to: "/innovation-hub",
    label: "Innovation Lab",
    sub: "Bleeding-Edge AI & Signal Pipelines",
    preview: "/images/data-science-banner.png",
    tag: "AI EXPERIMENTS",
  },
  {
    to: "/contact",
    label: "Contact",
    sub: "BGC Manila & Clark Offices",
    preview: "/images/ecotower-bgc.jpg",
    tag: "START A CONVERSATION",
  },
];

interface TopNavMegaDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function TopNavMegaDrawer({ open, onClose }: TopNavMegaDrawerProps) {
  const [activeItem, setActiveItem] = useState<NavSectionItem>(MEGA_NAV_ITEMS[0]!);
  const router = useRouter();
  const location = useLocation();

  const handleNavigate = (to: string) => {
    onClose();
    router.navigate({ to });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 3000,
            backgroundColor: alpha(NOIR.navyField, 0.96),
            backdropFilter: "blur(24px) saturate(160%)",
            borderBottom: `1px solid ${alpha(NOIR.gold, 0.3)}`,
            boxShadow: `0 24px 60px ${alpha(NOIR.navyField, 0.5)}`,
            color: NOIR.ink,
            maxHeight: "92vh",
            overflowY: "auto",
          }}
        >
          {/* Click-outside backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: -1,
              cursor: "default",
            }}
          />
          <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 }, position: "relative" }}>
            {/* Header Close Bar */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4, borderBottom: `1px solid ${alpha(NOIR.hairline, 0.3)}`, pb: 2 }}>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.78rem",
                  letterSpacing: "0.22em",
                  color: NOIR.gold,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                NAVIGATION // DYNAMIC SITE SECTIONS
              </Typography>
              <IconButton
                onClick={onClose}
                aria-label="Close menu"
                sx={{
                  color: "white",
                  border: `1px solid ${alpha(NOIR.gold, 0.4)}`,
                  bgcolor: alpha(NOIR.gold, 0.1),
                  "&:hover": { bgcolor: NOIR.gold, color: NOIR.navyField },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>

            <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
              {/* Left Column: Interactive Nav Item Selector */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1}>
                  {MEGA_NAV_ITEMS.map((item) => {
                    const isActiveRoute = location.pathname === item.to;
                    const isSelected = activeItem.to === item.to;

                    return (
                      <Box
                        key={item.to}
                        onMouseEnter={() => setActiveItem(item)}
                        onClick={() => handleNavigate(item.to)}
                        sx={{
                          py: 1.8,
                          px: 3,
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: `all 0.3s ${EASE_OUT_EXPO_CSS}`,
                          bgcolor: isSelected ? alpha(NOIR.gold, 0.12) : "transparent",
                          borderLeft: isSelected ? `4px solid ${NOIR.gold}` : "4px solid transparent",
                          "&:hover": {
                            bgcolor: alpha(NOIR.gold, 0.16),
                            transform: "translateX(8px)",
                          },
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography
                              variant="h3"
                              sx={{
                                fontSize: { xs: "1.5rem", md: "2.2rem" },
                                fontWeight: 800,
                                color: isSelected || isActiveRoute ? NOIR.gold : "white",
                                transition: "color 0.25s ease",
                              }}
                            >
                              {item.label}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "rgba(255, 255, 255, 0.7)",
                                fontSize: "0.88rem",
                                mt: 0.3,
                              }}
                            >
                              {item.sub}
                            </Typography>
                          </Box>

                          <ArrowForwardIcon
                            sx={{
                              color: NOIR.gold,
                              opacity: isSelected ? 1 : 0,
                              transform: isSelected ? "translateX(0)" : "translateX(-12px)",
                              transition: "all 0.3s ease",
                            }}
                          />
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Grid>

              {/* Right Column: Dynamic Site Preview Card */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  onClick={() => handleNavigate(activeItem.to)}
                  sx={{
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: `1px solid ${alpha(NOIR.gold, 0.4)}`,
                    bgcolor: "rgba(10, 42, 102, 0.6)",
                    boxShadow: `0 20px 50px ${alpha(NOIR.navyField, 0.6)}`,
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <Box sx={{ position: "relative", width: "100%", height: 380, overflow: "hidden" }}>
                    {MEGA_NAV_ITEMS.map((item) => {
                      const isSelected = activeItem.to === item.to;
                      return (
                        <Box
                          key={item.to}
                          component="img"
                          src={item.preview}
                          alt={item.label}
                          loading="eager"
                          sx={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: isSelected ? 1 : 0,
                            transform: isSelected ? "scale(1)" : "scale(1.05)",
                            transition: "opacity 0.22s ease-out, transform 0.4s ease-out",
                            willChange: "opacity, transform",
                          }}
                        />
                      );
                    })}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(10,42,102,0.9) 0%, rgba(10,42,102,0.2) 60%, transparent 100%)",
                        pointerEvents: "none",
                      }}
                    />
                  </Box>

                  <Box sx={{ p: 3, bgcolor: "#FFFFFF", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h4" sx={{ color: NOIR.navyField, fontWeight: 700, mb: 0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        Explore {activeItem.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: alpha(NOIR.navyField, 0.65) }}>
                        {activeItem.sub}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: NOIR.navyField, flexShrink: 0 }}>
                      <Typography sx={{ fontFamily: MONO, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                        JUMP TO SECTION
                      </Typography>
                      <ArrowForwardIcon fontSize="small" />
                    </Stack>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
