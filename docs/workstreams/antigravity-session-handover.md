# Handover — Antigravity (simple, self-contained tasks)

Scoped for an Antigravity IDE session. These are the **low-risk, well-bounded** slices of
the workstream set — the ones with clear right answers, existing test coverage, and no
design judgement calls.

Rules pack: `Newton Alter/mythos-core.md` + `rules/`.
Project orientation: root `CLAUDE.md`. Full index: [`README.md`](README.md).

---

## Do these

### 1. WS-10 — Services: stop showing a false error ⭐ start here

**File:** [`ws-10-services-polish.md`](ws-10-services-polish.md) → **do only "Steps 1-3"**
**Touches:** `src/routes/services.tsx`
**Size:** small, self-contained.

`services.tsx:119-135` renders *"Capabilities aren't available right now"* whenever the API
fails — while `FALLBACK_SERVICES`, four fully-written services, sits unused 40 lines above
at `:15-84` and is used on every other path (`:137`).

`isError` means the **request failed**, not that the list is empty. Delete that branch, let
the fallback carry it, and add a separate branch for a genuinely empty *successful*
response.

**Verify:** stop Heimdall, hard-reload `/services` → four fallback services render, no error
copy anywhere.

**Skip Step 5** (the de-containerized layout pass) — it depends on WS-01 and is a design
judgement call.

---

### 2. WS-14 — Lint backlog

**File:** [`ws-14-lint-backlog.md`](ws-14-lint-backlog.md) → **do the mechanical rules only**
**Touches:** many files, mechanically.

`yarn lint` has been red since 2026-08-02 — 30 errors / 12 warnings. Clear these three:

- `typescript-eslint/no-unused-vars` (3) — delete. Zero risk.
- `react-refresh/only-export-components` (11) — move non-component exports to sibling
  modules. Typecheck after each.
- `typescript-eslint/no-explicit-any` (3) — type properly, or `unknown` + a narrowing guard.

**Hard rules:** no `eslint-disable` comments — suppressing is not clearing. No behavioural
changes; if a fix requires changing what code *does*, stop and flag it. One commit per rule.

**Do NOT touch:**
- `react-hooks/exhaustive-deps` and `set-state-in-effect` — real behavioural risk.
- `SignalDiagram`, `ReachMap`, `PipelineDiagram`, `FollowTheSunDiagram` — **WS-07 owns those.**

---

### 3. WS-09 — Heimdall year facets

**Repo:** `Heimdall CMS` (separate repo)
**File:** `Heimdall CMS/docs/workstreams/ws-09-heimdall-year-facets.md`
**Touches:** `app/features/blog/{router,repository,schemas}.py` + tests

Add `?year=YYYY` to `GET /api/v1/blog-posts` and a `GET /api/v1/blog-posts/years` facet
endpoint. **No migration** — `published_on: date` already exists and `sort` already orders
by it. The spec has the exact contract.

**The one hazard:** the facet aggregation must apply the **same** published/draft visibility
filter as the list query, or the rail shows counts the list can't produce. Factor it into
one shared predicate.

**Verify:** `sum` of facet counts equals the unfiltered total; a post dated Dec 31 lands in
that year, not the next.

---

## Do NOT do these

| Workstream | Why not |
|---|---|
| WS-01 | Theme-wide blast radius; **breaks a currently-green test on purpose** |
| WS-02, WS-03, WS-04 | Design judgement, narration, and 3D architecture |
| WS-05, WS-07, WS-12 | Visual craft — needs a design eye and screenshot review |
| WS-06 | Needs a browser-driving perf harness |
| WS-08 | Blocked on WS-09's endpoint existing |
| WS-11 | Re-spacing a flattened card is design work, not mechanics |
| WS-13 | 21 timing tests, adversarial; changing pacing breaks them by design |

---

## Ground rules

- **Stay inside the `Owner files:` header** of whichever file you're executing. If a fix
  you need lives elsewhere, note it — do not reach across.
- **One workstream per session.** Verify before moving on.
- **Do not commit to `main`.** Fresko is on `main` right now; branch first.
  Heimdall is on `feat/content-model-extension`, unrelated — branch from base for WS-09.

## Traps

- **A passing test suite is not a healthy baseline here.**
  `tests/a11y-contrast.test.ts:216` pins a *failing* contrast ratio as expected. That is
  WS-01's problem, not yours, but do not "fix" it in passing.
- **Lint being red is pre-existing.** It does not mean you broke something.

## Commands

```bash
cd " Master P Frontend/Phitv2A" && yarn install && yarn dev
```
```bash
cd " Master P Frontend/Phitv2A" && yarn lint && yarn typecheck && yarn test && yarn build
```
```bash
cd "Heimdall CMS" && uv sync && uv run pytest app/features/blog
```

Note the **leading space** in `" Master P Frontend"` — always quote the path. It is legacy
and intentional; renaming it breaks docs, scripts, and systemd units.
