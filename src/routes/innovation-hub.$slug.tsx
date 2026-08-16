import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

// api + component imported directly (not the barrel) so the eager loader
// doesn't pull the component into the main bundle.
import { queryClient } from "@/app/queryClient";
import { innovationPostQuery } from "@/features/innovation/api";
import { InnovationPostArticle } from "@/features/innovation/components/InnovationPostArticle";
import { RouterButton } from "@/shared/components/RouterLink";
import { Section } from "@/shared/components/Section";
import { pageHead } from "@/shared/seo";

const FALLBACK_DESCRIPTION =
  "R&D notes from the Phitopolis Innovation Lab — quantitative research, tooling, and emerging platform work.";

export const Route = createFileRoute("/innovation-hub/$slug")({
  // `head()` gets no query-client context of its own (unlike `loader`), so it
  // reads the same singleton the router hands loaders elsewhere. The loader
  // below — and router-preload-on-hover from the hub list — often warms this
  // exact cache entry before this runs, so a real slug usually gets its own
  // title/excerpt/image rather than the generic fallback below.
  head: ({ params }) => {
    const post = queryClient.getQueryData(innovationPostQuery(params.slug).queryKey);
    return pageHead(
      post ? `${post.title} · Phitopolis Innovation Lab` : "Innovation Lab · Phitopolis",
      post?.excerpt ?? FALLBACK_DESCRIPTION,
      post?.image_url,
    );
  },
  // Warm the cache without blocking or failing the route.
  loader: ({ context, params }) => {
    void context.queryClient.ensureQueryData(innovationPostQuery(params.slug)).catch(() => undefined);
  },
  component: InnovationPostPage,
});

function InnovationPostPage() {
  const { slug } = Route.useParams();
  const post = useQuery(innovationPostQuery(slug));

  // Unknown slugs and drafts both 404 on the public API. There is no honest
  // fallback body for an arbitrary slug, so offer the way back instead.
  if (post.isError && post.data === undefined) {
    return (
      <Section>
        <Stack spacing={2} sx={{ maxWidth: 640, mx: "auto", width: "100%" }}>
          <Typography variant="overline" color="primary">
            Innovation Lab
          </Typography>
          <Typography variant="h2" component="h1">
            This post isn&apos;t available right now.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            It may have been unpublished, or the link may be out of date.
          </Typography>
          <Stack direction="row">
            <RouterButton to="/innovation-hub" variant="outlined">
              Back to the lab
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
            Innovation Lab
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
      <InnovationPostArticle post={post.data} />
    </Section>
  );
}
