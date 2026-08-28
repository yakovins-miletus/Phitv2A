import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion } from "motion/react";
import React from "react";

import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";

export interface ProcessPhase {
  id: string;
  name: string;
  caption: string;
}

export interface ProcessModel {
  phases: readonly ProcessPhase[];
}

interface ProcessDiagramProps {
  model: ProcessModel;
}

// 4 Core Department Colors / Hues (Using variations of white/gold/transparent for minimalist aesthetic)
const CORE_COLORS = [
  NOIR.gold, // Research
  NOIR.white, // Engineering
  "#4ADE80", // Data (Using the live indicator green for contrast, or just a different shade)
  "rgba(255,255,255,0.6)" // Ops
];

// Helper to draw the network
const renderNetwork = (stage: 'foundation' | 'expansion' | 'powerhouse', reduced: boolean) => {
  let nodes: { id: number; cx: number; cy: number; r: number; fill: string }[] = [];
  let links: [number, number][] = [];
  
  if (stage === 'foundation') {
    // 2019: 4 tight core nodes
    nodes = [
      { id: 0, cx: -15, cy: -15, r: 4, fill: CORE_COLORS[0] },
      { id: 1, cx: 15, cy: -15, r: 4, fill: CORE_COLORS[1] },
      { id: 2, cx: -15, cy: 15, r: 4, fill: CORE_COLORS[2] },
      { id: 3, cx: 15, cy: 15, r: 4, fill: CORE_COLORS[3] },
    ];
    links = [[0, 1], [0, 2], [1, 3], [2, 3], [0, 3]];
  } else if (stage === 'expansion') {
    // 2020-2025: 4 cores spread out + a few satellites
    nodes = [
      // Cores
      { id: 0, cx: -30, cy: -20, r: 6, fill: CORE_COLORS[0] },
      { id: 1, cx: 30, cy: -30, r: 6, fill: CORE_COLORS[1] },
      { id: 2, cx: -40, cy: 30, r: 6, fill: CORE_COLORS[2] },
      { id: 3, cx: 40, cy: 20, r: 6, fill: CORE_COLORS[3] },
      // Satellites
      { id: 4, cx: 0, cy: 0, r: 3, fill: "rgba(255,255,255,0.4)" },
      { id: 5, cx: -60, cy: 0, r: 2, fill: "rgba(255,255,255,0.4)" },
      { id: 6, cx: 60, cy: -10, r: 2, fill: "rgba(255,255,255,0.4)" },
    ];
    links = [
      [0, 4], [1, 4], [2, 4], [3, 4],
      [0, 5], [2, 5], [1, 6], [3, 6],
      [0, 1], [2, 3]
    ];
  } else {
    // 2026: 4 massive cores + complex satellite web
    nodes = [
      // Cores
      { id: 0, cx: -45, cy: -35, r: 8, fill: CORE_COLORS[0] },
      { id: 1, cx: 55, cy: -40, r: 8, fill: CORE_COLORS[1] },
      { id: 2, cx: -55, cy: 45, r: 8, fill: CORE_COLORS[2] },
      { id: 3, cx: 45, cy: 35, r: 8, fill: CORE_COLORS[3] },
      // Intermediaries
      { id: 4, cx: -10, cy: -10, r: 4, fill: "rgba(255,255,255,0.8)" },
      { id: 5, cx: 10, cy: 10, r: 4, fill: "rgba(255,255,255,0.8)" },
      // Satellites
      { id: 6, cx: -80, cy: 10, r: 3, fill: "rgba(255,255,255,0.4)" },
      { id: 7, cx: 80, cy: -10, r: 3, fill: "rgba(255,255,255,0.4)" },
      { id: 8, cx: 0, cy: -45, r: 2, fill: "rgba(255,255,255,0.3)" },
      { id: 9, cx: -20, cy: 60, r: 2, fill: "rgba(255,255,255,0.3)" },
      { id: 10, cx: 80, cy: 50, r: 2, fill: "rgba(255,255,255,0.3)" }
    ];
    links = [
      [0, 4], [1, 4], [0, 8], [1, 8],
      [2, 5], [3, 5], [4, 5],
      [0, 6], [2, 6], [1, 7], [3, 7],
      [2, 9], [3, 10], [5, 10]
    ];
  }

  return (
    <svg viewBox="-100 -100 200 200" width="100%" height="100%" style={{ overflow: "visible" }}>
      {/* Links */}
      {links.map(([from, to], i) => (
        <motion.line
          key={`link-${i}`}
          x1={nodes[from].cx} y1={nodes[from].cy}
          x2={nodes[to].cx} y2={nodes[to].cy}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.5"
          animate={reduced ? {} : { strokeOpacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: i * 0.1 }}
        />
      ))}

      {/* Signals (Data Packets) */}
      {!reduced && links.map(([from, to], i) => {
        // More signals for later stages
        if (stage === 'foundation' && i > 2) return null;
        if (stage === 'expansion' && i > 6) return null;

        const dur = stage === 'foundation' ? 3 : stage === 'expansion' ? 2 : 1.5;
        return (
          <React.Fragment key={`packet-group-${i}`}>
            <path id={`path-${stage}-${i}`} d={`M ${nodes[from].cx} ${nodes[from].cy} L ${nodes[to].cx} ${nodes[to].cy}`} display="none" />
            <motion.circle r={stage === 'powerhouse' ? "2" : "1.5"} fill={nodes[from].fill}>
              <animateMotion dur={`${dur + Math.random()}s`} repeatCount="indefinite">
                <mpath href={`#path-${stage}-${i}`} />
              </animateMotion>
            </motion.circle>
          </React.Fragment>
        );
      })}

      {/* Nodes */}
      {nodes.map(node => (
        <motion.circle
          key={`node-${node.id}`}
          cx={node.cx} cy={node.cy} r={node.r}
          fill={node.fill}
          style={node.id < 4 ? { filter: `drop-shadow(0 0 ${node.r}px ${node.fill})` } : {}}
          animate={reduced ? {} : { scale: [1, 1.15, 1] }}
          transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: node.id * 0.2 }}
        />
      ))}
    </svg>
  );
};


const FoundationFigure = React.memo(({ reduced }: { reduced: boolean }) => (
  <Box sx={{ width: "100%", height: "100%", position: "relative", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {renderNetwork('foundation', reduced)}
  </Box>
));

const ExpansionFigure = React.memo(({ reduced }: { reduced: boolean }) => (
  <Box sx={{ width: "100%", height: "100%", position: "relative", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {renderNetwork('expansion', reduced)}
  </Box>
));

const PowerhouseFigure = React.memo(({ reduced }: { reduced: boolean }) => (
  <Box sx={{ width: "100%", height: "100%", position: "relative", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {renderNetwork('powerhouse', reduced)}
  </Box>
));

export function ProcessDiagram({ model }: ProcessDiagramProps) {
  const reduced = useReducedMotion() === true;

  const cardBaseStyle = {
    position: "relative",
    bgcolor: "rgba(6, 18, 38, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: { xs: "1.5rem", md: "2.5rem" },
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 16px 32px -10px rgba(0,0,0,0.5)",
    backdropFilter: "blur(24px)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s",
    "&:hover": {
      transform: "translateY(-4px)",
      borderColor: "rgba(255, 255, 255, 0.25)",
    }
  };

  const renderFigure = (index: number) => {
    switch (index) {
      case 0: return <FoundationFigure reduced={reduced} />;
      case 1: return <ExpansionFigure reduced={reduced} />;
      case 2: return <PowerhouseFigure reduced={reduced} />;
      default: return null;
    }
  };

  // Asymmetric fractions to make 2020-2025 wider than 2019
  // 1.1fr (Foundation), 1.4fr (Expansion), 1.6fr (Powerhouse)
  return (
    <Box sx={{ width: "100%", maxWidth: 1320, mx: "auto" }}>
      <Box 
        sx={{ 
          display: "grid", 
          gridTemplateColumns: { xs: "1fr", md: "1.1fr 1.4fr 1.7fr" }, 
          gap: { xs: 4, md: 5 },
          alignItems: "end"
        }}
      >
        {model.phases.map((phase, i) => (
          <Box 
            key={phase.id} 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5
            }}
          >
            {/* Visual Card */}
            <Box
              component={motion.div}
              initial={reduced ? {} : { opacity: 0, y: 30 }}
              whileInView={reduced ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.15 }}
              sx={{
                ...cardBaseStyle,
                // Ascending heights: 250, 300, 350
                height: { xs: 220, md: i === 0 ? 250 : i === 1 ? 300 : 360 }
              }}
            >
              {renderFigure(i)}
            </Box>
            
            {/* Text Outside & Below */}
            <Box sx={{ pl: 1, pr: 2 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: "0.65rem", fontWeight: 700, color: NOIR.gold, letterSpacing: "0.15em", mb: 0.75 }}>
                {i === 0 ? "01" : i === 1 ? "02" : "03"} // PHASE
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" }, fontWeight: 800, color: NOIR.frost, mb: 1, letterSpacing: "-0.01em" }}>
                {phase.name}
              </Typography>
              <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, maxWidth: "32ch" }}>
                {phase.caption}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 3, md: 5 }, mt: { xs: 6, md: 8 }, flexWrap: 'wrap' }}>
        {[
          { label: "Quantitative Research", color: CORE_COLORS[0] },
          { label: "Software Engineering", color: CORE_COLORS[1] },
          { label: "Data Science", color: CORE_COLORS[2] },
          { label: "DevOps", color: CORE_COLORS[3] }
        ].map(item => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, boxShadow: `0 0 8px ${item.color}` }} />
            <Typography sx={{ fontFamily: MONO, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255, 255, 255, 0.7)' }}>
              {item.label.toUpperCase()}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
