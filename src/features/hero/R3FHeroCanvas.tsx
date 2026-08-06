import { useImperativeHandle, useRef, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { PlaygroundScene } from "./PlaygroundScene";

export interface HeroCanvasHandle {
  /** Push the pin's 0..1 progress. Cheap, synchronous, causes no render. */
  setProgress: (p: number) => void;
}

interface HeroCanvasProps {
  /** Imperative handle the scroll driver writes progress into. */
  handleRef: RefObject<HeroCanvasHandle | null>;
  /** Initial progress, used for the first paint and for the static fallback frame. */
  initialProgress?: number;
}

export function R3FHeroCanvas({ handleRef, initialProgress = 0 }: HeroCanvasProps) {
  const progressRef = useRef(initialProgress);

  useImperativeHandle(
    handleRef,
    () => ({
      setProgress: (p: number) => {
        progressRef.current = p;
      },
    }),
    [],
  );

  return (
    <>
      <div
        aria-hidden
        data-testid="r3f-hero-canvas"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "auto", // Allow canvas interaction
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 10], fov: 45 }}
          dpr={[1, 2]} // limit dpr to 2 for performance
          gl={{ antialias: true, alpha: true }}
        >
          <PlaygroundScene progressRef={progressRef} />
        </Canvas>
      </div>
      
      <div
        style={{
          position: "absolute",
          bottom: "16%",
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(105, 138, 213, 0.7)",
          fontFamily: "monospace",
          fontSize: "0.7rem",
          letterSpacing: "0.18em",
          pointerEvents: "none",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          zIndex: 10,
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        [ Playground active: move cursor to tilt & heal // click to ripple ]
      </div>
    </>
  );
}
