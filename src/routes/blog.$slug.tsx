import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

// api + component imported directly (not the barrel) so the eager loader
// doesn't pull the component into the main bundle.
import { queryClient } from "@/app/queryClient";
import { blogPostQuery } from "@/features/blog/api";
import { BlogPostArticle } from "@/features/blog/components/BlogPostArticle";
import { RouterButton } from "@/shared/components/RouterLink";
import { Section } from "@/shared/components/Section";
import { pageHead } from "@/shared/seo";

const FALLBACK_DESCRIPTION =
  "Logs from the Phitopolis team — engineering, platforms, design, operations, and culture.";

export const Route = createFileRoute("/blog/$slug")({
  // `head()` gets no query-client context of its own (unlike `loader`), so it
  // reads the same singleton the router hands loaders elsewhere. The loader
  // below — and router-preload-on-hover from the blog list — often warms this
  // exact cache entry before this runs, so a real slug usually gets its own
  // title/excerpt/image rather than the generic fallback below.
  head: ({ params }) => {
    const post = queryClient.getQueryData(blogPostQuery(params.slug).queryKey);
    return pageHead(
      post ? `${post.title} · Phitopolis Blog` : "Blog · Phitopolis",
      post?.excerpt ?? FALLBACK_DESCRIPTION,
      post?.image_url,
    );
  },
  // Warm the cache without blocking or failing the route.
  loader: ({ context, params }) => {
    void context.queryClient.ensureQueryData(blogPostQuery(params.slug)).catch(() => undefined);
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const post = useQuery(blogPostQuery(slug));

  // Unknown slugs and drafts both 404 on the public API. There is no honest
  // fallback body for an arbitrary slug, so offer the way back instead.
  if (post.isError && post.data === undefined) {
    return (
      <Section>
        <Stack spacing={2} sx={{ maxWidth: 640, mx: "auto", width: "100%" }}>
          <Typography variant="overline" color="primary">
            Blog
          </Typography>
          <Typography variant="h2" component="h1">
            This post isn&apos;t available right now.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            It may have been unpublished, or the link may be out of date.
          </Typography>
          <Stack direction="row">
            <RouterButton to="/blog" variant="outlined">
              Back to the blog
            </RouterButton>
          </Stack>
        </Stack>
      </Section>
    );
  }

  if (post.data === undefined) {
    return (
      <Section>
        <Stack spacing={2} sx={{ maxWidth: 640, mx: "auto", width: "100%" }}>
          <Typography variant="overline" color="primary">
            Blog
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Loading post…
          </Typography>
        </Stack>
      </Section>
    );
  }

  return (
    <Section>
      <BlogPostArticle post={post.data} />
    </Section>
  );
}
