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
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TwitterIcon from "@mui/icons-material/Twitter";
import MailIcon from "@mui/icons-material/Mail";
import PlaceIcon from "@mui/icons-material/Place";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { alpha } from "@mui/material/styles";
import { useLocation, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { EntrancePhaseContext, useReducedMotion, usePointerFine } from "@/shared/motion";
import type { EntrancePhase } from "@/shared/motion";
import { FONT, MONO } from "@/shared/theme/theme";
import { motion, AnimatePresence } from "motion/react";

import { CommandPalette } from "./CommandPalette";

import { GrainOverlay } from "./GrainOverlay";
import { LiquidNavHandle, useLiquidSpacing } from "./LiquidNavHandle";
import { NavbarProvider, useNavbar, useNavbarAnchor } from "./NavbarContext";
// Removed Magnetic imports
import { Preloader, PRELOADER_SESSION_KEY } from "./Preloader";
import type { LoadSignal } from "./Preloader";
import { TopNavMegaDrawer } from "./TopNavMegaDrawer";
import { RouterButton, RouterLink } from "./RouterLink";
import PhitopolisLogo from "./PhitopolisLogo";

import { NOIR } from "@/shared/theme/palette";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/blog", label: "Blog" },
  { to: "/innovation-hub", label: "Innovation Lab" },
] as const;

const NARRATION_FLOW: Record<string, { next: string; label: string }> = {
  "/": { next: "/about", label: "ABOUT PHITOPOLIS" },
  "/about": { next: "/services", label: "CAPABILITIES & SERVICES" },
  "/services": { next: "/blog", label: "RESEARCH & ARTICLES" },
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

function useWarmupSignals(active: boolean): LoadSignal[] {
  const router = useRouter();
  const [signals] = useState<LoadSignal[]>(() => {
    if (!active) return [];
    return WARM_ROUTES.map((route) => ({
      label: route.label,
      promise: router.preloadRoute({ to: route.to }).catch(() => undefined),
    }));
  });
  return signals;
}

function AnimatedContactButton({ label, sx, isActive, variant = "default" }: { label: string, sx?: any, isActive?: boolean, variant?: "default" | "onDark" }) {
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
        borderRadius: "6px",
        borderColor: onDark ? "#FFFFFF" : "primary.main",
        color: onDark ? "#FFFFFF" : "primary.main",
        bgcolor: isActive ? (onDark ? "rgba(255,255,255,0.14)" : "rgba(10,42,102,0.05)") : (onDark ? "transparent" : "#FFFFFF"),
        boxShadow: isActive ? "inset 0 2px 4px rgba(0,0,0,0.08)" : "none",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: clicked ? "scale(0.95)" : "scale(1)",
        "&:hover": {
          bgcolor: isActive ? (onDark ? "rgba(255,255,255,0.14)" : "rgba(0, 0, 0, 0.03)") : (onDark ? "#FFFFFF" : "primary.main"),
          color: isActive ? (onDark ? "#FFFFFF" : "primary.main") : (onDark ? "primary.main" : "primary.contrastText"),
          borderColor: isActive ? (onDark ? "#FFFFFF" : "primary.main") : (onDark ? "primary.main" : "primary.main"),
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
              style={{ position: "absolute", whiteSpace: "nowrap" }}
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
              style={{ position: "absolute", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}
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
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      <Box
        sx={{
          width: 18,
          height: 2,
          bgcolor: color,
          borderRadius: "1px",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      <Box
        sx={{
          width: 18,
          height: 2,
          bgcolor: color,
          borderRadius: "1px",
          transform: isHovered ? "translateY(2px)" : "translateY(0)",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </Box>
  );
}

/** 3-Bar Menu Icon Button matching Contact Button hover behavior. */
function AnimatedMenuButton({
  active,
  onClick,
  isNotch,
  isImmersiveDark,
  ariaLabel,
  sx,
}: {
  active: boolean;
  onClick: () => void;
  isNotch: boolean;
  isImmersiveDark: boolean;
  ariaLabel: string;
  sx?: object;
}) {
  const [hovered, setHovered] = useState(false);

  const isPrimary = hovered || active;
  const bgColor = isPrimary
    ? NOIR.navyField
    : isNotch || isImmersiveDark
    ? "transparent"
    : "#FFFFFF";
  const borderColor = isPrimary
    ? NOIR.navyField
    : isNotch || isImmersiveDark
    ? "rgba(255,255,255,0.25)"
    : NOIR.navyField;
  const iconColor = isPrimary
    ? "#FFFFFF"
    : isNotch || isImmersiveDark
    ? "#FFFFFF"
    : NOIR.navyField;

  return (
    <Box
      component="button"
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "6px",
        border: `1px solid ${borderColor}`,
        backgroundColor: bgColor,
        height: "42px",
        width: "42px",
        p: 0,
        cursor: "pointer",
        outline: "none",
        boxShadow: hovered ? `0 6px 20px ${alpha(NOIR.navyField, 0.25)}` : "none",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        ...sx,
      }}
    >
      <ThreeBarMenuIcon isHovered={hovered} color={iconColor} />
    </Box>
  );
}

/** Full White Loading Screen Display shown during continuous page transitions. */
function TransitionLoadingDisplay({
  targetLabel,
  onComplete,
}: {
  targetLabel: string;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "hold" | "fadeout" | "blank">("loading");

  useEffect(() => {
    const startTime = performance.now();
    const duration = typeof window !== "undefined" && window.navigator?.userAgent?.includes("jsdom") ? 50 : 650;

    let animFrame: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (pct < 100) {
        animFrame = requestAnimationFrame(tick);
      } else {
        // Hold for 300ms, then fadeout, then blank screen for 300ms, then open page
        setPhase("hold");
        setTimeout(() => {
          setPhase("fadeout");
          setTimeout(() => {
            setPhase("blank");
            setTimeout(() => {
              onComplete();
            }, 300);
          }, 300);
        }, 300);
      }
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [onComplete]);

  const isVisible = phase === "loading" || phase === "hold";

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#FFFFFF",
        zIndex: 3001,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2.5,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.98 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
      >
        <Box sx={{ width: 90, height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src="/phitopolis_logo_hero.svg"
            alt="Phitopolis Logo"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Box>

        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: "0.85rem",
            fontWeight: 800,
            letterSpacing: "0.22em",
            color: NOIR.navyField,
            textTransform: "uppercase",
          }}
        >
          PHITOPOLIS
        </Typography>

        <Box sx={{ width: 220, height: 3, bgcolor: alpha(NOIR.navyField, 0.12), borderRadius: "2px", overflow: "hidden", mt: 1 }}>
          <Box
            sx={{
              height: "100%",
              bgcolor: NOIR.gold,
              width: `${progress}%`,
              transition: "width 0.04s linear",
            }}
          />
        </Box>

        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: "0.82rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: NOIR.gold,
          }}
        >
          {progress}%
        </Typography>

        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: "0.68rem",
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: alpha(NOIR.navyField, 0.55),
            textTransform: "uppercase",
          }}
        >
          LOADING — {targetLabel}
        </Typography>
      </motion.div>
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

  const router = useRouter();
  const [transitionState, setTransitionState] = useState<"idle" | "triggered" | "closing" | "loading" | "opening">("idle");
  const transitionTargetRef = useRef<string | null>(null);
  const [scrollPressure, setScrollPressure] = useState(0);
  const currentNarration = NARRATION_FLOW[pathname] ?? NARRATION_FLOW["/"]!;

  useEffect(() => {
    // Reset body overflow on route change to guarantee scroll is never blocked on new pages
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    if (typeof window !== "undefined" && (window as any).ScrollTrigger) {
      (window as any).ScrollTrigger.refresh();
    }
  }, [pathname]);

  // Continuous overscroll below footer -> transition to next narration page
  useEffect(() => {
    if (reduced || transitionState !== "idle" || showPreloader) {
      // Don't clear pressure if we are triggered/holding
      if (transitionState !== "triggered") {
        setScrollPressure(0);
      }
      return;
    }

    let accumulated = 0;
    const threshold = 240; // threshold scroll pressure to trigger next page
    let resetTimer: number;

    const drainPressure = () => {
      resetTimer = window.setInterval(() => {
        accumulated = Math.max(0, accumulated - 15);
        setScrollPressure(Math.round((accumulated / threshold) * 100));
        if (accumulated === 0) {
          window.clearInterval(resetTimer);
        }
      }, 30);
    };

    const handleWheel = (e: WheelEvent) => {
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 25;
      if (isAtBottom && e.deltaY > 0) {
        window.clearInterval(resetTimer);
        accumulated = Math.min(threshold, accumulated + e.deltaY * 0.7);
        setScrollPressure(Math.round((accumulated / threshold) * 100));

        if (accumulated >= threshold) {
          setScrollPressure(100);
          const target = currentNarration.next;
          transitionTargetRef.current = target;
          setTransitionState("triggered");
          
          window.clearTimeout(resetTimer);
          window.clearInterval(resetTimer);

          setTimeout(() => {
            setScrollPressure(0);
            setTransitionState("closing");
          }, 3000);
        } else {
          // start draining when user stops scrolling
          window.clearTimeout(resetTimer);
          resetTimer = window.setTimeout(drainPressure, 150);
        }
      }
    };

    let startTouchY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        startTouchY = e.touches[0]!.clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 25;
      if (isAtBottom && e.touches.length > 0) {
        const currentTouchY = e.touches[0]!.clientY;
        const diffY = startTouchY - currentTouchY;
        if (diffY > 0) {
          window.clearInterval(resetTimer);
          accumulated = Math.min(threshold, accumulated + diffY * 0.85);
          setScrollPressure(Math.round((accumulated / threshold) * 100));
          startTouchY = currentTouchY;

          if (accumulated >= threshold) {
            setScrollPressure(100);
            const target = currentNarration.next;
            transitionTargetRef.current = target;
            setTransitionState("triggered");
            
            window.clearTimeout(resetTimer);
            window.clearInterval(resetTimer);

            setTimeout(() => {
              setScrollPressure(0);
              setTransitionState("closing");
            }, 3000);
          } else {
            window.clearTimeout(resetTimer);
            resetTimer = window.setTimeout(drainPressure, 200);
          }
        }
      }
    };

    const handleTouchEnd = () => {
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(drainPressure, 50);
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.clearInterval(resetTimer);
      window.clearTimeout(resetTimer);
    };
  }, [pathname, reduced, transitionState, showPreloader, currentNarration]);

  const headerReleased = phase === "header" || phase === "open";
  const { overrideMode, derivedIsCompact, isImmersiveDark, autohideEnabled } = useNavbar();
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);
  const scrollAccumulator = useRef(0);

  useEffect(() => {
    if (!autohideEnabled) {
      setNavHidden(false);
      return;
    }

    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      if (currentY < 80) {
        setNavHidden(false);
        scrollAccumulator.current = 0;
      } else if (diff > 8) {
        setNavHidden(true);
        scrollAccumulator.current = 0;
      } else if (diff < -10) {
        scrollAccumulator.current += diff;
        if (scrollAccumulator.current < -25 || currentY < 120) {
          setNavHidden(false);
        }
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [autohideEnabled]);

  const isMinimal = overrideMode === "minimal";
  const isLiquid = overrideMode === "liquid";
  const isNotch = overrideMode === "notch";
  const isImmersive = overrideMode === "immersive";
  const pointerFine = usePointerFine();
  const { insetX: liquidInsetX, insetY: liquidInsetY, setInset: setLiquidInset, reset: resetLiquidSpacing } = useLiquidSpacing();
  const footerAnchorRef = useNavbarAnchor("site-footer", { dark: true });

  useEffect(() => {
    // Eases the spacing back to zero whenever the user leaves Liquid Mode
    // (the dragged inset otherwise persists across mode toggles and route
    // changes, since AppShellInner never unmounts).
    if (!isLiquid) resetLiquidSpacing(reduced !== true);
  }, [isLiquid, reduced, resetLiquidSpacing]);


  return (
    <EntrancePhaseContext.Provider value={phase}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
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
            background: "transparent",
            borderBottom: "none",
            pt: isNotch ? 0 : 1,
            pointerEvents: showPreloader ? "none" : "none",
            transform: navHidden || showPreloader ? "translateY(-120%)" : "translateY(0%)",
            opacity: showPreloader ? 0 : 1,
            transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease",
          }}
        >
          <Container maxWidth={isMinimal ? false : "xl"} sx={{ display: "flex", justifyContent: "center", pointerEvents: 'none', px: isMinimal ? { xs: 3, md: 6, lg: 8 } : undefined }}>
            <Toolbar
              disableGutters
              sx={{
                position: "relative",
                width: isLiquid ? `calc(100% - ${liquidInsetX * 2}px)` : (isNotch ? "fit-content" : "100%"),
                maxWidth: isNotch ? "100%" : (derivedIsCompact ? "1200px" : "100%"),
                mt: isLiquid ? `${liquidInsetY}px` : 0,
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
                bgcolor: isNotch
                  ? NOIR.navyField
                  : isImmersiveDark
                    ? `rgba(${NOIR.navyFieldRgb}, 0.28)`
                    : (derivedIsCompact ? "#FFFFFF" : "transparent"),
                backdropFilter: isImmersiveDark ? "blur(16px) saturate(140%)" : "none",
                border: isMinimal || isNotch ? "none" : "1px solid",
                borderColor: isMinimal || isNotch
                  ? "transparent"
                  : isImmersiveDark
                    ? "rgba(255,255,255,0.14)"
                    : (derivedIsCompact ? "divider" : "transparent"),
                borderRadius: isNotch
                  ? "0px 0px 24px 24px"
                  : isImmersive
                    ? "28px"
                    : (derivedIsCompact ? "100px" : "0px"),
                padding: isNotch
                  ? "4px 20px"
                  : isImmersive
                    ? "10px 24px"
                    : (derivedIsCompact ? "2px 32px" : "8px 0px"),
                boxShadow: isNotch
                  ? "0 8px 24px rgba(10,42,102,0.35)"
                  : isImmersiveDark
                    ? "0 8px 32px rgba(0,0,0,0.25)"
                    : (derivedIsCompact ? "0 4px 24px rgba(0,0,0,0.04)" : "none"),
                display: "flex",
                justifyContent: isNotch ? "center" : "space-between",
                alignItems: "center",
                gap: isNotch ? 2.5 : 4,
                mx: "auto",
              }}
            >
              {isLiquid && pointerFine ? (
                <LiquidNavHandle insetX={liquidInsetX} insetY={liquidInsetY} onChange={setLiquidInset} />
              ) : null}
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
                <Box sx={{ color: isNotch || isImmersiveDark ? "#FFFFFF" : (derivedIsCompact ? "text.primary" : "primary.main"), display: 'flex' }}>
                  <PhitopolisLogo
                    style={{ height: 42, width: 'auto' }}
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
                      sx={{ color: isNotch || isImmersiveDark ? "#FFFFFF" : "primary.main", fontWeight: 800, fontSize: "1.4rem", letterSpacing: "0.08em", lineHeight: 1.1, transition: "color 0.4s ease" }}
                    >
                      PH<Box component="span" sx={{ color: NOIR.gold }}>IT</Box>OPOLIS
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: MONO,
                        fontSize: "0.58rem",
                        letterSpacing: "0.12em",
                        color: isNotch || isImmersiveDark ? "rgba(255,255,255,0.7)" : "text.secondary",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        opacity: 0.85,
                      }}
                    >
                      MAKING TOMORROW'S TECHNOLOGY AVAILABLE TODAY
                    </Typography>
                  </Stack>
                </motion.div>
              </RouterLink>

              {/* Rightmost Controls: Contact + 3-Bar Menu Icon with Hover Dropdown & Click Mega Drawer */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <AnimatedContactButton
                  label="Contact"
                  isActive={onContactPage}
                  variant={isNotch || isImmersiveDark ? "onDark" : "default"}
                  sx={{
                    display: { xs: "none", md: "inline-flex" },
                    opacity: 1,
                    height: "42px",
                  }}
                />

                {/* Desktop 3-Bar Menu Button */}
                <AnimatedMenuButton
                  active={megaNavOpen}
                  onClick={() => setMegaNavOpen(!megaNavOpen)}
                  isNotch={isNotch}
                  isImmersiveDark={isImmersiveDark}
                  ariaLabel="Open navigation menu"
                  sx={{ display: { xs: "none", md: "inline-flex" } }}
                />

                {/* Mobile 3-Bar Menu Button */}
                <AnimatedMenuButton
                  active={mobileNavOpen}
                  onClick={() => setMobileNavOpen(true)}
                  isNotch={isNotch}
                  isImmersiveDark={isImmersiveDark}
                  ariaLabel="Open mobile navigation menu"
                  sx={{ display: { xs: "inline-flex", md: "none" } }}
                />
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

        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>



        {/* Next Chapter Continuous Scroll Banner */}
        <Box
          sx={{
            bgcolor: NOIR.navyField,
            color: "#FFFFFF",
            py: 3,
            px: 2,
            textAlign: "center",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            position: "relative",
            overflow: "hidden",
            minHeight: "56px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Scroll Pressure Progress Line */}
          {scrollPressure > 0 && (
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                height: "4px",
                bgcolor: NOIR.gold,
                width: `${scrollPressure}%`,
                transition: "width 0.08s ease-out",
              }}
            />
          )}

          <AnimatePresence mode="wait">
            {(transitionState === "triggered" || transitionState === "closing" || transitionState === "loading") ? (
              <motion.div
                key="now-transitioning"
                initial={{ y: -15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 15, opacity: 0 }}
                transition={{ duration: 0.65, ease: "easeOut" }}
              >
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: "1.05rem",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "#FFFFFF",
                    fontWeight: 700,
                  }}
                >
                  Now transitioning to {currentNarration.label}
                </Typography>
              </motion.div>
            ) : (
              <motion.div
                key="scroll-cue"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.72rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: NOIR.gold,
                    fontWeight: 600,
                    mb: scrollPressure > 0 ? 0.8 : 0,
                    transition: "margin 0.2s ease",
                  }}
                >
                  [ SCROLL CONTINUOUSLY TO ENTER NEXT CHAPTER: {currentNarration.label} ↓ ]
                </Typography>
                {scrollPressure > 0 && (
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: "0.62rem",
                      letterSpacing: "0.1em",
                      color: "rgba(255,255,255,0.6)",
                      textTransform: "uppercase",
                    }}
                  >
                    Transition Pressure: {scrollPressure}%
                  </Typography>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        <Box
          component="footer"
          ref={footerAnchorRef}
          sx={{ bgcolor: "primary.main", borderTop: 1, borderColor: "primary.light", color: "white", pt: { xs: 8, md: 12 }, pb: { xs: 4, md: 6 }, mt: "auto", position: 'relative' }}
        >
          <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: 'column', minHeight: '50vh', justifyContent: 'space-between' }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={{ xs: 8, md: 4 }}>
              
              {/* Left Column: Logo & Socials */}
              <Box sx={{ maxWidth: 300 }}>
                <Stack spacing={3}>
                  <Box>
                    <PhitopolisLogo
                      style={{ height: 48, width: 'auto' }}
                      color="#FFFFFF"
                      accentColor={NOIR.gold}
                    />
                    <Typography variant="h5" sx={{ fontFamily: FONT, fontWeight: 700, mt: 2, textTransform: 'uppercase', color: 'white' }}>
                      Phitopolis
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                    Making tomorrow's technology available today.
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <IconButton component="a" href="#" sx={{ color: "white", "&:hover": { color: "secondary.main" } }}>
                      <GitHubIcon fontSize="small" />
                    </IconButton>
                    <IconButton component="a" href="#" sx={{ color: "white", "&:hover": { color: "secondary.main" } }}>
                      <LinkedInIcon fontSize="small" />
                    </IconButton>
                    <IconButton component="a" href="#" sx={{ color: "white", "&:hover": { color: "secondary.main" } }}>
                      <TwitterIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>

              {/* Right Columns container */}
              <Box sx={{ flexGrow: 1, maxWidth: { md: "60%" } }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 6, sm: 12 }} justifyContent={{ md: "flex-end" }}>
                  
                  {/* Company Column */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ color: "secondary.main", fontWeight: 700, mb: 3 }}>
                      Company
                    </Typography>
                    <Stack spacing={2}>
                      {[
                        { label: 'About Us', to: '/about' },
                        { label: 'Careers', to: '/services', badge: "We're hiring" },
                        { label: 'Contact', to: '/contact' },
                      ].map(({ label, to, badge }) => (
                        <Box key={to} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <RouterLink 
                            to={to} 
                            variant="body2" 
                            sx={{ 
                              color: "rgba(255,255,255,0.8)", 
                              textDecoration: "none", 
                              display: "flex", 
                              alignItems: "center", 
                              gap: 1,
                              "&:hover": { color: "secondary.main" },
                              "&:hover .arrow-icon": { opacity: 1, transform: "translateX(0)" }
                            }}
                          >
                            {label}
                            {badge && (
                              <Box component="span" sx={{ px: 1, py: 0.5, borderRadius: 1, fontSize: "0.6rem", fontWeight: 600, bgcolor: "secondary.main", color: "primary.main", lineHeight: 1 }}>
                                {badge}
                              </Box>
                            )}
                            <ArrowForwardIcon className="arrow-icon" sx={{ fontSize: 14, opacity: 0, transform: "translateX(-4px)", transition: "all 0.2s ease" }} />
                          </RouterLink>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  {/* Contact Column */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ color: "secondary.main", fontWeight: 700, mb: 3 }}>
                      Contact
                    </Typography>
                    <Stack spacing={2} sx={{ color: "rgba(255,255,255,0.8)" }}>
                      <Box component="a" href="mailto:info@phitopolis.com" sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, color: "inherit", textDecoration: "none", "&:hover": { color: "secondary.main" } }}>
                        <MailIcon sx={{ fontSize: 18, color: `rgba(${NOIR.goldRgb},0.7)`, mt: 0.2 }} />
                        <Typography variant="body2">info@phitopolis.com</Typography>
                      </Box>
                      <Box component="a" href="https://maps.google.com/?q=27F+Ecotower+Building,+32nd+St,+Bonifacio+Global+City,+Taguig,+Philippines" target="_blank" rel="noopener noreferrer" sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, color: "inherit", textDecoration: "none", "&:hover": { color: "secondary.main" } }}>
                        <PlaceIcon sx={{ fontSize: 18, color: `rgba(${NOIR.goldRgb},0.7)`, mt: 0.2 }} />
                        <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                          27/F Ecotower Building, 32nd St. cor. 9th Avenue,<br />Bonifacio Global City, Taguig, Philippines, 1634
                        </Typography>
                      </Box>
                    </Stack>
                    
                    <RouterButton
                      to="/contact"
                      variant="outlined"
                      color="secondary"
                      sx={{ mt: 4, borderRadius: 1, textTransform: 'none', borderColor: 'secondary.main', color: 'secondary.main', "&:hover": { bgcolor: 'secondary.main', color: 'primary.main' } }}
                    >
                      Contact us <ArrowForwardIcon sx={{ ml: 1, fontSize: 16 }} />
                    </RouterButton>
                  </Box>
                </Stack>
              </Box>

            </Stack>

            {/* Bottom Row */}
            <Stack 
              direction={{ xs: "column", md: "row" }} 
              justifyContent="space-between" 
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={3}
              sx={{ mt: 8, pt: 4, borderTop: 1, borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
            >
              <Typography variant="caption">
                © 2026 Phitopolis Private Limited. All rights reserved.
              </Typography>
              <Stack direction="row" spacing={4}>
                <Typography component="a" href="/privacy" variant="caption" sx={{ color: "inherit", textDecoration: "none", "&:hover": { color: "white" } }}>
                  Privacy Policy
                </Typography>
                <Typography component="a" href="/terms" variant="caption" sx={{ color: "inherit", textDecoration: "none", "&:hover": { color: "white" } }}>
                  Terms of Service
                </Typography>
              </Stack>
            </Stack>

          </Container>
        </Box>
        <CommandPalette />
        <GrainOverlay />

        {/* Global White Camera-Iris & Full White Loading Screen Overlay */}
        <AnimatePresence>
          {transitionState !== "idle" && (
            <>
              <motion.div
                key="page-iris-transition"
                initial={{ clipPath: "circle(0% at 50% 50%)" }}
                animate={(transitionState === "closing" || transitionState === "loading") ? { clipPath: "circle(150% at 50% 50%)" } : { clipPath: "circle(0% at 50% 50%)" }}
                transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
                onAnimationComplete={() => {
                  if (transitionState === "closing" && transitionTargetRef.current) {
                    const nextRoute = transitionTargetRef.current;
                    void router.navigate({ to: nextRoute }).then(() => {
                      window.scrollTo(0, 0);
                      setTransitionState("loading");
                    });
                  } else if (transitionState === "opening") {
                    setTransitionState("idle");
                    transitionTargetRef.current = null;
                  }
                }}
                style={{
                  position: "fixed",
                  inset: 0,
                  backgroundColor: "#FFFFFF",
                  zIndex: 3000,
                  pointerEvents: "none",
                }}
              />

              {transitionState === "loading" && (
                <TransitionLoadingDisplay
                  targetLabel={currentNarration.label}
                  onComplete={() => setTransitionState("opening")}
                />
              )}
            </>
          )}
        </AnimatePresence>
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
