---
status: "proposed"
date: 2026-08-24
decision-makers: [yaakovins (product owner), engineering]
consulted: [PRD-home-client-focus §3 US-3, §6 Constraints]
informed: [Fresko frontend maintainers]
---

# Node/technology data model for the home closing scene

## Context and Problem Statement

PRD-home-client-focus US-3 replaces the home page's closing section with a
wide-angle 3D field of roughly thirty **anonymous** system nodes, each associated
with the technologies that build it. Two hard requirements shape the data model:

- **US-3 AC-2 (anonymity):** no client, customer, partner or counterparty may be
  identifiable by name, logo or description — *including in the underlying data*,
  not merely in what is rendered.
- **US-3 AC-5 (single source):** the technologies shown in the closing scene are
  also listed on `/about`; changing either must change both, "with no possibility
  of the two disagreeing".

Today the technology list lives inside a presentation component:
`src/features/about/components/PoweredBySection.tsx` holds `ROW1_TECHS`,
`ROW2_TECHS`, `ROW3_TECHS` (`{ name, cat }[]`, ~97 entries) plus two lookup maps,
`TECH_SLUGS` (→ `cdn.simpleicons.org` slug) and `LOCAL_TECHS` (→ `/logos/tech/*.svg`).
No node/system concept exists anywhere in the codebase.

How should the node field's data be modelled and sourced?

## Decision Drivers

* Anonymity must be structurally enforceable, not a review convention.
* One technology list, two very different consumers (a DOM marquee and a WebGL scene).
* The WebGL consumer needs texture-loadable image URLs, which constrains asset sourcing.
* Node archetypes are product copy, and are expected to change without an engineer.
* Three.js must stay out of the eager route chunk (root `CLAUDE.md`).

## Considered Options

1. **Shared plain-data module** — extract the tech list into a presentation-free
   module; add a sibling module of node archetypes referencing techs by key.
2. **Derive nodes from the existing `CONTENT.services[]` taxonomy** — reuse the
   four service disciplines and their `techStack` arrays already in `content.ts`.
3. **Heimdall CMS-backed node content** — a new content type served from
   `/api/v1/…`, editable without a deploy.

## Decision Outcome

**Chosen: Option 1 — a shared plain-data module**, with node archetypes as
codebase content for now.

`src/shared/content/techStack.ts` becomes the single source for the technology
list and its slug/local-asset lookups. `PoweredBySection.tsx` imports from it
instead of declaring it, satisfying AC-5 by construction rather than by
discipline. A sibling `src/features/home/closing/nodeField.ts` declares the ~30
node archetypes, each referencing technologies **by key into the shared list** —
so a node can never introduce a technology the `/about` marquee does not know
about.

Anonymity is enforced structurally: the node type exposes an `archetype` field
typed as a **closed union of generic system names** (e.g. `"Execution Platform"`,
`"Market Data Pipeline"`, `"Risk Engine"`, `"Research Grid"`), not a free-form
string. Adding a client name would require editing the union — a visible,
reviewable act rather than a passing data edit. This is what makes AC-2 auditable.

Option 2 was rejected: four service disciplines cannot produce thirty nodes, and
binding the closing scene to `CONTENT.services[]` would couple a home-page visual
to the `/services` page and the Heimdall services feed — so a CMS edit intended
for `/services` would silently reshape the home page's closing.

Option 3 was rejected **for now, not on principle**: CMS-backed nodes are the
right long-term shape, but they put the anonymity guarantee behind a CMS editor
with no type-level guard, which directly contradicts AC-2. Revisit once the node
model is stable and an editorial review step exists.

### Consequences

* Good: AC-5 holds by construction — there is one list, imported twice.
* Good: AC-2 becomes reviewable — anonymity is a type, and `nodeField.ts` is one
  small file a Kritikos pass can read end to end.
* Good: `PoweredBySection.tsx` shrinks to presentation, which it should have been.
* Bad: node archetypes need a deploy to change. Accepted; they are structural
  copy, not news.
* Bad: touching `PoweredBySection.tsx` risks regressing a shipped `/about`
  section. Mitigated by extracting data verbatim with no shape change.

### Confirmation

* A test asserts `PoweredBySection` declares no technology list of its own — it
  must import the shared module (guards AC-5 against future drift).
* A test asserts every technology key referenced by `nodeField.ts` resolves in
  the shared list (no orphan references).
* A Kritikos review pass explicitly confirms no client-identifying string appears
  in `nodeField.ts`, per PRD §6.

## Open issue — external texture sourcing

Most technology marks resolve to `https://cdn.simpleicons.org/{slug}`. In the DOM
marquee these are plain `<img>` tags. **In WebGL they become textures, which is a
different problem:** texture loading is subject to CORS, requires `crossOrigin`
to be set on the loader, and a third-party CDN in the render path of the page's
closing frame is a availability and privacy dependency the marquee never had.

This ADR does **not** decide it. Options to weigh before US-3 is built:
mirror the needed marks into `/logos/tech/` at build time (removes the runtime
dependency, adds a sync step); pack them into a single sprite atlas (one texture,
best for ~30 nodes × N marks); or accept the CDN with a fallback material.
The atlas is the likely answer on performance grounds — thirty nodes' worth of
individual texture fetches would be the heaviest thing on the page — but it needs
measuring, not asserting.

**This must be resolved before US-3 implementation begins.**
