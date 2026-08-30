import { NOIR } from "@/shared/theme/palette";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import Grid from "@mui/material/Grid";
import { useNavigate } from "@tanstack/react-router";

import { MONO } from "@/shared/theme/theme";
import { Reveal } from "@/shared/components/Reveal";
import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { useNavbarAnchor } from "@/shared/components/navbarHooks";
import { BLOG_LOOP, useBackgroundVideo } from "@/shared/components/useBackgroundVideo";
import type { BlogPostSummary } from "../api";

interface BlogVideoHeroProps {
  featuredPost?: BlogPostSummary | null | undefined;
}

export function BlogVideoHero({ featuredPost }: BlogVideoHeroProps) {
  const heroAnchorRef = useNavbarAnchor(NAV_ANCHORS.BLOG_HERO, { dark: true });
  const { containerRef, videoRef, shouldLoad, posterOnly } = useBackgroundVideo();
  const navigate = useNavigate();

  return (
    <Box
      ref={heroAnchorRef}
      sx={{
        position: "relative",
        minHeight: { xs: "85vh", md: "90vh" },
        width: "100%",
        bgcolor: NOIR.navyDeep,
        color: "common.white",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Box
        ref={containerRef}
        aria-hidden
        sx={{ position: "absolute", inset: 0, filter: "brightness(0.7) contrast(1.1)" }}
      >
        <Box
          component="video"
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={BLOG_LOOP.poster}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        >
          {!posterOnly && shouldLoad && (
            <>
              <source src={BLOG_LOOP.webm} type="video/webm" />
              <source src={BLOG_LOOP.mp4} type="video/mp4" />
            </>
          )}
        </Box>
      </Box>

      {/* Gradient Overlay for better readability on left side */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, rgba(6, 24, 59, 0.95) 0%, rgba(6, 24, 59, 0.4) 60%, rgba(6, 24, 59, 0.1) 100%)",
        }}
      />

      {/* Hero Content */}
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, px: { xs: 3, md: 8 }, pt: { xs: 12, md: 24 }, pb: { xs: 12, md: 12 } }}>
        <Grid container spacing={8} alignItems="center">
          <Grid size={{ xs: 12, md: 6, lg: 5 }}>
            <Stack spacing={4}>
              <Reveal>
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
                  <AutoAwesomeIcon sx={{ color: "var(--accent-ink)", fontSize: "1.2rem" }} />
                  <Typography
                    variant="overline"
                    sx={{
                      color: "var(--accent-ink)",
                      fontWeight: 800,
                      letterSpacing: "0.2em",
                      fontSize: "0.85rem",
                      fontFamily: MONO,
                      textShadow: "0 2px 8px rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    INSIGHTS & ENGINEERING
                  </Typography>
                </Box>
              </Reveal>

              <Reveal delay={0.1}>
                <Typography
                  variant="h1"
                  component="h1"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: "2.8rem", sm: "4rem", md: "5rem" },
                    lineHeight: 1.05,
                    letterSpacing: "-0.02em",
                    color: "common.white",
                    textShadow: "0 4px 20px rgba(0, 0, 0, 0.85)",
                  }}
                >
                  Direct Logs from R&D.
                </Typography>
              </Reveal>

              <Reveal delay={0.2}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "rgba(255, 255, 255, 0.85)",
                    fontSize: { xs: "1.1rem", md: "1.3rem" },
                    lineHeight: 1.6,
                    fontWeight: 400,
                    maxWidth: 500,
                  }}
                >
                  Architectural decisions, benchmarks, and postmortems from the team building Phitopolis platforms.
                </Typography>
              </Reveal>
            </Stack>
          </Grid>

          {/* Right Side Spatial Card (if featured post exists) */}
          <Grid size={{ xs: 12, md: 6, lg: 7 }} sx={{ display: { xs: "none", md: "block" } }}>
            <Reveal delay={0.3}>
              {featuredPost && (
                <Box
                  sx={{ width: "100%", maxWidth: 640, ml: "auto" }}
                  onClick={() => navigate({ to: "/blog/$slug", params: { slug: featuredPost.slug } })}
                >
                  <Box
                    sx={{
                      position: "relative",
                      borderRadius: 24,
                      cursor: "pointer",
                      transition: "transform 0.3s ease",
                      "&:hover": { transform: "translateY(-4px)" }
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        borderRadius: "24px",
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                        bgcolor: "rgba(6, 24, 59, 0.6)",
                        backdropFilter: "blur(12px)",
                        aspectRatio: "16/9",
                      }}
                    >
                      {featuredPost.image_url && (
                        <Box
                          component="img"
                          src={featuredPost.image_url}
                          alt={featuredPost.title}
                          sx={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: 0.6,
                            transition: "opacity 0.4s",
                            ".MuiBox-root:hover &": { opacity: 0.8 }
                          }}
                        />
                      )}
                      <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 0%, rgba(6,24,59,0.9) 100%)" }} />
                      
                      <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, p: 5, transform: "translateZ(30px)" }}>
                        <Stack spacing={2}>
                          <Typography variant="overline" sx={{ color: "var(--accent-ink)", fontWeight: 700, letterSpacing: "0.1em" }}>
                            FEATURED ARTICLE
                          </Typography>
                          <Typography variant="h3" sx={{ color: "white", fontWeight: 800, lineHeight: 1.1 }}>
                            {featuredPost.title}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </Reveal>
          </Grid>
        </Grid>
      </Container>

    </Box>
  );
}
