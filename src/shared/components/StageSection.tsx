import { useRef } from "react";
import type { ReactNode, RefObject } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

import { NOIR } from "@/shared/theme/palette";
import { STAGE_ATTR, setActiveSection } from "@/shared/sections";
import type { SectionDef } from "@/shared/sections";
import { useReducedMotion } from "@/shared/motion";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import {
  STAGE_CHOREO,
  STAGE_LIT, 
  STAGE_LIT_CLIP, 
  STAGE_EXIT, 
  STAGE_ENTER_DURATION, 
  STAGE_HOLD_DURATION, 
  STAGE_EXIT_DURATION, 
  resolveChoreoFrom 
} from "./stageChoreo";

gsap.registerPlugin(ScrollTrigger);

/** Reports a section as active while it occupies the viewport middle.
 *  Headless — used by StageSection and by sections that keep their own
 *  layout (hero, pinned use-cases). Runs under reduced motion too: the dot
 *  rail is informational and must keep tracking. */
export function useStagePresence(ref: RefObject<HTMLElement | null>, id: string): void {
  useGSAP(
    () => {
      if (!ref.current) return;
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top 50%",
        end: "bottom 50%",
        onToggle: (self) => {
          if (self.isActive) setActiveSection(id);
        },
      });
    },
    { scope: ref, dependencies: [id] },
  );
}

/** Numbered kicker with a hairline that draws in as the stage reaches
 *  center stage (the `.stage-kicker-line` scaleX tween in StageSection). */
export function StageKicker({ index, label }: { index?: string; label: string }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography variant="overline" color="primary">
        {label}
      </Typography>
      <Box
        className="stage-kicker-line"
        sx={{
          height: "1px",
          flexGrow: 1,
          maxWidth: 220,
          background: NOIR.hairline,
          transformOrigin: "left center",
        }}
      />
    </Stack>
  );
}

interface StageSectionProps {
  section: SectionDef;
  /** Paper band with hairline borders — used to alternate page rhythm. */
  muted?: boolean;
  children: ReactNode;
}

/** Full-viewport "stage" for a home-page section: snap target (via
 *  STAGE_ATTR), anchor id, and spotlight scrub — content rises and brightens
 *  into center stage, holds fully lit, then dims as it exits. Content is
 *  visible by default; all tweens are from-side only so reduced motion and
 *  no-JS render the final state. */
export function StageSection({ section, muted = false, children }: StageSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useStagePresence(ref, section.id);

  useGSAP(
    () => {
      if (reduced === true || !ref.current) return;
      const inner = ref.current.querySelector(".stage-inner");
      if (!inner) return;

      // Variant-driven entrance; exit is shared so the recede stays coherent.
      const variant = section.choreo ?? "rise";
      const isNarrow = window.matchMedia("(max-width: 599.95px)").matches;
      const from = resolveChoreoFrom(variant, isNarrow);
      gsap.set(inner, { transformOrigin: STAGE_CHOREO[variant].transformOrigin });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: SCROLL_SPEED,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(inner, from, {
        ...STAGE_LIT,
        // Only clip-carrying variants ever touch clip-path (see stageChoreo).
        ...(from.clipPath !== undefined ? { clipPath: STAGE_LIT_CLIP } : {}),
        ease: "none",
        duration: STAGE_ENTER_DURATION,
      })
        .to({}, { duration: STAGE_HOLD_DURATION }) // hold fully lit at center
        .to(inner, { ...STAGE_EXIT, ease: "none", duration: STAGE_EXIT_DURATION });

      const line = ref.current.querySelector(".stage-kicker-line");
      if (line) {
        tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 0.1 }, 0.16);
      }
    },
    { scope: ref, dependencies: [reduced, section.choreo] },
  );

  return (
    <Box
      component="section"
      ref={ref}
      id={section.id}
      {...{ [STAGE_ATTR]: "" }}
      sx={{
        // minHeight (not height) so tall stages (Careers, Blog) still grow;
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        py: { xs: 6, md: 10 },
        bgcolor: muted ? "background.paper" : "transparent",
        borderTop: muted ? 1 : 0,
        borderBottom: muted ? 1 : 0,
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", height: "100%" }}>
        <div className="stage-inner" style={{ position: "relative", zIndex: 1 }}>
          <Stack spacing={4}>
            {section.kicker ? <StageKicker index={section.kicker} label={section.label} /> : null}
            {children}
          </Stack>
        </div>
      </Container>
    </Box>
  );
}
