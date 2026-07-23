import { createRouter } from "@tanstack/react-router";

import { routeTree } from "@/routeTree.gen";
import { ErrorPanel } from "@/shared/components/ErrorPanel";
import { PendingPanel } from "@/shared/components/PendingPanel";

import { queryClient } from "./queryClient";

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPendingComponent: PendingPanel,
  defaultErrorComponent: ({ error, reset }) => <ErrorPanel error={error} onRetry={reset} />,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
