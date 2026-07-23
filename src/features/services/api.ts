import { queryOptions } from "@tanstack/react-query";

import { api } from "@/shared/api/client";
import { unwrap } from "@/shared/api/errors";
import { keyRoots } from "@/shared/api/keys";
import type { components } from "@/shared/api/schema";

export type Service = components["schemas"]["ServiceOut"];

export const serviceKeys = {
  all: keyRoots.services,
  list: () => [...serviceKeys.all, "list"] as const,
};

// Note: TanStack's AbortSignal is not forwarded to fetch — undici rejects
// cross-realm signals under jsdom, and these small GETs don't need cancellation.
export const servicesQuery = () =>
  queryOptions({
    queryKey: serviceKeys.list(),
    queryFn: async () => unwrap(await api.GET("/api/v1/services")),
  });
