import type { QueryClient } from "@tanstack/react-query";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import { AppShell } from "@/shared/components/AppShell";
import { ErrorPanel } from "@/shared/components/ErrorPanel";
import { pageHead } from "@/shared/seo";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  // Site-wide default title/description; each route overrides via its own head.
  head: () =>
    pageHead(
      "Phitopolis — FinTech Engineering & Quantitative R&D",
      "Phitopolis is a financial-sciences and engineering firm — full-stack development, quantitative research, data science, and 24/7 global operational continuity for the world's most demanding markets.",
    ),
  component: RootLayout,
  notFoundComponent: () => <ErrorPanel message="This page does not exist." />,
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
