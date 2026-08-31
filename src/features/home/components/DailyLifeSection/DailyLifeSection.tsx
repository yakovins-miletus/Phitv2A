import { useRef } from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { useNavbarAnchor } from "@/shared/components/navbarHooks";
import { useStagePresence } from "@/shared/components/stage/stagePresence";
import { useReducedMotion } from "@/shared/motion";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";
import { sectionOrder } from "@/shared/sections";

import {
  DAILY_LIFE_PIN_VH,
  EXPAND_END,
  START_RADIUS_PX,
  START_SHIFT_PCT,
  START_WIDTH_VW,
} from "./dailyLifePhases";

gsap.registerPlugin(ScrollTrigger);

/**
 * Behind The Code — the daily-life culture film, presented Lusion-style: the
 * video sits inset on the left, and as the section is pinned it scales up to a
 * full-bleed frame, holds fullscreen for a scroll buffer, then releases into the
 * next section.
 *
 * Three render modes (mirrors `ClosingLatticeSection`):
 *   A. Desktop scrub  (md+, not reduced) — one pinned ScrollTrigger drives a
 *      scrubbed width/xPercent tween on the card. `daily-life` declares
 *      `ownsPin: true` in `ABOUT_SECTIONS`, so `SectionBeat` renders this in the
 *      un-transformed `.beat-bare-content` sibling and the pin geometry here is
 *      never a descendant of anything `SectionBeat` transforms.
 *   B. Mobile static  (down("md"), not reduced) — plain full-width video, no
 *      ScrollTrigger.
 *   C. Reduced motion — same static full-width video, no ScrollTrigger.
 *
 * GroundLayer paints `navyDeep` behind this stage (one step deeper than the
 * card), so the film reads as a lifted surface rather than a same-navy rectangle.
 * DOM default is the settled state: the card renders visible and usably sized
 * even if the trigger never fires.
 */
export function DailyLifeSection() {
  const containerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const theme = useTheme();
  const reduced = useReducedMotion();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const staticLayout = reduced === true || isMobile;

  useStagePresence(containerRef, "daily-life");
  const videoAnchorRef = useNavbarAnchor(NAV_ANCHORS.DAILY_LIFE_VIDEO, { dark: true });

  useGSAP(
    () => {
      const container = containerRef.current;
      const card = cardRef.current;
      if (staticLayout || !container || !card) return;

      // Muted autoplay loop — the reel plays itself as it expands; `controls`
      // stays on the element so the viewer can unmute / scrub once it is
      // fullscreen. Rejected play (autoplay policy) is a non-event: the poster
      // shows until the user hits play.
      const playing = videoRef.current?.play();
      if (playing && typeof playing.catch === "function") playing.catch(() => {});

      // `gsap.set` the inset-left start, then `.to` the full-bleed end — never
      // `.from()` on a scrubbed timeline (it renders not-yet-started tweens at
      // their natural state, flashing the final frame first).
      gsap.set(card, {
        width: `${String(START_WIDTH_VW)}vw`,
        xPercent: START_SHIFT_PCT,
        borderRadius: `${String(START_RADIUS_PX)}px`,
      });

      // Full-span no-op spacer forces total duration 1, so every tween position
      // == the pin's scrub progress `p`.
      const tl = gsap.timeline();
      tl.to(container, { duration: 1 }, 0);
      tl.to(
        card,
        {
          width: "100vw",
          xPercent: 0,
          borderRadius: "0px",
          ease: "none",
          duration: EXPAND_END,
        },
        0,
      );
      // Dwell buffer — held fullscreen for the rest of the pin before release.
      tl.to({}, { duration: 1 - EXPAND_END });

      const scrollTrigger = ScrollTrigger.create({
        trigger: container,
        pin: true,
        start: "top top",
        end: () => `+=${String(window.innerHeight * DAILY_LIFE_PIN_VH)}`,
        scrub: SCROLL_SPEED,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: refreshPriorityFor(sectionOrder("daily-life")),
        animation: tl,
      });

      return () => {
        scrollTrigger.kill();
        tl.kill();
      };
    },
    { scope: containerRef, dependencies: [reduced, isMobile] },
  );

  return (
    // id is "daily-life-stage", NOT "daily-life": SectionBeat's own root element
    // carries `id="daily-life"` (the real anchor / scroll-to target). Two
    // elements with the same id resolve ambiguously under `getElementById`.
    // `useStagePresence(containerRef, "daily-life")` above still keys the dot
    // rail on the "daily-life" string — unrelated to this DOM id.
    <Box
      component="section"
      ref={containerRef}
      id="daily-life-stage"
      sx={{
        position: "relative",
        width: "100%",
        height: staticLayout ? "auto" : "100vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: staticLayout ? { xs: 8, md: 12 } : 0,
      }}
    >
      <Box ref={videoAnchorRef} sx={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <Box
        ref={cardRef}
        sx={{
          position: "relative",
          // DOM default / static modes: readable inset card. Desktop scrub
          // overwrites `width` + `xPercent` via GSAP.
          width: { xs: "100%", md: `${String(START_WIDTH_VW)}vw` },
          aspectRatio: "16 / 9",
          borderRadius: staticLayout ? "12px" : `${String(START_RADIUS_PX)}px`,
          overflow: "hidden",
          willChange: staticLayout ? undefined : "width, transform",
        }}
      >
        <Box
          component="video"
          ref={videoRef}
          src="/videos/daily-life.mp4"
          poster="/videos/daily-life-poster.jpg"
          preload="metadata"
          autoPlay
          muted
          loop
          controls
          playsInline
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </Box>
    </Box>
  );
}
