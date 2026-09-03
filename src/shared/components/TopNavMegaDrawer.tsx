import { useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SpecularIconButton as IconButton } from "@/shared/components/ui/specular";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useLocation } from "@tanstack/react-router";

import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { useTransitionCurtain } from "./transitionCurtainContext";
import { MEGA_NAV_ITEMS, type NavSectionItem } from "./megaNavItems";

interface TopNavMegaDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The desktop navigation drawer — a slim (~420px) panel sliding in from the
 * right with the page still visible behind a light backdrop.
 *
 * Replaced a full-viewport glass sheet that embedded its own command palette;
 * command search now lives solely in the separate ⌘K `CommandPalette`. MUI
 * `Drawer` supplies the backdrop, focus trap, ESC / backdrop-click close and
 * `role="dialog"` — no hand-rolled `Modal` wiring.
 */
export function TopNavMegaDrawer({ open, onClose }: TopNavMegaDrawerProps) {
  const [activeItem, setActiveItem] = useState<NavSectionItem>(MEGA_NAV_ITEMS[0]!);
  const location = useLocation();
  const { navigateWithCurtain } = useTransitionCurtain();

  const handleNavigate = (to: string) => {
    onClose();
    navigateWithCurtain(to);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: { sx: { bgcolor: "rgba(0, 0, 0, 0.4)" } },
        paper: {
          elevation: 0,
          square: true,
          "aria-label": "Site navigation",
          sx: {
            width: { xs: "88vw", sm: 420 },
            maxWidth: "100vw",
            bgcolor: "rgba(6, 24, 59, 0.92)",
            backdropFilter: "blur(20px) saturate(140%)",
            WebkitBackdropFilter: "blur(20px) saturate(140%)",
            color: NOIR.white,
            borderLeft: "1px solid var(--accent-40)",
            backgroundImage: "none",
            boxShadow: "-24px 0 60px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexDirection: "column",
            px: { xs: 3, sm: 4 },
            py: { xs: 3, sm: 4 },
          },
        },
      }}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 10 }}
    >
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ pb: 2.5, borderBottom: "1px solid rgba(255, 255, 255, 0.12)", flexShrink: 0 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "var(--accent)" }} />
          <Typography
            id="nav-drawer-title"
            sx={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.62)",
            }}
          >
            Menu
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          aria-label="Close menu"
          sx={{
            color: "white",
            bgcolor: "rgba(255, 255, 255, 0.08)",
            border: "1px solid var(--accent-40)",
            p: 1,
            transition: "all 0.25s ease",
            "&:hover": {
              bgcolor: "secondary.main",
              color: "secondary.contrastText",
              transform: "rotate(90deg)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Stack>

      {/* Nav list */}
      <Stack
        component="nav"
        aria-labelledby="nav-drawer-title"
        data-lenis-prevent
        spacing={0.5}
        sx={{ flex: 1, overflowY: "auto", py: 2, mx: -1 }}
      >
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
                appearance: "none",
                background: "none",
                border: 0,
                font: "inherit",
                color: "inherit",
                textAlign: "left",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                py: 1.5,
                px: 1,
                borderRadius: 2,
                cursor: "pointer",
                transition: "all 0.22s ease",
                bgcolor: isSelected ? "rgba(var(--accent-rgb), 0.12)" : "transparent",
                "&:hover, &:focus-visible": {
                  bgcolor: "rgba(var(--accent-rgb), 0.18)",
                  transform: "translateX(6px)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    color: isSelected || isActiveRoute ? "var(--accent-ink)" : "rgba(255,255,255,0.4)",
                    transition: "color 0.22s ease",
                  }}
                >
                  {item.tag}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: isSelected || isActiveRoute ? "common.white" : "rgba(255,255,255,0.75)",
                    transition: "color 0.22s ease",
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
              <ArrowForwardIcon
                sx={{
                  color: "var(--accent-ink)",
                  fontSize: "1.3rem",
                  opacity: isSelected ? 1 : 0,
                  transform: isSelected ? "translateX(0)" : "translateX(-12px)",
                  transition: "all 0.22s ease",
                }}
              />
            </Box>
          );
        })}
      </Stack>

      {/* Preview thumbnail of the hovered / focused destination */}
      <Box
        aria-hidden
        onClick={() => handleNavigate(activeItem.to)}
        sx={{
          flexShrink: 0,
          position: "relative",
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid var(--accent-40)",
          cursor: "pointer",
          aspectRatio: "16 / 9",
          mb: 2,
        }}
      >
        <Box
          component="img"
          key={activeItem.to}
          src={activeItem.preview}
          alt=""
          decoding="async"
          loading="lazy"
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(6,24,59,0.95) 0%, transparent 62%)",
          }}
        />
        <Typography
          sx={{
            position: "absolute",
            left: 16,
            bottom: 14,
            fontFamily: MONO,
            fontSize: "0.72rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            color: "var(--accent-ink)",
          }}
        >
          {activeItem.sub}
        </Typography>
      </Box>

      {/* Footer */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ pt: 2, borderTop: "1px solid rgba(255, 255, 255, 0.12)", flexShrink: 0 }}
      >
        <Typography
          variant="caption"
          sx={{ fontFamily: MONO, color: "rgba(255,255,255,0.62)", fontSize: "0.7rem" }}
        >
          PHITOPOLIS R&D FIRM • BGC MANILA
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontFamily: MONO, color: "var(--accent-ink)", fontSize: "0.7rem", fontWeight: 700 }}
        >
          [ESC]
        </Typography>
      </Stack>
    </Drawer>
  );
}
