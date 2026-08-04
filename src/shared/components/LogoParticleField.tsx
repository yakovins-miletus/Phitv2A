import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";

import { NOIR } from "@/shared/theme/palette";
import { useIsLowPowerDevice, usePointerFine, useReducedMotion } from "@/shared/motion";

/**
 * The brand mark as a cursor-reactive particle field.
 *
 * This replaced a 340-line "signal or noise" minigame that occupied the footer's
 * left column — four sparkline cards, a scoring/streak/round state machine, and a
 * next-round button, all of it competing with the navigation beside it.
 *
 * Implementation is the well-worn one for image particle fields, chosen because it
 * is the cheapest thing that works and needs no library:
 *
 *   1. Rasterise the logo SVG once into a small offscreen canvas.
 *   2. Walk its pixels on a stride and keep the opaque ones as particle origins.
 *   3. Each frame: push particles away from the cursor, spring them back to their
 *      origin, damp the velocity.
 *
 * Everything is 2D canvas and plain arithmetic — no WebGL, no physics engine, no
 * per-particle allocation after setup. Particle state lives in flat `Float32Array`s
 * rather than an array of objects, so a frame is a linear walk over contiguous
 * memory and the GC never sees it.
 *
 * Cost control, in order of how much they matter:
 *   - `prefers-reduced-motion` renders one static frame and starts no loop.
 *   - Coarse pointers get the same static frame: there is no cursor to react to,
 *     so the loop would be pure battery drain.
 *   - Low-power devices get a bigger sampling stride, so roughly a quarter of the
 *     particles.
 *   - An IntersectionObserver stops the loop whenever the footer is off-screen,
 *     which is most of the time on a 40,000px page.
 *   - `visibilitychange` stops it in a background tab.
 */

/** Offscreen raster size. Small on purpose — this is a particle *source*, not an
 *  image, and a 132px grid at stride 3 already yields ~1,100 candidate points. */
const SAMPLE_PX = 132;
/** Pixel stride when sampling. Higher = fewer particles. */
const STRIDE_HIGH = 3;
const STRIDE_LOW = 6;
/** Alpha above which a sampled pixel becomes a particle. */
const ALPHA_CUTOFF = 128;

/** Cursor influence radius in CSS px, and how hard it pushes. */
const REPEL_RADIUS = 88;
const REPEL_STRENGTH = 46;
/** Spring back toward origin, and velocity damping. Tuned together: raising
 *  stiffness without raising damping makes the mark ring like a bell. */
const SPRING = 0.055;
const DAMPING = 0.86;

const LOGO_SRC = "/phitopolis_logo_hero.svg";

interface Field {
  count: number;
  ox: Float32Array;
  oy: Float32Array;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  gold: Uint8Array;
}

/** Sample the rasterised logo into flat particle arrays. */
function buildField(img: HTMLImageElement, stride: number): Field | null {
  const off = document.createElement("canvas");
  off.width = SAMPLE_PX;
  off.height = SAMPLE_PX;
  const octx = off.getContext("2d", { willReadFrequently: true });
  if (!octx) return null;
  octx.drawImage(img, 0, 0, SAMPLE_PX, SAMPLE_PX);

  const { data } = octx.getImageData(0, 0, SAMPLE_PX, SAMPLE_PX);
  const ox: number[] = [];
  const oy: number[] = [];
  const gold: number[] = [];

  for (let py = 0; py < SAMPLE_PX; py += stride) {
    for (let px = 0; px < SAMPLE_PX; px += stride) {
      const i = (py * SAMPLE_PX + px) * 4;
      if ((data[i + 3] ?? 0) < ALPHA_CUTOFF) continue;
      ox.push(px / SAMPLE_PX);
      oy.push(py / SAMPLE_PX);
      // Keep the mark's own two-colour split: the gold inner stroke stays gold.
      // Comparing red against blue separates #FFC72C from #0A2A66 without
      // needing to know either value here.
      const r = data[i] ?? 0;
      const b = data[i + 2] ?? 0;
      gold.push(r > b + 40 ? 1 : 0);
    }
  }

  const count = ox.length;
  if (count === 0) return null;
  return {
    count,
    ox: Float32Array.from(ox),
    oy: Float32Array.from(oy),
    x: new Float32Array(count),
    y: new Float32Array(count),
    vx: new Float32Array(count),
    vy: new Float32Array(count),
    gold: Uint8Array.from(gold),
  };
}

export function LogoParticleField() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const lowPower = useIsLowPowerDevice();
  const fine = usePointerFine();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // No cursor to react to, or the user asked for less: one static frame, and
    // never a rAF loop.
    const staticOnly = reduced === true || !fine;
    const stride = lowPower ? STRIDE_LOW : STRIDE_HIGH;

    let field: Field | null = null;
    let raf = 0;
    let running = false;
    let disposed = false;
    let w = 0;
    let h = 0;
    let dpr = 1;
    // Cursor in CSS px, or null when it is not over the field.
    let mx = -9999;
    let my = -9999;

    const measure = () => {
      const rect = wrap.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      if (!field) return;
      ctx.clearRect(0, 0, w, h);
      // The mark is square; fit it to the shorter side and centre it.
      const size = Math.min(w, h) * 0.92;
      const left = (w - size) / 2;
      const top = (h - size) / 2;
      const dot = Math.max(1.05, size / SAMPLE_PX / 1.5);

      // Two passes, one fillStyle change total, instead of one per particle.
      for (let pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass === 0 ? NOIR.white : NOIR.gold;
        for (let i = 0; i < field.count; i++) {
          if (field.gold[i] !== pass) continue;
          ctx.fillRect(left + field.x[i]! * size, top + field.y[i]! * size, dot, dot);
        }
      }
    };

    const step = () => {
      if (disposed || !field) return;
      const size = Math.min(w, h) * 0.92;
      const left = (w - size) / 2;
      const top = (h - size) / 2;

      for (let i = 0; i < field.count; i++) {
        const px = left + field.x[i]! * size;
        const py = top + field.y[i]! * size;
        const dx = px - mx;
        const dy = py - my;
        const d2 = dx * dx + dy * dy;

        let ax = 0;
        let ay = 0;
        if (d2 < REPEL_RADIUS * REPEL_RADIUS && d2 > 0.01) {
          // 1/d falloff, computed from the squared distance so the only sqrt in
          // the loop is the one that is genuinely needed.
          const d = Math.sqrt(d2);
          const f = ((REPEL_RADIUS - d) / REPEL_RADIUS) * (REPEL_STRENGTH / d);
          ax = (dx * f) / size;
          ay = (dy * f) / size;
        }

        field.vx[i] = (field.vx[i]! + ax + (field.ox[i]! - field.x[i]!) * SPRING) * DAMPING;
        field.vy[i] = (field.vy[i]! + ay + (field.oy[i]! - field.y[i]!) * SPRING) * DAMPING;
        field.x[i] = field.x[i]! + field.vx[i]!;
        field.y[i] = field.y[i]! + field.vy[i]!;
      }
      draw();
      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (running || staticOnly || disposed) return;
      running = true;
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    };
    // Park the cursor far away rather than tracking a null: the physics loop then
    // needs no branch for "no cursor".
    const onPointerLeave = () => {
      mx = -9999;
      my = -9999;
    };

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (disposed) return;
      field = buildField(img, stride);
      if (!field) return;
      field.x.set(field.ox);
      field.y.set(field.oy);
      measure();
      draw();
      if (!staticOnly) {
        // Only observe once there is something to animate.
        io.observe(wrap);
        wrap.addEventListener("pointermove", onPointerMove, { passive: true });
        wrap.addEventListener("pointerleave", onPointerLeave, { passive: true });
      }
    };
    img.src = LOGO_SRC;

    // The footer sits at the bottom of a ~40,000px page; without this the loop
    // would run for the entire visit to animate something nobody is looking at.
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false;
        if (visible) start();
        else stop();
      },
      { rootMargin: "120px" },
    );

    const onVisibility = () => {
      if (document.visibilityState === "hidden") stop();
      else if (wrap.getBoundingClientRect().top < window.innerHeight) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onResize = () => {
      measure();
      draw();
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      disposed = true;
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [reduced, lowPower, fine]);

  return (
    <Box
      ref={wrapRef}
      // Decorative: the mark is already announced by the wordmark and the nav.
      aria-hidden
      sx={{
        position: "relative",
        width: "100%",
        // Square-ish without being rigid, so the footer grid keeps its rhythm.
        aspectRatio: "1 / 1",
        maxHeight: { xs: 240, md: 360 },
        touchAction: "none",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </Box>
  );
}
