import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { BlogPost } from "../api";
import { isImageParagraph, preferWebp, resolveImageUrl } from "@/shared/bodyImages";

/** Post bodies are plain text; blank lines separate paragraphs.
 *  React escapes everything — no HTML, no markdown, no XSS surface. The one
 *  extension: a paragraph that is entirely an image path renders as <img decoding="async">. */
function BodyParagraphs({ text, postTitle }: { text: string; postTitle: string }) {
  // BlogPostOut carries no per-image caption/alt field (see schema.d.ts), so the
  // only honest, non-invented text available for an in-body image is the post's
  // own title. A running figure count disambiguates when an article embeds more
  // than one image, rather than repeating an identical alt on every figure.
  let figureCount = 0;
  return (
    <Stack spacing={1.5}>
      {text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0)
        .map((paragraph, index) =>
          // Paragraph order is stable for a given body — index keys are safe.
          isImageParagraph(paragraph) ? (
            <Box
              key={index}
              component="img" decoding="async"
              // The stored path may be .png/.jpg; every one has a .webp twin on disk.
              // See `preferWebp` for why this is resolved here and not migrated in the
              // backend's post bodies. onError falls back to the stored path, so a
              // missing twin degrades to the original rather than to a broken image.
              src={preferWebp(paragraph)}
              onError={(event) => {
                const img = event.currentTarget as HTMLImageElement;
                if (img.src !== paragraph) img.src = paragraph;
              }}
              alt={`${postTitle} - figure ${++figureCount}`}
              loading="lazy"
              sx={{
                width: "100%",
                display: "block",
                border: 1,
                borderColor: "divider",
              }}
            />
          ) : (
            <Typography key={index} variant="body1" color="text.secondary">
              {paragraph}
            </Typography>
          ),
        )}
    </Stack>
  );
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function BlogPostArticle({ post }: { post: BlogPost }) {
  // Heimdall stores the original .png/.jpg path while only the .webp twin
  // exists on disk, so the stored value must be resolved before it is bound.
  const cover = resolveImageUrl(post.image_url);
  return (
    <Stack spacing={5} component="article" useFlexGap>
      <Stack spacing={1.5} sx={{ maxWidth: 760, mx: "auto", width: "100%" }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip label={post.category} size="small" color="primary" variant="outlined" sx={{ 
            transition: "all 0.2s ease",
            "&:hover": { bgcolor: "primary.main", color: "primary.contrastText" }, cursor: "default"
          }} />
          <Typography variant="body2" color="text.secondary">
            {DATE_FORMAT.format(new Date(post.published_on))}
          </Typography>
          {post.author === null || post.author === undefined ? null : (
            <Typography variant="body2" color="text.secondary">
              · By {post.author}
            </Typography>
          )}
        </Stack>
        <Typography variant="h2" component="h1">
          {post.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {post.excerpt}
        </Typography>
      </Stack>
      {cover === null ? null : (
        <Box
          component="img" decoding="async"
          src={cover.src}
          onError={(event) => {
            // Only the .webp twin exists on disk for most stored paths, but if a
            // twin is missing, degrade to the stored original rather than to a
            // broken image.
            const img = event.currentTarget as HTMLImageElement;
            if (!img.src.endsWith(cover.fallback)) img.src = cover.fallback;
          }}
          // BlogPostOut has no dedicated cover-image caption/alt field, so the
          // post title — real, sourced data — is the only honest alt available.
          alt={post.title}
          sx={{
            width: "100%",
            aspectRatio: "21/9",
            objectFit: "cover",
            display: "block",
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
          }}
        />
      )}
      <Box sx={{ maxWidth: 760, mx: "auto", width: "100%" }}>
        <BodyParagraphs text={post.body} postTitle={post.title} />
      </Box>
    </Stack>
  );
}
