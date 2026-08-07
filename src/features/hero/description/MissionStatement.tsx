import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/system";
import MemoryIcon from "@mui/icons-material/Memory";
import DataObjectIcon from "@mui/icons-material/DataObject";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";

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
  0% { transform: translateY(0px); }
  50% { transform: translateY(-30px); }
  100% { transform: translateY(0px); }
`;

const floatY2 = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(20px); }
  100% { transform: translateY(0px); }
`;

const scrollUp = keyframes`
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
`;

const dashAnim = keyframes`
  to {
    stroke-dashoffset: -1000;
  }
`;

const blinkRed = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
`;

const blinkGreen = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
`;

function ImmersiveTechBackground() {
  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {/* 1. Animated Data Pipelines (SVG) */}
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.6 }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <g stroke={GROUND.muted} strokeWidth="1" fill="none" opacity={0.3}>
            {/* Grid lines */}
            <path d="M 0,200 L 2000,200 M 0,500 L 2000,500 M 0,800 L 2000,800" />
            <path d="M 400,0 L 400,1200 M 1000,0 L 1000,1200 M 1500,0 L 1500,1200" />
          </g>
          <g stroke={NOIR.gold} strokeWidth="2" fill="none" opacity={0.7} style={{ filter: "drop-shadow(0 0 4px rgba(212,175,55,0.8))" }}>
            {/* Active Data Pipelines */}
            <path 
              d="M -100,300 C 300,300 400,600 800,600 S 1000,200 1500,200 L 2100,200" 
              strokeDasharray="20, 10, 5, 10"
              style={{ animation: `${dashAnim} 20s linear infinite` }}
            />
            <path 
              d="M 2100,700 C 1800,700 1500,900 1200,900 S 800,400 400,400 L -100,400" 
              strokeDasharray="15, 25"
              stroke="#4a90e2"
              style={{ animation: `${dashAnim} 15s linear infinite reverse`, filter: "drop-shadow(0 0 6px rgba(74,144,226,0.6))" }}
            />
            <path 
              d="M 600,-100 L 600,400 L 1200,400 L 1200,1300" 
              strokeDasharray="50, 50"
              style={{ animation: `${dashAnim} 25s linear infinite` }}
            />
          </g>
        </svg>
      </Box>

      {/* 2. Floating Command Terminals */}
      <Box sx={{ position: "absolute", top: "15%", right: "10%", animation: `${floatY1} 12s ease-in-out infinite` }}>
        <Box sx={{ 
          width: 320, 
          height: 200, 
          bgcolor: "rgba(10, 10, 15, 0.8)", 
          borderRadius: 2, 
          border: `1px solid ${NOIR.hairline}`,
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          overflow: "hidden",
          backdropFilter: "blur(8px)",
        }}>
          {/* Terminal Header */}
          <Box sx={{ height: 24, bgcolor: "rgba(255,255,255,0.05)", borderBottom: `1px solid ${NOIR.hairline}`, display: "flex", alignItems: "center", px: 1.5, gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ff5f56" }} />
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ffbd2e" }} />
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#27c93f" }} />
            <Typography sx={{ ml: 2, fontSize: "0.6rem", fontFamily: "monospace", color: "text.secondary" }}>root@phitopolis-aws-prod-1</Typography>
          </Box>
          {/* Terminal Body */}
          <Box sx={{ p: 1.5, height: "100%", overflow: "hidden", position: "relative" }}>
            <Box sx={{ animation: `${scrollUp} 20s linear infinite` }}>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#4a90e2", mb: 0.5 }}>$ docker run -d -p 80:80 quant-ml-engine</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.6rem", color: "text.secondary", mb: 0.5 }}>[INFO] Initializing TensorFlow session...</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.6rem", color: "text.secondary", mb: 0.5 }}>[INFO] Allocating GPU memory (16GB)...</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.6rem", color: "text.secondary", mb: 0.5 }}>[OK]   Model weights loaded from s3://phit-models/v4.2</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.6rem", color: NOIR.gold, mb: 0.5 }}>[WARN] Latency threshold tuned to &lt; 500μs</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#27c93f", mb: 0.5 }}>[SUCCESS] Engine bound to port 80</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#4a90e2", mb: 0.5, mt: 1 }}>$ tail -f /var/log/syslog</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.6rem", color: "text.secondary", mb: 0.5 }}>Incoming connection from 192.168.1.104</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.6rem", color: "text.secondary", mb: 0.5 }}>Packet processed in 120μs</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.6rem", color: "text.secondary", mb: 0.5 }}>Trade signal dispatched: BUY AAPL</Typography>
              
              {/* Duplicate for infinite scroll illusion */}
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#4a90e2", mb: 0.5, mt: 2 }}>$ docker run -d -p 80:80 quant-ml-engine</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.6rem", color: "text.secondary", mb: 0.5 }}>[INFO] Initializing TensorFlow session...</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.6rem", color: "text.secondary", mb: 0.5 }}>[INFO] Allocating GPU memory (16GB)...</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.6rem", color: "text.secondary", mb: 0.5 }}>[OK]   Model weights loaded from s3://phit-models/v4.2</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 3. AWS Server Instances / Rack */}
      <Box sx={{ position: "absolute", bottom: "10%", right: "30%", animation: `${floatY2} 15s ease-in-out infinite` }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {[1, 2, 3, 4].map((i) => (
            <Box 
              key={i} 
              sx={{ 
                width: 180, 
                height: 28, 
                bgcolor: "rgba(20, 20, 30, 0.9)", 
                border: "1px solid rgba(255,255,255,0.1)", 
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                px: 2,
                justifyContent: "space-between",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 10px rgba(0,0,0,0.5)"
              }}
            >
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Box sx={{ width: 12, height: 4, bgcolor: "rgba(255,255,255,0.2)", borderRadius: 0.5 }} />
                <Box sx={{ width: 12, height: 4, bgcolor: "rgba(255,255,255,0.2)", borderRadius: 0.5 }} />
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#27c93f", animation: `${blinkGreen} ${2 + i * 0.5}s infinite` }} />
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: i === 3 ? "#ffbd2e" : "#4a90e2", animation: `${blinkRed} ${3 + i * 0.3}s infinite` }} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* 4. Software Engineering & Architecture Floating Icons */}
      <Box sx={{ position: "absolute", top: "25%", right: "45%", animation: `${floatY2} 9s ease-in-out infinite reverse` }}>
        <Box sx={{ p: 2, borderRadius: "50%", bgcolor: "rgba(212, 175, 55, 0.05)", border: `1px solid ${NOIR.gold}40`, backdropFilter: "blur(8px)" }}>
          <DataObjectIcon sx={{ fontSize: 50, color: NOIR.gold }} />
        </Box>
      </Box>

      <Box sx={{ position: "absolute", bottom: "35%", right: "15%", animation: `${floatY1} 10s ease-in-out infinite` }}>
        <Box sx={{ p: 2, borderRadius: "50%", bgcolor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(4px)" }}>
          <CloudQueueIcon sx={{ fontSize: 40, color: GROUND.muted }} />
        </Box>
      </Box>

      <Box sx={{ position: "absolute", top: "60%", right: "50%", animation: `${floatY1} 14s ease-in-out infinite reverse` }}>
        <Box sx={{ p: 1.5, borderRadius: "50%", bgcolor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(4px)" }}>
          <MemoryIcon sx={{ fontSize: 32, color: GROUND.muted }} />
        </Box>
      </Box>

      <Box sx={{ position: "absolute", top: "10%", right: "25%", animation: `${floatY2} 11s ease-in-out infinite` }}>
        <Box sx={{ p: 1.5, borderRadius: "50%", bgcolor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(4px)" }}>
          <AnalyticsOutlinedIcon sx={{ fontSize: 36, color: GROUND.muted }} />
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
