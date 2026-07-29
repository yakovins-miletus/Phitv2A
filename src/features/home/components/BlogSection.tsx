import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { blogPostsQuery } from "@/features/blog/api";
import { FALLBACK_BLOG_PAGE } from "@/features/blog/fallback";
import { CONTENT } from "@/shared/content";
import { Reveal } from "@/shared/components/Reveal";
import { RouterButton } from "@/shared/components/RouterLink";
import { SectionLede } from "@/shared/components/SectionLede";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";

// Intelligence Feed — the blog rail.
export function BlogSection() {
  const page = useQuery(blogPostsQuery({ limit: 10, offset: 0 }));
  const posts = page.data?.items ?? FALLBACK_BLOG_PAGE.items;
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth, children } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);

      let currentActive = 0;
      let minDistance = Infinity;
      Array.from(children).forEach((child, index) => {
        const childHtml = child as HTMLElement;
        const distance = Math.abs(childHtml.offsetLeft - scrollLeft);
        if (distance < minDistance) {
          minDistance = distance;
          currentActive = index;
        }
      });
      setActiveIndex(currentActive);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll, { passive: true });
      return () => {
        currentRef.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [checkScroll]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -384, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 384, behavior: "smooth" });
    }
  };

  const slicedPosts = posts.slice(0, 7);

  return (
    <StageSection section={homeSection("blog")} muted>
      <Reveal>
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <SectionLede
            gunshot={CONTENT.ledes.blog.gunshot}
            tracer={CONTENT.ledes.blog.tracer}
            eyebrow="Intelligence Feed"
          />
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0, display: { xs: "none", md: "flex" } }}>
            <IconButton disabled={!canScrollLeft} onClick={scrollLeft} aria-label="Previous posts" sx={{ border: 1, borderColor: "divider", bgcolor: "background.paper", "&:hover": { bgcolor: "action.hover" } }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </IconButton>
            <IconButton disabled={!canScrollRight} onClick={scrollRight} aria-label="Next posts" sx={{ border: 1, borderColor: "divider", bgcolor: "background.paper", "&:hover": { bgcolor: "action.hover" } }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </IconButton>
          </Stack>
        </Stack>
      </Reveal>
      <Reveal delay={0.1}>
        <Box
          ref={scrollRef}
          sx={{
            display: "flex",
            overflowX: "auto",
            gap: 3,
            pb: 2,
            scrollSnapType: "x mandatory",
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
          }}
        >
          {slicedPosts.map((post) => {
            return (
              <Card
                key={post.id}
                sx={{
                  flexShrink: 0,
                  width: { xs: 280, md: 360 },
                  display: "flex",
                  flexDirection: "column",
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.default",
                  scrollSnapAlign: "start",
                }}
              >
                <CardActionArea
                  onClick={() => {
                    void navigate({ to: "/blog/$slug", params: { slug: post.slug } });
                  }}
                  sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start" }}
                >
                  {post.image_url ? (
                    <Box
                      component="img"
                      src={post.image_url}
                      alt=""
                      loading="lazy"
                      sx={{
                        width: "100%",
                        aspectRatio: "16/9",
                        objectFit: "cover",
                        display: "block",
                        borderBottom: 1,
                        borderColor: "divider",
                      }}
                    />
                  ) : (
                    <Box sx={{ width: "100%", aspectRatio: "16/9", bgcolor: "divider", borderBottom: 1, borderColor: "divider" }} />
                  )}
                  <CardContent sx={{ flexGrow: 1, width: "100%" }}>
                    <Typography variant="overline" color="primary" gutterBottom>{post.category}</Typography>
                    <Typography variant="h5" sx={{ mb: 1, mt: 0.5 }}>{post.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {post.excerpt}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 3, display: "flex" }}>
          {slicedPosts.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: activeIndex === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: activeIndex === index ? "primary.main" : "divider",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
              }}
              onClick={() => {
                if (scrollRef.current) {
                  const children = scrollRef.current.children;
                  const target = children[index] as HTMLElement;
                  if (target) {
                    scrollRef.current.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
                  }
                }
              }}
            />
          ))}
        </Stack>
      </Reveal>
      <Reveal delay={0.15}>
        <Stack direction="row" sx={{ mt: 2 }}>
          <RouterButton to="/blog" variant="outlined">
            View all posts →
          </RouterButton>
        </Stack>
      </Reveal>
    </StageSection>
  );
}