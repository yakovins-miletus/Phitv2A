import { motion, useInView } from "motion/react";
import { useRef } from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { usePreloaderReady, useReducedMotion } from "@/shared/motion";

interface Hero3DTextProps {
  children: ReactNode;
  delay?: number;
}

export function Hero3DText({ children, delay = 0 }: Hero3DTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const ready = usePreloaderReady();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-5%" });

  const shouldAnimate = ready && isInView;

  if (prefersReducedMotion) {
    return (
      <Box ref={ref}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay }}
        >
          {children}
        </motion.div>
      </Box>
    );
  }

  return (
    <Box ref={ref} sx={{ perspective: "1200px" }}>
      <motion.div
        initial={{ 
          opacity: 0, 
          rotateX: 35, 
          rotateY: 60,
          z: -300, 
          y: 88,
          x: -100
        }}
        animate={shouldAnimate ? { 
          opacity: 1, 
          rotateX: 0, 
          rotateY: 0,
          z: 0,
          y: 0,
          x: 0
        } : {}}
        transition={{ 
          duration: 1.6, 
          ease: [0.16, 1, 0.3, 1], // Custom smooth ease
          delay 
        }}
        style={{ transformOrigin: "left center" }}
      >
        {children}
      </motion.div>
    </Box>
  );
}
