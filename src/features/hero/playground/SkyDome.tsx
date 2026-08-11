/**
 * The room's sky.
 *
 * This replaces `scene.background`, which was one flat colour in every direction
 * — and a single colour is exactly what a sky is not. A flat fill reads as a card
 * the mark is pasted onto; a gradient reads as air with a distance to it, which
 * is the whole difference between "dark background" and "night".
 *
 * Five bands, a glow with a core, and a cloud deck, all from `dayCycle.ts`:
 *
 *   - **zenith → upper → mid → lower → horizon**, bottom-lightest, which is the
 *     shape every real sky has. Light scatters through more air toward the
 *     horizon, so that is where a sky is palest and warmest at any hour, and
 *     where a *night* sky carries whatever the ground is throwing back at it.
 *     Five and not three because each `mix` between two stops cuts straight
 *     across the colour wheel rather than travelling around it — so a long
 *     segment between distant hues is a guaranteed grey middle, and the middle
 *     is most of the frame. See the segment block in `main`.
 *   - **a scattering lobe** around whichever body is up, **and a core inside
 *     it**. This is the only trace of the sun or the moon in the frame: there is
 *     no disc, by design. A drawn ball reads as an object stuck to the backdrop
 *     and competes with the mark, which is the one thing this scene is about. A
 *     quarter of the sky being brighter says "the sun is over there" without
 *     putting anything on screen to look at, and the light in the room already
 *     agrees with it. The core is the same power curve at ~40× the exponent —
 *     edgeless at any exponent, so it gives the sky a brightest *point* without
 *     ever becoming a shape.
 *   - **a cloud deck**, three octaves of value noise thresholded into broken
 *     forms, lit by resampling the density a step toward the light. This is
 *     where a sky's colour actually lives: the gold in a sunset is on cloud
 *     faces, not smeared through the air. Without it the warm and cool ends of a
 *     preset meet in open air and the boundary reads as a gradient artifact —
 *     the "bleeding" this deck exists to break up. Its cost is confined to the
 *     visible strip by an early-out; see the branch in `main`.
 *
 * One inverted sphere, one unlit material, no texture and no post pass. It writes
 * no depth and draws first, so everything else in the room composites over it for
 * free, and `fog` is off because the dome *is* the distance the fog fades into.
 *
 * NO RAW HEX: every colour arrives as a uniform, already a `THREE.Color` from
 * `PALETTE`. The GLSL below contains only numbers.
 */

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { CAMERA, skyBounds, type CameraRig } from "./constants";
import type { DayCycleSample } from "./dayCycle";


/**
 * Big enough to sit behind everything, small enough to stay inside the rig's far
 * plane. Capped at 40 because `CloudSea` runs out to 120 and the dome does not
 * need to: the deck is opaque below the horizon and the dome writes no depth, so
 * the two never fight over a pixel.
 */
function domeRadius(rig: CameraRig): number {
  return Math.min(40, rig.far * 0.7);
}

const VERTEX = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uUpper;
  uniform vec3 uMid;
  uniform vec3 uLower;
  uniform vec3 uHorizon;
  uniform vec3 uGlow;
  uniform vec3 uGlowDirection;
  uniform float uGlowStrength;
  uniform float uGlowFocus;
  uniform vec3 uGlowCore;
  uniform float uCoreStrength;
  uniform float uCoreFocus;
  uniform float uSkyLow;
  uniform float uSkyHigh;
  uniform vec3 uCloudLit;
  uniform vec3 uCloudShadow;
  uniform float uCloudCover;
  uniform float uCloudOpacity;
  varying vec3 vWorldPosition;

  // Value noise. A hash rather than a texture: one fewer asset, one fewer
  // request, and the field has to be stable across reloads so a screenshot of
  // this sky is reproducible — which a hash is and a random seed is not.
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

  // Three octaves. Two reads as a blob field and four costs a third more for a
  // difference nobody can point at in a strip this narrow.
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p *= 2.17;   // Not exactly 2: an integer lacunarity lines the octaves' own
      a *= 0.5;    // grids up and the sum shows a repeating diagonal.
    }
    return v;
  }

  void main() {
    // From the EYE, not from the world origin. The dome is centred on the room
    // while the camera stands off it at y 5.5 / z 11, so a vertex's own direction
    // is not the direction anyone is looking in — measured, the two disagree by
    // enough to put the entire authored ramp outside the frame and hand back a
    // flat fill. cameraPosition is three's own uniform; nothing to declare.
    vec3 dir = normalize(vWorldPosition - cameraPosition);

    // Normalise the visible band to 0..1 first (see "skyBounds"), then run four
    // overlapping segments across it. Overlapping, not sequential: a hard
    // handover at one point in the ramp puts a visible seam exactly where the eye
    // is already looking for one.
    //
    // FOUR segments, not two, and that is the fix rather than a refinement. Each
    // "mix" is a straight lerp in linear sRGB, and a straight lerp between two
    // distant hues does not travel *around* the colour wheel, it cuts across the
    // middle of it — which is grey. Bridging a blue zenith to a warm horizon in
    // one step therefore guarantees a desaturated middle no matter which two
    // colours are chosen, and that middle is most of the frame. Short segments
    // between neighbouring hues have no room to pass through grey, which is what
    // lets the authored arc (blue → periwinkle → violet → rose → warm) survive
    // the interpolation instead of being averaged out by it.
    float k = clamp((dir.y - uSkyLow) / (uSkyHigh - uSkyLow), 0.0, 1.0);

    vec3 color = mix(uHorizon, uLower, smoothstep(0.0, 0.34, k));
    color = mix(color, uMid, smoothstep(0.18, 0.58, k));
    color = mix(color, uUpper, smoothstep(0.44, 0.82, k));
    color = mix(color, uZenith, smoothstep(0.68, 1.0, k));

    // The scattering lobe: a power curve on a clamped dot. Broad at low focus,
    // tighter at high, capped well under 1 so it never resolves into a hard edge.
    float lobe = pow(max(dot(dir, uGlowDirection), 0.0), uGlowFocus);
    color += uGlow * min(lobe, 0.9) * uGlowStrength;

    // And its core. Same direction, same shape, ~40× the exponent — a few
    // degrees across instead of a quarter of the sky. Still a power curve, so
    // still edgeless: this gives the sky a brightest *point* without drawing a
    // disc, and a warm end with no brightest point reads as paint rather than as
    // light. Uncapped on purpose (the broad lobe's "min" is there to stop it
    // washing out half the frame; this one is small enough that clipping it
    // would just flatten the only specular thing in the sky).
    float core = pow(max(dot(dir, uGlowDirection), 0.0), uCoreFocus);
    color += uGlowCore * core * uCoreStrength;

    // ── The cloud deck ─────────────────────────────────────────────────────
    // Everything below the floor's far edge is hidden by the ground plane, and
    // that is three quarters of the frame — so the noise never runs there. The
    // branch is spatially coherent (one contiguous region of the screen), which
    // is the only kind a GPU is happy to take.
    if (k > 0.0 && uCloudOpacity > 0.001) {
      // Dome coordinates: azimuth around the room, elevation up the visible
      // strip. Azimuth is scaled hard and elevation gently, because the strip is
      // ~7° tall and ~360° wide — sampling it squarely would stretch every cloud
      // into a horizontal smear.
      float az = atan(dir.z, dir.x);
      vec2 uv = vec2(az * 2.6, k * 1.9);

      float density = fbm(uv);
      // A soft threshold, not a hard one: cover is where the deck breaks up, and
      // a step function there gives you paper cut-outs.
      float cover = smoothstep(uCloudCover, uCloudCover + 0.22, density);

      // Clouds thin out into haze at the very bottom of the strip and run out of
      // sky at the top. Without this they end on a straight line, which is the
      // one thing no sky does.
      cover *= smoothstep(0.0, 0.3, k) * (1.0 - smoothstep(0.72, 1.0, k));

      // Lit faces: sample the density again a short step TOWARD the light. Where
      // the deck is thinning in that direction, light is getting through — so
      // that is the face the sun is on. This is the cheapest honest way to light
      // a cloud, and it is why the gold lands on edges rather than on everything.
      vec2 toward = normalize(vec2(uGlowDirection.x, uGlowDirection.y + 0.35)) * 0.16;
      float ahead = fbm(uv + toward);
      float lit = smoothstep(uCloudCover + 0.14, uCloudCover - 0.1, ahead);

      vec3 cloud = mix(uCloudShadow, uCloudLit, lit);
      // The deck also catches the scattering lobe, a little harder than the air
      // does — vapour is what the glow is scattering off in the first place.
      cloud += uGlow * min(lobe, 0.9) * uGlowStrength * 0.6;

      color = mix(color, cloud, clamp(cover, 0.0, 1.0) * uCloudOpacity);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

/**
 * Drives the dome from a sample. Called from the stage's own `useFrame` rather
 * than running one of its own — the sample is written there, and two frame
 * callbacks reading it in an undefined order is how a sky ends up one frame
 * behind its own fog.
 */
export interface SkyDomeHandle {
  apply: (sample: Readonly<DayCycleSample>) => void;
}

export function SkyDome({
  handleRef,
  rig = CAMERA,
}: {
  handleRef: React.RefObject<SkyDomeHandle | null>;
  /** The rig this dome is being seen through. Decides both how big the dome is
   *  and — via `skyBounds` — where in `dir.y` the five stops land. */
  rig?: CameraRig;
}) {
  const geometry = useMemo(() => new THREE.SphereGeometry(domeRadius(rig), 32, 20), [rig]);

  const material = useMemo(() => {
    const bounds = skyBounds(rig);
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      uniforms: {
        uZenith: { value: new THREE.Color() },
        uUpper: { value: new THREE.Color() },
        uMid: { value: new THREE.Color() },
        uLower: { value: new THREE.Color() },
        uHorizon: { value: new THREE.Color() },
        uGlow: { value: new THREE.Color() },
        uGlowDirection: { value: new THREE.Vector3(0, 1, 0) },
        uGlowStrength: { value: 0 },
        uGlowFocus: { value: 10 },
        uGlowCore: { value: new THREE.Color() },
        uCoreStrength: { value: 0 },
        uCoreFocus: { value: 300 },
        uSkyLow: { value: bounds.low },
        uSkyHigh: { value: bounds.high },
        uCloudLit: { value: new THREE.Color() },
        uCloudShadow: { value: new THREE.Color() },
        uCloudCover: { value: 0.5 },
        uCloudOpacity: { value: 0 },
      },
    });
  }, [rig]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useEffect(() => {
    const u = material.uniforms;
    handleRef.current = {
      apply: (sample) => {
        (u.uZenith!.value as THREE.Color).copy(sample.skyZenith);
        (u.uUpper!.value as THREE.Color).copy(sample.skyUpper);
        (u.uMid!.value as THREE.Color).copy(sample.skyMid);
        (u.uLower!.value as THREE.Color).copy(sample.skyLower);
        (u.uHorizon!.value as THREE.Color).copy(sample.skyHorizon);
        (u.uGlow!.value as THREE.Color).copy(sample.glow);
        (u.uGlowDirection!.value as THREE.Vector3).copy(sample.glowDirection);
        u.uGlowStrength!.value = sample.glowStrength;
        u.uGlowFocus!.value = sample.glowFocus;
        (u.uGlowCore!.value as THREE.Color).copy(sample.glowCore);
        u.uCoreStrength!.value = sample.coreStrength;
        u.uCoreFocus!.value = sample.coreFocus;
        (u.uCloudLit!.value as THREE.Color).copy(sample.cloudLit);
        (u.uCloudShadow!.value as THREE.Color).copy(sample.cloudShadow);
        u.uCloudCover!.value = sample.cloudCover;
        u.uCloudOpacity!.value = sample.cloudOpacity;
      },
    };
    return () => {
      handleRef.current = null;
    };
  }, [material, handleRef]);

  return <mesh geometry={geometry} material={material} renderOrder={-1} frustumCulled={false} />;
}
