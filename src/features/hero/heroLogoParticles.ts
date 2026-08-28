/**
 * The P mark, converging from particles as it pans into place in the closure
 * scene.
 *
 * Modeled directly on `LogoParticleField.tsx`'s technique (rasterise once,
 * sample opaque pixels on a stride into flat `Float32Array`s, batch-draw by
 * brand colour in two passes) but **progress-driven, not physics-driven**:
 * this is a deterministic, scroll-scrubbed transition, not a cursor-reactive
 * idle effect, so there is no per-frame spring/repel/velocity state — each
 * particle's position is a pure function of `convergeProgress` (0 = fully
 * scattered, 1 = fully settled into the solid mark).
 *
 * The scatter offset, angle and stagger delay are randomised once at sample
 * time and cached in the same flat arrays as the origin, using a small seeded
 * PRNG rather than `Math.random()` so the scatter pattern is stable across
 * rebuilds (and across server/client, if this module is ever imported
 * somewhere that matters) instead of re-rolling on every image (re)decode.
 */

import { RGB_GOLD, RGB_NAVY, type Rgb } from "./heroScene";
import { getLogoImage } from "./heroLogoMask";

/** Offscreen raster size — a particle *source*, not a rendered image. */
const SAMPLE_PX = 96;
/** Pixel stride when sampling. Higher = fewer, chunkier particles. This mark
 *  renders far smaller on screen than the footer's, so a few hundred
 *  particles reads as densely as the footer's ~1,100 does there. */
const STRIDE = 4;
/** Alpha above which a sampled pixel becomes a particle. */
const ALPHA_CUTOFF = 128;

/** Fixed seed so the scatter pattern is identical on every rebuild. */
const SCATTER_SEED = 0x50480828;

interface LogoParticles {
  count: number;
  /** Origin offset from the mark's own centre, normalised to [-0.5, 0.5]. */
  ox: Float32Array;
  oy: Float32Array;
  /** Scatter direction, radians. */
  angle: Float32Array;
  /** Scatter distance multiplier, in units of the mark's on-screen size. */
  dist: Float32Array;
  /** Per-particle stagger, 0..1 — a particle with delay `d` only starts
   *  converging once `convergeProgress` clears `d * MAX_DELAY_FRACTION`. */
  delay: Float32Array;
  /** 1 = gold stroke, 0 = navy body — same red/blue split heuristic as
   *  `LogoParticleField.tsx`'s `buildField`. */
  gold: Uint8Array;
}

/** Small deterministic PRNG (mulberry32) — no `Math.random()` in a module
 *  that must produce the same scatter pattern every time it rebuilds. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How much of the transition is spent staggering particle starts, before
 *  every particle is converging simultaneously. */
const MAX_DELAY_FRACTION = 0.4;

let cached: LogoParticles | null = null;
let cachedForImage: CanvasImageSource | null = null;

/** Sample the currently-decoded logo image into particle arrays, once per
 *  image instance. Returns null until `heroLogoMask.ts` has decoded it, or if
 *  the environment can't give this module a 2D context (jsdom). */
function getLogoParticles(): LogoParticles | null {
  const image = getLogoImage();
  if (!image) return null;
  if (cached && cachedForImage === image) return cached;

  const off = document.createElement("canvas");
  off.width = SAMPLE_PX;
  off.height = SAMPLE_PX;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.clearRect(0, 0, SAMPLE_PX, SAMPLE_PX);
  try {
    ctx.drawImage(image, 0, 0, SAMPLE_PX, SAMPLE_PX);
  } catch {
    return null;
  }

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, SAMPLE_PX, SAMPLE_PX).data;
  } catch {
    return null; // tainted canvas
  }

  const rand = mulberry32(SCATTER_SEED);
  const ox: number[] = [];
  const oy: number[] = [];
  const angle: number[] = [];
  const dist: number[] = [];
  const delay: number[] = [];
  const gold: number[] = [];

  for (let py = 0; py < SAMPLE_PX; py += STRIDE) {
    for (let px = 0; px < SAMPLE_PX; px += STRIDE) {
      const i = (py * SAMPLE_PX + px) * 4;
      if ((data[i + 3] ?? 0) < ALPHA_CUTOFF) continue;
      ox.push(px / SAMPLE_PX - 0.5);
      oy.push(py / SAMPLE_PX - 0.5);
      const r = data[i] ?? 0;
      const b = data[i + 2] ?? 0;
      gold.push(r > b + 40 ? 1 : 0);
      angle.push(rand() * Math.PI * 2);
      dist.push(0.55 + rand() * 0.85);
      delay.push(rand() * MAX_DELAY_FRACTION);
    }
  }

  const count = ox.length;
  if (count === 0) return null;

  cached = {
    count,
    ox: Float32Array.from(ox),
    oy: Float32Array.from(oy),
    angle: Float32Array.from(angle),
    dist: Float32Array.from(dist),
    delay: Float32Array.from(delay),
    gold: Uint8Array.from(gold),
  };
  cachedForImage = image;
  return cached;
}

function easeOutCubic(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - c, 3);
}

/**
 * Draw the mark as particles converging toward its solid form.
 *
 * `screenCx`/`screenCy` is the mark's centre in canvas CSS px (the same point
 * `drawLogo`'s own `project(cam, cx, cy, 0)` resolves to); `screenSize` is its
 * on-screen width. `convergeProgress` is `state.moveLeft` — 0 scattered, 1
 * fully settled — so the particles are mid-explosion exactly while the P is
 * mid-pan, and read as a single mark the instant it settles left.
 *
 * Returns `false` (drawing nothing) if the source image hasn't decoded yet;
 * the caller falls back to the ordinary solid blit in that case.
 */
export function drawLogoConverge(
  ctx: CanvasRenderingContext2D,
  screenCx: number,
  screenCy: number,
  screenSize: number,
  convergeProgress: number,
): boolean {
  const particles = getLogoParticles();
  if (!particles) return false;

  const dot = Math.max(1.4, (screenSize / SAMPLE_PX) * STRIDE * 0.85);
  const scatterRadiusBase = screenSize * 0.55;

  for (let pass = 0; pass < 2; pass++) {
    ctx.fillStyle = rgba(pass === 1 ? RGB_GOLD : RGB_NAVY, 1);
    for (let i = 0; i < particles.count; i++) {
      if (particles.gold[i] !== pass) continue;

      const delay = particles.delay[i]!;
      const local = easeOutCubic((convergeProgress - delay) / Math.max(0.0001, 1 - delay));
      const scattered = 1 - local;

      const sx =
        screenCx +
        particles.ox[i]! * screenSize +
        Math.cos(particles.angle[i]!) * particles.dist[i]! * scatterRadiusBase * scattered;
      const sy =
        screenCy +
        particles.oy[i]! * screenSize +
        Math.sin(particles.angle[i]!) * particles.dist[i]! * scatterRadiusBase * scattered;

      ctx.globalAlpha = 0.35 + 0.65 * local;
      ctx.fillRect(sx - dot / 2, sy - dot / 2, dot, dot);
    }
  }
  ctx.globalAlpha = 1;
  return true;
}

function rgba(c: Rgb, a: number): string {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
}
