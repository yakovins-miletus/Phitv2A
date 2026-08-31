import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";

import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { VideoPageHero } from "@/shared/components/VideoPageHero";
import { BLOG_LOOP } from "@/shared/components/useBackgroundVideo";
import type { BlogPostSummary } from "../api";

interface BlogVideoHeroProps {
  featuredPost?: BlogPostSummary | null | undefined;
}

function FeaturedCard({ post, onOpen }: { post: BlogPostSummary; onOpen: () => void }) {
  return (
    <Box
      onClick={onOpen}
      sx={{
        position: "relative",
        ml: "auto",
        width: "100%",
        maxWidth: 460,
        borderRadius: "20px",
        overflow: "hidden",
        cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 24px 48px -16px rgba(0,0,0,0.55)",
        bgcolor: "rgba(6,24,59,0.55)",
        backdropFilter: "blur(12px)",
        aspectRatio: "16 / 10",
        transition: "transform 0.3s ease",
        "&:hover": { transform: "translateY(-4px)" },
      }}
    >
      {post.image_url && (
        <Box
          component="img"
          src={post.image_url}
          alt={post.title}
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.62 }}
        />
      )}
      <Box
        aria-hidden
        sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 0%, rgba(6,24,59,0.92) 100%)" }}
      />
      <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", p: 4 }}>
        <Stack spacing={1.25}>
          <Typography
            component="span"
            sx={{ color: "var(--accent-ink)", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            Featured article
          </Typography>
          <Typography sx={{ color: "common.white", fontWeight: 800, fontSize: "1.35rem", lineHeight: 1.15 }}>
            {post.title}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

export function BlogVideoHero({ featuredPost }: BlogVideoHeroProps) {
  const navigate = useNavigate();

  return (
    <VideoPageHero
      anchor={NAV_ANCHORS.BLOG_HERO}
      loop={BLOG_LOOP}
      eyebrow="Insights & Engineering"
      headline="Direct logs from R&D."
      lead="Architectural decisions, benchmarks, and postmortems from the team building Phitopolis platforms."
      aside={
        featuredPost ? (
          <FeaturedCard
            post={featuredPost}
            onOpen={() => navigate({ to: "/blog/$slug", params: { slug: featuredPost.slug } })}
          />
        ) : undefined
      }
    />
  );
}
