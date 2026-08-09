# Stage 0 — Record the perf baseline on today's build

**Tier:** Sonnet · **Code changes:** none (one new doc file only)
**Read first:** `docs/hero-upgrade/README.md`, `docs/perf-baseline.md`

---

## Goal

`docs/perf-baseline.md` is dated 2026-08-02 and measures the hero **before** the canvas
rewrite. Its headline numbers (1,335 CSS rules injected, 32 % of frames missing 60 fps,
43 blur layers) describe code that no longer exists.

Every stage after this one is judged on a **delta**, so we need the same measurements
taken against the hero as it stands today. Produce
`docs/hero-upgrade/stage-0-baseline.md` recording that. **Change no source files.**

Done means: a reviewer can open that file, see today's numbers next to the standing gates,
and later tell whether stage N moved any of them.

---

## Files in scope

| Path | Mode |
|---|---|
| `docs/hero-upgrade/stage-0-baseline.md` | **create** |

Everything else in the repo is **read-only for this stage**. If you find a bug, write it
down in the report; do not fix it.

---

## Method

Match `docs/perf-baseline.md`'s method exactly so the numbers are comparable:

> Production build (`yarn build`) served by `vite preview` on `:4173`, driven by Playwright
> at 1440×900, unthrottled, localhost.

Use the `mcp__playwright__*` tools. For the preview server use the Browser-pane preview
tooling (`.claude/launch.json` defines `phitv2a-preview` on port 4173) — **do not run a
dev server through Bash.**

### What to measure

**A. Toolchain gates** — run and record verbatim counts:
- `yarn typecheck`
- `yarn test` (expected: 82 passing; record the actual number and file count)
- `yarn lint` (expected: 30 errors / 12 warnings pre-existing — record the actual split by
  rule, because "no *new* violations" is the gate for every later stage and we need the
  current inventory to compare against)
- `yarn build` (record wall time and any chunk-size warnings)

**B. Home load, `/` at 1440×900**
- FCP, **LCP (ms) and the LCP _element_** — identify it precisely (selector + text). Later
  stages must prove the LCP element did not become a sky node.
- CLS, long tasks (count, total, max), request count, transfer bytes, document height.

**C. Hero scroll harness** — 50 steps × 250 px through the pin, recording per frame:
- **CSS rules injected purely by scrolling** — count `document.styleSheets` rules before
  and after. Expected 0; report whatever you actually get.
- Average FPS, frame p50 / p95 / p99, frame max, **frames missing 60 fps (count and %)**,
  frames worse than 30 fps.
- **Blur layers in the hero** — `querySelectorAll("*")` under the hero root, filtered on a
  computed `filter` or `backdrop-filter` containing `blur`. Expected 0.
- **Hero DOM node count** under the pinned root.

**D. Per-frame cost of the hero canvas specifically.** This is the number stages 3–9 spend
against, so it matters more than the aggregate FPS. Instrument
`drawHeroFrame` timing from the page — e.g. wrap `requestAnimationFrame` and record the
delta around the paint, or use a `PerformanceObserver` on long animation frames — and
report **mean and p95 ms/frame while `progress < 0.10`** (the interactive window) and
across the whole pin. State exactly how you measured it so stage N can repeat it.

**E. Allocation pressure.** `drawHeroFrame` builds ~20 fresh objects plus ~20 closures per
frame (the `items: Drawable[]` array). Confirm this from the source and, if the tooling
allows, record a heap-allocation rate over a 5-second scroll. If you cannot measure it
reliably, say so and report the static analysis instead — do not invent a number.

**F. Reduced motion** — Playwright context with `reducedMotion: "reduce"`: confirm the
canvas paints exactly one frame and no rAF loop starts.

---

## Report format

Write `docs/hero-upgrade/stage-0-baseline.md` with:

1. **Header** — date, machine (chip, core count), Node/Yarn versions, build command, how
   the page was driven.
2. **A table per section A–F above.**
3. **A "standing gates" table** putting today's number next to the target from
   `docs/perf-baseline.md`'s final section, with a ✅/⚠️/❌ per row.
4. **"How to repeat this"** — the exact commands and the instrumentation snippets you used,
   pasted in full, so stage 1 through stage 9 can re-run it identically. This section is
   the most valuable part of the file; be literal.
5. **Observations** — anything surprising, including bugs you found and did not fix.

Report back to the orchestrator with: the file path, the six or seven headline numbers,
and any measurement you could not take (and why).

---

## Stop conditions

- Any source file under `src/` needs to change to get a measurement → **stop and report**.
  Describe the instrumentation you wanted and let the orchestrator decide.
- The build or the preview server fails → **stop and report** the error verbatim.
- The test count is not 82, or lint is not 30/12 → that is not a failure, it is a finding.
  Record it and continue.
