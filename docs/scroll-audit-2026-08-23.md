# Scroll audit — 2026-08-23

## Update: confirmed root cause, fix applied

The "no bug found" conclusion below was **wrong for the general case** — it
held for the specific automated repro (nav-away-and-back, and slow continuous
scroll), but the user reproduced it live with the simplest possible input: a
single normal-paced scroll-through, no back-and-forth, no navigation. Traced
it to a screenshot of `MarketPosition.tsx` ("hero-position" beat, choreo
`grow-right`).

**Root cause, confirmed via CDP on the corrected repro**: `SectionBeat`'s
content entrance is `immediateRender: false`, so the tween's `from` state
(e.g. `grow-right`: `{ autoAlpha: 0.15, x: 96, scale: 0.85 }`,
`stageChoreo.ts:33`) is only written the instant the trigger fires — not
before. Until then, the DOM sits at its untouched CSS default: `opacity: 1`,
no transform (this is the documented anti-stranding invariant). On a normal
scroll, the trigger frequently fires only once the section is already
meaningfully inside the viewport (measured: fires with the section already
~280px into view), meaning the reader has already been looking at fully
opaque, correctly-positioned content for a moment. The instant the tween
starts, GSAP writes the `from` vars — content **snaps** from `opacity: 1` to
`~0.15–0.28`, offset, at reduced scale, in a single frame — then eases back
over the tween's duration. At the old `CONTENT_ENTER_DURATION = 0.9`s, a
reader who keeps scrolling at a normal pace is well past the section, looking
at other content, while it's still visibly resolving underneath — read as
"it was already in place, then it went into a transition, but it was broken."

Verified with a continuous ~600px/s scroll through `hero-position`'s entrance
(realistic pace, not the earlier synthetic burst/settle pattern): opacity
went `1 → 0.28 → 0.69 → 0.90 → 0.98 → 1` over the tween's duration while
`top` kept climbing from 617px to 521px — i.e. the reveal was still visibly
mid-flight while the section was already comfortably on-screen and the reader
had kept moving.

**Fix applied**: `CONTENT_ENTER_DURATION` in `SectionBeat.tsx` cut from
`0.9`s to `0.45`s. Same repro after the change: non-lit window measured at
~330ms (was equivalent to ~900ms+ before) — roughly halved, resolves within a
normal scroll cadence instead of trailing behind it. Typecheck clean, build
green.

**Not changed, flagged for a follow-up decision**: the `from`-state magnitude
itself (`autoAlpha: 0.12–0.3`, offsets up to 96px, scale down to 0.82–0.90 —
shared across all five `STAGE_CHOREO` variants, `stageChoreo.ts:26-45`) still
produces a real, visible snap the instant a trigger fires on
already-partially-visible content; shortening duration reduces how long that
lasts but not the size of the initial jump. Softening those from-vars (e.g.
raising the floor opacity, shrinking the offset) would reduce the jump itself
but is a page-wide visual tuning change affecting every beat, not a
single-section fix — needs explicit sign-off before touching.

---

## Original pass (superseded above, kept for the record)

Requested: audit home-page scroll animation for jitter, specifically "the
animations are already in place and when moving scrolling thresholds it just
goes into proper transition but was already broken." Scope: home page (`/`)
only, against the **production build** (`yarn build` → `dist/`, served via
`vite preview` on `:4173`), current `main` @ `d4bedd1`.

Method: the in-app Browser pane freezes `requestAnimationFrame` in this
workspace (confirmed, see project memory `browser-pane-freezes-raf`), which
kills every GSAP-ticker-driven trigger. Drove a headless Chromium instead
(Playwright's cached binary, no install) over raw CDP, dispatching real
`Input.dispatchMouseEvent` wheel events — `window.scrollTo` is a no-op against
Lenis, per this repo's own testing note in
`docs/handover-2026-08-18-0830.md`. Sampled every `SectionBeat`'s
`.stage-inner` computed `opacity`/`transform` across full down/up/fast-down
passes of the whole page.

## Result: no scroll-jitter bug found in the current build

The initial pass flagged six "opacity snaps" (a lit section's opacity
dropping sharply then recovering). **These are not bugs — they're the
entrance/exit tweens themselves, sampled mid-flight.** Two things explain
every flagged instance:

1. **Entrance tween caught in progress.** `SectionBeat`'s content reveal
   (`CONTENT_ENTER_DURATION = 0.9`s, `power3.out`) is deliberately
   *time-based*, not scroll-linked (`src/shared/components/stage/SectionBeat.tsx`
   — this is intentional, see that file's own comment on why: keeps the shot
   and content in sync at any scroll velocity). Scroll fast enough and the
   audit's own polling can land mid-tween, reading an intermediate opacity
   like 0.69 one sample before it settles at 1. That is the animation
   playing correctly, not a re-hide.
2. **Exit-dim reaching its floor.** `STAGE_EXIT = { autoAlpha: 0.15, y: -40,
   scale: 0.94 }` (`stageChoreo.ts:56`) is the *intended* cinematic recede as
   a section's bottom edge nears the top of the viewport — every trace tail
   settles at exactly `0.15` and stays there, which is the designed floor,
   not a snap.

Verified this reading two ways: (a) a slow, continuously-sampled pass (every
~90ms, ~450px/s) through the `services` section showed a perfectly smooth,
monotonic opacity curve with zero dips; (b) after speculatively patching
`routes/index.tsx`'s resize-triggered `ScrollTrigger.refresh()` to defer
until Lenis reports idle (on the theory that a refresh mid-scroll was
re-evaluating the exit trigger's `invalidateOnRefresh` scrub against a
half-settled position), a rebuild and re-run produced **numerically
identical** opacity traces to 4 decimal places before and after. That's not
consistent with a timing-dependent refresh race — it's consistent with a
fully deterministic function of scroll position, which is exactly what a
time-based tween sampled at fixed intervals produces. The speculative patch
was reverted (`git diff` clean against `d4bedd1`) rather than left in as an
unproven "fix."

**The one real, already-known limitation**: fast scrolling can outrun the
reveal and the reader perceives it mid-flight rather than complete. This is
explicitly documented already in
`docs/handover-2026-08-18-0830.md` §3.2 — *"Fast scrolling still outruns the
0.4s reveal. Inherent to scroll-reveal; fixable only by shortening/removing
the animation."* This audit reconfirms that limitation is still present
(now against a 0.9s entrance, not 0.4s) and finds nothing beyond it. If a
different symptom is being seen live — e.g. on the deployed UAT box rather
than a fresh local build — it's worth a screen recording, since the two
things this audit ruled out (nested-trigger snap-back, resize-refresh race)
were the leading suspects from the code and neither reproduced.

**Historical bugs already fixed, reconfirmed still fixed as of `d4bedd1`:**
- Nested `SectionBeat` on `services`/`CapabilityRack` (was the suspected
  cause of "services reliably snaps" in the 2026-08-18 handover) — fixed by
  `d85bbb1`, confirmed: `CapabilityRack.tsx` now renders one `SectionBeat`
  at its top level, no inner wrapper.
- `Reveal` clip-path/IntersectionObserver deadlock and `SectionBeat`
  pre-hiding content (`362f7d6`, `0098f5e`, `4a0b3a4`, `b551b77`) — the
  `immediateRender: false` + `onEnter` decide-at-fire-time logic described in
  `SectionBeat.tsx` is present and behaves as documented.

## Real bug found (unrelated to scroll) — unguarded WebGL init in SpecularFx

`src/shared/components/ui/specular/SpecularFx.tsx:223` —

```ts
const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true, dpr });
const gl = renderer.gl;
```

`new Renderer(...)` (the `ogl` library) throws when the browser cannot create
a WebGL context at all — confirmed live: `TypeError: Cannot set properties
of null (setting 'renderer')`, uncaught, from inside `ogl`'s constructor.
There is no `try/catch` around it, and **no error boundary exists anywhere in
this codebase** (`grep -rl "ErrorBoundary\|componentDidCatch" src` — zero
hits).

- Not scroll-related, and not what was reported — flagging it because it
  surfaced during this audit and record-keeping was requested.
- `SpecularFx`'s `start()` is called from `glContextBudget.ts`'s
  `rebalance()`, itself invoked from a `requestAnimationFrame` callback, not
  synchronously inside a React effect body — so this does **not** crash the
  React tree or blank the page. It fails contained: the throwing button's
  `ctx` never gets set, `holder.live` is already `true` when the throw
  happens, so `rebalance()` never retries it — that button's specular rim is
  permanently inert for the session, silently. No user-visible error.
- Blast radius: `SpecularButton`/`SpecularIconButton` render in
  `AppShell.tsx` (every route, not just home) plus
  `CandidatesAndCareersSection` and `DailyLifeSection` on the home page —
  `glContextBudget.ts` itself documents 43 of these across the site.
- Trigger condition: any browser/environment where WebGL context creation
  fails outright — disabled hardware acceleration, a crashed GPU process,
  some locked-down corporate browsers, headless/automated testing (which is
  how this was found — SwiftShader isn't available in this sandbox). Real
  users hitting this are rare but not impossible; `glContextBudget.ts`
  already carefully handles the *"too many contexts"* failure mode (context
  eviction) but never considered *"zero contexts available."*
- Not fixed — out of scope for a scroll audit; recording it here per
  instruction so a future session can pick it up. A minimal fix would wrap
  the `new Renderer(...)` call in `start()` with a `try/catch` that leaves
  `ctx` null and marks the button as permanently non-specular (skip
  `registerSpecular`/treat as `enabled=false`) rather than throwing.

## Audit tooling

Two throwaway CDP scripts were used (session scratchpad, not committed —
see project memory `reusable-cdp-harness` for why a permanent one should live
in-repo instead of being rewritten each session):
- a full-page down/up/fast-down wheel sweep sampling every `[data-stage-section]`'s `.stage-inner`
- a focused fine-grained (~90ms) trace of just `services` across its entrance + traverse

Chromium: Playwright's cached binary at
`~/Library/Caches/ms-playwright/chromium-1237/chrome-mac-arm64/`, driven via
raw DevTools Protocol over the global `WebSocket`/`fetch` (Node 24, no
install). `--disable-gpu` in this sandbox means the hero's R3F canvas and
`SpecularFx` genuinely cannot get WebGL — the flood of `THREE.WebGLRenderer`
console errors during the run is a **sandbox artifact**, not a production
finding, and was filtered out of the opacity analysis above. The one real
exception (`SpecularFx`'s unguarded `new Renderer()`) was kept because it's a
missing-guard bug independent of *why* WebGL failed.
