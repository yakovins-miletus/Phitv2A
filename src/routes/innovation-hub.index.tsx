import { NOIR } from "@/shared/theme/palette";
import Box from "@mui/material/Box";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

// api + components imported directly (not the barrel) so the eager loader
// doesn't pull the components into the main bundle.
import { innovationPostsQuery } from "@/features/innovation/api";
import type { InnovationListParams, InnovationSort } from "@/features/innovation/api";
import { InnovationPostList } from "@/features/innovation/components/InnovationPostList";
import { InnovationToolbar } from "@/features/innovation/components/InnovationToolbar";
import { InnovationHero } from "@/features/innovation/components/InnovationHero";
import { FALLBACK_INNOVATION_PAGE } from "@/features/innovation/fallback";
import { Section } from "@/shared/components/Section";
import { pageHead } from "@/shared/seo";

const PAGE_SIZE = 10;
const CATEGORY_PATTERN = /^[A-Za-z0-9 &-]{1,60}$/;
const Q_MAX = 100;
const SORT_VALUES = ["newest", "oldest", "title_az", "title_za"] as const satisfies readonly InnovationSort[];

function isInnovationSort(value: unknown): value is InnovationSort {
  return typeof value === "string" && (SORT_VALUES as readonly string[]).includes(value);
}

/** All params optional so plain links to /innovation-hub need no search object. */
interface InnovationSearch {
  offset?: number | undefined;
  category?: string | undefined;
  q?: string | undefined;
  sort?: InnovationSort | undefined;
}

function paramsFromSearch(search: InnovationSearch): InnovationListParams {
  return {
    limit: PAGE_SIZE,
    offset: search.offset ?? 0,
    ...(search.category !== undefined ? { category: search.category } : {}),
    ...(search.q !== undefined ? { q: search.q } : {}),
    ...(search.sort !== undefined ? { sort: search.sort } : {}),
  };
}

export const Route = createFileRoute("/innovation-hub/")({
  validateSearch: (search: Record<string, unknown>): InnovationSearch => {
    const rawOffset = search["offset"];
    const offset =
      typeof rawOffset === "number" && Number.isInteger(rawOffset) && rawOffset > 0
        ? rawOffset
        : undefined;
    const rawCategory = search["category"];
    const category =
      typeof rawCategory === "string" && CATEGORY_PATTERN.test(rawCategory)
        ? rawCategory
        : undefined;
    const rawQ = search["q"];
    const trimmedQ = typeof rawQ === "string" ? rawQ.trim() : "";
    const q = trimmedQ.length > 0 && trimmedQ.length <= Q_MAX ? trimmedQ : undefined;
    // Canonical URLs omit the defaults ("newest", offset 0).
    const rawSort = search["sort"];
    const sort = isInnovationSort(rawSort) && rawSort !== "newest" ? rawSort : undefined;
    return {
      ...(offset !== undefined ? { offset } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(q !== undefined ? { q } : {}),
      ...(sort !== undefined ? { sort } : {}),
    };
  },
  head: () =>
    pageHead(
      "Innovation Lab · Phitopolis",
      "Where engineering meets research. Labs and experiments from the Phitopolis team.",
    ),
  loaderDeps: ({ search }) => search,
  // Warm the cache without blocking or failing the route — the page renders
  // its static fallback immediately and swaps in live posts on arrival.
  loader: ({ context, deps }) => {
    void context.queryClient
      .ensureQueryData(innovationPostsQuery(paramsFromSearch(deps)))
      .catch(() => undefined);
  },
  component: InnovationPage,
});

function InnovationPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const page = useQuery(innovationPostsQuery(paramsFromSearch(search)));
  const data = page.data ?? FALLBACK_INNOVATION_PAGE;

  // Every filter/sort change drops the offset — page 3 of the old result set
  // is meaningless against a new one. Only explicit paging sets it.
  const buildSearch = (overrides: Partial<InnovationSearch>): InnovationSearch => {
    const next: InnovationSearch = { ...search, offset: undefined, ...overrides };
    return {
      ...(next.offset !== undefined && next.offset > 0 ? { offset: next.offset } : {}),
      ...(next.category !== undefined ? { category: next.category } : {}),
      ...(next.q !== undefined ? { q: next.q } : {}),
      ...(next.sort !== undefined && next.sort !== "newest" ? { sort: next.sort } : {}),
    };
  };

  return (
    <Box sx={{ width: "100%", bgcolor: NOIR.navyDeep, minHeight: "100vh" }}>
      {/* ── High-Impact Video Hero Stage ── */}
      <InnovationHero />

      {/* ── Parallax Overlapping Pet Projects Sheet ── */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          bgcolor: "background.default",
          borderTopLeftRadius: { xs: 28, md: 48 },
          borderTopRightRadius: { xs: 28, md: 48 },
          boxShadow: "0 -24px 60px rgba(0, 0, 0, 0.45)",
          pt: { xs: 6, md: 10 },
          pb: { xs: 12, md: 16 },
        }}
      >
        <Section>
          <InnovationToolbar
            q={search.q ?? ""}
            sort={search.sort ?? "newest"}
            onQChange={(q: string | null) => {
              // replace: keystrokes shouldn't stack up in browser history.
              void navigate({
                search: buildSearch({ q: q ?? undefined }),
                replace: true,
              });
            }}
            onSortChange={(sort: InnovationSort) => {
              void navigate({ search: buildSearch({ sort }), replace: true });
            }}
          />
          <InnovationPostList
            page={data}
            isRefreshing={page.isPlaceholderData}
            activeCategory={search.category ?? null}
            onCategoryChange={(category: string | null) => {
              void navigate({ search: buildSearch({ category: category ?? undefined }) });
            }}
            onPageChange={(pageNumber: number) => {
              const offset = (pageNumber - 1) * PAGE_SIZE;
              void navigate({ search: buildSearch({ offset }) });
            }}
          />
        </Section>
      </Box>
    </Box>
  );
}
