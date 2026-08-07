import React, { useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/system";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

import { CONTENT } from "@/shared/content";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";

const GROUND = GROUNDS[homeSection("hero-pillars").ground ?? "deep"];

// 3D Tilt Card Component
function PillarCard({ pillar, index }: { pillar: any; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reduced = useReducedMotion();

  // Smooth out the raw mouse values
  const mouseX = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 300, damping: 30 });

  // Rotate based on mouse position relative to the center of the card
  const rotateX = useTransform(mouseY, [-0.5, 0.5], reduced ? ["0deg", "0deg"] : ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], reduced ? ["0deg", "0deg"] : ["-5deg", "5deg"]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    // Normalized position from -0.5 to 0.5
    const mouseXPos = event.clientX - rect.left;
    const mouseYPos = event.clientY - rect.top;
    x.set(mouseXPos / width - 0.5);
    y.set(mouseYPos / height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
      style={{
        rotateX: rotateX as any,
        rotateY: rotateY as any,
        transformStyle: "preserve-3d",
        perspective: 1000,
        height: "100%",
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: "100%",
          p: { xs: 4, md: 5 },
          borderRadius: "32px",
          bgcolor: GROUND.dark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
          backdropFilter: "blur(40px)",
          border: `1px solid ${GROUND.rule}`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transition: "border-color 0.3s ease",
          "&:hover": {
            borderColor: GROUND.dark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        {/* Dynamic Glow Mesh */}
        <motion.div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at center, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0) 60%)`,
            opacity: 0,
            pointerEvents: "none",
          }}
          whileHover={{ opacity: 1, scale: 1.5 }}
          transition={{ duration: 0.4 }}
        />
        
        {/* Giant Watermark Number */}
        <Typography
          sx={{
            position: "absolute",
            top: { xs: "-10px", md: "-20px" },
            right: { xs: "-10px", md: "-20px" },
            fontFamily: MONO,
            fontSize: { xs: "8rem", md: "12rem" },
            lineHeight: 1,
            fontWeight: 800,
            color: GROUND.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
            pointerEvents: "none",
            userSelect: "none",
            transform: "translateZ(-20px)",
          }}
        >
          {pillar.id}
        </Typography>

        {/* Content */}
        <Box sx={{ position: "relative", zIndex: 1, transform: "translateZ(30px)", flex: 1, display: "flex", flexDirection: "column" }}>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "1rem",
              color: NOIR.gold,
              mb: 3,
            }}
          >
            {pillar.id}
          </Typography>

          <Typography variant="h4" component="h3" sx={{ mb: 2, fontWeight: 600, color: GROUND.fg }}>
            {pillar.name}
          </Typography>

          <Typography sx={{ color: GROUND.muted, lineHeight: 1.7, fontSize: "1.05rem" }}>
            {pillar.detail}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}

export function OperatingPillars() {
  const { pillars } = CONTENT.hero.salesPitch;

  return (
    <StageSection section={homeSection("hero-pillars")}>
      {/* Immersive Full-Bleed Background Layer */}
      <Box 
        sx={{ 
          position: "absolute", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)", 
          width: "100vw", 
          height: "120vh", 
          zIndex: 0, 
          overflow: "hidden", 
          pointerEvents: "none",
          opacity: 0.35 // Base opacity so it bleeds under text
        }}
      >
        <ImmersivePillarsBackground />
      </Box>

      {/* Foreground Content */}
      <Box sx={{ width: "100%", position: "relative", zIndex: 2 }}>
        
        {/* Title Area */}
        <Box sx={{ mb: { xs: 8, md: 12 }, textAlign: { xs: "left", md: "center" } }}>
          <Typography
            component="p"
            variant="overline"
            sx={{ fontFamily: MONO, color: NOIR.gold, display: "block", mb: 2 }}
          >
            Organizational structure
          </Typography>
          <Typography variant="h2" component="h2" sx={{ maxWidth: "20ch", mx: { md: "auto" } }}>
            Three integrated operating pillars
          </Typography>
        </Box>

        {/* Staggered Glassmorphic Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 4, md: 4 },
            perspective: 2000,
          }}
        >
          {pillars.map((pillar, i) => (
            <Box 
              key={pillar.id} 
              sx={{ 
                // Staggered vertical layout
                mt: { md: i === 1 ? 6 : i === 2 ? 12 : 0 },
                mb: { md: i === 0 ? 12 : i === 1 ? 6 : 0 } 
              }}
            >
              <PillarCard pillar={pillar} index={i} />
            </Box>
          ))}
        </Box>
      </Box>
    </StageSection>
  );
}

const radarSweep = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulseNode = keyframes`
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.5); }
`;

const floatBlock = keyframes`
  0% { transform: translateY(0px) rotateX(60deg) rotateZ(45deg); opacity: 0.3; }
  50% { transform: translateY(-40px) rotateX(60deg) rotateZ(45deg); opacity: 0.8; }
  100% { transform: translateY(0px) rotateX(60deg) rotateZ(45deg); opacity: 0.3; }
`;

const pingNode = keyframes`
  0% { transform: scale(0.5); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
`;

function ImmersivePillarsBackground() {
  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {/* 1. Research Pillar Theme: Neural Network (Left/Center Spread) */}
      <Box sx={{ position: "absolute", top: "10%", left: "10%", width: "50%", height: "80%", opacity: 0.7 }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <g stroke={GROUND.muted} strokeWidth="1" opacity={0.4}>
            <path d="M 100,100 L 250,150 L 300,300 L 150,400 Z" />
            <path d="M 250,150 L 450,120 L 500,250 L 300,300" />
            <path d="M 300,300 L 400,450 L 200,550 L 150,400" />
            <path d="M 500,250 L 700,300 L 600,500 L 400,450" />
          </g>
          {/* Animated pulsing nodes */}
          <g fill={NOIR.gold}>
            <circle cx="100" cy="100" r="4" style={{ animation: `${pulseNode} 4s infinite` }} />
            <circle cx="250" cy="150" r="6" style={{ animation: `${pulseNode} 5s infinite 1s` }} />
            <circle cx="450" cy="120" r="3" style={{ animation: `${pulseNode} 3s infinite 2s` }} />
            <circle cx="300" cy="300" r="7" fill="#4a90e2" style={{ animation: `${pulseNode} 6s infinite 0.5s` }} />
            <circle cx="150" cy="400" r="5" style={{ animation: `${pulseNode} 4s infinite 1.5s` }} />
            <circle cx="500" cy="250" r="8" fill="#4a90e2" style={{ animation: `${pulseNode} 5.5s infinite 2.5s` }} />
            <circle cx="700" cy="300" r="4" style={{ animation: `${pulseNode} 3.5s infinite 0.2s` }} />
            <circle cx="600" cy="500" r="5" style={{ animation: `${pulseNode} 4.5s infinite 1.2s` }} />
            <circle cx="400" cy="450" r="6" fill="#4a90e2" style={{ animation: `${pulseNode} 5s infinite 0.8s` }} />
            <circle cx="200" cy="550" r="4" style={{ animation: `${pulseNode} 3s infinite 1.8s` }} />
          </g>
        </svg>
      </Box>

      {/* 2. Development Pillar Theme: Isometric Cloud Blocks (Center/Right Spread) */}
      <Box sx={{ position: "absolute", top: "20%", right: "15%", width: "40%", height: "70%" }}>
        {[...Array(6)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              top: `${15 + i * 12}%`,
              left: `${10 + (i % 3) * 20}%`,
              width: 80,
              height: 80,
              border: `1px solid ${NOIR.gold}40`,
              bgcolor: GROUND.dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
              backdropFilter: "blur(4px)",
              animation: `${floatBlock} ${8 + i}s ease-in-out infinite ${i * 0.5}s`,
              transformStyle: "preserve-3d",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                border: `1px solid ${GROUND.rule}`,
                transform: "translateZ(-20px)",
              },
              "&::after": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                border: "1px solid rgba(74,144,226,0.3)",
                transform: "translateZ(20px)",
              }
            }}
          />
        ))}
      </Box>

      {/* 3. Support Pillar Theme: Global Telemetry / Radar Sweep (Bottom Right Area) */}
      <Box sx={{ position: "absolute", bottom: "-10%", right: "-5%", width: "600px", height: "600px", opacity: 0.5 }}>
        <Box sx={{ position: "relative", width: "100%", height: "100%", borderRadius: "50%", border: `1px solid ${GROUND.muted}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Concentric rings */}
          <Box sx={{ position: "absolute", width: "70%", height: "70%", borderRadius: "50%", border: `1px dashed ${GROUND.rule}` }} />
          <Box sx={{ position: "absolute", width: "40%", height: "40%", borderRadius: "50%", border: `1px solid ${GROUND.rule}` }} />
          
          {/* Radar Sweep */}
          <Box sx={{ 
            position: "absolute", 
            width: "50%", 
            height: "50%", 
            top: 0, 
            right: "50%",
            transformOrigin: "bottom right",
            background: `linear-gradient(45deg, transparent 40%, rgba(74,144,226,0.2) 100%)`,
            borderRight: "2px solid #4a90e2",
            animation: `${radarSweep} 10s linear infinite`
          }} />
          
          {/* Global Operation Nodes */}
          <Box sx={{ position: "absolute", top: "30%", left: "40%", width: 8, height: 8, borderRadius: "50%", bgcolor: "#27c93f" }}>
            <Box sx={{ position: "absolute", top: -4, left: -4, width: 16, height: 16, borderRadius: "50%", border: "2px solid #27c93f", animation: `${pingNode} 2s infinite` }} />
          </Box>
          <Box sx={{ position: "absolute", bottom: "35%", right: "25%", width: 6, height: 6, borderRadius: "50%", bgcolor: NOIR.gold }}>
            <Box sx={{ position: "absolute", top: -3, left: -3, width: 12, height: 12, borderRadius: "50%", border: `2px solid ${NOIR.gold}`, animation: `${pingNode} 2.5s infinite 1s` }} />
          </Box>
          <Box sx={{ position: "absolute", top: "60%", left: "20%", width: 5, height: 5, borderRadius: "50%", bgcolor: "#4a90e2" }}>
            <Box sx={{ position: "absolute", top: -2.5, left: -2.5, width: 10, height: 10, borderRadius: "50%", border: "2px solid #4a90e2", animation: `${pingNode} 3s infinite 0.5s` }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
