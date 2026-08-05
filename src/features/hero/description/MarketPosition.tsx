import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { CONTENT } from "@/shared/content";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

// Read from the section registry rather than named directly: this beat and the
// scroll-driven ground layer must agree on one ground, and naming it twice is how
// they drift. `sections.ts` is the source; this follows it.
const GROUND = GROUNDS[homeSection("hero-position").ground ?? "deep"];

/**
 * Act I, beat 3 — the proof, and where the act breaks into light.
 *
 * The deck rendered this as a 2x2 of equal glass cards: AP-L04, twelve-items-one-
 * treatment, so the reader had to read all four to find the one that mattered.
 *
 * The identity here is **an editorial ledger against a sticky heading** — two
 * columns where the left holds still and the right scrolls past it, rows ruled by
 * hairlines rather than boxed, and the lead differentiator set at a larger size so
 * the four are ranked instead of tiled. It is also the first light ground in the
 * act: the sequence runs navyDeep → navyPanel → void, so Act I resolves into light
 * and hands off to the footprint.
 */
export function MarketPosition() {
  const { positioning, differentiators } = CONTENT.hero.salesPitch;

  return (
    <StageSection section={homeSection("hero-position")}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 22ch) 1fr" },
          columnGap: { md: 8 },
          rowGap: { xs: 4, md: 0 },
          alignItems: "start",
          width: "100%",
        }}
      >
        {/* Left rail holds still while the ledger moves past it. */}
        <Box sx={{ position: { md: "sticky" }, top: { md: "22vh" } }}>
          <Typography
            component="p"
            variant="overline"
            sx={{ fontFamily: MONO, color: NOIR.gold, display: "block", mb: 1 }}
          >
            Market position
          </Typography>
          <Typography variant="h3" component="h2" sx={{ lineHeight: 1.15 }}>
            Built for {positioning.target}
          </Typography>
        </Box>

        <Box>
          {differentiators.map((diff, i) => {
            // The lead item carries extra weight so the set is ranked, not tiled.
            const isLead = i === 0;
            return (
              <Box
                key={diff.heading}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "3.5rem 1fr",
                  columnGap: { xs: 2, md: 3 },
                  alignItems: "baseline",
                  py: { xs: 3, md: isLead ? 4 : 3 },
                  borderTop: i === 0 ? "none" : `1px solid ${GROUND.rule}`,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontVariantNumeric: "tabular-nums",
                    fontSize: "0.85rem",
                    color: NOIR.gold,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </Typography>

                <Box>
                  <Typography
                    variant={isLead ? "h4" : "h5"}
                    component="h3"
                    sx={{ mb: 1, lineHeight: 1.25 }}
                  >
                    {diff.heading}
                  </Typography>
                  <Typography
                    sx={{
                      color: GROUND.muted,
                      lineHeight: 1.6,
                      maxWidth: "62ch",
                      fontSize: isLead ? "1.05rem" : "0.95rem",
                    }}
                  >
                    {diff.body}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </StageSection>
  );
}
