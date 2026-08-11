/**
 * Screen pointer -> shared ground-plane coordinates, owned once so all four scenes
 * read the same lerped, smoothed signal instead of each rolling their own.
 *
 * Structured like `HeroCanvas.tsx`'s pointer handling (a plain DOM effect, one rAF
 * loop, no React state) rather than through R3F's `useFrame`, for two reasons:
 *
 *  1. It decouples pointer tracking from whatever the Canvas's own `frameloop` is
 *     doing — a scene rendering with `frameloop="never"` under reduced motion still
 *     has a *correct* (if unused) `pointerRef`, and the loop this hook runs can be
 *     started/stopped independently by the caller's visibility gate.
 *  2. The ground-plane math builds its **own** `THREE.PerspectiveCamera` from the
 *     shared `CAMERA` constant rather than reading the live camera out of the R3F
 *     tree. `CAMERA` is fixed — no orbit controls, no per-device fov — so a second
 *     camera built from the same numbers agrees with the one rendering pixels, and
 *     pointer tracking never has to reach into the Canvas at all.
 *
 * `smoothVelocity` / `easeToward` are reused from `heroPointer.ts` rather than
 * rewritten — they are pure, unit-tested, and this hook needs exactly what they do
 * (a clamped, eased speed scalar; a monotone convergent lerp), nothing scene-specific.
 */

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { usePointerFine } from "@/shared/motion";
import { easeToward, smoothVelocity } from "../heroPointer";
import { CAMERA, GROUND_Y, WORLD_EXTENT, type CameraRig } from "./constants";
import type { PointerPlane } from "./types";

/** Lerp factor both the ground-plane position and the normalised screen position
 *  ease with. Same order of magnitude as the 2D hero's own `POINTER_LERP`
 *  (`HeroCanvas.tsx`, 0.08) — fast enough to read as connected to the cursor, slow
 *  enough that a scene never sees a raw, jittery per-event sample. */
const POINTER_LERP = 0.12;

/**
 * How long a click stays "live" in `clickAge` before scenes should treat it as
 * expired. Deliberately its own constant rather than `RIPPLE_DURATION_MS` from
 * `heroPointer.ts` — that value belongs to the unrelated 2D city's expanding-crest
 * ripple, and the four playground scenes each spend a click on a different thing
 * (Depth refills a trough, Lattice fires a signal pulse, ...). Coupling the two
 * systems' lifetimes would be an accident of both currently being ~1.5s, not an
 * intentional shared contract.
 */
const CLICK_LIFETIME_MS = 1600;

function makePointerPlane(): PointerPlane {
  return { x: 0, z: 0, nx: 0, ny: 0, velocity: 0, active: false, clickAge: -1, clickX: 0, clickZ: 0 };
}

/**
 * @param hostRef The element pointer events are read from — `PlaygroundCanvas`'s
 *   wrapping div, which sits exactly over the `<canvas>` R3F renders into.
 * @param active Whether the smoothing loop should be running right now (the same
 *   visibility gate — off-screen or tab-hidden — that drives the Canvas's own
 *   `frameloop`). Toggling this starts/stops the rAF loop without tearing down the
 *   listeners or rebuilding the camera.
 * @param reduced Reduced motion: no listeners are attached at all, and the returned
 *   ref stays at its resting zero state for the whole mount.
 * @param rig Which camera the unprojection is done through. Defaults to the shared
 *   `CAMERA`, and the second rig exists for the one design that floats above a deck
 *   rather than standing on a floor (`CAMERA_ALTITUDE`). This has to match whatever
 *   is actually rendering pixels or the cursor and the thing it moves disagree by a
 *   perspective divide — which reads as the effect lagging behind the mouse in one
 *   half of the frame and running ahead of it in the other.
 * @param planeY The height of the surface pointer rays are solved against.
 *   `GROUND_Y` for the three floor scenes, `DECK_Y` for the cloud deck. The same
 *   argument as `rig`: a ray solved against a plane the visitor cannot see lands
 *   somewhere plausible and wrong.
 */
export function usePointerPlane(
  hostRef: RefObject<HTMLElement | null>,
  active: boolean,
  reduced: boolean,
  rig: CameraRig = CAMERA,
  planeY: number = GROUND_Y,
): RefObject<PointerPlane> {
  const pointerRef = useRef<PointerPlane>(makePointerPlane());
  const pointerFine = usePointerFine();
  const loopControlRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  // Mirrors the `active` prop into a ref so the setup effect (below) can honour
  // whatever the current value is at the moment it (re)runs, without needing
  // `active` in its own dependency array — see the note on that effect.
  //
  // Written in an effect, not during render. Assigning `activeRef.current` inline
  // in the component body is a render-phase side effect: React may render this
  // component and discard the result, which would leave the ref holding a value
  // that never reached the screen. `react-hooks/refs` flags it, and under the React
  // Compiler that is a correctness bug, not a style note. The mirror lands before
  // any paint the setup effect could observe, because effects run in order.
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || reduced || !pointerFine) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    const start = performance.now();

    const camera = new THREE.PerspectiveCamera(rig.fov, 1, rig.near, rig.far);
    camera.position.set(...rig.position);
    camera.lookAt(...rig.target);
    /**
     * Bake the transform into `matrixWorld` — without this the whole hook returns
     * the origin, forever.
     *
     * `position.set` and `lookAt` only write `position` and `quaternion`.
     * `matrixWorld` is composed from them by `updateMatrixWorld()`, which the
     * renderer calls once per frame for everything **in the scene graph** — and
     * this camera is deliberately not in it (see the module comment: it exists so
     * pointer math never reaches into the Canvas). Nothing else was ever going to
     * call it.
     *
     * The failure was silent and total rather than merely inaccurate.
     * `Raycaster.setFromCamera` takes the ray origin from `matrixWorld`, so an
     * identity matrix put the origin at (0, 0, 0) — which is a point *on* the
     * ground plane, since `GROUND_Y` is 0. `Ray.intersectPlane` solves
     * `t = -(origin · normal + constant) / denominator`, that numerator is zero
     * for a coplanar origin, so every ray "hit" the plane at t = 0 and every
     * pointer sample resolved to the world origin. `pointerRef.x` and `.z` read
     * 0 no matter where the cursor was, which silently disabled every
     * pointer-driven effect in all four scenes: Monolith's key light sat inside
     * the mark, its click shockwave always originated at the centre, Lattice's
     * columns never rose, Depth's trough never carved.
     */
    camera.updateMatrixWorld();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
    const raycaster = new THREE.Raycaster();
    const hit = new THREE.Vector3();

    /** Scratch for `setFromCamera`, which wants a real `Vector2`. Allocated once,
     *  written in place — `groundAt` runs once per frame. */
    const ndcScratch = new THREE.Vector2();

    const ndcTarget = { x: 0, y: 0 };
    const ndcCurrent = { x: 0, y: 0 };
    let pointerPrevPx = { x: 0, y: 0 };
    let pointerActive = false;
    let rawSpeed = 0;
    let velocity = 0;
    let clickAt = -1;

    /** Recompute the camera's aspect from the host's current box. Never called from
     *  inside the frame loop — resize is its own, debounced-by-ResizeObserver path. */
    const measure = () => {
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      camera.aspect = width > 0 && height > 0 ? width / height : 1;
      camera.updateProjectionMatrix();
    };

    const groundAt = (ndcX: number, ndcY: number): THREE.Vector3 | null => {
      raycaster.setFromCamera(ndcScratch.set(ndcX, ndcY), camera);
      return raycaster.ray.intersectPlane(groundPlane, hit);
    };

    const frame = () => {
      velocity = smoothVelocity(velocity, pointerActive ? rawSpeed : 0);
      rawSpeed = 0;

      ndcCurrent.x = easeToward(ndcCurrent.x, ndcTarget.x, POINTER_LERP);
      ndcCurrent.y = easeToward(ndcCurrent.y, ndcTarget.y, POINTER_LERP);

      const p = pointerRef.current;
      p.nx = ndcCurrent.x;
      p.ny = ndcCurrent.y;
      p.velocity = velocity;
      p.active = pointerActive;

      const ground = groundAt(ndcCurrent.x, ndcCurrent.y);
      if (ground) {
        p.x = THREE.MathUtils.clamp(ground.x, -WORLD_EXTENT, WORLD_EXTENT);
        p.z = THREE.MathUtils.clamp(ground.z, -WORLD_EXTENT, WORLD_EXTENT);
      }

      const age = clickAt < 0 ? -1 : performance.now() - start - clickAt;
      p.clickAge = age >= 0 && age < CLICK_LIFETIME_MS ? age : -1;

      raf = requestAnimationFrame(frame);
    };

    const startLoop = () => {
      if (raf === 0) raf = requestAnimationFrame(frame);
    };
    const stopLoop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (pointerActive) rawSpeed = Math.max(rawSpeed, Math.hypot(x - pointerPrevPx.x, y - pointerPrevPx.y));
      pointerPrevPx = { x, y };
      pointerActive = true;
      ndcTarget.x = width > 0 ? (x / width) * 2 - 1 : 0;
      ndcTarget.y = height > 0 ? -((y / height) * 2 - 1) : 0;
    };

    const onPointerLeave = () => {
      pointerActive = false;
      rawSpeed = 0;
    };

    const onClick = (e: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      const ndcX = rect.width > 0 ? ((e.clientX - rect.left) / rect.width) * 2 - 1 : 0;
      const ndcY = rect.height > 0 ? -(((e.clientY - rect.top) / rect.height) * 2 - 1) : 0;
      const ground = groundAt(ndcX, ndcY);
      if (ground) {
        pointerRef.current.clickX = THREE.MathUtils.clamp(ground.x, -WORLD_EXTENT, WORLD_EXTENT);
        pointerRef.current.clickZ = THREE.MathUtils.clamp(ground.z, -WORLD_EXTENT, WORLD_EXTENT);
      }
      clickAt = performance.now() - start;
    };

    measure();
    host.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerleave", onPointerLeave, { passive: true });
    host.addEventListener("click", onClick);

    const resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(host);

    loopControlRef.current = { start: startLoop, stop: stopLoop };
    // Honour whatever `active` already is at setup time — this effect's deps
    // deliberately exclude `active` (see the hook-level doc comment), so a mount
    // that starts already visible must not wait for a later `active` transition
    // that will never come.
    if (activeRef.current) startLoop();

    return () => {
      stopLoop();
      loopControlRef.current = null;
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      host.removeEventListener("click", onClick);
    };
    // `active` is intentionally omitted: it is handled by the effect below via
    // `loopControlRef`, so that toggling visibility starts/stops the existing rAF
    // loop instead of tearing down and rebuilding the camera and listeners. (No
    // disable directive needed — `active` is read through `activeRef`, so the rule
    // never asked for it in the first place.)
    //
    // `rig` and `planeY` ARE here: both are baked into the camera and the plane
    // built above, so a tab switch that changes either has to rebuild them. They
    // change once per variant switch, which is the right cost for tearing the
    // loop down and standing it back up.
  }, [hostRef, reduced, pointerFine, rig, planeY]);

  useEffect(() => {
    if (active) loopControlRef.current?.start();
    else loopControlRef.current?.stop();
  }, [active]);

  return pointerRef;
}
