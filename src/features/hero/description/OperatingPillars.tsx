import React, { useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
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
  const rotateX = useTransform(mouseY, [-0.5, 0.5], reduced ? [0, 0] : ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], reduced ? [0, 0] : ["-5deg", "5deg"]);
  
  // Highlight gradient based on mouse position
  const glowX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

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
        rotateX,
        rotateY,
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
          bgcolor: "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transition: "border-color 0.3s ease",
          "&:hover": {
            borderColor: "rgba(255, 255, 255, 0.2)",
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
            color: "rgba(255,255,255,0.03)",
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

          <Typography variant="h4" component="h3" sx={{ mb: 2, fontWeight: 600, color: "#fff" }}>
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
      <Box sx={{ width: "100%", position: "relative" }}>
        
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
