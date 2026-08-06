import { useRef } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import PhitopolisLogo from "../PhitopolisLogo";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

export interface ProcessStep {
  number: string;
  label: string;
  caption: string;
}

interface ProcessDiagramProps {
  steps: readonly ProcessStep[];
}

export function ProcessDiagram({ steps }: ProcessDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress over the diagram container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 50, damping: 20 });
  
  const lineHeight = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);
  // P logo travels down the line
  const logoY = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  return (
    <Box ref={containerRef} sx={{ position: "relative", maxWidth: 900, mx: "auto", py: { xs: 8, md: 12 } }}>
      
      {/* Central Glowing Line */}
      <Box 
        sx={{ 
          position: "absolute", 
          top: 0, 
          bottom: 0, 
          left: { xs: 40, md: "50%" }, 
          width: 2, 
          bgcolor: "rgba(255,255,255,0.08)", 
          transform: { md: "translateX(-50%)" } 
        }}
      >
        <motion.div
          style={{
            height: lineHeight,
            width: "100%",
            background: `linear-gradient(to bottom, transparent, ${NOIR.gold} 20%, ${NOIR.goldDark})`,
            boxShadow: `0 0 16px ${NOIR.gold}`,
          }}
        />
      </Box>

      {/* The Phitopolis P Logo (Materializer) */}
      <Box 
        sx={{ 
          position: "absolute", 
          top: 0, 
          bottom: 0, 
          left: { xs: 40, md: "50%" }, 
          transform: { xs: "translateX(-50%)", md: "translateX(-50%)" }, 
          width: 64, 
          pointerEvents: "none", 
          zIndex: 10 
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            top: logoY, // use standard top percentage
            width: "100%",
            height: 64,
            marginTop: -32, // center it vertically on the current percentage
          }}
        >
          <Box 
            sx={{ 
              width: "100%", 
              height: "100%", 
              bgcolor: NOIR.navyField, 
              borderRadius: "50%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              border: `2px solid ${NOIR.gold}`, 
              boxShadow: `0 0 32px rgba(212,175,55,0.4)`,
              "& svg": { width: 32, height: 32, ml: 0.5 } // optical balance for the P
            }}
          >
            <PhitopolisLogo color="#FFFFFF" accentColor={NOIR.gold} />
          </Box>
        </motion.div>
      </Box>

      {/* Nodes */}
      <Stack spacing={{ xs: 12, md: 24 }} sx={{ position: "relative", zIndex: 5 }}>
        {steps.map((step, index) => {
          const isEndpoint = index === 0 || index === steps.length - 1;
          const isEven = index % 2 === 0;

          return (
            <Box 
              key={step.label} 
              sx={{ 
                display: "flex", 
                justifyContent: { xs: "flex-start", md: isEndpoint ? "center" : (isEven ? "flex-start" : "flex-end") }, 
                pl: { xs: 14, md: 0 } 
              }}
            >
              <Box 
                sx={{ 
                  width: { xs: "100%", md: isEndpoint ? "100%" : "42%" }, 
                  textAlign: { xs: "left", md: isEndpoint ? "center" : (isEven ? "right" : "left") }, 
                  position: "relative" 
                }}
              >
                {/* Node static marker (desktop only, connects text to line) */}
                {!isEndpoint && (
                  <Box 
                    sx={{ 
                      display: { xs: "none", md: "block" }, 
                      position: "absolute", 
                      top: "50%", 
                      [isEven ? "right" : "left"]: "-19.5%", 
                      transform: "translate(50%, -50%)", 
                      width: 12, 
                      height: 12, 
                      borderRadius: "50%", 
                      bgcolor: NOIR.navyField, 
                      border: `2px solid rgba(255,255,255,0.2)` 
                    }} 
                  />
                )}

                <Typography 
                  sx={{ 
                    fontFamily: MONO, 
                    fontSize: isEndpoint ? "1rem" : "0.75rem", 
                    letterSpacing: "0.2em", 
                    color: isEndpoint ? NOIR.gold : "rgba(255,255,255,0.4)", 
                    mb: 1, 
                    textTransform: "uppercase" 
                  }}
                >
                  {isEndpoint ? "" : `PHASE ${step.number}`}
                </Typography>
                
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800, 
                    mb: 2, 
                    fontSize: isEndpoint ? { xs: "3rem", md: "4rem" } : { xs: "1.75rem", md: "2.5rem" }, 
                    color: isEndpoint ? "#FFFFFF" : "rgba(255,255,255,0.95)",
                    textShadow: isEndpoint ? "0 0 32px rgba(255,255,255,0.2)" : "none"
                  }}
                >
                  {step.label}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: isEndpoint ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.6)", 
                    fontSize: isEndpoint ? "1.25rem" : "1.1rem",
                    maxWidth: isEndpoint ? 480 : 360, 
                    mx: isEndpoint ? { md: "auto" } : undefined, 
                    ml: (!isEndpoint && !isEven) ? { md: 0 } : undefined, 
                    mr: (!isEndpoint && isEven) ? { md: 0 } : undefined 
                  }}
                >
                  {step.caption}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
