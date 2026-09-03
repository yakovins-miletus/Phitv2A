import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion } from "motion/react";

import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { PROCESS_PHOTOS } from "@/features/home/components/process/processPhases";

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

/**
 * The growth story, told as a three-frame collage of the company's own photos —
 * one per phase, sitting directly above the phase it belongs to.
 *
 * This replaced a single isometric growth-timeline render. The render was an
 * abstract stand-in for a story that we actually have photographs of: a small
 * focused team in 2019, the new office in the expansion years, the whole company
 * in one frame by 2026. Real photos also survive responsive layout
 * — the old raster needed a separate mobile crop and still letterboxed between
 * them, whereas three columns simply stack.
 *
 * The frames ascend left-to-right (`FRAME_SCALE`) so the strip reads as growth
 * the way the old stepped platforms did, standing on a shared gold baseline.
 * Phase names and captions stay real text below — they carry the only
 * machine-readable, translatable copy, and `tests/process-diagram.test` asserts
 * an `<h3>` per phase.
 *
 * Photos are keyed to phases BY POSITION, not by phase id, so a custom or empty
 * `model` (see the tests) degrades to fewer frames rather than mismatched ones.
 */
type CollagePhoto = (typeof PROCESS_PHOTOS)[number];

/** Photos live in `processPhases.ts` — the single source shared with the pinned
 *  desktop scrub (`ProcessScrubStage`). Keyed to phases BY POSITION. */
const PHOTOS: readonly CollagePhoto[] = PROCESS_PHOTOS;

/** Frame heights as a fraction of the cap, so the strip ascends 2019 → 2026. */
const FRAME_SCALE = [0.82, 0.91, 1] as const;

/** Height budget for the strip, per breakpoint.
 *
 *  The section has a one-viewport budget (ADR-0002). On desktop the three
 *  frames sit side by side, so `FRAME_CAP` is the height of the tallest one.
 *  On mobile they stack, so the same cap would triple the section height —
 *  measured at 1405px against an 844px viewport. `FRAME_CAP_XS` is the
 *  stacked budget: three frames plus gaps that still leave room for the
 *  heading and the three captions. */
const FRAME_CAP = "clamp(150px, 28svh, 300px)";
const FRAME_CAP_XS = "clamp(104px, 15svh, 160px)";

function CollageFrame({ photo, index }: { photo: CollagePhoto; index: number }) {
  const [failed, setFailed] = useState(false);
  const scale = FRAME_SCALE[index] ?? 1;

  return (
    /**
     * A fixed-height slot (the tallest frame) with the image bottom-aligned
     * inside it at its own scaled height. The slot, not the image, is what the
     * grid row sizes to — so the three images share one baseline while their
     * tops step upward, and every caption below still starts at the same y.
     */
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-end",
        height: { xs: FRAME_CAP_XS, md: FRAME_CAP },
        // The timeline baseline the frames stand on.
        borderBottom: { md: `1px solid rgba(${NOIR.goldRgb}, 0.35)` },
      }}
    >
      <Box
        component={motion.figure}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: index * 0.08 }}
        sx={{
          m: 0,
          width: "100%",
          height: { xs: "100%", md: `calc(${FRAME_CAP} * ${String(scale)})` },
          overflow: "hidden",
          borderRadius: { xs: "0.75rem", md: "1rem" },
          border: "1px solid rgba(255, 199, 44, 0.2)",
          bgcolor: NOIR.navyDeep,
          ...(failed && {
            background: `repeating-linear-gradient(-45deg, rgba(${NOIR.goldRgb}, 0.05) 0px, rgba(${NOIR.goldRgb}, 0.05) 2px, transparent 2px, transparent 16px), ${NOIR.navyDeep}`,
          }),
        }}
      >
        {!failed && (
          <Box
            component="img"
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            loading="lazy"
            decoding="async"
            onError={() => {
              setFailed(true);
            }}
            sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </Box>
    </Box>
  );
}

/**
 * The `NN // PHASE` eyebrow + `<h3>` name + caption for one growth phase. Shared
 * verbatim between the static collage (this file) and the pinned desktop scrub
 * (`ProcessScrubStage`) so the machine-readable copy is identical in both. The
 * `<h3>` is the only translatable, testable text — `tests/process-diagram.test`
 * asserts one per phase.
 */
export function PhaseCaption({
  phase,
  index,
  dimmed = false,
}: {
  phase: ProcessPhase;
  index: number;
  dimmed?: boolean;
}) {
  return (
    <Box
      sx={{
        pr: { md: 2 },
        mt: { xs: 2, md: 4 },
        opacity: dimmed ? 0.4 : 1,
        transition: "opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <Typography
        sx={{
          fontFamily: MONO,
          fontSize: "0.65rem",
          fontWeight: 700,
          color: NOIR.gold,
          letterSpacing: "0.15em",
          mb: 0.75,
        }}
      >
        {String(index + 1).padStart(2, "0")} // PHASE
      </Typography>
      <Typography
        variant="h3"
        sx={{
          fontSize: { xs: "1.1rem", md: "1.25rem" },
          fontWeight: 800,
          color: NOIR.frost,
          mb: 1,
          letterSpacing: "-0.01em",
        }}
      >
        {phase.name}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.85rem",
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.5,
          maxWidth: "34ch",
        }}
      >
        {phase.caption}
      </Typography>
    </Box>
  );
}

export function ProcessDiagram({ model }: ProcessDiagramProps) {
  return (
    /**
     * ONE grid of phase cells, not a photo row above a caption row: stacked on
     * mobile, two separate grids put all three photos above all three captions,
     * so no photo sat next to the phase it illustrates.
     */
    <Box
      sx={{
        width: "100%",
        maxWidth: 1320,
        mx: "auto",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
        columnGap: { md: 5 },
        rowGap: { xs: 4, md: 0 },
      }}
    >
      {model.phases.map((phase, i) => {
        const photo = PHOTOS[i];
        return (
          <Box key={phase.id}>
            {photo && <CollageFrame photo={photo} index={i} />}
            <PhaseCaption phase={phase} index={i} />
          </Box>
        );
      })}
    </Box>
  );
}
