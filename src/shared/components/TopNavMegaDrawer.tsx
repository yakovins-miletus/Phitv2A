import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useLocation } from "@tanstack/react-router";

import { MONO } from "@/shared/theme/theme";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";

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
    sub: "Signal Core & High-Performance Platforms",
    preview: "/images/software-engineer-banner.png",
    tag: "01",
  },
  {
    to: "/about",
    label: "About",
    sub: "Who We Are, Principles & Manila R&D Firm",
    preview: "/images/AboutPageHero.png",
    tag: "02",
  },
  {
    to: "/services",
    label: "Services",
    sub: "Full-Stack, Quant Research, Data & SRE Ops",
    preview: "/images/quant-research-banner.jpg",
    tag: "03",
  },
  {
    to: "/careers",
    label: "Careers",
    sub: "Graduate Fellowships & Paid R&D Internships",
    preview: "/images/grads/FocusedProgramming.JPG",
    tag: "04",
  },
  {
    to: "/blog",
    label: "Blog",
    sub: "Engineering Research & Tech Articles",
    preview: "/images/ops-support-banner.jpg",
    tag: "05",
  },
  {
    to: "/innovation-hub",
    label: "Innovation Lab",
    sub: "Autonomous AI Agents & Signal Engines",
    preview: "/images/data-science-banner.png",
    tag: "06",
  },
  {
    to: "/contact",
    label: "Contact",
    sub: "BGC Manila & Clark R&D Offices",
    preview: "/images/ecotower-bgc.jpg",
    tag: "07",
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

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleNavigate = (to: string) => {
    onClose();
    router.navigate({ to });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: "-100%" }}
          animate={{ opacity: 1, y: "0%" }}
          exit={{ opacity: 0, y: "-100%" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 4000,
            backgroundColor: "#06183B",
            color: "white",
            overflow: "hidden",
            willChange: "transform, opacity",
            transform: "translateZ(0)",
          }}
        >
          {/* Background Ambient Glows & Dynamic Preview Image */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <Box
              component="img"
              key={activeItem.to}
              src={activeItem.preview}
              alt=""
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.18,
                filter: "blur(10px) brightness(0.6)",
                transform: "scale(1.05)",
                transition: "opacity 0.4s ease, transform 0.6s ease",
                willChange: "opacity, transform",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(circle at 70% 30%, rgba(255, 199, 44, 0.08) 0%, transparent 60%), linear-gradient(180deg, rgba(6, 24, 59, 0.85) 0%, #06183B 100%)",
              }}
            />
          </Box>

          {/* Full Screen Menu Content Wrapper */}
          <Container
            maxWidth="xl"
            sx={{
              position: "relative",
              zIndex: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              py: { xs: 4, md: 6 },
              px: { xs: 3, md: 8 },
            }}
          >
            {/* Header Close Bar */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                pb: 3,
                borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                flexShrink: 0,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#FFC72C" }} />
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.8rem",
                    letterSpacing: "0.22em",
                    color: "#FFC72C",
                    fontWeight: 800,
                  }}
                >
                  PHITOPOLIS R&D // NAVIGATION
                </Typography>
              </Box>

              <IconButton
                onClick={onClose}
                aria-label="Close menu"
                sx={{
                  color: "white",
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 199, 44, 0.4)",
                  p: 1.2,
                  transition: "all 0.25s ease",
                  "&:hover": {
                    bgcolor: "#FFC72C",
                    color: "#0A2A66",
                    transform: "rotate(90deg)",
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>

            {/* Immersive Navigation Grid (Full Screen Split) */}
            <Grid
              container
              spacing={{ xs: 4, md: 8 }}
              alignItems="center"
              sx={{
                flex: 1,
                my: "auto",
                py: { xs: 2, md: 4 },
                overflowY: "auto",
              }}
            >
              {/* Left Column: Full-Height Interactive Navigation Menu */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={{ xs: 1.5, md: 2 }}>
                  {MEGA_NAV_ITEMS.map((item) => {
                    const isActiveRoute = location.pathname === item.to;
                    const isSelected = activeItem.to === item.to;

                    return (
                      <Box
                        key={item.to}
                        onMouseEnter={() => setActiveItem(item)}
                        onClick={() => handleNavigate(item.to)}
                        sx={{
                          position: "relative",
                          py: { xs: 1, md: 1.2 },
                          px: { xs: 2, md: 3 },
                          borderRadius: 4,
                          cursor: "pointer",
                          transition: "all 0.25s ease",
                          bgcolor: isSelected ? "rgba(255, 199, 44, 0.12)" : "transparent",
                          "&:hover": {
                            bgcolor: "rgba(255, 199, 44, 0.18)",
                            transform: "translateX(8px)",
                          },
                        }}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={{ xs: 2, md: 3 }}>
                            <Typography
                              sx={{
                                fontFamily: MONO,
                                fontSize: { xs: "0.85rem", md: "1.1rem" },
                                fontWeight: 800,
                                color: isSelected ? "#FFC72C" : "rgba(255, 255, 255, 0.4)",
                                transition: "color 0.25s ease",
                              }}
                            >
                              {item.tag}
                            </Typography>
                            <Typography
                              variant="h2"
                              component="span"
                              sx={{
                                fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.8rem" },
                                fontWeight: 800,
                                color: isSelected || isActiveRoute ? "common.white" : "rgba(255, 255, 255, 0.75)",
                                transition: "color 0.25s ease",
                                letterSpacing: "-0.02em",
                              }}
                            >
                              {item.label}
                            </Typography>
                          </Stack>

                          <ArrowForwardIcon
                            sx={{
                              color: "#FFC72C",
                              fontSize: "1.6rem",
                              opacity: isSelected ? 1 : 0,
                              transform: isSelected ? "translateX(0)" : "translateX(-16px)",
                              transition: "all 0.25s ease",
                            }}
                          />
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Grid>

              {/* Right Column: High-Performance Preview Display */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: "none", md: "block" } }}>
                <Box
                  onClick={() => handleNavigate(activeItem.to)}
                  sx={{
                    borderRadius: 6,
                    overflow: "hidden",
                    border: "1px solid rgba(255, 199, 44, 0.4)",
                    bgcolor: "rgba(10, 42, 102, 0.4)",
                    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: "#FFC72C",
                      transform: "scale(1.01)",
                    },
                  }}
                >
                  <Box sx={{ position: "relative", width: "100%", height: 380, overflow: "hidden" }}>
                    <Box
                      component="img"
                      key={activeItem.to}
                      src={activeItem.preview}
                      alt={activeItem.label}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(6, 24, 59, 0.95) 0%, transparent 60%)",
                      }}
                    />

                    <Stack
                      spacing={1}
                      sx={{
                        position: "absolute",
                        bottom: 24,
                        left: 24,
                        right: 24,
                        color: "common.white",
                      }}
                    >
                      <Typography
                        variant="overline"
                        sx={{
                          fontFamily: MONO,
                          color: "#FFC72C",
                          fontWeight: 800,
                          letterSpacing: "0.15em",
                          fontSize: "0.75rem",
                        }}
                      >
                        EXPLORE {activeItem.label.toUpperCase()}
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, fontSize: "1.8rem" }}>
                        {activeItem.sub}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, pt: 1, color: "#FFC72C" }}>
                        <Typography sx={{ fontFamily: MONO, fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.1em" }}>
                          NAVIGATE TO PAGE
                        </Typography>
                        <ArrowForwardIcon fontSize="small" />
                      </Box>
                    </Stack>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Footer Status Bar */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                pt: 2.5,
                borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                flexShrink: 0,
              }}
            >
              <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(255, 255, 255, 0.5)", fontSize: "0.72rem" }}>
                PHITOPOLIS R&D FIRM • BGC MANILA & CLARK
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: MONO, color: "#FFC72C", fontSize: "0.72rem", fontWeight: 700 }}>
                PRESS [ESC] TO CLOSE
              </Typography>
            </Stack>
          </Container>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
