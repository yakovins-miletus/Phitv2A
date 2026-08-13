import { createContext, useContext, useState, useRef } from "react";
import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { gsap } from "gsap";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { NOIR } from "@/shared/theme/palette";
import { stopLenis, startLenis } from "@/shared/components/SmoothScroll";
import { refreshScrollTriggers } from "@/shared/motion/scrollTriggerBridge";

interface TransitionCurtainContextType {
  navigateWithCurtain: (to: string) => void;
}

const TransitionCurtainContext = createContext<TransitionCurtainContextType | null>(null);

export function useTransitionCurtain() {
  const context = useContext(TransitionCurtainContext);
  if (!context) {
    throw new Error("useTransitionCurtain must be used within a TransitionCurtainProvider");
  }
  return context;
}

const ROUTE_LABELS: Record<string, string> = {
  "/": "HOME",
  "/about": "ABOUT US",
  "/services": "CAPABILITIES",
  "/careers": "CAREERS",
  "/blog": "INSIGHTS",
  "/innovation-hub": "INNOVATION LAB",
  "/contact": "CONTACT",
};

export function TransitionCurtainProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [destinationLabel, setDestinationLabel] = useState("");

  const accentRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);

  const navigateWithCurtain = (to: string) => {
    if (isTransitioning) return;
    
    // Strip hash or search params for route label matching, or exact match if preferred
    const noQuery = to.split('?')[0] || to;
    const pathname = noQuery.split('#')[0] || noQuery;
    if (window.location.pathname === pathname) return;
    
    setIsTransitioning(true);
    setDestinationLabel(ROUTE_LABELS[pathname] || pathname.toUpperCase().replace(/\//g, "") || "LOADING");
    stopLenis(); // Pause scroll during the whole transition sequence

    const tl = gsap.timeline();
    const accentPanels = accentRef.current?.children ? Array.from(accentRef.current.children) : [];
    const mainPanels = mainRef.current?.children ? Array.from(mainRef.current.children) : [];

    // Phase 1: Wipe IN (Staggered columns from bottom)
    tl.set([accentPanels, mainPanels], { transformOrigin: "bottom", scaleY: 0 });
    tl.set(textRef.current, { y: "100%", opacity: 0 });
    tl.set(shapeRef.current, { scale: 0.5, opacity: 0, rotation: 0 });

    tl.to(accentPanels, {
      scaleY: 1,
      duration: 0.65,
      ease: "power4.inOut",
      stagger: 0.05,
    });
    
    tl.to(mainPanels, {
      scaleY: 1,
      duration: 0.65,
      ease: "power4.inOut",
      stagger: 0.05,
    }, "-=0.55"); // The chaser follows very closely

    // Reveal Page Tab Guide and Structural Shape
    tl.to(textRef.current, {
      y: "0%",
      opacity: 1,
      duration: 0.8,
      ease: "expo.out",
    }, "-=0.3");

    tl.to(shapeRef.current, {
      scale: 1.2,
      opacity: 0.15,
      rotation: 90,
      duration: 1.2,
      ease: "power3.out",
    }, "-=0.8");

    // Phase 2: Route Push (While screen is covered)
    tl.add(() => {
      void router.navigate({ to }).then(() => {
        // Wait a tiny bit for React to render the new DOM completely
        setTimeout(() => {
          refreshScrollTriggers();

          // Phase 3: Wipe OUT (Stagger upwards and away)
          const outTl = gsap.timeline({
            onComplete: () => {
              setIsTransitioning(false);
              startLenis(); // Restore scrolling
            }
          });

          // Guide elements animate out first
          outTl.to(textRef.current, {
            y: "-100%",
            opacity: 0,
            duration: 0.5,
            ease: "expo.in",
          });
          outTl.to(shapeRef.current, {
            scale: 0.5,
            opacity: 0,
            rotation: 180,
            duration: 0.5,
            ease: "power3.in",
          }, "<");

          // Switch transform origin to top so they recede upwards
          outTl.set([accentPanels, mainPanels], { transformOrigin: "top" });
          
          outTl.to(mainPanels, {
            scaleY: 0,
            duration: 0.65,
            ease: "power4.inOut",
            stagger: 0.05,
          }, "-=0.1");

          outTl.to(accentPanels, {
            scaleY: 0,
            duration: 0.65,
            ease: "power4.inOut",
            stagger: 0.05,
          }, "-=0.55");
        }, 150);
      });
    });
  };

  return (
    <TransitionCurtainContext.Provider value={{ navigateWithCurtain }}>
      {children}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 9999, // Above everything
          pointerEvents: isTransitioning ? "auto" : "none",
          display: "flex",
          // When not transitioning, ensure it's completely invisible (though scaleY handles panels)
          visibility: isTransitioning ? "visible" : "hidden",
        }}
      >
        {/* Accent Layer */}
        <Box ref={accentRef} sx={{ position: "absolute", inset: 0, display: "flex" }}>
          {[0, 1, 2, 3, 4].map(i => (
            <Box key={`accent-${i}`} sx={{ flex: 1, height: "100%", bgcolor: NOIR.gold, transform: "scaleY(0)" }} />
          ))}
        </Box>
        
        {/* Main Layer */}
        <Box ref={mainRef} sx={{ position: "absolute", inset: 0, display: "flex" }}>
          {[0, 1, 2, 3, 4].map(i => (
            <Box key={`main-${i}`} sx={{ flex: 1, height: "100%", bgcolor: NOIR.navyInk, transform: "scaleY(0)" }} />
          ))}
        </Box>

        {/* Content Layer (Page Tab Guide) */}
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {/* Entertaining Moving Part (Geometric) */}
          <Box ref={shapeRef} sx={{ position: "absolute", opacity: 0 }}>
            <svg width="400" height="400" viewBox="0 0 100 100">
              <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke={NOIR.gold} strokeWidth="1" />
              <circle cx="50" cy="50" r="30" fill="none" stroke={NOIR.gold} strokeWidth="1" />
              <line x1="50" y1="5" x2="50" y2="95" stroke={NOIR.gold} strokeWidth="1" />
              <line x1="5" y1="25" x2="95" y2="75" stroke={NOIR.gold} strokeWidth="1" />
              <line x1="95" y1="25" x2="5" y2="75" stroke={NOIR.gold} strokeWidth="1" />
            </svg>
          </Box>
          
          <Box sx={{ overflow: "hidden", position: "relative" }}>
            <Typography
              ref={textRef}
              variant="h1"
              sx={{
                fontWeight: 900,
                fontSize: { xs: "3rem", md: "8rem" },
                WebkitTextStroke: `2px ${NOIR.gold}`,
                WebkitTextFillColor: "transparent",
                textTransform: "uppercase",
                opacity: 0,
                letterSpacing: "0.05em",
                fontFamily: "Inter, sans-serif", // Ensure it feels structural
                textAlign: "center",
                lineHeight: 1,
              }}
            >
              {destinationLabel}
            </Typography>
          </Box>
        </Box>
      </Box>
    </TransitionCurtainContext.Provider>
  );
}
