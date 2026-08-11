/**
 * The registry of the playground's one design.
 *
 * This used to list four: Lattice, Swarm and Depth were stubs that never got
 * built out, and were deleted along with their tab strip (the hero has one
 * mode now — Legacy or Monolith — chosen from the command palette, not a
 * gallery of designs). Monolith is kept as a single-entry registry rather than
 * inlined into `R3FHeroCanvas`/`PlaygroundCanvas`, because those two still read
 * it as a config record (`antialias`/`dayCycle`/`cloudDeck`/`camera`) and a
 * lazy loader, and a second design landing here later should not have to undo
 * an inlining to get a home.
 *
 * `load()` is its own dynamic import so `R3FHeroCanvas` can wrap it in
 * `lazy()`. Nothing here imports `three` or `@react-three/fiber` — this file
 * only lists *what* the design is, so importing it alone never pulls the 3D
 * stack into a chunk.
 */

import type { ComponentType } from "react";
import type { CameraRigId } from "./constants";
import type { SceneProps } from "./types";

export type PlaygroundVariantId = "monolith";

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
  /**
   * This design stands over a cloud deck instead of on the shared ground plane.
   *
   * A property of the *design*, not of the room's light: `PlaygroundCanvas`
   * draws `CloudSea` and hides the ground plane only for the variant that
   * asked. (There used to be a sibling `dayCycle` flag here, opting a variant
   * into a time-of-day ramp. The room has one fixed authored look now — see
   * `dayCycle.ts` — so there is nothing left to opt into.)
   */
  cloudDeck?: boolean;
  /**
   * Which camera rig this design is seen through (`CAMERAS` in `constants.ts`);
   * `room` when unset.
   *
   * The most reluctant flag in this file. One shared camera is the reason the
   * gallery reads as four designs of the same room rather than four unrelated
   * demos, and a per-scene camera is exactly the thing `PlaygroundCanvas`'s
   * module comment forbids. It exists because Monolith stopped being a scene in
   * that room: a mark suspended in open air cannot be framed by a rig that
   * points 24° down at a floor, because such a rig never sees its own horizon
   * and therefore never shows sky under anything. That is geometry, not taste —
   * see `CAMERA_ALTITUDE`'s docblock. Three scenes still share `room`, and a
   * fourth id here should be treated as evidence the gallery has stopped being
   * one gallery.
   */
  camera?: CameraRigId;
  load: () => Promise<{ default: ComponentType<SceneProps> }>;
}

export const VARIANTS: readonly PlaygroundVariant[] = [
  {
    id: "monolith",
    label: "MONOLITH",
    tagline: "Cast glass, above the clouds",
    antialias: true,
    cloudDeck: true,
    camera: "altitude",
    load: () => import("./scenes/MonolithScene"),
  },
] as const;

export const DEFAULT_VARIANT_ID: PlaygroundVariantId = "monolith";

/** Look up a variant by id, falling back to the default rather than throwing. */
export function getVariant(id: PlaygroundVariantId): PlaygroundVariant {
  return VARIANTS.find((v) => v.id === id) ?? VARIANTS[0]!;
}
