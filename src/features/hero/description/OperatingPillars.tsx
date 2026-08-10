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
  <MagnifyingGlass weight="light" size={40} color={NOIR.gold} />,
  <TerminalWindow weight="light" size={40} color={NOIR.gold} />,
  <GlobeHemisphereWest weight="light" size={40} color={NOIR.gold} />,
];

export function OperatingPillars() {
  const { pillars } = CONTENT.hero.salesPitch as { pillars: readonly Pillar[] };

  return (
    <StageSection section={homeSection("hero-pillars")}>
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
        <Box sx={{ mb: { xs: 8, md: 10 }, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <Typography
            component="p"
            variant="overline"
            sx={{ fontFamily: MONO, color: NOIR.goldDark, display: "block", letterSpacing: "0.2em", mb: 2 }}
          >
            Organizational structure
          </Typography>
          <Typography 
            variant="h2" 
            component="h2" 
            sx={{ 
              maxWidth: "18ch", 
              color: GROUND.fg, 
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              lineHeight: 1.1,
              letterSpacing: "-0.02em"
            }}
          >
            Three integrated operating pillars
          </Typography>
        </Box>

        {/* The Monolith: A single, unified block divided into three segments */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          sx={{
            position: "relative",
            width: "100%",
            bgcolor: "rgba(255, 255, 255, 0.02)",
            border: `1px solid rgba(255, 255, 255, 0.08)`,
            borderBottom: `2px solid ${NOIR.gold}60`,
            backdropFilter: "blur(16px)",
            borderRadius: "24px",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.08)",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          }}
        >
          {/* Integrated Connection Beam running across the entire monolith */}
          <Box 
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              top: "100px",
              left: 0,
              right: 0,
              height: "1px",
              background: `linear-gradient(90deg, transparent 5%, ${NOIR.gold}40 20%, ${NOIR.gold}40 80%, transparent 95%)`,
              zIndex: 1,
            }}
          />

          {pillars.map((pillar, i) => {
            const Icon = PILLAR_ICONS[i] ?? PILLAR_ICONS[0]!;
            
            return (
              <Box
                key={pillar.id}
                sx={{
                  position: "relative",
                  p: { xs: 4, md: 6 },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  borderRight: { 
                    xs: "none", 
                    md: i < pillars.length - 1 ? `1px solid rgba(255, 255, 255, 0.06)` : "none" 
                  },
                  borderBottom: {
                    xs: i < pillars.length - 1 ? `1px solid rgba(255, 255, 255, 0.06)` : "none",
                    md: "none"
                  },
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.02)",
                    "& .pillar-icon-box": {
                      bgcolor: "rgba(212, 175, 55, 0.12)",
                    }
                  }
                }}
              >
                {/* Number / Label */}
                <Typography
                  component="span"
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.75rem",
                    letterSpacing: "0.3em",
                    color: NOIR.goldDark,
                    mb: 4,
                  }}
                >
                  {pillar.id}
                </Typography>

                {/* Icon Hub */}
                <Box 
                  className="pillar-icon-box"
                  sx={{ 
                    p: 2.5, 
                    borderRadius: "20px", 
                    bgcolor: "rgba(212, 175, 55, 0.05)", 
                    border: `1px solid ${NOIR.gold}30`,
                    transition: "background-color 0.4s ease",
                    mb: 6,
                    position: "relative",
                    zIndex: 2, // Sits above the connection beam
                  }}
                >
                  {Icon}
                </Box>

                <Typography
                  variant="h3"
                  component="h3"
                  sx={{ fontWeight: 600, color: GROUND.fg, letterSpacing: "-0.01em", mb: 3, fontSize: "1.75rem" }}
                >
                  {pillar.name}
                </Typography>

                <Typography sx={{ color: GROUND.muted, lineHeight: 1.6, fontSize: "1.05rem", maxWidth: "40ch", mx: "auto" }}>
                  {pillar.detail}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Container>
    </StageSection>
  );
}
