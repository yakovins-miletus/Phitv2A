import { useSyncExternalStore } from "react";

import type { GroundName } from "./theme/grounds";

/** Named stage-entrance variants. Pure data here (this module is eagerly
 *  loaded by the rails) — the GSAP tween values live in stageChoreo.ts,
 *  which rides the lazy home chunk with StageSection. */
export type StageChoreo = "rise" | "grow-left" | "grow-right" | "zoom-center" | "spotlight-clip";

/** The two things this company sells. The home page is one act per variety:
 *  SERVICES runs hero → global footprint, PEOPLE runs the daily-life film →
 *  careers → the feed. `ledes.dailyLife` in content.ts is the written handover
 *  between the two voices ("That is the work. These are the people who do it.")
 *  — the act model exists so the rails stop contradicting that line. */
export type Act = "services" | "people";

export const ACT_LABELS: Record<Act, string> = {
  services: "SERVICES",
  people: "PEOPLE",
};

/** Chapter index. Six chapters, three per act — the act boundary falls
 *  between 2 and 3 and nothing may straddle it. */
export type ChapterIndex = 0 | 1 | 2 | 3 | 4 | 5;

export interface ChapterDef {
  index: ChapterIndex;
  label: string;
  act: Act;
}

/** Chapters in scroll order. This is the ONLY place an act is bound to a
 *  chapter, so a section's act is always derived (see `actOfChapter`) and can
 *  never disagree with its chapter — the previous model let `chapter: 2` hold
 *  both `reach` and `daily-life`, which put the Services|People seam *inside*
 *  a chapter and made the rail read REACH over the people film. */
export const CHAPTERS: readonly ChapterDef[] = [
  { index: 0, label: "ORIGIN", act: "services" },
  { index: 1, label: "PRACTICE", act: "services" },
  { index: 2, label: "REACH", act: "services" },
  { index: 3, label: "BEHIND THE CODE", act: "people" },
  { index: 4, label: "TALENT", act: "people" },
  { index: 5, label: "SIGNAL", act: "people" },
];

/** One home-page section: single source of truth for snap points, the left
 *  dot rail, the right chapter rail, and anchor ids. */
export interface SectionDef {
  /** DOM id of the section element (anchor target). */
  id: string;
  /** Display number shown in the kicker, e.g. "02". Absent on unnumbered sections. */
  kicker?: string;
  label: string;
  /** Groups sections into the six EyeFlow chapters. The act is derived from
   *  this, never stored alongside it. */
  chapter: ChapterIndex;
  /** Stage entrance choreography; StageSection defaults to 'rise'. */
  choreo?: StageChoreo;
  /**
   * The surface this section sits on.
   *
   * Declared here rather than passed to StageSection, because two consumers need
   * it and they must not disagree: the section paints it, and the scroll-driven
   * ground layer interpolates between consecutive values of it. A section that set
   * its own `bgcolor` inline would be invisible to the layer and would re-introduce
   * the hard cut the layer exists to remove.
   */
  ground?: GroundName;
}

/** Attribute marking a snap-target stage element. */
export const STAGE_ATTR = "data-stage-section";

/** Two entries here are not what they look like, and both have bitten people:
 *
 *  - `services` is rendered by CapabilityRack, not by routes/index.tsx.
 *  - `closing` is never rendered as a section at all. The old warning here said
 *    it had to stay because "EyeFlow draws one rail dot per entry" — that was
 *    stale (it described the retired ScrollRail; EyeFlow renders one label per
 *    *chapter*, not per section). It is kept only because it is harmless, and
 *    it shares chapter 5 with `blog`, which sorts first and so owns the
 *    chapter's scroll target either way.
 *
 *  This list is also NOT the registry the navbar uses. NavbarContext keeps its
 *  own anchor ids in a separate namespace ("daily-life-video", "home-compact")
 *  that deliberately does not line up with these — see NavbarContext.tsx. */
export const HOME_SECTIONS: readonly SectionDef[] = [
  // ── ACT I · SERVICES ──────────────────────────────────────────────────────
  // The act opens dark and resolves into light at the footprint, so the ground
  // layer has one long gradient to travel instead of alternating slabs.
  { id: "hero", label: "Signal Core", chapter: 0, ground: "white" },
  // Three stages, not one pinned deck: `hero-desc` used to be a single 100vh pin
  // that swapped four beats with `display: none` inside one centred glass card, so
  // the beats were indistinguishable and beats 1-3 were unreachable entirely under
  // prefers-reduced-motion (the pin never ran, so the beat index never advanced).
  // Each is now a real scrolling section with its own ground and choreo.
  { id: "hero-mission", label: "Core Mission", chapter: 0, choreo: "rise", ground: "navyDeep" },
  {
    id: "hero-pillars",
    label: "Operating Pillars",
    chapter: 0,
    choreo: "grow-left",
    ground: "navyPanel",
  },
  {
    id: "hero-position",
    label: "Market Position",
    chapter: 0,
    choreo: "grow-right",
    ground: "void",
  },
  // One stage, not four: the capabilities used to be four near-identical
  // full-viewport templates in a row. CapabilityRack collapses them into a
  // single stage whose rows expand in place — see CapabilityRack.tsx.
  { id: "services", label: "Capabilities", chapter: 0, ground: "void" },
  { id: "use-cases", label: "Architectural Use-Cases", chapter: 1, ground: "void" },
  { id: "process", label: "Process Pipeline", chapter: 1, ground: "panel" },
  // Closes Act I. The last thing a prospective client sees before the page
  // changes who it is talking to.
  {
    id: "reach",
    label: "Global Footprint",
    chapter: 2,
    choreo: "spotlight-clip",
    ground: "panel",
  },

  // ── ACT II · PEOPLE ───────────────────────────────────────────────────────
  // `daily-life` opens Act II. It used to sit in chapter 2 beside `reach`,
  // which is what made the rail claim REACH while the people film played.
  //
  // The act opens dark deliberately: this is the film, and it is the one ground
  // change on the page the layer wipes rather than crossfades.
  // `navyDeep`, not `navyField`: the film card is itself `primary.main`
  // (navyField), so a matching ground would erase it. A deeper ground makes the
  // card read as a lifted surface — dark-mode elevation comes from the lighter
  // surface, not from a bigger shadow.
  {
    id: "daily-life",
    label: "Behind The Code",
    chapter: 3,
    choreo: "zoom-center",
    ground: "navyDeep",
  },
  { id: "candidates", label: "Talent & Careers", chapter: 4, choreo: "zoom-center", ground: "panel" },
  { id: "blog", label: "Intelligence Feed", chapter: 5, choreo: "grow-right", ground: "panel" },
  // Never rendered; carries a ground only so the stop list needs no special case.
  { id: "closing", label: "Horizon Gateway", chapter: 5, choreo: "zoom-center", ground: "panel" },
];

export function homeSection(id: string): SectionDef {
  const def = HOME_SECTIONS.find((section) => section.id === id);
  if (!def) throw new Error(`Unknown home section: ${id}`);
  return def;
}

/** The act a chapter belongs to. Throws on an unknown index rather than
 *  defaulting, so adding a chapter without an act is a loud failure. */
export function actOfChapter(chapter: ChapterIndex): Act {
  const def = CHAPTERS.find((c) => c.index === chapter);
  if (!def) throw new Error(`Unknown chapter index: ${String(chapter)}`);
  return def.act;
}

/** Scroll target for a chapter: the first section declared in it. */
export function chapterTarget(chapter: ChapterIndex): string | undefined {
  return HOME_SECTIONS.find((section) => section.chapter === chapter)?.id;
}

// Module-level active-section store: written by ScrollTrigger callbacks on
// every scroll, so a context would re-render the whole page tree — only the
// two rail components subscribe.
const DEFAULT_SECTION_ID = "hero";
let activeId = DEFAULT_SECTION_ID;
const listeners = new Set<() => void>();

export function setActiveSection(id: string): void {
  if (id === activeId) return;
  activeId = id;
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function useActiveSection(): string {
  return useSyncExternalStore(
    subscribe,
    () => activeId,
    () => DEFAULT_SECTION_ID,
  );
}
