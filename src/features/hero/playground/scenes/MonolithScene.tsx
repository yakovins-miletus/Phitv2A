/**
 * 01 · MONOLITH — "The mark as cast glass, and the liquid it was poured from."
 *
 * The scene contains exactly one object, and that object has two states.
 *
 * **Solid.** The P extruded from `/phitopolis_logo_hero.svg` — three filled paths,
 * two navy and one gold, measured: navy spans x 564→2271 / y 81→1926 and gold
 * x 928→1895 / y 364→1927, wholly inside it. Extrude both around a shared
 * mid-plane and the gold ends up *encased*: you look through the brand mark and
 * find the other half of it floating in there.
 *
 * **Liquid.** Click the mark and it lets go. Every droplet is a real sample of the
 * geometry it came from — navy droplets from the body, gold droplets from the
 * counter-form — so the cloud filling the room is literally the mark's own matter,
 * not a particle effect standing next to it. Move the cursor and the droplets get
 * out of its way. Click back into the cloud and they come home.
 *
 * The droplet physics is the footer's, ported from two dimensions to three:
 * `LogoParticleField.tsx` samples the same logo, keeps particle state in flat
 * `Float32Array`s, and each frame pushes away from the cursor, springs toward a
 * home and damps the velocity. Same three forces, same reason (no allocation in
 * the frame path, so the GC never sees it), and deliberately the same constants
 * where they translate — this should feel like the footer's mark, because it is.
 *
 * **There is no floor. The mark is in the air.** It used to stand on water — a
 * dot field displaced by a radial wake — and that surface is gone, replaced by
 * `CloudSea`, a deck of vapour a couple of units below with open sky underneath
 * the mark. The change is a composition, not a texture swap: the eye sits *below*
 * the mark's base (`CAMERA_ALTITUDE`), because an infinite plane's horizon always
 * projects to the camera's own level line, so putting air under a floating object
 * is a question of where the camera is and nothing else. The cursor still
 * disturbs the surface, but it stirs the vapour rather than rippling it — see
 * `CloudSea`, which owns both.
 *
 * **And it has a time of day.** A sun and a moon ride one orbit behind the mark —
 * never drawn, only ever felt, as the quarter of the sky that is brighter, the
 * one point inside it that is brightest, and the direction the light comes from.
 * The five-stop dome, the deck, the fog and every light come off the ramp in
 * `dayCycle.ts`: dawn through noon through dusk and back to the night this scene
 * has always been. The slider under the tab strip is the only thing that moves
 * them. The page chrome outside the canvas reads the same ramp, so the navbar and
 * the chapter rail invert with the sky rather than guessing at it.
 *
 * Anti-goals, held: no forever-turntable — the yaw is bounded to ±12° and driven
 * by scroll, and the sun moves only when a visitor drags it; no bloom, and no
 * drawn sun either (see "The sky" below); no purple/teal; no on-canvas caption.
 *
 * NO RAW HEX. Every colour is a `PALETTE` member from `../constants`.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

import { DECK_Y, GROUND_Y, PALETTE } from "../constants";
import { setMarkAnchorBox } from "../markAnchor";
import type { PointerPlane, SceneProps } from "../types";

const LOGO_SRC = "/phitopolis_logo_hero.svg";

/**
 * Scratch vectors for the anchor publish at the end of the frame loop below —
 * reused every frame rather than allocated, matching the rest of this file's
 * zero-allocation rule.
 */
const ANCHOR_BOTTOM = new THREE.Vector3();
const ANCHOR_LEFT = new THREE.Vector3();
const ANCHOR_RIGHT = new THREE.Vector3();

/* ── The mark ───────────────────────────────────────────────────────────────── */

/** `CAMERA_ALTITUDE` puts the eye at y 1.2 / z 10.5 with a 40° fov, so the visible
 *  height at z = 0 is ≈ 7.6 world units. A 2.5-unit mark fills a third of the
 *  frame — a landmark in the room, and clear of the h1 above it. */
const MARK_HEIGHT = 2.5;
/**
 * How high the mark floats.
 *
 * Was 0.16 — a mark resting on a floor, with the lift only there to keep its
 * base out of the ground plane's z-fight. There is no floor now, and this is
 * the number that decides whether the thing reads as *suspended*: the eye sits
 * at y 1.2 (`CAMERA_ALTITUDE`), so a base below that projects under the horizon
 * and the deck closes behind it, which reads as standing on cloud. At 1.5 the
 * base clears the eye by 0.3 units — about 1.6° — and there is unmistakable sky
 * under the mark. The deck is 1.8 units below that, close enough to belong to
 * the same picture and far enough that nothing touches.
 */
const MARK_LIFT = 1.5;
const BODY_DEPTH = 0.72;
/** A fifth of the body's depth, so there is glass in front of the counter-form and
 *  glass behind it. Derived, never typed twice — it is the whole design. */
const COUNTER_DEPTH = BODY_DEPTH * 0.2;
const BEVEL = 0.022;
/** Bounded, scroll-driven yaw across the pin. Not a turntable. */
const MAX_YAW = (12 * Math.PI) / 180;
/** Centre of the mark in world space — the origin droplets are measured from. */
const MARK_CENTRE_Y = GROUND_Y + MARK_LIFT + MARK_HEIGHT / 2;

/* ── The liquid ─────────────────────────────────────────────────────────────── */

/**
 * One hundred and twenty droplets, split the way the mark is: mostly navy body,
 * a gold minority. The 87/33 ratio is the mark's own — the counter-form is a bit
 * over a quarter of the silhouette.
 *
 * Down from 720. At that count the cloud was a *spray* — the room read as full of
 * matter, but no single drop was an object you could follow, and the effect was
 * closer to weather than to liquid. A hundred and twenty is few enough that each
 * one is a thing with a size and a path.
 *
 * There is no low-power variant any more, and that is the point rather than an
 * omission: at 720 instances the count was worth tiering, at 120 it is noise next
 * to the transmission pass on the glass, which `lowPower` still switches. A knob
 * that no longer moves anything is a knob to delete.
 */
const DROPS_BODY = 87;
const DROPS_COUNTER = 33;

/**
 * Base droplet radius, and the per-droplet multiplier around it.
 *
 * These came *down* from 0.1 / 0.8–2.4, where the fattest drops were nearly a
 * quarter of a unit across against a 2.5-unit mark — beads rather than droplets,
 * and large enough that a couple of them near the camera dominated the frame.
 * 0.062 × up to 1.7 caps the largest at ~0.105 units, small enough to read as
 * liquid the mark shed and still large enough to hold a specular highlight,
 * which is the thing that keeps the cloud from reading as confetti.
 *
 * The distribution stays cubed, so most droplets sit near the minimum and a few
 * are conspicuously fat: a linear spread gives a uniform gradient of sizes, which
 * reads as a mistake rather than as a distribution.
 *
 * `CLOUD_HIT_RADIUS` below is deliberately NOT scaled with this. It is a multiple
 * of each droplet's size *multiplier*, not of its world radius, so shrinking the
 * drops here does not shrink the click target — which is the whole point, since
 * the target is already moving away from the cursor as you aim at it.
 */
const DROP_RADIUS = 0.062;
const DROP_SIZE_MIN = 0.7;
const DROP_SIZE_MAX = 1.7;

/** How long the mark takes to let go, and to pull itself back together. Reforming
 *  is slower: scattering is an event, gathering is a decision. */
const MELT_MS = 900;
const REFORM_MS = 1250;

/**
 * Cursor repulsion, ported from `LogoParticleField.tsx`.
 *
 * There, `REPEL_RADIUS` is 88 CSS px against a mark drawn ~330px wide — about 27%
 * of the mark. Here the mark is 2.5 world units, so 0.66 would be the literal
 * translation; 1.5 is deliberately wider because the footer's particles sit in a
 * plane and these fill a room, and a radius that reads as generous in 2D reads as
 * a pinprick once the cloud has depth.
 */
const REPEL_RADIUS = 1.5;
const REPEL_STRENGTH = 0.085;
/** Spring and damping are the footer's own values. They are tuned *together* —
 *  raising stiffness without raising damping makes the mark ring like a bell. */
const SPRING_HOME = 0.055;
const SPRING_ROAM = 0.012;
const DAMPING = 0.88;

/**
 * How far the cloud spreads when liquid: an annulus on the floor plan, lifted.
 *
 * Pulled in from 5.2 / 3.6 after the first liquid pass, which filled the entire
 * viewport edge to edge — droplets sat on top of the h1, which is the page's
 * first stop and does not get to be the thing behind the confetti. The ceiling
 * now lands just above the mark's crown rather than above the headline.
 *
 * `ROAM_Z_SQUASH` flattens the annulus toward the camera axis. A droplet at
 * z = +4.2 is under 7 units from a lens at z = 11, so it projects enormous and
 * drifts across the whole frame; squashing z keeps the cloud in the room instead
 * of in front of it, and reads as depth rather than as a screen wipe.
 */
const ROAM_INNER = 1.1;
const ROAM_OUTER = 4.4;
const ROAM_Z_SQUASH = 0.6;
const ROAM_Y_MIN = 0.3;
const ROAM_Y_MAX = 2.9;

/**
 * How wide a click counts as "in the cloud", as a multiple of each droplet's own
 * size multiplier — so a fat globule is a bigger target than a fleck, which is
 * what aiming at one feels like it should do.
 *
 * Generous, and more so since the droplets shrank: they are now well under a
 * tenth of a unit across, they are actively fleeing the cursor, and a sparse cloud
 * has real gaps between them. Requiring a literal hit would be a target that moves
 * away as you aim at it, in a volume that is mostly empty.
 */
const CLOUD_HIT_RADIUS = 0.8;

/* ── The floor ──────────────────────────────────────────────────────────────
 *
 * There isn't one, and its removal is most of this scene's re-cut.
 *
 * What stood here was `DotField`: ~1,500 instanced discs on a 0.27-unit grid,
 * lifted every frame by a radial wake (`sin(d·k − t·speed) · exp(−d·falloff)`)
 * with `rippleCrest` layered on for clicks — a water surface, and a good one.
 * It is gone rather than recoloured because a displaced grid *is* water: the
 * membrane and the travelling crest are what the eye reads, not the colour, so
 * a blue-grey version of it would have been water pretending to be sky.
 *
 * The deck that replaced it is `CloudSea`, and it belongs to the shared stage
 * rather than to this scene — the same reasoning that put the sky there. See
 * that file for the stir and the billow, which are this wake's descendants: same
 * two pointer inputs, roughly a quarter of the speed, warping a noise domain
 * instead of lifting a height field.
 */

/* ── The light ──────────────────────────────────────────────────────────────── */

/**
 * One key light, parked — and one that isn't.
 *
 * The key used to follow the cursor and carry a visible emissive sphere as its
 * source. Both are gone: the moving source read as a hard white disc skating over
 * the floor, and with the cursor now driving the wake *and* the droplets, a third
 * thing chasing it was noise. A fixed three-quarter key is what a photographer
 * would reach for, and it lets the glass hold one stable read while everything
 * that moves is something the visitor is actually doing.
 *
 * That still holds. What is new is that the key's *colour and strength* ride the
 * day cycle (`dayCycle.ts`), and a second, celestial light comes in behind it
 * aimed from whichever body is above the horizon. The anti-goal the parked key
 * defends is "nothing in this scene chases the pointer" — the sun moves because a
 * visitor drags a slider, which is the same kind of cause, not a loop running on
 * its own. At midnight the celestial light is off and the key is exactly the
 * `KEY_NIGHT_INTENSITY` frost it always was, so the night frame is unchanged.
 */
const KEY_POSITION: readonly [number, number, number] = [-2.9, 2.6, 3.4];
const KEY_DISTANCE = 20;

/* ── The sky ────────────────────────────────────────────────────────────────
 * Nothing celestial is *drawn* in this scene. There is no sun disc and no moon
 * disc: the shared room's `SkyDome` puts a scattering glow where the body is, the
 * light below comes from the same direction, and that is the whole of it.
 *
 * This was tried the other way first. A drawn ball reads as a sticker on the
 * backdrop — a second hard-edged bright object in a frame whose entire subject is
 * one hard-edged bright object, and the eye goes to the wrong one. The sky is
 * allowed to say where the sun is; it is not allowed to compete with the mark. */

/** How far out the celestial light stands. Direction is all a directional light
 *  uses; the distance only has to clear the room. */
const SUN_DISTANCE = 9;

/** Deterministic, seed-stable — the cloud is identical across remounts and a
 *  screenshot of it is reproducible. Same trick `DepthScene` uses for its feed. */
function seeded(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * The two extruded bodies, built once per mount from the parsed SVG.
 *
 * Both are centred on the *combined* bounding box, not on their own: centring them
 * separately would slide the counter-form out of the letterform it belongs to. One
 * scale, one origin, two depths.
 *
 * The y flip is a rotation about x, not a negative scale. SVG is y-down and world
 * is y-up, and `scale(1, -1, 1)` would fix the orientation while inverting every
 * face's winding — which a transmissive material renders as an object turned
 * inside out. A π rotation flips z too, which costs nothing: both geometries are
 * already symmetric about z = 0 by the time it is applied.
 */
function buildGeometries(paths: THREE.ShapePath[]): {
  body: THREE.ExtrudeGeometry;
  counter: THREE.ExtrudeGeometry | null;
  /** The mark's silhouette in world units, for the click proxy. */
  markWidth: number;
} {
  // `ShapePath.userData` is typed as the empty object — `SVGLoader` fills it with
  // the element's parsed presentation attributes, which the types cannot know
  // about. One narrow cast at the single point of use.
  const fillOf = (p: THREE.ShapePath): string =>
    String((p.userData as { style?: { fill?: string } } | undefined)?.style?.fill ?? "");
  const isGold = (p: THREE.ShapePath) => /gold/i.test(fillOf(p));

  const bodyShapes = paths.filter((p) => !isGold(p)).flatMap((p) => p.toShapes());
  const counterShapes = paths.filter(isGold).flatMap((p) => p.toShapes());

  const bounds = new THREE.Box2(
    new THREE.Vector2(Infinity, Infinity),
    new THREE.Vector2(-Infinity, -Infinity),
  );
  const expand = (shape: THREE.Shape) => {
    for (const pt of shape.getPoints(6)) bounds.expandByPoint(pt);
    for (const hole of shape.holes) {
      for (const pt of hole.getPoints(6)) bounds.expandByPoint(pt);
    }
  };
  bodyShapes.forEach(expand);
  counterShapes.forEach(expand);

  const height = Math.max(1, bounds.max.y - bounds.min.y);
  const scale = MARK_HEIGHT / height;
  const cx = (bounds.min.x + bounds.max.x) / 2;
  const cy = (bounds.min.y + bounds.max.y) / 2;
  const toSvg = (world: number) => world / scale;

  const extrude = (shapes: THREE.Shape[], depthWorld: number): THREE.ExtrudeGeometry => {
    const depth = toSvg(depthWorld);
    const bevel = toSvg(BEVEL);
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      // The cost cap this scene was briefed with. Measured on the real asset:
      // 21.7ms for both extrusions, ~75k vertices total, against a 50ms budget.
      depth,
      curveSegments: 4,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelThickness: bevel,
      bevelSize: bevel,
    });
    geometry.translate(-cx, -cy, -depth / 2);
    geometry.scale(scale, scale, scale);
    geometry.rotateX(Math.PI);
    geometry.computeVertexNormals();
    return geometry;
  };

  return {
    body: extrude(bodyShapes, BODY_DEPTH),
    // A mark redrawn without its gold path is a legible mark, not a crash.
    counter: counterShapes.length > 0 ? extrude(counterShapes, COUNTER_DEPTH) : null,
    markWidth: (bounds.max.x - bounds.min.x) * scale,
  };
}

/**
 * One droplet population — the body's navy, or the counter-form's gold.
 *
 * Flat typed arrays rather than an array of objects, so a frame is a linear walk
 * over contiguous memory and nothing allocates. This is `LogoParticleField`'s
 * `Field` with a z added.
 */
interface Drops {
  count: number;
  /** Where each droplet sits on the solid mark, in the group's local space. */
  home: Float32Array;
  /** Where it drifts to when liquid, in world space. */
  roam: Float32Array;
  /** Live world position and velocity. */
  pos: Float32Array;
  vel: Float32Array;
  /** Per-droplet phase, so the bob is not in unison. */
  phase: Float32Array;
  /** Per-droplet size multiplier. */
  size: Float32Array;
}

/**
 * Sample droplet origins off the real extruded surface.
 *
 * An even index stride over the position attribute, not a random pick: the cloud
 * has to be identical on every mount, or reforming would land the mark somewhere
 * slightly different each time and the reduced-motion resting frame would not be a
 * frame at all. `ExtrudeGeometry` lays out its front cap, back cap and side walls
 * in sequence, so a constant stride draws from all three.
 */
function buildDrops(geometry: THREE.BufferGeometry, count: number, seedOffset: number): Drops {
  const pos = geometry.getAttribute("position");
  const total = pos.count;
  const stride = Math.max(1, Math.floor(total / count));

  const home = new Float32Array(count * 3);
  const roam = new Float32Array(count * 3);
  const live = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  const size = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const v = (i * stride) % total;
    const hx = pos.getX(v);
    const hy = pos.getY(v);
    const hz = pos.getZ(v);
    home[i * 3] = hx;
    home[i * 3 + 1] = hy;
    home[i * 3 + 2] = hz;

    // Scatter through the room as an annulus so the cloud has a middle to see
    // through rather than a solid ball where the mark used to be.
    const s = i + seedOffset;
    const angle = seeded(s) * Math.PI * 2;
    const radius = ROAM_INNER + seeded(s + 91) * (ROAM_OUTER - ROAM_INNER);
    roam[i * 3] = Math.cos(angle) * radius;
    roam[i * 3 + 1] = ROAM_Y_MIN + seeded(s + 7) * (ROAM_Y_MAX - ROAM_Y_MIN);
    roam[i * 3 + 2] = Math.sin(angle) * radius * ROAM_Z_SQUASH;

    live[i * 3] = hx;
    live[i * 3 + 1] = hy + MARK_CENTRE_Y;
    live[i * 3 + 2] = hz;
    phase[i] = seeded(s + 313) * Math.PI * 2;
    // Cubed, so most droplets are small and a few are conspicuously fat. A linear
    // spread gives a uniform gradient of sizes, which reads as a mistake rather
    // than as a distribution.
    const u = seeded(s + 1777);
    size[i] = DROP_SIZE_MIN + Math.pow(u, 3) * (DROP_SIZE_MAX - DROP_SIZE_MIN);
  }

  return { count, home, roam, pos: live, vel: new Float32Array(count * 3), phase, size };
}

/** The mark's two states, and the two one-way trips between them. */
type Phase = "solid" | "melting" | "liquid" | "reforming";

export default function MonolithScene({
  progressRef,
  pointerRef,
  settleRef,
  daySample,
  reduced,
  lowPower,
}: SceneProps) {
  const svg = useLoader(SVGLoader, LOGO_SRC);
  const advance = useThree((s) => s.advance);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  const groupRef = useRef<THREE.Group>(null);
  const counterRef = useRef<THREE.MeshStandardMaterial>(null);
  const bodyDropsRef = useRef<THREE.InstancedMesh>(null);
  const counterDropsRef = useRef<THREE.InstancedMesh>(null);

  /* ── The sky's live state ─────────────────────────────────────────────────
   * `daySample` is the room's own eased sample, stepped by the shared stage and
   * read here. This scene does NOT ease a copy of its own: two eases on the same
   * curve still drift the moment one misses a frame, and the mark's key light
   * disagreeing with the sky behind it is a bug nobody would think to look for. */
  const sample = daySample;
  const keyRef = useRef<THREE.PointLight>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);

  /**
   * The sky the probe is rendered against.
   *
   * `<Environment frames={1}>` renders its light probe once, and the glass
   * reflects that probe — so a room that changes without re-rendering it leaves
   * the mark lit by last night. Four phases means four probes across a whole
   * visit, keyed on the phase itself: no quantizing, no per-frame cube pass, and
   * the emitters below are a pure function of the same prop the key uses, so the
   * probe can never disagree with the values it was built from.
   *
   * The emitters keep frost as their base colour and take the day as a multiplier
   * on top. Tinting them with the sky itself made the night probe navy-on-navy,
   * which is not what shipped: at `sunIntensity` 0 every expression below
   * collapses to the exact literal it replaced (4.2 and 1.6 on frost), so the
   * night glass is untouched and only the lit phases are new.
   */
  const envSample = daySample; // use the current running sample instead of fixed phase

  /**
   * The key emitter's colour: frost carried a third of the way toward the sky.
   *
   * Frost outright was the shipped value, and the reason given for it was sound
   * — tinting the emitters with the sky made the *night* probe navy-on-navy, an
   * unlit room reflecting an unlit room. A partial mix keeps that from happening
   * (a third of the way to a near-black night sky is still frost-dominant) while
   * letting the three lit phases put their own colour in the glass, which is
   * what stops the mark reading as a white-studio object composited onto a
   * sunset. Memoised on the phase, so the probe's inputs change exactly when the
   * probe is rebuilt and never between.
   */
  const skyTint = useMemo(
    () => PALETTE.frost.clone().lerp(envSample.skyMid, 0.34),
    [envSample],
  );

  const { body, counter, markWidth } = useMemo(() => buildGeometries(svg.paths), [svg]);
  useEffect(
    () => () => {
      body.dispose();
      counter?.dispose();
    },
    [body, counter],
  );

  const drops = useMemo(
    () => ({
      bodyDrops: buildDrops(body, DROPS_BODY, 0),
      counterDrops: counter ? buildDrops(counter, DROPS_COUNTER, 5000) : null,
    }),
    [body, counter],
  );

  /** Segment counts went up with the radius. At 0.055 units a sphere was a few
   *  pixels and 8×6 was already generous; at 0.1 and up to 2.4× that, the silhouette
   *  is large enough for facets to show, and a faceted droplet is a gem. */
  const dropGeometry = useMemo(() => new THREE.SphereGeometry(DROP_RADIUS, 10, 8), []);
  useEffect(() => () => dropGeometry.dispose(), [dropGeometry]);


  /**
   * The state machine, in a ref.
   *
   * Phase changes are rare — a click, then a transition ending — but the *melt* is
   * read every frame by everything that moves, so it lives beside the rest of the
   * per-frame state rather than in React. Nothing here causes a render, which is
   * the property the whole hero rests on.
   */
  const phaseRef = useRef<{ phase: Phase; since: number }>({ phase: "solid", since: 0 });
  /** 0 = fully solid, 1 = fully liquid. Read by the glass, the droplets and the
   *  hit test, so all three can never disagree about how melted the mark is. */
  const meltRef = useRef(0);

  const scratch = useMemo(() => new THREE.Object3D(), []);
  const rayScratch = useMemo(() => new THREE.Raycaster(), []);
  const ndcScratch = useMemo(() => new THREE.Vector2(), []);
  const pointScratch = useMemo(() => new THREE.Vector3(), []);

  /** Only `solid` and `liquid` accept input. A click landing mid-transformation is
   *  ignored outright rather than queued — the mark is visibly in motion, and a
   *  toggle that reverses halfway is a toggle that never settles. */
  const begin = useCallback((next: Phase) => {
    const now = performance.now();
    phaseRef.current = { phase: next, since: now };
  }, []);

  const onMarkClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (phaseRef.current.phase !== "solid") return;
      e.stopPropagation();
      begin("melting");
    },
    [begin],
  );

  /**
   * Clicking back into the cloud.
   *
   * Not an R3F `onClick` on the droplet mesh: `InstancedMesh` raycasting resolves
   * to real triangle hits, and these droplets are 0.05 units across and actively
   * swimming away from the cursor — a target that moves as you aim at it. This
   * tests the click ray against every droplet centre and accepts anything within
   * `CLOUD_HIT_RADIUS`, so "click the cloud" means what a visitor would expect it
   * to mean. `distanceSqToPoint` keeps it to one pass and no square roots.
   */
  useEffect(() => {
    const el = gl.domElement;
    const onClick = (e: MouseEvent) => {
      if (phaseRef.current.phase !== "liquid") return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      ndcScratch.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      );
      rayScratch.setFromCamera(ndcScratch, camera);

      const fields = [drops.bodyDrops, drops.counterDrops].filter(Boolean) as Drops[];
      for (const f of fields) {
        for (let i = 0; i < f.count; i++) {
          pointScratch.set(f.pos[i * 3]!, f.pos[i * 3 + 1]!, f.pos[i * 3 + 2]!);
          const reach = CLOUD_HIT_RADIUS * f.size[i]!;
          if (rayScratch.ray.distanceSqToPoint(pointScratch) < reach * reach) {
            begin("reforming");
            return;
          }
        }
      }
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [gl, camera, drops, begin, ndcScratch, rayScratch, pointScratch]);

  /**
   * The scene's own resting frame.
   *
   * `PlaygroundCanvas`'s `RestingFrame` sits *outside* the `<Suspense>` that wraps
   * a scene, so its `advance()` calls fire while this file's chunk and its SVG are
   * still in flight. Under `prefers-reduced-motion` the loop is `"demand"` and
   * nothing schedules another frame, so the finished scene would never paint — a
   * blank canvas for exactly the visitor the resting frame exists to serve. Three
   * steps, not two: `<Environment>` needs a frame of its own to render its light
   * probe before the glass has anything to reflect.
   */
  useEffect(() => {
    const now = performance.now();
    advance(now);
    advance(now + 16);
    advance(now + 32);
  }, [advance, body]);

  /**
   * Step one droplet population.
   *
   * Three forces, exactly as `LogoParticleField.tsx` applies them in 2D: push away
   * from the cursor with a 1/d falloff, spring toward a target, damp. What changes
   * between phases is only *which* target — the mark, or the room.
   */
  const stepDrops = useCallback(
    (
      f: Drops,
      mesh: THREE.InstancedMesh | null,
      melt: number,
      time: number,
      p: PointerPlane | null,
      yawCos: number,
      yawSin: number,
      settle: number,
    ) => {
      if (!mesh) return;
      const repelling = melt > 0.05 && p?.active === true && !reduced;
      const cx = p?.x ?? 0;
      const cz = p?.z ?? 0;
      // The cursor is a ground-plane point; give it the mark's own height so the
      // cloud parts around a vertical line through the room rather than only
      // around a spot on the floor.
      const cy = MARK_CENTRE_Y;

      for (let i = 0; i < f.count; i++) {
        const j = i * 3;

        // Home follows the mark's bounded yaw, so a reform lands the droplets on
        // the letterform as it is actually facing, not as it faced at rest.
        const hx = f.home[j]!;
        const hy = f.home[j + 1]!;
        const hz = f.home[j + 2]!;
        const homeX = hx * yawCos + hz * yawSin;
        const homeZ = -hx * yawSin + hz * yawCos;
        const homeY = hy + MARK_CENTRE_Y;

        // A slow orbit plus a bob, so a resting cloud still breathes. Both are
        // pure functions of time and the droplet's own phase — nothing integrates,
        // so there is no drift to accumulate and no state to reset.
        const ph = f.phase[i]!;
        const roamX = f.roam[j]! * Math.cos(time * 0.06) - f.roam[j + 2]! * Math.sin(time * 0.06);
        const roamZ = f.roam[j]! * Math.sin(time * 0.06) + f.roam[j + 2]! * Math.cos(time * 0.06);
        const roamY = f.roam[j + 1]! + Math.sin(time * 0.5 + ph) * 0.22;

        const targetX = homeX + (roamX - homeX) * melt;
        const targetY = homeY + (roamY - homeY) * melt;
        const targetZ = homeZ + (roamZ - homeZ) * melt;

        // Slack while liquid, firm while gathering: the same spring doing both
        // would either make the cloud stiff or make the reform mushy.
        const spring = SPRING_ROAM + (SPRING_HOME - SPRING_ROAM) * (1 - melt);

        let ax = 0;
        let ay = 0;
        let az = 0;
        if (repelling) {
          const dx = f.pos[j]! - cx;
          const dy = f.pos[j + 1]! - cy;
          const dz = f.pos[j + 2]! - cz;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < REPEL_RADIUS * REPEL_RADIUS && d2 > 0.0001) {
            // 1/d falloff computed from the squared distance, so the only sqrt in
            // the loop is the one genuinely needed.
            const d = Math.sqrt(d2);
            const force = ((REPEL_RADIUS - d) / REPEL_RADIUS) * (REPEL_STRENGTH / d) * melt;
            ax = dx * force;
            ay = dy * force;
            az = dz * force;
          }
        }

        f.vel[j] = (f.vel[j]! + ax + (targetX - f.pos[j]!) * spring) * DAMPING;
        f.vel[j + 1] = (f.vel[j + 1]! + ay + (targetY - f.pos[j + 1]!) * spring) * DAMPING;
        f.vel[j + 2] = (f.vel[j + 2]! + az + (targetZ - f.pos[j + 2]!) * spring) * DAMPING;
        f.pos[j] = f.pos[j]! + f.vel[j]!;
        // The floor a stray droplet cannot fall through is the deck now, not the
        // ground plane — `DECK_Y` and not `GROUND_Y`. Same one-line clamp, but it
        // is the difference between a drop settling into the cloud tops and one
        // stopping in mid-air on a surface that is no longer drawn.
        f.pos[j + 1] = Math.max(DECK_Y + DROP_RADIUS, f.pos[j + 1]! + f.vel[j + 1]!);
        f.pos[j + 2] = f.pos[j + 2]! + f.vel[j + 2]!;

        scratch.position.set(f.pos[j]!, f.pos[j + 1]!, f.pos[j + 2]!);
        // Droplets are nothing while solid and full size once loose, so the mark
        // does not wear a skin of beads before it lets go.
        scratch.scale.setScalar(f.size[i]! * Math.min(1, melt * 2.2) * settle);
        scratch.updateMatrix();
        mesh.setMatrixAt(i, scratch.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = melt > 0.01;
    },
    [reduced, scratch],
  );

  useFrame((state, delta) => {
    const settle = settleRef.current ?? 1;
    const progress = progressRef.current ?? 0;
    const time = state.clock.elapsedTime;
    const now = performance.now();

    // ── The sky ────────────────────────────────────────────────────────────
    const key = keyRef.current;
    if (key) {
      key.color.copy(sample.keyLight);
      key.intensity = sample.keyIntensity * settle;
    }

    const sunLight = sunLightRef.current;
    if (sunLight) {
      sunLight.color.copy(sample.sunLight);
      sunLight.intensity = sample.sunIntensity * settle;
      // Every preset puts the body above the horizon, but the ease travels
      // between two of them and a light that dips under the floor on the way
      // lights the room from below, which reads as a mistake rather than as dusk.
      sunLight.position
        .copy(sample.glowDirection)
        .multiplyScalar(SUN_DISTANCE)
        .setY(Math.max(sample.glowDirection.y * SUN_DISTANCE, 0.5));
    }

    // ── Advance the state machine ──────────────────────────────────────────
    const st = phaseRef.current;
    if (st.phase === "melting") {
      const t = Math.min(1, (now - st.since) / MELT_MS);
      // Ease-out: the mark lets go fast and the last droplets drift.
      meltRef.current = 1 - Math.pow(1 - t, 3);
      if (t >= 1) phaseRef.current = { phase: "liquid", since: now };
    } else if (st.phase === "reforming") {
      const t = Math.min(1, (now - st.since) / REFORM_MS);
      // Ease-in-out: the cloud hesitates, then commits.
      meltRef.current = 1 - (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      if (t >= 1) phaseRef.current = { phase: "solid", since: now };
    } else {
      meltRef.current = st.phase === "liquid" ? 1 : 0;
    }
    const melt = meltRef.current;

    // ── Interactive Rim Light ───────────────────────────────────────────────
    // Dual-purpose: in solid mode it sweeps gold highlights across the mark's
    // bevels; in liquid/particle mode it broadens into an ambient glow that
    // bathes the cloud. The light never vanishes — it cross-fades between the
    // two behaviours so the transition reads as the mark's own light diffusing
    // into its matter rather than switching off.
    const rim = rimLightRef.current;
    if (rim) {
      const px = state.pointer.x;
      const py = state.pointer.y;
      const dist = Math.sqrt(px * px + py * py);
      const distClamped = Math.min(1.0, dist);

      // Position: tight tracking in solid, wider orbit in liquid
      const solidSpread = 4.5;
      const liquidSpread = 6.0;
      const spread = solidSpread + (liquidSpread - solidSpread) * melt;
      const targetX = px * spread;
      const targetY = MARK_CENTRE_Y + py * (3.5 + melt * 1.5);
      const targetZ = 3.0 + melt * 2.0;

      // Smooth damp toward target — no snapping
      rim.position.x = THREE.MathUtils.damp(rim.position.x, targetX, 5, delta);
      rim.position.y = THREE.MathUtils.damp(rim.position.y, targetY, 5, delta);
      rim.position.z = THREE.MathUtils.damp(rim.position.z, targetZ, 5, delta);

      // Colour: gold when close, frost when far — in liquid, tint toward
      // a cooler steel to complement the particle palette
      const warmT = distClamped * (1 + melt * 0.3);
      rim.color.copy(PALETTE.gold).lerp(PALETTE.frost, Math.min(1.0, warmT));

      // Intensity: brighter at centre, never zero — in liquid the base is
      // higher so the cloud stays lit, but proximity still matters
      const solidBase = 0.8;
      const liquidBase = 1.8;
      const base = solidBase + (liquidBase - solidBase) * melt;
      const peak = 3.5 - melt * 1.0;
      const rimIntensity = Math.max(base, peak * (1.0 - distClamped));
      rim.intensity = rimIntensity * settle;

      // Reach: wider in liquid so it covers the whole cloud
      rim.distance = 8 + melt * 6;
    }

    // ── The mark ───────────────────────────────────────────────────────────
    const group = groupRef.current;
    let yaw = 0;
    if (group) {
      // Bounded and scroll-driven, centred on zero at mid-pin.
      yaw = (progress - 0.5) * 2 * MAX_YAW;

      // 3D Gyroscopic Cursor Tilt — additive over scroll yaw, damped to
      // avoid snapping. Tilt fades out as the mark melts (a cloud of
      // droplets does not rotate as a rigid body).
      const tiltStrength = 1 - melt;
      const targetRotX = -state.pointer.y * 0.20 * tiltStrength;
      const targetRotY = yaw + state.pointer.x * 0.25 * tiltStrength;

      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, targetRotX, 4, delta);
      group.rotation.y = THREE.MathUtils.damp(group.rotation.y, targetRotY, 4, delta);
      group.position.y = MARK_CENTRE_Y;
      // The solid collapses as the liquid appears. One number drives both, so
      // there is never a frame with two marks or none.
      const solid = (1 - melt) * (0.9 + settle * 0.1);
      group.scale.setScalar(Math.max(0.0001, solid));
      group.visible = solid > 0.01;

      /**
       * Publish the mark's screen box for `SuperHeroSequence.tsx`'s DOM
       * chrome — see `markAnchor.ts`. Invisible (fully liquid, or the
       * entrance settle has not started) publishes nothing, matching the
       * legacy renderer's own P-exit handling: the motto is gone by then
       * anyway (`--hp-panel` fades it out well before this ever fires), so
       * this is belt-and-braces, not load-bearing.
       *
       * The mark only ever moves in world Y (`position.y`) and yaws around
       * its own vertical axis (`rotation.y`) — a local point on that axis
       * (`x = 0, z = 0`) is unmoved by the rotation, so the bottom point
       * needs no matrix math, just the group's own position and scale. The
       * width estimate approximates the mark's width axis as world-X
       * regardless of yaw (`MAX_YAW` is small, ±12°) — an approximation, not
       * a rasterised bounding box, exactly as `heroPlaneRenderer.ts`'s
       * `getLogoScreenBox` is on the legacy side.
       */
      if (group.visible) {
        const halfW = (markWidth / 2) * group.scale.x;
        ANCHOR_BOTTOM.set(group.position.x, group.position.y - (MARK_HEIGHT / 2) * group.scale.y, group.position.z);
        ANCHOR_LEFT.set(group.position.x - halfW, ANCHOR_BOTTOM.y, group.position.z);
        ANCHOR_RIGHT.set(group.position.x + halfW, ANCHOR_BOTTOM.y, group.position.z);
        ANCHOR_BOTTOM.project(state.camera);
        ANCHOR_LEFT.project(state.camera);
        ANCHOR_RIGHT.project(state.camera);
        setMarkAnchorBox({
          x: ANCHOR_BOTTOM.x * 0.5 + 0.5,
          y: 1 - (ANCHOR_BOTTOM.y * 0.5 + 0.5),
          w: Math.abs(ANCHOR_RIGHT.x - ANCHOR_LEFT.x) * 0.5,
        });
      } else {
        setMarkAnchorBox(null);
      }
    } else {
      setMarkAnchorBox(null);
    }

    const gold = counterRef.current;
    if (gold) {
      // The frame's only emissive surface, getting more certain of itself as the
      // pin runs — and softer than it was (0.34 → 0.80 before). Brand gold at
      // full emission was the loudest thing on screen against the old black room;
      // against the muted skies it only has to be *warm*, not hot, and glowing
      // metal that out-values the daylight around it reads as a bug.
      gold.emissiveIntensity = (0.2 + progress * 0.26) * settle;
    }

    // ── The liquid ─────────────────────────────────────────────────────────
    const p = pointerRef.current;
    const yawCos = Math.cos(yaw);
    const yawSin = Math.sin(yaw);
    stepDrops(drops.bodyDrops, bodyDropsRef.current, melt, time, p, yawCos, yawSin, settle);
    if (drops.counterDrops) {
      stepDrops(drops.counterDrops, counterDropsRef.current, melt, time, p, yawCos, yawSin, settle);
    }
  });

  return (
    <>
      {/* The parked three-quarter key. Its position never changes; its colour and
          strength are the day cycle's — see the `KEY_POSITION` docblock. */}
      <pointLight
        ref={keyRef}
        position={KEY_POSITION as unknown as [number, number, number]}
        intensity={0}
        distance={KEY_DISTANCE}
        color={PALETTE.frost}
      />

      {/* Interactive Fresnel Rim Light */}
      <pointLight
        ref={rimLightRef}
        position={[0, MARK_CENTRE_Y, 3]}
        intensity={0}
        distance={8}
        decay={2}
        color={PALETTE.gold}
      />

      {/* The celestial light: whatever is above the horizon, aimed at the mark.
          Directional rather than another point light, because the sun is meant to
          read as far away — a point light at the disc's own distance would fall
          off across the floor and give the room a hot spot under the sun. Its
          default target is the world origin, which is under the mark's centre.
          Intensity is 0 at night, so at midnight this light does not exist. */}
      <directionalLight ref={sunLightRef} intensity={0} color={PALETTE.frost} />

      {/*
        Four emitters standing in for a room the scene has no walls for — this is
        what gives the bevels an edge to catch. Authored, not a preset: a `preset`
        prop fetches an HDR from a CDN, which is a network request and a CSP
        surface this hero does not need. `frames={1}` renders the probe once; the
        emitters never move, so a per-frame re-render would buy an identical
        texture at the cost of a full cube pass every frame.

        All four now aim at `MARK_CENTRE_Y` rather than the 1.2 they were typed
        against — the mark moved up when it stopped standing on a floor, and a
        probe still lighting the height it used to be at is a probe lighting
        nothing.
      */}
      <Environment key="twilight" frames={1} resolution={128} environmentIntensity={1.05}>
        <Lightformer
          form="rect"
          intensity={4.2 * (1 + envSample.sunIntensity * 0.35)}
          color={skyTint}
          scale={[14, 7, 1]}
          position={[0, MARK_CENTRE_Y + 3.3, -6]}
          target={[0, MARK_CENTRE_Y, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.6 * (1 + envSample.sunIntensity * 0.25)}
          color={PALETTE.steel}
          scale={[1, 6, 1]}
          position={[-5.5, MARK_CENTRE_Y - 0.6, 1.5]}
          target={[0, MARK_CENTRE_Y, 0]}
        />
        <Lightformer
          form="circle"
          intensity={1.2}
          color={PALETTE.gold}
          scale={1.8}
          position={[4.2, MARK_CENTRE_Y - 0.2, 2.6]}
          target={[0, MARK_CENTRE_Y, 0]}
        />
        {/*
          The deck, as a reflector.

          The one emitter that is new, and the one that makes the glass read as
          being *in the air* rather than on a stand. Standing over a lit cloud
          sea, the largest source in the scene is underneath you — a hemisphere
          light already puts that on the diffuse response (`PlaygroundCanvas`),
          but transmissive glass does not care about lights, it cares about the
          probe. Without this the mark reflects a room with nothing below its
          waist, which is exactly how a studio render of a floating object looks
          and exactly what this scene is trying not to be.

          Wide and close, because that is what a deck is; `envSample`'s own
          bounce term drives it, so at night it is nearly off.
        */}
        <Lightformer
          form="rect"
          intensity={2.6 * envSample.bounceIntensity}
          color={envSample.deckLit}
          scale={[16, 16, 1]}
          position={[0, DECK_Y, 0]}
          target={[0, MARK_CENTRE_Y, 0]}
        />
      </Environment>

      <group ref={groupRef}>
        {/*
          The click target is the mark's *silhouette*, not its geometry.

          A letterform is mostly holes. Aiming at the visual centre of the P puts
          the ray straight through the counter's opening and out the back of the
          scene — measured: a click at the middle of the bowl raycast to nothing
          while a click 50px right, on a stroke, registered. Asking a visitor to
          hit a stroke is asking them to notice which parts of a logo are solid.

          So a plane spanning the mark takes the click instead. `colorWrite` and
          `depthWrite` are off, so it contributes no pixels and occludes nothing,
          but it is still `visible` — three's raycaster skips invisible objects,
          and an invisible hit proxy is not a hit proxy. It lives inside the group,
          so it inherits the scale that collapses to zero as the mark melts: while
          liquid, there is nothing here to click, which is exactly right.
        */}
        <mesh onClick={onMarkClick} renderOrder={-1}>
          <planeGeometry args={[markWidth * 1.04, MARK_HEIGHT * 1.04]} />
          <meshBasicMaterial colorWrite={false} depthWrite={false} />
        </mesh>

        <mesh geometry={body} onClick={onMarkClick}>
          {lowPower ? (
            /* The cheap path. `MeshTransmissionMaterial` renders the scene into
               its own buffer every frame to refract it; `meshPhysicalMaterial`
               reads the environment probe alone. The design survives it: the gold
               is still visible through the body, just without the displacement. */
            <meshPhysicalMaterial
              color={PALETTE.frost}
              transmission={0.94}
              thickness={0.55}
              attenuationColor={PALETTE.steel}
              attenuationDistance={0.9}
              roughness={0.1}
              ior={1.5}
              metalness={0}
              envMapIntensity={1.6}
            />
          ) : (
            <MeshTransmissionMaterial
              /*
               * `color` is the body's own diffuse and it is nearly white on
               * purpose. The navy is not painted on — it is *accumulated*:
               * `attenuationColor` tints light by how far it has travelled through
               * the solid, so the thin bevels stay bright and the deep middle goes
               * brand navy on its own. Painting `navyField` into `color` instead
               * produced a black plastic blob, because a dark diffuse under a
               * deliberately low ambient has nothing to be dark *against*.
               *
               * `steel` and not `navyField` as the tint, for the same reason one
               * step further in: Beer-Lambert raises the tint to the power of
               * (thickness / distance), and a tint that starts at #0A2A66 reaches
               * black through any real thickness.
               *
               * No `background` override either. Left alone the transmission
               * sampler refracts the actual room — the dot field, the gold inside
               * — which is the premise of the scene.
               */
              color={PALETTE.frost}
              attenuationColor={PALETTE.steel}
              attenuationDistance={0.9}
              samples={8}
              resolution={384}
              backside
              backsideThickness={0.28}
              thickness={0.6}
              transmission={1}
              roughness={0.045}
              ior={1.52}
              chromaticAberration={0.07}
              distortion={0.1}
              distortionScale={0.28}
              temporalDistortion={0}
              anisotropicBlur={0.08}
              envMapIntensity={1.8}
            />
          )}
        </mesh>

        {counter && (
          <mesh geometry={counter} onClick={onMarkClick}>
            {/* `goldLight` as the emissive, brand `gold` as the body. Emission
                stacks on top of the diffuse, so emitting the same saturated
                value the surface already is drives the red channel to clip and
                the counter-form goes orange at the edges. The paler token
                keeps the glow reading as light rather than as more paint. */}
            <meshStandardMaterial
              ref={counterRef}
              color={PALETTE.gold}
              emissive={PALETTE.goldLight}
              emissiveIntensity={0.2}
              roughness={0.4}
              metalness={0.14}
            />
          </mesh>
        )}
      </group>

      {/* The mark's own matter, loose. Two populations rather than one mesh with
          per-instance colour: the gold has to stay emissive and the navy has to
          stay wet, and that is a material difference, not a colour one. */}
      <instancedMesh
        ref={bodyDropsRef}
        args={[dropGeometry, undefined, drops.bodyDrops.count]}
        frustumCulled={false}
        visible={false}
      >
        {/*
          Wet, not matte. The first liquid pass used a plain standard material at
          roughness 0.12 and the cloud read as confetti — the size spread fixes
          half of that and the specular fixes the rest. `clearcoat` is the cheap
          way to get the tight highlight a droplet's surface tension gives it: a
          second specular lobe over the base, no render target, no transmission
          pass. That mattered at 500 instances and still earns its place at 120:
          it is the highlight, not the size, that says "wet", and the droplets are
          now small enough that the highlight is most of what you see of one.
          A high `envMapIntensity` lets the
          authored `<Environment>` be what the droplets reflect, so the cloud is
          lit by the same room the glass is.
        */}
        <meshPhysicalMaterial
          color={PALETTE.steel}
          roughness={0.1}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.05}
          // Softened from 2.2. At that strength every droplet carried a hard
          // white catchlight, and a hundred and twenty hard catchlights read as
          // glitter rather than as water.
          envMapIntensity={1.6}
        />
      </instancedMesh>
      {drops.counterDrops && (
        <instancedMesh
          ref={counterDropsRef}
          args={[dropGeometry, undefined, drops.counterDrops.count]}
          frustumCulled={false}
          visible={false}
        >
          <meshPhysicalMaterial
            color={PALETTE.goldLight}
            emissive={PALETTE.goldLight}
            // Lower than the counter-form's own glow. These are loose droplets in
            // a room that is now often lit, and gold that emits as hard as a
            // 2.5-unit slab does turns a cloud of them into fairy lights.
            emissiveIntensity={0.16}
            roughness={0.12}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.06}
            envMapIntensity={1.5}
          />
        </instancedMesh>
      )}
    </>
  );
}
