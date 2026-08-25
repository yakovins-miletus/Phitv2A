# WS-11 — Careers: flatten the dossier, calm the expanded state

**Owner files (exclusive):** `src/routes/careers.index.tsx` · `src/routes/careers.$jobId.tsx` · `src/shared/careersData.ts`
**Depends on:** WS-01 (flattened surfaces).
**Agents:** Haiku to map the expanded-card render tree, Sonnet to implement.
**Acceptance bar:** `/design-taste-frontend`.

---

## Why

Two items, both confirmed by the brief against screenshots 3 and 5. Scope is deliberately
narrow: the sticky-header overlap and the filter chip row were considered and **excluded**.

**1. The expanded dossier is three containers deep.** Screenshot 3: an outer card holds a
`DEPT // LOC // TYPE` meta strip in its own panel, which sits above a "ROLE SPECIFICATION
SUMMARY" block, with stack chips below — each with its own fill and border. Three nested
surfaces to present one job. The information is fine; the packaging buries it.

**2. The expanded state is far heavier than the collapsed one.** Compare within screenshot
3: `R&D Internship Program` collapsed is a quiet white row with a navy title. `Technical
Graduate Program` expanded turns gold-tinted, its title goes gold, it gains a gold border,
and its CTA is a solid gold button (`careers.index.tsx:712`, `bgcolor: NOIR.gold`).
Expanding one item should reveal detail, not restyle the page. Right now the gold wash
reads as an alert state.

## Current state (verified)

- `careers.index.tsx:41` — `expandedJobId` state, one open at a time.
- `careers.index.tsx:419` — `isExpanded`; `:440` — `aria-expanded`; `:571` — the
  `PEEK DOSSIER` / `COLLAPSE` toggle label.
- `careers.index.tsx:712-717` — `bgcolor: NOIR.gold`, hover `NOIR.goldLight` (the CTA).
- Data is **fully static** — `CAREER_POSITIONS` in `src/shared/careersData.ts`. No API, so
  no backend risk in this workstream.
- Tests exist and must keep passing: `tests/careers-index.test.tsx`,
  `tests/careers-detail.test.tsx`, `tests/careers-detail-adversarial.test.tsx`.

## Target state

**One surface per job.** The expanded dossier presents `DEPT`/`LOC`/`TYPE`, the summary,
and the stack on a single ground, with hierarchy carried by **spacing, type scale, and
weight** — not by nested boxes. The mono meta labels already have a house treatment
(`TYPE_SCALE.micro`, `TRACKING.meta`); use it rather than a bordered strip.

**Expansion reveals, it does not restyle.** The expanded card keeps the collapsed card's
ground and title colour. Gold survives in exactly one place: the primary CTA. The gold
tint, gold title, and gold border all go. Per WS-01's accent rule, any gold *text* on this
light ground must be `goldInk` — but the better answer here is for the title to simply stay
navy, matching every other card.

## Steps

1. Locate the expanded-card container and strip the gold `bgcolor` / `borderColor` /
   title colour. The card's own ground should be identical expanded and collapsed.
2. Collapse the nested panels: remove the meta-strip's own surface, remove the summary
   block's surface. One card, internal spacing does the grouping.
3. Re-space so the hierarchy still reads without the borders. This is the actual work — a
   flattened card with the old spacing will read as an undifferentiated blob. Expect to
   increase vertical rhythm between groups and reduce it within them.
4. Re-check the stack chips (`C++`, `Python`, …). They are the one place small bordered
   pills may still earn their keep, since they're a genuine list of discrete items — but
   they should be quieter than the CTA.
5. Keep the CTA gold and solid; navy-on-gold is a verified AA pairing
   (`tests/a11y-contrast.test.ts:240-243`).
6. Preserve `aria-expanded` and the keyboard toggle behaviour exactly.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn tsc --noEmit && yarn test && yarn build && yarn preview
```

- All three careers test files pass unchanged.
- Screenshot `/careers` with one card collapsed and one expanded, at 375 / 768 / 1440.
  **The gate:** expanded and collapsed cards must share a ground; the expanded one should
  read as *taller*, not as *different*.
- Count nested surfaces inside an expanded card — target is one.
- Keyboard: tab to `PEEK DOSSIER`, Enter to expand, `aria-expanded` flips, focus is retained.
- Contrast on every text colour in the expanded card ≥4.5:1.

## Out of scope

**Explicitly excluded by the brief:** the sticky-header overlap in screenshot 3, and
redesigning the `ALL / GRADUATE PROGRAM / INTERNSHIPS / …` filter chip row. Also out:
careers content itself, the job detail route's layout, and theme tokens (WS-01).
