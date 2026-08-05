import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

import { blogPostsQuery } from "@/features/blog/api";
import { FALLBACK_BLOG_PAGE } from "@/features/blog/fallback";
import { Reveal } from "@/shared/components/Reveal";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

// Intelligence Feed — the immersive blog showcase.
export function BlogSection() {
  const page = useQuery(blogPostsQuery({ limit: 4, offset: 0 }));
  const posts = page.data?.items ?? FALLBACK_BLOG_PAGE.items;
  const navigate = useNavigate();

  const featuredPost = posts[0];
  const sidePosts = posts.slice(1, 4);

  if (!featuredPost) return null;

  return (
    <StageSection section={homeSection("blog")}>
      <Reveal>
        <Box sx={{ mb: 6, px: { xs: 2, md: 5 } }}>
          <Typography variant="overline" sx={{ fontFamily: MONO, color: NOIR.gold, letterSpacing: "0.2em", fontSize: "0.9rem" }}>
            INTELLIGENCE FEED
          </Typography>
        </Box>
      </Reveal>

      <Box sx={{ px: { xs: 2, md: 5 } }}>
        <Grid container spacing={3} alignItems="stretch">
          {/* Featured Post */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Reveal delay={0.1} style={{ height: "100%" }}>
              <Box
                onClick={() => void navigate({ to: "/blog/$slug", params: { slug: featuredPost.slug } })}
                sx={{
                  position: "relative",
                  height: { xs: "60vh", md: "100%" },
                  minHeight: 500,
                  borderRadius: 4,
                  overflow: "hidden",
                  cursor: "pointer",
                  "&:hover img": { transform: "scale(1.05)" },
                }}
              >
                {featuredPost.image_url && (
                  <Box
                    component="img"
                    src={featuredPost.image_url}
                    alt=""
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                )}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(10,42,102,0.95) 0%, rgba(10,42,102,0.2) 60%, transparent 100%)",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    p: { xs: 4, md: 6 },
                  }}
                >
                  <Typography variant="overline" sx={{ color: NOIR.gold, fontWeight: 700, letterSpacing: "0.15em", fontFamily: MONO, display: "block", mb: 2 }}>
                    {featuredPost.category}
                  </Typography>
                  <Typography variant="h2" sx={{ color: "white", fontWeight: 800, mb: 3, fontSize: { xs: "2.5rem", md: "4.5rem" }, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                    {featuredPost.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", maxWidth: 700, fontSize: "1.2rem", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {featuredPost.excerpt}
                  </Typography>
                </Box>
              </Box>
            </Reveal>
          </Grid>

          {/* Side Posts */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3} sx={{ height: "100%" }}>
              {sidePosts.map((post, i) => (
                <Reveal key={post.id} delay={0.2 + i * 0.1} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <Box
                    onClick={() => void navigate({ to: "/blog/$slug", params: { slug: post.slug } })}
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      p: { xs: 4, md: 5 },
                      borderRadius: 4,
                      bgcolor: "rgba(255,255,255,0.03)",
                      border: "1px solid",
                      borderColor: "rgba(255,255,255,0.1)",
                      cursor: "pointer",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      overflow: "hidden",
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.06)",
                        borderColor: "rgba(255,255,255,0.2)",
                        transform: "translateY(-4px)",
                      },
                    }}
                  >
                    <Typography variant="overline" sx={{ color: NOIR.gold, fontWeight: 700, fontFamily: MONO, letterSpacing: "0.1em", mb: 2 }}>
                      {post.category}
                    </Typography>
                    <Typography variant="h4" sx={{ color: "white", fontWeight: 700, mb: 2, fontSize: "1.75rem", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                      {post.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "1.05rem", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {post.excerpt}
                    </Typography>
                  </Box>
                </Reveal>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </StageSection>
  );
}