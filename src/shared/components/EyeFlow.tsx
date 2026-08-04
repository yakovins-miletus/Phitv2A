import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion, useScroll, useTransform } from "motion/react";

import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import {
  ACT_LABELS,
  CHAPTERS,
  actOfChapter,
  chapterTarget,
  homeSection,
  useActiveSection,
  type Act,
} from "@/shared/sections";
import { SCROLL_SPEED, scrollEase } from "@/shared/motion/scrollSpeed";
import { getLenis } from "./SmoothScroll";

const RAIL_HEIGHT = 300;

/** Acts in scroll order, each with its own chapters. Derived from CHAPTERS at
 *  module scope rather than hardcoded: the previous version kept its own
 *  CHAPTER_LABELS and CHAPTER_TARGETS arrays, which is how the rail drifted out
 *  of step with the section registry in the first place. */
const ACT_GROUPS: readonly { act: Act; chapters: readonly (typeof CHAPTERS)[number][] }[] = (
  Object.keys(ACT_LABELS) as Act[]
).map((act) => ({ act, chapters: CHAPTERS.filter((c) => c.act === act) }));

/** EyeFlow — the landing-page scroll guide. A gold rail on the right edge whose
 *  fill tracks page-scroll progress, a gold indicator that glides down as you
 *  scroll, and the page's two acts with their chapters nested beneath. It guides
 *  the eye through the page: which act you are in, where you are inside it, and
 *  what is next. Informational / user-driven, so it stays visible under reduced
 *  motion (the fill and indicator follow scroll position, not a timed
 *  animation). Desktop only. Supersedes the earlier ScrollRail. */
export function EyeFlow() {
  const { scrollYProgress } = useScroll();
  const activeChapter = homeSection(useActiveSection()).chapter;
  const activeAct = actOfChapter(activeChapter);
  const indicatorTop = useTransform(scrollYProgress, [0, 1], [0, RAIL_HEIGHT]);

  const scrollToId = (id: string | undefined) => {
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
              {/* Act heading — the Services/People separation, stated. */}
              <Typography
                onClick={() => scrollToId(chapterTarget(chapters[0]?.index ?? 0))}
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

              {/* Chapters, indented under their act. */}
              {chapters.map(({ index, label }) => {
                const isActiveChapter = index === activeChapter;
                return (
                  <Typography
                    key={index}
                    onClick={() => scrollToId(chapterTarget(index))}
                    sx={{
                      fontFamily: MONO,
                      fontSize: "0.6rem",
                      letterSpacing: "0.18em",
                      // Chapters read as subordinate even when their act is lit,
                      // so the active *chapter* stays unambiguous.
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
            </Box>
          );
        })}
      </Box>
      <Box sx={{ position: "relative", width: "2px", height: RAIL_HEIGHT, bgcolor: "divider" }}>
        {/* Gold fill — grows top→bottom with scroll progress. */}
        <motion.div
          style={{
            scaleY: scrollYProgress,
            transformOrigin: "top",
            position: "absolute",
            inset: 0,
            background: NOIR.gold,
          }}
        />
        {/* Gliding indicator — the "eye" that leads down the page. */}
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
