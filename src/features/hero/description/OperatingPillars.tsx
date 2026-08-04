import { useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { CONTENT } from "@/shared/content";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";

gsap.registerPlugin(ScrollTrigger);

const GROUND = GROUNDS.navyPanel;

/**
 * Act I, beat 2 — the structure.
 *
 * The deck rendered this as `repeat(3, 1fr)` of identical glass cards: AP-L01, the
 * three-card row, with nothing to indicate which pillar leads. Content forced into a
 * shape it does not have.
 *
 * The identity here is **a rack, not a grid** — three full-width rows separated by
 * hairlines, indexed with tabular mono numerals, following the precedent
 * `CapabilityRack` set when it collapsed four look-alike full-viewport templates
 * into one stage whose rows expand in place. Rows light as they reach centre, so
 * the section reads on one pass with no interaction and no hover dependency.
 */
export function OperatingPillars() {
  const { pillars } = CONTENT.hero.salesPitch;
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      // Reduced motion keeps every row at its lit resting state — the DOM default
      // below is already the final state, so there is nothing to undo.
      if (reduced === true || !rootRef.current) return;
      const rows = rootRef.current.querySelectorAll<HTMLElement>("[data-pillar-row]");

      rows.forEach((row) => {
        gsap.fromTo(
          row,
          { autoAlpha: 0.35, x: -24 },
          {
            autoAlpha: 1,
            x: 0,
            ease: "none",
            scrollTrigger: {
              trigger: row,
              // Lights through the lower third and holds once it reaches centre.
              start: "top 85%",
              end: "top 45%",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <StageSection section={homeSection("hero-pillars")}>
      <Box ref={rootRef} sx={{ width: "100%" }}>
        <Typography
          component="p"
          variant="overline"
          sx={{ fontFamily: MONO, color: NOIR.gold, display: "block", mb: 1 }}
        >
          Organizational structure
        </Typography>
        <Typography variant="h2" component="h2" sx={{ mb: { xs: 4, md: 6 }, maxWidth: "18ch" }}>
          Three integrated operating pillars
        </Typography>

        <Box sx={{ borderTop: `1px solid ${GROUND.rule}` }}>
          {pillars.map((pillar) => (
            <Box
              key={pillar.id}
              data-pillar-row
              sx={{
                display: "grid",
                // Asymmetric by intent: the numeral column is a rail, the detail
                // column carries the weight. An even 3-up would be the grid again.
                gridTemplateColumns: { xs: "3rem 1fr", md: "6rem minmax(0, 20ch) 1fr" },
                alignItems: "baseline",
                columnGap: { xs: 2, md: 4 },
                rowGap: 1,
                py: { xs: 3, md: 4 },
                borderBottom: `1px solid ${GROUND.rule}`,
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO,
                  // Numerals sit in a column, so they must not shimmy between rows.
                  fontVariantNumeric: "tabular-nums",
                  fontSize: { xs: "1rem", md: "1.5rem" },
                  color: NOIR.gold,
                  lineHeight: 1,
                }}
              >
                {pillar.id}
              </Typography>

              <Typography
                variant="h4"
                component="h3"
                sx={{ gridColumn: { xs: "2", md: "auto" }, lineHeight: 1.2 }}
              >
                {pillar.name}
              </Typography>

              <Typography
                sx={{
                  gridColumn: { xs: "2", md: "auto" },
                  color: GROUND.muted,
                  lineHeight: 1.6,
                  maxWidth: "60ch",
                }}
              >
                {pillar.detail}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </StageSection>
  );
}
