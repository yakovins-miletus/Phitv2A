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
import * as THREE from "three";

import { useIsLowPowerDevice, useReducedMotion } from "@/shared/motion";
import { useSkyModeState } from "../skyModeStore";
import type { HeroBgMode } from "../heroBgModeStore";
import {
  AMBIENT_INTENSITY,
  CAMERAS,
  DECK_Y,
  ENTRANCE_MS,
  FOG,
  GROUND_SIZE,
  GROUND_Y,
  PALETTE,
  ROOM_LIGHT_INTENSITY,
  ROOM_LIGHT_POSITION,
  type CameraRig,
  type CameraRigId,
} from "./constants";
import {
  copyDayCycleSample,
  createDayCycleSample,
  lerpDayCycleSamples,
  sampleForMode,
  type DayCycleSample,
} from "./dayCycle";
import { CloudSea, type CloudSeaHandle } from "./CloudSea";
import { SkyDome, type SkyDomeHandle } from "./SkyDome";
import { usePointerPlane } from "./usePointerPlane";
import { getMarkAnchorBox } from "./markAnchor";
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
  /** Whether this design floats over `CloudSea` instead of the ground plane. */
  cloudDeck?: boolean;
  /** Which rig in `CAMERAS` frames it. */
  camera?: CameraRigId;
  initialProgress?: number;
  /**
   * The `#hero` container. Published onto it as `--hp-px` / `--hp-py` /
   * `--hp-pw` — the mark's screen box, in fractions of the canvas — so the
   * motto (a DOM sibling of this canvas, not a descendant of it) knows where
   * to sit. See `markAnchor.ts` for who writes the box this reads, and
   * `HeroCanvas.tsx`'s `publishLogoBox` for the legacy-mode equivalent.
   */
  varsHostRef?: RefObject<HTMLElement | null> | undefined;
  /**
   * Read once here, near the top, rather than deep inside `Stage` or a
   * scene — the same pattern `skyMode` already follows a few lines below.
   * `"video"` means an HTML `<video>` layer behind this canvas supplies sky,
   * cloud and the day/night transition; this canvas then renders with a
   * transparent clear colour and skips `SkyDome`/`CloudSea` so they don't
   * double up on or occlude it. Defaults to `"static"` so callers that don't
   * pass it (there are none left, but the type stays optional for the same
   * reason `camera` and `cloudDeck` are) get today's behaviour unchanged.
   */
  bgMode?: HeroBgMode;
  onNodeSelect?: ((index: number) => void) | undefined;
}

/**
 * The shared stage: fog, ground, and the base rig.
 *
 * A scene's own key light is additive on top of this. Intensities are deliberately
 * low — with fog this dark and each scene lighting its own subject, a bright ambient
 * term would flatten every scene's contrast before it started.
 *
 * **And the weather.** The sky, the fog, the floor and the base rig are the four
 * things the room's light touches, and all four live here rather than in a
 * scene — a scene that relit the room would be a scene that owns the room. The
 * light itself is one fixed authored look with no clock; see `dayCycle.ts`.
 *
 * The room eases toward whichever preset is chosen rather than snapping to it,
 * and it eases the *sample* — not a position along a ramp — so it never travels
 * through a look nobody authored to reach one that was.
 *
 * Everything below is mutated in place inside one `useFrame`: no state, no
 * re-render, no allocation.
 */
function Stage({
  applied,
  target,
  immediate,
  rig,
  cloudDeck,
  reduced,
  hideSky,
}: {
  /** The room's live sample. Owned by `PlaygroundCanvas` and shared with the
   *  scene, so both read one object and cannot disagree about the hour. */
  applied: DayCycleSample;
  target: Readonly<DayCycleSample>;
  /** Arrive this frame instead of easing. */
  immediate: boolean;
  rig: CameraRig;
  /** This design floats over `CloudSea` instead of standing on the ground plane. */
  cloudDeck: boolean;
  reduced: boolean;
  /**
   * Video background mode: an HTML `<video>` layer behind this canvas already
   * supplies sky, cloud and the day/night transition, so `SkyDome`/`CloudSea`
   * (and the flat background colour) would just double up on or occlude it.
   * The mark, its lighting and the ground/deck bounce still render — only the
   * two weather layers and the opaque backdrop are skipped.
   */
  hideSky: boolean;
}) {
  const fogRef = useRef<THREE.Fog>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const bounceRef = useRef<THREE.HemisphereLight>(null);
  const roomRef = useRef<THREE.DirectionalLight>(null);
  const groundRef = useRef<THREE.MeshStandardMaterial>(null);
  const skyRef = useRef<SkyDomeHandle | null>(null);
  const deckRef = useRef<CloudSeaHandle | null>(null);

  useFrame(() => {
    // `target` is fixed — the room has one authored look and no clock (see
    // `dayCycle.ts`). This ease is therefore a one-shot settle from whatever
    // the sample was constructed with toward that look, not an animation: it
    // converges within ~0.5s of mount and then writes the same values every
    // frame. Left in place rather than gated on a "has settled" flag, because
    // the writes below are unconditional anyway and a converged lerp costs
    // less than the branch that would skip it.
    lerpDayCycleSamples(applied, applied, target, immediate ? 1 : 0.055);

    if (!hideSky) {
      skyRef.current?.apply(applied);
      deckRef.current?.apply(applied);
    }

    const fog = fogRef.current;
    if (fog) {
      fog.color.copy(applied.fog);
      fog.near = applied.fogNear;
      fog.far = applied.fogFar;
    }

    const ambient = ambientRef.current;
    if (ambient) ambient.intensity = applied.ambientIntensity;

    // Sky above, deck below. Both colours ride the cycle, so the bounce is
    // always the colour of the thing actually reflecting — which is the point:
    // a fixed warm fill would be a lie at night and at noon.
    const bounce = bounceRef.current;
    if (bounce) {
      bounce.color.copy(applied.skyMid);
      bounce.groundColor.copy(applied.deckLit);
      bounce.intensity = applied.bounceIntensity;
    }

    const room = roomRef.current;
    if (room) {
      room.color.copy(applied.roomLight);
      room.intensity = applied.roomIntensity;
    }

    const ground = groundRef.current;
    if (ground) ground.color.copy(applied.ground);
  });

  return (
    <>
      {/* The dome paints every direction, so `background` is only ever seen in
          the one frame before it draws. It stays because a null background is
          transparent-to-black, and one frame of black is a flash. Neither
          applies in video mode: the `<video>` layer behind this canvas is the
          backdrop, so a painted dome or an opaque clear colour would sit on
          top of it rather than let it show. */}
      {!hideSky && <color attach="background" args={[PALETTE.navyInk]} />}
      {!hideSky && <SkyDome handleRef={skyRef} rig={rig} />}
      {/* Fog blends toward the background colour at the far plane — with no
          opaque background in video mode, that blend would tint the mark
          rather than fade toward the video showing through, so it is skipped
          here too. */}
      {!hideSky && <fog ref={fogRef} attach="fog" args={[FOG.color, FOG.near, FOG.far]} />}
      <ambientLight ref={ambientRef} intensity={AMBIENT_INTENSITY} />
      {/*
        Bounce off whatever is underneath. Ambient is directionless by
        definition and so cannot express the one fact that dominates the light
        on a floating object: far more of it arrives from below, off an
        enormous lit deck, than from the sky above. One extra light in the rig,
        and the single biggest reason the glass stopped reading as a studio
        object on a backdrop.
      */}
      <hemisphereLight ref={bounceRef} intensity={0} />
      <directionalLight
        ref={roomRef}
        position={ROOM_LIGHT_POSITION as unknown as [number, number, number]}
        intensity={ROOM_LIGHT_INTENSITY}
        color={PALETTE.frost}
      />
      {/* One floor or the other, never both — the deck is opaque and would
          simply hide the plane, at the cost of drawing it. Neither in video
          mode: the video already shows a cloud sea under the mark, and either
          surface here would occlude it. */}
      {!hideSky &&
        (cloudDeck ? (
          <CloudSea handleRef={deckRef} reduced={reduced} />
        ) : (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, 0]} receiveShadow={false}>
            <planeGeometry args={[GROUND_SIZE * 2, GROUND_SIZE * 2]} />
            <meshStandardMaterial
              ref={groundRef}
              color={PALETTE.navyInk}
              roughness={1}
              metalness={0}
            />
          </mesh>
        ))}
    </>
  );
}

/**
 * Hands the frame-loop's `advance` out to the imperative handle.
 *
 * `advance` is only reachable from inside the Canvas, and `setDayCycle` is called
 * from outside it. This is the one wire between the two; it carries a function,
 * not a value, so nothing here re-renders when the cycle changes.
 *
 * A callback rather than a ref to write into: a component that mutates a ref it
 * was handed as a prop is reaching into its parent's state, and `react-hooks`
 * rejects it. The parent owns the ref and owns the write.
 */
function AdvanceBridge({ onAdvance }: { onAdvance: (fn: ((t: number) => void) | null) => void }) {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    onAdvance(advance);
    return () => onAdvance(null);
  }, [advance, onAdvance]);
  return null;
}

/**
 * Writes the rig's frustum onto a camera.
 *
 * At module scope rather than inline in the effect below because `fov`, `near`
 * and `far` are plain property assignments, and the React Compiler's lint
 * rejects those on a value that came out of a hook (`useThree`) — correctly, in
 * general: mutating a hook's return during render is how stale UI happens. Here
 * the target is a three.js camera being driven from an effect, which is the
 * "synchronise an external system" case effects exist for, and the mutation is
 * the entire point. Moving it behind a function boundary states that the object
 * is being handed to imperative code rather than edited in place by a component.
 */
function applyRigFrustum(camera: THREE.Camera, rig: CameraRig): void {
  const perspective = camera as THREE.PerspectiveCamera;
  if (!perspective.isPerspectiveCamera) return;
  perspective.fov = rig.fov;
  perspective.near = rig.near;
  perspective.far = rig.far;
}

/** Points the camera at its rig's target once, after R3F builds it. */
function CameraPose({ rig }: { rig: CameraRig }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.position.set(...(rig.position as unknown as [number, number, number]));
    camera.lookAt(...(rig.target as unknown as [number, number, number]));
    // `fov`/`near`/`far` also arrive as Canvas props, but those are applied when
    // the root is configured — a variant switch changes the rig on a camera that
    // already exists, and an altitude tab left on the room's 35° / 60-unit far
    // plane would clip its own deck in half. Cheap, and idempotent when the
    // Canvas has already done it.
    applyRigFrustum(camera, rig);
    camera.updateProjectionMatrix();
  }, [camera, rig]);
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
  cloudDeck = false,
  camera = "room",
  initialProgress = 0,
  varsHostRef,
  bgMode = "static",
  onNodeSelect,
}: PlaygroundCanvasProps) {
  const rig = CAMERAS[camera];
  const hideSky = bgMode === "video";
  const hostRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(initialProgress);
  const settleRef = useRef(0);

  /**
   * Publish the mark's screen box onto `varsHostRef`, outside the R3F render
   * loop entirely.
   *
   * A plain `requestAnimationFrame` loop rather than a `useFrame` inside the
   * Canvas: the scene publishes the box from its own `useFrame` (see
   * `markAnchor.ts`), and reading it back from a second `useFrame` here would
   * depend on R3F's cross-component frame-subscription order, which is not a
   * contract this file wants to lean on. A plain rAF loop reads whatever the
   * scene last published, whenever the browser last painted — including while
   * the Canvas itself is parked at `frameloop="demand"`, where it simply
   * re-reads the same, unchanged value each tick until the next scene frame
   * moves it. Delta-gated, like `HeroCanvas.tsx`'s `publishLogoBox`: the mark
   * barely moves at rest, and a write that changes nothing still costs style
   * invalidation.
   */
  useEffect(() => {
    const host = varsHostRef?.current;
    if (!host) return;
    let raf = 0;
    let disposed = false;
    const last = { x: -1, y: -1, w: -1 };
    const tick = () => {
      if (disposed) return;
      if (!document.hidden) {
        const box = getMarkAnchorBox();
        if (
          box &&
          (Math.abs(box.x - last.x) >= 0.0005 ||
            Math.abs(box.y - last.y) >= 0.0005 ||
            Math.abs(box.w - last.w) >= 0.0005)
        ) {
          last.x = box.x;
          last.y = box.y;
          last.w = box.w;
          const s = host.style;
          s.setProperty("--hp-px", box.x.toFixed(4));
          s.setProperty("--hp-py", box.y.toFixed(4));
          s.setProperty("--hp-pw", box.w.toFixed(4));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
    };
  }, [varsHostRef]);

  const reduced = useReducedMotion() === true;
  const lowPower = useIsLowPowerDevice();
  const { mode: skyMode } = useSkyModeState();

  /** Filled by `AdvanceBridge` from inside the Canvas; null before it mounts. */
  const advanceRef = useRef<((t: number) => void) | null>(null);
  const receiveAdvance = useCallback((fn: ((t: number) => void) | null) => {
    advanceRef.current = fn;
  }, []);
  useImperativeHandle(
    handleRef,
    () => ({
      setProgress: (p: number) => {
        progressRef.current = p;
      },
    }),
    [],
  );

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

  // Solved against whichever surface this design actually shows: the deck for
  // the floating variant, the ground plane for the other three.
  const pointerRef = usePointerPlane(
    hostRef,
    running && !reduced,
    reduced,
    rig,
    cloudDeck ? DECK_Y : GROUND_Y,
  );

  /** One source of truth for "is the loop parked", read by `frameloop` below and
   *  by the phase repaint beneath it. */
  const parked = reduced || !running;

  /**
   * The room's live weather, and where it is heading.
   *
   * `applied` is created once and mutated in place by `Stage`; the scene reads
   * the same object. One eased sample rather than one per consumer, because two
   * eases on the same curve still drift apart the moment one of them misses a
   * frame — and "the mark's key light disagrees with the sky behind it" is a bug
   * nobody would think to look for.
   */
  const target = useMemo(
    () => copyDayCycleSample(createDayCycleSample(), sampleForMode(skyMode)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- built once from
    // whatever mode was live at mount; the effect below keeps it live after.
    [],
  );
  const applied = useMemo(() => copyDayCycleSample(createDayCycleSample(), target), [target]);

  /**
   * Re-point `target` at the chosen sky, in place.
   *
   * `sampleForMode` returns one of two frozen, module-level samples
   * (`DAY_SAMPLE`/`NIGHT_SAMPLE`) — never the live `target` object itself, so
   * copying into `target` cannot ever mutate an authored sample by accident.
   * `Stage`'s own `useFrame` already eases `applied` toward `target` every
   * frame (`lerpDayCycleSamples(applied, applied, target, ...)`), so simply
   * moving the destination is the whole crossfade: no second ease, no React
   * state, nothing that re-renders on toggle. ~1.2s at `PHASE_EASE`, instant
   * whenever `immediate` is true (reduced motion or a parked loop).
   *
   * Low-power devices skip the star field at night entirely rather than
   * paying for it and immediately fading it down — `starVisibility` is
   * forced to 0 regardless of mode.
   */
  useEffect(() => {
    copyDayCycleSample(target, sampleForMode(skyMode));
    if (lowPower) target.starVisibility = 0;
  }, [target, skyMode, lowPower]);

  /**
   * Arrive immediately rather than easing, whenever frames are not flowing.
   *
   * Reduced motion is the obvious case: a crossfade is an animation and that flag
   * asks for the destination. The parked loop is the one that actually bites — a
   * `"demand"` loop only renders the frames something explicitly asks for, so a
   * 0.055-per-frame ease driven by the two frames below would stop 11% of the way
   * to the chosen phase and stay there. Measured, exactly that: every button left
   * the room on dawn.
   */
  const immediate = parked;

  /**
   * Paint the new time of day when nothing else will.
   *
   * Choosing a phase is the one input that changes the picture while the loop is
   * parked — under reduced motion, with the hero scrolled off, or on a hidden
   * tab. A control that silently does nothing for a reduced-motion visitor is not
   * a control. `advance()` and not `invalidate()` for the reason `RestingFrame`
   * documents: `invalidate` schedules through `requestAnimationFrame`, which does
   * not run on a hidden page — and "hidden" is one of the cases this exists for.
   * Two steps, so the first can write the values the second draws.
   */
  useEffect(() => {
    if (!parked) return;
    const now = performance.now();
    advanceRef.current?.(now);
    advanceRef.current?.(now + 16);
    // `skyMode` too: toggling day/night while the loop is parked (reduced
    // motion, or the hero off-screen) is exactly the same "nothing else will
    // paint this" case `RestingFrame`'s docblock describes for a phase pick.
  }, [parked, skyMode]);

  // A new tab restarts the settle. Keyed remount of the driver is cheaper and less
  // error-prone than resetting a ref from an effect that races the frame loop.
  const settleKey = `${variantId}`;
  useEffect(() => {
    settleRef.current = 0;
  }, [settleKey]);

  /**
   * Tone mapping, chosen rather than inherited.
   *
   * R3F defaults to `ACESFilmicToneMapping`, and nothing here had ever said
   * otherwise. ACES is a film curve: it desaturates as it rolls off, which is
   * exactly right for a bright HDR render with specular highlights to protect
   * and exactly wrong for a sky made of pastels, where the whole subject *is*
   * the saturation in the middle of the range. It was quietly flattening the
   * violet and rose bands toward grey after the shader had gone to the trouble
   * of authoring them.
   *
   * `NeutralToneMapping` (the Khronos PBR neutral curve, in three since r160)
   * holds hue and saturation through the midtones and only compresses near
   * white — which is where the sun core is, and the one place a roll-off is
   * wanted. Exposure a hair over 1 to recover the small amount of overall
   * brightness the flatter shoulder costs.
   *
   * The dome and the deck are both `toneMapped: false` and unaffected either
   * way; this governs the glass, the droplets and the room's lit surfaces, so
   * the mark and its sky are graded consistently rather than one being ACES and
   * the other raw.
   */
  const glOptions = useMemo(
    () => ({
      antialias,
      powerPreference: "high-performance" as const,
      toneMapping: THREE.NeutralToneMapping,
      toneMappingExposure: 1.06,
      // Only load-bearing in video mode, where `SkyDome`'s opaque `<color
      // attach="background">` is skipped and the `<video>` layer behind this
      // canvas has to show through. Harmless otherwise: static mode always
      // paints an opaque dome or ground before the frame is seen.
      alpha: hideSky,
    }),
    [antialias, hideSky],
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
        frameloop={parked ? "demand" : "always"}
        camera={{ fov: rig.fov, near: rig.near, far: rig.far }}
        /**
         * Measure the *layout* box, not the painted one.
         *
         * This canvas is a descendant of `.hero-card`, which the gunshot scales
         * with `transform: scale(...)` down to ~0.24 at the end of the pin.
         * R3F sizes the canvas from `react-use-measure`, which defaults to
         * `getBoundingClientRect()` — and that reports the box *after* the
         * ancestor transform. So the observer saw 347×217, sized the canvas to
         * 347×217, and the card's transform then scaled that again: a measured
         * 84×52 canvas floating in a 347×217 card, shrinking on every scroll
         * tick that changed the scale.
         *
         * `offsetSize` switches the measurement to `offsetWidth`/`offsetHeight`,
         * which are pre-transform layout values and therefore stable across the
         * whole morph. The canvas now fills the card and scales exactly once,
         * with it.
         */
        resize={{ offsetSize: true }}
        onCreated={onCreated}
      >
        <CameraPose rig={rig} />
        <AdvanceBridge onAdvance={receiveAdvance} />
        <Stage
          applied={applied}
          target={target}
          immediate={immediate}
          rig={rig}
          cloudDeck={cloudDeck}
          reduced={reduced}
          hideSky={hideSky}
        />
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
            daySample={applied}
            reduced={reduced}
            lowPower={lowPower}
            {...(onNodeSelect && { onNodeSelect })}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
