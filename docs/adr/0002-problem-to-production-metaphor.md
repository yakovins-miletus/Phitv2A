---
status: "proposed"
date: 2026-08-24
decision-makers: [yaakovins (stakeholder), engineering]
consulted: [/unosrivet:deep-think reasoning trail below]
informed: [Fresko frontend maintainers]
---

# Visual metaphor for the "From Problem To Production" section

**Statement:** Choose a visual metaphor for the home page's Problem→Production
section, given it must occupy exactly one viewport, carry many-in / enclosed-
transform / one-out semantics, use transform+opacity only, and remain meaningful
with motion disabled.

**Cynefin domain:** Complicated — the required semantics are specified and
checkable, so the choice is discoverable by analysis rather than only by
experiment. Not Clear: there is no established best practice for "depict a
delivery process without a pipeline", and the brief explicitly rejects the
conventional answers.

**Routing:** Direction-setting (no candidates on the table; the approach itself
is open) → first principles → inversion.

---

## Reasoning trail

### Model 1 — First-principles decomposition

**Assumptions questioned**

| # | Assumption | Verdict |
|---|---|---|
| A1 | A process must be depicted as a *sequence* | **Assumption.** This is what produced the vertical spine. The stakeholder's own model is not sequential — it is many-to-one with a containment relation. |
| A2 | All six steps deserve equal visual weight | **Assumption**, already broken by the brief: two named among many, two enclosed, one output. Equal weight is what made six identical nodes and 4.05 screens of scroll. |
| A3 | The diagram is driven by scroll progress through the section | **Assumption.** At 3.34 screens of inner height there was ample scrub runway; at one viewport the beat's trigger range is ~2vh total. Enough for one continuous gesture, not six discrete beats. |
| A4 | "Many" requires many elements | **Assumption.** Legibility at 375px caps useful mark count long before "many" is literally satisfied. |

**Ground truths that survived**

- **G1** The section is one viewport. Total scroll runway for internal animation is roughly 2vh (`top bottom` → `bottom top`), not 4 screens.
- **G2** Required semantics: many inputs → two named among them → two operations *enclosed* by a Phitopolis boundary → one output.
- **G3** Transform and opacity only; no second rAF loop (Lenis owns the frame loop).
- **G4** `prefers-reduced-motion` must receive a **static** composition. Therefore **motion cannot be the carrier of meaning** — the still frame must already say everything in G2.
- **G5** 375px is a hard legibility floor.

**Rebuild.** G4 is the load-bearing constraint and it inverts the original design.
A sequence communicates *through time*; a still frame has no time. So the
metaphor must be a **spatial composition legible at a glance**, with motion as
enhancement only. That single deduction eliminates every step-by-step form,
including the one being replaced — the pipeline was not merely too tall, it was
the wrong category of diagram for a one-viewport, reduced-motion-safe section.

### Model 2 — Inversion

*Anti-goal: "How would I guarantee this section is a disaster in six months?"*

| # | Failure mechanism | Verdict | Conversion |
|---|---|---|---|
| 1 | It reads as a **sales funnel** — a narrowing triangle, the single most-copied SaaS diagram | AVOIDABLE | **Disqualifies** any form whose silhouette is a converging triangle. Hard gate, applied before any craft judgement. |
| 2 | At 375px the "many" inputs collapse into illegible noise | AVOIDABLE | Guard: express many-ness with ~8–12 marks and a density gradient, never 40 dots. Verify at 375 before 1440. |
| 3 | Meaning rides on motion, so reduced-motion users get an abstract blob | AVOIDABLE | **Hard gate from G4.** The static frame is the deliverable; the animation is applied to a composition that already reads. |
| 4 | The enclosure is a stroked rectangle with two words in it — generic, says nothing | AVOIDABLE | Guard: the boundary must express **inside vs outside** materially (occlusion, clipping, a change of treatment across the border), not by outline alone. |
| 5 | It becomes a WebGL scene: bundle weight and LCP risk in a mid-page section | AVOIDABLE | **Disqualifies WebGL here.** The page gets exactly one 3D moment and it is the planned closing node-field (ADR-0001). Two competing 3D set-pieces devalue both. |
| 6 | Scrub-choreographed six-beat sequence with ~2vh of runway feels twitchy or never completes | AVOIDABLE | **Disqualifies long scrub choreography.** Use an entrance-triggered timeline, consistent with the SCRUB POLICY in `beatThresholds.ts` (scrub only pins and progress-linked narratives). |
| 7 | It's an orbit / particle swirl — indistinguishable from generic AI-generated hero art | AVOIDABLE | **Disqualifies** concentric orbital layouts. |
| 8 | Six labels plus six captions cannot fit one viewport at 375px | AVOIDABLE | Guard: only the named nodes carry labels; unnamed inputs carry none. The `number`/`label`/`caption` shape of `CONTENT.process` must change to role-based data. |

Inversion produced four hard disqualifications *before* any aesthetic
discussion — funnel silhouette, WebGL, orbital layout, long scrub — and turned
items 2, 4 and 8 into implementation guards.

---

## Rejected options

| Option | Killing evidence |
|---|---|
| Vertical spine with traveling payload (status quo) | Sequential by construction; cannot satisfy G4 (no time in a still frame) and cost 4.05 viewports. |
| Funnel / converging lens | Inversion #1 — the converging-triangle silhouette is the most-copied diagram in the category. Fails the anti-slop brief on sight. |
| Orbital / particle system | Inversion #7 — generic; also carries no containment semantics (G2's enclosure). |
| WebGL / R3F scene | Inversion #5 — competes with the planned closing node-field for the page's single 3D moment, and adds bundle weight mid-page. |
| Scroll-scrubbed multi-beat choreography | Inversion #6 — ~2vh runway (G1) cannot carry six beats; violates the repo's own SCRUB POLICY. |

## Decision

Adopt a **containment-and-refinement** metaphor — a *crucible*, not a conduit:
scattered raw inputs occupying open field, two of them named, drawn across a
material boundary into a Phitopolis vessel within which Build and Operate are
visibly *interior* states, resolving to one refined artifact.

Rendered as **DOM + inline SVG**, composed **static-first**, with an
entrance-triggered timeline layered on top.

**First-order consequences:** `ProcessDiagram.tsx`'s vertical spine and
traveling-payload plumbing are replaced, not adapted. `CONTENT.process` changes
from `{number,label,caption}[]` to role-tagged data (`input` / `named-input` /
`enclosed` / `output`). The section registry drops `establishScale: "major"` to
`"mini"`.

**Second-order consequences:** the page now has exactly one 3D set-piece (the
closing), which raises the bar for that scene rather than diluting it. Role-based
process data is reusable by `/services` later. Removing 3.05 viewports of scroll
shifts every downstream section's offset, forcing full re-verification of pins,
navbar anchors and the ground track.

**Risks (ranked):**
1. "Crucible" is a metaphor *class*, not an executed design — it can still be
   rendered as slop. The `design-taste-frontend` gate is what mitigates this,
   and it has not run yet.
2. Containment is harder to read at 375px than a linear form; the mobile
   composition may need to differ structurally, not just reflow.
3. Six pieces of existing copy were written for a sequence and may not survive
   re-roling; rewriting them is out of this ADR's scope.

**Reversibility:** Type 2 — one self-contained section, no shared contract
beyond `CONTENT.process`, which has one consumer. Cheap to redo if the executed
design disappoints.

**Falsifier:** Show an unfamiliar viewer a **static screenshot at 375px with
motion disabled**. If they cannot describe it as *many things going in, something
happening inside a boundary, one thing coming out*, the metaphor has failed —
regardless of how well it animates. This is a checkable test, not a matter of
taste, and it must be run before the section is considered done.

**Status:** Proposed — awaiting stakeholder sign-off.

## Open questions

- OQ-A: Do the four unnamed inputs need copy at all, or do they read as raw
  unlabelled problems? Not decided; affects whether `CONTENT.process` keeps six
  entries or gains anonymous filler.
- OQ-B: Does "Phitopolis" appear as a wordmark on the vessel, or is the
  enclosure identified by the existing brand geometry? Unresolved — a wordmark
  risks reading as a logo placement rather than a containment.
