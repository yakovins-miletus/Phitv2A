/**
 * The playground scene contract.
 *
 * Four scenes (Monolith, Lattice, Swarm, Depth — see `variants.ts`) plug into one
 * `PlaygroundCanvas`. Every scene is a plain function component with exactly this
 * props shape, and the shape is designed around one non-negotiable: **scrolling
 * causes zero React renders**, the same property the rest of the hero is built on
 * (see `docs/hero-upgrade/README.md`'s architecture note). `progressRef` is written
 * every scroll frame by the pin driver in `SuperHeroSequence.tsx`; if it were a prop
 * instead of a ref, every scroll tick would re-render whichever scene is mounted.
 *
 * The same reasoning extends to `pointerRef` and `settleRef` — anything that changes
 * every animation frame lives in a ref, read inside `useFrame`, never in state.
 */

import type { ReactElement, RefObject } from "react";

import type { DayCycleSample } from "./dayCycle";

/**
 * The pointer, projected onto the shared ground plane and smoothed.
 *
 * Owned and mutated in place by `PlaygroundCanvas` (via `usePointerPlane`) every
 * frame the loop is running. Scenes read it inside their own `useFrame` — never
 * reassign `pointerRef.current`, only read its fields, exactly as scenes must never
 * reassign `pointerRef` itself.
 */
export interface PointerPlane {
  /** Ground-plane coords in world units, lerped. Origin at scene centre. */
  x: number;
  z: number;
  /** Normalised -1..1 screen position, lerped. */
  nx: number;
  ny: number;
  /** 0..1 smoothed pointer speed. */
  velocity: number;
  /** Pointer is over the canvas. */
  active: boolean;
  /** ms since the last click, or -1 when there is none live. */
  clickAge: number;
  /** Ground-plane coords of that click. */
  clickX: number;
  clickZ: number;
}

export interface SceneProps {
  /** Pin progress 0..1. Read per-frame; never causes a render. */
  progressRef: RefObject<number>;
  /** Mutated in place every frame by PlaygroundCanvas. Never reallocated. */
  pointerRef: RefObject<PointerPlane>;
  /** 0 → 1 over ENTRANCE_MS when this scene becomes active. */
  settleRef: RefObject<number>;
  /**
   * The chosen time of day — see `dayCycle.ts`.
   *
   * A plain prop, unlike everything above it: this changes when someone presses
   * one of four buttons, not every frame, so a render is the right cost and the
   * scene can key work off it. Scenes without a `dayCycle` variant flag always
   * receive `BASE_PHASE` and can ignore it.
   */
  /** The room's live weather. */
  /**
   * The room's live weather — the eased sample the shared stage is currently
   * showing, mutated in place every frame.
   *
   * Read, never written. The stage's `useFrame` steps it and the scene's reads
   * it, in that order (siblings run in tree order and the stage is first), so a
   * scene's own key light and the sky behind it are always describing the same
   * instant.
   */
  daySample: Readonly<DayCycleSample>;
  /** Visitor prefers reduced motion — paint a designed resting frame, start no loop. */
  reduced: boolean;
  /** Low-tier device — take the cheap path (fewer instances, cheaper material). */
  lowPower: boolean;
  /** Triggered when a 3D service node is selected / clicked. */
  onNodeSelect?: (index: number) => void;
}

/**
 * The shape every `scenes/*.tsx` default-exports, and what `variants.ts`'s `load()`
 * resolves to.
 *
 * `ReactElement`, not `JSX.Element`: React 19's types no longer publish a global
 * `JSX` namespace (it moved under `React.JSX`), so the bare name does not resolve
 * here. Same type, one import.
 */
export type SceneComponent = (props: SceneProps) => ReactElement;
