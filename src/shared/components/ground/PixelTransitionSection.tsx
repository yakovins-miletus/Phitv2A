import { useRef } from "react";
import Box from "@mui/material/Box";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { useReducedMotion, useIsLowPowerDevice } from "@/shared/motion";
import { GROUNDS, type GroundName } from "@/shared/theme/grounds";
import { parseGround, mixRgb, rgbCss, type Rgb } from "./groundStops";
import {
  GROUND_VERT,
  GROUND_FRAG,
  TILE_SIZE_CSS_PX,
  compileShader,
  toLinear,
} from "./glGround";

/** Height of the transition section in CSS pixels. Matches DEFAULT_BAND so
 *  the wipe completes exactly as the section scrolls through the viewport. */
const SECTION_HEIGHT = 220;

/**
 * A foreground pixel-transition section that sits in the normal document flow
 * between content sections. Renders its own inline WebGL canvas showing the
 * per-tile hashed reveal (the same shader as `glGround.ts`) driven by a
 * ScrollTrigger scrub as the user scrolls through it.
 *
 * Unlike the old `GroundLayer` approach (a fixed canvas at z-index -1 behind
 * everything), this component IS the section — it takes up scroll height, is
 * visible in the foreground, and the pixel wipe is the only thing you see as
 * you scroll through it.
 *
 * Degradation:
 *  - `prefers-reduced-motion`: instant color cut, no animation.
 *  - Low-power device / no WebGL2: CSS crossfade fallback.
 */
export function PixelTransitionSection({
  from,
  to,
}: {
  /** Ground name being left. */
  from: GroundName;
  /** Ground name being entered. */
  to: GroundName;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const lowPower = useIsLowPowerDevice();

  const fromColor = GROUNDS[from].bg;
  const toColor = GROUNDS[to].bg;
  const fromRgb = parseGround(fromColor);
  const toRgb = parseGround(toColor);

  // CSS fallback ref for the background color tween.
  const cssRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || reduced) return;

      const useGl = !lowPower && canvas !== null;
      let gl: ReturnType<typeof initGl> = null;

      if (useGl && canvas) {
        gl = initGl(canvas, fromRgb, toRgb);
        if (gl) {
          // Initial sizing.
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          gl.resize(canvas.clientWidth, canvas.clientHeight, dpr);
          // Render initial frame (progress=0).
          gl.render(0);
          canvas.style.opacity = "1";
        }
      }

      // Progress proxy for ScrollTrigger scrub.
      const proxy = { progress: 0 };

      ScrollTrigger.create({
        trigger: wrap,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        onUpdate(self) {
          proxy.progress = self.progress;
          if (gl) {
            gl.render(proxy.progress);
          } else if (cssRef.current) {
            // CSS fallback: interpolate background color.
            const mixed = mixRgb(fromRgb, toRgb, proxy.progress);
            cssRef.current.style.backgroundColor = rgbCss(mixed);
          }
        },
        invalidateOnRefresh: true,
      });

      // Resize handler.
      const onResize = () => {
        if (gl && canvas) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          gl.resize(canvas.clientWidth, canvas.clientHeight, dpr);
          gl.render(proxy.progress);
        }
      };
      window.addEventListener("resize", onResize, { passive: true });

      return () => {
        window.removeEventListener("resize", onResize);
        gl?.dispose();
      };
    },
    { scope: wrapRef, dependencies: [reduced, lowPower, fromColor, toColor] },
  );

  // Reduced motion: just show the target color immediately, no animation.
  if (reduced) {
    return (
      <Box
        aria-hidden
        sx={{
          width: "100%",
          height: SECTION_HEIGHT,
          bgcolor: toColor,
        }}
      />
    );
  }

  const useGl = !lowPower;

  return (
    <Box
      ref={wrapRef}
      aria-hidden
      className="pixel-transition-section"
      sx={{
        position: "relative",
        width: "100%",
        height: SECTION_HEIGHT,
        overflow: "hidden",
        // Start with the "from" color as initial background.
        bgcolor: fromColor,
      }}
    >
      {useGl ? (
        <canvas
          ref={canvasRef}
          aria-hidden
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            opacity: 0,
          }}
        />
      ) : (
        <Box
          ref={cssRef}
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: fromColor,
          }}
        />
      )}
    </Box>
  );
}

/* ─────────────────── WebGL helpers ─────────────────── */

interface InlineGl {
  render(progress: number): void;
  resize(w: number, h: number, dpr: number): void;
  dispose(): void;
}

function initGl(
  canvas: HTMLCanvasElement,
  fromRgb: Rgb,
  toRgb: Rgb,
  grain = 0.012,
): InlineGl | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const vs = compileShader(gl, gl.VERTEX_SHADER, GROUND_VERT);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, GROUND_FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
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

  // Set the from/to colors once (they never change for this section).
  const fromLin = toLinear(fromRgb);
  const toLin = toLinear(toRgb);
  gl.uniform3f(uFrom, fromLin[0], fromLin[1], fromLin[2]);
  gl.uniform3f(uTo, toLin[0], toLin[1], toLin[2]);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  let disposed = false;

  return {
    resize(w, h, dpr) {
      if (disposed) return;
      const pw = Math.max(1, Math.round(w * dpr));
      const ph = Math.max(1, Math.round(h * dpr));
      gl.uniform1f(uTileSize, TILE_SIZE_CSS_PX * dpr);
      if (canvas.width === pw && canvas.height === ph) return;
      canvas.width = pw;
      canvas.height = ph;
      gl.viewport(0, 0, pw, ph);
      gl.uniform2f(uRes, pw, ph);
    },
    render(progress) {
      if (disposed || gl.isContextLost()) return;
      gl.uniform1f(uProgress, progress);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
