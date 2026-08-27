import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import {
  ACT_LABELS,
  CHAPTERS,
  actOfChapter,
  type Act,
  type ChapterIndex,
} from "@/shared/sections";
import { SCROLL_SPEED, scrollEase } from "@/shared/motion/scrollSpeed";
import { heroTotalHeight } from "@/shared/motion/heroPin";
import { useReducedMotion } from "@/shared/motion";
import { getLenis } from "./smoothScrollControls";
import { useNavbar } from "./navbarHooks";

gsap.registerPlugin(ScrollTrigger);

const RAIL_HEIGHT = 300;

/** Resize work is debounced by this much before the five section anchors are
 *  re-measured — matches `HeroCanvas.tsx`'s own resize debounce. */
const RESIZE_DEBOUNCE_MS = 150;

const ACT_GROUPS: readonly { act: Act; chapters: readonly (typeof CHAPTERS)[number][] }[] = (
  Object.keys(ACT_LABELS) as Act[]
)
  .map((act) => ({ act, chapters: CHAPTERS.filter((c) => c.act === act) }))
  .filter((group) => group.chapters.length > 0);

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
  const activeAct = actOfChapter(activeChapter);
  const indicatorTop = useTransform(normalizedProgress, [0, 1], [0, RAIL_HEIGHT]);
  const reduced = useReducedMotion();

  /**
   * Chapter/progress tracking — cached offsets, not per-frame layout.
   *
   * The section anchors (`use-cases`, `reach`, `closing`) only need their
   * *document-relative* Y offset. `window.scrollY + rect.top` is
   * scroll-position-invariant — the two terms cancel — so that number only
   * changes when the layout above the anchor changes: a resize, a pin's
   * spacer being sized, lazy content mounting. It never changes just because
   * the reader scrolled. The previous version re-read all five
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
   * `daily-life`/`candidates`/`blog` anchors were removed here when those
   * sections relocated to /about (PRD-home-client-focus §US-2) — `closing`
   * (the operational-footprint beat) is now home's final chapter instead.
   */
  useEffect(() => {
    let limit = 0;
    let offsets: number[] = new Array(9).fill(0);

    const measure = () => {
      const winH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      limit = docH - winH;

      const heroHeight = heroTotalHeight(winH);

      const useCasesEl = document.getElementById("use-cases");
      const reachEl = document.getElementById("reach");
      const closingEl = document.getElementById("closing");

      const y_useCases = useCasesEl ? window.scrollY + useCasesEl.getBoundingClientRect().top : heroHeight;
      const y_reach = reachEl ? window.scrollY + reachEl.getBoundingClientRect().top : y_useCases + winH;
      const y_closing = closingEl ? window.scrollY + closingEl.getBoundingClientRect().top : y_reach + winH;

      offsets = [
        0,                        // Ch 0: FLATTEN
        0.20 * heroHeight,        // Ch 1: ALIGN
        0.35 * heroHeight,        // Ch 2: REVEAL
        0.50 * heroHeight,        // Ch 3: DWELL
        0.60 * heroHeight,        // Ch 4: QUANTITATIVE R&D
        y_useCases,               // Ch 5: PRACTICE
        y_reach,                  // Ch 6: REACH
        y_closing,                // Ch 7: HORIZON
        limit,                    // End
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

      const totalChapters = 8;
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
    const winH = window.innerHeight;
    const heroHeight = heroTotalHeight(winH);

    if (index < 5) {
      const targetY = [
        0,
        0.20 * heroHeight,
        0.35 * heroHeight,
        0.50 * heroHeight,
        0.60 * heroHeight,
      ][index]!;

      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(targetY, { duration: SCROLL_SPEED, easing: scrollEase });
        return;
      }
      window.scrollTo({ top: targetY, behavior: "smooth" });
      return;
    }

    const ids = [
      "", "", "", "", "",
      "use-cases",
      "reach",
      "closing",
    ];

    const id = ids[index];
    if (!id) return;

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(`#${id}`, { duration: SCROLL_SPEED, easing: scrollEase });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        right: 24,
        top: "50%",
        transform: "translateY(-50%)",
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
          pointerEvents: "auto",
        }}
      >
        {ACT_GROUPS.map(({ act, chapters }) => {
          const isActiveAct = act === activeAct;
          return (
            <Box key={act} sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              <Typography
                onClick={() => scrollToChapter(chapters[0]?.index ?? 0)}
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.7rem",
                  letterSpacing: "0.24em",
                  color: isActiveAct ? railAccent : railFg,
                  // Inactive state is carried by WEIGHT, not by fading the text
                  // out. `text.secondary` is rgba(10,42,102,0.82); at the old 0.4
                  // opacity its effective alpha was 0.33, which measures ~2.3:1 on
                  // the hero's white ground and fails AA for text this size. 0.82
                  // measures ~5.9:1. The hierarchy still reads, because 800 vs 500
                  // at 0.24em tracking is a bigger visual step than the fade was.
                  opacity: isActiveAct ? 1 : 0.82,
                  fontWeight: isActiveAct ? 800 : 500,
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "color 0.4s ease, opacity 0.4s ease",
                }}
              >
                {ACT_LABELS[act]}
              </Typography>

              <AnimatePresence initial={false}>
                {isActiveAct && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    {chapters.map(({ index, label }) => {
                      const isActiveChapter = index === activeChapter;
                      return (
                        <Typography
                          key={index}
                          onClick={() => scrollToChapter(index)}
                          sx={{
                            fontFamily: MONO,
                            fontSize: "0.6rem",
                            letterSpacing: "0.18em",
                            color: isActiveChapter ? railAccent : railFg,
                            // Same fix as the act label above: weight carries the
                            // state, opacity stays above the AA floor. The old
                            // 0.45/0.2 tiers measured 2.5:1 and 1.4:1.
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
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ position: "relative", width: "2px", height: RAIL_HEIGHT, bgcolor: "divider" }}>
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
