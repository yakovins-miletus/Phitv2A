/**
 * 04 · DEPTH — "A market microstructure readout you can stand inside."
 *
 * STUB. The one direction that says *financial engineering* out loud. Two instanced
 * ribbons — navy bids, gold asks — form a live depth surface driven by a
 * deterministic seeded feed (never `Math.random()` per frame, so a screenshot is
 * reproducible), with the spread as a dark canyon down the middle. Dragging the
 * cursor carves a trough through the liquidity that refills over ~1.2s: market
 * impact you can feel.
 *
 * Colour is never the only signal — the two sides differ by position as well as
 * hue, and no red/green appears anywhere; the palette stays navy and gold.
 *
 * Placeholder below is the two-sided ribbon at the right footprint, with the spread
 * canyon in place, so the composition can be judged before the feed lands.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { GROUND_Y, PALETTE, WORLD_EXTENT } from "../constants";
import type { SceneProps } from "../types";

const LEVELS = 24;
const SPREAD = 0.9;

/** Deterministic, seed-stable — a screenshot of this scene is reproducible. */
function seeded(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function Ribbon({
  side,
  color,
  pointerRef,
  settleRef,
}: {
  side: 1 | -1;
  color: THREE.Color;
} & Pick<SceneProps, "pointerRef" | "settleRef">) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const scratch = useMemo(() => new THREE.Object3D(), []);
  const step = (WORLD_EXTENT - SPREAD) / LEVELS;

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const settle = settleRef.current ?? 1;
    const p = pointerRef.current;

    for (let i = 0; i < LEVELS; i++) {
      const x = side * (SPREAD + i * step);
      // Depth grows away from the mid — the shape of a real book.
      const base = 0.3 + (i / LEVELS) * 1.7 + seeded(i + (side === 1 ? 0 : 99)) * 0.35;
      // The cursor carves a trough through the liquidity it passes over.
      const dx = x - (p?.x ?? 0);
      const cut = p?.active ? Math.max(0, 1 - (dx * dx) / 2.5) * 0.7 : 0;
      const h = Math.max(0.04, (base - base * cut) * settle);

      scratch.position.set(x, GROUND_Y + h / 2, 0);
      scratch.scale.set(step * 0.78, h, 3.2);
      scratch.updateMatrix();
      mesh.setMatrixAt(i, scratch.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, LEVELS]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
    </instancedMesh>
  );
}

export default function DepthScene({ pointerRef, settleRef }: SceneProps) {
  return (
    <>
      <Ribbon side={-1} color={PALETTE.navyField} pointerRef={pointerRef} settleRef={settleRef} />
      <Ribbon side={1} color={PALETTE.gold} pointerRef={pointerRef} settleRef={settleRef} />
    </>
  );
}
