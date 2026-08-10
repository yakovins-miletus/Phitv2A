/**
 * 03 · SWARM — "The mark is something you cause."
 *
 * STUB. 20k GPU points drift on curl noise; when the pointer *slows* they lock into
 * the P sampled from `heroLogoMask`'s raster (via `useLogoPoints`), and a flick
 * scatters them again. One `uForm` uniform driven by `1 - velocity` does all of it
 * in the vertex shader: one draw call, zero per-point JS. Colour carries the
 * meaning rather than decorating it — navy while drifting, gold once locked, so
 * formation is the gold state.
 *
 * Reduced motion is a designed state here, not an absence: `uForm` pins to 1 and
 * the drift never runs, leaving a still stippled P.
 *
 * Placeholder below already reads the real logo points, so the mark's sampling is
 * verifiable before the shader lands.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { GROUND_Y, PALETTE } from "../constants";
import { useLogoPoints } from "../useLogoPoints";
import type { SceneProps } from "../types";

export default function SwarmScene({ pointerRef, settleRef, reduced }: SceneProps) {
  const { positions, count } = useLogoPoints();
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useFrame(() => {
    const pts = pointsRef.current;
    if (!pts) return;
    const settle = settleRef.current ?? 1;
    // Formation is the inverse of pointer speed — hold still and the mark resolves.
    const form = reduced ? 1 : 1 - (pointerRef.current?.velocity ?? 0);
    pts.position.y = GROUND_Y + 1.8;
    pts.scale.setScalar((0.7 + form * 0.3) * settle);
  });

  if (count === 0) return <group />;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.045} sizeAttenuation color={PALETTE.gold} transparent opacity={0.9} />
    </points>
  );
}
