import { useSyncExternalStore } from "react";

/** Named stage-entrance variants. Pure data here (this module is eagerly
 *  loaded by the rails) — the GSAP tween values live in stageChoreo.ts,
 *  which rides the lazy home chunk with StageSection. */
export type StageChoreo = "rise" | "grow-left" | "grow-right" | "zoom-center" | "spotlight-clip";

/** One home-page section: single source of truth for snap points, the left
 *  dot rail, the right chapter rail, and anchor ids. */
export interface SectionDef {
  /** DOM id of the section element (anchor target). */
  id: string;
  /** Display number shown in the kicker, e.g. "02". Absent on unnumbered sections. */
  kicker?: string;
  label: string;
  /** Groups sections into the four EyeFlow chapters. */
  chapter: 0 | 1 | 2 | 3;
  /** Stage entrance choreography; StageSection defaults to 'rise'. */
  choreo?: StageChoreo;
}

/** Attribute marking a snap-target stage element. */
export const STAGE_ATTR = "data-stage-section";

/** Wheel-paging stops here: this section and everything below it scroll
 *  freely (design: section 6, Global Reach, onward). */
export const SNAP_STOP_SECTION_ID = "reach";

export const HOME_SECTIONS: readonly SectionDef[] = [
  { id: "hero", label: "Signal Core", chapter: 0 },
  { id: "hero-desc", label: "Core Mission", chapter: 0 },
  { id: "service-dev", label: "Full-Stack Platforms", chapter: 0 },
  { id: "service-quant", label: "Quantitative Research", chapter: 0 },
  { id: "service-data", label: "Data Science & ETL", chapter: 0 },
  { id: "service-ops", label: "Operational Continuity", chapter: 0 },
  { id: "use-cases", label: "Architectural Use-Cases", chapter: 1 },
  { id: "process", label: "Process Pipeline", chapter: 1 },
  { id: "reach", label: "Global Footprint", chapter: 2, choreo: "spotlight-clip" },
  { id: "daily-life", label: "Behind The Code", chapter: 2, choreo: "zoom-center" },
  { id: "candidates", label: "Talent & Careers", chapter: 3, choreo: "zoom-center" },
  { id: "blog", label: "Intelligence Feed", chapter: 3, choreo: "grow-right" },
  { id: "closing", label: "Horizon Gateway", chapter: 3, choreo: "zoom-center" },
];

export function homeSection(id: string): SectionDef {
  const def = HOME_SECTIONS.find((section) => section.id === id);
  if (!def) throw new Error(`Unknown home section: ${id}`);
  return def;
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

/** Height of the sticky AppBar overlaying the viewport top — snap targets and
 *  scroll anchors land flush beneath it. */
export function measureHeaderOffset(): number {
  return 0; // Navbar is fixed/transparent, so sections should snap flush to the viewport top
}
