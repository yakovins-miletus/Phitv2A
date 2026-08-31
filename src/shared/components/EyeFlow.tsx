import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion, useMotionValue, useTransform } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { CHAPTERS, type ChapterIndex } from "@/shared/sections";
import { SCROLL_SPEED, scrollEase } from "@/shared/motion/scrollSpeed";
import { heroTotalHeight } from "@/shared/motion/heroPin";
import { useReducedMotion, useHeroCascadeStep } from "@/shared/motion";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";
import { getLenis } from "./smoothScrollControls";
import { useNavbar } from "./navbarHooks";

gsap.registerPlugin(ScrollTrigger);

const RAIL_HEIGHT = 300;

/** Horizontal space the fixed chapter rail occupies at the right edge (`lg`+):
 *  `right: 24` + the ~150px label column + the `gap: 2` (16px) + the 2px rail,
 *  rounded up. Full-bleed sections (`maxWidth` >= 1400) must add this as extra
 *  right padding at `lg` and up so body copy never runs under the rail — see
 *  GlobalMarketsStatement / OperatingPillars. Narrower sections (`maxWidth`
 *  1100, the default) clear it already and must NOT add it. */
export const EYEFLOW_RAIL_GUTTER = 200;

/** Resize work is debounced by this much before the section anchors are
 *  re-measured — matches `HeroCanvas.tsx`'s own resize debounce. */
const RESIZE_DEBOUNCE_MS = 150;

export function EyeFlow() {
  /**
   * The rail is `position: fixed` at document level, so it is never *inside* a
   * `data-ground` section and `var(--text-*)` would always resolve to the light
   * set — navy labels on the navy Intelligence Feed, which is where they went
   * missing. It rides the same `isOverDarkSection` flag the navbar already
   * maintains for exactly this reason.
   */
  const { isOverDarkSection } = useNavbar();
  const railFg = isOverDarkSection ? "rgba(255, 255, 255, 0.82)" : "text.secondary";
  // The accent DOES have to follow the ground here, unlike a fill or a border.
  // These are 11px mono labels: gold measures 1.45:1 on the hero's light ground,
  // so making the ACTIVE chapter gold made the one row a reader most needs to
  // read the only row they cannot. Inactive rows were already legible (navy at
  // 0.82, ~5.9:1), which left the rail reading backwards.
  //
  // On dark grounds gold clears comfortably and stays. On light the active row
  // takes the navy ink; weight (800 against 500) plus the moving indicator
  // already carry the state, so nothing is lost by not colouring it.
  const railAccent = isOverDarkSection ? NOIR.gold : NOIR.navyField;
  const normalizedProgress = useMotionValue(0);
  const [activeChapter, setActiveChapter] = useState<ChapterIndex>(0);
  const indicatorTop = useTransform(normalizedProgress, [0, 1], [0, RAIL_HEIGHT]);
  const reduced = useReducedMotion();
  // Step 4 of the post-intro hero cascade. On a warm/repeat visit this is
  // already 5 — the rail keeps its long-standing always-on behaviour,
  // unchanged. See `useHeroCascadeStep`'s docblock.
  const heroStep = useHeroCascadeStep();

  /**
   * Chapter/progress tracking — cached offsets, not per-frame layout.
   *
   * The section anchors (`hero-mission`, `hero-pillars`, `use-cases`,
   * `reach`, `closing`) only need their
   * *document-relative* Y offset. `window.scrollY + rect.top` is
   * scroll-position-invariant — the two terms cancel — so that number only
   * changes when the layout above the anchor changes: a resize, a pin's
   * spacer being sized, lazy content mounting. It never changes just because
   * the reader scrolled. The previous version re-read all those
   * `getBoundingClientRect()`s (plus `scrollHeight`) inside `gsap.ticker`,
   * i.e. a forced synchronous layout on every single frame, permanently, on
   * the home route.
   *
   * `measure()` now does that work only when something could have moved the
   * anchors: once at mount, on `ScrollTrigger.refresh` (fires once GSAP has
   * finished building every pin and inserting its spacers — the only point at
   * which offsets downstream of a pin are final), and on a debounced
   * `resize`. The per-frame `updateProgress` reads only `window.scrollY` (no
   * layout) and does arithmetic against the cached `offsets`.
   *
   * Chapter 0 (ORIGIN) starts at y=0; the other five chapter starts are the
   * document offsets of `hero-mission`, `hero-pillars`, `use-cases`, `reach`
   * and `closing` — the first section declared in each chapter — with a
   * viewport-height fallback chain if an anchor has not mounted yet.
   *
   * `daily-life`/`candidates`/`blog` anchors were removed here when those
   * sections relocated to /about (PRD-home-client-focus §US-2) — `closing`
   * (the operational-footprint beat) is now home's final chapter instead.
   */
  useEffect(() => {
    let limit = 0;
    let offsets: number[] = new Array(7).fill(0);

    const measure = () => {
      const winH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      limit = docH - winH;

      const missionEl = document.getElementById("hero-mission");
      const pillarsEl = document.getElementById("hero-pillars");
      const useCasesEl = document.getElementById("use-cases");
      const reachEl = document.getElementById("reach");
      const closingEl = document.getElementById("closing");

      const heroHeight = heroTotalHeight(winH);
      const y_mission = missionEl ? window.scrollY + missionEl.getBoundingClientRect().top : 0.60 * heroHeight;
      const y_pillars = pillarsEl ? window.scrollY + pillarsEl.getBoundingClientRect().top : y_mission + winH;
      const y_useCases = useCasesEl ? window.scrollY + useCasesEl.getBoundingClientRect().top : y_pillars + winH;
      const y_reach = reachEl ? window.scrollY + reachEl.getBoundingClientRect().top : y_useCases + winH;
      const y_closing = closingEl ? window.scrollY + closingEl.getBoundingClientRect().top : y_reach + winH;

      offsets = [
        0,             // Ch 0: ORIGIN
        y_mission,     // Ch 1: THESIS
        y_pillars,     // Ch 2: DISCIPLINES
        y_useCases,    // Ch 3: PROOF
        y_reach,       // Ch 4: REACH
        y_closing,     // Ch 5: HORIZON
        limit,         // End
      ];
    };

    const updateProgress = () => {
      if (limit <= 0) return;

      const y = Math.max(0, Math.min(window.scrollY, limit));

      let intervalIdx = 0;
      for (let i = 0; i < offsets.length - 1; i++) {
        if (y >= offsets[i]!) {
          intervalIdx = i;
        }
      }

      const yStart = offsets[intervalIdx]!;
      const yEnd = offsets[intervalIdx + 1]!;
      const range = yEnd - yStart;

      let localP = 0;
      if (range > 0) {
        localP = (y - yStart) / range;
      }

      const totalChapters = 6;
      const segmentProgress = (intervalIdx + localP) / totalChapters;
      normalizedProgress.set(Math.max(0, Math.min(segmentProgress, 1)));
      setActiveChapter(intervalIdx as ChapterIndex);
    };

    measure();
    updateProgress();

    // Reduced motion: one static readout at the current scroll position, then
    // no loop and no listeners — mirrors `GroundLayer.tsx`'s degradation
    // ladder ("rung 1: prefers-reduced-motion → static, no loop at all").
    // The continuous per-frame tracking is treated as motion work to drop,
    // not just the visual smoothing on top of it.
    if (reduced === true) {
      return;
    }

    let resizeTimer = 0;
    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        measure();
        updateProgress();
      }, RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener("resize", handleResize, { passive: true });

    const handleRefresh = () => {
      measure();
      updateProgress();
    };
    ScrollTrigger.addEventListener("refresh", handleRefresh);

    // The ticker is the sole per-frame driver — it already rides the same
    // clock Lenis feeds into (see `SmoothScroll.tsx`), so a dedicated
    // `scroll` listener calling this identical function was redundant, not
    // additive.
    gsap.ticker.add(updateProgress);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      ScrollTrigger.removeEventListener("refresh", handleRefresh);
      gsap.ticker.remove(updateProgress);
    };
  }, [normalizedProgress, reduced]);

  const scrollToChapter = (index: ChapterIndex) => {
    // Chapter 0 (ORIGIN) is the top of the page — the hero choreography has no
    // anchor of its own. Chapters 1–5 each target the id of the first section
    // declared in them.
    const targets = ["", "hero-mission", "hero-pillars", "use-cases", "reach", "closing"];

    const lenis = getLenis();

    if (index === 0) {
      if (lenis) {
        lenis.scrollTo(0, { duration: SCROLL_SPEED, easing: scrollEase });
        return;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const id = targets[index];
    if (!id) return;

    if (lenis) {
      lenis.scrollTo(`#${id}`, { duration: SCROLL_SPEED, easing: scrollEase });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Box
      component="nav"
      aria-label="Chapter navigation"
      sx={{
        position: "fixed",
        right: 24,
        top: "50%",
        // Step 4 of the post-intro hero cascade — drops in from above,
        // composed with the existing vertical-centring transform rather than
        // replacing it: the offset is added inside the same translateY, so
        // centring is never clobbered mid-entrance. Had no entrance at all
        // before this; on a warm/repeat visit `heroStep` is already 5, so
        // this resolves to the plain `translateY(-50%)` centring instantly.
        opacity: heroStep >= 4 ? 1 : 0,
        transform: heroStep >= 4 ? "translateY(-50%)" : "translateY(calc(-50% - 24px))",
        transition: `opacity 0.6s ${EASE_OUT_EXPO_CSS}, transform 0.7s ${EASE_OUT_EXPO_CSS}`,
        display: { xs: "none", lg: "flex" },
        alignItems: "center",
        gap: 2,
        zIndex: (theme) => theme.zIndex.appBar - 1,
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          textAlign: "right",
          // Gated alongside the entrance above — an invisible rail should
          // never be clickable, the same rule the hero's own button cluster
          // follows (`SuperHeroSequence.tsx`'s `.hero-directory`).
          pointerEvents: heroStep >= 4 ? "auto" : "none",
        }}
      >
        {/* Flat list — six chapters, one act. The act header is gone: a
            one-act page's group label only restated "SERVICES" above the one
            group it had. Six rows are few enough to show all at once, so the
            old AnimatePresence collapse of the inactive group is gone too. */}
        {CHAPTERS.map(({ index, label }) => {
          const isActiveChapter = index === activeChapter;
          return (
            <Typography
              key={index}
              component="button"
              type="button"
              aria-current={isActiveChapter ? "true" : undefined}
              onClick={() => scrollToChapter(index)}
              sx={{
                border: 0,
                background: "none",
                padding: 0,
                font: "inherit",
                textAlign: "right",
                fontFamily: MONO,
                fontSize: "0.6rem",
                letterSpacing: "0.18em",
                color: isActiveChapter ? railAccent : railFg,
                // Same fix as before: weight carries the state, opacity stays
                // above the AA floor. The old 0.45/0.2 tiers measured 2.5:1
                // and 1.4:1.
                opacity: isActiveChapter ? 1 : 0.82,
                fontWeight: isActiveChapter ? 700 : 500,
                cursor: "pointer",
                userSelect: "none",
                display: "block",
                transformOrigin: "right center",
                transition: "color 0.4s ease, opacity 0.4s ease, transform 0.3s ease",
                "&:hover": {
                  color: railAccent,
                  opacity: 1,
                  transform: "translateX(-4px)",
                },
              }}
            >
              {label}
            </Typography>
          );
        })}
      </Box>
      <Box aria-hidden sx={{ position: "relative", width: "2px", height: RAIL_HEIGHT, bgcolor: "divider" }}>
        <motion.div
          style={{
            scaleY: normalizedProgress,
            transformOrigin: "top",
            position: "absolute",
            inset: 0,
            background: NOIR.gold,
          }}
        />
        <motion.div
          style={{
            position: "absolute",
            top: indicatorTop,
            left: "50%",
            x: "-50%",
            y: "-50%",
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: NOIR.gold,
            boxShadow: `0 0 10px 2px ${NOIR.gold}`,
          }}
        />
      </Box>
    </Box>
  );
}
