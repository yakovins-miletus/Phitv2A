import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Drawer from "@mui/material/Drawer";
import { SpecularIconButton as IconButton, SpecularFx } from "@/shared/components/ui/specular";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { SpecularButton as Button } from "@/shared/components/ui/specular";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { EntrancePhaseContext, useReducedMotion } from "@/shared/motion";
import type { EntrancePhase } from "@/shared/motion";
import { MONO, TYPE_SCALE } from "@/shared/theme/theme";
import { motion } from "motion/react";

import { CommandPalette } from "./CommandPalette";
import { CookieNotice } from "./CookieNotice";
import { FloatingIdOverlay } from "./FloatingIdOverlay";

import { NAV_ANCHORS, NavbarProvider, useNavbar, useNavbarAnchor } from "./NavbarContext";
import { Preloader, PRELOADER_SESSION_KEY } from "./Preloader";
import { TransitionCurtainProvider, useTransitionCurtain } from "./TransitionCurtain";
import type { LoadSignal } from "./Preloader";
import { TopNavMegaDrawer } from "./TopNavMegaDrawer";
import { SiteFooter } from "./SiteFooter";
import { RouterButton, RouterLink } from "./RouterLink";
import PhitopolisLogo from "./PhitopolisLogo";

import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO_CSS, EASE_OUT_EXPO } from "@/shared/motion/easing";
import { heroTotalHeight } from "@/shared/motion/heroPin";
import { useNavAutohide } from "./useNavAutohide";

// Held in an untyped variable (not inlined) so the extra `data-lenis-prevent`
// attribute doesn't trip MUI's strict slotProps excess-property check — MUI's
// DrawerPaperSlotPropsOverrides doesn't know about it, but Paper forwards any
// unrecognized prop straight to the DOM element. MUI's Drawer paper is
// overflowY: auto by default (this panel can exceed viewport height), so it
// needs the same lenis exemption as ServiceDrawer/CommandPalette/
// TopNavMegaDrawer for when Lenis is eventually hoisted off the home route.
const MOBILE_NAV_PAPER_SLOT_PROPS = {
  "data-lenis-prevent": true,
  sx: { width: "min(320px, 82vw)", bgcolor: "background.default", p: 3 },
};

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/careers", label: "Careers" },
  { to: "/blog", label: "Blog" },
] as const;

const NARRATION_FLOW: Record<string, { next: string; label: string }> = {
  "/": { next: "/about", label: "ABOUT PHITOPOLIS" },
  "/about": { next: "/services", label: "CAPABILITIES & SERVICES" },
  "/services": { next: "/careers", label: "CAREERS & POSITIONS" },
  "/careers": { next: "/blog", label: "RESEARCH & ARTICLES" },
  "/blog": { next: "/contact", label: "GET IN TOUCH" },
  "/contact": { next: "/", label: "HOME" },
};

/** Gates the full ~5s choreographed intro to a visitor's genuine first load of a
 *  session — Preloader writes PRELOADER_SESSION_KEY to sessionStorage once its exit
 *  finishes (see Preloader.tsx), but nothing previously read it back, so the intro
 *  (and the ~5.4s of opaque, pointer-blocking overlay that comes with it) replayed
 *  on every hard refresh and every hard navigation, not just a visitor's first one.
 *
 *  Called from a useState lazy initializer, which runs during render — `sessionStorage`
 *  access must be guarded here rather than left to bubble, since it throws in Safari
 *  private browsing and some sandboxed/embedded contexts, and an uncaught throw during
 *  a lazy initializer would take the whole render down with it. Failing open (treat the
 *  read as "no key yet" and show the intro) is the safe default: worst case a returning
 *  visitor sees the intro again, which is what today's behavior already is for everyone,
 *  never a broken page. */
function shouldShowPreloader(reduced: boolean): boolean {
  if (reduced) return false;
  try {
    return typeof window !== "undefined" && window.sessionStorage.getItem(PRELOADER_SESSION_KEY) !== "1";
  } catch {
    return true;
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
  { to: "/contact", label: "CONTACT" },
] as const;

/**
 * The assets actually on the home hero's default-render critical path.
 *
 * This used to be `ALL_ASSETS.slice(0, 15)` — the first 15 entries of a
 * filesystem-walk-ordered glob, which is arbitrary: nothing guaranteed a
 * hero-relevant file landed in that slice, and on most builds none did.
 *
 * Traced from `SuperHeroSequence.tsx` (the default, non-toggled hero — mode
 * defaults to "legacy" per `heroModeStore.ts`):
 *   - `HeroCanvas.tsx` (the legacy 2D canvas, mounted whenever the "monolith"
 *     3D toggle is off, which is the default) eagerly fetches exactly one
 *     network image on mount — `/phitopolis_logo_hero.svg`, the P-mark logo
 *     mask (`loadLogoMask(LOGO_SRC)`) — non-blocking for first paint by its
 *     own design (`paintStill()` runs before the fetch even starts), but it
 *     is still the one real eager image request the default hero makes, so
 *     it deserves to win the warmup race rather than lose it to an arbitrary
 *     glob slice.
 *   - The hero's 25-photo drift wall (`HeroImageWall.tsx` / `heroWallTiles.ts`)
 *     is deliberately NOT here. Its own header comment states it is "fetched
 *     at fetchPriority='low' after the hero's LCP" and it does not mount at
 *     all until the reader scrolls ~60% through the pin
 *     (`SuperHeroSequence.tsx`'s `stage.gunshot`/`wallMounted`) — it is
 *     below-the-fold-in-time, not hero-critical-on-load, and forcing it into
 *     the preloader would regress every route's warmup for imagery most
 *     visitors won't reach before the preloader has long since released.
 *   - Monolith-mode-only imagery (`ParallaxHeroBg.tsx`'s `/images/hero-sky-bg.jpg`,
 *     the R3F gallery's textures, the hero background video) is excluded for
 *     the same reason as the drift wall, plus one more: monolith is an
 *     opt-in mode a visitor switches into via the command palette, off by
 *     default, so none of it is on the default page-load path at all. See
 *     the `useBackgroundVideo`/`R3FHeroCanvas` scoping note on
 *     `useWarmupSignals` below.
 *
 * This list is intentionally tiny — the whole point is that hero-critical
 * assets get preloaded in *full*, not capped, so it must stay short enough
 * that "in full" is cheap. It also runs on every route (`useWarmupSignals`
 * is called from `AppShellInner`, not gated to `/`), so anything added here
 * is paid for by every first-time visitor, including ones landing on
 * `/about` or `/blog` who will never see the hero at all.
 */
/**
 * Explicit Section-Based Asset Manifest for Lusion-style Preloader Warmup.
 * Replaces arbitrary glob slicing with intentional tiering:
 *  - Tier 1 (Hero Critical): Logo vector, key hero imagery.
 *  - Tier 2 (Services & Capabilities): Core discipline banners.
 *  - Tier 3 (About & Institutional Foundations): Key above-fold brand assets.
 */
const SECTION_MANIFEST: readonly string[] = [
  "/phitopolis_logo_hero.svg",
  "/images/botHalfHero.webp",
  "/images/topHalfHero.webp",
  "/images/quant-research-banner.webp",
  "/images/software-engineer-banner.webp",
  "/images/ops-support-banner.webp",
  "/images/data-science-banner.webp",
  "/images/AboutPageHero.webp",
  "/images/ecotower-bgc.webp",
  "/images/grads/FocusedProgramming.webp",
  "/images/blog/ateneo-career-talk-2025/01.webp",
  "/images/blog/csr-activity-repainting-community-spaces/01.webp",
];

function preloadAsset(url: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    let doneCalled = false;
    const done = () => {
      if (!doneCalled) {
        doneCalled = true;
        resolve();
      }
    };

    // Safety timeout so no broken or slow asset ever hangs the preloader
    const timer = setTimeout(done, 1200);

    try {
      if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
        if (typeof Image !== "undefined") {
          const img = new Image();
          img.src = url;
          if (typeof img.decode === "function") {
            img.decode()
              .then(() => { clearTimeout(timer); done(); })
              .catch(() => { clearTimeout(timer); done(); });
          } else {
            img.onload = () => { clearTimeout(timer); done(); };
            img.onerror = () => { clearTimeout(timer); done(); };
          }
        } else {
          clearTimeout(timer);
          done();
        }
      } else if (typeof fetch !== "undefined") {
        fetch(url, { cache: 'force-cache' })
          .then(() => { clearTimeout(timer); done(); })
          .catch(() => { clearTimeout(timer); done(); });
      } else {
        clearTimeout(timer);
        done();
      }
    } catch {
      clearTimeout(timer);
      done();
    }
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

    const manifestSignals = SECTION_MANIFEST.map((url) => {
      const filename = url.split('/').pop() || 'ASSET';
      return {
        label: filename.toUpperCase().substring(0, 15),
        promise: preloadAsset(url),
      };
    });

    return [...routeSignals, ...manifestSignals];
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
  sx?: object;
  isActive?: boolean;
  variant?: "default" | "onDark";
}) {
  const [hovered, setHovered] = useState(false);
  // Was `useRouter()` + a bare `router.navigate({ to: "/contact" })` - every
  // other nav trigger (logo, desktop nav items) goes through
  // `navigateWithCurtain`, which is what actually sets `viewTransition: true`,
  // marks `data-route-transition`, and suspends/resumes Lenis around the
  // swap. Going around it here meant clicking Contact fell back to the
  // router's own untransitioned default - the "contact doesn't get the same
  // transition as the other pages" bug.
  const { navigateWithCurtain } = useTransitionCurtain();
  const onDark = variant === "onDark";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigateWithCurtain("/contact");
  };

  const specularColor = (hovered || isActive) ? NOIR.gold : (onDark ? NOIR.white : NOIR.navyField);

  return (
    <Button
      variant="outlined"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
      onClick={handleClick}
      specular={{ lineColor: specularColor }}
      sx={{
        borderRadius: "10px",
        border: "none !important",
        // Gold as a label colour only where it can be read. On the light
        // grounds it measures 1.49:1, so hover and active resolve to the navy
        // ink instead; the specular rim still traces in gold, which is where the
        // accent belongs on this control.
        color: (hovered || isActive)
          ? `${onDark ? NOIR.gold : NOIR.navyField} !important`
          : (onDark ? "rgba(255,255,255,0.9)" : "text.secondary"),
        bgcolor: "transparent !important",
        background: "none !important",
        backgroundImage: "none !important",
        boxShadow: "none !important",
        backdropFilter: "none !important",
        WebkitBackdropFilter: "none !important",
        // `MuiButton`'s "outlined" variant (components.ts) lifts 2px and adds a
        // glow box-shadow on hover/active - this button already overrides the
        // fill/border/shadow above to stay chrome-less, but not `transform`, so
        // it still floated on hover despite every other piece of that variant's
        // hover treatment being cancelled.
        transform: "none !important",
        transition: `all 0.3s ${EASE_OUT_EXPO_CSS}`,
        "&:hover": {
          border: "none !important",
          bgcolor: "transparent !important",
          background: "none !important",
          backgroundImage: "none !important",
          boxShadow: "none !important",
          backdropFilter: "none !important",
          WebkitBackdropFilter: "none !important",
          color: `${onDark ? NOIR.gold : NOIR.navyField} !important`,
          transform: "none !important",
        },
        "&:active": {
          transform: "none !important",
          boxShadow: "none !important",
        },
        ...sx,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap" }}>
        {label}
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

/** 3-Bar Menu Icon Button — same chrome-less treatment as the Contact button:
    no background, no border, no shadow; it just goes gold on hover/active. */
function AnimatedMenuButton({
  active,
  onClick,
  isImmersiveDark,
  ariaLabel,
  sx,
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

  const iconColor = isPrimary
    ? NOIR.gold
    : (isImmersiveDark ? "rgba(255, 255, 255, 0.9)" : NOIR.navyField);

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
        bgcolor: "transparent !important",
        background: "none !important",
        backgroundImage: "none !important",
        color: `${iconColor} !important`,
        boxShadow: "none !important",
        backdropFilter: "none !important",
        WebkitBackdropFilter: "none !important",
        cursor: "pointer",
        // The specular rim is absolutely positioned against this box, same as it
        // is inside SpecularButton.
        position: "relative",
        // No `outline: none` here. This is a real <button> with an onClick, and it
        // renders in the app bar on every route. An `sx` rule is injected after
        // MuiCssBaseline's `*:focus-visible`, so suppressing the outline locally beat
        // the theme's designed focus ring and left the primary nav trigger with no
        // keyboard indicator at all.
        transition: `all 0.3s ${EASE_OUT_EXPO_CSS}`,
        ...sx,
        "&:hover": {
          border: "none !important",
          bgcolor: "transparent !important",
          background: "none !important",
          backgroundImage: "none !important",
          color: `${NOIR.gold} !important`,
          boxShadow: "none !important",
          backdropFilter: "none !important",
          WebkitBackdropFilter: "none !important",
        },
      }}
    >
      <SpecularFx lineColor={isPrimary ? NOIR.gold : (isImmersiveDark ? NOIR.white : NOIR.navyField)} baseOpacity={0} />
      <ThreeBarMenuIcon isHovered={isPrimary} color={iconColor} />
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

  // useReducedMotion() can resolve asynchronously — its type is
  // `boolean | null`, and it is null until the media-query listener has run.
  // The lazy initializers above only see whatever value was available at
  // mount, so a preference that resolves to `true` on a later render would
  // otherwise be missed entirely: showPreloader and phase already committed
  // to their "reduced === true" branch, and useState's lazy initializer never
  // re-runs. A reduced-motion visitor could get the full bounce-timeline
  // preloader and staged entrance regardless of their OS setting.
  //
  // This corrects course the instant the preference resolves. It's a
  // useLayoutEffect (not useEffect) specifically so the correction lands
  // before the browser paints the frame — a reduced-motion user never sees
  // the preloader flash on before it's dismissed, and a non-reduced user sees
  // no change at all (this effect is a no-op for them).
  useLayoutEffect(() => {
    if (reduced !== true) return;
    if (releasedRef.current) return; // already correct — the common case
    releasedRef.current = true;
    hadPreloaderRef.current = false;
    setShowPreloader(false);
    setPhase("open");
  }, [reduced]);
  const entranceTimersRef = useRef<number[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [megaNavOpen, setMegaNavOpen] = useState(false);
  const warmup = useWarmupSignals(showPreloader);
  const { pathname } = useLocation();
  const onContactPage = pathname === "/contact";
  const closeMobileNav = () => {
    setMobileNavOpen(false);
  };

  const releaseEntrance = useCallback(() => {
    if (releasedRef.current) return;
    releasedRef.current = true;
    const timers = entranceTimersRef.current;
    setPhase("hero");
    timers.push(window.setTimeout(() => setPhase("header"), HEADER_AT_MS));
    timers.push(window.setTimeout(() => setPhase("open"), OPEN_AT_MS));
  }, []);

  const handlePreloaderDone = useCallback(() => {
    setShowPreloader(false);
  }, []);

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
  }, [releaseEntrance]);

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
    // TransitionCurtain.tsx owns stopLenis()/startLenis() and refreshScrollTriggers()
    // around every in-app navigation — on both its full curtain-sweep path and its
    // prefers-reduced-motion fast path, which skips the sweep but keeps the same
    // scroll-freeze/refresh sequencing. gsap is loaded on demand there, not eagerly.

    // Trigger staggered entrance animations for the new route
    if (hadPreloaderRef.current && phase === "open") {
      setPhase("hero");
      const timers = entranceTimersRef.current;
      timers.forEach((id) => window.clearTimeout(id));
      timers.length = 0;
      timers.push(window.setTimeout(() => setPhase("header"), HEADER_AT_MS));
      timers.push(window.setTimeout(() => setPhase("open"), OPEN_AT_MS));
    }
  }, [pathname]);


  const headerReleased = phase === "header" || phase === "open";
  const { navigateWithCurtain } = useTransitionCurtain();
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

/** Scroll offset at which non-home routes leave the transparent navbar state.
 *  Small on purpose: those routes have no pinned hero to sit over. */
const NAV_SOLID_AFTER_PX = 50;

  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (pathname === '/') {
        // The navbar stays `minimal` for exactly as long as the pinned hero owns
        // the viewport, and not one screen longer.
        //
        // This read `window.innerHeight * 19`, which was correct only while the
        // hero pin was `+=1900%`. The pin was later shortened to `+=800%` and
        // this literal was not updated, so the navbar stayed minimal for
        // nineteen viewport heights of a ~26-screen page — the scrolled glass
        // treatment was effectively unreachable. Derived from the pin itself
        // now, so it cannot drift again. See shared/motion/heroPin.ts.
        setIsAtTop(window.scrollY < heroTotalHeight(window.innerHeight));
      } else {
        setIsAtTop(window.scrollY < NAV_SOLID_AFTER_PX);
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
        {showPreloader ? (
          <Preloader
            warmup={warmup}
            onStartExit={releaseEntrance}
            onDone={handlePreloaderDone}
          />
        ) : null}
        {/* `inert` while the preloader is up locks focus, pointer interaction, and
            AT visibility for everything it visually covers — skip link, header, both
            nav drawers, page content, footer — for exactly as long as `showPreloader`
            is true. It goes on this wrapper, not on <Preloader> itself: Preloader owns
            no focusable elements, so marking *it* inert would do nothing about the gap
            a runtime audit found — z-index blocks the mouse, but not Tab order, so a
            keyboard user could tab past the opaque overlay and Enter-activate a header
            link hidden behind it, something a mouse user physically cannot do. Scoping
            inert to "everything behind the curtain" instead fixes both input modalities
            with one primitive, and it clears in the same render as the overlay's own
            unmount (both keyed off `showPreloader`), so keyboard access returns exactly
            when the header becomes visible and interactive — never before, never after.
            `display: "contents"` keeps this Box out of the flex layout box model, so
            AppBar/main/footer still participate in the parent flex column exactly as if
            this wrapper weren't here; only the `inert` attribute (which propagates
            through the DOM regardless of the rendering box) does anything. */}
        <Box sx={{ display: "contents" }} inert={showPreloader || undefined}>
        {/* First tab stop on every page. There was no skip link, so a keyboard user
            had to tab through the whole header — logo, six nav items, contact button,
            menu trigger — on every single navigation before reaching content.
            Styling lives in components.ts (.skip-to-content); it is off-screen until
            focused. */}
        <Box component="a" href="#main-content" className="skip-to-content">
          Skip to content
        </Box>
        <TopNavMegaDrawer open={megaNavOpen} onClose={() => setMegaNavOpen(false)} />
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            // Opts the header out of the page-recede/arrive treatment in
            // viewTransitions.css. Without a name of its own it's part of the
            // single `root` snapshot and recedes/scales/wipes with everything
            // else on every navigation; a stable name pulls it into its own
            // view-transition group, which viewTransitions.css then pins
            // static and on top (see the `site-header` rules there) so it
            // reads as chrome that was never part of the transition, not
            // "chrome that happens to sit still."
            viewTransitionName: "site-header",
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
            transition: `transform 0.5s ${EASE_OUT_EXPO_CSS}, opacity 0.5s ease, background-color 0.6s ${EASE_OUT_EXPO_CSS}, border-color 0.6s ${EASE_OUT_EXPO_CSS}, box-shadow 0.6s ${EASE_OUT_EXPO_CSS}`,
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
                bottom: 0,
                zIndex: -1,
                backdropFilter: "blur(12px) saturate(120%)",
                WebkitBackdropFilter: "blur(12px) saturate(120%)",
                bgcolor: isOverDarkSection ? "rgba(30, 30, 30, 0.25)" : "rgba(255, 255, 255, 0.4)",
                transition: `background-color 0.6s ${EASE_OUT_EXPO_CSS}`,
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
                      : (derivedIsCompact ? { xs: "1200px", xl: "1536px" } : "1536px"))),
                pointerEvents: 'auto',
                // width/margin-top are excluded from the transition list while
                // liquid — they're driven by per-pointermove React state and
                // would lag behind the cursor under a CSS transition.
                transition:
                  `background-color 0.6s ${EASE_OUT_EXPO_CSS}, ` +
                  `border-color 0.6s ${EASE_OUT_EXPO_CSS}, ` +
                  `box-shadow 0.6s ${EASE_OUT_EXPO_CSS}, ` +
                  `padding 0.6s ${EASE_OUT_EXPO_CSS}, ` +
                  `max-width 0.6s ${EASE_OUT_EXPO_CSS}, ` +
                  `backdrop-filter 0.6s ${EASE_OUT_EXPO_CSS}, ` +
                  `gap 0.6s ${EASE_OUT_EXPO_CSS}`,
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
                // No CSS `border` here any more — island used to draw a flat
                // 1px rgba(255,255,255,0.4) line, but `borderRadius` below had
                // no `isIsland` case, so that flat line rendered on a 0px-radius
                // (square) box while bgcolor/backdropFilter/boxShadow all styled
                // this as a floating rounded pill. The straight edges clipped
                // squarely across the Contact/menu buttons' own rounded
                // specular rims sitting just inside it, reading as two
                // different, misaligned borders at the same corner. Fixed by
                // giving island its own radius below and replacing the flat
                // line with a `SpecularFx` rim (mounted just below, matching
                // the buttons' own treatment) that traces whatever radius this
                // box actually resolves to, so the two can never disagree again.
                border: "none",
                borderColor: "transparent",
                borderRadius: isStandardOrGlass
                  ? "0px"
                  : (isNotch
                    ? "0px 0px 24px 24px"
                    : isImmersive
                      ? "28px"
                      : (isIsland || derivedIsCompact ? "100px" : "0px")),
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
              {/* The island pill's own edge. Mounted here rather than a CSS
                  `border` so it traces whatever `borderRadius` this box
                  actually resolves to (SpecularFx reads `getComputedStyle`),
                  the same rim treatment the Contact/menu buttons use just
                  inside it — one border system for the whole cluster instead
                  of two disagreeing at the seam. Static (no `autoAnimate`,
                  no pointer-follow) - a full-width nav bar sweeping a
                  highlight on every mouse move would be a bigger motion cue
                  than this chrome should make. */}
              {isIsland && (
                <SpecularFx
                  baseColor={NOIR.white}
                  baseOpacity={1}
                  intensity={0}
                  followMouse={false}
                  speed={0}
                  // `enabled` inside SpecularFx is gated on a fine pointer
                  // unless `autoAnimate` is set - without it this rim would
                  // vanish on touch devices while the pill's bgcolor/blur/
                  // shadow stayed, reintroducing the same "border doesn't
                  // match the rest of the chrome" mismatch this exists to
                  // fix. `intensity={0}` already kills the moving highlight,
                  // so `autoAnimate` here only unlocks the static base stroke
                  // for coarse pointers, not an idle sweep.
                  autoAnimate
                />
              )}
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
                onClick={(e) => {
                  if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    navigateWithCurtain("/");
                  }
                }}
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
                        onClick={(e) => {
                          if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                            e.preventDefault();
                            navigateWithCurtain(item.to);
                          }
                        }}
                        sx={{
                          fontFamily: MONO,
                          fontSize: TYPE_SCALE.caption,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textDecoration: "none !important",
                          // Gold as nav-item TEXT only on dark grounds, where it
                          // measures 9.4:1 to 12:1. On light grounds gold itself is
                          // 1.49:1, well under AA, so active and hover route through
                          // `goldInk` (5.34:1 on panel) instead of navy — the accent
                          // stays on-brand instead of falling back to the primary
                          // colour. The gold underline below still carries the same
                          // signal on both grounds; it's a fill, not text, so it has
                          // no contrast obligation. The wordmark keeps gold on both
                          // grounds: WCAG 1.4.3 exempts logotypes, a nav item is not
                          // exempt.
                          color: isActive
                            ? (onDark ? NOIR.gold : NOIR.goldInk)
                            : (onDark ? "rgba(255,255,255,0.7)" : "text.secondary"),
                          transition: "color 0.3s ease",
                          position: "relative",
                          "&:hover": {
                            color: onDark ? NOIR.gold : NOIR.goldInk,
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
              {/* Minimal mode used to fall through to the "else" branch on every
                  ternary below - the plain, uncompacted MUI Button size/padding
                  and a 36px menu box instead of the tight mono chip glass/island
                  get. Same specular rim component either way, but at a
                  different size and proportion the rim traces a differently
                  shaped box, which is what read as "the border look doesn't
                  match" between minimal and glassmorphism. `isMinimal` joins
                  the other two modes here so all three render this cluster
                  identically; home's own distinct treatment (logo size, no nav
                  items) is untouched — that's decided elsewhere, above. */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <AnimatedContactButton
                  label="Contact"
                  isActive={onContactPage}
                  variant={onDark ? "onDark" : "default"}
                  sx={{
                    display: { xs: "none", md: "inline-flex" },
                    opacity: 1,
                    height: (isStandardOrGlass || isIsland || isMinimal) ? "24px" : "32px",
                    fontSize: (isStandardOrGlass || isIsland || isMinimal) ? "0.72rem" : undefined,
                    fontWeight: (isStandardOrGlass || isIsland || isMinimal) ? 700 : undefined,
                    fontFamily: (isStandardOrGlass || isIsland || isMinimal) ? MONO : undefined,
                    letterSpacing: (isStandardOrGlass || isIsland || isMinimal) ? "0.08em" : undefined,
                    textTransform: (isStandardOrGlass || isIsland || isMinimal) ? "none" : undefined,
                    // Was "2px 0px" - zero horizontal padding, so the specular
                    // rim (traced against this button's own border box) sat
                    // flush against the label glyphs with no breathing room.
                    // A little horizontal room keeps the rim from reading as
                    // "the border is touching the text".
                    padding: (isStandardOrGlass || isIsland || isMinimal) ? "2px 8px" : undefined,
                    minWidth: (isStandardOrGlass || isIsland || isMinimal) ? "auto" : undefined,
                  }}
                />

                {/* Desktop 3-Bar Menu Button */}
                <AnimatedMenuButton
                  active={megaNavOpen}
                  onClick={() => setMegaNavOpen(!megaNavOpen)}
                  isNotch={false}
                  isImmersiveDark={onDark}
                  ariaLabel="Open navigation menu"
                  noBorder={isStandardOrGlass || isIsland || isMinimal}
                  sx={{ display: { xs: "none", md: "inline-flex" }, height: (isStandardOrGlass || isIsland || isMinimal) ? "24px" : "32px", width: (isStandardOrGlass || isIsland || isMinimal) ? "32px" : "36px" }}
                />

                {/* Mobile 3-Bar Menu Button */}
                <AnimatedMenuButton
                  active={mobileNavOpen}
                  onClick={() => setMobileNavOpen(true)}
                  isNotch={false}
                  isImmersiveDark={onDark}
                  ariaLabel="Open mobile navigation menu"
                  noBorder={isStandardOrGlass || isIsland || isMinimal}
                  sx={{ display: { xs: "inline-flex", md: "none" }, height: (isStandardOrGlass || isIsland || isMinimal) ? "24px" : "32px", width: (isStandardOrGlass || isIsland || isMinimal) ? "32px" : "36px" }}
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
          slotProps={{ paper: MOBILE_NAV_PAPER_SLOT_PROPS }}
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
                activeProps={{ sx: { color: "var(--accent-fg)" } }}
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
        <CookieNotice />
        </Box>

      </Box>
    </EntrancePhaseContext.Provider>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TransitionCurtainProvider>
      <NavbarProvider>
        <AppShellInner>{children}</AppShellInner>
      </NavbarProvider>
    </TransitionCurtainProvider>
  );
}
