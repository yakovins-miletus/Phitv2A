# WS-17 — Give the pixel wipe its own section, and stop it bleeding

**Owner files (exclusive):** `src/shared/components/ground/**` (GroundLayer, groundStops) · `src/shared/sections.ts`
**Depends on:** nothing. **Feeds:** WS-16 item 5 (needs a navy ground), WS-02 (Home section order changes the stop sequence).
**Agents:** Haiku to map the ground system end to end, Sonnet to implement. **This one needs diagnosis before code.**

---

## Why

The site has an agreed background treatment: a **pixel-by-pixel / per-tile wipe** that plays
as the ground colour changes between sections. It is currently misbehaving in two distinct
ways, reported from the running site:

1. **On `/about`, it fires immediately at the hero** — a wipe plays and then disappears at a
   point where no ground change should be happening at all. It should not be there.
2. **On Home, it overlaps other scrolling content.** The wipe runs *across* adjacent
   sections instead of being contained.

**The agreed behaviour, stated plainly:** the pixel wipe should **own a section of its own
within the page** and play as the user scrolls through *that* section. It is a transition
between grounds, not an effect layered over whatever happens to be on screen.

Today it is a fixed-position layer sampling section boundaries with a 560px blend
(`GroundLayer.tsx:15` `BLEND_PX = 560`, sampling at `:162-197`), so by construction it bleeds
across whatever content sits inside that 560px window. That is the architectural cause of
both symptoms.

## Current state (verified)

- `src/shared/components/ground/GroundLayer.tsx` — fixed-position, scroll-driven. Renders via
  WebGL2 per-tile wipe where supported, CSS crossfade otherwise. `sampleGround()` at
  `:162-197`, smooth-step over `BLEND_PX = 560` at `:15`.
- `src/shared/sections.ts` — declares the ordered section list and each section's ground
  (`deep` / `panel` / `field` / …). `src/shared/components/ground/groundStops.ts` derives the
  stops.
- About's sequence runs `daily-life: deep` → `candidates: panel` → `testimonials: panel` →
  `blog: field`, i.e. navy → light → light → navy in a short scroll span.
- ⚠️ **Doc staleness found by WS-06:** Lenis is no longer home-only. `about.tsx:182` mounts
  `SmoothScroll` too. The root `CLAUDE.md` still claims "home route only" — do not trust it.
  Scroll timing on About is now Lenis-driven, which is relevant to any scroll-linked fix here.

## Step 1 — Diagnose before you change anything

Do not start by tuning `BLEND_PX`. Answer these first and write the answers down:

1. **Why does a wipe fire at the About hero at all?** Is a ground stop declared there, is the
   layer initialising with a wrong first sample, or is it a mount-time flash before the first
   real sample lands? A wipe on first paint with no ground change is a bug, not a tuning issue.
2. **What exactly bleeds on Home?** Capture the scroll range where the wipe is active and
   which sections are on screen during it. Compare against the intended stop.
3. **Is the wipe reversible/idempotent on scroll-up?** The report says the blue band "weirdly
   moves" — check whether the artifact is the wipe running backwards or re-entering.
4. Does the WebGL2 path and the CSS fallback behave the same? Reproduce on both.

## Step 2 — The architectural change

Give the transition a **scroll-owned region**. Concretely: a ground change belongs to a
declared transition band between two sections, and the wipe plays across exactly that band —
not a 560px window centred wherever the boundary happens to fall over live content.

Implications to work through and record:
- Section ground declarations in `sections.ts` gain an explicit transition region rather than
  an implicit blend either side of a boundary.
- Adjacent sections sharing a ground (About's `panel` → `panel`) must produce **no**
  transition at all. That pair is a likely source of the current banding.
- The first section of a route must establish its ground with **no** wipe.

## Step 3 — Fix the sequences

- **About:** consolidate so the ground does not alternate navy/light/light/navy across a short
  span. **WS-16 item 5 requires `daily-life` ("THESE ARE THE PEOPLE WHO DO IT" + video) to sit
  on the primary NAVY ground** — it is currently rendering gold display type on white, which
  both blends into the preceding beat and is a 1.45:1 contrast failure. Apply that here;
  WS-16 owns the component, this workstream owns its ground.
- **Home:** WS-02 removes `MarketPosition` and all four people-sections
  (`DailyLifeSection`, `CandidatesAndCareersSection`, `TestimonialsSection`, `BlogSection`).
  The stop sequence must be re-derived after that lands, not before.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn typecheck && yarn test && yarn build && yarn preview
```

- **The core check:** scroll `/about` top to bottom, then bottom to top. No wipe at the hero.
  No banding. Every transition happens inside its own region with no other content mid-wipe.
- Same on `/` and on every other route — this layer paints the whole site, so a fix that
  helps About and breaks Services is not a fix.
- Adjacent same-ground sections produce no transition. Verify by instrumenting, not by eye.
- WebGL2 path **and** CSS fallback both correct (force the fallback to test it).
- `prefers-reduced-motion: reduce` — grounds change without the wipe, never mid-content.
- `tests/home-reduced-motion.test.tsx` pins ground values; it must still pass.
- Record before/after frame timing. This runs on every scroll on every page — a correctness
  fix that costs frames is a regression.

## Step 1 findings

Diagnosed 2026-08-25. Method: read `GroundLayer.tsx`, `groundStops.ts`, `glGround.ts`,
`sections.ts` (current working-tree state, which already has WS-02's in-flight reorder — see
caveat at the end), and `about.tsx`; then built and served the app twice — `yarn build` failed
only on a pre-existing, unrelated `tests/accent-role.test.ts` type error (not touched by this
workstream), so I built with `npx vite build` + `vite preview` directly (a real production
bundle, just skipping the failing `tsc -b` gate) and separately ran `vite --port 5183` in dev
to read the `window.__ground` dev probe (`GroundLayer.tsx`'s `import.meta.env.DEV` block).
Verified with `git status` throughout that I made no source edits — the working tree already
carries unrelated pre-existing WIP (WS-02's `sections.ts`/`index.tsx` changes, an unrelated
`ws-16` doc edit) that predates this session and that I did not touch or need to revert.

**Environment caveat:** this session's CDP browser pane freezes rAF when backgrounded
(a known issue, see project memory), and `window.scrollTo()` does not drive Lenis's virtual
scroll position (`window.__lenis.scroll` stayed `0` after a `scrollTo(0, 17000)` even though
`window.scrollY` read back `17000`), so programmatic-scroll + dev-probe polling produced stale
`__ground` snapshots (`paint()` simply hadn't ticked). Findings for B/C/E below therefore lean
on static/code analysis plus real (non-programmatic) scroll and load-timing screenshots, not on
polled `__ground` snapshots at arbitrary scroll offsets. This is called out per-item.

### A. Why does a wipe fire at the About hero at all? — CONFIRMED BUG, mount-time flash

Reproduced visually. Screenshot immediately after `yarn build && vite preview` loads `/about`:
solid grey per-tile squares are visible over the hero image (WebGL2 rung), before any of the
hero's own type or gold border animate in. A few seconds later, once the page settles, the
squares are gone and the hero is clean.

Root cause is exactly the third hypothesis this doc named up front, and it is a real bug, not a
declared ground stop at the hero: **`daily-life` is `ABOUT_GROUND_STOPS[0]`, and its measured
document offset is wrong at first paint.** Evidence, from the dev `__ground` probe read ~2s
after load (settled state): `positions: [15015, 15645, 17309, 24600]` for
`daily-life/candidates/testimonials/blog` — i.e. `daily-life` sits ~15,000px down the page,
nowhere near the hero. But `GroundLayer`'s effect calls `measure()` once synchronously as soon
as `ready` (the preloader gate) flips true, and `measure()` reads
`el.getBoundingClientRect().top` for content that, at that exact instant, has not finished
laying out — hero image/fonts still swapping, and everything in the big `SmoothSection`/
`PoweredBySection`/`JourneyTimeline`/`TalentSection`/`GraduateHallOfFameSection`/
`CertificationsSection` stack that sits *between* the hero and `daily-life` in the DOM has not
reflowed to its final height yet. On that first, too-short layout, `daily-life`'s offset reads
much smaller than 15,000px — small enough that `scrollY` (still ~0, at the hero) falls inside
`sampleGround`'s `blendPx` window for the `daily-life → candidates` boundary, so `progress` is
briefly nonzero and the WebGL renderer paints a live per-tile wipe over the hero. The `docH`
check in `paint()` (`GroundLayer.tsx`, the `if (docH !== lastDocH) measure()` block) and the
`ScrollTrigger` `refresh` listener + one `requestAnimationFrame(remeasure)` call do correct this
shortly after — which is exactly the "fires immediately, then disappears" report. There is no
ground stop declared at the hero (the hero isn't in `ABOUT_SECTIONS`/`ABOUT_GROUND_STOPS` at
all); this is purely a stale-measurement race between `ready` firing and layout settling.

This is a bug, not a tuning knob: no `BLEND_PX` value fixes a wipe driven by transiently-wrong
`positions[]`. Step 2 needs either (a) suppressing all wipe rendering until the *first* accurate
post-layout measurement lands (e.g. don't call `paint()`/`gl.render()` before at least one
`ScrollTrigger` refresh or a layout-stable check has occurred), or (b) not painting anything but
the flat `stops[0].color` until `scrollY` has moved at all — the intended product per this doc's
own "Why" section ("a transition between grounds, not an effect layered over whatever happens to
be on screen") already implies the very first section of a route should render zero wipe frames.

### B. What exactly bleeds on Home?

Not fully reproduced live (see environment caveat — Home's hero is a pinned/scrubbed
`ScrollTrigger` sequence and this session's scroll-simulation tooling couldn't drive it
reliably through CDP in the time available). Reasoned from `sections.ts`'s **current** ground
track (note: the working tree already has WS-02's in-flight reorder, not the sequence this doc's
"Why" section describes — I read what's actually live): rendered stops, in order, are
`hero(void) → global-markets(deep) → hero-pillars(void) → services(void) → use-cases(panel) →
process(deep) → hero-mission(panel) → reach(white) → closing(field)`. That is six colour
changes in the first six stops after the hero, each opening a 560px blend window on its
approach. `sampleGround`'s window is a fixed 560px `min(blendPx, nextPos - positions[i])`
regardless of how tall the section is — if any of `global-markets`, `hero-pillars`, or
`services` render shorter than ~560px of scroll (plausible for `global-markets`, described in
the code comment as "its own full-viewport beat" but not guaranteed with dynamic viewport
heights, and for the two `void` sections back to back), consecutive blend windows overlap, and
the wipe for boundary *N+1* starts before boundary *N*'s wipe has finished — which reads exactly
as "the wipe overlaps other scrolling content" once you're several sections past the hero,
because at that point the fixed window has no concept of "this section's content" at all, only
raw pixel distance to the next boundary. This matches the doc's stated architectural cause
(560px window centred on a boundary, independent of content) but I do not have a live-scroll
capture of Home confirming the specific overlapping section in this run — flagging as
**plausible, code-confirmed mechanism, not directly screen-captured this pass.**

### C. Is the wipe reversible/idempotent on scroll-up?

Not independently reproduced this pass (same tooling limitation). By inspection of
`sampleGround`: it is a pure function of `scrollY` and the (memoized) `positions[]` array — same
inputs give the same `progress`/`from`/`to` regardless of scroll direction, so the maths itself
has no directional state and should be idempotent in principle. The one direction-sensitive path
I can point to concretely: `paint()`'s GL branch dedupes on
`` `${fromIndex}|${progress.toFixed(3)}` ``, which is direction-agnostic, so it should redraw
correctly on the way back up. **The likelier source of a "weirdly moves" band is not
scroll-direction asymmetry in the sampler — it's the same stale-`positions[]` bug as A.**
Any resize, font-swap, image decode, or (on About) `SmoothSection`/pin-spacer geometry change
that fires *after* the user has already scrolled past a boundary shifts `positions[]` out from
under an already-progressed wipe, and the next tick's `sampleGround` call jumps `progress`
discontinuously for the same `scrollY` — which looks like the band "moving" independent of the
user's scroll input. This needs a live repro to confirm as the specific mechanism behind "weirdly
moves," but it is the same class of bug as A (measurement racing layout), not a new one, and
Step 2 should fix both with the same mechanism (stable, pin-final positions before any wipe
renders).

### D. Do WebGL2 and CSS fallback behave the same?

Observed both render paths in this session (not by forcing the flag, but because dev and preview
happened to select different rungs): the dev-server load at scroll 0 reported
`renderer: "css"`; the same route immediately after a real `vite build`/`preview` used
`renderer: "webgl2"` (confirmed visually — the grey per-tile squares in the A screenshot are the
WebGL rung's per-tile hash; the CSS rung has no tiling, it's a single interpolated
`background-color`). I did not force `lowPower`/context-loss to get a controlled side-by-side at
the *same* boundary. By code inspection they are **not** behaviorally identical in one relevant
way for E below: the WebGL shader mixes `uFrom`/`uTo` per tile via a hashed threshold
(`glGround.ts`), so if `uFrom === uTo` the tiles still "flip" every frame but every tile is the
same colour before and after — no visible artifact, just wasted GPU work. The CSS rung
interpolates `background-color` directly; if `from === to` the interpolated value never changes,
so `paint()`'s `if (css === lastCss) return` short-circuits immediately and there's no wasted
work at all. Net: no visible bug in either rung for same-ground pairs, but WebGL does strictly
more (redundant) work than CSS does for a no-op boundary. Full A/B forcing both rungs on the
same live boundary is still outstanding.

### E. Do same-ground adjacent sections (panel → panel) produce a spurious transition?

**No visible transition, confirmed by code — but also no explicit no-op guard, confirmed by
code.** `sampleGround` (`groundStops.ts`) computes `progress`/`from`/`to` purely from position
math; it never compares `current.ground` to `next.ground`, so a `panel → panel` boundary (About's
`candidates → testimonials`, and structurally the same shape as `use-cases(panel) →
hero-mission(panel)` pattern on Home once other boundaries are between them) still gets a full
smoothstep ramp and a full GL tile-flip pass — `from` and `to` just happen to be numerically
identical RGB triples. Visually this is a no-op (see D), so **the doc's suspicion that
`panel → panel` is "a likely source of the current banding" does not hold up under code
inspection** — banding needs `from !== to`, and `parseGround` maps `"panel"` to the same hex
both times. What it *does* cost is a wasted GL draw every tick while inside that boundary's
560px window (the `lastKey` dedupe in `paint()` is keyed on `fromIndex|progress`, which still
changes every frame during the ramp even though the rendered pixels don't). Step 2 should still
add an explicit `current.ground === next.ground` short-circuit — not because it's currently
visibly wrong, but because it's the cheap, correct fix and because Step 2's "scroll-owned
region" model (below) needs a same-ground pair to occupy *zero* scroll-owned band width, not a
560px band that merely happens to render a no-op.

## Symptom-by-symptom summary

| # | Symptom | Status |
|---|---|---|
| 1 | Wipe fires at About hero with no ground change | **Reproduced.** Root cause: `measure()` runs on a not-yet-settled layout before `ready`'s first `paint()`; corrects itself once `ScrollTrigger` refresh / `docH` check / rAF settle re-measures. Real bug (A). |
| 2 | Wipe overlaps adjacent content on Home | **Not directly reproduced this session** (tooling: pinned-hero + CDP scroll simulation didn't drive reliably). Mechanism is code-confirmed: fixed 560px windows on several closely-spaced boundaries in the current (WS-02-reordered) Home track can overlap regardless of content. Needs a follow-up live-scroll capture before Step 2 lands, to confirm which specific boundary pair is worst. |
| 3 | Blue band "weirdly moves" | **Not directly reproduced this session.** Most likely explanation from code: same stale-`positions[]` race as symptom 1, but triggered mid-scroll (post-boundary) by a late layout shift (pin-spacer insertion, font swap, image decode) rather than only at mount. Not confirmed as scroll-direction asymmetry — `sampleGround` itself has no directional state. |

## Step 2 — proposed architecture (not implemented)

Do not implement yet; recording the shape for the next pass.

**Give each transition an explicit, declared scroll-owned band instead of an implicit 560px
window centred on wherever a boundary lands.** Concretely:

- `sections.ts` (or a new small layer between it and `groundStops.ts`) declares transitions, not
  just sections: for each pair of adjacent rendered sections, either `{ kind: "cut" }` (grounds
  match — zero-width, sampler short-circuits, no GL/CSS work at all) or
  `{ kind: "wipe", band: number }` where `band` is explicit and can vary per boundary instead of
  a single global `BLEND_PX`. A short, punchy section (like `global-markets`, described as "its
  own full-viewport beat") gets a band sized to what it can actually afford without bleeding into
  its neighbors; a long section can afford the current 560px or more.
- The **first rendered section of a route establishes its ground with no wipe, structurally, not
  by chance.** Concretely: `sampleGround` (or its caller) should never call `gl.render`/set
  `host.style.backgroundColor` from a live sample until the layer has done at least one
  *layout-stable* measurement pass — i.e. `positions[]` must be sourced from a post-`ScrollTrigger`-refresh
  measurement, not from `measure()`'s first synchronous call in the mount effect. This directly
  fixes A and very plausibly C. The simplest version: gate `paint()` behind a `layoutStable`
  boolean that only flips true after the first `ScrollTrigger` "refresh" event (or, lacking one,
  after `docH` has been stable across two consecutive ticks), and paint only the flat
  `stops[0].color` until then — which is also just... the intended behaviour already stated in
  this doc's "Why" section.
- Same-ground adjacent pairs (`candidates → testimonials`, and any future pair) become `{ kind:
  "cut" }` transitions with a `band` of 0 — they own no scroll region at all, so they cannot
  overlap anything by construction, rather than relying on `from === to` happening to be visually
  silent (E). This also removes the wasted GL/CSS redraw noted in D/E.
- `ABOUT_SECTIONS`/`HOME_SECTIONS` adjacency changes (WS-02's Home reorder, any future insert)
  become a data change to the transitions list, not a re-tune of a single global `BLEND_PX` — the
  failure mode in B (several short sections each opening a fixed-size window) goes away because
  each boundary's band is sized to what that specific boundary can afford, and bands are
  data, not inferred from measured pixel gaps.
- Implication for `groundStops.ts`: `buildGroundStops`/`sampleGround` need to accept a per-boundary
  band (or 0-width cut) instead of a single `blendPx` parameter threaded in from `GroundLayer.tsx`;
  `GROUND_STOPS`/`ABOUT_GROUND_STOPS` stay a flat ordered list, but the boundary metadata between
  entries needs a home — likely a parallel `transitions: readonly Transition[]` derived
  alongside `stops` in the same `buildGroundStops` call, indexed by `i` to `i+1`.
- Implication for `GroundLayer.tsx`: `BLEND_PX` module constant goes away in favor of reading each
  transition's own band; the `layoutStable` gate above is a new piece of mount-sequencing state
  that doesn't exist today.

## Out of scope

Section content and layout (WS-16 for About, WS-02 for Home). The About hero strips (WS-05).
Deleting GroundLayer — it paints every route; the goal is to contain the transition, not
remove the system.
