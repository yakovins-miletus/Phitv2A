import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { RouterLink } from "@/shared/components/RouterLink";
import { NOIR } from "@/shared/theme/palette";

import type { BlogPostPage, BlogPostSummary } from "../api";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

interface BlogPostCardProps {
  post: BlogPostSummary;
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  isHero?: boolean;
}

function BlogPostCard({ post, activeCategory, onCategoryChange, isHero = false }: BlogPostCardProps) {
  return (
    <Box sx={{ position: "relative" }}>
      <Box sx={{ position: "relative" }}>
        <Card
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            borderRadius: "48px",
            overflow: "hidden",
            minHeight: { xs: 320, md: 280 },
            border: "1px solid",
            borderColor: "rgba(10, 42, 102, 0.12)",
            boxShadow: "0 4px 20px rgba(10, 42, 102, 0.04)",
            transition: "border-color 0.3s, box-shadow 0.3s, transform 0.3s",
            "&:hover": {
              borderColor: "var(--accent)",
              boxShadow: "0 12px 32px rgba(10, 42, 102, 0.15)",
              transform: "translateY(-4px)"
            }
          }}
        >
          {post.image_url ? (
            <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
              <Box
                component="img"
                decoding="async"
                src={post.image_url}
                alt={post.title}
                loading="lazy"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: {
                    xs: "linear-gradient(180deg, rgba(6, 24, 59, 0.8) 0%, rgba(6, 24, 59, 0.95) 100%)",
                    md: "linear-gradient(90deg, rgba(6, 24, 59, 0.95) 0%, rgba(6, 24, 59, 0.7) 50%, rgba(6, 24, 59, 0.2) 100%)"
                  }
                }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, #06183B 100%)`,
              }}
            />
          )}
          
          {/*
            The whole tile is a genuine link via the stretched-link anchor
            below (after this block). This content layer sits visually above
            it but is `pointer-events: none`, so clicks anywhere in here fall
            through to the anchor — except the category Chip, which opts
            itself back in with `pointer-events: auto`. That keeps the Chip's
            own onClick independently reachable without ever nesting an
            interactive element inside the anchor (nesting is what the
            original onClick-div version effectively did).
          */}
          <CardContent
            sx={{
              position: "relative",
              zIndex: 2,
              pointerEvents: "none",
              p: { xs: 4, md: 5 },
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              width: { xs: "100%", md: "70%", lg: "60%" }
            }}
          >
            <Stack spacing={2} sx={{ mb: "auto" }}>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip
                  label={post.category}
                  size="small"
                  onClick={() => {
                    onCategoryChange(post.category === activeCategory ? null : post.category);
                  }}
                  sx={post.category === activeCategory ? {
                    pointerEvents: "auto",
                    bgcolor: "secondary.main",
                    color: "secondary.contrastText",
                    border: "none",
                    "& .MuiChip-label": { color: "inherit", fontWeight: 700 },
                    "&:hover": { bgcolor: NOIR.goldDark },
                  } : {
                    pointerEvents: "auto",
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                    color: "#FFFFFF",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    backdropFilter: "blur(8px)",
                    "& .MuiChip-label": { color: "inherit", fontWeight: 600 },
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.25)" },
                  }}
                />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                  {DATE_FORMAT.format(new Date(post.published_on))}
                </Typography>
                {post.featured ? (
                  <Chip
                    label="Featured"
                    size="small"
                    sx={{
                      bgcolor: "var(--accent-20)",
                      color: "var(--accent-fg)",
                      border: "1px solid rgba(var(--accent-rgb), 0.5)",
                      "& .MuiChip-label": { color: "inherit", fontWeight: 600 },
                    }}
                  />
                ) : null}
              </Stack>
              
              <Typography 
                variant={isHero ? "h3" : "h4"} 
                component="h3"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: isHero ? 3 : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.2,
                  fontWeight: 700,
                  color: "#FFFFFF"
                }}
              >
                {post.title}
              </Typography>
              
              <Typography
                variant="body1"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: isHero ? 4 : 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.6,
                  color: "rgba(255, 255, 255, 0.85)"
                }}
              >
                {post.excerpt}
              </Typography>
            </Stack>
            
            <Box sx={{ mt: 3, display: "flex", alignItems: "center" }}>
              <Typography variant="button" sx={{ fontWeight: 700, color: "var(--accent-fg)", letterSpacing: "0.05em" }}>
                READ ARTICLE →
              </Typography>
            </Box>
          </CardContent>

          {/* Stretched-link overlay: the tile's real, focusable, crawlable
              <a>. It sits below the content layer above (z-index 1 vs. 2)
              so the Chip can win the hit-test there, but above the
              background image/gradient (z-index 0) everywhere else — which
              is how a click anywhere else on the card still navigates. */}
          <RouterLink
            to="/blog/$slug"
            params={{ slug: post.slug }}
            aria-label={post.title}
            underline="none"
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              borderRadius: "inherit",
              "&:focus-visible": {
                outline: "3px solid var(--accent)",
                outlineOffset: "-3px",
              },
            }}
          />
        </Card>
      </Box>
    </Box>
  );
}

interface BlogPostListProps {
  page: BlogPostPage;
  isRefreshing?: boolean;
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onPageChange: (page: number) => void;
}

export function BlogPostList({
  page,
  isRefreshing = false,
  activeCategory,
  onCategoryChange,
  onPageChange,
}: BlogPostListProps) {
  const pageCount = Math.max(1, Math.ceil(page.total / page.limit));
  const currentPage = Math.floor(page.offset / page.limit) + 1;

  const isPageOne = currentPage === 1;
  const heroPostIndex = isPageOne ? page.items.findIndex(p => p.featured) : -1;
  const heroPost = heroPostIndex !== -1 ? page.items[heroPostIndex] : null;
  const remainingPosts = page.items.filter((_, index) => index !== heroPostIndex);

  return (
    <Stack spacing={6} sx={{ opacity: isRefreshing ? 0.6 : 1, transition: "opacity .2s" }}>
      {activeCategory === null ? null : (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Filtered by
          </Typography>
          <Chip
            label={activeCategory}
            size="small"
            onDelete={() => {
              onCategoryChange(null);
            }}
            sx={{
              bgcolor: "#0A2A66",
              color: "#FFFFFF",
              border: "1px solid #0A2A66",
              fontWeight: 500,
              "& .MuiChip-label": { color: "inherit" },
              "& .MuiChip-deleteIcon": { color: "rgba(255, 255, 255, 0.7)", "&:hover": { color: "#FFFFFF" } }
            }}
          />
        </Stack>
      )}
      
      {page.items.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No posts match this search or filter.
        </Typography>
      ) : (
        <Stack spacing={4}>
          {heroPost && (
            <BlogPostCard
              post={heroPost}
              activeCategory={activeCategory}
              onCategoryChange={onCategoryChange}
              isHero
            />
          )}
          
          {remainingPosts.map((post) => (
            <BlogPostCard
              key={post.id}
              post={post}
              activeCategory={activeCategory}
              onCategoryChange={onCategoryChange}
            />
          ))}
        </Stack>
      )}
      
      {pageCount > 1 ? (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
          <Pagination
            count={pageCount}
            page={currentPage}
            onChange={(_event, value) => {
              onPageChange(value);
            }}
            size="large"
          />
        </Box>
      ) : null}
    </Stack>
  );
}
