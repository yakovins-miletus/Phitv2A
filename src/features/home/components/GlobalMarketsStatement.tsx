import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { CONTENT } from "@/shared/content";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";

const GROUND = GROUNDS[homeSection("global-markets").ground ?? "deep"];

/**
 * Beat 2 — the wager.
 *
 * Formerly a sub-element of `MissionStatement` (68ch of body copy sitting
 * under the exec-summary heading, competing with `ServiceGlobe` and the CTA
 * for the same screen). Lifted per WS-02: this text names the intellectual
 * bet the rest of the page pays off — global markets as a puzzle, worth a
 * dedicated screen of nothing else.
 *
 * Full viewport height, no graphic, no CTA, no card. The claim right after
 * the hero is capability ("what we do"); this is the *why*, stated once and
 * left alone before Operating Pillars answers it in specifics. Deliberately
 * not decorated — `MissionStatement`'s doc already lays out why adding
 * illustration here would compete with, not carry, the words.
 */
export function GlobalMarketsStatement() {
  const { execSummary } = CONTENT.hero.salesPitch;

  return (
    <SectionBeat section={homeSection("global-markets")}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          minHeight: { xs: "70vh", md: "80vh" },
          maxWidth: { xs: "100%", md: "78%", lg: "68%" },
        }}
      >
        <Typography
          component="p"
          sx={{
            fontSize: { xs: "1.75rem", sm: "2.15rem", md: "2.75rem", lg: "3.1rem" },
            fontWeight: 500,
            lineHeight: { xs: 1.35, md: 1.3 },
            letterSpacing: "-0.01em",
            color: GROUND.fg,
          }}
        >
          {execSummary}
        </Typography>
      </Box>
    </SectionBeat>
  );
}
