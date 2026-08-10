/**
 * The registry of the four playground designs.
 *
 * Each `load()` is its own dynamic import, so `PlaygroundCanvas` can wrap it in its
 * own `lazy()` and switching a tab downloads only that scene's chunk — the other
 * three stay unfetched until (if ever) their tab is opened. This file only lists
 * *what* the four scenes are; nothing here imports `three` or `@react-three/fiber`,
 * so importing `variants.ts` alone (e.g. from `PlaygroundTabs.tsx`, which needs the
 * labels but not the geometry) never pulls the 3D stack into a chunk.
 */

import type { ComponentType } from "react";
import type { SceneProps } from "./types";

export type PlaygroundVariantId = "monolith" | "lattice" | "swarm" | "depth";

export interface PlaygroundVariant {
  id: PlaygroundVariantId;
  label: string;
  tagline: string;
  /**
   * Only Monolith's transmissive glass benefits from MSAA — its edges are the only
   * thing in the gallery that reads as a hard-edged solid against the fog. The other
   * three are point clouds, instanced fields and a displaced surface, where every
   * pixel is already soft or already animated; antialiasing them buys nothing visible
   * and still costs a full extra sample per pixel. `PlaygroundCanvas` reads this to
   * decide `gl.antialias` for whichever variant is active.
   */
  antialias?: boolean;
  load: () => Promise<{ default: ComponentType<SceneProps> }>;
}

export const VARIANTS: readonly PlaygroundVariant[] = [
  {
    id: "monolith",
    label: "MONOLITH",
    tagline: "Cast glass, one light",
    antialias: true,
    load: () => import("./scenes/MonolithScene"),
  },
  {
    id: "lattice",
    label: "LATTICE",
    tagline: "The city, stood up",
    load: () => import("./scenes/LatticeScene"),
  },
  {
    id: "swarm",
    label: "SWARM",
    tagline: "The mark, assembled",
    load: () => import("./scenes/SwarmScene"),
  },
  {
    id: "depth",
    label: "DEPTH",
    tagline: "Liquidity, in section",
    load: () => import("./scenes/DepthScene"),
  },
] as const;

/** Seed for a session with no stored (or an invalid) preference — see
 *  `SuperHeroSequence.tsx`'s `readStoredVariantId`. Monolith opens the gallery
 *  because it is the most legible at a glance: one recognisable form, one light. */
export const DEFAULT_VARIANT_ID: PlaygroundVariantId = "monolith";

/** Look up a variant by id, falling back to the default rather than throwing — a
 *  stale sessionStorage value (an id from a since-renamed or removed variant) must
 *  degrade to a working tab, not a blank canvas. */
export function getVariant(id: PlaygroundVariantId): PlaygroundVariant {
  return VARIANTS.find((v) => v.id === id) ?? (VARIANTS.find((v) => v.id === DEFAULT_VARIANT_ID) ?? VARIANTS[0]!);
}
