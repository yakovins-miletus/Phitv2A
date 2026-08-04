import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { CONTENT } from "@/shared/content";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { NOIR } from "@/shared/theme/palette";

const GROUND = GROUNDS.navyDeep;

/**
 * Act I, beat 1 — the claim.
 *
 * One of three sections that replaced a four-beat slide deck. The deck switched
 * `display: none` between beats inside a single centred 1140px flex box wrapping a
 * glass card, so every beat was the same object with different words in it — the
 * reason it read as interchangeable regardless of the copy.
 *
 * This beat's identity is **typographic scale on a hard left edge**: no card, no
 * centring, no container chrome, and the right ~40% left deliberately empty.
 * Whitespace is the only device. The eye lands on the first word of the title and
 * has nowhere else to go.
 */
export function MissionStatement() {
  const { heroLine, execSummary, positioning } = CONTENT.hero.salesPitch;

  return (
    <StageSection section={homeSection("hero-mission")}>
      <Box sx={{ maxWidth: { xs: "100%", md: "62%" } }}>
        {/* No eyebrow. This is the opening claim, and a label above it would be the
            first piece of chrome in a section whose whole device is that there is
            none. `positioning.target` names the audience once, in MarketPosition. */}

        {/* The theme's h1 already carries the display ramp and -0.03em tracking;
            the deck bypassed it with a hand-rolled clamp() and fontWeight 900. */}
        <Typography variant="h1" component="h2" sx={{ mb: 4 }}>
          {titleWithKeyedTail(heroLine.title)}
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: "1.05rem", md: "1.25rem" },
            lineHeight: 1.5,
            color: GROUND.muted,
            maxWidth: "52ch",
            mb: 3,
          }}
        >
          {heroLine.subheading}
        </Typography>

        {/* Measure capped in `ch`, per commitment 1 — the deck ran this copy at
            880px inside a centred glass card. */}
        <Typography sx={{ lineHeight: 1.65, color: GROUND.muted, maxWidth: "68ch" }}>
          {execSummary}
        </Typography>

        <Typography
          sx={{
            mt: 4,
            pl: 3,
            borderLeft: `2px solid ${NOIR.gold}`,
            fontSize: "1.05rem",
            lineHeight: 1.5,
            color: GROUND.fg,
            maxWidth: "56ch",
          }}
        >
          {positioning.why}
        </Typography>
      </Box>
    </StageSection>
  );
}

/**
 * Key the last three words of the title in gold.
 *
 * The deck keyed the literal substring "R&D firm" out of the exec summary with a
 * regex split, which silently produced no highlight at all if the copy changed.
 * Keying by position instead degrades to "no highlight" only when the title is
 * shorter than three words.
 */
function titleWithKeyedTail(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 4) return title;
  const head = words.slice(0, -3).join(" ");
  const tail = words.slice(-3).join(" ");
  return (
    <>
      {head}{" "}
      <Box component="span" sx={{ color: NOIR.gold }}>
        {tail}
      </Box>
    </>
  );
}
