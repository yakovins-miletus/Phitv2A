# WS-07 — Diagram craft: make the technical figures look designed

**Owner files (exclusive):** `src/shared/components/diagrams/**` · `src/features/services/components/ServiceDrawer.tsx` · `src/shared/components/ReachMap.tsx`
**Depends on:** WS-01 for removing the card wrapper (drafting can run in parallel).
**Agents:** Haiku to inventory every diagram render site, Sonnet to implement.
**Acceptance bar:** `/design-taste-frontend` + taste-skill six commitments.

---

## Why

The brief asked to *"remove/trim every svg asset into image/video… make the graphs look more
professional and slick."* The second half is the real requirement; the first half was
tested and rejected in session, because rasterising these would make them **larger, blurry
at high DPR, and unable to re-theme** — they are a few KB of vector today.

The problem is the **drawing**, and screenshot 1 shows it exactly. `SignalDiagram.tsx`
renders, in a 400×200 viewBox:

```ts
// SignalDiagram.tsx:9-13
const NOISE_PATH  = "M 20 130 L 45 80 L 70 150 L 95 70 L 120 140 L 150 105";  // 6 points
const SIGNAL_PATH = "M 250 105 L 380 45";                                      // a straight line
```

…plus a 70×80 rectangle with three horizontal rungs, labelled `model`. A hand-drawn
zigzag, an empty box, and a straight line — floating in an oversized rounded card, under a
headline that promises "Statistical models and machine learning applied to noisy market
data." The figure does not support the claim; it undercuts it.

**Note what is already right.** These are not badly *engineered*. `SignalDiagram.tsx:23-42`
has `useReducedMotion`, a `useInView` gate, `role="img"` and a real `aria-label`. This
workstream is about visual craft only — **preserve every one of those properties.**

## Current state (verified)

| File | Lines | Note |
|---|---|---|
| `diagrams/SignalDiagram.tsx` | 120 | the screenshot-1 figure |
| `diagrams/PipelineDiagram.tsx` | 124 | |
| `diagrams/ProcessDiagram.tsx` | 197 | three chamfered slabs; has `tests/process-diagram.test.tsx` |
| `diagrams/FollowTheSunDiagram.tsx` | 91 | |
| `services/components/ServiceDrawer.tsx` | 376 | five inline SVG backdrops, 400×400-540×400 |
| `shared/components/ReachMap.tsx` | — | world map, city markers, arcs |

✅ **Already fixed, do not redo.** `docs/perf-baseline.md` originally recorded
`react-hooks/refs` ("Cannot access ref value during render") in `SignalDiagram`, `ReachMap`,
`PipelineDiagram`, `FollowTheSunDiagram` as part of a 30-error lint baseline. That baseline
is gone — `yarn lint` is at 0 errors sitewide as of commit `427cd22` ("collapse the four
figures onto shared geometric marks"), made outside this workstream's own history. Step 5
below and the matching Verification line are stale; skip both. The visual craft work in
Target State is otherwise fully in scope and unaffected.

## Target state

Figures that read as instrumentation rather than whiteboard sketches. The bar:

- **Real data shape, not a doodle.** A noise trace should look like sampled series data —
  many small irregular steps — not six line segments. Generate the path from a seeded
  function so it has believable density and is deterministic across renders.
- **The gate must show mechanism.** An empty rectangle labelled `model` says nothing. Show
  something happening: layered transforms, a distribution narrowing, weights, a windowed
  operation. Whatever is *true* of the service being described.
- **Composition and hierarchy.** Deliberate optical margins, a clear read order, labels
  positioned against the figure rather than floating near it. Set the mono labels in the
  established `TYPE_SCALE.micro` / `TRACKING.meta` treatment instead of ad-hoc sizes.
- **Restrained palette.** Navy structure, gold for the single element that carries meaning.
  Gold is a highlight, not a second body colour. Follow WS-01's accent rule.
- **Motion earns its place.** The draw-on reveal should trace the *reading order* of the
  figure, so it teaches the diagram; it should not just be a `drawSVG` because it's free.

## Steps

1. Inventory every render site for all six components and note what claim each figure sits
   under — the figure has to support *that* sentence.
2. Redesign `SignalDiagram` first as the reference. Get it approved before touching the
   rest; it establishes the visual language the other five follow.
3. Apply the language to `PipelineDiagram`, `FollowTheSunDiagram`, `ProcessDiagram`, then
   the five `ServiceDrawer` backdrops.
4. `ReachMap` last — it is the most complex and the least broken.
5. ~~Clear the `react-hooks/refs` lint errors in these files as you go.~~ Already fixed
   (`427cd22`) — skip.
6. Preserve on every component: `role="img"`, an accurate `aria-label` (update the text if
   the figure changes), `useReducedMotion`, and the `useInView` gate.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn typecheck && yarn test && yarn lint && yarn build
```

- `yarn lint` — stays at 0 errors sitewide (already true before this workstream starts).
- `tests/process-diagram.test.tsx` still passes.
- Side-by-side screenshots, before/after, each figure at 375 / 768 / 1440.
- Render each on light and dark grounds — they must re-theme, which is the whole reason
  they stayed SVG.
- File size per component unchanged or smaller. If a redesign balloons the path data,
  that is a signal it became decoration.
- `prefers-reduced-motion: reduce` → final state renders immediately, fully legible.
- Read each `aria-label` aloud against the new figure. If it no longer describes it, it is a bug.

## Out of scope

Rasterising anything (tested and rejected — see Why). The card/container around the
diagrams — that is WS-01's job. Services page copy and layout (WS-10).
