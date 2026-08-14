import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { CONTENT } from "@/shared/content";
import { ProcessDiagram } from "@/shared/components/diagrams/ProcessDiagram";
import { NOIR } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { useNavbarAnchor, NAV_ANCHORS } from "@/shared/components/NavbarContext";

export function ProcessSection() {
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.PROCESS_IMMERSIVE, { dark: true });

  return (
    <Box
      id="process"
      ref={anchorRef}
      component="section"
      sx={{
        bgcolor: NOIR.navyDeep,
        color: NOIR.frost,
        position: "relative",
        zIndex: 1,
        width: "100%",
        overflow: "hidden",
        borderTop: "1px solid rgba(255, 199, 44, 0.2)",
        borderBottom: "1px solid rgba(255, 199, 44, 0.2)",
        py: { xs: 8, md: 14 },
      }}
    >
      {/* Industrial Grid Background & Scanlines */}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Top Telemetry Header Bar (Full Width) */}
      <Box
        sx={{
          width: "100%",
          px: { xs: 3, md: 6, lg: 8 },
          mb: { xs: 6, md: 10 },
          position: "relative",
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(244, 247, 252, 0.12)",
            pb: 2,
            mb: 4,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 8,
                height: 8,
                bgcolor: NOIR.gold,
                borderRadius: "0px",
                transform: "rotate(45deg)",
              }}
            />
            <Typography
              component="span"
              sx={{
                fontFamily: MONO,
                fontSize: "0.75rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: NOIR.gold,
                fontWeight: 700,
              }}
            >
              SYS.PIPELINE // 00 — 05
            </Typography>
          </Stack>

          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.75rem",
              color: "rgba(244, 247, 252, 0.5)",
              letterSpacing: "0.15em",
              display: { xs: "none", sm: "block" },
            }}
          >
            EXECUTION SPECIFICATION · v2.6.4
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", lg: "flex-end" },
            gap: 3,
          }}
        >
          <Box>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 800,
                fontSize: { xs: "2.75rem", sm: "3.75rem", md: "5rem" },
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
                textTransform: "uppercase",
                color: NOIR.frost,
              }}
            >
              From Problem <br />
              <Box component="span" sx={{ color: NOIR.gold, WebkitTextStroke: `1px ${NOIR.gold}` }}>
                To Production
              </Box>
            </Typography>
          </Box>

          <Box sx={{ maxWidth: 480 }}>
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "rgba(244, 247, 252, 0.75)",
                borderLeft: `2px solid ${NOIR.gold}`,
                pl: 2,
              }}
            >
              Deterministic delivery architecture transforming abstract financial hypotheses into sub-millisecond, highly fault-tolerant institutional deployment.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Full-width Pipeline Canvas */}
      <Box sx={{ width: "100%", px: { xs: 2, md: 6, lg: 8 }, position: "relative", zIndex: 2 }}>
        <ProcessDiagram steps={CONTENT.process} />
      </Box>
    </Box>
  );
}
