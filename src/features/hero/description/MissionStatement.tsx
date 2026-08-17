import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "@phosphor-icons/react";

import { CONTENT } from "@/shared/content";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";
import { ServiceGlobe } from "./ServiceGlobe";

// Follows the section registry rather than naming a ground twice — see the same
// note in MarketPosition.tsx.
const GROUND = GROUNDS[homeSection("hero-mission").ground ?? "deep"];

/**
 * Act I, beat 1 — the claim.
 *
 * One of three sections that replaced a four-beat slide deck. The deck switched
 * `display: none` between beats inside a single centred 1140px flex box wrapping a
 * glass card, so every beat was the same object with different words in it — the
 * reason it read as interchangeable regardless of the copy.
 *
 * This beat's identity is **typographic scale on a hard left edge**: no card, no
 * centring, no container chrome. The eye lands on the first word of the title and
 * runs down to the one action the section offers.
 *
 * ## What fills the right side
 *
 * `ImmersiveTechBackground` — a full-bleed field of floating Phosphor glyphs (a
 * cloud, a CPU, a `</>`, a bar chart) in blurred glass pills, on three infinite
 * `keyframes` float loops. Three reasons it is gone rather than tuned:
 *
 *  - It was built for a dark ground. Its fills were `rgba(255,255,255,0.02)` and
 *    its borders white at 6–8%, rendered at `opacity: 0.35` on `panel`
 *    (#F8FAFC). On a near-white surface that is not atmosphere, it is four grey
 *    smudges.
 *  - It ran unconditionally. No `prefers-reduced-motion` branch, on a section
 *    that is otherwise static — the one animation on the beat was the one nobody
 *    could turn off.
 *  - Those four glyphs say "technology company" and nothing more. A cloud icon
 *    is not a claim.
 *
 * `<ServiceGlobe />` takes the space instead: a rotating wireframe sphere,
 * oversized and pushed past the right gutter so the viewport cuts it, with the
 * four service disciplines orbiting it and gold nodes at the four cities the copy
 * already names. Same three facts the section is arguing — global, quantitative,
 * four disciplines — as one object rather than as decoration. It is decorative in
 * the a11y sense (the wireframe is `aria-hidden`, the labels are a real list) and
 * it stops turning under `prefers-reduced-motion`.
 */
export function MissionStatement() {
  const { heroLine, execSummary, cta } = CONTENT.hero.salesPitch;

  return (
    <SectionBeat section={homeSection("hero-mission")} order={1} background={<ServiceGlobe />}>
      {/* Foreground Content.
       *
       * Narrower than the old 62% at desktop: the orbit ring's left extreme
       * reaches ~59% of the container, so a 62% column would have chips passing
       * through the last words of every line. */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          maxWidth: { xs: "100%", md: "54%", lg: "50%" },
        }}
      >
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

        <Typography sx={{ lineHeight: 1.65, color: GROUND.muted, maxWidth: "68ch" }}>
          {execSummary}
        </Typography>

        <Box sx={{ mt: { xs: 5, md: 6 } }}>
          <PrimaryAction label={cta.label} to={cta.to} />
        </Box>
      </Box>
    </SectionBeat>
  );
}

/**
 * The section's one primary action.
 *
 * Hand-rolled rather than a themed `Button` so every state in the taste bar is
 * visible in one place and none of them arrive from a global override. Filled
 * navy at rest (frost on navy, 12.73:1) and filled gold on hover/focus (navy on
 * gold, 9.48:1) — the hover is a fill swap, not an opacity change, so it survives
 * forced-colours and reads at a glance.
 *
 * `focus-visible` is a double ring: a navy outline for contrast against the gold
 * fill it sits on, and a gold halo outside it so the ring is visible on the near
 * white ground too.
 */
function PrimaryAction({ label, to }: { label: string; to: string }) {
  return (
    <Box
      component={Link}
      to={to}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1.5,
        // Asymmetric: the arrow adds visual mass on the right, so the right
        // padding is pulled in to keep the control optically centred.
        pl: 3.5,
        pr: 3,
        py: 1.75,
        bgcolor: NOIR.navyField,
        color: NOIR.frost,
        textDecoration: "none",
        borderRadius: 0,
        fontFamily: MONO,
        fontSize: "0.8125rem",
        fontWeight: 500,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        transition: "background-color 160ms ease, color 160ms ease, transform 160ms ease",
        "& .cta-arrow": {
          transition: `transform 200ms ${EASE_OUT_EXPO_CSS}`,
        },
        // One block, not two: duplicate keys in an `sx` object silently drop the
        // earlier one, which is how a reduced-motion guard gets written and never
        // applied.
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
          "& .cta-arrow": { transition: "none" },
        },
        "&:hover": {
          bgcolor: NOIR.gold,
          color: NOIR.navyField,
          "& .cta-arrow": { transform: "translateX(4px)" },
        },
        "&:focus-visible": {
          bgcolor: NOIR.gold,
          color: NOIR.navyField,
          outline: `2px solid ${NOIR.navyField}`,
          outlineOffset: "2px",
          boxShadow: `0 0 0 6px rgba(${NOIR.goldRgb}, 0.45)`,
        },
        "&:active": {
          bgcolor: NOIR.goldDark,
          color: NOIR.navyField,
          transform: "translateY(1px)",
        },
      }}
    >
      {label}
      <ArrowRight className="cta-arrow" weight="bold" size={16} aria-hidden />
    </Box>
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
