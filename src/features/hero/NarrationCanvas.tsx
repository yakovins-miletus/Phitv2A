import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";

interface NarrationCanvasProps {
  activeBeat: number; // 0: Executive Summary, 1: Pillars, 2: Differentiators, 3: Leadership/CTA
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

/**
 * High-performance 2D HTML5 canvas rendering an ambient quantitative network background
 * with phase-responsive geometric core graphics.
 */
export function NarrationCanvas({ activeBeat }: NarrationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const beatRef = useRef(activeBeat);
  const reduced = useReducedMotion();

  useEffect(() => {
    beatRef.current = activeBeat;
  }, [activeBeat]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Seed particles
    const particleCount = 55;
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.45 + 0.2,
    }));

    let rotationAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      rotationAngle += 0.003;

      const cx = width / 2;
      const cy = height * 0.48;
      const beat = beatRef.current;

      // Grid mesh
      ctx.strokeStyle = "rgba(212, 160, 23, 0.05)";
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Particles & Links
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `rgba(212, 160, 23, ${p.alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(212, 160, 23, ${0.12 * (1 - dist / 130)})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      // Central Geometric Core Graphics per Phase
      ctx.save();
      ctx.strokeStyle = NOIR.gold;
      ctx.lineWidth = 2;

      if (beat === 0) {
        // Executive Summary Rings
        [80, 140, 200].forEach((r, i) => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, rotationAngle * (i % 2 === 0 ? 1 : -1), rotationAngle + Math.PI * 1.5);
          ctx.stroke();
        });
      } else if (beat === 1) {
        // 3 Pillars Triangular Matrix
        for (let i = 0; i < 3; i++) {
          const angle = (i * 2 * Math.PI) / 3 + rotationAngle;
          const px = cx + 160 * Math.cos(angle);
          const py = cy + 160 * Math.sin(angle);
          ctx.beginPath();
          ctx.arc(px, py, 24, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      } else if (beat === 2) {
        // 4 Differentiators Quadrant Diamond
        const sides = 4;
        const radius = 180;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides + rotationAngle + Math.PI / 4;
          const px = cx + radius * Math.cos(angle);
          const py = cy + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      } else {
        // Leadership & Credibility Hexagonal Shield Core
        const sides = 6;
        const radius = 190;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides + rotationAngle;
          const px = cx + radius * Math.cos(angle);
          const py = cy + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = "rgba(212, 160, 23, 0.08)";
        ctx.fill();
      }

      ctx.restore();

      if (!reduced) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [reduced]);

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </Box>
  );
}
