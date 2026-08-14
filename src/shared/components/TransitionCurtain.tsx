import { createContext, useContext, useState, useRef } from "react";
import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { gsap } from "gsap";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
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
  "/": "HOME CORE",
  "/about": "ABOUT PHITOPOLIS",
  "/services": "CAPABILITIES",
  "/careers": "CAREERS",
  "/blog": "INSIGHTS",
  "/innovation-hub": "INNOVATION LAB",
  "/contact": "GET IN TOUCH",
};

export function TransitionCurtainProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [destinationLabel, setDestinationLabel] = useState("");

  const goldRef = useRef<HTMLDivElement>(null);
  const slateRef = useRef<HTMLDivElement>(null);
  const navyRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  
  const contentLayerRef = useRef<HTMLDivElement>(null);
  const wordmarkBoxRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const outerRingRef = useRef<SVGSVGElement>(null);
  const innerRingRef = useRef<SVGSVGElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const hudFrameRef = useRef<HTMLDivElement>(null);

  const navigateWithCurtain = (to: string) => {
    if (isTransitioning) return;
    
    // Strip hash or search params for route label matching
    const noQuery = to.split('?')[0] || to;
    const pathname = noQuery.split('#')[0] || noQuery;
    if (window.location.pathname === pathname) return;
    
    setIsTransitioning(true);
    const label = ROUTE_LABELS[pathname] || pathname.toUpperCase().replace(/\//g, "") || "LOADING";
    setDestinationLabel(label);
    stopLenis(); // Pause scroll during transition

    const tl = gsap.timeline();
    const goldPanels = goldRef.current?.children ? Array.from(goldRef.current.children) : [];
    const slatePanels = slateRef.current?.children ? Array.from(slateRef.current.children) : [];
    const navyPanels = navyRef.current?.children ? Array.from(navyRef.current.children) : [];

    // Ensure content layer & wordmark are STRICTLY HIDDEN initially so there is zero early flash
    tl.set(contentLayerRef.current, { opacity: 0, visibility: "hidden" });
    tl.set(wordmarkBoxRef.current, { y: 60, opacity: 0, scale: 0.95 });
    tl.set(watermarkRef.current, { scale: 0.85, opacity: 0, rotate: -3 });
    
    // Set 3-layer panel origins
    tl.set(goldPanels, { transformOrigin: "bottom", scaleY: 0 });
    tl.set(slatePanels, { transformOrigin: "top", scaleY: 0 });
    tl.set(navyPanels, { transformOrigin: "bottom", scaleY: 0 });
    tl.set([topBarRef.current, bottomBarRef.current], { scaleX: 0 });
    tl.set(outerRingRef.current, { scale: 0.3, opacity: 0, rotation: 0 });
    tl.set(innerRingRef.current, { scale: 0.3, opacity: 0, rotation: 0 });
    tl.set(hudFrameRef.current, { opacity: 0 });

    const counterObj = { val: 0 };
    if (counterRef.current) counterRef.current.innerText = "000%";

    // PHASE 1: Tri-Layer Sweep (Gold -> Slate -> Navy)
    // 1. Gold Accent Layer (Bottom -> Up)
    tl.to(goldPanels, {
      scaleY: 1,
      duration: 0.5,
      ease: "power4.inOut",
      stagger: { each: 0.03, from: "center" },
    });

    // 2. Slate Layer (Top -> Down)
    tl.to(slatePanels, {
      scaleY: 1,
      duration: 0.5,
      ease: "power4.inOut",
      stagger: { each: 0.03, from: "start" },
    }, "-=0.4");

    // 3. Deep Navy Core Layer (Bottom -> Up)
    tl.to(navyPanels, {
      scaleY: 1,
      duration: 0.55,
      ease: "power4.inOut",
      stagger: { each: 0.03, from: "center" },
    }, "-=0.4");

    // 4. Horizontal Cyber Sweeper Bars
    tl.to(topBarRef.current, { scaleX: 1, duration: 0.5, ease: "expo.out" }, "-=0.2");
    tl.to(bottomBarRef.current, { scaleX: 1, duration: 0.5, ease: "expo.out" }, "<");

    // PHASE 2: Reveal Wordmark & Telemetry NOW (Screen is 100% covered by Navy)
    tl.to(contentLayerRef.current, { opacity: 1, visibility: "visible", duration: 0.01 });
    
    // Background Watermark Pulse
    tl.to(watermarkRef.current, {
      scale: 1,
      opacity: 0.05,
      rotate: 0,
      duration: 0.8,
      ease: "power2.out",
    }, "<");

    // HUD Frame & Rings
    tl.to(hudFrameRef.current, { opacity: 1, duration: 0.3 }, "-=0.1");
    tl.to(outerRingRef.current, {
      scale: 1,
      opacity: 0.25,
      rotation: 180,
      duration: 0.8,
      ease: "power3.out",
    }, "<");
    tl.to(innerRingRef.current, {
      scale: 1,
      opacity: 0.35,
      rotation: -360,
      duration: 0.8,
      ease: "power3.out",
    }, "<");

    // Wordmark Box Rise & Scale
    tl.to(wordmarkBoxRef.current, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.65,
      ease: "expo.out",
    }, "-=0.5");

    // Percentage Counter 000% -> 100%
    tl.to(counterObj, {
      val: 100,
      duration: 0.6,
      ease: "power3.inOut",
      onUpdate: () => {
        if (counterRef.current) {
          counterRef.current.innerText = `${Math.floor(counterObj.val).toString().padStart(3, "0")}%`;
        }
      },
    }, "-=0.5");

    // PHASE 3: Route Push
    tl.add(() => {
      void router.navigate({ to }).then(() => {
        setTimeout(() => {
          refreshScrollTriggers();

          // PHASE 4: Exit Sequence (Everything hides BEFORE curtain uncovers)
          const outTl = gsap.timeline({
            onComplete: () => {
              setIsTransitioning(false);
              startLenis(); // Restore scroll
            }
          });

          // 1. Hide Wordmark & Telemetry FIRST while screen is still covered
          outTl.to(wordmarkBoxRef.current, {
            y: -60,
            opacity: 0,
            scale: 0.95,
            duration: 0.35,
            ease: "expo.in",
          });
          outTl.to(hudFrameRef.current, { opacity: 0, duration: 0.25 }, "<");
          outTl.to(watermarkRef.current, { scale: 1.1, opacity: 0, duration: 0.3 }, "<");
          outTl.to([outerRingRef.current, innerRingRef.current], { scale: 0.3, opacity: 0, duration: 0.3 }, "<");
          outTl.to(contentLayerRef.current, { opacity: 0, visibility: "hidden", duration: 0.01 });

          // 2. Retract Horizontal Bars
          outTl.to([topBarRef.current, bottomBarRef.current], { scaleX: 0, duration: 0.4, ease: "expo.in" }, "-=0.1");

          // 3. Switch Panel Origins to Top & Sweep Out (Navy -> Slate -> Gold)
          outTl.set(navyPanels, { transformOrigin: "top" });
          outTl.set(slatePanels, { transformOrigin: "bottom" });
          outTl.set(goldPanels, { transformOrigin: "top" });

          outTl.to(navyPanels, {
            scaleY: 0,
            duration: 0.55,
            ease: "power4.inOut",
            stagger: { each: 0.03, from: "center" },
          }, "-=0.2");

          outTl.to(slatePanels, {
            scaleY: 0,
            duration: 0.5,
            ease: "power4.inOut",
            stagger: { each: 0.03, from: "start" },
          }, "-=0.4");

          outTl.to(goldPanels, {
            scaleY: 0,
            duration: 0.5,
            ease: "power4.inOut",
            stagger: { each: 0.03, from: "center" },
          }, "-=0.4");

        }, 100);
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
          zIndex: 9999,
          pointerEvents: isTransitioning ? "auto" : "none",
          display: "flex",
          visibility: isTransitioning ? "visible" : "hidden",
          overflow: "hidden",
        }}
      >
        {/* Layer 1: Gold Accent (9 Columns, Bottom Origin) */}
        <Box ref={goldRef} sx={{ position: "absolute", inset: 0, display: "flex" }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Box key={`gold-${i}`} sx={{ flex: 1, height: "100%", bgcolor: NOIR.gold, transform: "scaleY(0)" }} />
          ))}
        </Box>

        {/* Layer 2: Cyber Slate (9 Columns, Top Origin) */}
        <Box ref={slateRef} sx={{ position: "absolute", inset: 0, display: "flex" }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Box key={`slate-${i}`} sx={{ flex: 1, height: "100%", bgcolor: "#0b1526", transform: "scaleY(0)" }} />
          ))}
        </Box>
        
        {/* Layer 3: Deep Navy Core (9 Columns, Center-Out Stagger) */}
        <Box ref={navyRef} sx={{ position: "absolute", inset: 0, display: "flex" }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Box
              key={`navy-${i}`}
              sx={{
                flex: 1,
                height: "100%",
                bgcolor: NOIR.navyInk,
                transform: "scaleY(0)",
                borderRight: i < 8 ? "1px solid rgba(255, 199, 44, 0.08)" : "none",
              }}
            />
          ))}
        </Box>

        {/* Layer 4: Horizontal Cyber Sweeper Bars */}
        <Box
          ref={topBarRef}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            bgcolor: NOIR.gold,
            transform: "scaleX(0)",
            transformOrigin: "left",
            zIndex: 2,
          }}
        />
        <Box
          ref={bottomBarRef}
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            bgcolor: NOIR.gold,
            transform: "scaleX(0)",
            transformOrigin: "right",
            zIndex: 2,
          }}
        />

        {/* Layer 5: Background Watermark Marquee Pulse */}
        <Box
          ref={watermarkRef}
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            opacity: 0,
            zIndex: 1,
          }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: { xs: "12vw", md: "16vw" },
              letterSpacing: "0.15em",
              color: NOIR.gold,
              fontFamily: "Inter, sans-serif",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            PHITOPOLIS
          </Typography>
        </Box>

        {/* Content Layer (Wordmark & Telemetry) - STRICTLY HIDDEN UNTIL SCREEN IS COVERED */}
        <Box
          ref={contentLayerRef}
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            opacity: 0,
            visibility: "hidden",
            zIndex: 3,
          }}
        >
          {/* Cybernetic HUD Counter-Rotating SVG Rings */}
          <Box sx={{ position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Outer Ring */}
            <svg ref={outerRingRef} width="520" height="520" viewBox="0 0 100 100" style={{ position: "absolute", opacity: 0 }}>
              <circle cx="50" cy="50" r="46" fill="none" stroke={NOIR.gold} strokeWidth="0.5" strokeDasharray="3 6" />
              <polygon points="50,2 98,50 50,98 2,50" fill="none" stroke={NOIR.gold} strokeWidth="0.5" opacity="0.4" />
            </svg>
            
            {/* Inner Ring */}
            <svg ref={innerRingRef} width="380" height="380" viewBox="0 0 100 100" style={{ position: "absolute", opacity: 0 }}>
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.75" strokeDasharray="1 4" />
              <polygon points="50,12 88,50 50,88 12,50" fill="none" stroke={NOIR.gold} strokeWidth="0.75" />
              <line x1="50" y1="0" x2="50" y2="100" stroke={NOIR.gold} strokeWidth="0.5" opacity="0.3" />
              <line x1="0" y1="50" x2="100" y2="50" stroke={NOIR.gold} strokeWidth="0.5" opacity="0.3" />
            </svg>
          </Box>

          {/* Mechanical Telemetry HUD Frame */}
          <Box
            ref={hudFrameRef}
            sx={{
              position: "absolute",
              inset: { xs: 24, md: 48 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              pointerEvents: "none",
              opacity: 0,
            }}
          >
            {/* Top Bar */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontFamily: MONO, fontSize: { xs: 9, md: 11 }, letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)" }}>
                ┌ SYS.LOC // BGC MANILA [14.5995° N]
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: { xs: 9, md: 11 }, letterSpacing: "0.2em", color: NOIR.gold }}>
                ● ROUTE_PUSH_SYNC ┐
              </Typography>
            </Box>

            {/* Bottom Bar */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontFamily: MONO, fontSize: { xs: 9, md: 11 }, letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)" }}>
                └ BUFFER // 100% OK
              </Typography>
              <Typography
                ref={counterRef}
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: 14, md: 22 },
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: NOIR.gold,
                }}
              >
                000%
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: { xs: 9, md: 11 }, letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)" }}>
                LATENCY // 0.04MS ┘
              </Typography>
            </Box>
          </Box>

          {/* Main Wordmark Box */}
          <Box
            ref={wordmarkBoxRef}
            sx={{
              px: 3,
              py: 1,
              zIndex: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: { xs: 10, md: 13 },
                letterSpacing: "0.3em",
                color: NOIR.gold,
                textTransform: "uppercase",
                mb: 1,
              }}
            >
              // NAVIGATING TO
            </Typography>
            
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                fontSize: { xs: "2.5rem", sm: "4.5rem", md: "7rem" },
                WebkitTextStroke: { xs: `1px ${NOIR.gold}`, md: `2px ${NOIR.gold}` },
                WebkitTextFillColor: "transparent",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontFamily: "Inter, sans-serif",
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
