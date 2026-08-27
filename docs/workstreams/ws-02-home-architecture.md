# WS-02 — Home: service-centric re-architecture

**Owner files (exclusive):** `src/routes/index.tsx` · `src/features/home/**` **except `components/ClosingShelf.tsx` and the closing-scene directory** · `src/features/hero/description/**` (MissionStatement, MarketPosition, OperatingPillars, ServiceGlobe)
**Not owned:** `SuperHeroSequence.tsx` — **WS-03 owns it.** Hero copy changes are handed over, not made here. `ClosingShelf.tsx` and the new closing scene — **WS-04 owns those.** WS-02 may change *where the closing sits in the order*, never what it renders.
**Depends on:** WS-01 (tokens). **Coordinates with:** WS-03 (hero), WS-04 (closing).
**Agents:** Haiku to map section composition, Sonnet to implement. Narration via `/story-narration`.
**Acceptance bar:** `/design-taste-frontend` + taste-skill.

---

## Decisions from the session — these are the contract

| Question | Answer |
|---|---|
| What a visitor must believe past the fold | **"They build the systems I need."** Capability-first. |
| What dies | **`MarketPosition`** — plus **all four people-sections**, see below. |
| People on Home | **None.** Home is service-centric; people content lives on `/about` only. |
| Heritage framing | **Demoted.** It no longer leads. |
| Global-markets text blob | Lifted into its **own full-viewport-height section**. |

## ⚠️ UPDATED — Home loses all people content

A later session decision materially widened this. **Home is service-centric and carries no
people content.** These four sections render on both `/` and `/about` today and must be
**removed from `src/routes/index.tsx`** — they stay on About:

- `DailyLifeSection`  (the culture film)
- `CandidatesAndCareersSection`
- `TestimonialsSection`
- `BlogSection`

Plus `MarketPosition`, which is deleted outright (it restates `MissionStatement`).

**Remove them from the Home route only. Do NOT edit the components themselves** — WS-16 owns
`DailyLifeSection` and `CandidatesAndCareersSection` for its own fixes, and once they are
About-only no variant props are needed.

Surviving on Home: `SuperHeroSequence`, `MissionStatement`, `OperatingPillars`,
`UseCasesNarrative`, `ProcessSection`, `ReachSection`, `ClosingShelf`, plus the new
full-height global-markets section.

The remaining work is still threefold and is not deletion:
1. **Order** — services arrive early instead of fourth.
2. **Narration** — the copy is rewritten so each beat earns the next.
3. **Emphasis** — heritage stops leading; capability does.

## Why

The brief: *"Home Page to be service-centric + still needs proper narration."*

Today the order is:

```
SuperHeroSequence → MissionStatement → OperatingPillars → MarketPosition
→ UseCasesNarrative → ProcessSection → ReachSection → ClosingShelf
```

A visitor meets a heritage hero ("7 YEARS OF EXCELLENCE" / "GENERATIONS OF
COMPETITIVENESS"), then **two consecutive identity sections** — `MissionStatement`
("financial-sciences and engineering powerhouse") and `MarketPosition` — before anything
resembling a service appears. Four sections of *who we are* precede the first *what we do*.
That is the inversion this workstream fixes, and it is also why `MarketPosition` is the one
that dies: it restates `MissionStatement`'s job.

## Current state (verified)

- `src/routes/index.tsx` composes the eight sections above.
- `MissionStatement.tsx` — Act I beat 1, the claim. Lazy-mounts `ServiceGlobe` behind a
  `useInView` gate at `MissionStatement.tsx:52-65` (900px prefetch margin). **That gate is
  load-bearing** — it is what keeps three.js off the home critical path
  (`docs/perf-audit-2026-08-23.md`: 463 KB → 196 KB). If the section moves, the gate moves
  with it, intact.
- The text blob to lift: `CONTENT.hero.salesPitch.execSummary`, rendered at
  `MissionStatement.tsx:144-146` —
  *"At Phitopolis, we view global markets as the ultimate intellectual puzzle. Operating as
  a specialized R&D firm, we build cloud-native systems, data science engines, and
  artificial intelligence solutions for international clients…"*
  Sourced from `content.ts:42-43`.
- `SectionBeat.tsx` orchestrates entrance/exit per section; `stagePresence.ts` tracks which
  section holds the viewport for the `EyeFlow` dot rail. **Both must stay consistent with
  any new order** — the dot rail is derived, so a reordered page with a stale rail is a bug.

## Target state

**Order** — capability early, identity as support, proof at the end:

1. `SuperHeroSequence` — capability-led (**copy change handed to WS-03**)
2. **Global-markets statement** — the lifted blob, own full-viewport section
3. `OperatingPillars` / `UseCasesNarrative` — what we actually build
4. `ProcessSection` — how it gets built
5. `MissionStatement` — who we are, now as *support* for claims already made (globe intact)
6. `ReachSection` — scale as proof
7. `ClosingShelf` → WS-04's isometric closing

This is a starting proposal, not scripture — but any deviation must still satisfy the fold
test below.

**The lifted section.** Full viewport height, the blob as the only content. It is a strong
paragraph currently buried as a sub-element at 68ch inside another section. Set it as a
statement: large, generously led, alone. Resist adding a graphic to it — the whole point is
that the words carry the beat.

**Narration.** Run `/story-narration` with a locked voice card across all sections. The
test for each beat: *does the previous section make this one necessary?* Anything that
could be reordered without loss isn't a beat, it's a slide.

## Steps

1. Map current composition and the `SectionBeat` / `stagePresence` wiring in `index.tsx`.
2. **Hand off to WS-03:** the hero copy must lead with capability, not heritage. Write the
   requested direction into a `## Handoff to WS-03` section at the bottom of this file. Do
   not edit `SuperHeroSequence.tsx`.
3. Build the full-height global-markets section; remove the blob from
   `MissionStatement.tsx:144-146`.
4. Delete `MarketPosition` and its route reference. Check nothing else imports it.
5. Re-order `index.tsx`. Move `MissionStatement` **with** its `ServiceGlobe` gate untouched.
6. Update `stagePresence` / `EyeFlow` rail entries to the new order.
6a. **Hand off to WS-17:** removing five sections changes Home's ground-stop sequence.
   WS-17 owns `sections.ts` and re-derives the stops; report the new order to it rather
   than editing ground declarations here.
7. Narration pass across every surviving section.
8. Re-verify the beat choreography — `SectionBeat` entrance/exit was tuned for the old
   adjacencies and will need retiming.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn typecheck && yarn test && yarn build && yarn preview
```

- **The fold test.** Show `/` to someone unfamiliar, scroll one screen, ask what the company
  does. If the answer is about history or scale rather than systems built, the workstream
  has failed regardless of how it looks.
- **Perf gate:** home JS stays ~196 KB; `three` stays lazy. Verify with
  `grep` over `dist/` that three is not in the entry chunk. The `ServiceGlobe` gate is the
  single easiest thing to break here.
- `tests/home-route.test.tsx` and `tests/home-reduced-motion.test.tsx` pass — update
  deliberately if they assert the old order.
- Dot-rail / `EyeFlow` matches the new section order; clicking each entry lands correctly.
- No dead imports of `MarketPosition`: `grep -rn "MarketPosition" src/` returns nothing.
- Screenshots of the full page at 375 / 768 / 1440.
- `prefers-reduced-motion: reduce` — full page readable, all beats resolved.

## Handoff to WS-03

The hero should open on capability, not heritage. Concretely:

- Lead line: state what Phitopolis builds (quantitative R&D, cloud-native systems, AI for
  global markets) — not how long it has existed or how many generations of anything. "7 YEARS
  OF EXCELLENCE" and "GENERATIONS OF COMPETITIVENESS" should not be the first thing a visitor
  reads. Heritage framing is demoted, not deleted — it can still live below the fold or in a
  secondary line, just not as the opener.
- The section immediately following the hero is now `GlobalMarketsStatement` — a full-viewport
  restatement of the company's one intellectual bet ("we view global markets as the ultimate
  intellectual puzzle…"). The hero's own copy should set up that beat, not compete with it or
  duplicate its content: the hero states *what we do*, the next screen states *why it's hard
  and worth doing*.
- WS-02 did not touch `SuperHeroSequence.tsx` — this is a direction, not a diff. WS-03 owns the
  file and the actual copy edit.

## Handoff to WS-17

Home's ground-stop sequence changed with the re-order and the `MarketPosition` deletion.
`WS-17` owns `src/shared/sections.ts`'s consumer in `groundStops.ts` and re-derives the
stops from `HOME_SECTIONS` — no ground declarations were edited here beyond what the
section registry itself now carries.

**New Home section order** (`src/routes/index.tsx`, mirrored in `HOME_SECTIONS`):

1. `SuperHeroSequence` (`hero-flatten` / `hero-align` / `hero-reveal` / `hero-dwell` / `hero`)
2. **`GlobalMarketsStatement`** (`global-markets`, NEW) — the lifted text blob, full viewport,
   ground `deep`
3. `OperatingPillars` (`hero-pillars`), ground `void`
4. `UseCasesNarrative` (`use-cases`), ground `panel`, owns its own pin
5. `ProcessSection` (`process`), ground `deep`
6. `MissionStatement` (`hero-mission`) — moved here from position 2; ground `panel`; the
   `ServiceGlobe` `useInView` lazy-mount gate moved with it, unmodified
7. `ReachSection` (`reach`), ground `white`
8. `ClosingShelf` (`closing`), ground `field`

**Deleted:** `MarketPosition` (`hero-position`) — removed from `HOME_SECTIONS` entirely, its
component file deleted. It restated `MissionStatement`'s job and carried no unique claim.

**Chapters** (`CHAPTERS` in `sections.ts`) were renumbered to match: `global-markets` gets its
own chapter (4, "QUANTITATIVE R&D", shared with the hero), pillars/use-cases/process share
chapter 5 ("PRACTICE"), `hero-mission` gets its own chapter 6 ("WHO WE ARE"), `reach` is now
chapter 7, `closing` is chapter 8 ("HORIZON"). Nine chapters total (0-8), up from eight (0-7) —
the net effect of deleting one section and giving two others (the new blob section, and
`MissionStatement` in its new support role) their own chapter identity instead of sharing
chapter 4 with everything else in the old "QUANTITATIVE R&D" catch-all.

`sectionOrder()`/`refreshPriorityFor()` need no separate update — both derive from array
position in `HOME_SECTIONS`, so the reorder above already re-derived every beat's refresh
priority automatically.

## Out of scope

`SuperHeroSequence.tsx` (WS-03). `ClosingShelf.tsx` and the closing scene (WS-04) — WS-02
only positions it in `index.tsx`. Theme tokens (WS-01).
Diagrams rendered inside `UseCasesNarrative` (WS-07). Deleting any section other than
`MarketPosition`.
