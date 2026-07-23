import { queryOptions } from "@tanstack/react-query";

import { api } from "@/shared/api/client";
import { unwrap } from "@/shared/api/errors";
import { keyRoots } from "@/shared/api/keys";
import type { components } from "@/shared/api/schema";

export type TeamMember = components["schemas"]["TeamMemberOut"];

export const teamKeys = {
  all: keyRoots.team,
  list: () => [...teamKeys.all, "list"] as const,
};

export const teamQuery = () =>
  queryOptions({
    queryKey: teamKeys.list(),
    queryFn: async () => unwrap(await api.GET("/api/v1/team")),
  });
