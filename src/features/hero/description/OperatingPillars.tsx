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

// `goldDark`, not `gold`: these sit on a near-white ground, where the lighter
// gold all but disappears.
const PILLAR_ICONS = [
  <MagnifyingGlass weight="light" size={32} color={NOIR.goldDark} />,
  <TerminalWindow weight="light" size={32} color={NOIR.goldDark} />,
  <GlobeHemisphereWest weight="light" size={32} color={NOIR.goldDark} />,
];

export function OperatingPillars() {
  const { pillars } = CONTENT.hero.salesPitch as { pillars: readonly Pillar[] };

  return (
    <StageSection section={homeSection("hero-pillars")}>
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
        {/* Left-aligned with the columns below it. Centred heading over a
         *  left-aligned grid reads as two designs sharing a section. */}
        <Box sx={{ mb: { xs: 6, md: 8 } }}>
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

        {/* Three plain columns under a hairline rule.
         *
         * This was a glass "monolith" — a translucent rounded card with a blur,
         * a gold underline, a drop shadow, a decorative beam pinned at a magic
         * `top: 100px`, and each icon in its own tinted chip. On a light ground
         * none of that carried information: it read as a grey box of yellow
         * tiles, and the beam fell wherever the copy happened to push it. The
         * content is three labelled paragraphs, so it is set as three labelled
         * paragraphs — the rule and the column gap do all the dividing. */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            columnGap: { md: 8 },
            rowGap: { xs: 6, md: 0 },
          }}
        >
          {pillars.map((pillar, i) => {
            const Icon = PILLAR_ICONS[i] ?? PILLAR_ICONS[0]!;

            return (
              <Box
                key={pillar.id}
                sx={{ pt: { xs: 4, md: 5 }, borderTop: `1px solid ${GROUND.rule}` }}
              >
                <Typography
                  component="span"
                  sx={{
                    display: "block",
                    fontFamily: MONO,
                    fontSize: "0.75rem",
                    letterSpacing: "0.3em",
                    color: NOIR.goldDark,
                    mb: 3,
                  }}
                >
                  {pillar.id}
                </Typography>

                <Box sx={{ mb: 3, lineHeight: 0 }}>{Icon}</Box>

                <Typography
                  variant="h3"
                  component="h3"
                  sx={{ fontWeight: 600, color: GROUND.fg, letterSpacing: "-0.01em", mb: 2, fontSize: "1.5rem" }}
                >
                  {pillar.name}
                </Typography>

                <Typography sx={{ color: GROUND.muted, lineHeight: 1.6, fontSize: "1.05rem", maxWidth: "34ch" }}>
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
