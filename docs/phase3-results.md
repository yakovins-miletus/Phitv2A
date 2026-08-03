# Phase 3 results — anti-slop

---

## 1. Deleted

**Dead components — zero imports, 533 lines:**
`CursorRing.tsx`, `Marquee.tsx`, `MarketTicker.tsx`, `LatencyBadge.tsx`.
(`Marquee` was dead while `PoweredBySection.tsx:289` hand-rolled its own `TechMarqueeRow`
— the shared one was written, abandoned, and reimplemented locally.)

**Decoration without meaning:**
- `GrainOverlay.tsx` — a full-viewport fixed layer at `zIndex: tooltip + 1`, permanently
  composited above everything, at `opacity: 0.05` over a `#F4F7FC` near-white ground.
  Effectively invisible; unconditionally expensive.
- `LiquidNavHandle.tsx` — 137 lines of draggable navbar handle with no discoverability
  affordance and no communicated function.

**The overscroll-navigation hijack — 7,676 characters from `AppShell.tsx`.**
Overscrolling past the footer accumulated "scroll pressure" and auto-navigated to the next
page. It was:
- driven by **non-passive** `wheel` and `touchmove` listeners,
- calling `checkIsAtBottom()` on every tick — which read `scrollY`, `innerHeight`, two
  `scrollHeight`s and an `offsetHeight`, **forcing a full synchronous layout per wheel
  event**,
- tearing down and re-attaching five window listeners mid-gesture, because its own
  `setState` was one of the effect's dependencies,
- hijacking a browser gesture with an escape hatch (Esc) no user could discover.

Removing it also removed the page-curtain wipe and `TransitionLoadingDisplay`, which
existed **only** to service it — `armTransition` was the sole initiator of
`transitionState`.

**What replaced it:** the footer now offers the next chapter as an ordinary link
(`SiteFooter.tsx`). The wayfinding was worth keeping; the gesture theft was not.

**Cascade:** with the handle gone, `overrideMode === "liquid"` rendered identically to
`island`, `src/shared/motion/liquidNavbar.ts` had zero importers, and the CommandPalette
still offered "Navbar: Liquid Mode" as a command that did nothing observable. All three
removed rather than left as a no-op.

| File | Before | After |
|---|---:|---:|
| `AppShell.tsx` | 1,383 | **843** (−540) |
| `SiteFooter.tsx` | 476 | **436** |

Live signature-class effects: **~17 → ~9**, against the award-site budget of 1 + 3-5.

## 2. Tokens

**Off-brand colour purged — 0 remaining** (the only greps that still hit are inside the
comment explaining the removal):

- **Tailwind default palette.** `#E879F9 #38BDF8 #60A5FA #34D399 #A78BFA #F59E0B #F472B6`
  — violet-400, sky-400, blue-400, emerald-400, fuchsia-400, amber-500, pink-400 — were
  the About timeline's per-chapter accents. Seven arbitrary rainbow hues in a navy-and-gold
  brand, saying nothing about the years they labelled.

  Replaced with `CHAPTER_ACCENTS`: a single **navy → gold ramp walked in chronological
  order**, so the colour now carries the same information the timeline does — the story
  warms toward the present and lands on the brand's own gold. Decoration became meaning.

- **macOS traffic lights.** `#FF5F56 #FFBD2E #27C93F` on the fake terminal window in
  `ServiceDrawer.tsx:323-325` — the most literal template residue in the repo. Now three
  brand-gold dots at descending opacity: same read, not Apple's.

- **Tech category accents.** `dev`/`infra`/`data` were Tailwind violet/blue/emerald next
  to a brand-gold `ai`. Re-cut from the same ramp as `TECH_CAT_ACCENTS`.

- **Neon green `#00E676`** ×4 (footer lab-active dot, innovation badges) — a colour in no
  token file. Now `NOIR.live`, a desaturated signal green that reads as "live" without
  shouting.

**Load-bearing navies promoted.** `#06183B`, `#0A1833`, `#061226`, `#04122E` were used
across 19 sites — the footer, mega-drawer, blog and innovation heroes, the services
terminal — with no definition anywhere. Now `NOIR.navyDeep / navyPanel / navyInk /
navyFloor`; **14 of 19 call sites migrated**, 9 files touched.

**Enforcement added.** `palette.ts` opens with *"the single source of truth … so no raw hex
ever lives outside this file"* — a claim that was false by 224 literals. A comment cannot
hold a line, so `eslint.config.js` now carries `no-restricted-syntax` rules banning raw hex
and raw `cubic-bezier(` in both string literals and template literals, with the token files
and the canvas renderer exempted.

Set to **`warn`, not `error`**, deliberately: 194 legacy literals remain, and erroring today
would bury the 29 real errors. It stops the bleeding now and can be promoted once the tail
is cleared. The tail is at least visible and counted for the first time.

## 3. Copy

`docs/copy-audit.md` — **nothing changed**, as agreed. Six findings ranked, each with
`file:line`, why it fails the file's own three-layer contract (`content.ts:6-13`), and a
suggested direction.

Lead finding: the tagline *"Making tomorrow's technology available today"* is used **twice**
— as the home hero (`:17`) and the closing statement (`:386`) — and carries no number, no
named specific and no mechanism. The specific claim that would replace it is already nine
lines away at `content.ts:26`: *"We took two milliseconds down to eighteen microseconds."*

---

## Gates

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ clean |
| `npm test` | ✅ **102 / 102** |
| `npm run lint` | ✅ **29 errors** — *below* the 30-error baseline (deleted files carried violations) + 200 new token warnings, which are the point |
| `npm run build` | ✅ 1.62 s |
| Off-brand colours in `src/` | ✅ **0** |
| Footer next-chapter link | ✅ verified in browser |
| Grain overlay / curtain | ✅ verified gone |

## Carried forward

- **194 legacy hex/cubic-bezier literals** remain as warnings. Worst files:
  `SiteFooter.tsx`, `AppShell.tsx`, `GraduateHallOfFameSection.tsx`,
  `TopNavMegaDrawer.tsx`, `InnovationPostList.tsx`, `PrinciplesValuesShowcase.tsx`.
- **5 of 19** ad-hoc navy sites are inside gradient template strings and were left alone;
  substituting there needs per-site judgement rather than a mechanical replace.
- `useDeviceTier` still only gates `HeroCanvas` and `useBackgroundVideo`. With
  `GrainOverlay` gone, the remaining candidates are the header `backdrop-filter` and
  Lenis `lagSmoothing(0)`.
- `sections.ts:28` — the `closing` entry exists solely so `EyeFlow` draws the right number
  of rail dots. Flagged in the copy audit, not changed.
