import Box from "@mui/material/Box";

import { CONTENT } from "@/shared/content";
import { Reveal } from "@/shared/components/Reveal";
import { ReachMap } from "@/shared/components/ReachMap";
import { SectionLede } from "@/shared/components/SectionLede";
import { StageSection } from "@/shared/components/StageSection";
import { StatStrip } from "@/shared/components/StatStrip";
import { homeSection } from "@/shared/sections";

/**
 * Global Reach — the closing beat of Act I.
 *
 * This is the last thing a prospective client sees before the page stops talking
 * to them and starts talking to engineers, so it carries the act's climax and hands
 * off into the ground layer's Services → People wipe.
 *
 * It used to be a map in a box: `StageSection muted` (a `background.paper` band)
 * wrapping a `1px divider`-bordered `background.paper` container around
 * `<ReachMap />` — a paper card on a paper band, which is why it read as bland
 * from a section whose own copy claims global scale.
 *
 * Three changes, and no ReachMap rewrite:
 *  - The box and the band are gone. The map sits directly on the act ground, which
 *    the ground layer is already interpolating, so nothing draws a seam around it.
 *  - The map bleeds past the container gutters at desktop, so the footprint reads
 *    as wide as the claim.
 *  - The two figures the lede asserts — "Two offices. Two client regions." — now
 *    appear as figures beneath it. `CONTENT.stats` already held them and had no
 *    consumer anywhere in the app.
 */
export function ReachSection() {
  // The lede says "two offices, two client regions"; these are those two figures.
  // Slicing the shared list rather than hardcoding keeps copy and numbers on one
  // source, so they cannot drift apart.
  const footprint = CONTENT.stats.slice(0, 2);

  return (
    <StageSection section={homeSection("reach")}>
      <Box sx={{ mb: { xs: 5, md: 7 }, maxWidth: "34ch" }}>
        <SectionLede
          gunshot={CONTENT.ledes.reach.gunshot}
          tracer={CONTENT.ledes.reach.tracer}
          eyebrow="Global Footprint"
        />
      </Box>

      <Reveal delay={0.1}>
        <Box
          sx={{
            // Bleed past the Container gutters so the map is as wide as the claim.
            // A negative margin matched to the gutter, not a viewport-width trick,
            // so it can never introduce horizontal scroll at 320px.
            mx: { xs: 0, md: -6 },
          }}
        >
          <ReachMap />
        </Box>
      </Reveal>

      <Box sx={{ mt: { xs: 5, md: 7 } }}>
        <StatStrip stats={footprint} />
      </Box>
    </StageSection>
  );
}
