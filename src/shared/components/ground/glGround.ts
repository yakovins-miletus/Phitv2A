import type { Rgb } from "./groundStops";

/**
 * The WebGL ground renderer.
 *
 * One fullscreen quad, one fragment shader, no geometry, no textures, and no
 * library. Written by hand rather than pulled from three.js or R3F deliberately:
 * this draws two triangles, and a scene graph would add 150-600 KB to a page whose
 * brief named fast loading as a requirement. Compiled size here is a few KB.
 *
 * What the shader buys over the CSS fallback, which is the reason it exists:
 *
 *  - Dithered gradient. A flat 8-bit fill across a 2560px viewport bands visibly on
 *    the near-neutral navies this palette uses; an ordered dither below the
 *    quantisation step removes it.
 *  - A per-tile hashed reveal at *every* section boundary, not just the page's
 *    former "act break". Each tile on screen gets its own random threshold; as
 *    the boundary's scroll-scrubbed progress advances, tiles flip from the old
 *    ground to the new one in that per-tile order. That is a per-pixel function
 *    of screen position and scroll offset, so it cannot be expressed as a
 *    background-color tween — the earlier version of this file only ran a
 *    single diagonal wipe, gated to the one act break the page used to have;
 *    now that every boundary gets the same treatment, the effect had to become
 *    the default rather than a special case (see `groundStops.ts`'s
 *    `sampleGround` for why every boundary is now equal).
 *  - Vignette and grain composited in the same pass, so they cost no extra layers.
 *
 * The caller owns the rAF loop — `render` is a pure "draw this state now" call, so
 * it can be driven from the existing GSAP ticker instead of a second loop.
 */

const VERT = `#version 300 es
precision highp float;
// Fullscreen triangle-pair from gl_VertexID: no attribute buffers, no VAO uploads.
const vec2 POS[4] = vec2[4](vec2(-1.,-1.), vec2(1.,-1.), vec2(-1.,1.), vec2(1.,1.));
out vec2 vUv;
void main() {
  vec2 p = POS[gl_VertexID];
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec3  uFrom;      // ground being left, linear 0-1
uniform vec3  uTo;        // ground being entered, linear 0-1
uniform float uProgress;  // 0-1 scroll-scrubbed boundary progress
uniform float uTileSize;  // tile size, in device pixels
uniform float uGrain;     // grain amount
uniform vec2  uRes;

// Hash for grain + dither + per-tile threshold. Cheap, stable, no texture fetch.
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  // Per-tile hashed reveal, active at every boundary. Each tile on screen gets
  // its own random threshold in [0,1] from its integer grid coordinate; once
  // uProgress passes that threshold the tile has "flipped" from uFrom to uTo.
  // A smoothstep band around the threshold, rather than a hard cut, keeps the
  // sweeping edge from reading as dithering noise as it crosses the tile field.
  vec2 tileCoord = floor(gl_FragCoord.xy / uTileSize);
  float threshold = hash(tileCoord + 0.5);
  float band = 0.05;
  float reveal = smoothstep(threshold - band, threshold + band, uProgress);
  vec3 base = mix(uFrom, uTo, reveal);

  // Back to sRGB: uFrom/uTo arrive linearised so the blend happens in linear light,
  // but the drawing buffer is plain RGBA8 and is read as sRGB. Without this every
  // ground paints far darker than authored (navyField #0A2A66 -> ~#010624).
  base = mix(base * 12.92, 1.055 * pow(base, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, base));

  // Ordered dither below the 8-bit step, then grain. Without this the navies band
  // in wide viewports; with it the gradient is smooth at any width.
  float n = hash(gl_FragCoord.xy) - 0.5;
  base += n * (1.0 / 255.0);
  base += n * uGrain;

  outColor = vec4(base, 1.0);
}`;

/** Tile size, in CSS pixels, before DPR scaling.
 *
 * The retired DOM-based `PixelWipe`'s `BASE_PIXEL_SIZE` was 64 — right for a
 * one-off route-transition overlay playing over the whole viewport at once,
 * but now that every section boundary plays the same wipe (see the file
 * header), a mid-wipe frame sits on screen far more often, and 64px tiles at
 * that frequency read as a grid of broken/half-rendered blocks rather than a
 * dissolve, especially over light grounds. Shrinking to 20 keeps the same
 * per-tile hashed-reveal language (still visually a "tile wipe", not a
 * crossfade) while making the flipped tiles small enough to read as texture
 * grain instead of discrete squares. */
const TILE_SIZE_CSS_PX = 200;

export interface GlGround {
  /** `progress` is 0 at `from`, 1 at `to`, ramping between them as the caller
   *  scrolls through a boundary's blend window. Tiles reveal `to` in a hashed
   *  per-tile order as it advances — see the shader comment above. */
  render(from: Rgb, to: Rgb, progress: number): void;
  resize(w: number, h: number, dpr: number): void;
  dispose(): void;
  readonly canvas: HTMLCanvasElement;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/** sRGB byte → linear float, so the blend happens in linear light. Mixing two
 *  colours in gamma space darkens the midpoint; this is why the CSS fallback and
 *  the shader can look subtly different mid-transition. */
function toLinear(c: Rgb): [number, number, number] {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return [f(c[0]), f(c[1]), f(c[2])];
}

/**
 * Create the renderer, or return null if WebGL2 is unavailable or the program
 * fails to link. Null is a normal outcome, not an error: the caller falls back to
 * the CSS renderer.
 */
export function createGlGround(canvas: HTMLCanvasElement, grain = 0.012): GlGround | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    // The layer is behind everything and repainted every frame it changes, so the
    // browser never needs to preserve it between frames.
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  // Shaders are linked into the program; the objects themselves are dead weight.
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    return null;
  }

  gl.useProgram(prog);
  const uFrom = gl.getUniformLocation(prog, "uFrom");
  const uTo = gl.getUniformLocation(prog, "uTo");
  const uProgress = gl.getUniformLocation(prog, "uProgress");
  const uTileSize = gl.getUniformLocation(prog, "uTileSize");
  const uGrain = gl.getUniformLocation(prog, "uGrain");
  const uRes = gl.getUniformLocation(prog, "uRes");
  gl.uniform1f(uGrain, grain);

  // No VAO and no buffers: the vertex shader builds the quad from gl_VertexID.
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  let disposed = false;

  return {
    canvas,
    resize(w, h, dpr) {
      if (disposed) return;
      const pw = Math.max(1, Math.round(w * dpr));
      const ph = Math.max(1, Math.round(h * dpr));
      // Tile size in device pixels must track dpr even when pw/ph don't change
      // (e.g. a devicePixelRatio change with no viewport resize), so this is
      // set unconditionally rather than only on the early-return path below.
      gl.uniform1f(uTileSize, TILE_SIZE_CSS_PX * dpr);
      if (canvas.width === pw && canvas.height === ph) return;
      canvas.width = pw;
      canvas.height = ph;
      gl.viewport(0, 0, pw, ph);
      gl.uniform2f(uRes, pw, ph);
    },
    render(from, to, progress) {
      if (disposed || gl.isContextLost()) return;
      const a = toLinear(from);
      const b = toLinear(to);
      gl.uniform3f(uFrom, a[0], a[1], a[2]);
      gl.uniform3f(uTo, b[0], b[1], b[2]);
      gl.uniform1f(uProgress, progress);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
      // Free the drawing buffer immediately rather than waiting for GC — a lost or
      // leaked context is a hard cap the browser enforces per page.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
