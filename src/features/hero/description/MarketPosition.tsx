import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion } from "motion/react";

import { CONTENT } from "@/shared/content";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

const GROUND = GROUNDS[homeSection("hero-position").ground ?? "panel"];

/**
 * Market position: a claim, and the three things behind it.
 *
 * ## What this replaces
 *
 * A 3D orbital system — three tilted, dashed rings with a body riding each one,
 * a pointer-parallax stage, and a keyboard-navigable rail that swung the
 * selected orbit to its near point. It was carefully built and it is gone on
 * purpose:
 *
 *  - It showed **one** differentiator at a time. Two thirds of the section's
 *    actual content was behind an interaction, in a section whose whole job is
 *    to state three facts.
 *  - Half the section was decoration that carried no information. Nothing about
 *    an orbit maps onto "Technical Talent"; the rings said "loading", not
 *    "market position".
 *  - It was invisible below `md`, so the phone layout was already this — the
 *    plain one — and it was the better of the two.
 *
 * All three differentiators now read at once, in document order, with no state,
 * no media query, and nothing to operate. Accessible by construction rather
 * than by a keyboard handler.
 */

interface Differentiator {
  heading: string;
  body: string;
}

export function MarketPosition() {
  const { differentiators } = CONTENT.hero.salesPitch as {
    differentiators: readonly Differentiator[];
  };

  return (
    <StageSection section={homeSection("hero-position")}>
      <Box sx={{ width: "100%", position: "relative" }}>
        <Typography
          component="p"
          variant="overline"
          sx={{ fontFamily: MONO, color: NOIR.goldDark, display: "block", mb: { xs: 4, md: 6 } }}
        >
          Market position
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" },
            gap: { xs: 6, md: 10 },
            alignItems: "start",
          }}
        >
          {/* The claim. */}
          <Box>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontWeight: 700,
                color: GROUND.fg,
                fontSize: { xs: "2.25rem", md: "3rem" },
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Professional
              <Box component="span" sx={{ display: "block", color: NOIR.goldDark }}>
                Leadership
              </Box>
            </Typography>
            <Typography
              sx={{ mt: 3, color: GROUND.muted, fontSize: "1.0625rem", maxWidth: "28ch" }}
            >
              Decades of Wall St. Experience and a Competitive Edge of Development
            </Typography>
          </Box>

          {/* The three facts, all of them, all the time. */}
          <Box>
            {differentiators.map((diff, i) => (
              <Box
                key={diff.heading}
                component={motion.div}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  columnGap: 3,
                  py: { xs: 3, md: 3.5 },
                  borderTop: `1px solid ${GROUND.rule}`,
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontFamily: MONO,
                    fontVariantNumeric: "tabular-nums",
                    fontSize: "0.8125rem",
                    lineHeight: 2.1,
                    color: NOIR.goldDark,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </Typography>

                <Box>
                  <Typography
                    component="h3"
                    sx={{
                      fontWeight: 600,
                      fontSize: "1.25rem",
                      color: GROUND.fg,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {diff.heading}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1,
                      color: GROUND.muted,
                      lineHeight: 1.65,
                      fontSize: "1.0625rem",
                      maxWidth: "52ch",
                    }}
                  >
                    {diff.body}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </StageSection>
  );
}
