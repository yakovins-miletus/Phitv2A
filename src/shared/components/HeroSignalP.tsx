import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";

// 1 unified speed constant for all signals across all loops (pixels per millisecond).
const SIGNAL_SPEED_PX_PER_MS = 0.25;

// Grid cell base dimension in pixels (enlarged from 32px to 42px)
const GRID_CELL = 42;

const CUBE_POSITIONS = [
  // Outer perimeter cubes
  { c: 0, r: 1, h: 58, type: "gold" },
  { c: 21, r: 1, h: 65, type: "navy" },
  { c: 0, r: 20, h: 40, type: "gold" },
  { c: 21, r: 20, h: 46, type: "gold" },
  { c: 0, r: 11, h: 32, type: "navy" },
  { c: 21, r: 11, h: 52, type: "gold" },
  { c: 11, r: 0, h: 70, type: "navy" },
  { c: 11, r: 21, h: 40, type: "gold" },

  // Mid perimeter cubes
  { c: 1, r: 6, h: 32, type: "gold" },
  { c: 20, r: 6, h: 46, type: "gold" },
  { c: 1, r: 16, h: 52, type: "gold" },
  { c: 20, r: 16, h: 40, type: "navy" },
  { c: 6, r: 1, h: 36, type: "gold" },
  { c: 16, r: 1, h: 58, type: "navy" },
  { c: 6, r: 20, h: 46, type: "gold" },
  { c: 16, r: 20, h: 52, type: "navy" },
];

function getCubeBaseRgb(type: string) {
  return type === "navy" ? NOIR.navyFieldRgb : NOIR.goldRgb;
}

// ── Continuous closed-loop signal circuits (1 speed constant, 0% overlapping)
interface Point2D {
  x: number;
  y: number;
}

interface SignalLoop {
  waypoints: Point2D[];
  color: string;
  pulseOffsets: number[];
}

function buildSignalLoops(): SignalLoop[] {
  const halfCell = 21;

  // 4 Service Nodes framing the 4 corners around the central P Logo (exact center of grid intersections c=5, 17)
  const quantNode = { x: 5 * GRID_CELL, y: 5 * GRID_CELL };
  const fullstackNode = { x: 17 * GRID_CELL, y: 5 * GRID_CELL };
  const opsNode = { x: 17 * GRID_CELL, y: 17 * GRID_CELL };
  const dataNode = { x: 5 * GRID_CELL, y: 17 * GRID_CELL };

  // Outer perimeter nodes
  const outerTL = { x: 0 * GRID_CELL + halfCell, y: 0 * GRID_CELL + halfCell };
  const outerTR = { x: 21 * GRID_CELL + halfCell, y: 0 * GRID_CELL + halfCell };
  const outerBR = { x: 21 * GRID_CELL + halfCell, y: 21 * GRID_CELL + halfCell };
  const outerBL = { x: 0 * GRID_CELL + halfCell, y: 21 * GRID_CELL + halfCell };

  // Mid perimeter nodes
  const midTL = { x: 1 * GRID_CELL + halfCell, y: 1 * GRID_CELL + halfCell };
  const midTR = { x: 20 * GRID_CELL + halfCell, y: 1 * GRID_CELL + halfCell };
  const midBR = { x: 20 * GRID_CELL + halfCell, y: 20 * GRID_CELL + halfCell };
  const midBL = { x: 1 * GRID_CELL + halfCell, y: 20 * GRID_CELL + halfCell };

  // Loop 1: Inner IT Quad Circuit — Orbiting directly around the central P logo through 4 icon centers
  const loop1Waypoints: Point2D[] = [
    quantNode,
    fullstackNode,
    opsNode,
    dataNode,
    quantNode,
  ];

  // Loop 2: Mid-Perimeter Highway
  const loop2Waypoints: Point2D[] = [
    midTL,
    midTR,
    midBR,
    midBL,
    midTL,
  ];

  // Loop 3: Outer Grid Boundary
  const loop3Waypoints: Point2D[] = [
    outerTL,
    outerTR,
    outerBR,
    outerBL,
    outerTL,
  ];

  return [
    { waypoints: loop1Waypoints, color: NOIR.goldRgb, pulseOffsets: [0, 0.5] },
    { waypoints: loop2Waypoints, color: NOIR.navyFieldRgb, pulseOffsets: [0.25, 0.75] },
    { waypoints: loop3Waypoints, color: NOIR.goldRgb, pulseOffsets: [0.1, 0.6] },
  ];
}

const SIGNAL_LOOPS = buildSignalLoops();

function GridSignals({ reduced, progress = 0 }: { reduced: boolean | undefined; progress?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasOpacity = Math.max(0, 1 - progress * 2.2);

  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (reduced === true) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isVisible = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      if (!isVisible || progressRef.current > 0.45) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const elapsed = now - start;

      for (const loop of SIGNAL_LOOPS) {
        const pts = loop.waypoints;
        if (pts.length < 2) continue;

        // Calculate segment lengths & total loop length
        const segLens: number[] = [];
        let totalL = 0;
        for (let i = 0; i < pts.length; i++) {
          const p1 = pts[i]!;
          const p2 = pts[(i + 1) % pts.length]!;
          const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          segLens.push(len);
          totalL += len;
        }

        if (totalL === 0) continue;

        // Helper to get point at distance d along loop
        const getPointAtLoop = (dist: number) => {
          let d = ((dist % totalL) + totalL) % totalL;
          for (let i = 0; i < pts.length; i++) {
            const len = segLens[i]!;
            if (d <= len) {
              const t = len === 0 ? 0 : d / len;
              const p1 = pts[i]!;
              const p2 = pts[(i + 1) % pts.length]!;
              return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
            }
            d -= len;
          }
          return pts[0]!;
        };

        const lineLen = 38; // Shortened tail length of moving pulse

        for (const offset of loop.pulseOffsets) {
          // Exact linear speed across all loop tracks (1 speed constant)
          const headD = (elapsed * SIGNAL_SPEED_PX_PER_MS + offset * totalL) % totalL;
          const numSamples = 14; // Smooth sub-segment tracing

          ctx.beginPath();
          ctx.lineWidth = 5.5;
          ctx.lineCap = "round";
          ctx.strokeStyle = `rgba(${loop.color}, 0.95)`;
          ctx.shadowColor = `rgba(${loop.color}, 0.9)`;
          ctx.shadowBlur = 14;

          for (let s = 0; s <= numSamples; s++) {
            const sampleD = headD - (lineLen * (numSamples - s)) / numSamples;
            const pt = getPointAtLoop(sampleD);
            if (s === 0) {
              ctx.moveTo(pt.x, pt.y);
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Draw subtle node glow interaction when Loop 1 pulses are close to node centers
          if (loop.color === NOIR.goldRgb) {
            const side = 12 * GRID_CELL;
            const nodePositions = [
              { x: 5 * GRID_CELL, y: 5 * GRID_CELL, dist: 0 },
              { x: 17 * GRID_CELL, y: 5 * GRID_CELL, dist: side },
              { x: 17 * GRID_CELL, y: 17 * GRID_CELL, dist: 2 * side },
              { x: 5 * GRID_CELL, y: 17 * GRID_CELL, dist: 3 * side },
            ];

            for (const node of nodePositions) {
              const distDiff = Math.abs(headD - node.dist);
              const distToNode = Math.min(distDiff, totalL - distDiff);

              if (distToNode < 90) {
                const intensity = (1 - distToNode / 90) * 0.42 * canvasOpacity;
                if (intensity > 0.01) {
                  ctx.save();
                  ctx.beginPath();
                  const grad = ctx.createRadialGradient(node.x, node.y, 10, node.x, node.y, 48);
                  grad.addColorStop(0, `rgba(255, 199, 44, ${intensity * 0.8})`);
                  grad.addColorStop(0.4, `rgba(255, 199, 44, ${intensity * 0.28})`);
                  grad.addColorStop(1, "rgba(255, 199, 44, 0)");
                  ctx.fillStyle = grad;
                  ctx.arc(node.x, node.y, 48, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.restore();
                }
              }
            }
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  if (reduced === true) {
    return (
      <svg aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, opacity: canvasOpacity }}>
        {SIGNAL_LOOPS.map((loop, i) => (
          <polyline
            key={i}
            points={loop.waypoints.map(p => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={`rgba(${loop.color}, 0.12)`}
            strokeWidth={2}
          />
        ))}
      </svg>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        transform: "translateZ(-1px)",
        opacity: canvasOpacity,
        transition: "opacity 0.2s ease-out",
      }}
    />
  );
}

function IsometricCube({
  x,
  y,
  size,
  height,
  type,
  progress = 0,
}: {
  x: number;
  y: number;
  size: number;
  height: number;
  type: string;
  progress?: number;
}) {
  const rgb = getCubeBaseRgb(type);

  // Use an opaque base
  const baseColor = `rgb(${rgb})`;

  const leftDark = 0.32;
  const rightDark = 0.5;

  const sideOpacity = Math.max(0, 1 - progress * 1.8);
  const currentH = Math.max(0, height * (1 - progress));
  const shadowOffset = Math.round(currentH * 0.28);

  const topBg = `linear-gradient(to bottom, rgba(255,255,255,${0.32 * sideOpacity}) 0%, rgba(255,255,255,${0.05 * sideOpacity}) 100%), ${baseColor}`;
  const leftBg = `linear-gradient(to bottom left, rgba(255,255,255,0.12) 0%, rgba(0,0,0,${leftDark}) 100%), ${baseColor}`;
  const rightBg = `linear-gradient(to bottom right, rgba(0,0,0,0.12) 0%, rgba(0,0,0,${rightDark}) 100%), ${baseColor}`;

  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Soft Extended Cast Shadow on Ground Plane */}
      <Box
        sx={{
          position: "absolute",
          inset: -size * 0.3,
          background: `radial-gradient(ellipse at center, rgba(10, 24, 51, 0.45) 0%, rgba(10, 24, 51, 0.15) 55%, transparent 80%)`,
          filter: "blur(9px)",
          transform: `translateZ(0px) translate(-${shadowOffset}px, ${shadowOffset}px) scale(1.15)`,
          opacity: sideOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Dark Contact Base Shadow */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "rgba(10, 24, 51, 0.55)",
          filter: "blur(3px)",
          transform: "translateZ(0.5px) scale(1.02)",
          opacity: sideOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Top Face — fades out fully during 3D→2D so only P logo remains */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: topBg,
          boxShadow: sideOpacity > 0.05 ? `inset 0 0 10px rgba(255,255,255,0.25), 0 0 18px rgba(${rgb}, 0.25)` : "none",
          transform: `translateZ(${currentH}px)`,
          opacity: Math.max(0, 1 - progress * 2),
        }}
      />

      {/* 3D Side Walls (Hidden when progress reaches 1) */}
      {sideOpacity > 0.01 && currentH > 1 && (
        <>
          {/* Left Face (-X wall, faces Bottom-Left on screen) */}
          <Box
            sx={{
              position: "absolute",
              width: currentH,
              height: size,
              left: 0,
              top: 0,
              opacity: sideOpacity,
              background: leftBg,
              transform: `translateX(${-currentH / 2}px) translateZ(${currentH / 2}px) rotateY(-90deg)`,
            }}
          />
          {/* Right Face (+Y wall, faces Bottom-Right on screen) */}
          <Box
            sx={{
              position: "absolute",
              width: size,
              height: currentH,
              left: 0,
              top: 0,
              opacity: sideOpacity,
              background: rightBg,
              transform: `translateY(${size - currentH / 2}px) translateZ(${currentH / 2}px) rotateX(-90deg)`,
            }}
          />
        </>
      )}
    </Box>
  );
}

export function ElevatedServiceNode({
  x,
  y,
  elevation = 20,
  color,
  children,
  progress = 0,
}: {
  x: number;
  y: number;
  elevation?: number;
  color: string;
  children: React.ReactNode;
  progress?: number;
}) {
  const size = 60;
  const sideOpacity = Math.max(0, 1 - progress * 1.8);
  const currentElevation = Math.max(0, elevation * (1 - progress));
  const numLayers = Math.max(1, Math.round(16 * (1 - progress)));
  const shadowOffset = Math.round(currentElevation * 0.45);

  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Ground Cast Shadow */}
      <Box
        sx={{
          position: "absolute",
          inset: -size * 0.25,
          background: "radial-gradient(ellipse at center, rgba(10, 24, 51, 0.65) 0%, rgba(10, 24, 51, 0.2) 55%, transparent 80%)",
          filter: "blur(10px)",
          transform: `translateZ(0px) translate(-${shadowOffset}px, ${shadowOffset}px) scale(1.15)`,
          opacity: sideOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Base Contact Shadow */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "14px",
          background: "rgba(4, 10, 24, 0.8)",
          filter: "blur(4px)",
          transform: "translateZ(0.5px) scale(1.04)",
          opacity: sideOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Solid Rounded 3D Extrusion Slabs (Hidden when progress reaches 1) */}
      {sideOpacity > 0.01 && numLayers > 1 && Array.from({ length: numLayers }).map((_, i) => {
        const z = (i / (numLayers - 1)) * currentElevation;
        const ratio = i / (numLayers - 1);
        const r = Math.round(6 + (10 - 6) * ratio);
        const g = Math.round(14 + (24 - 14) * ratio);
        const b = Math.round(32 + (51 - 32) * ratio);

        return (
          <Box
            key={i}
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "14px",
              bgcolor: `rgb(${r}, ${g}, ${b})`,
              opacity: sideOpacity,
              transform: `translateZ(${z.toFixed(1)}px)`,
              pointerEvents: "none",
            }}
          />
        );
      })}

      {/* Elevated Top Face (Icon Card with Accent Border) — elevated clearly above top slab to prevent coplanar clipping */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "14px",
          bgcolor: "rgba(10, 24, 51, 0.98)",
          border: `2px solid ${color}`,
          boxShadow: sideOpacity > 0.05 ? `0 0 28px ${alpha(color, 0.5)}, inset 0 0 14px ${alpha(color, 0.2)}` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateZ(${(currentElevation + 4.5).toFixed(1)}px)`,
          transformStyle: "preserve-3d",
          opacity: Math.max(0, 1 - progress * 2),
        }}
      >
        <Box sx={{ position: "relative", transform: "translateZ(3px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export function HeroSignalP({ progress = 0 }: { progress?: number }) {
  const reduced = useReducedMotion();
  
  // If reduced motion is requested, instantly render the final 2D shifted layout
  const effectiveProgress = reduced ? 1 : progress;

  // Phase 1 (0 to 0.45): 3D to 2D flattening
  const progress3dTo2d = Math.min(1, effectiveProgress / 0.45);

  // Phase 2 (0.45 to 0.75): P logo shifts left (desktop/tablet) or up (mobile)
  const progressMoveLeft = effectiveProgress <= 0.45 ? 0 : effectiveProgress >= 0.75 ? 1 : (effectiveProgress - 0.45) / 0.3;

  const rotX = 55 * (1 - progress3dTo2d);
  const rotZ = -45 * (1 - progress3dTo2d);
  const wrapperScale = 1.25 - 0.25 * progress3dTo2d;
  const sideOpacity = Math.max(0, 1 - progress3dTo2d * 1.8);
  const logoLayers = Math.max(1, Math.round(12 * (1 - progress3dTo2d)));

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "visible",
        transformStyle: "preserve-3d",
        animation: reduced === true ? "none" : "simpleFadeIn 1.5s ease-in forwards",
        "@keyframes simpleFadeIn": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      }}
    >

      {/* 3D Isometric Container — Enlarged Scale */}
      <Box
        sx={{
          position: "relative",
          width: { xs: "640px", sm: "840px", md: "1020px", lg: "1160px" },
          height: { xs: "640px", sm: "840px", md: "1020px", lg: "1160px" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: "1600px",
          transformStyle: "preserve-3d",
          animation: reduced === true ? "none" : "sceneExpand 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          "@keyframes sceneExpand": {
            "0%": { transform: "scale(0.65)", opacity: 0 },
            "100%": { transform: "scale(1)", opacity: 1 },
          },
        }}
      >
        {/* Global Isometric Wrapper — Smoothly interpolates from 3D isometric to flat 2D */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transformStyle: "preserve-3d",
            transform: `scale(${wrapperScale.toFixed(3)}) rotateX(${rotX.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg)`,
            transition: "transform 0.1s linear",
          }}
        >
          {/* Extended Outer Isometric Grid Field (Infinite feel with radial gradient mask blur fade) */}
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "2800px",
              height: "2800px",
              transform: "translate(-50%, -50%) translateZ(-2px)",
              backgroundImage: `
                linear-gradient(rgba(${NOIR.navyFieldRgb}, 0.075) 1px, transparent 1px),
                linear-gradient(90deg, rgba(${NOIR.navyFieldRgb}, 0.075) 1px, transparent 1px)
              `,
              backgroundSize: `${GRID_CELL}px ${GRID_CELL}px`,
              backgroundPosition: "center center",
              maskImage: "radial-gradient(circle at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.12) 68%, transparent 82%)",
              WebkitMaskImage: "radial-gradient(circle at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.12) 68%, transparent 82%)",
              pointerEvents: "none",
              zIndex: 0,
              opacity: Math.max(0, 1 - progress * 1.5),
            }}
          />

          {/* Isometric Grid Field Container — 924px x 924px (22 cells) */}
          <Box
            sx={{
              position: "relative",
              width: `${22 * GRID_CELL}px`,
              height: `${22 * GRID_CELL}px`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Core Focal Grid Base */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
                  linear-gradient(rgba(${NOIR.navyFieldRgb}, 0.11) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(${NOIR.navyFieldRgb}, 0.11) 1px, transparent 1px)
                `,
                backgroundSize: `${GRID_CELL}px ${GRID_CELL}px`,
                backgroundPosition: "center center",
                maskImage: "radial-gradient(circle at center, black 60%, rgba(0,0,0,0.4) 85%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(circle at center, black 60%, rgba(0,0,0,0.4) 85%, transparent 100%)",
                transform: "translateZ(-1px)",
                zIndex: 0,
                opacity: Math.max(0, 1 - progress * 1.5),
              }}
            />

            {/* Moving signals between boxes, on the grid plane */}
            <GridSignals reduced={reduced ?? undefined} progress={progress3dTo2d} />

            {/* 3D Cubes & Service Cards Layer */}
            {progress3dTo2d < 0.95 && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  transformStyle: "preserve-3d",
                  zIndex: 1,
                }}
              >
                {CUBE_POSITIONS.map((pos, i) => (
                  <IsometricCube
                    key={i}
                    x={pos.c * GRID_CELL}
                    y={pos.r * GRID_CELL}
                    size={GRID_CELL}
                    height={pos.h}
                    type={pos.type}
                    progress={progress3dTo2d}
                  />
                ))}

                {/* Elevated 3D Isometric IT Service Nodes */}
                <ElevatedServiceNode
                  x={5 * GRID_CELL - 30}
                  y={5 * GRID_CELL - 30}
                  elevation={28}
                  color={NOIR.gold}
                  progress={progress3dTo2d}
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={NOIR.gold} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </ElevatedServiceNode>

                <ElevatedServiceNode
                  x={17 * GRID_CELL - 30}
                  y={5 * GRID_CELL - 30}
                  elevation={28}
                  color={NOIR.gold}
                  progress={progress3dTo2d}
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={NOIR.gold} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </ElevatedServiceNode>

                <ElevatedServiceNode
                  x={5 * GRID_CELL - 30}
                  y={17 * GRID_CELL - 30}
                  elevation={28}
                  color={NOIR.gold}
                  progress={progress3dTo2d}
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={NOIR.gold} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </ElevatedServiceNode>

                <ElevatedServiceNode
                  x={17 * GRID_CELL - 30}
                  y={17 * GRID_CELL - 30}
                  elevation={28}
                  color={NOIR.gold}
                  progress={progress3dTo2d}
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={NOIR.gold} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </ElevatedServiceNode>
              </Box>
            )}

            {/* Ground Cast Shadow Base for P Logo (Fades out as scene flattens) */}
            {sideOpacity > 0.01 && (
              <>
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: "100%",
                    maxWidth: "460px",
                    height: "460px",
                    background: "radial-gradient(ellipse at center, rgba(10, 24, 51, 0.18) 0%, rgba(10, 24, 51, 0.05) 55%, transparent 80%)",
                    filter: "blur(14px)",
                    transform: "translate(-50%, -50%) translateZ(0px) translate(-10px, 10px) scale(1.05)",
                    zIndex: 0,
                    opacity: sideOpacity,
                    pointerEvents: "none",
                  }}
                />
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: "100%",
                    maxWidth: "420px",
                    transform: "translate(-50%, -50%) translateZ(0.2px) translate(-10px, 10px)",
                    opacity: 0.18 * sideOpacity,
                    zIndex: 0,
                    pointerEvents: "none",
                  }}
                >
                  <img
                    src="/phitopolis_logo_hero.svg"
                    alt=""
                    style={{
                      width: "100%",
                      height: "auto",
                      filter: "brightness(0) blur(10px)",
                      display: "block",
                    }}
                  />
                </Box>
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: "100%",
                    maxWidth: "420px",
                    transform: "translate(-50%, -50%) translateZ(0.5px) scale(1.01)",
                    opacity: 0.22 * sideOpacity,
                    zIndex: 0,
                    pointerEvents: "none",
                  }}
                >
                  <img
                    src="/phitopolis_logo_hero.svg"
                    alt=""
                    style={{
                      width: "100%",
                      height: "auto",
                      filter: "brightness(0) blur(4px)",
                      display: "block",
                    }}
                  />
                </Box>
              </>
            )}

            {/* Level 3D P Logo — Flattens to Z(0) on scroll, then shifts left (desktop) or up (mobile) */}
            <Box
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "100%",
                maxWidth: { xs: "200px", sm: "280px", md: "380px" },
                transformStyle: "preserve-3d",
                zIndex: 2,
                pointerEvents: "none",
                transform: {
                  xs: `translate(-50%, calc(-50% - ${progressMoveLeft * 160}px)) translateZ(${Math.round(8 * (1 - progress3dTo2d))}px) scale(${1 - progressMoveLeft * 0.25})`,
                  sm: `translate(calc(-50% - ${progressMoveLeft * 220}px), -50%) translateZ(${Math.round(8 * (1 - progress3dTo2d))}px)`,
                  md: `translate(calc(-50% - ${progressMoveLeft * 320}px), -50%) translateZ(${Math.round(8 * (1 - progress3dTo2d))}px)`,
                },
                transition: "transform 0.05s linear",
              }}
            >
              {Array.from({ length: logoLayers }).map((_, i) => {
                const isTop = i === logoLayers - 1;
                return (
                  <img
                    key={i}
                    src="/phitopolis_logo_hero.svg"
                    alt={isTop ? "Phitopolis Logo" : ""}
                    aria-hidden={!isTop}
                    style={{
                      position: isTop ? "relative" : "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "auto",
                      display: "block",
                      transform: `translateZ(${i - (logoLayers - 1)}px)`,
                      filter: isTop ? "none" : "brightness(0.85)",
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

