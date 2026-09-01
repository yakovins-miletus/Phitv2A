import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion } from "motion/react";

import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

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
 * The growth story, told in one soft 3D-isometric illustration instead of three
 * animated SVG node-networks: three stepped platforms carrying the same four
 * department pillars (Quantitative Research, Software Engineering, Data Science,
 * Operations), small and close on the left, tall and interlinked on the right.
 *
 * The phase names and captions stay as real text below the image — they carry
 * the only machine-readable, translatable copy, and `tests/process-diagram.test`
 * asserts an `<h3>` per phase. The old 4-colour legend is gone: the illustration
 * labels the departments itself, and `CONTENT.process.phases[2].caption` names
 * all four in prose as the accessible equivalent.
 */
const IMG_SRC = "/images/process/growth-timeline.webp";
const IMG_SRC_MOBILE = "/images/process/growth-timeline-m.webp";
const IMG_ALT =
  "Isometric timeline of four departments — quantitative research, software engineering, data science and operations — growing from a small 2019 cluster to a large interconnected 2026 network across three stepped platforms";

export function ProcessDiagram({ model }: ProcessDiagramProps) {
  const [failed, setFailed] = useState(false);

  return (
    <Box sx={{ width: "100%", maxWidth: 1320, mx: "auto" }}>
      <Box
        component={motion.figure}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        sx={{ m: 0, width: "100%" }}
      >
        {failed ? (
          <Box
            aria-hidden
            sx={{
              width: "100%",
              height: "clamp(220px, 40svh, 480px)",
              borderRadius: { xs: "1.5rem", md: "2.5rem" },
              background: `repeating-linear-gradient(-45deg, rgba(${NOIR.goldRgb}, 0.05) 0px, rgba(${NOIR.goldRgb}, 0.05) 2px, transparent 2px, transparent 16px), ${NOIR.navyDeep}`,
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          />
        ) : (
          <Box
            component="picture"
            sx={{ display: "block", width: "100%" }}
          >
            <source media="(max-width: 599.95px)" srcSet={IMG_SRC_MOBILE} />
            <Box
              component="img"
              src={IMG_SRC}
              alt={IMG_ALT}
              width={1536}
              height={864}
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              sx={{
                display: "block",
                width: "100%",
                height: "auto",
                maxHeight: "clamp(240px, 42svh, 520px)",
                objectFit: "contain",
                mx: "auto",
              }}
            />
          </Box>
        )}
      </Box>

      {/* Phase captions — aligned under the image's three zones. */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: { xs: 3, md: 5 },
          mt: { xs: 3, md: 4 },
        }}
      >
        {model.phases.map((phase, i) => (
          <Box key={phase.id} sx={{ pr: { md: 2 } }}>
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
              {String(i + 1).padStart(2, "0")} // PHASE
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
        ))}
      </Box>
    </Box>
  );
}
