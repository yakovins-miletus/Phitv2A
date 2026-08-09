import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";

import { CONTENT } from "@/shared/content";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";
import { useNavbarAnchor, NAV_ANCHORS } from "@/shared/components/NavbarContext";

/**
 * The closing shelf — the page's last section, and the only one that looks backwards.
 *
 * `sections.ts` has carried a `closing` entry ("Horizon Gateway") since the section
 * list was written, and it was never rendered by anything. This fills that slot.
 *
 * ── WHY A SHELF AND NOT A CARD GRID ──────────────────────────────────────────────
 *
 * The obvious build for "summarise the page" is four equal cards in a row, and that
 * is the single most generic layout on the modern web — the taste standard flags it
 * directly (equal-weight grid: nothing is more important than anything else, so the
 * eye has no first stop and the section says nothing the nav didn't already say).
 *
 * So the frames are deliberately UNEQUAL, and the inequality carries meaning:
 * capabilities is what the firm sells, so it gets the most shelf; the journey is the
 * only frame in the past tense, so it stands apart and taller; people and writing are
 * smaller because the page has already spent real estate on both. Reading order and
 * visual weight agree, which is what makes it a hierarchy rather than a mosaic.
 *
 * ── WHY PICTURE FRAMES ───────────────────────────────────────────────────────────
 *
 * This is not a new visual language. `features/about/components/JourneyTimeline`
 * already renders its photos as scattered polaroids — 3px white border, 8px radius,
 * a deep shadow, a small rotation. The shelf borrows exactly that treatment, so the
 * closing section reads as the About timeline's language brought onto the home page.
 * A distinctive treatment used twice in agreement is a system; used once it is noise.
 *
 * The rotation is the one thing that must stay small (≤1.2deg): past that the frames
 * read as a scrapbook rather than a mantelpiece, and the copy inside stops being
 * comfortable to read.
 */

/**
 * Per-frame shelf geometry and photo. Index matches `CONTENT.closing.shelf` order.
 *
 * The spans are 8/4 and 4/8, not 7/5 and 5/7. The first pass used 7/5, and on screen
 * that read as two cards of roughly the same size — an inequality small enough to look
 * like a mistake rather than a decision. A 2:1 ratio is unmistakable, which is the
 * whole point: the eye has to land somewhere first.
 *
 * Every photo is a local WebP that already ships in `public/images` (all 16:9-ish, all
 * under 210 KB) and is declared with explicit `width`/`height` so the frame reserves
 * its box before the image arrives and nothing shifts.
 */
const FRAME_LAYOUT = [
  {
    // What we build — the widest frame. It is what the firm sells, so it gets the shelf.
    span: { xs: "1 / -1", md: "1 / span 8" },
    rotate: "-0.8deg",
    // Wide frames take a panoramic crop, narrow frames a portrait-ish one. A single
    // shared aspect made the two wide frames ~440px tall on desktop and the shelf
    // stopped reading as a shelf — the photos became the section.
    aspect: "21 / 9",
    img: { src: "/images/software-engineer-banner.webp", w: 1024, h: 576, alt: "An engineer at work on a trading platform interface." },
  },
  {
    // How we got here — the only past-tense frame, so it stands apart and narrower.
    span: { xs: "1 / -1", md: "9 / span 4" },
    rotate: "0.9deg",
    aspect: "4 / 3",
    img: { src: "/images/ecotower-bgc.webp", w: 1376, h: 768, alt: "The Phitopolis office tower in Bonifacio Global City, Manila." },
  },
  {
    // Who does the work.
    span: { xs: "1 / -1", md: "1 / span 4" },
    rotate: "0.6deg",
    aspect: "4 / 3",
    img: { src: "/images/grads/2026B1Grads.webp", w: 1920, h: 874, alt: "The 2026 technical graduate cohort." },
  },
  {
    // What we published.
    span: { xs: "1 / -1", md: "5 / span 8" },
    rotate: "-0.5deg",
    aspect: "21 / 9",
    img: { src: "/images/AboutPageHero.webp", w: 1920, h: 1080, alt: "The Phitopolis team at work in the Manila office." },
  },
] as const;

export function ClosingShelf() {
  const reduced = useReducedMotion();
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.HOME_CLOSING, { dark: true });

  return (
    <Box
      ref={anchorRef}
      component="section"
      id="closing"
      aria-labelledby="closing-heading"
      sx={{
        position: "relative",
        zIndex: 1,
        bgcolor: NOIR.navyField,
        color: NOIR.frost,
        overflow: "hidden",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 10, md: 20 }, position: "relative", zIndex: 2 }}>
        <Typography
          component="p"
          sx={{
            fontFamily: MONO,
            fontSize: "0.72rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: NOIR.gold,
            mb: { xs: 3, md: 4 },
          }}
        >
          In closing
        </Typography>

        {/* The shelf. `auto-fit` is deliberately NOT used — the whole point is that
            these four do not share a size, so the columns are explicit. */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(12, 1fr)" },
            gap: { xs: 2.5, md: 3 },
            mb: { xs: 8, md: 12 },
          }}
        >
          {CONTENT.closing.shelf.map((frame, index) => {
            const layout = FRAME_LAYOUT[index] ?? FRAME_LAYOUT[0];
            return (
              <Box
                key={frame.id}
                sx={{
                  gridColumn: layout.span,
                  display: "flex",
                  flexDirection: "column",
                  // The polaroid chassis, matching JourneyTimeline's ScatterPhoto:
                  // white border, 8px radius, deep shadow, small rotation.
                  borderRadius: "8px",
                  border: `3px solid ${NOIR.white}`,
                  bgcolor: "rgba(255,255,255,0.04)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
                  overflow: "hidden",
                  // Reduced motion keeps the frames square-on: the tilt is decorative,
                  // and a static rotation still reads as movement to a vestibular user.
                  transform: reduced === true ? "none" : `rotate(${layout.rotate})`,
                  transition: "transform 0.4s ease",
                  "&:hover, &:focus-within": {
                    transform: reduced === true ? "none" : "rotate(0deg) translateY(-4px)",
                  },
                }}
              >
                {/* The aspect lives on this wrapper, not on the <img>.
                    `<Box component="img" width={1920} height={1080}>` does NOT set the
                    HTML attributes — MUI treats `width`/`height` as system STYLE props,
                    so those numbers became `height: 1080px` in CSS and beat the
                    aspect-ratio. The frames rendered ~1100px tall. A plain <img> keeps
                    the attributes as attributes, which is what reserves the box against
                    layout shift, and CSS sizes it inside this wrapper. */}
                <Box
                  sx={{
                    width: "100%",
                    // The photo is the frame's subject; the copy sits under it like a
                    // polaroid caption. Aspect is per-frame — see FRAME_LAYOUT.
                    aspectRatio: { xs: "16 / 9", md: layout.aspect },
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={layout.img.src}
                    alt={layout.img.alt}
                    width={layout.img.w}
                    height={layout.img.h}
                    loading="lazy"
                    decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </Box>
                <Box sx={{ p: { xs: 3, md: 3.5 }, display: "flex", flexDirection: "column", flexGrow: 1 }}>
                  <Typography
                    component="p"
                    sx={{
                      fontFamily: MONO,
                      fontSize: "0.68rem",
                      letterSpacing: "0.16em",
                      color: NOIR.gold,
                      mb: 1.5,
                    }}
                  >
                    {frame.kicker} — {frame.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: "1.05rem", md: index < 2 ? "1.35rem" : "1.1rem" },
                      lineHeight: 1.5,
                      // Measure in ch, so it tracks the type rather than the container.
                      maxWidth: "46ch",
                      color: NOIR.frost,
                    }}
                  >
                    {frame.line}
                  </Typography>

                  <Box
                    component={Link}
                    to={frame.href}
                    sx={{
                      // `mt: auto` pins the link to the bottom of the caption block, so
                      // the four links sit on a common baseline even though the copy
                      // above them runs to different lengths.
                      mt: "auto",
                      pt: 2.5,
                      alignSelf: "flex-start",
                      fontFamily: MONO,
                      fontSize: "0.72rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: NOIR.gold,
                      textDecoration: "none",
                      "& span": { borderBottom: `1px solid ${NOIR.gold}`, pb: "2px" },
                      "&:hover span": { color: NOIR.goldLight, borderColor: NOIR.goldLight },
                    }}
                  >
                    <span>{frame.cta} →</span>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* The closing remark. It answers the hero rather than repeating it — see the
            note on `CONTENT.closing.statement`. One primary action beneath it, and
            only one: the shelf's four links are all secondary by treatment. */}
        <Typography
          id="closing-heading"
          variant="h2"
          component="h2"
          sx={{
            fontSize: { xs: "2rem", md: "3.5rem" },
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            fontWeight: 700,
            maxWidth: "24ch",
            mb: { xs: 4, md: 5 },
          }}
        >
          {CONTENT.closing.statement}
        </Typography>

        <Box
          component={Link}
          to="/careers"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.5,
            px: 4,
            py: 2,
            bgcolor: NOIR.gold,
            // Navy on gold is 8.76:1. White on gold would be 1.56:1 — the theme's
            // `secondary.contrastText` still says white, which is why this is explicit.
            color: NOIR.navyField,
            fontFamily: MONO,
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            borderRadius: "var(--r-control, 8px)",
            textDecoration: "none",
            "&:hover": { bgcolor: NOIR.goldLight },
          }}
        >
          {CONTENT.closing.farewell} →
        </Box>
      </Container>
    </Box>
  );
}
