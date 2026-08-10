import { useRef, useMemo } from "react";
import Box from "@mui/material/Box";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Sphere } from "@react-three/drei";
import * as THREE from "three";

import { NOIR } from "@/shared/theme/palette";
import { GROUNDS } from "@/shared/theme/grounds";
import { homeSection } from "@/shared/sections";

const GROUND = GROUNDS[homeSection("hero-mission").ground ?? "panel"];

// Coordinates matching REACH from ReachMap.tsx
const HQ = { lon: 121.0, lat: 14.6 }; // Manila
const REACH_NODES = [
  { lon: -74.0, lat: 40.7 }, // New York
  { lon: -80.2, lat: 25.7 }, // Miami
  { lon: -0.13, lat: 51.5 }, // London
  { lon: 114.17, lat: 22.32 }, // Hong Kong
];

const MERIDIANS = 12;
const PARALLELS = [-60, -40, -20, 0, 20, 40, 60];

function getCartesian(lat: number, lon: number, radius = 1): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 90) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function getArcPoints(startLat: number, startLon: number, endLat: number, endLon: number, radius = 1) {
  const start = getCartesian(startLat, startLon, radius);
  const end = getCartesian(endLat, endLon, radius);
  const points: THREE.Vector3[] = [];
  const segments = 40;
  const distance = start.distanceTo(end);
  const maxLift = Math.min(distance * 0.35, 0.4); 
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = start.clone().lerp(end, t).normalize(); 
    const lift = radius + maxLift * Math.sin(t * Math.PI);
    point.multiplyScalar(lift);
    points.push(point);
  }
  return points;
}

// Generate points for a circle
function getCirclePoints(radius: number, segments = 64) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
  }
  return points;
}

function GlobeModel() {
  const group = useRef<THREE.Group>(null);

  // Wireframe geometry
  const meridianGeom = useMemo(() => new THREE.BufferGeometry().setFromPoints(getCirclePoints(2)), []);
  
  const parallelGeoms = useMemo(() => {
    return PARALLELS.map(lat => {
      const rad = (lat * Math.PI) / 180;
      const radius = Math.cos(rad) * 2;
      return new THREE.BufferGeometry().setFromPoints(getCirclePoints(radius));
    });
  }, []);

  const { randomNodes, arcs } = useMemo(() => {
    const nodes = [];
    // Generate 16 random nodes evenly distributed
    for (let i = 0; i < 16; i++) {
      const u = Math.random();
      const v = Math.random();
      const lon = v * 360 - 180;
      const lat = Math.asin(2 * u - 1) * (180 / Math.PI);
      nodes.push({ lon, lat });
    }
    
    const allNodes = [HQ, ...REACH_NODES, ...nodes];
    const generatedArcs: THREE.Vector3[][] = [];
    
    // Connect HQ to REACH_NODES
    REACH_NODES.forEach(node => {
      generatedArcs.push(getArcPoints(HQ.lat, HQ.lon, node.lat, node.lon, 2));
    });
    
    // Create random connections across the globe
    for (let i = 0; i < 24; i++) {
      const idx1 = Math.floor(Math.random() * allNodes.length);
      const idx2 = Math.floor(Math.random() * allNodes.length);
      if (idx1 !== idx2) {
        generatedArcs.push(getArcPoints(allNodes[idx1]!.lat, allNodes[idx1]!.lon, allNodes[idx2]!.lat, allNodes[idx2]!.lon, 2));
      }
    }
    
    return { randomNodes: nodes, arcs: generatedArcs };
  }, []);

  useFrame((_state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={group} rotation={[-14 * (Math.PI / 180), 0, 0]}>
      {/* ── Meridians ── */}
      {Array.from({ length: MERIDIANS }).map((_, i) => (
        <group key={`m-${i}`} rotation={[Math.PI / 2, 0, (i * Math.PI) / MERIDIANS]}>
          {/* @ts-ignore - R3F line collides with SVG line in TS */}
          <line geometry={meridianGeom}>
            <lineBasicMaterial 
              color={i === 0 ? NOIR.gold : GROUND.rule} 
              transparent 
              opacity={i === 0 ? 0.9 : 0.3} 
            />
          </line>
        </group>
      ))}

      {/* ── Parallels ── */}
      {PARALLELS.map((lat, i) => {
        const rad = (lat * Math.PI) / 180;
        const y = Math.sin(rad) * 2;
        
        return (
          <group key={`p-${lat}`} position={[0, y, 0]}>
            {/* @ts-ignore - R3F line collides with SVG line in TS */}
            <line geometry={parallelGeoms[i]}>
              <lineBasicMaterial 
                color={lat === 0 ? "rgba(10, 42, 102, 0.40)" : GROUND.rule} 
                transparent 
                opacity={0.3} 
              />
            </line>
          </group>
        );
      })}

      {/* ── Moving Network Arcs ── */}
      {arcs.map((points, i) => (
        <AnimatedArc key={`arc-${i}`} points={points} />
      ))}

      {/* ── City Nodes (HQ + Reach + Random) ── */}
      {[HQ, ...REACH_NODES, ...randomNodes].map((node, i) => {
        const pos = getCartesian(node.lat, node.lon, 2.01);
        const isCore = i < 1 + REACH_NODES.length; // HQ and Reach nodes are slightly larger/brighter
        return (
          <Sphere key={i} position={pos} args={[isCore ? 0.04 : 0.02, 16, 16]}>
            <meshBasicMaterial color={NOIR.gold} transparent opacity={isCore ? 1 : 0.6} />
          </Sphere>
        );
      })}
    </group>
  );
}

// Separate component to animate the dashOffset of each arc
function AnimatedArc({ points }: { points: THREE.Vector3[] }) {
  const lineRef = useRef<any>(null);
  
  // Give each signal a random speed and starting phase so they don't sync up
  const speed = useMemo(() => 0.8 + Math.random() * 1.5, []);
  
  useFrame((_state, delta) => {
    if (lineRef.current?.material) {
      lineRef.current.material.dashOffset -= delta * speed;
    }
  });

  return (
    <>
      {/* Faint solid line underneath */}
      <Line
        points={points}
        color={NOIR.gold}
        transparent
        opacity={0.15}
        lineWidth={1.5}
      />
      {/* Bright dashed line moving on top */}
      <Line
        ref={lineRef}
        points={points}
        color={NOIR.gold}
        transparent
        opacity={0.9}
        lineWidth={2}
        dashed
        dashScale={8}
        dashSize={1.5}
      />
    </>
  );
}

const GLOBE_W = "min(64vw, 1000px)";
const OVERHANG = "150px";

export function ServiceGlobe() {
  return (
    <Box
      sx={(theme) => ({
        position: "absolute",
        top: "50%",
        right: "-38%",
        width: "104vw",
        transform: "translateY(-50%)",
        aspectRatio: "1 / 1",
        zIndex: 0,
        opacity: 0.8,
        pointerEvents: "none",
        [theme.breakpoints.up("md")]: {
          right: `calc(50% - 50vw - ${OVERHANG})`,
          width: GLOBE_W,
          opacity: 1,
        },
      })}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: "10%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 36% 30%, rgba(${NOIR.goldRgb}, 0.09) 0%, rgba(10, 42, 102, 0.06) 46%, rgba(10, 42, 102, 0) 72%)`,
          filter: "blur(30px)",
        }}
      />
      <Canvas camera={{ position: [0, 0, 6.8], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1} />
        <GlobeModel />
      </Canvas>
    </Box>
  );
}

