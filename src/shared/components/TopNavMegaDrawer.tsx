import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SpecularIconButton as IconButton } from "@/shared/components/ui/specular";
import Modal from "@mui/material/Modal";
import Slide from "@mui/material/Slide";
import InputBase from "@mui/material/InputBase";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useRouter, useLocation } from "@tanstack/react-router";

import { MONO } from "@/shared/theme/theme";
import {
  GROUP_ORDER,
  SIGNAL_TEXT,
  commandHint,
  filterCommands,
  useCommandExecutor,
  type Cmd,
  type Group,
} from "./commandActions";
import { useHeroModeState } from "@/features/hero/heroModeStore";

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
    preview: "/images/quant-research-banner.webp",
    tag: "03",
  },
  {
    to: "/careers",
    label: "Careers",
    sub: "Graduate Fellowships & Paid R&D Internships",
    preview: "/images/grads/FocusedProgramming.webp",
    tag: "04",
  },
  {
    to: "/blog",
    label: "Blog",
    sub: "Engineering Research & Tech Articles",
    preview: "/images/ops-support-banner.webp",
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
    sub: "BGC Manila R&D Office",
    preview: "/images/bgc-2.jpg",
    tag: "07",
  },
];

interface TopNavMegaDrawerProps {
  open: boolean;
  onClose: () => void;
}

const LISTBOX_ID = "drawer-cmdk-listbox";
const optId = (id: string) => `drawer-cmdk-opt-${id}`;

export function TopNavMegaDrawer({ open, onClose }: TopNavMegaDrawerProps) {
  const [activeItem, setActiveItem] = useState<NavSectionItem>(MEGA_NAV_ITEMS[0]!);
  const router = useRouter();
  const location = useLocation();
  const { mode: heroMode } = useHeroModeState();

  // Command Palette State
  const [query, setQuery] = useState("");
  const [isCommandMode, setIsCommandMode] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const { execute, copiedId, signalChars, resetRuntime } = useCommandExecutor(
    (opts) => void router.navigate(opts),
  );

  const handleNavigate = (to: string) => {
    onClose();
    router.navigate({ to });
  };

  useEffect(() => {
    if (!open) {
      setQuery("");
      setIsCommandMode(false);
      setActiveIndex(0);
      resetRuntime();
    }
  }, [open, resetRuntime]);

  const filtered = useMemo(() => filterCommands(query), [query]);

  const activeCmd: Cmd | undefined = filtered[activeIndex];
  const activeId = activeCmd ? optId(activeCmd.id) : undefined;

  useEffect(() => {
    if (!open || !isCommandMode || !activeId) return;
    document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [open, isCommandMode, activeId]);

  const onInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Home" && filtered.length) {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End" && filtered.length) {
      e.preventDefault();
      setActiveIndex(filtered.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[activeIndex];
      if (cmd) execute(cmd, onClose);
    }
  };

  const monoLabelSx = {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: "0.16em",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  } as const;

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      // The sheet itself is full-viewport glass, so the backdrop only needs a
      // faint tint — at 0.4 black plus its own blur it was doing the occluding
      // the sheet's transparency was supposed to avoid.
      slotProps={{ backdrop: { sx: { bgcolor: "rgba(0, 0, 0, 0.15)" } } }}
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
            backgroundColor: "rgba(6, 24, 59, 0.28)",
            backdropFilter: "blur(28px) saturate(140%)",
            WebkitBackdropFilter: "blur(28px) saturate(140%)",
            color: "white",
            overflow: "hidden",
            willChange: "transform",
            outline: "none",
          }}
        >
          {/* Background ambient glow.
              There used to be a full-bleed blurred copy of the hovered item's
              preview image behind this, swapping on every hover. Behind the old
              opaque sheet it was a faint wash; against the glass it reads as the
              whole backdrop changing, competing with the preview card that shows
              the same image sharply. The glass now shows the page instead. */}
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
              sx={{
                position: "absolute",
                inset: 0,
                // Was a gradient that bottomed out at solid #06183B, which made the
                // whole sheet opaque no matter what the glass layer above it did.
                background: "radial-gradient(circle at 70% 30%, rgba(var(--accent-rgb), 0.10) 0%, transparent 60%), linear-gradient(180deg, rgba(6, 24, 59, 0.30) 0%, rgba(6, 24, 59, 0.55) 100%)",
              }}
            />
          </Box>

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
            {/* Header / Command Search Bar */}
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "var(--accent)", display: { xs: "none", md: "block" } }} />
                
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, maxWidth: 600, bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1.5, px: 2, py: 1, border: "1px solid rgba(255,255,255,0.1)", transition: "border-color 0.2s", "&:focus-within": { borderColor: "var(--accent)" } }}>
                  <Typography component="span" aria-hidden sx={{ fontFamily: MONO, fontSize: 14, color: "var(--accent-fg)", lineHeight: 1 }}>
                    ❯
                  </Typography>
                  <InputBase
                    fullWidth
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActiveIndex(0);
                    }}
                    onFocus={() => setIsCommandMode(true)}
                    onBlur={() => {
                      if (!query) setIsCommandMode(false);
                    }}
                    onKeyDown={onInputKeyDown}
                    placeholder="Search pages or type a command..."
                    inputProps={{
                      role: "combobox",
                      "aria-expanded": isCommandMode,
                      "aria-controls": LISTBOX_ID,
                      "aria-autocomplete": "list",
                      "aria-label": "Search commands",
                      autoCapitalize: "off",
                      autoCorrect: "off",
                      spellCheck: false,
                      ...(activeId !== undefined ? { "aria-activedescendant": activeId } : {}),
                    }}
                    sx={{
                      fontFamily: MONO,
                      fontSize: 14,
                      color: "#FFF",
                      "& input::placeholder": { color: "rgba(255,255,255,0.4)", opacity: 1 },
                    }}
                  />
                </Box>
              </Box>

              <IconButton
                onClick={onClose}
                aria-label="Close menu"
                sx={{
                  color: "white",
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid var(--accent-40)",
                  p: 1.2,
                  ml: 4,
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

            {/* Immersive Navigation Grid */}
            <Grid
              container
              spacing={{ xs: 4, md: 8 }}
              alignItems="stretch"
              sx={{
                flex: 1,
                my: "auto",
                py: { xs: 2, md: 4 },
                overflow: "hidden", // We handle scroll on children
              }}
            >
              {/* Left Column: Full-Height Interactive Navigation Menu */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", flexDirection: "column" }}>
                <Stack spacing={{ xs: 1.5, md: 2 }} sx={{ overflowY: "auto", pr: 2, flex: 1 }}>
                  {MEGA_NAV_ITEMS.map((item) => {
                    const isActiveRoute = location.pathname === item.to;
                    const isSelected = activeItem.to === item.to;

                    return (
                      <Box
                        key={item.to}
                        component="button"
                        type="button"
                        aria-current={isActiveRoute ? "page" : undefined}
                        onMouseEnter={() => {
                          setActiveItem(item);
                          if (!query) setIsCommandMode(false);
                        }}
                        onFocus={() => {
                          setActiveItem(item);
                          if (!query) setIsCommandMode(false);
                        }}
                        onClick={() => handleNavigate(item.to)}
                        sx={{
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
                          bgcolor: (isSelected && !isCommandMode) ? "rgba(var(--accent-rgb), 0.12)" : "transparent",
                          "&:hover": {
                            bgcolor: "rgba(var(--accent-rgb), 0.18)",
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
                                color: (isSelected && !isCommandMode) ? "var(--accent-fg)" : "rgba(255, 255, 255, 0.4)",
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
                                color: (isSelected && !isCommandMode) || isActiveRoute ? "common.white" : "rgba(255, 255, 255, 0.75)",
                                transition: "color 0.25s ease",
                                letterSpacing: "-0.02em",
                              }}
                            >
                              {item.label}
                            </Typography>
                          </Stack>

                          <ArrowForwardIcon
                            sx={{
                              color: "var(--accent-fg)",
                              fontSize: "1.6rem",
                              opacity: (isSelected && !isCommandMode) ? 1 : 0,
                              transform: (isSelected && !isCommandMode) ? "translateX(0)" : "translateX(-16px)",
                              transition: "all 0.25s ease",
                            }}
                          />
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Grid>

              {/* Right Column: Dynamic View (Preview vs Command Palette) */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: "none", md: "block" }, height: "100%" }}>
                {isCommandMode ? (
                  /* Command Palette Results */
                  <Box
                    sx={{
                      borderRadius: 6,
                      overflow: "hidden",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      bgcolor: "rgba(10, 42, 102, 0.35)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <Box
                      component="ul"
                      role="listbox"
                      id={LISTBOX_ID}
                      aria-label="Commands"
                      sx={{ listStyle: "none", m: 0, p: 0, py: 1, flex: 1, overflowY: "auto" }}
                    >
                      {filtered.length === 0 && (
                        <Typography component="li" role="presentation" sx={{ ...monoLabelSx, px: 3, py: 2 }}>
                          no match — 0 results
                        </Typography>
                      )}
                      {GROUP_ORDER.map((group: Group) => {
                        const rows = filtered.filter((c) => c.group === group);
                        if (rows.length === 0) return null;
                        return (
                          <Box component="li" role="group" aria-label={group} key={group} sx={{ px: 0 }}>
                            <Typography aria-hidden sx={{ ...monoLabelSx, px: 3, pt: 2, pb: 1, color: "rgba(255,255,255,0.3)" }}>
                              {group}
                            </Typography>
                            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
                              {rows.map((cmd) => {
                                const index = filtered.indexOf(cmd);
                                const selected = index === activeIndex;
                                const hint = commandHint(cmd, {
                                  copied: copiedId === cmd.id,
                                  heroMode,

                                });
                                return (
                                  <Box
                                    component="li"
                                    key={cmd.id}
                                    id={optId(cmd.id)}
                                    role="option"
                                    aria-selected={selected}
                                    {...(hint.active ? { "aria-current": "true" as const } : {})}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => execute(cmd, onClose)}
                                    onMouseMove={() => {
                                      if (!selected) setActiveIndex(index);
                                    }}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: 2,
                                      px: 3,
                                      py: 1.5,
                                      cursor: "pointer",
                                      borderLeft: `2px solid ${selected ? "var(--accent)" : "transparent"}`,
                                      backgroundColor: selected ? "var(--accent-15)" : "transparent",
                                    }}
                                  >
                                    <Typography sx={{ fontFamily: MONO, fontSize: 13, color: selected ? "#FFF" : "rgba(255,255,255,0.7)" }}>
                                      {cmd.label}
                                    </Typography>
                                    <Typography
                                      component="span"
                                      sx={{
                                        ...monoLabelSx,
                                        flexShrink: 0,
                                        color: copiedId === cmd.id
                                          ? "var(--accent-fg)"
                                          : hint.active
                                            ? "var(--accent-fg)"
                                            : selected
                                              ? "rgba(255,255,255,0.5)"
                                              : "rgba(255,255,255,0.3)",
                                      }}
                                    >
                                      {hint.text}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>

                    {signalChars !== null && (
                      <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.1)", px: 3, py: 2, bgcolor: "rgba(0,0,0,0.2)" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", pb: 1 }}>
                          <Typography sx={monoLabelSx}>signal</Typography>
                          <Typography sx={{ ...monoLabelSx, color: "var(--accent-fg)" }}>sim</Typography>
                        </Box>
                        <Box
                          component="pre"
                          aria-hidden
                          sx={{ m: 0, fontFamily: MONO, fontSize: 12, lineHeight: 1.7, color: "#FFF", whiteSpace: "pre-wrap", minHeight: "calc(3 * 1.7em)" }}
                        >
                          {SIGNAL_TEXT.slice(0, signalChars)}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                  /* High-Performance Preview Display */
                  <Box
                    aria-hidden
                    onClick={() => handleNavigate(activeItem.to)}
                    sx={{
                      borderRadius: 6,
                      overflow: "hidden",
                      border: "1px solid var(--accent-40)",
                      bgcolor: "rgba(10, 42, 102, 0.4)",
                      boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
                      cursor: "pointer",
                      transition: "border-color 0.3s ease",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      "&:hover": {
                        borderColor: "var(--accent)",
                      },
                    }}
                  >
                    <Box sx={{ position: "relative", width: "100%", flex: 1, overflow: "hidden" }}>
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
                          bottom: 32,
                          left: 32,
                          right: 32,
                          color: "common.white",
                        }}
                      >
                        <Typography
                          variant="overline"
                          sx={{
                            fontFamily: MONO,
                            color: "var(--accent-fg)",
                            fontWeight: 800,
                            letterSpacing: "0.15em",
                            fontSize: "0.75rem",
                          }}
                        >
                          EXPLORE {activeItem.label.toUpperCase()}
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800, fontSize: "2rem" }}>
                          {activeItem.sub}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, pt: 1, color: "var(--accent-fg)" }}>
                          <Typography sx={{ fontFamily: MONO, fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.1em" }}>
                            NAVIGATE TO PAGE
                          </Typography>
                          <ArrowForwardIcon fontSize="small" />
                        </Box>
                      </Stack>
                    </Box>
                  </Box>
                )}
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
                PHITOPOLIS R&D FIRM • BGC MANILA
              </Typography>
              <Box sx={{ display: "flex", gap: 3 }}>
                {isCommandMode && (
                  <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(255, 255, 255, 0.62)", fontSize: "0.72rem" }}>
                    ↑↓ NAVIGATE • ↵ EXECUTE
                  </Typography>
                )}
                <Typography variant="caption" sx={{ fontFamily: MONO, color: "var(--accent-fg)", fontSize: "0.72rem", fontWeight: 700 }}>
                  PRESS [ESC] TO CLOSE
                </Typography>
              </Box>
            </Stack>
          </Container>
        </Box>
      </Slide>
    </Modal>
  );
}
