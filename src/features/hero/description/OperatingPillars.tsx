import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";

import { MagnifyingGlass, TerminalWindow, GlobeHemisphereWest } from "@phosphor-icons/react";

import { CONTENT } from "@/shared/content";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { PillarsEstablishingShot } from "@/features/home/components/establishing/PillarsEstablishingShot";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

const GROUND = GROUNDS[homeSection("hero-pillars").ground ?? "void"];

interface Pillar {
  id: string;
  name: string;
  detail: string;
}

const PILLAR_ICONS = [
  <MagnifyingGlass weight="duotone" size={28} color={NOIR.goldDark} />,
  <TerminalWindow weight="duotone" size={28} color={NOIR.goldDark} />,
  <GlobeHemisphereWest weight="duotone" size={28} color={NOIR.goldDark} />,
];

export function OperatingPillars() {
  const { pillars } = CONTENT.hero.salesPitch as { pillars: readonly Pillar[] };

  return (
    <SectionBeat
      section={homeSection("hero-pillars")}
      order={2}
      establishing={<PillarsEstablishingShot selfDriven={false} />}
      establishScale="major"
      sx={{ minHeight: "auto", pt: 0, pb: { xs: 6, md: 10 } }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2, mt: { xs: 2, md: 3 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: { xs: 3, md: 3.5 },
                width: "100%",
              }}
            >
              {pillars.map((pillar, i) => {
                const Icon = PILLAR_ICONS[i] ?? PILLAR_ICONS[0]!;

            return (
              <Box
                key={pillar.id}
                sx={{
                  position: "relative",
                  borderRadius: "16px",
                  p: { xs: 3.5, md: 4 },
                  background: GROUND.dark
                    ? "rgba(255, 255, 255, 0.04)"
                    : "#FFFFFF",
                  border: `1px solid ${GROUND.dark ? "rgba(255, 255, 255, 0.12)" : "rgba(10, 42, 102, 0.16)"}`,
                  boxShadow: GROUND.dark
                    ? "0 4px 20px rgba(0, 0, 0, 0.25)"
                    : "0 8px 30px rgba(10, 42, 102, 0.08), 0 1px 3px rgba(10, 42, 102, 0.04)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    borderColor: NOIR.goldDark,
                    boxShadow: GROUND.dark
                      ? "0 4px 20px rgba(229, 178, 40, 0.15)"
                      : "0 12px 36px rgba(10, 42, 102, 0.12)",
                    "& .pillar-accent-line": {
                      opacity: 1,
                      width: "100%",
                    },
                    "& .pillar-icon-box": {
                      borderColor: NOIR.goldDark,
                      backgroundColor: "rgba(229, 178, 40, 0.12)",
                    },
                  },
                }}
              >
                {/* Top Hairline Accent Line (Expands on Hover without physical card movement) */}
                <Box
                  className="pillar-accent-line"
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "3px",
                    width: "48px",
                    opacity: 0.8,
                    background: `linear-gradient(90deg, ${NOIR.goldDark} 0%, rgba(229, 178, 40, 0.4) 100%)`,
                    transition: `all 0.4s ${EASE_OUT_EXPO_CSS}`,
                  }}
                />

                <Box>
                  {/* Icon Header */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 3.5,
                    }}
                  >
                    <Box
                      className="pillar-icon-box"
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: GROUND.dark
                          ? "rgba(255, 199, 44, 0.08)"
                          : "rgba(10, 42, 102, 0.04)",
                        border: `1px solid rgba(229, 178, 40, 0.3)`,
                        transition: "all 0.3s ease",
                      }}
                    >
                      {Icon}
                    </Box>
                  </Box>

                  {/* POPPING PILLAR TITLE */}
                  <Typography
                    variant="h3"
                    component="h3"
                    sx={{
                      fontWeight: 800,
                      color: GROUND.fg,
                      letterSpacing: "-0.02em",
                      mb: 0,
                      fontSize: { xs: "1.5rem", md: "1.75rem" },
                      lineHeight: 1.25,
                      position: "relative",
                      display: "inline-block",
                      "&::after": {
                        content: '""',
                        display: "block",
                        width: "32px",
                        height: "2px",
                        backgroundColor: NOIR.goldDark,
                        mt: 1.2,
                        borderRadius: "1px",
                      },
                    }}
                  >
                    {pillar.name}
                  </Typography>

                  {/* Detail Copy */}
                  <Typography
                    sx={{
                      color: GROUND.muted,
                      lineHeight: 1.65,
                      fontSize: "1.05rem",
                      fontWeight: 400,
                      mt: 1.5,
                    }}
                  >
                    {pillar.detail}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>
    </SectionBeat>
  );
}

