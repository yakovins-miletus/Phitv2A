/**
 * Data for the "From problem to production" pipeline.
 *
 * Pure values, no JSX and no motion imports, so the conductor
 * (ProcessDiagram) stays readable and the payload's six visual states are
 * declared in one place rather than inline in a render tree.
 *
 * The stage list is positional: stage N is what the payload looks like once it
 * has reached node N. It is deliberately NOT keyed off `ProcessStep.number` —
 * `CONTENT.process` is editable content and the diagram must still work if a
 * phase is added, removed or renumbered. Fewer steps than stages simply use the
 * first N; more steps than stages hold the last one (see resolveStage).
 */

/** The payload's visual state at each node, in scroll order. */
export const PAYLOAD_STAGES = [
  /** 00 · scattered, unresolved — an idea before anyone has framed it. */
  "raw",
  /** 01 · the scatter pulls onto a ring: the problem has an outline. */
  "framed",
  /** 02 · the ring gains a lattice and a scan pass: models against real data. */
  "lattice",
  /** 03 · the lattice fills into one solid mass: a built system. */
  "solid",
  /** 04 · the mass gains a heartbeat: something running that has to stay up. */
  "live",
  /** 05 · it snaps into the Phitopolis mark and ships. */
  "mark",
] as const;

export type PayloadStage = (typeof PAYLOAD_STAGES)[number];

/** How many intermediate stages exist before the branded end state. The mark
 *  is always pinned to the *last* node rather than to index 5, so a shortened
 *  `CONTENT.process` still ships — it just skips the unreached middles. */
export const INTERMEDIATE_STAGES = PAYLOAD_STAGES.length - 1;

/** Per-node telemetry. Decorative (aria-hidden) — the phase number and label
 *  carry the meaning for assistive tech. */
export type NodeStatus = "queued" | "running" | "shipped";

export const STATUS_LABEL: Record<NodeStatus, string> = {
  queued: "QUEUED",
  running: "RUNNING",
  shipped: "SHIPPED",
};

/**
 * How far ahead of a node's centre its activation starts, as a fraction of
 * total scroll progress.
 *
 * 0.06 is roughly half the gap between two adjacent middle nodes at desktop
 * spacing, so a node begins lighting as the payload leaves the one above it
 * and is fully lit exactly when the payload arrives — the lead-in reads as the
 * pipeline anticipating the work rather than reacting late to it.
 */
export const ACTIVATION_RAMP = 0.06;

/**
 * Geometry of the desktop zig-zag, in percent of the diagram's width.
 *
 * These two numbers are one fact expressed twice: the text column occupies
 * COLUMN_PCT from the outer edge, the spine sits at the centre, so the space
 * between them — where the connector hairline and node dot live — is exactly
 * `50 - COLUMN_PCT`. Deriving CONNECTOR_PCT keeps them in sync; the previous
 * implementation hardcoded the gap as `-19.5%` against a 42% column, which was
 * both wrong by a hair and silently broken by any column change.
 */
export const COLUMN_PCT = 42;
export const CONNECTOR_PCT = 50 - COLUMN_PCT;

/** Diameter of the endpoint payload well — the payload docks dead centre of
 *  it, so the conductor sizes the travelling element from the same value. */
export const WELL = { xs: 48, md: 64 };

/** Spine inset on mobile, and the gap from it to the text column. Both on the
 *  8px scale (40 = 5, 56 = 7) — the mobile twins of COLUMN_PCT.
 *
 *  The gap is 56 rather than a roomier 72 because of a hard constraint at the
 *  narrow end: at 320px, a 112px text inset leaves the endpoint headings about
 *  142px, and "Products" at 2.5rem needs ~165 — it overflowed the ship plate's
 *  right edge. 56 keeps the payload well (48 wide, so it ends at x=64) clear of
 *  the text by 16px and gives the headings room to set. */
export const SPINE_X = 40;
export const MOBILE_GAP = 56;
