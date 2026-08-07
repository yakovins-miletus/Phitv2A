import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import { gsap } from "gsap";

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
import { getLenis } from "./SmoothScroll";

const RAIL_HEIGHT = 300;

const ACT_GROUPS: readonly { act: Act; chapters: readonly (typeof CHAPTERS)[number][] }[] = (
  Object.keys(ACT_LABELS) as Act[]
).map((act) => ({ act, chapters: CHAPTERS.filter((c) => c.act === act) }));

export function EyeFlow() {
  const normalizedProgress = useMotionValue(0);
  const [activeChapter, setActiveChapter] = useState<ChapterIndex>(0);
  const activeAct = actOfChapter(activeChapter);
  const indicatorTop = useTransform(normalizedProgress, [0, 1], [0, RAIL_HEIGHT]);

  useEffect(() => {
    const updateProgress = () => {
      const docH = document.documentElement.scrollHeight;
      const winH = window.innerHeight;
      const limit = docH - winH;
      if (limit <= 0) return;

      const heroHeight = 19 * winH; // 1900% total pin (1800% anim + 100% overlap)

      const useCasesEl = document.getElementById("use-cases");
      const reachEl = document.getElementById("reach");
      const dailyLifeEl = document.getElementById("daily-life");
      const candidatesEl = document.getElementById("candidates");
      const blogEl = document.getElementById("blog");

      const y_useCases = useCasesEl ? window.scrollY + useCasesEl.getBoundingClientRect().top : heroHeight;
      const y_reach = reachEl ? window.scrollY + reachEl.getBoundingClientRect().top : y_useCases + winH;
      const y_dailyLife = dailyLifeEl ? window.scrollY + dailyLifeEl.getBoundingClientRect().top : y_reach + winH;
      const y_candidates = candidatesEl ? window.scrollY + candidatesEl.getBoundingClientRect().top : y_dailyLife + winH;
      const y_blog = blogEl ? window.scrollY + blogEl.getBoundingClientRect().top : y_candidates + winH;

      const y = Math.max(0, Math.min(window.scrollY, limit));

      const offsets = [
        0,                        // Ch 0: FLATTEN
        0.20 * heroHeight,        // Ch 1: ALIGN
        0.35 * heroHeight,        // Ch 2: REVEAL
        0.50 * heroHeight,        // Ch 3: DWELL
        0.60 * heroHeight,        // Ch 4: QUANTITATIVE R&D
        y_useCases,               // Ch 5: PRACTICE
        y_reach,                  // Ch 6: REACH
        y_dailyLife,              // Ch 7: BEHIND THE CODE
        y_candidates,             // Ch 8: TALENT
        y_blog,                   // Ch 9: SIGNAL
        limit,                    // End
      ];

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

      const totalChapters = 10;
      const segmentProgress = (intervalIdx + localP) / totalChapters;
      normalizedProgress.set(Math.max(0, Math.min(segmentProgress, 1)));
      setActiveChapter(intervalIdx as ChapterIndex);
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    updateProgress();

    gsap.ticker.add(updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      gsap.ticker.remove(updateProgress);
    };
  }, [normalizedProgress]);

  const scrollToChapter = (index: ChapterIndex) => {
    const winH = window.innerHeight;
    const heroHeight = 19 * winH; // 1900% total pin

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
      "daily-life",
      "candidates",
      "blog",
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
                  fontWeight: 800,
                  letterSpacing: "0.24em",
                  color: isActiveAct ? NOIR.gold : "text.secondary",
                  opacity: isActiveAct ? 1 : 0.4,
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
                            color: isActiveChapter ? NOIR.gold : "text.secondary",
                            opacity: isActiveChapter ? 1 : isActiveAct ? 0.45 : 0.2,
                            cursor: "pointer",
                            userSelect: "none",
                            display: "block",
                            transformOrigin: "right center",
                            transition: "color 0.4s ease, opacity 0.4s ease, transform 0.3s ease",
                            "&:hover": {
                              color: NOIR.gold,
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
