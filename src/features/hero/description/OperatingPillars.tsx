import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { motion } from "motion/react";
import { MagnifyingGlass, TerminalWindow, GlobeHemisphereWest } from "@phosphor-icons/react";

import { CONTENT } from "@/shared/content";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

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
    <StageSection section={homeSection("hero-pillars")}>
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
        {/* Section Kicker & Main Heading */}
        <Box sx={{ mb: { xs: 6, md: 8 } }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                width: 24,
                height: 2,
                borderRadius: 1,
                background: `linear-gradient(90deg, ${NOIR.goldDark}, transparent)`,
              }}
            />
            <Typography
              component="p"
              variant="overline"
              sx={{
                fontFamily: MONO,
                color: NOIR.goldDark,
                display: "block",
                letterSpacing: "0.2em",
                fontWeight: 600,
              }}
            >
              Organizational structure
            </Typography>
          </Box>
          <Typography
            variant="h2"
            component="h2"
            sx={{
              maxWidth: "20ch",
              color: GROUND.fg,
              fontSize: { xs: "2.25rem", sm: "3rem", md: "3.5rem" },
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
            }}
          >
            Three integrated operating pillars
          </Typography>
        </Box>

        {/* 3 Modern Pillar Cards with Pop-out Titles */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 4, md: 4 },
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
                  p: { xs: 3.5, md: 4.5 },
                  background: GROUND.dark
                    ? "rgba(255, 255, 255, 0.03)"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 247, 252, 0.6) 100%)",
                  border: `1px solid ${GROUND.dark ? "rgba(255, 255, 255, 0.08)" : "rgba(10, 42, 102, 0.12)"}`,
                  boxShadow: GROUND.dark
                    ? "0 4px 20px rgba(0, 0, 0, 0.2)"
                    : "0 4px 20px rgba(10, 42, 102, 0.04)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  // Strict adherence to anti-slop rules:
                  // ZERO translateY elevation or lift on hover.
                  // Micro-interactions rely entirely on border color, glow, and fill transitions.
                  transition: "border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    borderColor: NOIR.goldDark,
                    boxShadow: GROUND.dark
                      ? "0 4px 20px rgba(229, 178, 40, 0.15)"
                      : "0 4px 24px rgba(229, 178, 40, 0.12)",
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
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />

                <Box>
                  {/* Icon & Pillar Index Header */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
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

                    <Typography
                      component="span"
                      sx={{
                        fontFamily: MONO,
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        color: NOIR.goldDark,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "6px",
                        background: "rgba(229, 178, 40, 0.1)",
                        border: "1px solid rgba(229, 178, 40, 0.25)",
                      }}
                    >
                      {pillar.id}
                    </Typography>
                  </Box>

                  {/* POPPING PILLAR TITLE */}
                  <Typography
                    variant="h3"
                    component="h3"
                    sx={{
                      fontWeight: 800,
                      color: GROUND.fg,
                      letterSpacing: "-0.02em",
                      mb: 2,
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
    </StageSection>
  );
}

