import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { CONTENT } from "@/shared/content";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { NOIR } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { useNavbarAnchor } from "@/shared/components/navbarHooks";

const GROUND = GROUNDS[homeSection("global-markets").ground ?? "deep"];

const CAPABILITIES = [
  { num: "01", name: "Cloud-Native Architecture", desc: "Resilient distributed systems & high-throughput infrastructure" },
  { num: "02", name: "Data Science Engines", desc: "Statistical modeling & automated algorithmic pipelines" },
  { num: "03", name: "Artificial Intelligence", desc: "Production-grade machine learning applied to market complexity" },
] as const;

/**
 * Beat 2 — Our Mission (The Global-Markets Wager).
 *
 * Anti-Slop Editorial Design:
 * Stripped of all generic AI cards, faux-cockpit HUD tags, and glowing pill containers.
 * Employs an authentic, Swiss-inspired editorial layout with strict typographic hierarchy,
 * generous negative space, and understated structural lines.
 */
export function GlobalMarketsStatement() {
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.GLOBAL_MARKETS, { dark: true });
  const { execSummary } = CONTENT.hero.salesPitch;
  
  // Extract the explanatory follow-up text after the opening thesis.
  const [, ...rest] = execSummary.split(". ");
  const explanation = rest.join(". ");

  return (
    <SectionBeat section={homeSection("global-markets")}>
      <Box
        ref={anchorRef}
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight: { xs: "80vh", md: "100dvh" },
          py: { xs: 12, md: 24 },
          position: "relative",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "1400px",
            mx: "auto",
            px: { xs: 3, sm: 6, md: 8, lg: 10 },
            display: "flex",
            flexDirection: "column",
            gap: { xs: 8, md: 12 },
          }}
        >
          {/* Section Kicker Bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              pb: 3,
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              width: "100%",
            }}
          >
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.7rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: NOIR.gold,
                fontWeight: 700,
              }}
            >
              01 / OUR MISSION
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.4)",
                display: { xs: "none", sm: "block" },
              }}
            >
              QUANTITATIVE R&D
            </Typography>
          </Box>

          {/* Asymmetric Editorial Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
              gap: { xs: 8, md: 12, lg: 16 },
              alignItems: "start",
            }}
          >
            {/* Primary Thesis */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Typography
                component="h2"
                sx={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: { xs: "2.6rem", sm: "3.5rem", md: "4.25rem", lg: "5rem" },
                  fontWeight: 600,
                  lineHeight: 1.04,
                  letterSpacing: "-0.03em",
                  color: GROUND.fg,
                }}
              >
                At Phitopolis, we view{" "}
                <Box
                  component="span"
                  sx={{
                    color: NOIR.gold,
                    fontWeight: 600,
                  }}
                >
                  global markets
                </Box>{" "}
                as the ultimate intellectual puzzle.
              </Typography>
            </Box>

            {/* Editorial Column: Narrative & Capabilities */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 5,
                pt: { xs: 0, lg: 2 },
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: "1.15rem", md: "1.35rem" },
                  fontWeight: 400,
                  lineHeight: 1.65,
                  color: "rgba(255, 255, 255, 0.8)",
                  letterSpacing: "-0.01em",
                }}
              >
                {explanation}
              </Typography>

              {/* Clean Capability Breakdown (No fake cards or buttons) */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                {CAPABILITIES.map((cap) => (
                  <Box
                    key={cap.num}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "36px 1fr",
                      gap: 2,
                      py: 2.5,
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      alignItems: "baseline",
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: MONO,
                        fontSize: "0.72rem",
                        color: NOIR.gold,
                        fontWeight: 700,
                      }}
                    >
                      {cap.num}
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Typography
                        sx={{
                          fontSize: "1rem",
                          fontWeight: 600,
                          color: "#FFFFFF",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {cap.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.85rem",
                          color: "rgba(255, 255, 255, 0.55)",
                          lineHeight: 1.5,
                        }}
                      >
                        {cap.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </SectionBeat>
  );
}
