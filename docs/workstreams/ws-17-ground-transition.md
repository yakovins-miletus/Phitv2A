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
cd " Master P Frontend/Phitv2A" && yarn tsc --noEmit && yarn test && yarn build && yarn preview
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

## Out of scope

Section content and layout (WS-16 for About, WS-02 for Home). The About hero strips (WS-05).
Deleting GroundLayer — it paints every route; the goal is to contain the transition, not
remove the system.
