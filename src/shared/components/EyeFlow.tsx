import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion, useScroll, useTransform } from "motion/react";

import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { homeSection, useActiveSection } from "@/shared/sections";
import { SCROLL_SPEED, scrollEase } from "@/shared/motion/scrollSpeed";
import { getLenis } from "./SmoothScroll";

const CHAPTER_LABELS = ["ORIGIN", "PRACTICE", "REACH", "PEOPLE"] as const;
const CHAPTER_TARGETS = ["hero", "process", "reach", "candidates"] as const;
const RAIL_HEIGHT = 240;

/** EyeFlow — the landing-page scroll guide. A gold rail on the right edge whose
 *  fill tracks page-scroll progress, a gold indicator that glides down as you
 *  scroll, and the four chapter labels with the active one lit gold. It guides
 *  the eye through the page: where you are, how far you've come, what's next.
 *  Informational / user-driven, so it stays visible under reduced motion (the
 *  fill and indicator follow scroll position, not a timed animation). Desktop
 *  only. Supersedes the earlier ScrollRail. */
export function EyeFlow() {
  const { scrollYProgress } = useScroll();
  const activeChapter = homeSection(useActiveSection()).chapter;
  const indicatorTop = useTransform(scrollYProgress, [0, 1], [0, RAIL_HEIGHT]);

  const handleChapterClick = (chapterIndex: number) => {
    const id = CHAPTER_TARGETS[chapterIndex as number] as string | undefined;
    if (!id) return;
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(`#${id}`, { duration: SCROLL_SPEED, easing: scrollEase });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
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
          gap: 2.5, 
          textAlign: "right",
          pointerEvents: "auto",
        }}
      >
        {CHAPTER_LABELS.map((label, chapter) => (
          <Typography
            key={label}
            onClick={() => handleChapterClick(chapter)}
            sx={{
              fontFamily: MONO,
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              color: chapter === activeChapter ? NOIR.gold : "text.secondary",
              opacity: chapter === activeChapter ? 1 : 0.35,
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
        ))}
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
