/**
 * The Monolith room's light — one authored look, and no clock.
 *
 * This file has been three things. It was a slider over a continuous ramp,
 * which failed because every position between two stops was a colour nobody
 * chose. It became four presets, which fixed that but gave the hero a control
 * surface it did not need. It was then rewritten as a 60-second animated
 * cycle, which reintroduced the original bug — an animation between two stops
 * is a slider that moves on its own — and tinted the whole room violet on the
 * way past.
 *
 * It is now **one sample**: a dawn/twilight look, authored once, held forever.
 * `applyTwilightSample` writes it; nothing interpolates it by time.
 * `PlaygroundCanvas` still eases *toward* it via `lerpDayCycleSamples`, but
 * that is a one-shot settle on mount, not a loop.
 *
 * **The palette is a budget, not a mood.** ~60% white, ~20% soft warm, ~10%
 * soft blue-violet, ~10% blends — see `TWILIGHT` in `palette.ts`. The room is
 * a white room with warm light in it; the deepest value in the frame is the
 * mark itself. A hero whose background out-shouts its subject is a hero with
 * the wrong subject, and that is exactly what the violet cut was.
 *
 * Two properties held from every version:
 *
 *  1. **Nothing allocates in the frame path.** Every sample is written into a
 *     caller-owned object; colours and vectors are mutated in place.
 *  2. **NO RAW HEX.** Every colour is a `PALETTE` member, itself derived from
 *     `NOIR` / `DAWN` / `TWILIGHT` in `constants.ts`.
 */

import * as THREE from "three";

import { AMBIENT_INTENSITY, FOG, PALETTE, ROOM_LIGHT_INTENSITY } from "./constants";

/**
 * The Monolith's key light at night.
 *
 * This was `KEY_INTENSITY` inside `MonolithScene.tsx`. It lives here because the
 * night preset has to *be* it for that scene's shipped resting frame to survive,
 * and a constant two files must agree on gets one home.
 */
export const KEY_NIGHT_INTENSITY = 17;

/** How fast the room crosses between two presets, as a per-frame lerp factor.
 *  ~0.5s at 60fps: long enough to read as the light changing, short enough that
 *  nobody waits for it. Under reduced motion the caller uses 1 instead. */
export const PHASE_EASE = 0.055;

export interface DayCycleSample {
  /* ── The sky, as five bands ─────────────────────────────────────────────
   * A sky is never one colour, and painting it as one is what made the room
   * read as a flat card with a mark floating on it. These feed `SkyDome`'s
   * vertical ramp — overhead, down through the middle, to the band where the
   * sky meets the deck, which is the lightest in every real sky at every hour.
   *
   * **Five and not three, which was the actual bug.** With three stops the ramp
   * ran zenith → mid → horizon, and between any two of them `THREE.Color` does
   * a straight lerp in linear sRGB. A straight lerp from a blue to a cream
   * passes through *grey*, so the entire middle of the sky — two thirds of the
   * frame — was a colour nobody chose and nothing in the palette could fix.
   * Every band you add shortens the segments the lerp has to bridge, and five
   * is where the arc a real sunset walks (blue → periwinkle → violet → rose →
   * warm) has somewhere to actually live. See `SKY` in `palette.ts`. */
  skyZenith: THREE.Color;
  skyUpper: THREE.Color;
  skyMid: THREE.Color;
  skyLower: THREE.Color;
  skyHorizon: THREE.Color;
  /** The scattering lobe around the sun or moon. A wash, never a disc: nothing
   *  celestial is drawn in this room. */
  glow: THREE.Color;
  glowStrength: number;
  /** Falloff exponent. Low is a bloom across half the sky, high is tighter —
   *  never tight enough to resolve into a ball. */
  glowFocus: number;
  /**
   * The core of that lobe — a second, far tighter power curve on the same
   * direction, in a hotter colour.
   *
   * A deliberate softening of this room's "nothing celestial is drawn" rule,
   * and worth naming as such. The rule exists because a *disc* is a second
   * hard-edged bright object competing with the mark, and the mark is the whole
   * subject. A power lobe has no edge at any exponent — at a `coreFocus` of 1600 it
   * is a few degrees across and still falls off smoothly to nothing — so this
   * buys the one thing the broad lobe alone could not give: a sky that has a
   * brightest *point* rather than a brightest quarter. Without it the warm end
   * reads as a wash someone painted on, because real light has a source.
   */
  glowCore: THREE.Color;
  coreStrength: number;
  coreFocus: number;
  /** Unit direction of whichever body is lighting the room. */
  glowDirection: THREE.Vector3;

  /* ── The cloud deck ─────────────────────────────────────────────────────
   * A three-band ramp is a *lit* sky with no weather in it, and weather is
   * where a real sky's colour actually lives: the gold in a sunset is on cloud
   * faces, not smeared across the air behind them. Without these the warm and
   * cool ends of a preset meet in open air, which is the "bleeding" a plain
   * gradient always produces — two saturated colours with nothing between them
   * to break the boundary. */
  /** Sunlit cloud faces. */
  cloudLit: THREE.Color;
  /** Cloud undersides, which are lit by the sky and therefore cooler, not just
   *  darker. */
  cloudShadow: THREE.Color;
  /** 0 = clear, 1 = overcast. Really a threshold on the noise field. */
  cloudCover: number;
  /** How strongly the deck paints over the sky behind it. */
  cloudOpacity: number;

  /* ── The deck underfoot ─────────────────────────────────────────────────
   * The near cloud sea `CloudSea` draws, as opposed to the distant banks
   * painted into the dome above. Three values and not two: a lit crest, the
   * shoulder turning away from the light, and the valley between billows. Two
   * colours is what a rendered cloud looks like; the third is the one that
   * makes it read as volume, and it has to be a *hue* shift (warm crest, cool
   * valley) rather than the same colour darkened. */
  deckLit: THREE.Color;
  deckMid: THREE.Color;
  deckDeep: THREE.Color;
  fog: THREE.Color;
  fogNear: number;
  fogFar: number;
  /** The shared stage's floor plane. Unused by the decked variant, which hides
   *  that plane and draws `CloudSea` instead. */
  ground: THREE.Color;
  ambientIntensity: number;
  /**
   * Bounce off the deck, as a hemisphere term: sky colour from above, deck
   * colour from below.
   *
   * The largest single omission in the old rig and the reason the glass read as
   * a studio object rather than as something in the air. Standing over a cloud
   * sea, the deck is an enormous, bright, warm reflector filling the entire
   * lower hemisphere — more light arrives from *under* a floating object than
   * from the sky above it. An ambient term cannot express that, because ambient
   * is directionless by definition; a hemisphere light is exactly the shape of
   * this situation and costs one more light in the rig.
   */
  bounceIntensity: number;
  roomLight: THREE.Color;
  roomIntensity: number;
  /** The scene's own parked key. */
  keyLight: THREE.Color;
  keyIntensity: number;
  /** The celestial light. Zero at night: after dark the parked key is the only
   *  thing lighting the room, exactly as it was before this file existed. */
  sunLight: THREE.Color;
  sunIntensity: number;
}

/**
 * Write the room's one authored look into a sample.
 *
 * **One look, and no clock.** This replaced a 60-second animated cycle that
 * walked a sun around the sky and oscillated a blend weight underneath it. Two
 * things were wrong with that, and only the second is about taste:
 *
 *  1. A hero that keeps changing while you read it is asking for attention it
 *     has no use for. The mark is the subject; the room is the room.
 *  2. Every frame of the walk was a colour nobody chose — the same argument
 *     the four-preset version was built on, reintroduced by animating between
 *     two stops instead of picking one.
 *
 * So: no `timeMs`, no interpolation, no state. `PlaygroundCanvas` still eases
 * *toward* this sample on mount (`lerpDayCycleSamples`), which is a one-shot
 * settle rather than a loop, and once it arrives the room holds.
 *
 * The dawn/twilight look itself is cut to `TWILIGHT`'s colour budget — ~60%
 * white, ~20% soft warm, ~10% soft blue-violet, ~10% blends. Read that
 * docblock (`palette.ts`) before moving any value here; the ratios are the
 * brief, not a description of it.
 */
export function applyTwilightSample(out: DayCycleSample): void {
  /* ── The sky, top of frame → horizon ──────────────────────────────────────
   * The blue-violet is confined to the zenith and its one bridge; from the
   * middle band down the sky is white, and it warms only in the last stop
   * before it meets the deck. That distribution is what keeps the ~10% cool
   * share honest — under the altitude rig the zenith stop occupies the top
   * sliver of frame, not a third of it. */
  out.skyZenith.copy(PALETTE.twilightCool);
  out.skyUpper.copy(PALETTE.twilightBlendCool);
  out.skyMid.copy(PALETTE.twilightPaper);
  out.skyLower.copy(PALETTE.twilightWhite);
  out.skyHorizon.copy(PALETTE.twilightWarm);

  /* ── The light ────────────────────────────────────────────────────────────
   * Low and to the left, a few degrees above the horizon: dawn, and the angle
   * that puts light on the deck's faces rather than its tops. Fixed — the
   * animated version's moving sun is exactly what this cut removes.
   *
   * A broad, weak lobe plus a tight core, per `coreFocus`'s own docblock: the
   * broad term alone reads as a wash someone painted on, because real light
   * has a source. The core is `ember`, the one stop with real chroma, and the
   * only place in the frame it appears at full strength. */
  out.glow.copy(PALETTE.twilightWarm);
  out.glowStrength = 0.30;
  out.glowFocus = 14;
  out.glowCore.copy(PALETTE.twilightEmber);
  out.coreStrength = 0.42;
  out.coreFocus = 900;
  out.glowDirection.set(-0.42, 0.07, -0.90).normalize();

  /* ── The distant banks painted into the dome ──────────────────────────── */
  out.cloudLit.copy(PALETTE.twilightWhite);
  out.cloudShadow.copy(PALETTE.twilightBlendCool);
  out.cloudCover = 0.42;
  out.cloudOpacity = 0.72;

  /* ── The deck underfoot ───────────────────────────────────────────────────
   * White crest, warm-white shoulder, soft blue valley. The hue shift between
   * crest and valley is what makes it read as volume — see `deckMid`'s field
   * docblock. Warm on top because the light is above it; cool below because
   * what lights a shadowed underside is the sky, not the sun. */
  out.deckLit.copy(PALETTE.twilightWhite);
  out.deckMid.copy(PALETTE.twilightBlendWarm);
  out.deckDeep.copy(PALETTE.twilightCool);

  /* ── Air ──────────────────────────────────────────────────────────────────
   * Fog in `paper`, not in the cool stop. Fog is what everything distant
   * tends toward, so tinting it is the single cheapest way to tint the whole
   * frame — which is precisely how the previous cut went purple. */
  out.fog.copy(PALETTE.twilightPaper);
  out.fogNear = 24;
  out.fogFar = 78;
  out.ground.copy(PALETTE.twilightPaper);

  /* ── The rig ──────────────────────────────────────────────────────────────
   * Bright ambient and a strong bounce, because this is a white room: the
   * glass has to sit in light rather than be lit against a dark ground. The
   * key stays warm and is the only light in the rig with a hue. */
  out.ambientIntensity = 0.62;
  out.bounceIntensity = 0.85;
  out.roomLight.copy(PALETTE.twilightWhite);
  out.roomIntensity = 0.95;
  out.keyLight.copy(PALETTE.twilightWarm);
  out.keyIntensity = 15;
  out.sunLight.copy(PALETTE.twilightWhite);
  out.sunIntensity = 1.35;
}

/** The room's one look, built once at module load. Frozen by convention:
 *  never lerp into it, only out of it. */
export const TWILIGHT_SAMPLE = createDayCycleSample();
applyTwilightSample(TWILIGHT_SAMPLE);

export function phaseSample(): Readonly<DayCycleSample> {
  return TWILIGHT_SAMPLE;
}

export function createDayCycleSample(): DayCycleSample {
  return {
    skyZenith: new THREE.Color(),
    skyUpper: new THREE.Color(),
    skyMid: new THREE.Color(),
    skyLower: new THREE.Color(),
    skyHorizon: new THREE.Color(),
    glow: new THREE.Color(),
    glowStrength: 0,
    glowFocus: 10,
    glowCore: new THREE.Color(),
    coreStrength: 0,
    coreFocus: 300,
    glowDirection: new THREE.Vector3(0, 1, 0),
    cloudLit: new THREE.Color(),
    cloudShadow: new THREE.Color(),
    cloudCover: 0.5,
    cloudOpacity: 0,
    deckLit: new THREE.Color(),
    deckMid: new THREE.Color(),
    deckDeep: new THREE.Color(),
    fog: new THREE.Color(),
    fogNear: FOG.near,
    fogFar: FOG.far,
    ground: new THREE.Color(),
    ambientIntensity: AMBIENT_INTENSITY,
    bounceIntensity: 0,
    roomLight: new THREE.Color(),
    roomIntensity: ROOM_LIGHT_INTENSITY,
    keyLight: new THREE.Color(),
    keyIntensity: KEY_NIGHT_INTENSITY,
    sunLight: new THREE.Color(),
    sunIntensity: 0,
  };
}

export function copyDayCycleSample(
  out: DayCycleSample,
  from: Readonly<DayCycleSample>,
): DayCycleSample {
  return lerpDayCycleSamples(out, from, from, 0);
}

function lerp(a: number, b: number, f: number): number {
  return a + (b - a) * f;
}

export function lerpDayCycleSamples(
  out: DayCycleSample,
  a: Readonly<DayCycleSample>,
  b: Readonly<DayCycleSample>,
  f: number,
): DayCycleSample {
  out.skyZenith.lerpColors(a.skyZenith, b.skyZenith, f);
  out.skyUpper.lerpColors(a.skyUpper, b.skyUpper, f);
  out.skyMid.lerpColors(a.skyMid, b.skyMid, f);
  out.skyLower.lerpColors(a.skyLower, b.skyLower, f);
  out.skyHorizon.lerpColors(a.skyHorizon, b.skyHorizon, f);
  out.glow.lerpColors(a.glow, b.glow, f);
  out.glowStrength = lerp(a.glowStrength, b.glowStrength, f);
  out.glowFocus = lerp(a.glowFocus, b.glowFocus, f);
  out.glowCore.lerpColors(a.glowCore, b.glowCore, f);
  out.coreStrength = lerp(a.coreStrength, b.coreStrength, f);
  out.coreFocus = lerp(a.coreFocus, b.coreFocus, f);
  out.glowDirection.copy(a.glowDirection).lerp(b.glowDirection, f).normalize();
  out.cloudLit.lerpColors(a.cloudLit, b.cloudLit, f);
  out.cloudShadow.lerpColors(a.cloudShadow, b.cloudShadow, f);
  out.cloudCover = lerp(a.cloudCover, b.cloudCover, f);
  out.cloudOpacity = lerp(a.cloudOpacity, b.cloudOpacity, f);
  out.deckLit.lerpColors(a.deckLit, b.deckLit, f);
  out.deckMid.lerpColors(a.deckMid, b.deckMid, f);
  out.deckDeep.lerpColors(a.deckDeep, b.deckDeep, f);
  out.fog.lerpColors(a.fog, b.fog, f);
  out.fogNear = lerp(a.fogNear, b.fogNear, f);
  out.fogFar = lerp(a.fogFar, b.fogFar, f);
  out.ground.lerpColors(a.ground, b.ground, f);
  out.ambientIntensity = lerp(a.ambientIntensity, b.ambientIntensity, f);
  out.bounceIntensity = lerp(a.bounceIntensity, b.bounceIntensity, f);
  out.roomLight.lerpColors(a.roomLight, b.roomLight, f);
  out.roomIntensity = lerp(a.roomIntensity, b.roomIntensity, f);
  out.keyLight.lerpColors(a.keyLight, b.keyLight, f);
  out.keyIntensity = lerp(a.keyIntensity, b.keyIntensity, f);
  out.sunLight.lerpColors(a.sunLight, b.sunLight, f);
  out.sunIntensity = lerp(a.sunIntensity, b.sunIntensity, f);
  return out;
}

export function isPhaseDark(): boolean {
  return false;
}

