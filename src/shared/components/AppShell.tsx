import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { EntrancePhaseContext, useReducedMotion } from "@/shared/motion";
import type { EntrancePhase } from "@/shared/motion";
import { MONO } from "@/shared/theme/theme";
import { motion, AnimatePresence } from "motion/react";

import { CommandPalette } from "./CommandPalette";
import { FloatingIdOverlay } from "./FloatingIdOverlay";

import { NAV_ANCHORS, NavbarProvider, useNavbar, useNavbarAnchor } from "./NavbarContext";
// Removed Magnetic imports
import { Preloader, PRELOADER_SESSION_KEY } from "./Preloader";
import type { LoadSignal } from "./Preloader";
import { TopNavMegaDrawer } from "./TopNavMegaDrawer";
import { SiteFooter } from "./SiteFooter";
import { RouterButton, RouterLink } from "./RouterLink";
import PhitopolisLogo from "./PhitopolisLogo";

import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO_CSS, EASE_OUT_EXPO } from "@/shared/motion/easing";
import { refreshScrollTriggers } from "@/shared/motion/scrollTriggerBridge";
import { useNavAutohide } from "./useNavAutohide";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/careers", label: "Careers" },
  { to: "/blog", label: "Blog" },
  { to: "/innovation-hub", label: "Innovation Lab" },
] as const;

const NARRATION_FLOW: Record<string, { next: string; label: string }> = {
  "/": { next: "/about", label: "ABOUT PHITOPOLIS" },
  "/about": { next: "/services", label: "CAPABILITIES & SERVICES" },
  "/services": { next: "/careers", label: "CAREERS & POSITIONS" },
  "/careers": { next: "/blog", label: "RESEARCH & ARTICLES" },
  "/blog": { next: "/innovation-hub", label: "INNOVATION LAB" },
  "/innovation-hub": { next: "/contact", label: "GET IN TOUCH" },
  "/contact": { next: "/", label: "HOME" },
};

function shouldShowPreloader(reduced: boolean): boolean {
  if (reduced) return false;
  try {
    return sessionStorage.getItem(PRELOADER_SESSION_KEY) === null;
  } catch {
    return false;
  }
}

/** Routes warmed while the preloader plays: preloadRoute downloads + compiles
    each lazy chunk and runs its loader into the query cache, so first
    navigation anywhere is instant. Failures (e.g. API down) resolve silently —
    the bar tracks best-effort work, never blocks on it. */
const WARM_ROUTES = [
  { to: "/about", label: "ABOUT" },
  { to: "/services", label: "SERVICES" },
  { to: "/blog", label: "BLOG" },
  { to: "/innovation-hub", label: "INNOVATION" },
  { to: "/contact", label: "CONTACT" },
] as const;

/** Warmed during the preloader. These point at the 1200px derivatives rather than the
    originals — `data-science-banner.png` alone was 975 KB, preloaded on every first
    visit on every device, before anything had asked for it. */
const CRITICAL_IMAGES = [
  { src: "/phitopolis_logo_hero.svg", label: "BRAND LOGO" },
  { src: "/images/careers/quant-research-banner.webp", label: "RESEARCH CORE" },
  { src: "/images/careers/data-science-banner.webp", label: "DATA STREAM" },
] as const;

function preloadImage(src: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve();
    img.onerror = () => resolve(); // failsafe: do not block load if asset is missing
  });
}

function useWarmupSignals(active: boolean): LoadSignal[] {
  const router = useRouter();
  const [signals] = useState<LoadSignal[]>(() => {
    if (!active) return [];

    const routeSignals = WARM_ROUTES.map((route) => ({
      label: route.label,
      promise: router.preloadRoute({ to: route.to }).catch(() => undefined),
    }));

    const imageSignals = CRITICAL_IMAGES.map((img) => ({
      label: img.label,
      promise: preloadImage(img.src),
    }));

    return [...routeSignals, ...imageSignals];
  });
  return signals;
}

function AnimatedContactButton({
  label,
  sx,
  isActive,
  variant = "default",
}: {
  label: string;
  sx?: any;
  isActive?: boolean;
  variant?: "default" | "onDark";
}) {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const router = useRouter();
  const onDark = variant === "onDark";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (clicked) return;
    setClicked(true);
    setTimeout(() => {
      router.navigate({ to: "/contact" });
      setClicked(false);
    }, 400);
  };

  return (
    <Button
      variant="outlined"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setClicked(false); }}
      onClick={handleClick}
      sx={{
        borderRadius: "10px",
        border: "none !important",
        color: (hovered || clicked || isActive) ? `${NOIR.gold} !important` : (onDark ? "rgba(255,255,255,0.9)" : "text.secondary"),
        bgcolor: "transparent !important",
        background: "none !important",
        backgroundImage: "none !important",
        boxShadow: "none !important",
        backdropFilter: "none !important",
        WebkitBackdropFilter: "none !important",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: clicked ? "scale(0.95)" : "scale(1)",
        "&:hover": {
          border: "none !important",
          bgcolor: "transparent !important",
          background: "none !important",
          backgroundImage: "none !important",
          boxShadow: "none !important",
          backdropFilter: "none !important",
          WebkitBackdropFilter: "none !important",
          color: `${NOIR.gold} !important`,
        },
        ...sx,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <AnimatePresence mode="wait">
          {!hovered ? (
            <motion.div
              key="default"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap" }}
            >
              {label}
            </motion.div>
          ) : (
            <motion.div
              key="hover"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap" }}
            >
              {label}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: 8 }}>
                <rect x="0.5" y="0.5" width="15" height="15" rx="1.5" stroke="currentColor" fill="none" />
                {clicked && (
                  <motion.path
                    d="M4 8L7 11L12 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  />
                )}
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
        <Box sx={{ visibility: "hidden", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
          {label}
          <svg width="16" height="16" style={{ marginLeft: 8 }} />
        </Box>
      </Box>
    </Button>
  );
}

/** Custom 3-Bar Icon with spreading animation on hover. */
function ThreeBarMenuIcon({ isHovered, color }: { isHovered: boolean; color: string }) {
  return (
    <Box
      sx={{
        width: 20,
        height: 14,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          width: 18,
          height: 2,
          bgcolor: color,
          borderRadius: "1px",
          transform: isHovered ? "translateY(-2px)" : "translateY(0)",
          transition: `all 0.3s ${EASE_OUT_EXPO_CSS}`,
        }}
      />
      <Box
        sx={{
          width: 18,
          height: 2,
          bgcolor: color,
          borderRadius: "1px",
          transition: `all 0.3s ${EASE_OUT_EXPO_CSS}`,
        }}
      />
      <Box
        sx={{
          width: 18,
          height: 2,
          bgcolor: color,
          borderRadius: "1px",
          transform: isHovered ? "translateY(2px)" : "translateY(0)",
          transition: `all 0.3s ${EASE_OUT_EXPO_CSS}`,
        }}
      />
    </Box>
  );
}

/** 3-Bar Menu Icon Button matching Contact Button hover behavior. */
function AnimatedMenuButton({
  active,
  onClick,
  isNotch: _isNotch,
  isImmersiveDark,
  ariaLabel,
  sx,
  noBorder,
}: {
  active: boolean;
  onClick: () => void;
  isNotch?: boolean;
  isImmersiveDark: boolean;
  ariaLabel: string;
  sx?: object;
  noBorder?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isPrimary = hovered || active;
  
  const bgColor = isImmersiveDark 
    ? (isPrimary ? NOIR.gold : "rgba(255, 255, 255, 0.15)") 
    : (isPrimary ? NOIR.navyField : "#FFFFFF");
    
  const iconColor = isImmersiveDark 
    ? "#FFFFFF" 
    : (isPrimary ? "#FFFFFF" : NOIR.navyField);

  const shadowMd = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)";

  return (
    <Box
      component="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={ariaLabel}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 42,
        height: 42,
        borderRadius: "10px",
        border: "none !important",
        bgcolor: noBorder ? "transparent !important" : bgColor,
        color: noBorder && (hovered || active) ? `${NOIR.gold} !important` : iconColor,
        boxShadow: noBorder ? "none !important" : shadowMd,
        cursor: "pointer",
        // No `outline: none` here. This is a real <button> with an onClick, and it
        // renders in the app bar on every route. An `sx` rule is injected after
        // MuiCssBaseline's `*:focus-visible`, so suppressing the outline locally beat
        // the theme's designed focus ring and left the primary nav trigger with no
        // keyboard indicator at all.
        transition: `all 0.3s ${EASE_OUT_EXPO_CSS}`,
        ...sx,
        "&:hover": {
          border: "none !important",
          bgcolor: noBorder ? "transparent !important" : (isImmersiveDark ? NOIR.gold : NOIR.navyField),
          color: noBorder ? `${NOIR.gold} !important` : "#FFFFFF",
          boxShadow: noBorder ? "none !important" : shadowMd,
        },
      }}
    >
      <ThreeBarMenuIcon isHovered={hovered || active} color={noBorder && (hovered || active) ? NOIR.gold : iconColor} />
    </Box>
  );
}

/** Delay before the entrance plays when there is no preloader to cover it
    (repeat visits) — lets the first paint commit so nothing moves mid-layout. */
const SETTLE_MS = 80;
const HEADER_AT_MS = 300;
const OPEN_AT_MS = 600;

function AppShellInner({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [showPreloader, setShowPreloader] = useState(() => shouldShowPreloader(reduced === true));
  // Tiered entrance: hero → header → content, instead of one boolean
  // releasing every animation system on the same tick.
  const [phase, setPhase] = useState<EntrancePhase>(() => (reduced === true ? "open" : "covered"));
  const releasedRef = useRef(reduced === true);
  const hadPreloaderRef = useRef(showPreloader);
  const entranceTimersRef = useRef<number[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [megaNavOpen, setMegaNavOpen] = useState(false);
  const warmup = useWarmupSignals(showPreloader);
  const { pathname } = useLocation();
  const onContactPage = pathname === "/contact";
  const closeMobileNav = () => {
    setMobileNavOpen(false);
  };

  const releaseEntrance = () => {
    if (releasedRef.current) return;
    releasedRef.current = true;
    const timers = entranceTimersRef.current;
    setPhase("hero");
    timers.push(window.setTimeout(() => setPhase("header"), HEADER_AT_MS));
    timers.push(window.setTimeout(() => setPhase("open"), OPEN_AT_MS));
  };

  useEffect(() => {
    // Repeat visits skip the preloader, so nothing else triggers the release.
    if (!hadPreloaderRef.current) {
      entranceTimersRef.current.push(window.setTimeout(releaseEntrance, SETTLE_MS));
    }
    const timers = entranceTimersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers.length = 0;
    };
  }, []);

  // The overscroll-to-navigate machine that used to live here is gone.
  // It accumulated "scroll pressure" from non-passive wheel/touchmove listeners —
  // each tick calling checkIsAtBottom(), which read scrollY, innerHeight, two
  // scrollHeights and an offsetHeight, forcing a full synchronous layout — then
  // auto-navigated to the next page and played a full-screen curtain wipe. It
  // hijacked the browser's own overscroll gesture, its escape hatch (Esc) was
  // undiscoverable, and it re-attached five window listeners mid-gesture because
  // its own setState was one of the effect's dependencies.
  // The footer now offers the next chapter as an ordinary link.
  const currentNarration = NARRATION_FLOW[pathname] ?? NARRATION_FLOW["/"]!;

  useEffect(() => {
    // Reset body overflow on route change to guarantee scroll is never blocked on new pages
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    // No-op until the lazy home chunk has loaded — see scrollTriggerBridge.ts
    // for why AppShell cannot import gsap directly.
    refreshScrollTriggers();
  }, [pathname]);


  const headerReleased = phase === "header" || phase === "open";
  const { overrideMode, derivedIsCompact, isOverDarkSection, autohideEnabled, showMotto, toggleMotto } = useNavbar();
  const navHidden = useNavAutohide(autohideEnabled, pathname);

  // Global keyboard shortcut to toggle company motto (Alt+M / Option+M)
  useEffect(() => {
    const handleMottoKey = (e: KeyboardEvent) => {
      // Toggle motto only if not inside editable text elements
      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        (activeEl as HTMLElement).isContentEditable
      );
      if (!isEditable && e.altKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        toggleMotto();
      }
    };
    window.addEventListener("keydown", handleMottoKey);
    return () => window.removeEventListener("keydown", handleMottoKey);
  }, [toggleMotto]);

  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (pathname === '/') {
        setIsAtTop(window.scrollY < window.innerHeight * 19);
      } else {
        setIsAtTop(window.scrollY < 50);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const effectiveMode = (pathname === '/' && isAtTop) ? "minimal" : overrideMode;

  const isMinimal = effectiveMode === "minimal";
  const isGlass = effectiveMode === "glassmorphism";
  const isNotch = effectiveMode === "notch";
  const isStandard = effectiveMode === "standard";
  const isStandardOrGlass = isStandard || isGlass;
  const isIsland = effectiveMode === "island";
  
  // The dark mode should accurately reflect the anchors, even at the top.
  const onDark = (isNotch || isOverDarkSection) && !isIsland;
  const isImmersive = effectiveMode === "immersive";
  const footerAnchorRef = useNavbarAnchor(NAV_ANCHORS.SITE_FOOTER, { dark: true });

  return (
    <EntrancePhaseContext.Provider value={phase}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* First tab stop on every page. There was no skip link, so a keyboard user
            had to tab through the whole header — logo, six nav items, contact button,
            menu trigger — on every single navigation before reaching content.
            Styling lives in components.ts (.skip-to-content); it is off-screen until
            focused. */}
        <Box component="a" href="#main-content" className="skip-to-content">
          Skip to content
        </Box>
        {showPreloader ? (
          <Preloader
            warmup={warmup}
            onDone={() => {
              setShowPreloader(false);
              releaseEntrance();
            }}
          />
        ) : null}
        <TopNavMegaDrawer open={megaNavOpen} onClose={() => setMegaNavOpen(false)} />
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: isGlass
              ? "transparent"
              : isStandard
              ? (isOverDarkSection
                ? "rgba(30, 30, 30, 0.45)"
                : "rgba(255, 255, 255, 0.55)")
              : "transparent",
            backdropFilter: isGlass ? "none" : (isStandard ? "blur(20px) saturate(160%)" : "none"),
            borderBottom: isStandard
              ? (isOverDarkSection
                ? "1px solid rgba(255, 255, 255, 0.12)"
                : "1px solid rgba(0, 0, 0, 0.08)")
              : "none",
            boxShadow: isStandard
              ? (isOverDarkSection ? "0 4px 30px rgba(0,0,0,0.15)" : "0 2px 20px rgba(0,0,0,0.03)")
              : "none",
            pt: isNotch || isStandardOrGlass ? 0 : 1,
            pointerEvents: showPreloader ? "none" : (isStandardOrGlass ? "auto" : "none"),
            transform: navHidden || showPreloader ? "translateY(-120%)" : "translateY(0%)",
            opacity: showPreloader ? 0 : 1,
            transition: `transform 0.5s ${EASE_OUT_EXPO_CSS}, opacity 0.5s ease, background-color 0.6s cubic-bezier(0.16,1,0.3,1), border-color 0.6s cubic-bezier(0.16,1,0.3,1), box-shadow 0.6s cubic-bezier(0.16,1,0.3,1)`,
          }}
        >
          {/* Glassmorphism Background layer (fades out at bottom) */}
          {isGlass && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: -20, // extend below the navbar to allow a smooth blur fade
                zIndex: -1,
                backdropFilter: "blur(12px) saturate(120%)",
                WebkitBackdropFilter: "blur(12px) saturate(120%)",
                // Gradient mask to fade out the blur
                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
                maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
                bgcolor: isOverDarkSection ? "rgba(30, 30, 30, 0.25)" : "rgba(255, 255, 255, 0.4)",
                transition: "background-color 0.6s cubic-bezier(0.16,1,0.3,1)",
                borderBottom: isOverDarkSection ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.02)",
              }}
            />
          )}
          <Container disableGutters maxWidth={false} sx={{ display: "flex", justifyContent: "center", pointerEvents: 'none' }}>
            <Toolbar
              disableGutters
              sx={{
                position: "relative",
                width: "100%",
                maxWidth: isMinimal 
                  ? "100vw" 
                  : (isStandardOrGlass 
                    ? "1536px" 
                    : (isNotch 
                      ? "100vw" 
                      : (derivedIsCompact ? { xs: "1200px", "2xl": "1536px" } : "1536px"))),
                pointerEvents: 'auto',
                // width/margin-top are excluded from the transition list while
                // liquid — they're driven by per-pointermove React state and
                // would lag behind the cursor under a CSS transition.
                transition:
                  "background-color 0.6s cubic-bezier(0.16,1,0.3,1), " +
                  "border-color 0.6s cubic-bezier(0.16,1,0.3,1), " +
                  "box-shadow 0.6s cubic-bezier(0.16,1,0.3,1), " +
                  "padding 0.6s cubic-bezier(0.16,1,0.3,1), " +
                  "max-width 0.6s cubic-bezier(0.16,1,0.3,1), " +
                  "backdrop-filter 0.6s cubic-bezier(0.16,1,0.3,1), " +
                  "gap 0.6s cubic-bezier(0.16,1,0.3,1)",
                bgcolor: isStandardOrGlass
                  ? "transparent"
                  : (isMinimal
                    ? "transparent"
                    : isNotch
                    ? "#1E1E1E"
                    : isIsland
                    ? "rgba(255, 255, 255, 0.65)"
                    : isOverDarkSection
                      ? "rgba(30, 30, 30, 0.28)"
                      : (derivedIsCompact ? "#FFFFFF" : "transparent")),
                backdropFilter: isStandardOrGlass
                  ? "none"
                  : (isMinimal
                    ? "none"
                    : isIsland
                    ? "blur(20px) saturate(160%)"
                    : isOverDarkSection
                      ? "blur(16px) saturate(140%)"
                      : "none"),
                border: isIsland ? "1px solid rgba(255, 255, 255, 0.4)" : "none",
                borderColor: isIsland ? "rgba(255, 255, 255, 0.4)" : "transparent",
                borderRadius: isStandardOrGlass
                  ? "0px"
                  : (isNotch
                    ? "0px 0px 24px 24px"
                    : isImmersive
                      ? "28px"
                      : (derivedIsCompact ? "100px" : "0px")),
                padding: isMinimal
                  ? { xs: "4px 32px", md: "4px 72px" }
                  : (isStandardOrGlass
                    ? { xs: "4px 16px", sm: "4px 24px" }
                    : (isNotch
                      ? "2px 20px"
                      : isImmersive
                        ? "6px 24px"
                        : (derivedIsCompact ? "0px 32px" : { xs: "4px 16px", sm: "4px 24px" }))),
                boxShadow: isIsland ? "0 8px 32px rgba(0,0,0,0.08)" : "none",
                display: "flex",
                justifyContent: isNotch ? "center" : "center",
                alignItems: "center",
                gap: isNotch ? 2.5 : 4,
                mx: "auto",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  maxWidth: isMinimal ? "100%" : (isNotch ? "720px" : "1536px"),
                  justifyContent: "space-between",
                  alignItems: "center",
                  mx: "auto",
                  px: isMinimal ? 0 : 0,
                }}
              >
              <RouterLink
                to="/"
                underline="none"
                sx={{ 
                  textDecoration: "none", 
                  flexShrink: 0, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1,
                  position: "relative",
                  overflow: "hidden",
                  p: 0.5,
                  m: -0.5,
                  borderRadius: "8px",
                }}
              >
                <Box sx={{ color: onDark ? "#FFFFFF" : (derivedIsCompact ? "text.primary" : "primary.main"), display: 'flex' }}>
                  <PhitopolisLogo
                    style={{ height: (isStandardOrGlass || isIsland) ? 18 : 24, width: 'auto', transition: "height 0.4s ease" }}
                    color="currentColor"
                    accentColor={NOIR.gold}
                  />
                </Box>
                <motion.div
                  initial={false}
                  animate={headerReleased ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Stack spacing={0.1}>
                    <Typography
                      component="span"
                      variant="h4"
                      sx={{ color: onDark ? "#FFFFFF" : "primary.main", fontWeight: 800, fontSize: (isStandardOrGlass || isIsland) ? "0.95rem" : "1.15rem", letterSpacing: "0.08em", lineHeight: 1.1, transition: "color 0.4s ease, font-size 0.4s ease" }}
                    >
                      PH<Box component="span" sx={{ color: NOIR.gold }}>IT</Box>OPOLIS
                    </Typography>
                    {showMotto && (
                      <Typography
                        sx={{
                          fontFamily: MONO,
                          fontSize: "0.58rem",
                          letterSpacing: "0.12em",
                          color: onDark ? "rgba(255,255,255,0.7)" : "text.secondary",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                          opacity: 0.85,
                        }}
                      >
                        MAKING TOMORROW'S TECHNOLOGY AVAILABLE TODAY
                      </Typography>
                    )}
                  </Stack>
                </motion.div>
              </RouterLink>

              {/* Central Navigation Items for Standard, Island, or Glassmorphism Mode */}
              {(isStandardOrGlass || isIsland) && (
                <Box
                  component="nav"
                  sx={{
                    display: { xs: "none", md: "flex" },
                    alignItems: "center",
                    gap: 3.5,
                  }}
                >
                  {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
                    return (
                      <RouterLink
                        key={item.to}
                        to={item.to}
                        underline="none"
                        sx={{
                          fontFamily: MONO,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textDecoration: "none !important",
                          color: isActive
                            ? NOIR.gold
                            : (onDark ? "rgba(255,255,255,0.7)" : "text.secondary"),
                          transition: "color 0.3s ease",
                          position: "relative",
                          "&:hover": {
                            color: NOIR.gold,
                            textDecoration: "none !important",
                          },
                        }}
                      >
                        {item.label}
                        {isActive && (
                          <motion.div
                            layoutId="activeNavIndicator"
                            transition={{ type: "tween", duration: 0.65, ease: EASE_OUT_EXPO }}
                            style={{
                              position: "absolute",
                              bottom: "-6px",
                              left: 0,
                              right: 0,
                              height: "2px",
                              backgroundColor: NOIR.gold,
                            }}
                          />
                        )}
                      </RouterLink>
                    );
                  })}
                </Box>
              )}

              {/* Rightmost Controls: Contact + 3-Bar Menu Icon with Hover Dropdown & Click Mega Drawer */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <AnimatedContactButton
                  label="Contact"
                  isActive={onContactPage}
                  variant={onDark ? "onDark" : "default"}
                  sx={{
                    display: { xs: "none", md: "inline-flex" },
                    opacity: 1,
                    height: (isStandardOrGlass || isIsland) ? "24px" : "32px",
                    fontSize: (isStandardOrGlass || isIsland) ? "0.72rem" : undefined,
                    fontWeight: (isStandardOrGlass || isIsland) ? 700 : undefined,
                    fontFamily: (isStandardOrGlass || isIsland) ? MONO : undefined,
                    letterSpacing: (isStandardOrGlass || isIsland) ? "0.08em" : undefined,
                    textTransform: (isStandardOrGlass || isIsland) ? "none" : undefined,
                    padding: (isStandardOrGlass || isIsland) ? "2px 0px" : undefined,
                    minWidth: (isStandardOrGlass || isIsland) ? "auto" : undefined,
                  }}
                />

                {/* Desktop 3-Bar Menu Button */}
                <AnimatedMenuButton
                  active={megaNavOpen}
                  onClick={() => setMegaNavOpen(!megaNavOpen)}
                  isNotch={false}
                  isImmersiveDark={onDark}
                  ariaLabel="Open navigation menu"
                  noBorder={isStandardOrGlass || isIsland}
                  sx={{ display: { xs: "none", md: "inline-flex" }, height: (isStandardOrGlass || isIsland) ? "24px" : "32px", width: (isStandardOrGlass || isIsland) ? "32px" : "36px" }}
                />

                {/* Mobile 3-Bar Menu Button */}
                <AnimatedMenuButton
                  active={mobileNavOpen}
                  onClick={() => setMobileNavOpen(true)}
                  isNotch={false}
                  isImmersiveDark={onDark}
                  ariaLabel="Open mobile navigation menu"
                  noBorder={isStandardOrGlass || isIsland}
                  sx={{ display: { xs: "inline-flex", md: "none" }, height: (isStandardOrGlass || isIsland) ? "24px" : "32px", width: (isStandardOrGlass || isIsland) ? "32px" : "36px" }}
                />
              </Box>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Mobile navigation drawer — the header nav is desktop-only, so this is
            how phones reach every page. */}
        <Drawer
          anchor="right"
          open={mobileNavOpen}
          onClose={closeMobileNav}
          slotProps={{ paper: { sx: { width: "min(320px, 82vw)", bgcolor: "background.default", p: 3 } } }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "text.secondary" }}>
              Menu
            </Typography>
            <IconButton aria-label="Close navigation menu" onClick={closeMobileNav} sx={{ color: "text.primary" }}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Stack component="nav">
            {NAV_ITEMS.map((item) => (
              <RouterLink
                key={item.to}
                to={item.to}
                onClick={closeMobileNav}
                sx={{
                  py: 1.75,
                  px: 1,
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: "text.primary",
                  textDecoration: "none",
                  borderBottom: 1,
                  borderColor: "divider",
                  transition: "all 0.2s ease",
                  "&:hover": { color: "primary.main", bgcolor: "action.hover", paddingLeft: 2 }
                }}
                activeProps={{ sx: { color: NOIR.gold } }}
              >
                {item.label}
              </RouterLink>
            ))}
          </Stack>
          <RouterButton
            to="/contact"
            onClick={closeMobileNav}
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            sx={{ 
              mt: 3,
            }}
          >
            Contact
          </RouterButton>
        </Drawer>

        <Box component="main" id="main-content" tabIndex={-1} sx={{ flexGrow: 1, outline: "none" }}>
          {children}
        </Box>



        <SiteFooter
          footerAnchorRef={footerAnchorRef}
          currentNarration={currentNarration}
        />
        <CommandPalette />
        <FloatingIdOverlay />

      </Box>
    </EntrancePhaseContext.Provider>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <NavbarProvider>
      <AppShellInner>{children}</AppShellInner>
    </NavbarProvider>
  );
}
