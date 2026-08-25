# Commit / PR notes — workstream planning docs

Two repos, two independent commits. **Docs only — no source changed in either.**

⚠️ Fresko is currently on `main`. Branch before committing.
⚠️ Heimdall is on `feat/content-model-extension`, which is unrelated to WS-09. Branch from
its base rather than piling this onto that feature.

---

## Repo 1 — Fresko (` Master P Frontend/Phitv2A`)

```bash
cd " Master P Frontend/Phitv2A"
git checkout -b docs/workstream-decomposition
git add docs/workstreams/
git commit -F docs/workstreams/.commit-msg-fresko
```

### PR title
`docs: decompose the compiled frontend brief into 13 independent workstreams`

### PR body

Splits one compiled list of concerns — spanning six pages, the design system, performance,
and the site intro — into workstream files that can each be executed independently, in any
order bar two constraints, without two files editing the same source file.

Docs only. No source changed.

**What's here**

| # | Workstream |
|---|---|
| WS-01 | Design system: flatten surfaces, unify the accent |
| WS-02 | Home: service-centric re-architecture |
| WS-03 | Home hero: photo drift wall → word columns |
| WS-04 | Home closing: isometric tech-stack lattice |
| WS-05 | About hero: slanted photo strips |
| WS-06 | Performance audit (measurement only) |
| WS-07 | Diagram craft |
| WS-08 | Blog: year navigation rail |
| WS-10 | Services: kill the false error state |
| WS-11 | Careers: flatten the dossier |
| WS-12 | Contact: fewer surfaces |
| WS-13 | Site intro: pace the reveal |
| WS-14 | Lint backlog → real gate |

WS-09 (Heimdall year facets) lives in the Heimdall repo. WS-15 is spawned by WS-06's findings.

**Non-collision is the point.** Every file declares an `Owner files:` header; no source path
appears in two files. Four shared-file boundaries are documented in the README.

**Five premises in the original brief were corrected against source, with evidence:**

1. The preloader is not broken — progress is real (`Preloader.tsx:148-168`). The requested
   Lusion-style pacing is a deliberate slowdown, not a bug fix.
2. The "background strips" blamed for lag are an image-load fallback
   (`OperatingPillars.tsx:99-110`), not a perf cost. The real weight is `HeroImageWall`.
3. Rasterising the SVG diagrams would regress size, sharpness, and theming. The weakness is
   the drawing; they stay SVG.
4. `goldInk #8C5F09` is a WCAG accommodation, not a mistake — gold on white is ~1.6:1.
   `NOIR.gold` has 187 call sites to `goldInk`'s 10; that ratio is the real inconsistency.
5. The blog year navigation never existed. Nothing to restore — it is a new build, and it
   needs a backend change (WS-09).

**Two traps recorded for whoever executes these**

- `tests/a11y-contrast.test.ts:216` asserts a *failing* contrast ratio stays failing — its
  own comment reads "NOT a guard — a record." Fixing the accent correctly **breaks a green
  test**. A passing suite is not a healthy baseline here.
- `yarn lint` has been red since at least 2026-08-02 — 30 errors / 12 warnings
  (`docs/perf-baseline.md`), including `react-hooks/refs` in four diagram components. WS-14
  clears it and makes lint a blocking gate.

---

## Repo 2 — Heimdall CMS

```bash
cd "Heimdall CMS"
git checkout -b docs/ws-09-blog-year-facets   # branch from base, not from the feature branch
git add docs/workstreams/
git commit -m "docs: spec year filter + facet endpoint for blog posts (WS-09)"
```

### PR title
`docs: spec year filter and facet endpoint for blog posts (WS-09)`

### PR body

Specification only — no code changed.

The Fresko blog needs year navigation. `GET /api/v1/blog-posts` currently accepts only
`category`, `q`, and `sort` (`app/features/blog/router.py:26-41`). This spec adds:

- `?year=YYYY` on the existing list endpoint, composing with all current params
- `GET /api/v1/blog-posts/years` → `[{ "year": 2026, "count": 12 }, …]`, descending

**No migration needed.** `published_on: date` already exists on the post schema and `sort`
already orders by it.

**The one real hazard** is visibility drift: the facet aggregation must apply the same
published/draft filter as the list query, or the rail shows counts the list cannot produce.
The spec requires a single shared predicate and a reconciliation test.

The frontend (WS-08) builds against this contract with a client-side stub, so the two can
proceed in parallel.

---

## Suggested merge order

1. Heimdall WS-09 docs — independent, smallest.
2. Fresko workstream docs — larger, but docs-only and non-blocking.

Neither PR changes behaviour, so neither needs a QA pass. Review is for *whether the
workstreams are correctly scoped*, not for correctness of code.
