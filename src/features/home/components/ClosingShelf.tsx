import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";

import { CONTENT } from "@/shared/content";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { useNavbarAnchor, NAV_ANCHORS } from "@/shared/components/NavbarContext";

const FRAME_LAYOUT = [
  {
    span: { xs: "1 / -1", md: "1 / span 8" },
    aspect: "21 / 9",
    img: { src: "/images/software-engineer-banner.webp", w: 1024, h: 576, alt: "An engineer at work on a trading platform interface." },
  },
  {
    span: { xs: "1 / -1", md: "9 / span 4" },
    aspect: "4 / 3",
    img: { src: "/images/ecotower-bgc.webp", w: 1376, h: 768, alt: "The Phitopolis office tower in Bonifacio Global City, Manila." },
  },
  {
    span: { xs: "1 / -1", md: "1 / span 4" },
    aspect: "4 / 3",
    img: { src: "/images/grads/2026B1Grads.webp", w: 1920, h: 874, alt: "The 2026 technical graduate cohort." },
  },
  {
    span: { xs: "1 / -1", md: "5 / span 8" },
    aspect: "21 / 9",
    img: { src: "/images/AboutPageHero.webp", w: 1920, h: 1080, alt: "The Phitopolis team at work in the Manila office." },
  },
] as const;

export function ClosingShelf() {
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
        maxWidth="lg" 
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
            bgcolor: "rgba(255, 255, 255, 0.02)",
            borderRadius: "32px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)",
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
              color: NOIR.gold,
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
                    borderRadius: "16px",
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      bgcolor: "rgba(255,255,255,0.05)",
                    }
                  }}
                >
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
                        color: NOIR.frost,
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
                        color: NOIR.gold,
                        textDecoration: "none",
                        "& span": { borderBottom: `1px solid transparent`, pb: "2px", transition: "border-color 0.2s ease" },
                        "&:hover span": { borderColor: NOIR.gold },
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
              bgcolor: "rgba(10, 42, 102, 0.4)",
              p: { xs: 4, md: 6 },
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
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
      </Container>
    </Box>
  );
}
