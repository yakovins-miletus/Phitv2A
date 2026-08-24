---
status: "accepted"
date: 2026-08-24
decision-makers: [yaakovins (stakeholder), engineering]
consulted: [docs/polish-log.md Round 2, docs/copy-audit.md]
informed: [Fresko frontend maintainers]
supersedes: 0002-problem-to-production-metaphor
---

# Three-phase growth model for the process section

**Statement:** Replace the containment metaphor adopted in ADR-0002 (many
inputs, two named among them, two enclosed operations, one output) with a
three-phase growth model, and rename the section from "Problem To Production"
to "Growing Into A Development Powerhouse".

## Context

ADR-0002 was never signed off — it closed as *"Proposed — awaiting stakeholder
sign-off"* with two open questions unresolved (whether the unnamed inputs need
copy, and whether the enclosure carries a wordmark). The section was rebuilt in
the meantime, and `CONTENT.process` on disk now describes three phases rather
than an intake/enclosed/output triple.

## Decision

The section presents three phases — Discover & Research, Build, Operate — where
each phase names what the previous one produced as its own starting point, so
the copy itself reads as accumulation.

## Rationale

The containment metaphor described *a single job moving through a firm*. The
section's actual claim is about the firm growing capability over time, which is
a different shape: cumulative rather than transformative. A metaphor that
depicts one problem entering and one product leaving cannot carry "we grew into
this", however well it animates.

ADR-0002's own reversibility note anticipated this: Type 2, one self-contained
section, one consumer of `CONTENT.process`, "cheap to redo if the executed
design disappoints."

## Rejected alternatives

| Alternative | Why rejected |
|---|---|
| Keep ADR-0002's containment metaphor | Depicts a single job's transformation, not accumulated capability, which is the section's actual claim |
| Keep the metaphor, rename the section only | The mismatch is structural, not lexical; a growth title over a containment diagram is worse than either alone |
| Leave ADR-0002 open and ship the new design undocumented | Leaves a proposed ADR contradicting shipped code, which is how the next session gets misled |

## Consequences

- ADR-0002 is superseded. Its falsifier (an unfamiliar viewer must read "many in, something inside, one out" from a static 375px screenshot) no longer applies.
- A replacement falsifier is needed for the growth model and is **not yet written**. Proposed: a viewer should be able to say the three phases build on each other rather than merely follow each other. To be settled at the home-page process checkpoint.
- The four diagram components were already redrawn against the three-phase copy.
- `ProcessSection` still carries a `calc(100svh - 160px)` duplicating `SectionBeat`'s padding; unrelated to this decision, tracked as debt.
