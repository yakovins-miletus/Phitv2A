import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { motion } from "motion/react";

import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";

/**
 * "Growing into a development powerhouse" - an ascending accumulation, not a
 * pipeline and not a containment vessel.
 *
 * This replaces the ADR-0002 crucible metaphor (many-in / enclosed / one-out),
 * which was built for a different brief: "Problem To Production". The brief
 * changed to a three-phase growth narrative, so the constraints ADR-0002
 * measured - not the metaphor it chose - are what still bind here:
 *
 *  - The section must occupy exactly ONE viewport.
 *  - `prefers-reduced-motion` gets a STATIC composition. The still frame has
 *    no time, so a metaphor that only reads *through* motion is disqualified
 *    outright - the frame below is the deliverable, motion is enhancement.
 *  - Transform and opacity only. No second rAF loop; Lenis owns the frame loop.
 *  - Disqualified shapes carry forward: a converging funnel/triangle silhouette,
 *    an orbit/particle swirl, a WebGL scene, long scrub choreography.
 *
 * The shape: three chamfered slabs at ascending heights, sharing one baseline,
 * each one overlapping and rendered ON TOP OF the slab before it - like strata,
 * or a skyline where each new building rises out of ground the last one built.
 * Height increases left to right (foundation -> build -> operate); the overlap
 * is what reads as "grew out of", not just "comes after" - a plain ascending
 * bar chart would say "more", the overlap is what says "on top of".
 *
 * This is NOT a rounded-rectangle arrow chain: no chevrons, no connecting
 * lines, and the three slabs are different heights, not identical boxes. It
 * is also not a funnel: width holds constant and only height/layering change,
 * so the silhouette is a rising skyline, not a converging point.
 */

export interface ProcessPhase {
  id: string;
  name: string;
  caption: string;
}

export interface ProcessModel {
  phases: readonly ProcessPhase[];
}

interface ProcessDiagramProps {
  model: ProcessModel;
}

/** Chamfered - deliberately not a rounded rectangle. */
const SLAB_CLIP =
  "polygon(0 20px, 20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)";

/** Each phase's relative height along the shared baseline - the growth curve. */
const HEIGHT_PCT = [0.5, 0.74, 1] as const;

/** Gold cap thickens per phase: a small material cue that later phases carry
 *  more weight, without adding a "Phase 01" label to say it in words. */
const CAP_PX = [2, 3, 5] as const;

export function ProcessDiagram({ model }: ProcessDiagramProps) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up("md"));
  const reduced = useReducedMotion() === true;

  /**
   * Entrance-triggered, never scrub-linked (ADR-0002 inversion #6, still
   * binding). `once: true` so the composition settles and stays.
   */
  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.3 },
          transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  const slabBody = (phase: ProcessPhase, i: number) => (
    <>
      <Box aria-hidden="true" sx={{ height: CAP_PX[i] ?? 2, bgcolor: NOIR.goldDark, flexShrink: 0 }} />
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: 0.5,
          p: { xs: 1.75, md: 2.25 },
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontSize: { xs: "1.05rem", md: i === 2 ? "1.35rem" : "1.15rem" },
            fontWeight: 700,
            color: i === 2 ? NOIR.gold : NOIR.frost,
          }}
        >
          {phase.name}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.8rem",
            lineHeight: 1.45,
            color: `rgba(${NOIR.frostRgb}, 0.7)`,
            maxWidth: 340,
          }}
        >
          {phase.caption}
        </Typography>
      </Box>
    </>
  );

  // -------------------------------------------------------------------------
  // Vertical composition (xs/sm): a skyline reads left-to-right, which is lost
  // at 375px, so this keeps the same "later rests on earlier" idea by stacking
  // bottom-up with negative overlap - each phase rendered above (and slightly
  // over) the one it grew from, tallest/newest on top.
  // -------------------------------------------------------------------------
  if (!wide) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column-reverse", width: "100%" }}>
        {model.phases.map((phase, i) => (
          <Box
            key={phase.id}
            component={motion.div}
            {...rise(0.12 + i * 0.12)}
            sx={{
              position: "relative",
              zIndex: i + 1,
              mt: i === 0 ? 0 : "-10px",
              clipPath: SLAB_CLIP,
              bgcolor: i === 2 ? NOIR.navyField : NOIR.navyDeep,
              border: `1px solid rgba(${NOIR.goldRgb}, ${0.16 + i * 0.12})`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {slabBody(phase, i)}
          </Box>
        ))}
      </Box>
    );
  }

  // -------------------------------------------------------------------------
  // Horizontal composition (md+): three slabs sharing one baseline, ascending
  // height left to right, each overlapping and layered in front of the one
  // before it so it reads as growth built on top of what came before.
  // -------------------------------------------------------------------------
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-end",
        width: "100%",
        maxWidth: 1320,
        mx: "auto",
        height: "min(46svh, 400px)",
        minHeight: 300,
      }}
    >
      {model.phases.map((phase, i) => (
        <Box
          key={phase.id}
          component={motion.div}
          {...rise(0.12 + i * 0.16)}
          sx={{
            position: "relative",
            zIndex: i + 1,
            flex: 1,
            height: `${(HEIGHT_PCT[i] ?? 1) * 100}%`,
            // Overlaps the previous slab's right edge - the "built on top of"
            // cue. The earlier phase visibly continues underneath.
            ml: i === 0 ? 0 : "-28px",
            clipPath: SLAB_CLIP,
            bgcolor: i === 2 ? NOIR.navyField : NOIR.navyDeep,
            border: `1px solid rgba(${NOIR.goldRgb}, ${0.16 + i * 0.14})`,
            boxShadow: i === 2 ? "0 24px 60px rgba(0,0,0,0.45)" : "none",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {slabBody(phase, i)}
        </Box>
      ))}
    </Box>
  );
}
