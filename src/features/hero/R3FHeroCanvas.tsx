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
  /**
   * Stage 4: accepted for parity with the legacy canvas fork, ignored here.
   * The 3D playground is out of scope for this stage (README rule 1); leaving
   * `--hp-mx` / `--hp-my` unpublished is correct, not a gap — the sky's
   * `var(--hp-mx, 0)` reads fall back to 0, which is a static (not broken)
   * disc/sky.
   */
  varsHostRef?: RefObject<HTMLElement | null>;
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
    </>
  );
}
