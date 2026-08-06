import { motion } from "motion/react";
import { NOIR } from "@/shared/theme/palette";

// Simple abstract 2D Vector visualizations based on service ID with continuous animations
export function ServiceVector({ id }: { id: string }) {
  if (id === "development" || id === "service-dev") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Abstract Software Development Cycle */}
        
        {/* Central Core */}
        <motion.circle
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          cx="200"
          cy="200"
          r="30"
          fill="none"
          stroke={NOIR.gold}
          strokeWidth="2"
        />
        <motion.circle
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          cx="200"
          cy="200"
          r="50"
          stroke={NOIR.goldLight}
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />

        {/* Circular Lifecycle Path (Clockwise Flow) */}
        <motion.circle
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          cx="200"
          cy="200"
          r="120"
          stroke={NOIR.goldDark}
          strokeWidth="2.5"
          strokeDasharray="8 8"
          style={{ originX: "200px", originY: "200px" }}
        />

        {/* Directional Curved Arrows Connecting the 4 Phases */}
        {/* Top-Right Arc Arrow (Plan -> Code) */}
        <motion.path
          d="M 230 84 A 120 120 0 0 1 316 170"
          stroke={NOIR.gold}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <motion.path
          d="M 310 152 L 318 174 L 296 170"
          stroke={NOIR.gold}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Bottom-Right Arc Arrow (Code -> Deploy) */}
        <motion.path
          d="M 316 230 A 120 120 0 0 1 230 316"
          stroke={NOIR.goldLight}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <motion.path
          d="M 248 310 L 226 318 L 230 296"
          stroke={NOIR.goldLight}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Bottom-Left Arc Arrow (Deploy -> Monitor) */}
        <motion.path
          d="M 170 316 A 120 120 0 0 1 84 230"
          stroke={NOIR.goldDark}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <motion.path
          d="M 90 248 L 82 226 L 104 230"
          stroke={NOIR.goldDark}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Top-Left Arc Arrow (Monitor -> Plan) */}
        <motion.path
          d="M 84 170 A 120 120 0 0 1 170 84"
          stroke={NOIR.mist}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <motion.path
          d="M 152 90 L 174 82 L 170 104"
          stroke={NOIR.mist}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* 4 Abstract SDLC Phase Nodes */}
        {/* Phase 1: Architecture / Design */}
        <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          <rect x="165" y="55" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.gold} strokeWidth="2" />
          <rect x="177" y="70" width="22" height="4" rx="2" fill={NOIR.goldLight} />
          <rect x="177" y="80" width="46" height="4" rx="2" fill={NOIR.mist} />
          <circle cx="218" cy="72" r="6" fill={NOIR.gold} />
        </motion.g>

        {/* Phase 2: Code / Build */}
        <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
          <rect x="295" y="175" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.goldLight} strokeWidth="2" />
          <path d="M 315 192 L 308 200 L 315 208 M 345 192 L 352 200 L 345 208 M 332 190 L 328 210" stroke={NOIR.goldLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>

        {/* Phase 3: Test / Deploy */}
        <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}>
          <rect x="165" y="295" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.goldDark} strokeWidth="2" />
          <path d="M 185 320 L 195 328 L 215 312" stroke={NOIR.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>

        {/* Phase 4: Operate / Monitor */}
        <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 3 }}>
          <rect x="35" y="175" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.mist} strokeWidth="2" />
          <path d="M 48 200 L 58 200 L 63 190 L 70 210 L 77 195 L 82 200 L 92 200" stroke={NOIR.mist} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      </svg>
    );
  }
  if (id === "quant-research" || id === "service-quant") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.circle 
          animate={{ r: [120, 130, 120], opacity: [0.6, 1, 0.6] }} 
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} 
          cx="200" 
          cy="200" 
          stroke={NOIR.gold} 
          strokeWidth="2" 
          strokeDasharray="4 4" 
        />
        <motion.circle 
          animate={{ r: [80, 85, 80], opacity: [0.8, 0.4, 0.8] }} 
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }} 
          cx="200" 
          cy="200" 
          stroke={NOIR.goldLight} 
          strokeWidth="4" 
        />
        <motion.path 
          animate={{ pathLength: [0, 1, 0] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} 
          d="M50 200 Q 150 50, 200 200 T 350 200" 
          stroke={NOIR.mist} 
          strokeWidth="3" 
          fill="transparent" 
        />
      </svg>
    );
  }
  if (id === "data-science" || id === "service-data") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Bars */}
        <motion.rect
          animate={{ height: [90, 110, 90], y: [260, 240, 260] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          x="50" width="60" rx="8" fill={NOIR.goldDark}
        />
        <motion.rect
          animate={{ height: [180, 160, 180], y: [170, 190, 170] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          x="170" width="60" rx="8" fill={NOIR.gold}
        />
        <motion.rect
          animate={{ height: [270, 290, 270], y: [80, 60, 80] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          x="290" width="60" rx="8" fill={NOIR.goldLight}
        />

        {/* Upward Trend Graph Line */}
        <motion.path
          d="M 50 242.5 L 200 130 L 350 18"
          stroke={NOIR.gold}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ strokeDashoffset: [400, 0] }}
          strokeDasharray="400"
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        {/* Upward Direction Arrowhead */}
        <motion.path
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          d="M 326 18 H 350 V 42"
          stroke={NOIR.gold}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Graph Data Node Circles */}
        <motion.circle cx="80" cy="220" r="5" fill={NOIR.goldLight} stroke={NOIR.goldDark} strokeWidth="2" 
          animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 0 }} />
        <motion.circle cx="200" cy="130" r="5" fill={NOIR.goldLight} stroke={NOIR.goldDark} strokeWidth="2" 
          animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />
        <motion.circle cx="320" cy="40" r="5" fill={NOIR.goldLight} stroke={NOIR.goldDark} strokeWidth="2" 
          animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 2 }} />
      </svg>
    );
  }
  // Support / DevOps: Terminal monitor with flowing code streams
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Outer Glow Backdrop */}
        <rect x="50" y="75" width="300" height="250" rx="14" fill={NOIR.navyInk} stroke={NOIR.gold} strokeWidth="2.5" style={{ filter: "drop-shadow(0 12px 32px rgba(212,175,55,0.2))" }} />
        
        {/* Terminal Header */}
        <rect x="50" y="75" width="300" height="34" rx="14" fill={NOIR.navyPanel} />
        <circle cx="70" cy="92" r="4" fill={NOIR.gold} opacity="0.9" />
        <circle cx="84" cy="92" r="4" fill={NOIR.gold} opacity="0.55" />
        <circle cx="98" cy="92" r="4" fill={NOIR.gold} opacity="0.3" />
        <line x1="50" y1="109" x2="350" y2="109" stroke={NOIR.goldDark} strokeWidth="1" opacity="0.4" />

        {/* Abstract Terminal Code Streams */}
        <motion.rect animate={{ opacity: [0.9, 0.4, 0.9] }} transition={{ duration: 2, repeat: Infinity }} x="70" y="125" width="40" height="5" rx="2.5" fill={NOIR.goldLight} />
        <rect x="118" y="125" width="100" height="5" rx="2.5" fill={NOIR.mist} opacity="0.6" />
        <rect x="226" y="125" width="60" height="5" rx="2.5" fill={NOIR.goldDark} opacity="0.75" />

        <rect x="70" y="145" width="130" height="5" rx="2.5" fill={NOIR.goldDark} opacity="0.8" />
        <motion.rect animate={{ opacity: [0.95, 0.5, 0.95] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} x="208" y="145" width="50" height="5" rx="2.5" fill={NOIR.goldLight} />
        <rect x="266" y="145" width="35" height="5" rx="2.5" fill={NOIR.mist} opacity="0.5" />

        <rect x="90" y="165" width="75" height="5" rx="2.5" fill={NOIR.gold} opacity="0.85" />
        <rect x="173" y="165" width="110" height="5" rx="2.5" fill={NOIR.mist} opacity="0.6" />

        <rect x="90" y="185" width="140" height="5" rx="2.5" fill={NOIR.goldLight} opacity="0.9" />
        <motion.rect animate={{ x: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity }} x="238" y="185" width="45" height="5" rx="2.5" fill={NOIR.goldDark} opacity="0.7" />

        <rect x="110" y="205" width="60" height="5" rx="2.5" fill={NOIR.gold} opacity="0.9" />
        <rect x="178" y="205" width="95" height="5" rx="2.5" fill={NOIR.mist} opacity="0.5" />

        <rect x="70" y="225" width="155" height="5" rx="2.5" fill={NOIR.goldDark} opacity="0.8" />
        <rect x="233" y="225" width="70" height="5" rx="2.5" fill={NOIR.goldLight} opacity="0.85" />

        <motion.rect animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} x="70" y="245" width="90" height="5" rx="2.5" fill={NOIR.mist} />
        <rect x="168" y="245" width="115" height="5" rx="2.5" fill={NOIR.gold} opacity="0.85" />

        <rect x="70" y="265" width="110" height="5" rx="2.5" fill={NOIR.goldLight} opacity="0.9" />
        
        {/* Blinking Cursor */}
        <motion.rect 
          animate={{ opacity: [1, 0, 1] }} 
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} 
          x="188" y="260" width="8" height="13" fill={NOIR.goldLight} 
        />
      </motion.g>
    </svg>
  );
}
