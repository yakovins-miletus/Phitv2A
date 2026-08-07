import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, Html, Sparkles } from "@react-three/drei";
import * as THREE from "three";

export function PlaygroundScene({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const cursorRef = useRef<THREE.Mesh>(null);
  const indicatorHtmlRef = useRef<HTMLDivElement>(null);

  const { size } = useThree();
  const isMobileSize = size.width < 900;
  const indicatorPosition: [number, number, number] = isMobileSize ? [0, -3.2, 0] : [-3.6, 0, 0];

  // Nodes config
  const nodes = [
    { id: "web", label: "Web", color: "#698ad5", position: [-4, 2, 0] },
    { id: "devops", label: "DevOps", color: "#48bb78", position: [4, 2, 0] },
    { id: "data", label: "Data", color: "#ed8936", position: [-4, -2, 0] },
    { id: "quant", label: "Quant", color: "#9f7aea", position: [4, -2, 0] },
  ];

  useFrame((state) => {
    // Scroll progress affects scene (e.g. rotation or scale)
    const p = progressRef.current;
    const isPlaygroundActive = p < 0.02;

    if (indicatorHtmlRef.current) {
      indicatorHtmlRef.current.style.opacity = isPlaygroundActive ? Math.max(0, 1 - p / 0.02).toString() : "0";
    }
    
    if (groupRef.current) {
      // Gentle rotation based on scroll or time
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1 + p * Math.PI;
    }

    // Cursor tracking for the healing field ring
    if (cursorRef.current) {
      // Convert normalized device coordinates (state.pointer) to world coordinates loosely
      const x = (state.pointer.x * state.viewport.width) / 2;
      const y = (state.pointer.y * state.viewport.height) / 2;
      
      // Smooth damp the cursor mesh to the mouse position
      cursorRef.current.position.lerp(new THREE.Vector3(x, y, 0), 0.1);
    }
  });

  return (
    <>
      {/* Cinematic Dark Mode Environment */}
      <color attach="background" args={["#0b0e14"]} />
      <fogExp2 attach="fog" args={["#0b0e14", 0.05]} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -5]} intensity={0.8} color="#698ad5" />

      {/* Grid background for depth */}
      <gridHelper args={[50, 50, "#202835", "#151a24"]} position={[0, -5, 0]} />

      {/* Playground Active Indicator positioned flat in 3D scene but outside orbiting group */}
      <Html position={indicatorPosition} center>
        <div
          ref={indicatorHtmlRef}
          style={{
            color: "rgba(105, 138, 213, 0.7)",
            fontFamily: "monospace",
            fontSize: "0.7rem",
            letterSpacing: "0.18em",
            pointerEvents: "none",
            transition: "opacity 0.3s ease",
            textAlign: isMobileSize ? "center" : "right",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            transform: isMobileSize ? "none" : "translateX(-50%)",
          }}
        >
          [ Playground active: move cursor to tilt & heal // click to ripple ]
        </div>
      </Html>

      <group ref={groupRef}>
        {/* Central Logo Placeholder */}
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <mesh>
            <octahedronGeometry args={[1.5, 0]} />
            <meshStandardMaterial color="#ffffff" wireframe />
            <Html center position={[0, -2.5, 0]}>
              <div style={{ color: "white", fontFamily: "monospace", textTransform: "uppercase", background: "rgba(0,0,0,0.5)", padding: "4px 8px", borderRadius: "4px" }}>Kernel</div>
            </Html>
          </mesh>
        </Float>

        {/* Orbiting Service Nodes */}
        {nodes.map((node) => (
          <Float key={node.id} speed={1.5} rotationIntensity={1} floatIntensity={2} position={new THREE.Vector3(...node.position)}>
            <mesh>
              <boxGeometry args={[1, 1, 0.1]} />
              <meshPhysicalMaterial 
                color={node.color}
                transmission={0.9}
                opacity={1}
                metalness={0}
                roughness={0}
                ior={1.5}
                thickness={0.5}
              />
              <Html center position={[0, -1.2, 0]}>
                <div style={{ color: node.color, fontFamily: "monospace", textTransform: "uppercase" }}>{node.label}</div>
              </Html>
            </mesh>
          </Float>
        ))}
      </group>

      {/* Background Particles (Data flows) */}
      <Sparkles count={500} scale={15} size={2} speed={0.4} opacity={0.3} color="#698ad5" />

      {/* The Cursor Healing Field */}
      <mesh ref={cursorRef} position={[0, 0, 0.1]}>
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshBasicMaterial color="#48bb78" transparent opacity={0.6} side={THREE.DoubleSide} />
        <pointLight intensity={2} color="#48bb78" distance={3} />
      </mesh>
    </>
  );
}
