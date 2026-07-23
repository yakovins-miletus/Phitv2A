import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { InnovationPost } from "../api";
import { isImageParagraph } from "../bodyImages";

/** Post bodies are plain text; blank lines separate paragraphs.
 *  React escapes everything — no HTML, no markdown, no XSS surface. The one
 *  extension: a paragraph that is entirely an image path renders as <img>. */
function BodyParagraphs({ text }: { text: string }) {
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
              component="img"
              src={paragraph}
              alt=""
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

export function InnovationPostArticle({ post }: { post: InnovationPost }) {
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
      {post.image_url === null || post.image_url === undefined ? null : (
        <Box
          component="img"
          src={post.image_url}
          alt=""
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
        <BodyParagraphs text={post.body} />
      </Box>
    </Stack>
  );
}
