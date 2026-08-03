import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Masonry from "@mui/lab/Masonry";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "@tanstack/react-router";

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
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => {
        void navigate({ to: "/blog/$slug", params: { slug: post.slug } });
      }}
      sx={{
        cursor: "pointer",
        transition: "background-color 0.2s ease-in-out",
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.6),
        backdropFilter: "blur(12px)",
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.divider, 0.2),
        "&:hover": {
          backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
        }
      }}
    >
      {post.image_url ? (
        <Box
          component="img" decoding="async"
          src={post.image_url}
          alt=""
          loading="lazy"
          sx={{
            width: "100%",
            aspectRatio: isHero ? "21/9" : "16/9",
            objectFit: "cover",
            display: "block",
            borderBottom: 1,
            borderColor: "divider",
          }}
        />
      ) : (
        <Box
          sx={{
            width: "100%",
            aspectRatio: isHero ? "21/9" : "16/9",
            background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
            display: "block",
            borderBottom: 1,
            borderColor: "divider",
          }}
        />
      )}
      <CardContent sx={{ p: 3, pb: 0 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color="text.secondary">
              {DATE_FORMAT.format(new Date(post.published_on))}
            </Typography>
            {post.featured ? (
              <Chip label="Featured" size="small" color="primary" variant="outlined" />
            ) : null}
          </Stack>
          <Typography 
            variant={isHero ? "h3" : "h4"} 
            component="h3"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.2,
              minHeight: "2.4em",
            }}
          >
            {post.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {post.excerpt}
          </Typography>
        </Stack>
      </CardContent>
      <Box sx={{ px: 3, pb: 3, pt: 2 }}>
        <Chip
          label={post.category}
          size="small"
          color={post.category === activeCategory ? "primary" : "default"}
          variant={post.category === activeCategory ? "filled" : "outlined"}
          onClick={(e) => {
            e.stopPropagation();
            onCategoryChange(post.category === activeCategory ? null : post.category);
          }}
        />
      </Box>
    </Card>
  );
}

interface BlogPostListProps {
  page: BlogPostPage;
  /** True while a previous page is shown as placeholder during a refetch. */
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
  const masonryPosts = page.items.filter((_, index) => index !== heroPostIndex);

  return (
    <Stack spacing={4} sx={{ opacity: isRefreshing ? 0.6 : 1, transition: "opacity .2s" }}>
      {activeCategory === null ? null : (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Filtered by
          </Typography>
          <Chip
            label={activeCategory}
            size="small"
            color="primary"
            onDelete={() => {
              onCategoryChange(null);
            }}
          />
        </Stack>
      )}
      
      {page.items.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No posts match this search or filter.
        </Typography>
      ) : (
        <>
          {heroPost && (
            <Box mb={1}>
              <BlogPostCard
                post={heroPost}
                activeCategory={activeCategory}
                onCategoryChange={onCategoryChange}
                isHero
              />
            </Box>
          )}
          
          {masonryPosts.length > 0 && (
            <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={3}>
              {masonryPosts.map((post) => (
                <BlogPostCard
                  key={post.id}
                  post={post}
                  activeCategory={activeCategory}
                  onCategoryChange={onCategoryChange}
                />
              ))}
            </Masonry>
          )}
        </>
      )}
      
      {pageCount > 1 ? (
        <Pagination
          count={pageCount}
          page={currentPage}
          onChange={(_event, value) => {
            onPageChange(value);
          }}
        />
      ) : null}
    </Stack>
  );
}
