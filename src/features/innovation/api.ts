import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { api } from "@/shared/api/client";
import { unwrap } from "@/shared/api/errors";
import { keyRoots } from "@/shared/api/keys";
import type { components, operations } from "@/shared/api/schema";

export type InnovationPostSummary = components["schemas"]["InnovationPostSummary"];
export type InnovationPost = components["schemas"]["InnovationPostOut"];
export type InnovationPostPage = components["schemas"]["InnovationPostPage"];

/** Derived from the generated schema so the sort union can't drift from the
    backend's InnovationSort enum. */
export type InnovationSort = NonNullable<
  NonNullable<operations["list_innovation_posts"]["parameters"]["query"]>["sort"]
>;

export interface InnovationListParams {
  limit: number;
  offset: number;
  category?: string;
  q?: string;
  sort?: InnovationSort;
}

export const innovationKeys = {
  all: keyRoots.innovation,
  list: (params: InnovationListParams) => [...innovationKeys.all, "list", params] as const,
  detail: (slug: string) => [...innovationKeys.all, "detail", slug] as const,
};

// Editor-latency policy: innovation content is managed live in Heimdall CMS, so
// these queries opt OUT of the global 30s staleTime / no-focus-refetch
// defaults. Any open tab refetches the moment it regains focus — a publish
// appears as soon as anyone looks, with zero sync infrastructure.
const CONTENT_FRESHNESS = {
  staleTime: 0,
  refetchOnWindowFocus: true,
} as const;

export const innovationPostsQuery = (params: InnovationListParams) =>
  queryOptions({
    ...CONTENT_FRESHNESS,
    // Page/filter changes swap the queryKey; keep the previous page rendered
    // during the fetch instead of flashing the static fallback list.
    // (List only — on the detail query this would show the WRONG post.)
    placeholderData: keepPreviousData,
    queryKey: innovationKeys.list(params),
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/innovation-posts", {
          params: {
            query: {
              limit: params.limit,
              offset: params.offset,
              // exactOptionalPropertyTypes: omit the keys entirely when absent.
              ...(params.category !== undefined ? { category: params.category } : {}),
              ...(params.q !== undefined ? { q: params.q } : {}),
              ...(params.sort !== undefined ? { sort: params.sort } : {}),
            },
          },
        }),
      ),
  });

export const innovationPostQuery = (slug: string) =>
  queryOptions({
    ...CONTENT_FRESHNESS,
    queryKey: innovationKeys.detail(slug),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/innovation-posts/{slug}", { params: { path: { slug } } })),
  });
