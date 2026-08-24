import { useRef, useMemo } from "react";
import Box from "@mui/material/Box";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";

import { NOIR } from "@/shared/theme/palette";
import { GROUNDS } from "@/shared/theme/grounds";
import { homeSection } from "@/shared/sections";
import { useReducedMotion } from "@/shared/motion";
import PhitopolisLogo from "@/shared/components/PhitopolisLogo";

const GROUND = GROUNDS[homeSection("hero-mission").ground ?? "panel"];

// Primary Financial & Engineering Hubs (Matching Phitopolis Global Reach)
const GLOBAL_HUBS = [
  { name: "HQ · MANILA", lon: 121.0, lat: 14.6, isHQ: true },
  { name: "LONDON", lon: -0.13, lat: 51.5, isHQ: false },
  { name: "NEW YORK", lon: -74.0, lat: 40.7, isHQ: false },
  { name: "MIAMI", lon: -80.2, lat: 25.7, isHQ: false },
  { name: "HONG KONG", lon: 114.17, lat: 22.32, isHQ: false },
  { name: "TOKYO", lon: 139.69, lat: 35.69, isHQ: false },
  { name: "SINGAPORE", lon: 103.82, lat: 1.35, isHQ: false },
  { name: "ZURICH", lon: 8.54, lat: 47.37, isHQ: false },
] as const;

const MERIDIANS = 24;
const PARALLELS = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];

function getCartesian(lat: number, lon: number, radius = 2): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 90) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function getArcPoints(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  radius = 2,
  segments = 48,
): THREE.Vector3[] {
  const start = getCartesian(startLat, startLon, radius);
  const end = getCartesian(endLat, endLon, radius);
  const points: THREE.Vector3[] = [];
  const distance = start.distanceTo(end);
  const maxLift = Math.min(distance * 0.28, 0.42);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = start.clone().lerp(end, t).normalize();
    const lift = radius + maxLift * Math.sin(t * Math.PI);
    point.multiplyScalar(lift);
    points.push(point);
  }
  return points;
}

function getCirclePoints(radius: number, segments = 96): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
  }
  return points;
}

/**
 * Stationary, non-spinning Phitopolis "P" Monogram centered inside the globe.
 * Retains absolute alignment to the camera while outer coordinates orbit around it.
 */
function StationaryCentralMonogram({ reduced }: { reduced: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const reticleRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      // Subtle levitation breathing float
      groupRef.current.position.y = Math.sin(t * 1.4) * 0.035;
    }
    if (reticleRef.current) {
      reticleRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
    }
  });

  const reticlePoints = useMemo(() => getCirclePoints(0.88, 64), []);
  const outerReticlePoints = useMemo(() => getCirclePoints(1.05, 64), []);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Soft Volumetric Core Glow */}
      <Sphere args={[0.72, 32, 32]} position={[0, 0, -0.05]}>
        <meshBasicMaterial
          color={NOIR.goldDark}
          transparent
          opacity={GROUND.dark ? 0.08 : 0.05}
          side={THREE.DoubleSide}
        />
      </Sphere>

      {/* Inner Reticle Rings */}
      <group ref={reticleRef}>
        <Line
          points={reticlePoints}
          color={NOIR.goldDark}
          transparent
          opacity={0.35}
          lineWidth={1}
          dashed
          dashScale={24}
          dashSize={0.4}
        />
        <Line
          points={outerReticlePoints}
          color={GROUND.dark ? NOIR.frost : NOIR.navyField}
          transparent
          opacity={0.18}
          lineWidth={1}
        />
      </group>

      {/* Stationary Vector Monogram */}
      <Html center style={{ pointerEvents: "none" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: `drop-shadow(0 0 16px rgba(${NOIR.goldRgb}, 0.5))`,
            transform: "translateZ(0)",
          }}
        >
          <PhitopolisLogo
            color={GROUND.dark ? NOIR.frost : NOIR.navyField}
            accentColor={NOIR.goldDark}
            style={{
              width: "115px",
              height: "115px",
              display: "block",
            }}
          />
        </Box>
      </Html>
    </group>
  );
}

/**
 * High-Precision Rotating Wireframe Globe Model.
 */
function GlobeModel({ reduced }: { reduced: boolean }) {
  const globeGroup = useRef<THREE.Group>(null);
  const astrolabeGroup = useRef<THREE.Group>(null);

  // Wireframe Geometries
  const meridianGeom = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(getCirclePoints(2, 96)),
    [],
  );

  const parallelGeoms = useMemo(() => {
    return PARALLELS.map((lat) => {
      const rad = (lat * Math.PI) / 180;
      const radius = Math.cos(rad) * 2;
      return new THREE.BufferGeometry().setFromPoints(getCirclePoints(radius, 80));
    });
  }, []);

  // Fibonacci Constellation (380 micro particle nodes on globe surface)
  const fibonacciPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const count = 360;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < count; i++) {
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const x = -(2.008 * Math.sin(phi) * Math.cos(theta));
      const y = 2.008 * Math.cos(phi);
      const z = 2.008 * Math.sin(phi) * Math.sin(theta);
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, []);

  // Curated Institutional Network Arcs (HQ to key global exchanges)
  const networkArcs = useMemo(() => {
    const hq = GLOBAL_HUBS[0]!;
    const routes = [
      { from: hq, to: GLOBAL_HUBS[1]! }, // Manila -> London
      { from: hq, to: GLOBAL_HUBS[2]! }, // Manila -> New York
      { from: hq, to: GLOBAL_HUBS[3]! }, // Manila -> Miami
      { from: hq, to: GLOBAL_HUBS[4]! }, // Manila -> Hong Kong
      { from: hq, to: GLOBAL_HUBS[5]! }, // Manila -> Tokyo
      { from: hq, to: GLOBAL_HUBS[6]! }, // Manila -> Singapore
      { from: GLOBAL_HUBS[1]!, to: GLOBAL_HUBS[2]! }, // London -> New York
      { from: GLOBAL_HUBS[2]!, to: GLOBAL_HUBS[3]! }, // New York -> Miami
      { from: GLOBAL_HUBS[1]!, to: GLOBAL_HUBS[7]! }, // London -> Zurich
      { from: GLOBAL_HUBS[4]!, to: GLOBAL_HUBS[5]! }, // Hong Kong -> Tokyo
    ];

    return routes.map((r) => getArcPoints(r.from.lat, r.from.lon, r.to.lat, r.to.lon, 2));
  }, []);

  // Outer Gimbal Geometries
  const astrolabeMain = useMemo(() => getCirclePoints(2.38, 96), []);
  const astrolabeDashed = useMemo(() => getCirclePoints(2.46, 96), []);

  useFrame((_state, delta) => {
    if (!reduced) {
      if (globeGroup.current) {
        globeGroup.current.rotation.y += delta * 0.055;
      }
      if (astrolabeGroup.current) {
        astrolabeGroup.current.rotation.z -= delta * 0.025;
        astrolabeGroup.current.rotation.x += delta * 0.015;
      }
    }
  });

  return (
    <>
      {/* ── 1. Stationary Central Phitopolis Monogram ── */}
      <StationaryCentralMonogram reduced={reduced} />

      {/* ── 2. Inner Atmospheric Occlusion Sphere (Gives Volumetric Depth) ── */}
      <Sphere args={[1.96, 36, 36]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color={GROUND.dark ? NOIR.navyDeep : NOIR.void}
          transparent
          opacity={GROUND.dark ? 0.85 : 0.03}
          side={THREE.FrontSide}
        />
      </Sphere>

      {/* ── 3. Rotating Coordinate Wireframe Cage ── */}
      <group ref={globeGroup} rotation={[-16 * (Math.PI / 180), 0, 0]}>
        {/* Meridians (Longitude Lines) */}
        {Array.from({ length: MERIDIANS }).map((_, i) => {
          const isPrime = i === 0 || i === MERIDIANS / 2;
          return (
            <group key={`m-${i}`} rotation={[Math.PI / 2, 0, (i * Math.PI) / MERIDIANS]}>
              {/* @ts-expect-error - R3F line */}
              <line geometry={meridianGeom}>
                <lineBasicMaterial
                  color={
                    isPrime
                      ? NOIR.goldDark
                      : GROUND.dark
                        ? "rgba(255, 255, 255, 0.18)"
                        : "rgba(10, 42, 102, 0.14)"
                  }
                  transparent
                  opacity={isPrime ? 0.75 : 0.22}
                />
              </line>
            </group>
          );
        })}

        {/* Parallels (Latitude Lines) */}
        {PARALLELS.map((lat, i) => {
          const rad = (lat * Math.PI) / 180;
          const y = Math.sin(rad) * 2;
          const isEquator = lat === 0;
          const isTropic = Math.abs(lat) === 30;

          return (
            <group key={`p-${lat}`} position={[0, y, 0]}>
              {/* @ts-expect-error - R3F line */}
              <line geometry={parallelGeoms[i]}>
                <lineBasicMaterial
                  color={
                    isEquator
                      ? NOIR.goldDark
                      : isTropic
                        ? GROUND.dark
                          ? "rgba(255, 199, 44, 0.35)"
                          : "rgba(10, 42, 102, 0.24)"
                        : GROUND.dark
                          ? "rgba(255, 255, 255, 0.12)"
                          : "rgba(10, 42, 102, 0.08)"
                  }
                  transparent
                  opacity={isEquator ? 0.75 : isTropic ? 0.45 : 0.22}
                />
              </line>
            </group>
          );
        })}

        {/* Fibonacci Celestial Particle Constellation */}
        {fibonacciPoints.map((pt, i) => (
          <Sphere key={`fib-${i}`} position={pt} args={[0.012, 8, 8]}>
            <meshBasicMaterial
              color={i % 7 === 0 ? NOIR.goldDark : GROUND.dark ? NOIR.frost : NOIR.navyField}
              transparent
              opacity={i % 7 === 0 ? 0.65 : 0.22}
            />
          </Sphere>
        ))}

        {/* High-Precision Directed Signal Arcs */}
        {networkArcs.map((points, i) => (
          <AnimatedArc key={`arc-${i}`} points={points} reduced={reduced} />
        ))}

        {/* Global Financial Hub Nodes */}
        {GLOBAL_HUBS.map((hub, i) => {
          const pos = getCartesian(hub.lat, hub.lon, 2.012);
          return (
            <group key={`hub-${i}`} position={pos}>
              {/* Solid Core Beacon */}
              <Sphere args={[hub.isHQ ? 0.048 : 0.03, 16, 16]}>
                <meshBasicMaterial color={NOIR.goldDark} transparent opacity={1} />
              </Sphere>

              {/* Concentric Halo Ring */}
              <Sphere args={[hub.isHQ ? 0.08 : 0.05, 16, 16]}>
                <meshBasicMaterial color={NOIR.goldDark} transparent opacity={0.35} wireframe />
              </Sphere>
            </group>
          );
        })}
      </group>

      {/* ── 4. Outer Celestial Gimbal / Astrolabe Ring ── */}
      <group ref={astrolabeGroup} rotation={[0.41, 0.35, 0]}>
        <Line
          points={astrolabeMain}
          color={GROUND.dark ? "rgba(255, 255, 255, 0.22)" : "rgba(10, 42, 102, 0.2)"}
          transparent
          opacity={0.4}
          lineWidth={1}
        />
        <Line
          points={astrolabeDashed}
          color={NOIR.goldDark}
          transparent
          opacity={0.35}
          lineWidth={1}
          dashed
          dashScale={36}
          dashSize={0.4}
        />
      </group>
    </>
  );
}

function AnimatedArc({
  points,
  reduced,
}: {
  points: THREE.Vector3[];
  reduced: boolean;
}) {
  const lineRef = useRef<React.ComponentRef<typeof Line>>(null);
  const speed = useMemo(() => {
    const pt = points[0];
    const seed = pt ? Math.abs(pt.x * 13 + pt.y * 7) : 1;
    const frac = seed - Math.floor(seed);
    return 0.75 + frac * 0.9;
  }, [points]);

  useFrame((_state, delta) => {
    const mat = lineRef.current?.material as { dashOffset: number } | undefined;
    if (!reduced && mat) {
      mat.dashOffset -= delta * speed;
    }
  });

  return (
    <>
      {/* Delicate Trajectory Line */}
      <Line
        points={points}
        color={NOIR.goldDark}
        transparent
        opacity={0.16}
        lineWidth={1}
      />
      {/* Traveling Photon Pulse */}
      <Line
        ref={lineRef}
        points={points}
        color={NOIR.goldDark}
        transparent
        opacity={0.9}
        lineWidth={1.6}
        dashed
        dashScale={7}
        dashSize={1.1}
      />
    </>
  );
}

const GLOBE_W = "min(64vw, 1000px)";
const OVERHANG = "150px";

export function ServiceGlobe() {
  const reduced = useReducedMotion() === true;

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
        opacity: 0.95,
        pointerEvents: "none",
        [theme.breakpoints.up("md")]: {
          right: `calc(50% - 50vw - ${OVERHANG})`,
          width: GLOBE_W,
          opacity: 1,
        },
      })}
    >
      {/* ── Ambient Radial Atmosphere ── */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: "8%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 48% 46%, rgba(${NOIR.goldRgb}, 0.12) 0%, rgba(10, 42, 102, 0.06) 48%, transparent 72%)`,
          filter: "blur(36px)",
        }}
      />

      {/* ── 3D Scene Canvas ── */}
      <Canvas
        camera={{ position: [0, 0, 6.8], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1} />
        <GlobeModel reduced={reduced} />
      </Canvas>

    </Box>
  );
}
