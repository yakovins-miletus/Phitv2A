import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { api } from "@/shared/api/client";
import { unwrap } from "@/shared/api/errors";
import { keyRoots } from "@/shared/api/keys";
import type { components, operations } from "@/shared/api/schema";

export type BlogPostSummary = components["schemas"]["BlogPostSummary"];
export type BlogPost = components["schemas"]["BlogPostOut"];
export type BlogPostPage = components["schemas"]["BlogPostPage"];

/** Derived from the generated schema so the sort union can't drift from the
    backend's BlogSort enum. */
export type BlogSort = NonNullable<
  NonNullable<operations["list_blog_posts"]["parameters"]["query"]>["sort"]
>;

export interface BlogListParams {
  limit: number;
  offset: number;
  category?: string;
  q?: string;
  sort?: BlogSort;
  year?: number;
}

/**
 * WS-09's `year` facet contract (`GET /api/v1/blog-posts/years`) is live on
 * Heimdall but `schema.d.ts` hasn't been regenerated against it yet — that
 * file is generated infra outside this workstream's ownership
 * (`src/features/blog/**` / `src/routes/blog.index.tsx` only), so it's typed
 * by hand here rather than touched. Keep this in sync with
 * `app/features/blog/schemas.py::BlogYearFacet` until `yarn typegen` picks it
 * up for real.
 */
export interface BlogYearFacet {
  year: number;
  count: number;
}

export const blogKeys = {
  all: keyRoots.blog,
  list: (params: BlogListParams) => [...blogKeys.all, "list", params] as const,
  years: () => [...blogKeys.all, "years"] as const,
  detail: (slug: string) => [...blogKeys.all, "detail", slug] as const,
};

// Editor-latency policy: blog content is managed live in Heimdall CMS, so
// these queries opt OUT of the global 30s staleTime / no-focus-refetch
// defaults. Any open tab refetches the moment it regains focus — a publish
// appears as soon as anyone looks, with zero sync infrastructure.
const CONTENT_FRESHNESS = {
  staleTime: 0,
  refetchOnWindowFocus: true,
} as const;

export const blogPostsQuery = (params: BlogListParams) =>
  queryOptions({
    ...CONTENT_FRESHNESS,
    // Page/filter changes swap the queryKey; keep the previous page rendered
    // during the fetch instead of flashing the static fallback list.
    // (List only — on the detail query this would show the WRONG post.)
    placeholderData: keepPreviousData,
    queryKey: blogKeys.list(params),
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/blog-posts", {
          params: {
            query: {
              limit: params.limit,
              offset: params.offset,
              // exactOptionalPropertyTypes: omit the keys entirely when absent.
              ...(params.category !== undefined ? { category: params.category } : {}),
              ...(params.q !== undefined ? { q: params.q } : {}),
              ...(params.sort !== undefined ? { sort: params.sort } : {}),
              // `year` isn't in the generated query type yet (see BlogYearFacet
              // comment above) — widen the object so the extra key survives
              // openapi-fetch's serializer instead of tsc stripping it as
              // "not in type".
              ...(params.year !== undefined ? { year: params.year } : {}),
            } as operations["list_blog_posts"]["parameters"]["query"] & { year?: number },
          },
        }),
      ),
  });

export const blogPostQuery = (slug: string) =>
  queryOptions({
    ...CONTENT_FRESHNESS,
    queryKey: blogKeys.detail(slug),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/blog-posts/{slug}", { params: { path: { slug } } })),
  });

// Editors publish a new year's first post live, so the facet list gets the
// same no-stale-cache treatment as the list/detail queries above.
export const blogYearsQuery = () =>
  queryOptions({
    ...CONTENT_FRESHNESS,
    queryKey: blogKeys.years(),
    queryFn: async (): Promise<BlogYearFacet[]> => {
      const response = await fetch(
        new URL("/api/v1/blog-posts/years", import.meta.env.VITE_API_URL),
      );
      if (!response.ok) {
        throw new Error(`Failed to load blog years (${String(response.status)})`);
      }
      return (await response.json()) as BlogYearFacet[];
    },
  });
