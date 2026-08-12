import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";

import { CONTENT } from "@/shared/content";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";
import { useNavbarAnchor, NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

/**
 * ── WHY PICTURE FRAMES, AND WHY THEY CAME BACK ───────────────────────────────
 *
 * This is not a new visual language. `features/about/components/JourneyTimeline`
 * renders its photos as scattered polaroids — 3px white border, 8px radius, a
 * deep shadow, a small rotation. The shelf borrows exactly that treatment, so the
 * closing section reads as the About timeline's language brought onto the home
 * page. A distinctive treatment used twice in agreement is a system; used once it
 * is noise.
 *
 * Alpha 0.2.1 replaced the polaroid chassis with `rgba(255,255,255,0.03)` cards
 * and a 6% hairline. On the navy ground that is a 3%-white rectangle on a navy
 * rectangle: the frames stopped being objects on a shelf and became four faint
 * outlines, which is what "the white frames are gone" describes. The chassis is
 * restored here; everything else 0.2.1 changed — the enclosing panel, the
 * statement bar, the label copy — is left as it is.
 *
 * The rotation is the one thing that must stay small (≤1.2deg): past that the
 * frames read as a scrapbook rather than a mantelpiece, and the copy inside stops
 * being comfortable to read.
 *
 * Per-frame geometry and photo. Index matches `CONTENT.closing.shelf` order. The
 * spans are 8/4 and 4/8, not 7/5 and 5/7: a near-equal split reads as a mistake
 * rather than a decision, and a 2:1 ratio gives the eye somewhere to land first.
 * Every photo is a local WebP already in `public/images`, declared with explicit
 * `width`/`height` so the frame reserves its box before the image arrives.
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
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Container 
        maxWidth="xl" 
        sx={{ 
          py: { xs: 8, md: 10 }, 
          position: "relative", 
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flexGrow: 1,
        }}
      >
        <Box
          sx={{
            position: "relative",
            bgcolor: NOIR.white,
            backgroundImage: `radial-gradient(circle, ${NOIR.hairline} 1.5px, transparent 1.5px)`,
            backgroundSize: "24px 24px",
            borderRadius: "32px",
            border: `2px solid ${NOIR.hairline}`,
            borderBottom: "16px solid #8B4513",
            boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
            p: { xs: 4, md: 8 },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography
            component="p"
            sx={{
              fontFamily: MONO,
              fontSize: "0.72rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: NOIR.navyField,
              mb: { xs: 4, md: 6 },
            }}
          >
            In closing
          </Typography>

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
                    position: "relative",
                    // The polaroid chassis, matching JourneyTimeline's ScatterPhoto:
                    // white border, 8px radius, deep shadow, small rotation.
                    borderRadius: "8px",
                    border: `3px solid ${NOIR.white}`,
                    bgcolor: NOIR.white,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
                    overflow: "hidden",
                    // Reduced motion keeps the frames square-on: the tilt is decorative,
                    // and a static rotation still reads as movement to a vestibular user.
                    transform: reduced === true ? "none" : `rotate(${layout.rotate})`,
                    transition: `transform 0.4s ${EASE_OUT_EXPO_CSS}`,
                    "&:hover, &:focus-within": {
                      transform: reduced === true ? "none" : "rotate(0deg) translateY(-4px)",
                    },
                  }}
                >
                  {/* Red pushpin */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: "12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      bgcolor: "#d32f2f",
                      boxShadow: "inset -2px -2px 4px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.4)",
                      zIndex: 10,
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        top: "3px",
                        left: "4px",
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.7)",
                      }
                    }}
                  />

                  <Box
                    sx={{
                      width: "100%",
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
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover", 
                        display: "block",
                      }}
                    />
                  </Box>
                  <Box sx={{ p: { xs: 3, md: 4 }, display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <Typography
                      component="p"
                      sx={{
                        fontFamily: MONO,
                        fontSize: "0.68rem",
                        letterSpacing: "0.16em",
                        color: NOIR.goldDark,
                        textTransform: "uppercase",
                        mb: 1.5,
                      }}
                    >
                      {frame.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: "1.05rem", md: index < 2 ? "1.35rem" : "1.1rem" },
                        lineHeight: 1.5,
                        maxWidth: "46ch",
                        color: NOIR.navyField,
                      }}
                    >
                      {frame.line}
                    </Typography>

                    <Box
                      component={Link}
                      to={frame.href}
                      sx={{
                        mt: "auto",
                        pt: 3,
                        alignSelf: "flex-start",
                        fontFamily: MONO,
                        fontSize: "0.72rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: NOIR.navyField,
                        textDecoration: "none",
                        "& span": { borderBottom: `1px solid transparent`, pb: "2px", transition: "border-color 0.2s ease" },
                        "&:hover span": { borderColor: NOIR.navyField },
                      }}
                    >
                      <span>{frame.cta} →</span>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              gap: 4,
              position: "relative",
              bgcolor: NOIR.navyField,
              p: { xs: 4, md: 6 },
              borderRadius: "20px",
              border: "none",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
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
                color: NOIR.white,
              }}
            >
              {CONTENT.closing.statement}
            </Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Box
                component={Link}
                to="/contact"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 4,
                  py: 2,
                  bgcolor: "transparent",
                  color: NOIR.white,
                  border: `1px solid rgba(255,255,255,0.3)`,
                  fontFamily: MONO,
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  borderRadius: "100px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: NOIR.white, transform: "scale(1.02)", bgcolor: "rgba(255,255,255,0.05)" },
                }}
              >
                Contact
              </Box>
              <Box
                component={Link}
                to="/careers"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 4,
                  py: 2,
                  bgcolor: NOIR.white,
                  color: NOIR.navyField,
                  fontFamily: MONO,
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  borderRadius: "100px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "transform 0.2s ease, background-color 0.2s ease",
                  "&:hover": { bgcolor: NOIR.gold, transform: "scale(1.02)" },
                }}
              >
                {CONTENT.closing.farewell} →
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
