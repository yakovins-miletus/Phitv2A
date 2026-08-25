# WS-08 — Blog: side-menu year navigation

**Owner files (exclusive):** `src/features/blog/**` · `src/routes/blog.index.tsx`
**Depends on:** WS-09's **contract** (not its code — build against the spec, stub locally).
**Agents:** Haiku to map the blog data flow, Sonnet to implement.
**Acceptance bar:** `/design-taste-frontend`.

---

## Why

The brief: *"bring back and refine the look of the side menu year navigation and make it
work with backend."*

**Correction worth knowing before you start: there is nothing to bring back.** No year
navigation exists in the current blog, and there is no commented-out or archived version of
one anywhere in the repo. `BlogToolbar.tsx` provides search, sort
(`newest`/`oldest`/`title_az`/`title_za`), and category filter — no year control. Whatever
you remember, it is not in this codebase. This is a **new build**, so budget accordingly
and design it fresh rather than hunting for a lost version.

## Current state (verified)

- `/blog` composes `BlogVideoHero` → `BlogToolbar` → `BlogPostList`.
- `src/features/blog/api.ts:41-64` — `GET /api/v1/blog-posts` with `limit`, `offset`,
  `category`, `q`, `sort`.
- Pagination is offset-based, `PAGE_SIZE = 9`.
- `keepPreviousData` keeps the previous page visible while fetching — a soft-load pattern.
- `FALLBACK_BLOG_PAGE` (`src/features/blog/fallback.ts`) renders when data is undefined.
  **Note the contrast with services: blog fails soft already.** Preserve that.

## API contract (from WS-09 — build against this)

```
GET /api/v1/blog-posts?year=2025   # composes with category, q, sort, limit, offset
GET /api/v1/blog-posts/years  →  [ { "year": 2026, "count": 12 }, … ]  # desc
```

Empty year → `200` with an empty list, not `404`.

## Target state

A vertical year rail beside the post list. Requirements:

- **Reflects real counts** from `/years`. No hardcoded year range, and no year that has
  no posts.
- **Composes** with the existing search / sort / category controls rather than replacing
  or resetting them.
- **URL-driven.** Year lives in the route search params so it survives reload, back/forward,
  and can be linked. Follow the existing TanStack Router search-param pattern already used
  for category and `q` — do not introduce a second state mechanism.
- **Pagination resets** to page 1 on year change, and paginates within the year.
- **Clearable** — an "All" affordance that returns to the unfiltered list.
- Keyboard navigable, with the active year exposed via `aria-current`.

**Design note.** Per WS-01 the site is de-containerizing — build the rail as typographic
structure (a hairline, generous leading, weight and colour carrying state), not as a
bordered box of buttons. Counts should be subordinate to years, set in the established
`TYPE_SCALE.micro` / `TRACKING.meta` mono treatment.

## Steps

1. Extend `api.ts` with the `year` param and a `blogYearsQuery()`.
2. Add `year` to the route's validated search params in `blog.index.tsx`.
3. Build the rail component in `src/features/blog/components/`.
4. Wire pagination reset on year change.
5. **Client-side fallback so this ships before WS-09 lands:** if `/years` 404s, derive the
   year list from the loaded posts and filter client-side. Mark it clearly as temporary —
   it is wrong past the first page, since pagination is offset-based. Remove it once WS-09
   is deployed.
6. Extend `FALLBACK_BLOG_PAGE` handling so the rail degrades quietly rather than erroring.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn tsc --noEmit && yarn test && yarn build && yarn preview
```

- Rail counts match `curl localhost:8000/api/v1/blog-posts/years`.
- Select a year → list filters, count matches, page resets to 1.
- Deep-link `/blog?year=2025` in a fresh tab → correct state on first paint.
- Back/forward restore prior year selections.
- Year + category + search combined → all three apply.
- Paginate within a year past page 1 → correct posts, year still applied.
- Stop Heimdall → page still renders via `FALLBACK_BLOG_PAGE`, no error screen.
- Keyboard: tab to rail, arrow/enter to select, `aria-current` on the active year.
- Existing `tests/blog.test.tsx` and `tests/blog-article.test.tsx` still pass.

## Out of scope

Heimdall (WS-09). Blog post article rendering. The video hero. Theme tokens (WS-01).
