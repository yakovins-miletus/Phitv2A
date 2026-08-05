import { useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Slide from "@mui/material/Slide";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useRouter, useLocation } from "@tanstack/react-router";

import { MONO } from "@/shared/theme/theme";

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
    preview: "/images/software-engineer-banner.webp",
    tag: "01",
  },
  {
    to: "/about",
    label: "About",
    sub: "Who We Are, Principles & Manila R&D Firm",
    preview: "/images/AboutPageHero.webp",
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
    preview: "/images/data-science-banner.webp",
    tag: "06",
  },
  {
    to: "/contact",
    label: "Contact",
    sub: "BGC Manila & Clark R&D Offices",
    preview: "/images/ecotower-bgc.webp",
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

  const handleNavigate = (to: string) => {
    onClose();
    router.navigate({ to });
  };

  // This is the site's PRIMARY navigation, and it used to be a bare `motion.div`
  // at `position: fixed; inset: 0; zIndex: 4000` — no role, no accessible name,
  // no focus trap, no focus restore, no background inerting and no scroll lock,
  // with `<Box onClick>` nav items that were not focusable at all. A keyboard user
  // could open the menu and then tab straight through it into the page underneath,
  // which was still fully interactive behind an opaque overlay. The menu could not
  // be operated by keyboard.
  //
  // MUI's Modal supplies the trap, the restore, the inerting, the scroll lock and
  // the Escape handler (which is why the hand-rolled keydown listener is gone).
  //
  // The slide uses MUI's own `Slide` rather than motion's AnimatePresence. With
  // AnimatePresence the panel mounted a tick after Modal opened, so the focus trap
  // built its candidate list against an empty subtree — tabbing past the last item
  // then dropped focus onto document.body and out of the dialog entirely. Modal is
  // built to drive a transition child directly, and keeps the trap in step with it.
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slotProps={{ backdrop: { sx: { bgcolor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(16px)" } } }}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 10 }}
    >
    <Slide in={open} direction="down" timeout={450} appear>
        <Box
          role="dialog"
          aria-modal="true"
          aria-labelledby="mega-drawer-title"
          tabIndex={-1}
          sx={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(6, 24, 59, 0.6)",
            backdropFilter: "blur(24px)",
            color: "white",
            overflow: "hidden",
            willChange: "transform",
            outline: "none",
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
              component="img" decoding="async" loading="lazy"
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
                  id="mega-drawer-title"
                  component="h2"
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
                        component="button"
                        type="button"
                        aria-current={isActiveRoute ? "page" : undefined}
                        onMouseEnter={() => setActiveItem(item)}
                        onFocus={() => setActiveItem(item)}
                        onClick={() => handleNavigate(item.to)}
                        sx={{
                          // Was a <Box onClick> — not reachable by keyboard at all.
                          appearance: "none",
                          background: "none",
                          border: 0,
                          font: "inherit",
                          color: "inherit",
                          textAlign: "left",
                          width: "100%",
                          display: "block",
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
                  aria-hidden
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
                      component="img" decoding="async" loading="lazy"
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
              <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(255, 255, 255, 0.62)", fontSize: "0.72rem" }}>
                PHITOPOLIS R&D FIRM • BGC MANILA & CLARK
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: MONO, color: "#FFC72C", fontSize: "0.72rem", fontWeight: 700 }}>
                PRESS [ESC] TO CLOSE
              </Typography>
            </Stack>
          </Container>
        </Box>
    </Slide>
    </Modal>
  );
}
