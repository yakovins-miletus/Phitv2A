import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

/** 2D Combined Visual 01: Global Command Hub & Origin Matrix */
export function OriginHubVisual() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        maxWidth: 720,
        maxHeight: 420,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "20px",
        bgcolor: alpha(NOIR.panel, 0.9),
        border: `2px solid ${NOIR.gold}`,
        boxShadow: `0 0 40px ${alpha(NOIR.gold, 0.25)}`,
        backdropFilter: "blur(20px)",
        p: 3,
        overflow: "hidden",
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 500 320" fill="none">
        <defs>
          <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={NOIR.gold} stopOpacity="0.6" />
            <stop offset="100%" stopColor={NOIR.gold} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={NOIR.gold} stopOpacity="0.9" />
            <stop offset="100%" stopColor={NOIR.navyField} stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Global Coordinate Rings */}
        <circle cx="250" cy="160" r="120" stroke={alpha(NOIR.gold, 0.3)} strokeWidth="2" strokeDasharray="6 6" />
        <circle cx="250" cy="160" r="85" stroke={NOIR.gold} strokeWidth="2.5" />
        <circle cx="250" cy="160" r="45" stroke={alpha(NOIR.navyField, 0.8)} strokeWidth="3" />
        <circle cx="250" cy="160" r="100" fill="url(#hubGlow)" />

        {/* Network Vectors */}
        <line x1="250" y1="160" x2="130" y2="80" stroke="url(#lineGrad)" strokeWidth="2.5" />
        <line x1="250" y1="160" x2="370" y2="80" stroke="url(#lineGrad)" strokeWidth="2.5" />
        <line x1="250" y1="160" x2="390" y2="230" stroke="url(#lineGrad)" strokeWidth="2.5" />
        <line x1="250" y1="160" x2="110" y2="240" stroke="url(#lineGrad)" strokeWidth="2.5" />

        {/* Hub Nodes */}
        <circle cx="130" cy="80" r="8" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="3" />
        <circle cx="370" cy="80" r="8" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="3" />
        <circle cx="390" cy="230" r="8" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="3" />
        <circle cx="110" cy="240" r="8" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="3" />

        {/* Center Node */}
        <circle cx="250" cy="160" r="14" fill={NOIR.gold} />
        <circle cx="250" cy="160" r="22" stroke={NOIR.gold} strokeWidth="2.5" fill="none" />
      </svg>

      <Box sx={{ position: "absolute", top: 16, left: 20 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: "0.72rem", color: NOIR.gold, fontWeight: 800 }}>
          [ ORIGIN HUB ] 14°33'N 121°03'E
        </Typography>
      </Box>
    </Box>
  );
}

/** 2D Combined Visual 02: Market Depth & Intellectual Puzzle Matrix */
export function MarketPuzzleVisual() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        maxWidth: 720,
        maxHeight: 420,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "20px",
        bgcolor: alpha(NOIR.panel, 0.9),
        border: `2px solid ${NOIR.gold}`,
        boxShadow: `0 0 40px ${alpha(NOIR.gold, 0.25)}`,
        backdropFilter: "blur(20px)",
        p: 3,
        overflow: "hidden",
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 500 320" fill="none">
        <pattern id="gridPattern" width="25" height="25" patternUnits="userSpaceOnUse">
          <path d="M 25 0 L 0 0 0 25" fill="none" stroke={alpha(NOIR.gold, 0.15)} strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#gridPattern)" />

        {/* Market Depth Area Charts */}
        <path d="M 60 250 Q 160 240, 230 160 T 250 140 L 250 270 L 60 270 Z" fill={alpha(NOIR.gold, 0.35)} stroke={NOIR.gold} strokeWidth="3" />
        <path d="M 440 250 Q 340 240, 270 160 T 250 140 L 250 270 L 440 270 Z" fill={alpha(NOIR.navyField, 0.5)} stroke={NOIR.gold} strokeWidth="2.5" />

        <line x1="250" y1="50" x2="250" y2="270" stroke={NOIR.gold} strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="250" cy="140" r="10" fill={NOIR.gold} />

        {/* Order Book Cards */}
        <rect x="90" y="70" width="100" height="40" rx="8" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="2" />
        <text x="140" y="95" fill={NOIR.gold} fontSize="12" fontFamily={MONO} textAnchor="middle" fontWeight="bold">BID: 104.28</text>

        <rect x="310" y="70" width="100" height="40" rx="8" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="2" />
        <text x="360" y="95" fill="#FFFFFF" fontSize="12" fontFamily={MONO} textAnchor="middle" fontWeight="bold">ASK: 104.31</text>
      </svg>

      <Box sx={{ position: "absolute", top: 16, left: 20 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: "0.72rem", color: NOIR.gold, fontWeight: 800 }}>
          [ INTELLECTUAL PUZZLE ] MARKET DEPTH MATRIX
        </Typography>
      </Box>
    </Box>
  );
}

/** 2D Combined Visual 03: Pure R&D Reactor & Blueprint Lab */
export function RnDReactorVisual() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        maxWidth: 720,
        maxHeight: 420,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "20px",
        bgcolor: alpha(NOIR.panel, 0.9),
        border: `2px solid ${NOIR.gold}`,
        boxShadow: `0 0 40px ${alpha(NOIR.gold, 0.25)}`,
        backdropFilter: "blur(20px)",
        p: 3,
        overflow: "hidden",
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 500 320" fill="none">
        <circle cx="250" cy="160" r="115" stroke={alpha(NOIR.gold, 0.35)} strokeWidth="2" strokeDasharray="12 6" />
        <circle cx="250" cy="160" r="85" stroke={NOIR.gold} strokeWidth="2.5" />
        <circle cx="250" cy="160" r="55" stroke={alpha(NOIR.navyField, 0.8)} strokeWidth="6" />
        <circle cx="250" cy="160" r="28" fill={NOIR.gold} />

        <line x1="80" y1="160" x2="420" y2="160" stroke={alpha(NOIR.gold, 0.3)} strokeWidth="1.5" />
        <line x1="250" y1="30" x2="250" y2="290" stroke={alpha(NOIR.gold, 0.3)} strokeWidth="1.5" />

        <text x="300" y="110" fill={NOIR.gold} fontSize="13" fontFamily={MONO} fontWeight="bold">θ_opt = argmin L(w)</text>
        <text x="110" y="225" fill="#FFFFFF" fontSize="13" fontFamily={MONO} fontWeight="bold">∇L_t = E[g_t · H^-1]</text>
      </svg>

      <Box sx={{ position: "absolute", top: 16, left: 20 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: "0.72rem", color: NOIR.gold, fontWeight: 800 }}>
          [ R&D FIRM ] PROPRIETARY CORE LAB
        </Typography>
      </Box>
    </Box>
  );
}

/** 2D Combined Visual 04.a: Production Technology Engine & Solutions Pipeline */
export function TechEngineVisual() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        maxWidth: 720,
        maxHeight: 420,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "20px",
        bgcolor: alpha(NOIR.panel, 0.9),
        border: `2px solid ${NOIR.gold}`,
        boxShadow: `0 0 40px ${alpha(NOIR.gold, 0.25)}`,
        backdropFilter: "blur(20px)",
        p: 3,
        overflow: "hidden",
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 500 320" fill="none">
        <rect x="60" y="115" width="100" height="90" rx="10" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="2" />
        <text x="110" y="155" fill="#FFFFFF" fontSize="12" fontFamily={MONO} textAnchor="middle" fontWeight="bold">INGEST</text>
        <text x="110" y="175" fill={NOIR.gold} fontSize="10" fontFamily={MONO} textAnchor="middle" fontWeight="bold">18μs FEED</text>

        <rect x="200" y="100" width="110" height="120" rx="12" fill={alpha(NOIR.panel, 0.95)} stroke={NOIR.gold} strokeWidth="3" />
        <text x="255" y="150" fill={NOIR.gold} fontSize="14" fontFamily={MONO} textAnchor="middle" fontWeight="bold">ENGINE</text>
        <text x="255" y="175" fill="#FFFFFF" fontSize="11" fontFamily={MONO} textAnchor="middle" fontWeight="bold">SOLUTIONS</text>

        <rect x="350" y="115" width="100" height="90" rx="10" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="2" />
        <text x="400" y="155" fill="#FFFFFF" fontSize="12" fontFamily={MONO} textAnchor="middle" fontWeight="bold">OUTPUT</text>
        <text x="400" y="175" fill={NOIR.gold} fontSize="10" fontFamily={MONO} textAnchor="middle" fontWeight="bold">DEPLOYED</text>

        <path d="M 160 160 L 200 160" stroke={NOIR.gold} strokeWidth="3" strokeDasharray="4 4" />
        <path d="M 310 160 L 350 160" stroke={NOIR.gold} strokeWidth="3" strokeDasharray="4 4" />
      </svg>

      <Box sx={{ position: "absolute", top: 16, left: 20 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: "0.72rem", color: NOIR.gold, fontWeight: 800 }}>
          [ SOLUTIONS ENGINE ] PIPELINE ARCHITECTURE
        </Typography>
      </Box>
    </Box>
  );
}

/** 2D Combined Visual 04.b: Deep Insights & Radar Vector Analysis */
export function DeepInsightsVisual() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        maxWidth: 720,
        maxHeight: 420,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "20px",
        bgcolor: alpha(NOIR.panel, 0.9),
        border: `2px solid ${NOIR.gold}`,
        boxShadow: `0 0 40px ${alpha(NOIR.gold, 0.25)}`,
        backdropFilter: "blur(20px)",
        p: 3,
        overflow: "hidden",
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 500 320" fill="none">
        <circle cx="250" cy="160" r="120" stroke={alpha(NOIR.gold, 0.3)} strokeWidth="1.5" />
        <circle cx="250" cy="160" r="85" stroke={alpha(NOIR.gold, 0.4)} strokeWidth="2" />
        <circle cx="250" cy="160" r="50" stroke={NOIR.gold} strokeWidth="2.5" />

        <path d="M 250 160 L 360 90 A 120 120 0 0 0 250 40 Z" fill={alpha(NOIR.gold, 0.3)} />

        <circle cx="310" cy="110" r="8" fill={NOIR.gold} />
        <circle cx="190" cy="200" r="6" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="2" />
        <circle cx="290" cy="220" r="7" fill={NOIR.gold} />
      </svg>

      <Box sx={{ position: "absolute", top: 16, left: 20 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: "0.72rem", color: NOIR.gold, fontWeight: 800 }}>
          [ DEEP INSIGHTS ] RADAR VECTOR EXTRACTION
        </Typography>
      </Box>
    </Box>
  );
}

/** 2D Combined Visual 05: Modern Software Engineering Stack */
export function SoftwareEngineeringVisual() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        maxWidth: 720,
        maxHeight: 420,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "20px",
        bgcolor: alpha(NOIR.panel, 0.9),
        border: `2px solid ${NOIR.gold}`,
        boxShadow: `0 0 40px ${alpha(NOIR.gold, 0.25)}`,
        backdropFilter: "blur(20px)",
        p: 3,
        overflow: "hidden",
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 500 320" fill="none">
        <rect x="70" y="60" width="360" height="40" rx="8" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="2" />
        <text x="250" y="85" fill="#FFFFFF" fontSize="11" fontFamily={MONO} textAnchor="middle" fontWeight="bold">APPLICATION & INFRASTRUCTURE LAYER</text>

        <rect x="70" y="120" width="360" height="40" rx="8" fill={alpha(NOIR.panel, 0.95)} stroke={NOIR.gold} strokeWidth="2.5" />
        <text x="250" y="145" fill={NOIR.gold} fontSize="11" fontFamily={MONO} textAnchor="middle" fontWeight="bold">ZERO-ALLOCATION MEMORY ENGINE</text>

        <rect x="70" y="180" width="360" height="40" rx="8" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="2" />
        <text x="250" y="205" fill="#FFFFFF" fontSize="11" fontFamily={MONO} textAnchor="middle" fontWeight="bold">HARDWARE KERNEL & NIC ACCELERATION</text>

        <rect x="70" y="245" width="360" height="14" rx="7" fill={alpha(NOIR.gold, 0.2)} />
        <rect x="70" y="245" width="280" height="14" rx="7" fill={NOIR.gold} />
        <text x="250" y="277" fill={NOIR.gold} fontSize="10" fontFamily={MONO} textAnchor="middle" fontWeight="bold">LATENCY: 18 microseconds</text>
      </svg>

      <Box sx={{ position: "absolute", top: 16, left: 20 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: "0.72rem", color: NOIR.gold, fontWeight: 800 }}>
          [ SOFTWARE ENGINEERING ] ZERO-GC ARCHITECTURE
        </Typography>
      </Box>
    </Box>
  );
}

/** 2D Combined Visual 06: Artificial Intelligence Frontier & Neural Graph */
export function FrontierAIVisual() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        maxWidth: 720,
        maxHeight: 420,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "20px",
        bgcolor: alpha(NOIR.panel, 0.9),
        border: `2px solid ${NOIR.gold}`,
        boxShadow: `0 0 40px ${alpha(NOIR.gold, 0.25)}`,
        backdropFilter: "blur(20px)",
        p: 3,
        overflow: "hidden",
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 500 320" fill="none">
        <circle cx="100" cy="80" r="10" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="3" />
        <circle cx="100" cy="160" r="10" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="3" />
        <circle cx="100" cy="240" r="10" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="3" />

        <circle cx="250" cy="100" r="12" fill={NOIR.gold} />
        <circle cx="250" cy="220" r="12" fill={NOIR.gold} />

        <circle cx="400" cy="160" r="14" fill={NOIR.navyField} stroke={NOIR.gold} strokeWidth="3.5" />

        <line x1="110" y1="80" x2="238" y2="100" stroke={NOIR.gold} strokeWidth="2" />
        <line x1="110" y1="160" x2="238" y2="100" stroke={NOIR.gold} strokeWidth="2" />
        <line x1="110" y1="160" x2="238" y2="220" stroke={NOIR.gold} strokeWidth="2" />
        <line x1="110" y1="240" x2="238" y2="220" stroke={NOIR.gold} strokeWidth="2" />

        <line x1="262" y1="100" x2="386" y2="160" stroke={NOIR.gold} strokeWidth="2.5" />
        <line x1="262" y1="220" x2="386" y2="160" stroke={NOIR.gold} strokeWidth="2.5" />
      </svg>

      <Box sx={{ position: "absolute", top: 16, left: 20 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: "0.72rem", color: NOIR.gold, fontWeight: 800 }}>
          [ FRONTIER AI ] NEURAL INFERENCE WEB
        </Typography>
      </Box>
    </Box>
  );
}

export const SLIDE_VISUALS = [
  OriginHubVisual,
  MarketPuzzleVisual,
  RnDReactorVisual,
  TechEngineVisual,
  DeepInsightsVisual,
  SoftwareEngineeringVisual,
  FrontierAIVisual,
];
