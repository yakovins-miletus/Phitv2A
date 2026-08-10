/**
 * 02 · LATTICE — "The halftone city, stood up."
 *
 * STUB. The one direction with continuity: the dawn-halftone city that shipped as a
 * 2D dot lattice, given real volume. `heroCity.ts`'s frozen arrays (`DOT_X`,
 * `DOT_Y`, `DOT_STOREYS`, `DOT_DENSITY`) become one `InstancedMesh` of ~1,900
 * columns; the cursor keeps its exact contract from `heroPointer.ts` — a second
 * light, never a repulsor — but now with real parallax and real occlusion, and gold
 * signal pulses run the avenues via `pointAtLoopDistance`. Orbit it and the P
 * district reads as a plateau of gold towers: the skyline *is* the mark.
 *
 * Placeholder below is a coarse column grid at the right footprint and scale, so
 * the shared camera framing can be judged before the real data lands.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { GROUND_Y, PALETTE, WORLD_EXTENT } from "../constants";
import type { SceneProps } from "../types";

const AXIS = 14;
const COUNT = AXIS * AXIS;

export default function LatticeScene({ pointerRef, settleRef, lowPower }: SceneProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const scratch = useMemo(() => new THREE.Object3D(), []);
  const pitch = (WORLD_EXTENT * 2) / AXIS;

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const settle = settleRef.current ?? 1;
    const p = pointerRef.current;

    for (let i = 0; i < COUNT; i++) {
      const col = i % AXIS;
      const row = (i / AXIS) | 0;
      const x = (col - (AXIS - 1) / 2) * pitch;
      const z = (row - (AXIS - 1) / 2) * pitch;

      // The cursor as a second light: cells near it rise. Squared distance, no sqrt.
      const dx = x - (p?.x ?? 0);
      const dz = z - (p?.z ?? 0);
      const near = p?.active ? Math.max(0, 1 - (dx * dx + dz * dz) / 12) : 0;
      const h = (0.25 + near * 1.6) * settle;

      scratch.position.set(x, GROUND_Y + h / 2, z);
      scratch.scale.set(pitch * 0.42, Math.max(0.02, h), pitch * 0.42);
      scratch.updateMatrix();
      mesh.setMatrixAt(i, scratch.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={PALETTE.steel}
        roughness={lowPower ? 1 : 0.55}
        metalness={0}
      />
    </instancedMesh>
  );
}
