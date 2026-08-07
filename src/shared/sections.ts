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

/** Chapter index. Ten chapters, seven for services, three for people. */
export type ChapterIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface ChapterDef {
  index: ChapterIndex;
  label: string;
  act: Act;
}

/** Chapters in scroll order, including the detailed hero phases. */
export const CHAPTERS: readonly ChapterDef[] = [
  { index: 0, label: "FLATTEN", act: "services" },
  { index: 1, label: "ALIGN", act: "services" },
  { index: 2, label: "REVEAL", act: "services" },
  { index: 3, label: "DWELL", act: "services" },
  { index: 4, label: "QUANTITATIVE R&D", act: "services" },
  { index: 5, label: "PRACTICE", act: "services" },
  { index: 6, label: "REACH", act: "services" },
  { index: 7, label: "BEHIND THE CODE", act: "people" },
  { index: 8, label: "TALENT", act: "people" },
  { index: 9, label: "SIGNAL", act: "people" },
];

/** One home-page section: single source of truth for snap points, the left
 *  dot rail, the right chapter rail, and anchor ids. */
export interface SectionDef {
  /** DOM id of the section element (anchor target). */
  id: string;
  /** Display number shown in the kicker, e.g. "02". Absent on unnumbered sections. */
  kicker?: string;
  label: string;
  /** Groups sections into the EyeFlow chapters. The act is derived from
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
  { id: "hero-flatten", label: "Logo Flatten", chapter: 0, ground: "void" },
  { id: "hero-align", label: "Logo Align", chapter: 1, ground: "void" },
  { id: "hero-reveal", label: "Wordmark Reveal", chapter: 2, ground: "void" },
  { id: "hero-dwell", label: "Logo Dwell", chapter: 3, ground: "void" },
  { id: "hero", label: "Signal Core", chapter: 4, ground: "void" },
  { id: "hero-mission", label: "Core Mission", chapter: 4, ground: "panel" },
  {
    id: "hero-pillars",
    label: "Operating Pillars",
    chapter: 4,
    choreo: "grow-left",
    ground: "void",
  },
  {
    id: "hero-position",
    label: "Market Position",
    chapter: 4,
    choreo: "grow-right",
    ground: "panel",
  },
  { id: "services", label: "Capabilities", chapter: 4, ground: "void" },
  { id: "use-cases", label: "Architectural Use-Cases", chapter: 5, ground: "panel" },
  { id: "process", label: "Process Pipeline", chapter: 5, ground: "void" },
  {
    id: "reach",
    label: "Global Footprint",
    chapter: 6,
    choreo: "spotlight-clip",
    ground: "white",
  },

  // ── ACT II · PEOPLE ───────────────────────────────────────────────────────
  {
    id: "daily-life",
    label: "Behind The Code",
    chapter: 7,
    choreo: "zoom-center",
    ground: "void",
  },
  {
    id: "testimonials",
    label: "Hear From Our People",
    chapter: 7,
    choreo: "zoom-center",
    ground: "panel",
  },
  { id: "candidates", label: "Talent & Careers", chapter: 8, choreo: "zoom-center", ground: "panel" },
  { id: "blog", label: "Intelligence Feed", chapter: 9, choreo: "grow-right", ground: "field" },
  // Never rendered; carries a ground only so the stop list needs no special case.
  { id: "closing", label: "Horizon Gateway", chapter: 9, choreo: "zoom-center", ground: "panel" },
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
