import { NOIR } from "@/shared/theme/palette";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Masonry from "@mui/lab/Masonry";
import { useNavigate } from "@tanstack/react-router";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LanguageIcon from "@mui/icons-material/Language";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import BarChartIcon from "@mui/icons-material/BarChart";
import ScienceIcon from "@mui/icons-material/Science";
import TerminalIcon from "@mui/icons-material/Terminal";

import type { InnovationPostPage, InnovationPostSummary } from "../api";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function get2DIconForCategory(category: string, title: string) {
  const catLower = category.toLowerCase();
  const titleLower = title.toLowerCase();

  if (catLower.includes("quant") || titleLower.includes("llm") || titleLower.includes("ai")) {
    return <AutoAwesomeIcon sx={{ fontSize: "2.6rem", color: "var(--accent-fg)" }} />;
  }
  if (catLower.includes("systems") || titleLower.includes("rust") || titleLower.includes("c++")) {
    return <TerminalIcon sx={{ fontSize: "2.6rem", color: NOIR.live }} />;
  }
  if (catLower.includes("web") || titleLower.includes("webgl") || titleLower.includes("3d")) {
    return <LanguageIcon sx={{ fontSize: "2.6rem", color: "#29B6F6" }} />;
  }
  if (catLower.includes("devops") || catLower.includes("cloud") || titleLower.includes("kube")) {
    return <CloudQueueIcon sx={{ fontSize: "2.6rem", color: "#AB47BC" }} />;
  }
  if (catLower.includes("data")) {
    return <BarChartIcon sx={{ fontSize: "2.6rem", color: "#FF7043" }} />;
  }
  return <ScienceIcon sx={{ fontSize: "2.6rem", color: "var(--accent-fg)" }} />;
}

interface InnovationPostCardProps {
  post: InnovationPostSummary;
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  isHero?: boolean;
}

function InnovationPostCard({ post, activeCategory, onCategoryChange, isHero = false }: InnovationPostCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => {
        void navigate({ to: "/innovation-hub/$slug", params: { slug: post.slug } });
      }}
      sx={{
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        backgroundColor: "background.paper",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid",
        borderColor: "rgba(10, 42, 102, 0.12)",
        boxShadow: "0 4px 20px rgba(10, 42, 102, 0.04)",
        "&:hover": {
          transform: "translateY(-4px)",
          borderColor: "var(--accent)",
          boxShadow: "0 12px 32px rgba(10, 42, 102, 0.1)",
        }
      }}
    >
      {/* Banner Stage — Image or 2D Icon Emblem */}
      <Box
        sx={{
          width: "100%",
          aspectRatio: isHero ? "21/9" : "16/9",
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid var(--accent-15)",
          bgcolor: "#06183B",
        }}
      >
        {post.image_url ? (
          <>
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
                transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                ".MuiCard-root:hover &": {
                  transform: "scale(1.06)",
                },
              }}
            />

            {/* Floating Glassmorphic Icon Emblem Badge */}
            <Box
              sx={{
                position: "absolute",
                top: 14,
                right: 14,
                width: 44,
                height: 44,
                borderRadius: "12px",
                bgcolor: "rgba(6, 24, 59, 0.75)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.4)",
                zIndex: 2,
              }}
            >
              {get2DIconForCategory(post.category, post.title)}
            </Box>
          </>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #06183B 0%, #0A2A66 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Tech Grid Pattern */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                opacity: 0.15,
                backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />
            {/* 2D Icon Emblem Container */}
            <Box
              sx={{
                width: 68,
                height: 68,
                borderRadius: "18px",
                bgcolor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
                position: "relative",
                zIndex: 1,
              }}
            >
              {get2DIconForCategory(post.category, post.title)}
            </Box>
          </Box>
        )}
      </Box>
      <CardContent sx={{ p: 3, pb: 0 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {DATE_FORMAT.format(new Date(post.published_on))}
            </Typography>
            {post.author ? (
              <Chip label={`Built by ${post.author}`} size="small" sx={{ bgcolor: "rgba(10, 42, 102, 0.06)", color: "#0A2A66", fontWeight: 700, fontSize: "0.68rem" }} />
            ) : null}
            {post.featured ? (
              <Chip label="Featured Experiment" size="small" sx={{ bgcolor: "secondary.main", color: "secondary.contrastText", fontWeight: 800, fontSize: "0.68rem" }} />
            ) : null}
          </Stack>
          <Typography 
            variant={isHero ? "h3" : "h4"} 
            component="h3"
            sx={{
              fontWeight: 800,
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
              lineHeight: 1.6,
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
          sx={{ fontWeight: 700, borderRadius: "6px" }}
        />
      </Box>
    </Card>
  );
}

interface InnovationPostListProps {
  page: InnovationPostPage;
  /** True while a previous page is shown as placeholder during a refetch. */
  isRefreshing?: boolean;
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onPageChange: (page: number) => void;
}

export function InnovationPostList({
  page,
  isRefreshing = false,
  activeCategory,
  onCategoryChange,
  onPageChange,
}: InnovationPostListProps) {
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
              <InnovationPostCard
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
                <InnovationPostCard
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
