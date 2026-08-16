import type { QueryClient } from "@tanstack/react-query";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import { AppShell } from "@/shared/components/AppShell";
import { NotFoundPage } from "@/shared/components/NotFoundPage";
import { pageHead } from "@/shared/seo";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  // Site-wide default title/description; each route overrides via its own head.
  //
  // `match.globalNotFound` is set on the root match when no child route matched
  // at all (see @tanstack/router-core's findGlobalNotFoundRouteId) — exactly the
  // case that renders `notFoundComponent` below. Without this branch, an
  // unmatched path fell through to these home-page defaults, so a junk URL was
  // served, titled, and self-canonicalized as if it were real content: same
  // title/description as "/", and a canonical/og:url that echoed the invented,
  // nonexistent path right back as if it resolved. The 404 case gets its own
  // title/description, `noindex, nofollow` so crawlers drop it rather than
  // index it, and no canonical echoing the bogus path (see `pageHead`'s
  // `canonicalPath: null` handling).
  head: ({ match }) =>
    match.globalNotFound
      ? pageHead(
          "Page Not Found · Phitopolis",
          "The page you're looking for doesn't exist or has been moved. Return to the Phitopolis homepage to continue.",
          undefined,
          { noindex: true, canonicalPath: null },
        )
      : pageHead(
          "Phitopolis — FinTech Engineering & Quantitative R&D",
          "Phitopolis is a financial-sciences and engineering firm — full-stack development, quantitative research, data science, and 24/7 global operational continuity for the world's most demanding markets.",
        ),
  component: RootLayout,
  notFoundComponent: () => <NotFoundPage />,
});

/**
 * Vercel Analytics only works when Vercel is serving the site.
 *
 * Both components fetch `/_vercel/insights/script.js` and
 * `/_vercel/speed-insights/script.js`, which exist *only* on Vercel's edge — the files
 * are not in `dist/`. On the EC2 + Nginx deployment they 404 on every single page load
 * (two failed requests and two console errors per navigation), and the scripts then log
 * their own "failed to load" warning on top.
 *
 * Gated on the host rather than deleted, so a Vercel preview deploy still reports.
 * `VITE_ANALYTICS=on` forces them on if the site later moves back to Vercel behind a
 * custom domain.
 */
function useVercelAnalytics(): boolean {
  if (import.meta.env.VITE_ANALYTICS === "on") return true;
  if (typeof window === "undefined") return false;
  return /\.vercel\.app$/.test(window.location.hostname);
}

function RootLayout() {
  const analytics = useVercelAnalytics();
  return (
    <AppShell>
      <HeadContent />
      <Outlet />
      {analytics && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </AppShell>
  );
}
