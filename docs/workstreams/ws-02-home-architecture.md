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
| What dies | **`MarketPosition`** — and only that. |
| Heritage framing | **Demoted.** It no longer leads. |
| Global-markets text blob | Lifted into its **own full-viewport-height section**. |

## ⚠️ Scope honesty: this is not really a teardown

The session called for a "full teardown," but exactly **one** of eight sections is being
cut. Do not let the label drive over-reach: `ReachSection`, `OperatingPillars`,
`ProcessSection`, `UseCasesNarrative`, `MissionStatement` and `ClosingShelf` all **survive**.

The real change is threefold, and none of it is deletion:
1. **Order** — services arrive early instead of fourth.
2. **Narration** — the copy is rewritten so each beat earns the next.
3. **Emphasis** — heritage stops leading; capability does.

If an executor finds themselves rewriting section components wholesale, they have
misread this file. Re-sequencing and re-writing is the job.

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
7. Narration pass across every surviving section.
8. Re-verify the beat choreography — `SectionBeat` entrance/exit was tuned for the old
   adjacencies and will need retiming.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn tsc --noEmit && yarn test && yarn build && yarn preview
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

*(populate during implementation: the requested hero copy direction — capability-led, with
heritage demoted below the fold. WS-03 owns `SuperHeroSequence.tsx` and makes the edit.)*

## Out of scope

`SuperHeroSequence.tsx` (WS-03). `ClosingShelf.tsx` and the closing scene (WS-04) — WS-02
only positions it in `index.tsx`. Theme tokens (WS-01).
Diagrams rendered inside `UseCasesNarrative` (WS-07). Deleting any section other than
`MarketPosition`.
