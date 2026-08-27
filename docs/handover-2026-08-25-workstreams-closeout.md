# Handover — 2026-08-25 workstream closeout

Picks up from the touchpoint that started this session (`git log` from
`9356acf` through `f97596f` on `fix/ws-01-theme-ws-10-services`). All 16
numbered workstreams in `docs/workstreams/` are now marked done. This
document is the honest remainder: three items that are real, open, and
deliberately not fixed in this session — plus what to check before trusting
the "done" markers on anything.

**Branch:** `fix/ws-01-theme-ws-10-services`, clean tree as of `f97596f`.
**Gate at handover:** `yarn typecheck && yarn test && yarn lint && yarn build`
— typecheck clean, 335/335 tests, lint 0 errors / 11 warnings, build passes.

---

## 0. Read this first — a prior concurrent-editor incident is why "done" gets verified, not trusted

`docs/handover-2026-08-24-touchpoint.md` documents Antigravity.app actively
rewriting `careers.index.tsx` back to a reverted state *while a Claude
session was open*, twice, within about a minute each time. That incident is
resolved (careers is light-themed and stable as of this session's own
verification), but the lesson generalizes: **before continuing any of the
three items below, run the gate command above first.** If it's red and you
didn't just break it, something else touched the tree.

Separately, this session found and fixed a different but related failure
mode: seven items of real, careful work (an accessibility contrast sweep, a
nav-rail fix, a WebP conversion pass, three unrelated bug fixes) existed on
this exact branch from a session that ran *before* this one started, and
were never audited — one of them was unknowingly duplicated, another was
knowingly and correctly superseded only after the duplication was noticed.
**Before starting new work on this branch, run:**

```bash
git log --format="%h %ad %s" --date=format:"%Y-%m-%d %H:%M" -40 --all | sort -k2,3
```

and read anything you don't recognize before assuming the branch's history
is only what you personally added.

---

## 1. WS-14 lint — partial by design, not oversight

**State:** `yarn lint` → 0 errors, 11 warnings (down from 65). Verified
directly, not from a report.

**What's done:** all 52 raw-hex-colour and raw-cubic-bezier warnings are
cleared — every literal now routes through an exact-match token in
`src/shared/theme/palette.ts` or `src/shared/motion/easing.ts` (five new
palette tokens were added where no existing token matched: `NOIR.navyDark`,
`NOIR.charcoal`, `NOIR.midnightNavy`, `NOIR.slate`, `NOIR.almostWhite` — all
verified byte-for-byte against what they replaced).

**What's not done:** 8 of the original 10 `react-refresh/only-export-components`
warnings remain, in:

```
src/shared/components/NavbarContext.tsx      (2, lines 140/164)
src/shared/components/SmoothScroll.tsx       (3, line 12)
src/shared/components/StageSection.tsx       (1, line 12)
src/shared/components/TopNavMegaDrawer.tsx   (1, line 37)
src/shared/components/TransitionCurtain.tsx  (1, line 60)
```

**Why they're not done:** the first attempt at these five files added
backward-compatible re-exports from the original file location, pointing at
three new sibling files that *were* correctly created and *are* genuinely
fixed: `src/shared/components/jobDetails.ts`, `navbarAnchors.ts`,
`smoothScrollControls.ts`. Re-exporting doesn't clear the lint rule — it
just moves which line triggers it, because the original file still exports
both a component and a non-component value from the same module. The 3
plainly-moved files worked; the re-export pattern on the other 5 did not.

**To finish it:** for each of the five files above, do the same thing that
worked for `jobDetails.ts`/`navbarAnchors.ts`/`smoothScrollControls.ts` — move
the non-component export to a new sibling file with no re-export left
behind, then update every import site (`grep -rln` the old export name
across `src/` to find them all) to import from the new location directly.
This is mechanical, no behavior change, but touches every call site, so run
`yarn typecheck` after each file, not at the end.

**Left alone on purpose, don't touch:** 3 `react-hooks/exhaustive-deps`
warnings in `HeroCanvas.tsx:496`, `AppShell.tsx:547`, `FloatingIdOverlay.tsx:302`.
Adding the missing dependency can turn a run-once effect into a run-every-render
one; this needs a deliberate read of each effect, not a mechanical fix.

---

## 2. Preloader — a narrow timing race, bounded but not eliminated

**File:** `src/shared/components/Preloader.tsx`, the SETTLE + POST-100 BEAT
effect (currently around line 340).

**The race:** the effect's dependency array includes `reduced`
(`prefers-reduced-motion`, sourced from a hook that can resolve `null` →
`true`/`false` asynchronously post-mount — this is a real, tested pattern;
see `tests/preloader-adversarial.test.tsx`'s "resolves when useReducedMotion
transitions from null -> false"). If real warmup signals resolve
(`isComplete` flips true, the 200ms post-100 beat gets scheduled) and *then*
`reduced` changes identity before that 200ms elapses, the effect re-runs.
Its cleanup cancels the pending exit timer, and the guard
`completedAt100Ref.current` (already `true` from the first pass) blocks the
branch that would reschedule it — so nothing calls `triggerExit()` for that
completion path again.

**Why this shipped anyway:** the independent, unconditional failsafe effect
(`BEAT_FAILSAFE_MS = 2600`, its own `useEffect` with a stable dependency,
verified to not share any state with the settle effect) still fires
regardless. So the actual worst case if this race is ever hit is **the
visitor waits up to 2.6s instead of ~1.8s** — not an indefinite stall. The
doc's non-negotiable requirement ("a stalled signal must never trap a
visitor") is satisfied by the failsafe independent of whether this race
fires. This was checked directly, not assumed.

**Why it's not fixed:** the existing adversarial test that names this exact
transition (`null -> false`) doesn't exercise the race, because in that test
the transition happens synchronously right after mount, before any real
signal resolves — so `isComplete` is still `false` when `reduced` changes,
and the effect takes the harmless branch. Reproducing the actual race needs
a signal that resolves *between* mount and the reduced-motion hook settling,
which none of the 21 existing tests construct. Fixing it without a
reproducing test first risks fixing the wrong thing.

**To fix it properly:** either (a) add a test that mocks a fast-resolving
signal and a slow-resolving `reduced` transition landing inside the 200ms
window, confirm it currently fails, then fix and confirm it passes — or (b)
restructure the effect so `completedAt100Ref` records *that a timer is
pending*, not *that completion was seen*, and the cleanup function clears the
ref alongside the timeout so a re-run can reschedule. Option (b) is the
smaller diff; option (a) is what actually proves it's fixed.

---

## 3. WS-04 isometric closing — mobile is a scaled-down desktop, not a bespoke composition

**File:** `src/features/home/components/closing-scene/IsometricTechLattice.tsx`.

The workstream doc asked for "a deliberate small-screen composition, not a
squeezed desktop one" because isometric layouts typically don't survive
being scaled down. What shipped is the same three-row SVG at every
viewport, scaled via `preserveAspectRatio="xMidYMid meet"` — confirmed live
at 390px width: it doesn't overlap, doesn't clip, and the twelve tech-stack
labels are technically legible, but they're small, and it reads as "the
desktop version, smaller" rather than a composition considered for a phone
screen.

**Not urgent** — nothing is broken, and the CTA (Contact/Careers links)
below it is unaffected and full-size regardless of viewport. This is a
polish item, not a defect.

**To do it properly:** at `xs` breakpoint, consider collapsing the three
rows to a single vertical stack with larger touch-friendly nodes (fewer per
row, or one column per layer stacked top to bottom instead of left to
right), rather than shrinking the whole 900×660 viewBox uniformly. The
`PLACED_NODES`/`LAYERS` data structure already separates layer membership
from pixel layout (see the `NODE_GAP`/`LAYER_GAP`/`ISO_SHEAR` constants
added this session specifically so layout tuning doesn't require touching
the data) — a mobile variant likely means a second layout function beside
`PLACED_NODES` that the component picks based on a `useMediaQuery`, not a
rewrite of the tech-stack data itself.

---

## What's genuinely finished and shouldn't be revisited without a reason

All sixteen numbered workstreams in `docs/workstreams/README.md` are done
and independently verified against a running production build (not just
`yarn test`) — meaning for the visual ones, a real screenshot or a real DOM
query confirmed the claim before it was committed, not just an agent's
self-report. If you're auditing this session's work, the higher-value use
of your time is the three items above, not re-checking WS-01 through WS-13.

---

## Continuation checklist

- [ ] Run the gate command at the top of this doc before touching anything.
- [ ] Run the `git log --all` sort command in §0 to catch any further
      out-of-band commits.
- [ ] Pick one of §1/§2/§3 — they're independent, no ordering constraint
      between them.
- [ ] For §1: finish the five remaining file splits, `grep` for every
      import of the moved export before declaring a file done.
- [ ] For §2: write the reproducing test first (option a) before changing
      the effect.
- [ ] For §3: decide with the user whether the current scaled-down mobile
      view is acceptable before investing in a bespoke layout — it may be
      fine as-is.
