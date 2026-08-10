/**
 * 01 · MONOLITH — "The mark as cast glass in a black room."
 *
 * STUB. The scene contains exactly one object and everything else is light
 * behaving: the P extruded from `/phitopolis_logo_hero.svg` in a transmissive
 * material, with the gold counter-form suspended *inside* the navy glass as a
 * separate emissive mesh — you look through the brand mark and find the other half
 * of it floating in there. One key light orbits with the cursor; the floor is an
 * instanced dot grid that takes a shockwave on click.
 *
 * Placeholder below stands in for the mark's mass and its one light, so the tab is
 * navigable and the shared stage is visibly correct, and nothing more.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

import { GROUND_Y, PALETTE } from "../constants";
import type { SceneProps } from "../types";

export default function MonolithScene({ pointerRef, settleRef, reduced }: SceneProps) {
  const markRef = useRef<THREE.Mesh>(null);
  const keyRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const settle = settleRef.current ?? 1;
    const mark = markRef.current;
    if (mark) {
      mark.scale.setScalar(0.6 + settle * 0.4);
      mark.position.y = GROUND_Y + 1.6;
    }
    // The key light is the cursor. Under reduced motion it parks at its resting
    // position rather than following, so the frame is lit but static.
    const key = keyRef.current;
    const p = pointerRef.current;
    if (key && p) {
      key.position.set(reduced ? -2.4 : p.x, GROUND_Y + 3.4, reduced ? 2.4 : p.z);
    }
  });

  return (
    <>
      <pointLight ref={keyRef} intensity={18} distance={14} color={PALETTE.frost} />
      <mesh ref={markRef}>
        <boxGeometry args={[1.9, 2.6, 0.6]} />
        {/* Steel, not `navyField`: a #0A2A66 solid under this rig's deliberately
            low ambient renders within a couple of values of the `navyInk`
            background, so the placeholder was drawing correctly and reading as an
            empty canvas. A stub whose job is "is the pipeline alive" has to be
            visible to do it. */}
        <meshStandardMaterial color={PALETTE.steel} roughness={0.25} metalness={0.1} />
      </mesh>
      <mesh position={[0, GROUND_Y + 1.6, 0.34]}>
        <boxGeometry args={[0.8, 1.2, 0.12]} />
        <meshStandardMaterial
          color={PALETTE.gold}
          emissive={PALETTE.gold}
          emissiveIntensity={0.45}
          roughness={0.3}
        />
      </mesh>
    </>
  );
}
