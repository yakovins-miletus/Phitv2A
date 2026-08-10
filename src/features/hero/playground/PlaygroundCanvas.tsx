/**
 * The room every playground scene is staged in.
 *
 * Four scenes plug in here (`variants.ts`), and this file owns everything they are
 * NOT allowed to redefine: the camera, the fog, the ground plane, the base lighting
 * rig, and the pointer. That division is the whole reason the gallery reads as four
 * designs of one thing rather than four unrelated demos — a scene that brought its
 * own camera would break the comparison the tabs exist to make.
 *
 * Three properties carry over from the 2D hero and are not negotiable here either:
 *
 *  - **Scroll causes zero React renders.** Progress arrives through an imperative
 *    handle and lands in a ref (`progressRef`); scenes read it inside `useFrame`.
 *  - **The loop stops rather than idles.** Off-screen or on a hidden tab, the
 *    canvas goes `frameloop="never"`. Mirrors `HeroCanvas.tsx`'s gating.
 *  - **Reduced motion is a designed frame, not an absence.** One render, then never
 *    again; each scene defines what it looks like at rest.
 */

import { Suspense, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { ComponentType, RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

import { useIsLowPowerDevice, useReducedMotion } from "@/shared/motion";
import {
  AMBIENT_INTENSITY,
  CAMERA,
  ENTRANCE_MS,
  FOG,
  GROUND_SIZE,
  GROUND_Y,
  PALETTE,
  ROOM_LIGHT_INTENSITY,
  ROOM_LIGHT_POSITION,
} from "./constants";
import { usePointerPlane } from "./usePointerPlane";
import type { SceneProps } from "./types";

export interface PlaygroundCanvasHandle {
  /** Push the pin's 0..1 progress. Cheap, synchronous, causes no render. */
  setProgress: (p: number) => void;
}

interface PlaygroundCanvasProps {
  handleRef: RefObject<PlaygroundCanvasHandle | null>;
  /** The active variant's scene, already resolved by `React.lazy`. */
  Scene: ComponentType<SceneProps>;
  /** Changes whenever the tab changes — restarts the entrance settle. */
  variantId: string;
  antialias: boolean;
  initialProgress?: number;
}

/**
 * The shared stage: fog, ground, and the base rig.
 *
 * A scene's own key light is additive on top of this. Intensities are deliberately
 * low — with fog this dark and each scene lighting its own subject, a bright ambient
 * term would flatten every scene's contrast before it started.
 */
function Stage() {
  return (
    <>
      <color attach="background" args={[PALETTE.navyInk]} />
      <fog attach="fog" args={[FOG.color, FOG.near, FOG.far]} />
      <ambientLight intensity={AMBIENT_INTENSITY} />
      <directionalLight
        position={ROOM_LIGHT_POSITION as unknown as [number, number, number]}
        intensity={ROOM_LIGHT_INTENSITY}
        color={PALETTE.frost}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, 0]} receiveShadow={false}>
        <planeGeometry args={[GROUND_SIZE * 2, GROUND_SIZE * 2]} />
        <meshStandardMaterial color={PALETTE.navyInk} roughness={1} metalness={0} />
      </mesh>
    </>
  );
}

/** Points the shared camera at the shared target once, after R3F builds it. */
function CameraRig() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.position.set(...(CAMERA.position as unknown as [number, number, number]));
    camera.lookAt(...(CAMERA.target as unknown as [number, number, number]));
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

/**
 * Paints one frame whenever the loop is parked.
 *
 * `frameloop="never"` renders **zero** times — it does not render once and stop, it
 * never runs at all — so using it for reduced motion produced a blank canvas rather
 * than the designed resting frame each scene owes that visitor. `"demand"` plus an
 * explicit `invalidate()` is the primitive that actually means "render once".
 *
 * `advance()`, not `invalidate()`. `invalidate()` only *schedules* a render, and it
 * schedules it through `requestAnimationFrame` — which does not run while the page
 * is hidden. The loop is parked in exactly two situations, and one of them is "the
 * tab is hidden", so the frame that is supposed to guarantee something is on screen
 * was the one frame guaranteed never to paint. Open the site in a background tab
 * and switch to it and you got an empty canvas. `advance()` renders synchronously
 * and does not care.
 *
 * Two steps, not one: scenes compute their transforms inside `useFrame`, so the
 * first step establishes them and the second draws the result. One would leave
 * every instanced scene at its identity matrix.
 */
function RestingFrame({ trigger }: { trigger: string }) {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    const now = performance.now();
    advance(now);
    advance(now + 16);
  }, [advance, trigger]);
  return null;
}

/**
 * Drives `settleRef` 0 → 1 over `ENTRANCE_MS` with an ease-out.
 *
 * Lives inside the Canvas so it runs off the render loop rather than a second timer
 * that would keep ticking while the loop is parked. Under reduced motion it pins to
 * 1 immediately — a settle animation is exactly the kind of thing that flag asks us
 * not to play.
 */
function SettleDriver({ settleRef, reduced }: { settleRef: RefObject<number>; reduced: boolean }) {
  const startRef = useRef<number | null>(null);
  useFrame(() => {
    if (reduced) {
      settleRef.current = 1;
      return;
    }
    const now = performance.now();
    if (startRef.current === null) startRef.current = now;
    const t = Math.min(1, (now - startRef.current) / ENTRANCE_MS);
    settleRef.current = 1 - Math.pow(1 - t, 3);
  });
  return null;
}

export function PlaygroundCanvas({
  handleRef,
  Scene,
  variantId,
  antialias,
  initialProgress = 0,
}: PlaygroundCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(initialProgress);
  const settleRef = useRef(0);

  const reduced = useReducedMotion() === true;
  const lowPower = useIsLowPowerDevice();

  useImperativeHandle(handleRef, () => ({ setProgress: (p: number) => { progressRef.current = p; } }), []);

  // The loop gate. `running` is the only piece of state here that scroll cannot
  // touch — it flips when the hero leaves the viewport or the tab is hidden, which
  // is a handful of times per session, never per frame.
  const [running, setRunning] = useState(true);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let onScreen = true;
    const sync = () => setRunning(onScreen && !document.hidden);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        onScreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0.02 },
    );
    io.observe(host);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const pointerRef = usePointerPlane(hostRef, running && !reduced, reduced);

  // A new tab restarts the settle. Keyed remount of the driver is cheaper and less
  // error-prone than resetting a ref from an effect that races the frame loop.
  const settleKey = `${variantId}`;
  useEffect(() => {
    settleRef.current = 0;
  }, [settleKey]);

  const glOptions = useMemo(
    () => ({ antialias, powerPreference: "high-performance" as const }),
    [antialias],
  );

  const onCreated = useCallback(() => {
    settleRef.current = 0;
  }, []);

  return (
    <div
      ref={hostRef}
      data-testid="playground-canvas"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    >
      <Canvas
        dpr={[1, 1.75]}
        gl={glOptions}
        frameloop={reduced || !running ? "demand" : "always"}
        camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far }}
        onCreated={onCreated}
      >
        <CameraRig />
        <Stage />
        <SettleDriver key={settleKey} settleRef={settleRef} reduced={reduced} />
        <RestingFrame trigger={`${settleKey}:${reduced}:${running}`} />
        {/* Fallback is the bare stage, never a spinner: switching tabs must not
            flash an empty frame between one scene unmounting and the next
            resolving. The room stays; only its contents change. */}
        <Suspense fallback={null}>
          <Scene
            progressRef={progressRef}
            pointerRef={pointerRef}
            settleRef={settleRef}
            reduced={reduced}
            lowPower={lowPower}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
