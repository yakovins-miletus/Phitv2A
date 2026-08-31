import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import { useState } from "react";

import { blogPostsQuery, type BlogPostSummary } from "@/features/blog/api";
import { FALLBACK_BLOG_PAGE } from "@/features/blog/fallback";
import { resolveApiUrl } from "@/shared/api/client";
import { Reveal } from "@/shared/components/Reveal";
import { RouterLink } from "@/shared/components/RouterLink";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { MiniEstablishingShot } from "@/shared/components/establishing/MiniEstablishingShot";
import { aboutSection } from "@/shared/sections";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";


import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "RECENT";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  } catch {
    return "RECENT";
  }
}

// Side Story Card Component with Phitopolis Logo Background
function SideArticleCard({
  post,
  index,
}: {
  post: BlogPostSummary;
  index: number;
}) {
  return (
    <Reveal delay={0.15 + index * 0.08} style={{ display: "flex", flex: 1 }}>
      {/* A real anchor, not a clickable <Box>.
          This was `<Box onClick={navigate(...)} sx={{cursor:"pointer"}}>` with no
          role, tabIndex or key handler — so the whole card was invisible to the
          keyboard, unannounced by screen readers, and could not be opened in a
          new tab or middle-clicked. Rendering the link the browser already has
          gives all of that back for free, and is strictly less code than
          bolting role/tabIndex/onKeyDown onto a div would have been.

          Hover also moved from React state to CSS `:hover` + `&:hover .class`
          descendants. It reads the same, but it no longer re-renders the card
          (and its image, watermark and three Typographys) twice per pointer
          crossing, and it keeps working under `:focus-visible` for keyboard
          users, which the old mouse-only handlers never did. */}
      <RouterLink
        to="/blog/$slug"
        params={{ slug: post.slug }}
        underline="none"
        sx={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 3,
          p: { xs: 2.5, md: 3 },
          // Corner + elevation from the glass system rather than local values
          // (was `borderRadius: 3.5` = 14px and two hand-rolled black shadows).
          borderRadius: "var(--r-card)",
          bgcolor: `rgba(${NOIR.navyInkRgb}, 0.75)`,
          border: "1px solid",
          borderColor: `rgba(${NOIR.whiteRgb}, 0.08)`,
          boxShadow: "var(--glass-shadow-1)",
          transition: `background-color 0.35s ${EASE_OUT_EXPO_CSS}, border-color 0.35s ${EASE_OUT_EXPO_CSS}, transform 0.35s ${EASE_OUT_EXPO_CSS}, box-shadow 0.35s ${EASE_OUT_EXPO_CSS}`,
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },

          "&:hover, &:focus-visible": {
            bgcolor: `rgba(${NOIR.navyFieldRgb}, 0.55)`,
            borderColor: `rgba(${NOIR.goldRgb}, 0.4)`,
            transform: "translateY(-3px)",
            boxShadow: "var(--glass-shadow-3)",
          },
          "&:focus-visible": { outline: `2px solid ${NOIR.gold}`, outlineOffset: "3px" },

          // Child reactions, previously six `hovered ? a : b` ternaries driven
          // by React state. Keyed off the same :hover/:focus-visible pair so
          // the card animates identically for pointer and keyboard.
          "&:hover .blogcard-watermark, &:focus-visible .blogcard-watermark": {
            transform: "translateY(-50%) scale(1.08)",
            opacity: 0.16,
            filter: `drop-shadow(0 0 16px rgba(${NOIR.goldRgb}, 0.25))`,
          },

          "&:hover .blogcard-title, &:focus-visible .blogcard-title": { color: NOIR.frost },
          "&:hover .blogcard-arrow, &:focus-visible .blogcard-arrow": { transform: "translateX(4px)" },
        }}
      >
        {/* Phitopolis Vector Logo Watermark in Container Background */}
        <Box
          aria-hidden="true"
          className="blogcard-watermark"
          sx={{
            position: "absolute",
            right: { xs: -30, sm: -20 },
            top: "50%",
            transform: "translateY(-50%) scale(1)",
            width: { xs: 160, sm: 220 },
            height: { xs: 160, sm: 220 },
            backgroundImage: "url('/phitopolis_logo_hero.svg')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "contain",
            opacity: 0.07,
            pointerEvents: "none",
            zIndex: 0,
            transition: `opacity 0.4s ${EASE_OUT_EXPO_CSS}, transform 0.4s ${EASE_OUT_EXPO_CSS}`,
            filter: "none",
          }}
        />

        {/* Thumbnail Image */}
        {post.image_url && (
          <Box
            sx={{
              width: { xs: "100%", sm: 140 },
              height: { xs: 160, sm: 110 },
              flexShrink: 0,
              borderRadius: 2.5,
              overflow: "hidden",
              position: "relative",
              zIndex: 1,
              border: `1px solid rgba(${NOIR.whiteRgb}, 0.1)`,
            }}
          >
            <Box
              component="img"
              // This section sits ~24,000px down the home page — roughly 27
              // viewports past the fold — and these cards were loading eagerly,
              // spending ~1MB of the initial page load on imagery nobody has
              // scrolled to. The browser's lazy threshold still fetches well
              // before the section enters view, so nothing pops in.
              loading="lazy"
              decoding="async"
              src={resolveApiUrl(post.image_url)}
              alt=""
              className="blogcard-thumb"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </Box>
        )}

        {/* Content Details */}
        <Stack spacing={1} sx={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* `micro` is the mono meta-rail variant — MONO family, 0.6875rem,
                uppercase, wide tracking — so all four of those declarations
                come from the theme now instead of being restated here. */}
            <Typography variant="micro" sx={{ fontWeight: 700, color: NOIR.gold }}>
              {post.category}
            </Typography>
            <Typography variant="micro" sx={{ color: `rgba(${NOIR.frostRgb}, 0.4)` }}>
              · {formatDate(post.published_on)}
            </Typography>
          </Stack>

          <Typography
            variant="h4"
            className="blogcard-title"
            sx={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 700,
              fontSize: { xs: "1.1rem", md: "1.15rem" },
              lineHeight: 1.25,
              letterSpacing: "-0.015em",
              color: `rgba(${NOIR.frostRgb}, 0.92)`,
              transition: "color 0.2s ease",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.title}
          </Typography>

          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.75rem",
              color: `rgba(${NOIR.frostRgb}, 0.5)`,
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              mt: 0.5,
            }}
          >
            READ ARTICLE
            <Box
              component="span"
              className="blogcard-arrow"
              sx={{
                transition: "transform 0.2s ease",
                transform: "translateX(0)",
                color: NOIR.gold,
              }}
            >
              →
            </Box>
          </Typography>
        </Stack>
      </RouterLink>
    </Reveal>
  );
}

// Intelligence Feed — the editorial blog showcase
export function BlogSection() {
  const page = useQuery(blogPostsQuery({ limit: 4, offset: 0 }));
  const posts = page.data?.items ?? FALLBACK_BLOG_PAGE.items;
  const navigate = useNavigate();

  const [featuredHovered, setFeaturedHovered] = useState(false);

  const featuredPost = posts[0];
  const sidePosts = posts.slice(1, 4);

  if (!featuredPost) return null;

  return (
    <SectionBeat
      section={aboutSection("blog")}
      // Was "Mini Establishing Shot 6" in routes/index.tsx; see CapabilityRack.
      establishing={
        <MiniEstablishingShot
          selfDriven={false}
          title="Inside"
          titleAccent="Phitopolis"
          tracer="Fresh technical dispatches from our quantitative labs, systems engineers, and market strategists."
          dark
        />
      }
    >
      <Box
        sx={{
          minHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          py: { xs: 8, md: 12 },
          width: "100%",
        }}
      >
        {/* Editorial Section Header */}
        <Reveal>
          <Box
            sx={{
              mb: { xs: 5, md: 7 },
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              pb: 3,
            }}
          >
            <Button
              onClick={() => void navigate({ to: "/blog" })}
              sx={{
                fontFamily: MONO,
                fontSize: "0.75rem",
                letterSpacing: "0.16em",
                color: NOIR.gold,
                bgcolor: "rgba(255, 199, 44, 0.08)",
                border: "1px solid rgba(255, 199, 44, 0.25)",
                borderRadius: 2,
                px: 2.5,
                py: 1,
                "&:hover": {
                  bgcolor: "rgba(255, 199, 44, 0.16)",
                  borderColor: NOIR.gold,
                },
              }}
            >
              EXPLORE ALL DISPATCHES →
            </Button>
          </Box>
        </Reveal>

        {/* Magazine Bento Grid */}
        <Grid container spacing={3.5} alignItems="stretch" sx={{ width: "100%" }}>
          {/* Main Flagship Story Card */}
          <Grid size={{ xs: 12, lg: 7 }} sx={{ display: "flex", flexDirection: "column" }}>
            <Reveal delay={0.1} style={{ flex: 1, display: "flex" }}>
              <Box
                onClick={() => void navigate({ to: "/blog/$slug", params: { slug: featuredPost.slug } })}
                onMouseEnter={() => setFeaturedHovered(true)}
                onMouseLeave={() => setFeaturedHovered(false)}
                sx={{
                  position: "relative",
                  flex: 1,
                  minHeight: { xs: 420, md: 540 },
                  borderRadius: 4,
                  overflow: "hidden",
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: featuredHovered ? "rgba(255, 199, 44, 0.45)" : "rgba(255, 255, 255, 0.1)",
                  boxShadow: featuredHovered ? "0 24px 48px rgba(0, 0, 0, 0.4)" : "0 8px 24px rgba(0, 0, 0, 0.2)",
                  transition: `all 0.4s ${EASE_OUT_EXPO_CSS}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                {/* Background Image */}
                {featuredPost.image_url && (
                  <Box
                    component="img"
                    // Lazy for the same reason as the side cards above: far
                    // below the fold, and this is the largest single image the
                    // home page pulls (the featured post's full-size frame).
                    loading="lazy"
                    decoding="async"
                    src={resolveApiUrl(featuredPost.image_url)}
                    alt=""
                    sx={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}

                {/* Cinematic Gradient Scrim */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(6, 18, 38, 0.95) 0%, rgba(6, 18, 38, 0.6) 50%, rgba(6, 18, 38, 0.2) 100%)",
                  }}
                />

                {/* Card Content Overlay */}
                <Box
                  sx={{
                    position: "relative",
                    zIndex: 2,
                    p: { xs: 3.5, md: 5 },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.25,
                        py: 0.5,
                        bgcolor: "rgba(255, 199, 44, 0.15)",
                        border: "1px solid rgba(255, 199, 44, 0.3)",
                        borderRadius: 1.5,
                      }}
                    >
                      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: NOIR.gold }} />
                      <Typography
                        sx={{
                          color: NOIR.gold,
                          fontWeight: 700,
                          letterSpacing: "0.15em",
                          fontFamily: MONO,
                          fontSize: "0.6875rem",
                          textTransform: "uppercase",
                        }}
                      >
                        {featuredPost.category}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontFamily: MONO,
                        fontSize: "0.6875rem",
                        color: "rgba(244, 247, 252, 0.6)",
                      }}
                    >
                      · {formatDate(featuredPost.published_on)}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="h2"
                    component="h3"
                    sx={{
                      color: NOIR.frost,
                      fontFamily: DISPLAY_FONT,
                      fontWeight: 800,
                      mb: 2,
                      fontSize: { xs: "1.85rem", md: "2.75rem" },
                      lineHeight: 1.08,
                      letterSpacing: "-0.025em",
                    }}
                  >
                    {featuredPost.title}
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: "rgba(244, 247, 252, 0.8)",
                      maxWidth: 640,
                      fontSize: { xs: "0.95rem", md: "1.05rem" },
                      lineHeight: 1.6,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      mb: 3,
                    }}
                  >
                    {featuredPost.excerpt}
                  </Typography>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      sx={{
                        fontFamily: MONO,
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        color: NOIR.gold,
                      }}
                    >
                      READ FULL DISPATCH
                    </Typography>
                    <Box
                      component="span"
                      sx={{
                        color: NOIR.gold,
                        transition: "transform 0.2s ease",
                        transform: featuredHovered ? "translateX(6px)" : "translateX(0)",
                      }}
                    >
                      →
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Reveal>
          </Grid>

          {/* Secondary Stacked Story Column */}
          <Grid size={{ xs: 12, lg: 5 }} sx={{ display: "flex", flexDirection: "column" }}>
            <Stack spacing={2.5} sx={{ flex: 1, justifyContent: "space-between" }}>
              {sidePosts.map((post, i) => (
                <SideArticleCard key={post.id} post={post} index={i} />
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </SectionBeat>
  );
}