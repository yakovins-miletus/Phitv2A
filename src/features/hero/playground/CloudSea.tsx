/**
 * The deck the mark floats over.
 *
 * This replaces `MonolithScene`'s water — ~1,500 instanced discs on a grid,
 * lifted by a radial wake and a click shock, with a `MeshStandardMaterial` that
 * took the sky's colour. Three things were wrong with keeping that and calling
 * it cloud:
 *
 *  1. **Water is a height field; cloud is a volume.** A displaced surface reads
 *     as liquid no matter what colour it is, because the thing your eye reads as
 *     "water" is a continuous membrane with a wave travelling along it. Vapour
 *     has no membrane. It has lit faces, shoulders that turn away, and gaps.
 *  2. **A grid has a pitch, and a pitch is a scale.** The dot field announced
 *     exactly how big the floor was, which is useful for a room and fatal for a
 *     deck that is supposed to run to the horizon.
 *  3. **It cost more than it was worth.** Every frame walked 1,500 instances in
 *     JS and wrote 1,500 matrices. What replaces it is one plane and one
 *     fragment shader over the lower third of the frame.
 *
 * So: one horizontal plane at `DECK_Y`, shaded rather than displaced. Domain
 * warped fBm gives the billows their lobed silhouette, the density is resampled
 * one step toward the light to find the faces the sun is on, and the whole thing
 * dissolves into the sky's own horizon colour with distance — which is the trick
 * that makes a finite plane read as an infinite deck. There is no edge to find
 * because by the time the geometry stops, every pixel of it is already exactly
 * the colour the dome behind it is painting.
 *
 * **The cursor does not touch it.** It used to: the pointer rotated the noise
 * domain around itself so the cloud turned, and a click pushed the domain
 * outward so the deck billowed open. Both are gone. A deck that reacts to the
 * cursor puts a second moving thing in a frame whose whole composition is one
 * mark suspended in still air, and it invited a visitor to play with the floor
 * rather than look at the subject. The drift below is the only motion left, and
 * it is slow enough to read as weather rather than as a response.
 *
 * NO RAW HEX: every colour arrives as a uniform, already a `THREE.Color` from
 * the day-cycle sample. The GLSL below contains only numbers.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { DECK_FADE_END, DECK_FADE_START, DECK_HALF, DECK_Y } from "./constants";
import type { DayCycleSample } from "./dayCycle";

/**
 * How tall the billows actually stand, and how finely the plane is cut.
 *
 * The deck is displaced GEOMETRY, not a texture on a flat quad, and that is the
 * difference between clouds and water. The eye sits 1.5 units above this
 * surface, so every billow is seen nearly edge-on — and at that angle a painted
 * billow has no silhouette, nothing occluding anything behind it, and no profile
 * against the sky at the horizon. It reads as a texture on a mirror, which is to
 * say: a sea. Parallax in the fragment shader helps and is not enough; only real
 * relief gives real silhouettes.
 *
 * `DECK_SEGMENTS` at 200 puts a vertex roughly every 1.2 world units across the
 * whole 240-unit plane — finer than a billow, so the shape is resolved — for
 * 40k vertices, which is nothing next to what the old dot field was doing on the
 * CPU every frame.
 */
const DECK_SEGMENTS = 200;
/**
 * How tall a billow stands, in world units of peak-to-trough.
 *
 * 3.2, up from 1.35, and the reason is the sun rather than the silhouette. At
 * dusk the light arrives almost horizontally (`glowDirection.y` is 0.05), so a
 * surface whose normals all point within a few degrees of straight up returns
 * an `N·L` of about 0.05 everywhere — the crest colour never appears and the
 * deck renders as one flat mauve plain. Steep billows turn real faces toward a
 * low sun, which is both what lights the crests and what makes the deck read as
 * something with a near side and a far side.
 *
 * It is also, at 3.2 against a mark floating 1.8 above the deck's mean, the
 * number that decides whether a tall billow can reach up and touch the mark.
 * Peaks reach ~1.7 above the mean, which clears it.
 */
const DECK_RELIEF = 3.2;
/**
 * The vertex shader owns the field, and everything else reads its result.
 *
 * This is the arrangement the deck arrived at after the flat-plane version, and
 * the split matters. The noise is evaluated ONCE, per vertex, and the height it
 * produces is (a) the actual displacement, (b) the varying the fragment stage
 * shades from, and (c) — via screen-space derivatives — the surface normal. So
 * the fragment stage evaluates no noise at all: it is a handful of mixes over
 * two varyings, which is why a deck with real geometry costs less per pixel than
 * the flat one it replaced did.
 *
 * The pointer's two disturbances live here too, for the same reason. Warping the
 * domain in the fragment stage only ever moved a pattern around on a rigid
 * surface; warping it here moves the vapour itself, so a stir visibly turns the
 * billows and a click genuinely opens a hole in the deck.
 *
 * Three octaves, not four: the fourth sits below the vertex spacing, so it would
 * cost a full octave per vertex to displace by less than the mesh can represent.
 */
const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uRelief;
  varying vec3 vWorldPosition;
  varying float vHeight;

  // Value noise. A hash rather than a texture: one fewer asset, one fewer
  // request, and the field has to be stable across reloads so a screenshot of
  // this deck is reproducible — which a hash is and a random seed is not.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    // Smoothstep the cell interpolant, not the value: linear interpolation
    // between hashes leaves visible grid creases along the cell edges.
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p *= 2.17;   // Not 2: an integer lacunarity lines the octaves' own grids
      a *= 0.5;    // up and the sum shows a repeating diagonal.
    }
    return v;
  }

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec2 p = world.xz;

    // Drift. Two rates, so the deck never repeats its own motion: the coarse
    // shapes slide one way and the detail slides slower across them.
    vec2 q = p + vec2(uTime * 0.012, uTime * -0.007);

    // Domain warp. One octave of the field displacing the next is what turns
    // round blobs into the lobed, cauliflower silhouette a cumulus deck has.
    // Sampled COARSE and pushed hard: a high-frequency warp shreds the billows
    // into filaments, which is what made the first pass read as a choppy sea.
    vec2 warp = vec2(fbm(q * 0.16 + 11.3), fbm(q * 0.16 + 41.7)) - 0.5;
    q += warp * 2.4;

    // 0.065: a single billow is ~15 world units across. The first pass ran this
    // at 0.34, packing a dozen cycles into the visible deck — and a field whose
    // features are small compared to the perspective foreshortening comes out as
    // horizontal streaks, which is exactly the "this is water" tell.
    float h = fbm(q * 0.065);
    vHeight = h;

    // Centred on the field's own mean, so the deck rises AND dips around its
    // nominal altitude rather than only ever climbing away from it.
    world.y += (h - 0.47) * uRelief;

    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uLit;
  uniform vec3 uMid;
  uniform vec3 uDeep;
  uniform vec3 uHorizon;
  uniform vec3 uGlow;
  uniform vec3 uSunDirection;
  uniform float uGlowStrength;
  uniform float uGlowFocus;
  uniform vec3 uGlowCore;
  uniform float uCoreStrength;
  uniform float uCoreFocus;
  uniform float uCover;
  uniform float uFadeStart;
  uniform float uFadeEnd;
  varying vec3 vWorldPosition;
  varying float vHeight;

  void main() {
    vec3 view = vWorldPosition - cameraPosition;
    float dist = length(view);
    vec3 dir = normalize(view);

    /* ── The normal, for free ─────────────────────────────────────────────
     * The surface is real geometry now, so its normal is the cross product of
     * the world position's own screen-space derivatives. No second noise
     * evaluation, no epsilon to tune, and — unlike a gradient taken from a
     * height field — it is exactly the normal of the triangle actually being
     * drawn, so the shading and the silhouette can never disagree.
     */
    vec3 n = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
    // The plane's winding puts this either way up depending on the triangle;
    // a cloud deck is lit from above, so take the upward-facing one.
    n *= sign(n.y);
    float ndl = max(dot(n, uSunDirection), 0.0);

    /* Coverage, softly thresholded, and CENTRED on the threshold rather than
     * starting at it. This three-octave fbm sums 0.5 + 0.25 + 0.125, so its
     * output is bounded by 0.875 and clusters around 0.44. A window that opened
     * *at* uCover and ran upward from there sat almost entirely above the
     * distribution: nearly every sample failed it and the deck rendered as a
     * flat wash with no billows in it. Straddling the threshold puts the
     * interesting part of the field inside the ramp, which is what "cover" was
     * always supposed to mean. */
    float cover = smoothstep(uCover - 0.16, uCover + 0.16, vHeight);
    cover = clamp(cover, 0.0, 1.0);

    /* Three values, walked in order. "uDeep" is the valley between billows,
     * "uMid" the shoulder turning away, "uLit" the crest — and they differ in
     * HUE, not just brightness, because a cloud's shadow is lit by the sky and
     * therefore goes cool rather than merely dark. Two colours is what a
     * rendered cloud looks like; the third is what makes it read as volume.
     *
     * The crest is gated on BOTH the height and the facing: a tall face turned
     * away from the sun stays in the shoulder colour, which is the terminator,
     * and the terminator is most of what the eye reads as roundness. */
    vec3 body = mix(uDeep, uMid, smoothstep(0.0, 0.6, cover));
    // The N·L window is narrow and low because the sun is: at dusk it sits 3°
    // above the horizon, so even a steeply turned cloud face returns a fraction.
    // A 0..1 ramp here would leave the deck permanently in its shadow colour.
    body = mix(body, uLit, smoothstep(0.03, 0.30, ndl) * smoothstep(0.1, 0.7, cover));

    // Aerial perspective, and the reason there is no visible plane edge. By
    // uFadeEnd the surface IS the horizon colour the dome is painting behind it,
    // so where the geometry actually stops is invisible — which is what turns a
    // 240-unit quad into a deck that runs to the horizon.
    float aerial = smoothstep(uFadeStart, uFadeEnd, dist);
    vec3 color = mix(body, uHorizon, aerial);

    /* ── The glow, applied exactly as the dome applies it ──────────────────
     * AFTER the aerial mix, and with the dome's own formula and uniforms rather
     * than an approximation of them. Both details are load-bearing. An earlier
     * pass had the view vector backwards (so the term peaked looking AWAY from
     * the sun) and added the result to the cloud body BEFORE the fade; the
     * consequence was a hard horizontal seam along the horizon, where the deck
     * converged on a bare uHorizon while the dome immediately above it had a
     * lobe added on top. Matching the maths makes the two the same value where
     * they meet, and the join stops existing.
     */
    float lobe = pow(max(dot(dir, uSunDirection), 0.0), uGlowFocus);
    color += uGlow * min(lobe, 0.9) * uGlowStrength;
    float core = pow(max(dot(dir, uSunDirection), 0.0), uCoreFocus);
    color += uGlowCore * core * uCoreStrength;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export interface CloudSeaHandle {
  apply: (sample: Readonly<DayCycleSample>) => void;
}

export function CloudSea({
  handleRef,
  reduced,
}: {
  /** Filled with the colour/uniform sink the stage's own `useFrame` drives, for
   *  the same reason `SkyDome` takes one: two frame callbacks reading the eased
   *  sample in an undefined order is how a deck ends up a frame behind its sky. */
  handleRef: React.RefObject<CloudSeaHandle | null>;
  reduced: boolean;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(
      DECK_HALF * 2,
      DECK_HALF * 2,
      DECK_SEGMENTS,
      DECK_SEGMENTS,
    );
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        // Opaque, and it owns its own distance falloff — scene fog on top of the
        // aerial term would fade it twice and toward a different colour.
        fog: false,
        toneMapped: false,
        uniforms: {
          uLit: { value: new THREE.Color() },
          uMid: { value: new THREE.Color() },
          uDeep: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uGlow: { value: new THREE.Color() },
          uSunDirection: { value: new THREE.Vector3(0, 1, 0) },
          uGlowStrength: { value: 0 },
          uGlowFocus: { value: 10 },
          uGlowCore: { value: new THREE.Color() },
          uCoreStrength: { value: 0 },
          uCoreFocus: { value: 300 },
          uCover: { value: 0.5 },
          uTime: { value: 0 },
          uRelief: { value: DECK_RELIEF },
          uFadeStart: { value: DECK_FADE_START },
          uFadeEnd: { value: DECK_FADE_END },
        },
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  /**
   * The uniforms, reached through a ref rather than closed over directly.
   *
   * `useFrame` below writes them every frame, and the React Compiler's lint
   * rejects a frame callback that mutates a `useMemo` local — a fair rule, since
   * a memo can be recomputed and the closure would then be writing to a dead
   * object. A ref is the sanctioned escape: it is explicitly the thing that
   * survives renders, and it is the same shape `SkyDome` already uses to hand
   * its own uniforms out.
   */
  const uniformsRef = useRef<THREE.ShaderMaterial["uniforms"] | null>(null);

  useEffect(() => {
    const u = material.uniforms;
    uniformsRef.current = u;
    handleRef.current = {
      apply: (sample) => {
        (u.uLit!.value as THREE.Color).copy(sample.deckLit);
        (u.uMid!.value as THREE.Color).copy(sample.deckMid);
        (u.uDeep!.value as THREE.Color).copy(sample.deckDeep);
        (u.uHorizon!.value as THREE.Color).copy(sample.skyHorizon);
        (u.uGlow!.value as THREE.Color).copy(sample.glow);
        (u.uSunDirection!.value as THREE.Vector3).copy(sample.glowDirection);
        u.uGlowStrength!.value = sample.glowStrength;
        u.uGlowFocus!.value = sample.glowFocus;
        (u.uGlowCore!.value as THREE.Color).copy(sample.glowCore);
        u.uCoreStrength!.value = sample.coreStrength;
        u.uCoreFocus!.value = sample.coreFocus;
        u.uCover!.value = sample.cloudCover;
      },
    };
    return () => {
      handleRef.current = null;
      uniformsRef.current = null;
    };
  }, [material, handleRef]);

  useFrame((state) => {
    const u = uniformsRef.current;
    if (!u) return;

    // Under reduced motion the deck is a photograph: the drift stops and the
    // field holds wherever it is. The designed resting frame, matching how the
    // water it replaces treated the same flag.
    //
    // `uTime` is the only thing this callback still writes — the cursor stir
    // and the click billow are both gone (see the module comment), so there is
    // no pointer state left to track here.
    if (reduced) return;

    u.uTime!.value = state.clock.elapsedTime;
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, DECK_Y, 0]}
      frustumCulled={false}
    />
  );
}
