import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import {
  useAnimationFrame,
  useScroll,
  useSpring,
  useVelocity,
} from "motion/react";
import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";

interface HeroNodeNetworkProps {
  /** Freeze the drift and stop its rAF loop. True whenever the wall is not on screen. */
  paused: boolean;
}

const VIP_TECH = [
  { name: "react", color: "61DAFB" },
  { name: "python", color: "3776AB" },
  { name: "postgresql", color: "4169E1" },
  { name: "kubernetes", color: "326CE5" },
  { name: "apachekafka", color: "231F20" },
  { name: "docker", color: "2496ED" },
];

interface Hub {
  x: number;
  y: number;
  vx: number;
  vy: number;
  img: HTMLImageElement | null;
  loaded: boolean;
  color: string;
  anchorX: number;
  anchorY: number;
  timeOffset: number;
  type: 'vip' | 'abstract';
}

interface Orbiter {
  hubIndex: number;
  angle: number;
  angularVelocity: number;
  orbitRadius: number;
  radius: number;
  colorType: number; // 0: white, 1: gold, 2: tech blue
}

const HUB_DRAW_SIZE = 40;

export function HeroNodeNetwork({ paused }: HeroNodeNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hubsRef = useRef<Hub[]>([]);
  const orbitersRef = useRef<Orbiter[]>([]);
  const [isHidden, setIsHidden] = useState(document.hidden);
  const reduced = useReducedMotion();
  const shouldAnimate = !paused && !reduced;
  const timeRef = useRef(0);

  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothedVelocity = useSpring(scrollVelocity, {
    damping: 40,
    stiffness: 300,
  });

  // Track document visibility
  useEffect(() => {
    const onVisibility = () => {
      setIsHidden(document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Initialize network and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let resizeTimeout: ReturnType<typeof setTimeout>;

    const initNetwork = (width: number, height: number) => {
      const centerX = width / 2;
      const centerY = height / 2;
      
      const innerRadiusX = Math.min(width * 0.35, 450); 
      const innerRadiusY = Math.min(height * 0.35, 280);
      
      const outerRadiusX = Math.min(width * 0.6, 800);
      const outerRadiusY = Math.min(height * 0.6, 500);

      const allHubs: Hub[] = [];

      // 1. Initialize Inner VIP Hubs
      VIP_TECH.forEach((tech, i) => {
        const img = new Image();
        img.src = `https://cdn.simpleicons.org/${tech.name}/white`; 
        
        const angle = (i / VIP_TECH.length) * Math.PI * 2;
        const offsetAngle = angle + Math.PI / 8;
        
        const anchorX = centerX + Math.cos(offsetAngle) * innerRadiusX;
        const anchorY = centerY + Math.sin(offsetAngle) * innerRadiusY;

        const hub: Hub = {
          x: anchorX,
          y: anchorY,
          vx: 0,
          vy: 0,
          img,
          loaded: false,
          color: tech.color,
          anchorX,
          anchorY,
          timeOffset: Math.random() * Math.PI * 2,
          type: 'vip',
        };
        img.onload = () => { hub.loaded = true; };
        allHubs.push(hub);
      });

      // 2. Initialize Outer Abstract Hubs
      const NUM_OUTER_HUBS = 10;
      for (let i = 0; i < NUM_OUTER_HUBS; i++) {
        const angle = (i / NUM_OUTER_HUBS) * Math.PI * 2;
        const offsetAngle = angle + Math.random() * 0.5; // More random placement
        
        const anchorX = centerX + Math.cos(offsetAngle) * (outerRadiusX + (Math.random() - 0.5) * 100);
        const anchorY = centerY + Math.sin(offsetAngle) * (outerRadiusY + (Math.random() - 0.5) * 100);

        allHubs.push({
          x: anchorX,
          y: anchorY,
          vx: 0,
          vy: 0,
          img: null,
          loaded: true,
          color: 'white',
          anchorX,
          anchorY,
          timeOffset: Math.random() * Math.PI * 2,
          type: 'abstract',
        });
      }

      hubsRef.current = allHubs;

      // 3. Initialize Orbiters
      const orbiters: Orbiter[] = [];
      allHubs.forEach((hub, hubIndex) => {
        // Outer hubs have fewer orbiters
        const isVip = hub.type === 'vip';
        const numOrbiters = isVip 
          ? Math.floor(Math.random() * 5) + 8 
          : Math.floor(Math.random() * 4) + 4;

        for (let i = 0; i < numOrbiters; i++) {
          const rand = Math.random();
          let colorType = 0;
          if (rand > 0.85) colorType = 1; 
          else if (rand > 0.7) colorType = 2; 

          orbiters.push({
            hubIndex,
            angle: Math.random() * Math.PI * 2,
            angularVelocity: (Math.random() - 0.5) * 0.008,
            orbitRadius: Math.random() * (isVip ? 90 : 70) + (isVip ? 50 : 30), 
            radius: Math.random() * 2 + 1.5,
            colorType,
          });
        }
      });
      orbitersRef.current = orbiters;
    };

    const handleResize = () => {
      if (!canvas || !container) return;
      const { clientWidth, clientHeight } = container;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
      
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);

      initNetwork(clientWidth, clientHeight);
    };

    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 200);
    };

    window.addEventListener("resize", debouncedResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  useAnimationFrame((_, delta) => {
    if (!shouldAnimate || isHidden || !canvasRef.current || !containerRef.current) return;
    
    timeRef.current += delta * 0.0005;
    const time = timeRef.current;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Drastically reduced scroll parallax effect
    const speedMultiplier = 1 + Math.abs(smoothedVelocity.get()) / 4000;
    const yDrift = smoothedVelocity.get() / 4000; 

    const hubs = hubsRef.current;
    const orbiters = orbitersRef.current;

    // Update and draw Hubs
    for (let i = 0; i < hubs.length; i++) {
      const hub = hubs[i];
      if (!hub) continue;

      // Float gently around their anchor point using a Lissajous curve
      hub.x = hub.anchorX + Math.cos(time + hub.timeOffset) * 30;
      hub.y = hub.anchorY + Math.sin(time * 0.8 + hub.timeOffset) * 20 + yDrift * 100;

      // Draw hub background glow
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, HUB_DRAW_SIZE / 1.5, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, HUB_DRAW_SIZE);
      gradient.addColorStop(0, `rgba(10, 42, 102, 0.8)`); 
      gradient.addColorStop(1, `rgba(10, 42, 102, 0)`);
      ctx.fillStyle = gradient;
      ctx.fill();

      if (hub.type === 'vip') {
        // Draw Hub Image
        if (hub.loaded && hub.img) {
          ctx.globalAlpha = 0.7;
          ctx.drawImage(
            hub.img, 
            hub.x - HUB_DRAW_SIZE / 2, 
            hub.y - HUB_DRAW_SIZE / 2, 
            HUB_DRAW_SIZE, 
            HUB_DRAW_SIZE
          );
          ctx.globalAlpha = 1.0;
        }
      } else {
        // Draw Abstract Hub Core
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fill();
      }
    }

    // Update and draw Orbiters & Connections
    for (let i = 0; i < orbiters.length; i++) {
      const orbiter = orbiters[i];
      if (!orbiter) continue;
      const hub = hubs[orbiter.hubIndex];
      if (!hub) continue;

      // Update orbital angle
      orbiter.angle += orbiter.angularVelocity * speedMultiplier;

      // Calculate absolute position
      const ox = hub.x + Math.cos(orbiter.angle) * orbiter.orbitRadius;
      const oy = hub.y + Math.sin(orbiter.angle) * orbiter.orbitRadius;

      // Draw connection line to hub
      // Fade lines out as they get further from the hub
      const opacity = Math.max(0.05, 0.4 - (orbiter.orbitRadius / 200));
      ctx.beginPath();
      ctx.moveTo(hub.x, hub.y);
      ctx.lineTo(ox, oy);
      ctx.strokeStyle = `rgba(167, 175, 213, ${opacity})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Optional: draw lines between orbiters of the same hub if they are close
      for (let j = i + 1; j < orbiters.length; j++) {
        const other = orbiters[j];
        if (other && other.hubIndex === orbiter.hubIndex) {
          const ox2 = hub.x + Math.cos(other.angle) * other.orbitRadius;
          const oy2 = hub.y + Math.sin(other.angle) * other.orbitRadius;
          const dx = ox - ox2;
          const dy = oy - oy2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(ox2, oy2);
            ctx.strokeStyle = `rgba(167, 175, 213, ${0.2 * (1 - dist/60)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw Orbiter node
      ctx.beginPath();
      ctx.arc(ox, oy, orbiter.radius, 0, Math.PI * 2);
      
      if (orbiter.colorType === 1) {
        ctx.fillStyle = "rgba(255, 199, 44, 0.9)"; // NOIR.gold
      } else if (orbiter.colorType === 2) {
        ctx.fillStyle = "rgba(80, 155, 217, 0.9)"; // Tech dev blue
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)"; // White base
      }
      ctx.fill();
    }
  });

  return (
    <Box
      ref={containerRef}
      aria-hidden
      sx={{
        position: "absolute",
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        zIndex: 2,
        overflow: "hidden",
        pointerEvents: "none",
        bgcolor: NOIR.navyDeep,
        opacity: "var(--hp-g, 0)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </Box>
  );
}
