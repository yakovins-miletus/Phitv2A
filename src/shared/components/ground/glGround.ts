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
 *  - A directional wipe at the act break, which is a per-pixel function of position
 *    and cannot be expressed as a background-color tween.
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
uniform vec3  uTo;        // ground being entered
uniform float uMix;       // 0-1 blend between them
uniform float uSeam;      // 0-1 act-break wipe progress
uniform float uGrain;     // grain amount
uniform vec2  uRes;

// Hash for grain + dither. Cheap, stable, no texture fetch.
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec3 base = mix(uFrom, uTo, uMix);

  // Act break: a diagonal wipe sweeping bottom-left to top-right. The page uses
  // this exactly once, where Services hands over to People, so the boundary reads
  // as a chapter change rather than another crossfade.
  if (uSeam > 0.0) {
    float diag = (vUv.x + (1.0 - vUv.y)) * 0.5;
    // Soft edge, and the leading edge runs slightly ahead so the wipe completes.
    float edge = smoothstep(diag - 0.18, diag + 0.18, uSeam * 1.36 - 0.18);
    base = mix(base, uTo, edge);
  }

  // Ordered dither below the 8-bit step, then grain. Without this the navies band
  // in wide viewports; with it the gradient is smooth at any width.
  float n = hash(gl_FragCoord.xy) - 0.5;
  base += n * (1.0 / 255.0);
  base += n * uGrain;

  outColor = vec4(base, 1.0);
}`;

export interface GlGround {
  render(from: Rgb, to: Rgb, mix: number, seam: number): void;
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
  const uMix = gl.getUniformLocation(prog, "uMix");
  const uSeam = gl.getUniformLocation(prog, "uSeam");
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
      if (canvas.width === pw && canvas.height === ph) return;
      canvas.width = pw;
      canvas.height = ph;
      gl.viewport(0, 0, pw, ph);
      gl.uniform2f(uRes, pw, ph);
    },
    render(from, to, mix, seam) {
      if (disposed || gl.isContextLost()) return;
      const a = toLinear(from);
      const b = toLinear(to);
      gl.uniform3f(uFrom, a[0], a[1], a[2]);
      gl.uniform3f(uTo, b[0], b[1], b[2]);
      gl.uniform1f(uMix, mix);
      gl.uniform1f(uSeam, seam);
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
