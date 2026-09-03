import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { CONTENT } from "@/shared/content";
import { NOIR } from "@/shared/theme/palette";
import { PhaseCaption } from "@/shared/components/diagrams/ProcessDiagram";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";
import { sectionOrder } from "@/shared/sections";
import PixelSwap from "@/shared/components/PixelSwap";

import {
  PROCESS_PHOTOS,
  PROCESS_PIN_VH,
  bgOpacityFor,
  pixelSwapStateFor,
  processStageFor,
  segmentFillFor,
  type ProcessPhoto,
  type ProcessStage,
} from "./processPhases";

gsap.registerPlugin(ScrollTrigger);

/** The pixel-dissolve pattern for both year transitions. */
const PATTERN = "spiral" as const;

function Img({ photo }: { photo: ProcessPhoto }) {
  return (
    <Box
      component="img"
      src={photo.src}
      alt=""
      width={photo.width}
      height={photo.height}
      loading="lazy"
      decoding="async"
      sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}

/**
 * "From our practices…" — desktop scrub (Mode A).
 *
 * One pinned ScrollTrigger. A hysteretic 3-stage machine (`processStageFor`)
 * reads the pin's 0..1 progress in `onUpdate` and picks the year; every stage
 * change flips a `PixelSwap` `active` prop, which plays the spiral pixel
 * dissolve to the next photo. **No frame resize** — the only motion is the
 * dissolve and a mini segmented progress bar that tracks `p`. The navy backdrop
 * fades in as the section locks.
 *
 * DOM default / failsafe: renders at the FINAL frame (stage 2, 2026) so a
 * trigger that never fires leaves the settled last state. The three `<h3>` +
 * captions are always in the DOM; the image frame is `aria-hidden`.
 */
export function ProcessScrubStage() {
  const [stage, setStage] = useState<ProcessStage>(2);
  const stageRef = useRef<ProcessStage>(2);
  const stageElRef = useRef<HTMLDivElement>(null);

  const { swap1Active, swap2Active, swap2Visible } = pixelSwapStateFor(stage);
  const phases = CONTENT.process.phases;

  useGSAP(
    () => {
      const stageEl = stageElRef.current;
      if (!stageEl) return;

      const apply = (p: number) => {
        stageEl.style.setProperty("--process-bg-opacity", bgOpacityFor(p).toFixed(3));
        stageEl.style.setProperty("--seg-0", segmentFillFor(p, 0).toFixed(3));
        stageEl.style.setProperty("--seg-1", segmentFillFor(p, 1).toFixed(3));
        stageEl.style.setProperty("--seg-2", segmentFillFor(p, 2).toFixed(3));
        const s = processStageFor(p, stageRef.current);
        if (s !== stageRef.current) {
          stageRef.current = s;
          setStage(s);
        }
      };

      const st = ScrollTrigger.create({
        trigger: stageEl,
        pin: true,
        start: "top top",
        end: () => `+=${String(window.innerHeight * PROCESS_PIN_VH)}`,
        scrub: SCROLL_SPEED,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: refreshPriorityFor(sectionOrder("process")),
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
      });

      // Walk from the settled failsafe frame (stage 2) to the pin-start frame
      // (stage 0). First forward scroll then plays one reverse dissolve —
      // consistent with ClosingLattice's settled fallback.
      apply(0);

      return () => st.kill();
    },
    { scope: stageElRef, dependencies: [] },
  );

  return (
    <Box
      ref={stageElRef}
      className="process-stage"
      sx={{
        position: "relative",
        zIndex: 2,
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: { xs: 1.5, md: 2.5 },
        py: { xs: 4, md: 6 },
        px: { xs: 2, md: 6, lg: 8 },
      }}
    >
      {/* Navy backdrop — fades 0 → 1 as the section locks, then holds. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          bgcolor: NOIR.navyDeep,
          opacity: "var(--process-bg-opacity, 1)",
          willChange: "opacity",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 1320, width: "100%", mx: "auto" }}>
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: "1.35rem", md: "2rem" },
            fontWeight: 800,
            lineHeight: 1.15,
            color: NOIR.frost,
          }}
        >
          From our practices, our business gradually grew into a{" "}
          <Box component="span" sx={{ color: NOIR.gold }}>
            development powerhouse.
          </Box>
        </Typography>
      </Box>

      <Box
        aria-hidden
        sx={{
          position: "relative",
          zIndex: 1,
          width: { xs: "92vw", md: "min(74vw, 1100px)" },
          aspectRatio: "3 / 2",
          maxHeight: "44vh",
          borderRadius: "1rem",
          overflow: "hidden",
          border: "1px solid rgba(255, 199, 44, 0.2)",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.45)",
          bgcolor: NOIR.navyDeep,
          display: "grid",
          "& > *": { gridArea: "1 / 1" },
        }}
      >
        <PixelSwap
          trigger="none"
          pattern={PATTERN}
          pixelSize={44}
          duration={620}
          pixelDuration={380}
          aspectRatio="3 / 2"
          style={{ width: "100%", height: "100%" }}
          active={swap1Active}
          firstContent={<Img photo={PROCESS_PHOTOS[0]!} />}
          secondContent={<Img photo={PROCESS_PHOTOS[1]!} />}
        />
        <PixelSwap
          trigger="none"
          pattern={PATTERN}
          pixelSize={44}
          duration={620}
          pixelDuration={380}
          aspectRatio="3 / 2"
          style={{
            width: "100%",
            height: "100%",
            opacity: swap2Visible ? 1 : 0,
            transition: "opacity 120ms linear",
          }}
          active={swap2Active}
          // Must stay pixel-identical to swap1's secondContent or the
          // `swap2Visible` opacity toggle flashes.
          firstContent={<Img photo={PROCESS_PHOTOS[1]!} />}
          secondContent={<Img photo={PROCESS_PHOTOS[2]!} />}
        />
      </Box>

      {/* Mini segmented progress bar — one sub-bar per year, fills with `p`. */}
      <Box
        aria-hidden
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          gap: 0.75,
          width: { xs: "60vw", md: 260 },
        }}
      >
        {([0, 1, 2] as const).map((i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.14)",
              overflow: "hidden",
              "&::after": {
                content: '""',
                display: "block",
                height: "100%",
                borderRadius: 2,
                bgcolor: NOIR.gold,
                transformOrigin: "left",
                transform: `scaleX(var(--seg-${String(i)}, ${i <= stage ? 1 : 0}))`,
              },
            }}
          />
        ))}
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1320,
          width: "100%",
          mx: "auto",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          columnGap: { md: 5 },
          rowGap: { xs: 1, md: 0 },
        }}
      >
        {phases.map((phase, i) => (
          <PhaseCaption key={phase.id} phase={phase} index={i} dimmed={i !== stage} />
        ))}
      </Box>
    </Box>
  );
}
