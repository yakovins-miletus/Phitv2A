import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/system";
import { Cpu, Code, Cloud, ChartBar } from "@phosphor-icons/react";

import { CONTENT } from "@/shared/content";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { NOIR } from "@/shared/theme/palette";

// Follows the section registry rather than naming a ground twice — see the same
// note in MarketPosition.tsx.
const GROUND = GROUNDS[homeSection("hero-mission").ground ?? "deep"];

/**
 * Act I, beat 1 — the claim.
 *
 * One of three sections that replaced a four-beat slide deck. The deck switched
 * `display: none` between beats inside a single centred 1140px flex box wrapping a
 * glass card, so every beat was the same object with different words in it — the
 * reason it read as interchangeable regardless of the copy.
 *
 * This beat's identity is **typographic scale on a hard left edge**: no card, no
 * centring, no container chrome, and the right ~40% left deliberately empty.
 * Whitespace is the only device. The eye lands on the first word of the title and
 * has nowhere else to go.
 */
export function MissionStatement() {
  const { heroLine, execSummary } = CONTENT.hero.salesPitch;

  return (
    <StageSection section={homeSection("hero-mission")}>
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
        <ImmersiveTechBackground />
      </Box>

      {/* Foreground Content */}
      <Box sx={{ position: "relative", zIndex: 2, maxWidth: { xs: "100%", md: "62%" } }}>
        <Typography variant="h1" component="h2" sx={{ mb: 4 }}>
          {titleWithKeyedTail(heroLine.title)}
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: "1.05rem", md: "1.25rem" },
            lineHeight: 1.5,
            color: GROUND.muted,
            maxWidth: "52ch",
            mb: 3,
          }}
        >
          {heroLine.subheading}
        </Typography>

        <Typography sx={{ lineHeight: 1.65, color: GROUND.muted, maxWidth: "68ch" }}>
          {execSummary}
        </Typography>
      </Box>
    </StageSection>
  );
}

const floatY1 = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const floatY2 = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(20px) rotate(-2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const pulseAlpha = keyframes`
  0%, 100% { opacity: 0.1; }
  50% { opacity: 0.4; }
`;

function ImmersiveTechBackground() {
  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Abstract Grid Mesh - replacing the hand-rolled SVG data pipelines */}
      <Box 
        sx={{ 
          position: "absolute", 
          inset: 0, 
          opacity: 0.15,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)",
        }} 
      />

      {/* 
        Abstract geometric clusters representing computation and architecture, 
        replacing fake UI chrome (terminals / dashboards).
      */}
      <Box sx={{ position: "absolute", top: "15%", right: "10%", animation: `${floatY1} 14s ease-in-out infinite` }}>
        <Box sx={{ 
          width: 320, 
          height: 320, 
          borderRadius: "50%",
          background: `radial-gradient(circle, ${NOIR.gold}10 0%, transparent 70%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: `${pulseAlpha} 8s ease-in-out infinite`
        }} />
      </Box>

      {/* Phosphor Icons - Floating abstract technical symbols */}
      <Box sx={{ position: "absolute", top: "25%", right: "45%", animation: `${floatY2} 12s ease-in-out infinite reverse` }}>
        <Box sx={{ p: 2.5, borderRadius: "24px", bgcolor: "rgba(212, 175, 55, 0.05)", border: `1px solid ${NOIR.gold}30`, backdropFilter: "blur(12px)" }}>
          <Code weight="light" size={48} color={NOIR.gold} />
        </Box>
      </Box>

      <Box sx={{ position: "absolute", bottom: "30%", right: "15%", animation: `${floatY1} 15s ease-in-out infinite` }}>
        <Box sx={{ p: 2, borderRadius: "20px", bgcolor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
          <Cloud weight="light" size={40} color={GROUND.muted} />
        </Box>
      </Box>

      <Box sx={{ position: "absolute", top: "60%", right: "50%", animation: `${floatY1} 18s ease-in-out infinite reverse` }}>
        <Box sx={{ p: 1.5, borderRadius: "16px", bgcolor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(6px)" }}>
          <Cpu weight="light" size={32} color={GROUND.muted} />
        </Box>
      </Box>

      <Box sx={{ position: "absolute", top: "12%", right: "25%", animation: `${floatY2} 14s ease-in-out infinite` }}>
        <Box sx={{ p: 1.5, borderRadius: "16px", bgcolor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(6px)" }}>
          <ChartBar weight="light" size={36} color={GROUND.muted} />
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Key the last three words of the title in gold.
 *
 * The deck keyed the literal substring "R&D firm" out of the exec summary with a
 * regex split, which silently produced no highlight at all if the copy changed.
 * Keying by position instead degrades to "no highlight" only when the title is
 * shorter than three words.
 */
function titleWithKeyedTail(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 4) return title;
  const head = words.slice(0, -3).join(" ");
  const tail = words.slice(-3).join(" ");
  return (
    <>
      {head}{" "}
      <Box component="span" sx={{ color: NOIR.gold }}>
        {tail}
      </Box>
    </>
  );
}
