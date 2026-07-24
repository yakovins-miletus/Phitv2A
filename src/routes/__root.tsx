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

function RootLayout() {
  return (
    <AppShell>
      <HeadContent />
      <Outlet />
      <Analytics />
      <SpeedInsights />
    </AppShell>
  );
}
