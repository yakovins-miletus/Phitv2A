import { useRef } from "react";
import Box from "@mui/material/Box";

import { NAV_ANCHORS, useNavbarAnchor } from "@/shared/components/NavbarContext";
import { useStagePresence } from "@/shared/components/StageSection";

import { RawStage } from "../RawStage";

// Behind The Code - the daily-life film. Plays with native <video controls>;
// no custom player chrome, no ScrollTrigger pin. Scrolls naturally.
export function DailyLifeSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useStagePresence(sectionRef, "daily-life");
  const videoAnchorRef = useNavbarAnchor(NAV_ANCHORS.DAILY_LIFE_VIDEO, { dark: true });

  return (
    // RawStage is transparent by default now: GroundLayer paints `navyDeep` here,
    // one step deeper than the card's `primary.main`, so the film card reads as a
    // lifted surface instead of a same-navy rectangle with a 1px border.
    //
    // id is "daily-life-stage", NOT "daily-life": Phase 6 wraps this component
    // in a `SectionBeat` (`bare`, `order={10}`) whose own root element now
    // carries `id="daily-life"` - the real anchor target (`EyeFlow.tsx`'s
    // `getElementById("daily-life")`, `#daily-life` scroll-to). Keeping the
    // same id here too would have put two elements with the same id in the
    // DOM, which `getElementById` resolves ambiguously.
    // `useStagePresence(sectionRef, "daily-life")` above still uses "daily-life"
    // as the section-id *key* for `setActiveSection` - that's just a string
    // label for the dot rail, unrelated to this DOM id attribute.
    <RawStage id="daily-life-stage" ref={sectionRef}>
      <Box ref={videoAnchorRef} sx={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: "1100px",
          mx: "auto",
          aspectRatio: "16 / 9",
        }}
      >
        <Box
          component="video"
          src="/videos/daily-life.mp4"
          poster="/videos/daily-life-poster.jpg"
          preload="metadata"
          controls
          playsInline
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            borderRadius: "12px",
          }}
        />
      </Box>
    </RawStage>
  );
}
