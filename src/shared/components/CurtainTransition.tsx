import { useRef } from "react";
import Box from "@mui/material/Box";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";

gsap.registerPlugin(ScrollTrigger);

interface CurtainTransitionProps {
  rows?: number;
}

export function CurtainTransition({ rows = 6 }: CurtainTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slatsRef = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !containerRef.current) return;

      const validSlats = slatsRef.current.filter(Boolean);
      if (validSlats.length === 0) return;

      gsap.fromTo(
        validSlats,
        { scaleX: 0, transformOrigin: (i) => (i % 2 === 0 ? "left center" : "right center") },
        {
          scaleX: 1,
          duration: 0.85,
          stagger: 0.08,
          ease: "power3.inOut",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );
    },
    { scope: containerRef, dependencies: [reduced, rows] }
  );

  return (
    <Box
      ref={containerRef}
      aria-hidden="true"
      sx={{
        width: "100%",
        height: { xs: 80, md: 120 },
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none",
      }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <Box
          key={`curtain-slat-${i}`}
          ref={(el: HTMLDivElement | null) => {
            slatsRef.current[i] = el;
          }}
          sx={{
            flex: 1,
            width: "100%",
            bgcolor: NOIR.navyField,
            transform: reduced ? "none" : "scaleX(1)",
            borderBottom: i < rows - 1 ? "1px solid rgba(255, 199, 44, 0.08)" : "none",
          }}
        />
      ))}
    </Box>
  );
}
