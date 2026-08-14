import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { motion } from "motion/react";

import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO, EASE_SPRING_SOFT } from "@/shared/motion/easing";

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
  const state = reduced || shipped ? "shipped" : "idle";

  return (
    <Box sx={{ position: "relative", width: "100%", maxWidth: { xs: "100%", md: 840 }, mx: "auto" }}>
      <motion.div
        initial={reduced ? false : "idle"}
        animate={state}
        variants={{
          idle: { borderColor: "rgba(255, 199, 44, 0.2)", backgroundColor: "rgba(10, 42, 102, 0.2)" },
          shipped: {
            borderColor: NOIR.gold,
            backgroundColor: "rgba(10, 42, 102, 0.4)",
            boxShadow: `0 0 32px rgba(${NOIR.goldRgb}, 0.15)`,
          },
        }}
        transition={ENTER}
        style={{
          position: "relative",
          borderRadius: 0,
          borderWidth: 1,
          borderStyle: "solid",
          background: "transparent",
        }}
      >
        {/* Tactical Corner Brackets */}
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            top: -1,
            left: -1,
            width: 8,
            height: 8,
            borderTop: `2px solid ${NOIR.gold}`,
            borderLeft: `2px solid ${NOIR.gold}`,
          }}
        />
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            top: -1,
            right: -1,
            width: 8,
            height: 8,
            borderTop: `2px solid ${NOIR.gold}`,
            borderRight: `2px solid ${NOIR.gold}`,
          }}
        />
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            bottom: -1,
            left: -1,
            width: 8,
            height: 8,
            borderBottom: `2px solid ${NOIR.gold}`,
            borderLeft: `2px solid ${NOIR.gold}`,
          }}
        />
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            bottom: -1,
            right: -1,
            width: 8,
            height: 8,
            borderBottom: `2px solid ${NOIR.gold}`,
            borderRight: `2px solid ${NOIR.gold}`,
          }}
        />

        {/* Top CAD Header Bar */}
        <Box
          aria-hidden="true"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, md: 4 },
            py: 1,
            borderBottom: "1px solid rgba(255, 199, 44, 0.2)",
            bgcolor: "rgba(0, 0, 0, 0.3)",
          }}
        >
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.6875rem",
              color: NOIR.gold,
              letterSpacing: "0.2em",
              fontWeight: 700,
            }}
          >
            [ DOCK // FINAL_OUTPUT ]
          </Typography>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.6875rem",
              color: "rgba(244, 247, 252, 0.5)",
              letterSpacing: "0.15em",
            }}
          >
            SYS.STATUS: RELEASE_VERIFIED
          </Typography>
        </Box>

        <Stack spacing={4} sx={{ px: { xs: 2, md: 6 }, pb: 3, pt: 2 }}>
          {children}

          {/* Brand Stamp & Telemetry Receipt */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "center", sm: "baseline" }}
            justifyContent="space-between"
            sx={{
              pt: 3,
              mx: 0,
              borderTop: `1px solid rgba(${NOIR.goldRgb}, 0.2)`,
            }}
          >
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
                    fontWeight: 800,
                    fontSize: "1.125rem",
                    letterSpacing: "0.3em",
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
                  sx={{ width: 6, height: 6, borderRadius: 0, bgcolor: NOIR.live }}
                />
                <Typography
                  aria-hidden="true"
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.75rem",
                    letterSpacing: "0.2em",
                    color: `rgba(${NOIR.frostRgb}, 0.88)`,
                    whiteSpace: "nowrap",
                    fontWeight: 700,
                  }}
                >
                  {`BUILD ${buildNumber} · SHIPPED`}
                </Typography>
              </Stack>
            </motion.div>
          </Stack>
        </Stack>

        {/* Shipped confirming tactical frame pulse */}
        {!reduced && shipped && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.9, ease: EASE_SPRING_SOFT }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 0,
              border: `1px solid ${NOIR.gold}`,
              pointerEvents: "none",
            }}
          />
        )}
      </motion.div>
    </Box>
  );
}
