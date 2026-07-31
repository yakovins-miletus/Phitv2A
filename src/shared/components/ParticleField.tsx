import Box from "@mui/material/Box";
import { useEffect, useRef } from "react";

import { usePreloaderReady, useReducedMotion } from "@/shared/motion";

import { NOIR } from "@/shared/theme/palette";

// Ambient data-point constellation (canvas 2D, no WebGL): drifting gold
// particles with proximity lines, easing away from the pointer. One rAF
// owner, paused when the tab is hidden OR the canvas is scrolled off screen,
// absent under reduced motion.

const GOLD = NOIR.goldRgb;
const LINE_DIST = 130;
const POINTER_RADIUS = 140;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function createParticles(width: number, height: number): Particle[] {
  const count = width < 900 ? 60 : 120;
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
  }));
}

export function ParticleField() {
  const reduced = useReducedMotion();
  const ready = usePreloaderReady();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced === true) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas === null || context === null || context === undefined) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    const pointer = { x: -9999, y: -9999 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(width, height);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    const onPointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    let rafId = 0;
    let running = false;
    let onScreen = true;
    const frame = () => {
      if (!running) return;
      context.clearRect(0, 0, width, height);
      for (const p of particles) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < POINTER_RADIUS && dist > 0) {
          const push = (POINTER_RADIUS - dist) / POINTER_RADIUS;
          p.x += (dx / dist) * push * 1.6;
          p.y += (dy / dist) * push * 1.6;
        }
        p.x = (p.x + p.vx + width) % width;
        p.y = (p.y + p.vy + height) % height;
      }
      // 1. Draw connection lines in a single batched path
      context.lineWidth = 1;
      context.strokeStyle = `rgba(${GOLD}, 0.06)`;
      context.beginPath();
      const lineDistSq = LINE_DIST * LINE_DIST;
      for (let i = 0; i < particles.length; i += 1) {
        const a = particles[i];
        if (a === undefined) continue;
        for (let j = i + 1; j < particles.length; j += 1) {
          const b = particles[j];
          if (b === undefined) continue;
          
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < lineDistSq) {
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
          }
        }
      }
      context.stroke();

      // 2. Draw all particle circles in a single batched path
      context.fillStyle = `rgba(${GOLD}, 0.55)`;
      context.beginPath();
      for (let i = 0; i < particles.length; i += 1) {
        const a = particles[i];
        if (a === undefined) continue;
        context.moveTo(a.x + 1.4, a.y);
        context.arc(a.x, a.y, 1.4, 0, Math.PI * 2);
      }
      context.fill();

      rafId = requestAnimationFrame(frame);
    };

    // Single gate for the rAF loop: draw only while the tab is visible AND
    // the canvas itself is on screen AND the preloader is finished.
    const syncLoop = () => {
      const shouldRun = ready && onScreen && !document.hidden;
      if (shouldRun && !running) {
        running = true;
        rafId = requestAnimationFrame(frame);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(rafId);
      }
    };
    const onVisibility = () => {
      syncLoop();
    };
    const observer = new IntersectionObserver((entries) => {
      onScreen = entries[0]?.isIntersecting ?? true;
      syncLoop();
    });
    observer.observe(canvas);

    resize();
    syncLoop();
    window.addEventListener("resize", resize);
    canvas.parentElement?.addEventListener("pointermove", onPointerMove);
    canvas.parentElement?.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      canvas.parentElement?.removeEventListener("pointermove", onPointerMove);
      canvas.parentElement?.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced, ready]);

  if (reduced === true) return null;

  return (
    <Box
      component="canvas"
      ref={canvasRef}
      aria-hidden
      sx={{ position: "absolute", inset: 0, width: 1, height: 1, pointerEvents: "none" }}
    />
  );
}
