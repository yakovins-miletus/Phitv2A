import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { motion } from "motion/react";

import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO, EASE_SPRING_SOFT } from "@/shared/motion/easing";

/**
 * The dock at the end of the pipeline — where a materialized idea becomes a
 * Phitopolis product.
 *
 * This plays in REAL TIME off a latched boolean, not scrubbed off scroll
 * progress. A delivery scrubbed to the reader's scroll speed stops being a
 * delivery: it becomes another progress bar, and the one moment the section is
 * built around has to land at its own tempo. It also latches — scrolling back
 * up does not replay it, because a product does not un-ship.
 */

const ENTER = { duration: 0.55, ease: EASE_OUT_EXPO } as const;

interface ProcessShipPlateProps {
  /** Phase number from CONTENT.process, e.g. "05". */
  buildNumber: string;
  /** Latched true once the payload has reached this node. */
  shipped: boolean;
  /** Reduced motion: render the shipped state at rest, no sequence, no pulse. */
  reduced: boolean;
  /** The payload well, the phase label and its caption. */
  children: ReactNode;
}

export function ProcessShipPlate({ buildNumber, shipped, reduced, children }: ProcessShipPlateProps) {
  // Reduced motion resolves to the final frame with no `initial` at all, so
  // there is nothing to animate away from and nothing ever renders unshipped.
  const state = reduced || shipped ? "shipped" : "idle";

  return (
    <Box sx={{ position: "relative", maxWidth: 640, mx: "auto" }}>
      <motion.div
        initial={reduced ? false : "idle"}
        animate={state}
        variants={{
          idle: { borderColor: `rgba(${NOIR.goldRgb}, 0.16)`, boxShadow: "0 0 0 rgba(0,0,0,0)" },
          shipped: {
            borderColor: `rgba(${NOIR.goldRgb}, 0.55)`,
            boxShadow: `0 0 64px rgba(${NOIR.goldRgb}, 0.14)`,
          },
        }}
        transition={ENTER}
        style={{
          position: "relative",
          borderRadius: 24,
          borderWidth: 1,
          borderStyle: "solid",
          // A frame, not a filled card. The payload docks *behind* the list so
          // it can pass behind the endpoint headings without colliding with
          // them; any fill here would tint the mark once it arrives.
          background: "transparent",
        }}
      >
        {/* No horizontal padding on mobile: the node body is already inset from
            the spine by exactly the same amount as every other phase, and a
            plate padding on top of that would step its text out of line with
            the rest of the pipeline. */}
        <Stack spacing={4} sx={{ px: { xs: 0, md: 6 }, pb: 3 }}>
          {children}

          {/* Brand stamp. The hairline above it is the plate's only internal
              rule — it separates the phase from the receipt for it. */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "center", sm: "baseline" }}
            justifyContent="space-between"
            sx={{
              pt: 3,
              mx: { xs: 2, md: 0 },
              borderTop: `1px solid rgba(${NOIR.goldRgb}, 0.16)`,
            }}
          >
            {/* Overflow mask + translate, so the wordmark wipes in on the
                compositor rather than animating clip-path or width. */}
            <Box sx={{ overflow: "hidden", py: 0.5 }}>
              <motion.div
                initial={reduced ? false : "idle"}
                animate={state}
                variants={{ idle: { x: "-105%" }, shipped: { x: "0%" } }}
                transition={{ ...ENTER, delay: reduced ? 0 : 0.18 }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: "1rem",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: NOIR.gold,
                    display: "block",
                  }}
                >
                  Phitopolis
                </Typography>
              </motion.div>
            </Box>

            <motion.div
              initial={reduced ? false : "idle"}
              animate={state}
              variants={{ idle: { opacity: 0, y: 8 }, shipped: { opacity: 1, y: 0 } }}
              transition={{ ...ENTER, delay: reduced ? 0 : 0.34 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  aria-hidden="true"
                  sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: NOIR.live }}
                />
                <Typography
                  aria-hidden="true"
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.75rem",
                    letterSpacing: "0.2em",
                    // 0.78 alpha on this ground measures 7.6:1 — the receipt
                    // line is small type and has to clear AA on its own.
                    color: `rgba(${NOIR.frostRgb}, 0.78)`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {`BUILD ${buildNumber} · SHIPPED`}
                </Typography>
              </Stack>
            </motion.div>
          </Stack>
        </Stack>

        {/* One confirming pulse. Small and discrete — the single case
            EASE_SPRING_SOFT is reserved for. */}
        {!reduced && shipped && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0.55, scale: 1 }}
            animate={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 0.9, ease: EASE_SPRING_SOFT }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 24,
              border: `1px solid ${NOIR.gold}`,
              pointerEvents: "none",
            }}
          />
        )}
      </motion.div>
    </Box>
  );
}
