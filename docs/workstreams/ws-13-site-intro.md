# WS-13 — Site intro: pace the reveal, keep the honesty

**Owner files (exclusive):** `src/shared/components/Preloader.tsx` · `tests/preloader.test.tsx` · `tests/preloader-adversarial.test.tsx`
**Shared-file boundary:** may **append** to the warmup manifest in `AppShell.tsx`
(`useWarmupSignals`, L209). Do not restructure that file — WS-01 edits its nav branch.
**Depends on:** nothing. **Consumes:** WS-05's `## Warm assets` list.
**Agents:** Haiku to map the beat timeline, Sonnet to implement.

---

## Why — and the correction that changes the job

The brief: *"the intro doesn't load from 0 to 100% properly and just loads straight to 100.
The website intro should have a buffer before showing the website load progress… almost
like Lusion.co's build… grill me on this."*

**The premise is wrong, and it matters.** The progress is real. `Preloader.tsx:148-168`:

```tsx
const progressPercent =
  forced || signals.length === 0 ? 100 : Math.min(100, Math.round((resolved / total) * 100));

// Real signals only. Nothing here is on a timer pretending to be progress.
```

Each tick is a resolved promise — `document.fonts.ready` (`collectFontSignals`, L95) plus
whatever `useWarmupSignals` (`AppShell.tsx:209`) contributes. It reaches 100 instantly
because on a warm cache **there are only a few signals and they all resolve inside a frame**.
Nothing is broken. There is no bug to fix here.

**So this workstream is not a repair. It is a deliberate decision to slow the site down for
effect** — and it directly contradicts a design principle written into the file:

> `Preloader.tsx:14` — "**Not a splash screen.** While it holds, `useWarmupSignals`…"

The preloader exists to do work, not to be watched. Making it longer is a real trade, and
whoever executes this should understand they are overriding an explicit prior decision, not
correcting an oversight. **If that trade is not wanted, close this workstream — it is the
only file in the set whose value is purely aesthetic.**

## Current state (verified)

⚠️ **Provenance note, added at a later touchpoint.** The table below was verified against
source that had already been through an unrelated prior refactor
(`2acfa96`, "strip the cockpit, keep wordmark, hairline and a real count") — this workstream
did not cause and is not describing a pristine, never-touched Preloader. The cited line
numbers, constants, and the mask-reveal mechanism were re-confirmed to have survived that
refactor intact, so the technical plan below is unaffected — only the framing "the preloader
hasn't been touched" would have been wrong if implied. It's already been touched once; treat
that refactor as the baseline you're building on, not as this workstream's own prior state.

| Behaviour | Where |
|---|---|
| Real signal progress, `resolved / total` | `Preloader.tsx:148-168` |
| Settle cap — exit at 1800 ms if signals stall | `MAX_SETTLE_MS`, L85, used L307 |
| Unconditional failsafe — 2600 ms | `BEAT_FAILSAFE_MS`, L86, used L319 |
| Shows once per session | `PRELOADER_SESSION_KEY`, L53, set L139 |
| Escape skips it | `forced` path; `tests/preloader.test.tsx:39` |
| Progress bar is `scaleX` only, no reflow | L291-294, L400 |
| **Exit is already a centre-out expanding mask** | L34, L194-236 |
| Reduced motion resolves instantly | `tests/preloader.test.tsx:110` |

**The centre-out reveal you asked for already exists.** L194-236 grows a
`radial-gradient(circle at 50% 50%, transparent {r}px, #000 {r}px)` mask — a hole opening
outward, with the content clearing slightly ahead of it (L216). The docblock at L194-195
records why a `clip-path: circle()` was rejected: it contracts to a dot, the opposite
reading. **Reuse this. Do not rewrite it**, and do not "improve" it into a clip-path.

## ⚠️ 21 tests pin this component's timing

`tests/preloader.test.tsx` (6) and `tests/preloader-adversarial.test.tsx` (15) cover, among
others: fast warmup exits early after the IN beat; slow warmup progresses dynamically;
stalled signals hit `MAX_SETTLE_MS`; a hanging signal hits the failsafe within ~1500 ms;
rejected promises still count toward completion; Escape forces 100%; unmount mid-warmup
doesn't setState.

Adding a buffer **will** break several. That is expected — but each break must be a
**deliberately rewritten assertion**, never a deleted test or a loosened timeout. If a test
is failing because the new pacing is genuinely wrong, fix the pacing.

Non-negotiable, whatever the pacing becomes:
- The failsafe still fires. A stalled signal must **never** be able to trap a visitor
  behind the intro. The buffer must not push total time past the failsafe.
- Escape still skips, immediately.
- `prefers-reduced-motion: reduce` still resolves instantly — **no buffer, no sequence.**
- Once-per-session behaviour holds.

## Target state

1. **Pre-roll beat.** A short brand hold before the counter appears — wordmark, hairline —
   so the number arrives into an established frame instead of appearing and vanishing.
2. **Paced progress.** The bar eases toward its true value rather than snapping. Real
   signals still drive the *target*; the buffer governs how fast the display can approach
   it. **The number must never exceed real progress** — pace it, do not fabricate it.
   Keep the `scaleX`-only implementation (L291-294): no width animation, no reflow.
3. **Post-100 sequence.** A brief resolve beat at 100 before the reveal starts.
4. **Centre-out mask reveal.** The existing mechanism at L194-236, unchanged.

**Budget it explicitly.** Warm cache today is ~0.92 s (0.34 s entrance + 0.58 s exit). Pick
a target total, write it into the file as a constant with a comment, and hold to it. Lusion
buys its intro length with a genuinely heavy WebGL payload to warm; this site's home JS is
196 KB (`docs/perf-audit-2026-08-23.md`) and has less to hide behind. **A 3-second intro on
a 200 KB site reads as a stall, not as craft.**

### The honest alternative, if you want the length to be real

Rather than buffering an already-finished load, **give it more to genuinely wait for** —
append real assets to `useWarmupSignals` (`AppShell.tsx:209`): WS-05's strip imagery, the
hero tiles, the next-route chunks. Then progress is both slower *and* still true, and the
site is warmer when it lands. This is the option that keeps `Preloader.tsx:151`'s promise
intact. **Prefer it where possible; use the buffer only for the remainder.**

## Steps

1. Read the docblocks at L14-40 and L194-236 before editing. Both record decisions that
   were made deliberately.
2. Decide the total budget; add it as a named constant beside `MAX_SETTLE_MS`.
3. Add real warmup signals first (the honest path above), and measure what that alone buys.
4. Add the pre-roll beat and the display-pacing easing for whatever remains.
5. Add the post-100 resolve beat; hand off to the existing mask exit untouched.
6. Rewrite the affected assertions in both test files, deliberately, one at a time.
7. Verify the failsafe still bounds the **new** total, and raise `BEAT_FAILSAFE_MS` only if
   the budget genuinely requires it — with a comment saying why.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn typecheck && yarn test && yarn build && yarn preview
```

- **Cold cache** (devtools disable-cache, hard reload): counter climbs visibly, never
  snaps, never exceeds real progress.
- **Warm cache** (clear `sessionStorage.phitopolis:preloaded`, reload): full sequence plays
  at the budgeted length. Time it — compare against the stated constant.
- **Stalled signal** (throttle to offline mid-load): failsafe fires, visitor is never
  trapped. This is the most important check in the file.
- **Escape** at 40%: skips immediately.
- `prefers-reduced-motion: reduce`: resolves instantly, no buffer, no sequence.
- Second navigation in the same session: no preloader.
- All 21 tests pass; every changed assertion has a rewritten expectation, and
  `git diff tests/` shows **no deleted tests**.
- Record before/after time-to-interactive. The regression is intentional — but it must be
  *known*, not discovered later.

## Out of scope

`AppShell.tsx` beyond appending warmup signals. Route transition curtains
(`CurtainTransition.tsx`). The home hero's own entrance sequence (WS-03). Making the
preloader appear more than once per session.
