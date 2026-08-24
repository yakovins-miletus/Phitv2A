/**
 * The specular rim itself — a WebGL overlay that traces a moving highlight along
 * a button's rounded-rect edge, aimed at the pointer.
 *
 * Ported from the React Bits `SpecularButton` (ogl). The shader is upstream's,
 * with one addition — a `uBaseAlpha` uniform so the static edge stroke can be
 * dialled down where the button already has a border (see `baseOpacity`).
 * What really differs is the lifecycle around it, for three reasons the
 * upstream single-button demo never has to answer:
 *
 *   1. **It is an overlay, not a button.** Upstream owns the `<button>` element.
 *      Here every call site is an existing MUI `Button`/`IconButton` carrying
 *      routing (`component={Link}`), form semantics (`type="submit"`), icons and
 *      per-page `sx`. Rebuilding those on a bare `<button>` would have meant 43
 *      behavioural rewrites, so the effect became a child that measures its own
 *      parent instead.
 *   2. **Contexts are pooled.** See ./glContextBudget — the GL context is
 *      created and destroyed on demand rather than held for the component's
 *      lifetime.
 *   3. **It is gated.** No context at all under `prefers-reduced-motion`, on
 *      low-power devices, or on coarse pointers where a pointer-aimed highlight
 *      can never fire (unless `autoAnimate` drives it without a pointer).
 *
 * Both the pooling and the gating are unobservable by design: in every case the
 * frames not drawn were fully transparent frames.
 */

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Color } from "ogl";

import { useReducedMotion, usePointerFine, useIsLowPowerDevice } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";
import { registerSpecular, requestRebalance, type SpecularHolder } from "./glContextBudget";

/** Canvas overhang in px, so the rim glow can bleed past the button's edge. */
const PAD = 20;

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;
uniform float uBaseAlpha;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float shapeSDF(vec2 p) { return sdRoundedRect(p, uHalfSize, uRadius); }

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = shapeSDF(p);
  vec2 L = vec2(cos(uAngle), sin(uAngle));

  // Dark base stroke hugging the edge for a sense of thickness
  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45 * uBaseAlpha;

  // Symmetric specular: the edges facing toward/away from the light both
  // catch a streak. The angular window (size + fade) is measured with an
  // elliptical normal so it varies continuously along straight edges.
  vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float hi = line * rim * edgeClamp * uIntensity;

  vec3 col = uBaseColor * base + uLineColor * hi;
  float a = clamp(base + hi, 0.0, 1.0);
  fragColor = vec4(col, a);
}
`;

/** ogl's `parseColor` accepts only `#hex`, a named colour, a number, or three
 *  decimals (see `ogl/src/math/functions/ColorFunc.js`). It accepts neither
 *  `rgb()` nor `rgba()`. On anything else it logs "Color format not recognised"
 *  and returns `[0, 0, 0]`.
 *
 *  Two consequences, both of which were live: the call sits inside the rAF
 *  loop, so one unparseable value warned on every frame for as long as the
 *  component stayed mounted (measured at roughly 190/second), and the rim
 *  silently rendered black instead of the colour that was asked for.
 *
 *  The uniforms are `vec3`, so alpha was discarded regardless. Converting to
 *  hex here changes nothing on screen except that the intended colour now
 *  actually arrives; soften the rim with `baseOpacity` or `intensity`. */
function oglSafeColor(value: string): string {
  const raw = value.trim();
  if (raw.startsWith("#")) return raw;
  const m = /^rgba?\(\s*([^)]+)\)$/i.exec(raw);
  const inner = m?.[1];
  if (!inner) return raw;
  const parts = inner.split(",").map((x) => Number.parseFloat(x.trim()));
  const [r, g, b] = parts;
  if (r === undefined || g === undefined || b === undefined) return raw;
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return raw;
  const hex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export interface SpecularFxProps {
  /**
   * Corner radius override in px, clamped to a pill against the shorter side.
   *
   * Leave unset — the default reads the parent's computed `border-radius` every
   * resize, so the rim traces the button's real shape. The call sites span a
   * 10px nav control, `var(--r-control)` from the token layer and 100px careers
   * pills, and a fixed number would have cut every corner it did not match.
   */
  radius?: number;
  /** Colour of the moving specular highlight. */
  lineColor?: string;
  /** Colour of the static edge stroke under the highlight. */
  baseColor?: string;
  /**
   * Opacity of that static edge stroke, 0–1. Upstream has no such control — it
   * always draws the stroke, because upstream owns a borderless glass button
   * that needs one to read as an edge at all.
   *
   * Every button here already has a 1px border from the token layer, so the
   * stroke lands *next to* an existing edge and reads as a second, darker
   * outline. Both button wrappers therefore default it to 0 and keep only the
   * moving highlight; set it above 0 for a standalone borderless surface.
   */
  baseOpacity?: number;
  /** Brightness of the specular highlight. */
  intensity?: number;
  /** Angular size in degrees of each shine streak along the edge. */
  shineSize?: number;
  /** How gradually each streak fades at its ends, in degrees. */
  shineFade?: number;
  /** Width of the highlight line in px. */
  thickness?: number;
  /** Rotation speed of the idle sweep. */
  speed?: number;
  /** Point the light toward the cursor. */
  followMouse?: boolean;
  /** Distance in px within which the shine fades in as the cursor approaches. */
  proximity?: number;
  /** Keep the shine on with a rotating sweep, ignoring pointer distance. */
  autoAnimate?: boolean;
}

/**
 * Renders the rim for its own parent element. Mount it as a direct child of the
 * element that should catch the light — it measures `parentElement` and pins the
 * SDF to that element's border box.
 */
export default function SpecularFx({
  radius,
  // Upstream's #ffffff / #525252, expressed as tokens. The base stroke is the
  // divider grey rather than a fourth neutral invented here.
  lineColor = NOIR.white,
  baseColor = NOIR.mist,
  baseOpacity = 1,
  intensity = 1,
  shineSize = 10,
  shineFade = 40,
  thickness = 1,
  speed = 0.35,
  followMouse = true,
  proximity = 250,
  autoAnimate = false,
}: SpecularFxProps) {
  const fxRef = useRef<HTMLSpanElement>(null);

  // Live prop mirror, so prop changes reach the running loop without the effect
  // tearing the GL context down and recompiling the shader. Written in an
  // effect rather than during render (react-hooks/refs): the loop is an
  // external system, and the one frame it may draw with the previous values
  // between render and commit is a sub-frame difference in a highlight angle.
  const propsRef = useRef({
    radius, lineColor, baseColor, baseOpacity, intensity, shineSize,
    shineFade, thickness, speed, followMouse, proximity, autoAnimate,
  });
  useEffect(() => {
    propsRef.current = {
      radius, lineColor, baseColor, baseOpacity, intensity, shineSize,
      shineFade, thickness, speed, followMouse, proximity, autoAnimate,
    };
  });

  const reduceMotion = useReducedMotion();
  const pointerFine = usePointerFine();
  const lowPower = useIsLowPowerDevice();

  // A pointer-aimed highlight has nothing to aim on a touch screen, so the only
  // thing that could light it there is the idle sweep.
  const enabled = !reduceMotion && !lowPower && (pointerFine || autoAnimate);

  useEffect(() => {
    const fx = fxRef.current;
    const btn = fx?.parentElement;
    if (!fx || !btn || !enabled) return;

    // Capped at 2, matching HeroCanvas, LogoParticleField and GroundLayer. This
    // was the one uncapped canvas in the codebase: on a 3x-DPR phone it was
    // allocating 2.25x the pixels of every other surface to draw a 1px rim on a
    // button, and up to six of these run at once (see glContextBudget.ts).
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    /** Everything owned by one GL lifetime, so `stop()` can drop it all. */
    let ctx: {
      renderer: Renderer;
      program: Program;
      mesh: Mesh;
      ro: ResizeObserver;
      raf: number;
    } | null = null;

    // Pointer state survives across start/stop: a button that regains a context
    // should resume aimed at the cursor, not snap from the idle angle.
    let pointerAngle: number | null = null;
    let proximityT = 0;
    let angle = 2.4;
    let idleAngle = 2.4;
    let bright = 0;

    const sizeRef = { w: 1, h: 1, radius: 0 };
    const lineC = new Color();
    const baseC = new Color();
    let last = performance.now();

    const start = () => {
      if (ctx) return;

      // `new Renderer()` throws (TypeError, from inside ogl) when the browser
      // cannot hand out a WebGL context at all — disabled hardware
      // acceleration, a crashed GPU process, a locked-down or headless browser.
      // That is distinct from the context *eviction* glContextBudget.ts already
      // manages: there is no slot to win here, so there is nothing to retry.
      //
      // Unguarded, the throw escaped into a rAF-adjacent callback: no page
      // crash (it is outside React's render phase), but a console error and a
      // button whose rim is silently dead for the session. Bail instead and
      // leave the button as plain, working UI.
      let renderer: Renderer;
      try {
        renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true, dpr });
      } catch {
        return;
      }
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      const geometry = new Triangle(gl);
      // The fullscreen triangle's UVs are unused — the shader works in
      // gl_FragCoord space — and uploading them wastes a buffer per button.
      if (geometry.attributes.uv) delete (geometry.attributes as Record<string, unknown>).uv;

      const program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms: {
          uCenter: { value: [0, 0] },
          uHalfSize: { value: [1, 1] },
          uRadius: { value: 0 },
          uAngle: { value: angle },
          uPx: { value: dpr },
          uLineColor: { value: [1, 1, 1] },
          uBaseColor: { value: [0.32, 0.32, 0.32] },
          uIntensity: { value: 1 },
          uShineSize: { value: 0.17 },
          uShineFade: { value: 0.7 },
          uThickness: { value: 1 },
          uBaseWidth: { value: dpr },
          uBaseAlpha: { value: 1 },
        },
      });

      const mesh = new Mesh(gl, { geometry, program });
      fx.appendChild(gl.canvas);

      const resize = () => {
        // Fractional size plus an explicit centre keep the SDF pinned to the
        // exact CSS border, instead of drifting up to a pixel from the rounding
        // in offsetWidth.
        const rect = btn.getBoundingClientRect();
        sizeRef.w = rect.width;
        sizeRef.h = rect.height;

        // Trace the button's real corners. `border-radius` resolves to px here
        // even when it was authored as a token or a percentage, so the only
        // unreadable case is an elliptical radius ("10px / 20px"), which
        // parseFloat reads as the horizontal half — close enough for a 1px rim.
        const override = propsRef.current.radius;
        sizeRef.radius = override ?? (parseFloat(getComputedStyle(btn).borderTopLeftRadius) || 0);
        renderer.setSize(rect.width + PAD * 2, rect.height + PAD * 2);
        program.uniforms.uCenter.value = [(PAD + rect.width / 2) * dpr, (PAD + rect.height / 2) * dpr];
        program.uniforms.uHalfSize.value = [(rect.width / 2) * dpr, (rect.height / 2) * dpr];
      };
      const ro = new ResizeObserver(resize);
      ro.observe(btn);
      resize();

      last = performance.now();
      ctx = { renderer, program, mesh, ro, raf: requestAnimationFrame(update) };
    };

    const stop = () => {
      if (!ctx) return;
      const { renderer, ro, raf } = ctx;
      cancelAnimationFrame(raf);
      ro.disconnect();
      const canvas = renderer.gl.canvas as HTMLCanvasElement;
      if (canvas.parentNode === fx) fx.removeChild(canvas);
      renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
      ctx = null;
    };

    function update(now: number) {
      if (!ctx) return;
      ctx.raf = requestAnimationFrame(update);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const p = propsRef.current;
      const { program } = ctx;

      idleAngle += p.speed * dt;
      const steer = p.followMouse && pointerAngle != null && (!p.autoAnimate || proximityT > 0);
      const target = steer ? (pointerAngle as number) : idleAngle;
      const diff = ((target - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      angle += diff * (1 - Math.exp(-dt * 7));

      // The shine fades in with pointer proximity unless autoAnimate keeps it on.
      const brightTarget = p.autoAnimate ? 1 : proximityT;
      bright += (brightTarget - bright) * (1 - Math.exp(-dt * 8));

      lineC.set(oglSafeColor(p.lineColor));
      baseC.set(oglSafeColor(p.baseColor));
      program.uniforms.uAngle.value = angle;
      program.uniforms.uRadius.value =
        Math.min(sizeRef.radius, Math.min(sizeRef.w, sizeRef.h) / 2) * dpr;
      program.uniforms.uLineColor.value = [lineC.r, lineC.g, lineC.b];
      program.uniforms.uBaseColor.value = [baseC.r, baseC.g, baseC.b];
      program.uniforms.uIntensity.value = p.intensity * bright;
      program.uniforms.uShineSize.value = (p.shineSize * Math.PI) / 180;
      program.uniforms.uShineFade.value = (p.shineFade * Math.PI) / 180;
      program.uniforms.uThickness.value = p.thickness * dpr;
      program.uniforms.uBaseAlpha.value = p.baseOpacity;
      ctx.renderer.render({ scene: ctx.mesh });
    }

    // `distance` is what the context pool ranks on; an always-on rim pins a slot.
    const holder: SpecularHolder = {
      distance: autoAnimate ? 0 : Number.POSITIVE_INFINITY,
      live: false,
      start,
      stop,
    };

    // The pool only sees buttons that are actually on screen. Without this an
    // off-screen footer button could outrank a visible one whenever the pointer
    // happened to sit near its (scrolled-away) coordinates.
    let unregister: (() => void) | null = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && !unregister) {
          unregister = registerSpecular(holder);
        } else if (!entry.isIntersecting && unregister) {
          unregister();
          unregister = null;
        }
      },
      { rootMargin: `${PAD * 4}px` },
    );
    io.observe(btn);

    const onPointerMove = (e: PointerEvent) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
      const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
      const dist = Math.hypot(dx, dy);

      // Over the button itself the light settles on the diagonal — framing the
      // corners — and sways gently with the cursor's position within the button.
      if (dist === 0) {
        const nx = (e.clientX - cx) / (rect.width / 2);
        const ny = (cy - e.clientY) / (rect.height / 2);
        pointerAngle = Math.atan2(2 / rect.height, -2 / rect.width) + nx * 0.3 + ny * 0.15;
      } else {
        pointerAngle = Math.atan2(cy - e.clientY, e.clientX - cx);
      }

      const t = Math.max(0, 1 - dist / Math.max(propsRef.current.proximity, 1));
      proximityT = t * t * (3 - 2 * t);

      if (!propsRef.current.autoAnimate) {
        holder.distance = dist;
        requestRebalance();
      }
    };
    // passive: this handler only measures pointer distance and never calls
    // preventDefault, so telling the browser up front means it doesn't have to
    // wait on it before handling the gesture.
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      io.disconnect();
      unregister?.();
      stop();
    };
  }, [enabled, autoAnimate]);

  if (!enabled) return null;

  return <span ref={fxRef} className="specular-fx" aria-hidden="true" />;
}
