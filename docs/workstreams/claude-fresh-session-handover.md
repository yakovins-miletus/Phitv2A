# Handover — fresh Claude Code session

You are picking up work in **Project Armstrong**. A planning session decomposed one
compiled brief into 14 workstream files. **Nothing has been implemented yet.** Your job is
to execute workstreams, not to re-plan them.

## Read this first

1. This file.
2. [`README.md`](README.md) — the index, ordering constraints, shared-file boundaries, and
   the traps list.
3. The **one** `ws-NN-*.md` you are executing. Nothing else.

Do **not** read all 14 before starting. Each file is deliberately self-sufficient; reading
them all is how scope bleeds across boundaries.

## The rules that make this work

- **`Owner files:` is a contract.** Only edit files your workstream owns. If a fix you need
  lives in another workstream's file, add it to that file's Steps as a handoff — do not
  reach across. Two collisions were already caught and fixed this way.
- **One workstream per session.** Finish and verify it before starting another.
- **Model policy:** Haiku agents for exploration/inventory, Sonnet agents for implementation.
- **Run the file's own Verification section.** It is written to be runnable without any
  conversation context.

## ⚠️ Four things that will mislead you

These each nearly caused a wrong fix during planning. Verified, with evidence:

1. **A green test suite is not a healthy baseline.** `tests/a11y-contrast.test.ts:216`
   asserts a *failing* contrast ratio **stays** failing — its comment says "NOT a guard — a
   record." Fixing the accent correctly breaks a passing test. Do not revert your change to
   make it green; invert the test.
2. **Lint has never been green.** 30 errors / 12 warnings predate all of this
   (`docs/perf-baseline.md`). WS-14 clears it. Until then, `yarn lint` failing tells you
   nothing about your change.
3. **The hero wall is not naive.** `SuperHeroSequence`'s flanking text uses
   `mixBlendMode: "difference"` — contrast against its own backdrop is `|255 − 2b|`, **zero
   at mid-grey**. The composited backdrop must stay under ~95 per channel or the headline
   becomes invisible. `DriftWall.tsx:318-380` also already pauses its rAF offscreen, so it
   may not be the perf villain it looks like.
4. **The blog year nav never existed.** No dead code to restore. It is a new build and it
   needs WS-09's backend change.

## Where to start

**WS-01 first** — it flips the theme's card default and blocks WS-10/11/12. Running those
before it means doing their spacing work twice.

After that, everything is order-free except: **WS-09's contract before WS-08 finishes**
(the contract is published in WS-09; WS-08 stubs against it, so both can run in parallel).

Suggested sequence if you have no other preference:

```
WS-01  →  WS-06 (measure, spawns WS-15)  →  WS-10, WS-11, WS-12  →  WS-07, WS-14
                                          →  WS-09 + WS-08
                                          →  WS-02, WS-03, WS-04, WS-05, WS-13
```

## Current system state

- **Fresko** — on `main`, `docs/workstreams/` untracked. See [COMMIT-NOTES.md](COMMIT-NOTES.md);
  branch before committing.
- **Heimdall** — on `feat/content-model-extension` (unrelated); branch from base for WS-09.
- No source file has been modified by this planning work. `git status` shows only new docs.

## Commands

```bash
cd " Master P Frontend/Phitv2A" && yarn install && yarn dev
```
```bash
cd "Heimdall CMS" && uv sync && uv run uvicorn app.main:app --reload --port 8000
```
```bash
cd " Master P Frontend/Phitv2A" && yarn typecheck && yarn test && yarn build
```

Fresko's `.env.development` expects Heimdall at `http://localhost:8000`. Several
workstreams (WS-08, WS-10) require Heimdall running — and WS-10 specifically requires
testing with it **stopped**.

## Decisions already made — do not relitigate

| Decision | Ruling |
|---|---|
| Gold on light grounds | Keep `goldInk` for accessibility; unify under one written rule |
| SVG diagrams | Redesign as SVG. **Not** rasterised — tested and rejected |
| Containerization | Flip the theme default to flat; opt into glass per case |
| Home teardown | Only `MarketPosition` dies. Capability leads, heritage demoted |
| Isometric closing | **Semi-factual** — real tech stacks as nodes, no counts, no client names |
| Site intro | Honest length first (real warmup assets), buffer only the remainder |
| Hero blend mode | Prototype both ways, decide from screenshots |

## Unsafe without asking

- Adding system counts or client names to WS-04's closing scene — that boundary was set
  deliberately; it is a public claim.
- `eslint-disable` comments in WS-14. Suppressing is not clearing.
- Deleting any home section other than `MarketPosition`.
- Deleting tests in WS-13. Rewrite assertions; `git diff tests/` must show zero deletions.
- Committing to `main` in either repo.

## Open

- **WS-15 does not exist yet.** WS-06 writes it from whatever it actually finds.
- WS-05's `## Warm assets` section is a stub until WS-05 runs; WS-13 consumes it.
- WS-02's `## Handoff to WS-03` section is a stub until WS-02 runs.
