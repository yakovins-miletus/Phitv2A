/**
 * The PoC gallery's entry point.
 *
 * `SuperHeroSequence.tsx` lazy-imports this whole module, so `three`,
 * `@react-three/fiber` and `drei` stay out of the route chunk until someone flips
 * the toggle. Each *scene* is then lazy again inside `variants.ts`, so switching a
 * tab downloads only that scene rather than all four up front.
 *
 * This file resolves the active variant to a component and hands it to
 * `PlaygroundCanvas`, which owns the room. It deliberately does nothing else — the
 * camera, fog, ground, lights and pointer all live in one place so four scenes
 * cannot drift apart.
 */

import { lazy, useMemo, type RefObject } from "react";

import { PlaygroundCanvas } from "./playground/PlaygroundCanvas";
import { DEFAULT_VARIANT_ID, VARIANTS, getVariant, type PlaygroundVariantId } from "./playground/variants";

/** Kept for parity with `HeroCanvas.tsx` — the pin driver writes into either one
 *  through the same imperative handle, so the toggle can swap them freely. */
export interface HeroCanvasHandle {
  setProgress: (p: number) => void;
}

interface R3FHeroCanvasProps {
  handleRef: RefObject<HeroCanvasHandle | null>;
  initialProgress?: number;
  /** Which gallery design to show. */
  variantId?: PlaygroundVariantId;
  /** Accepted for parity with the 2D canvas fork; the R3F path publishes no
   *  `--hp-mx` / `--hp-my`, because nothing in the dark room reads them. */
  varsHostRef?: RefObject<HTMLElement | null>;
}

/**
 * One `React.lazy` per variant, created once at module scope.
 *
 * Building these inside the component would mint a new lazy component on every
 * render, and React would treat each one as a different type — remounting the
 * scene, dropping its WebGL resources and restarting the entrance settle on any
 * unrelated re-render.
 */
const LAZY_SCENES = Object.fromEntries(
  VARIANTS.map((v) => [v.id, lazy(v.load)]),
) as Record<PlaygroundVariantId, ReturnType<typeof lazy>>;

export function R3FHeroCanvas({
  handleRef,
  initialProgress = 0,
  variantId = DEFAULT_VARIANT_ID,
}: R3FHeroCanvasProps) {
  const variant = useMemo(() => getVariant(variantId), [variantId]);
  const Scene = LAZY_SCENES[variantId] ?? LAZY_SCENES[DEFAULT_VARIANT_ID];

  return (
    <PlaygroundCanvas
      handleRef={handleRef}
      Scene={Scene}
      variantId={variantId}
      antialias={variant.antialias === true}
      initialProgress={initialProgress}
    />
  );
}
