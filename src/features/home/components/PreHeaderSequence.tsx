import { useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function PreHeaderSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const topMaskRef = useRef<HTMLDivElement>(null);
  const bottomMaskRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    // Respect prefers-reduced-motion per Taste rules
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.set(containerRef.current, { display: "none" });
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        // Remove the overlay from the layout once the reveal finishes
        gsap.set(containerRef.current, { display: "none" });
      }
    });

    // Initialize layout positions
    gsap.set(topMaskRef.current, { yPercent: 0 });
    gsap.set(bottomMaskRef.current, { yPercent: 0 });
    gsap.set(lineRef.current, { scaleX: 0, opacity: 1 });
    gsap.set(textRef.current, { opacity: 0, scale: 0.95 });

    // Motion Sequence
    tl.to(lineRef.current, {
      scaleX: 1,
      duration: 1.2,
      ease: "expo.inOut"
    })
    .to(textRef.current, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: "power2.out"
    }, "-=0.4")
    .to(textRef.current, {
      opacity: 0,
      scale: 1.05,
      duration: 0.6,
      ease: "power2.in"
    }, "+=0.6") // Hold the text briefly before splitting
    .to([topMaskRef.current, bottomMaskRef.current], {
      yPercent: (i) => (i === 0 ? -100 : 100),
      duration: 1.4,
      ease: "power4.inOut",
      stagger: 0
    }, "-=0.2")
    .to(lineRef.current, {
      opacity: 0,
      duration: 0.1
    }, "-=1.4");
  }, { scope: containerRef });

  return (
    <Box
      ref={containerRef}
      aria-hidden="true"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "transparent",
      }}
    >
      {/* Top Shutter */}
      <Box
        ref={topMaskRef}
        sx={{
          flex: 1,
          bgcolor: "common.black",
          width: "100%",
          transformOrigin: "top",
        }}
      />
      
      {/* Center Geometric Elements */}
      <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box
          ref={lineRef}
          sx={{
            height: "1px",
            bgcolor: "common.white",
            width: "100%",
            transformOrigin: "center",
          }}
        />
        <Typography
          ref={textRef}
          variant="overline"
          sx={{
            position: "absolute",
            color: "common.white",
            letterSpacing: "0.4em",
            fontWeight: 500,
            textTransform: "uppercase",
            mixBlendMode: "difference",
          }}
        >
          System Initiating
        </Typography>
      </Box>

      {/* Bottom Shutter */}
      <Box
        ref={bottomMaskRef}
        sx={{
          flex: 1,
          bgcolor: "common.black",
          width: "100%",
          transformOrigin: "bottom",
        }}
      />
    </Box>
  );
}
