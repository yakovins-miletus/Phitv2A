import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import type { HeroTrack } from "../heroModeStore";

interface NodeSpecDrawerProps {
  open: boolean;
  onClose: () => void;
  nodeIndex: number | null;
  track: HeroTrack;
}

const ENTERPRISE_NODES = [
  {
    tag: "NODE // 01",
    title: "Quantitative R&D & Algorithmic Engines",
    subtitle: "Developing high-precision pricing, risk, and algorithmic execution engines.",
    metrics: [
      { label: "SLA AVAILABILITY", value: "99.999%" },
      { label: "LATENCY PROFILE", value: "< 0.15ms" },
      { label: "EXECUTION MODEL", value: "DETERMINISTIC" },
      { label: "SECURITY LEVEL", value: "SOC2 TYPE II" },
    ],
    capabilities: [
      "Custom C++20 / Rust high-frequency order routing and risk validation.",
      "Monte Carlo pricing & real-time portfolio risk sensitivity calculation.",
      "Low-latency tick data compression, replay, and market simulation engines.",
    ],
  },
  {
    tag: "NODE // 02",
    title: "Systems Architecture & Low-Latency Infra",
    subtitle: "Fault-tolerant, distributed market connectivity and hardware-tuned computing.",
    metrics: [
      { label: "THROUGHPUT", value: "5.2M MSG/SEC" },
      { label: "JITTER", value: "SUB-MICROSECOND" },
      { label: "DEPLOYMENT", value: "HYBRID CLOUD / BARE" },
      { label: "COMPLIANCE", value: "SEC / MiFID II" },
    ],
    capabilities: [
      "Zero-allocation memory layout and lock-free concurrency queues.",
      "Bespoke kernel-bypass networking (Solarflare / DPDK) integration.",
      "Automated failover, active-active multi-region state replication.",
    ],
  },
  {
    tag: "NODE // 03",
    title: "AI & High-Precision Intelligence",
    subtitle: "Deep learning models for predictive market signals and automated anomaly detection.",
    metrics: [
      { label: "MODEL LATENCY", value: "< 1.2ms" },
      { label: "ACCURACY RATE", value: "99.4%" },
      { label: "GPU CLUSTER", value: "H100 / A100 HIGH-DENSITY" },
      { label: "INFERENCE", value: "ON-PREM & CLOUD" },
    ],
    capabilities: [
      "Transformer-based financial time-series forecasting & trend signal extraction.",
      "Real-time fraud, anomaly, and unusual market activity detection.",
      "Quantized LLM integration for automated regulatory and prospectus analysis.",
    ],
  },
  {
    tag: "NODE // 04",
    title: "FinTech Platforms & Market Interactive",
    subtitle: "Mission-critical trading terminals, institutional portals, and execution UIs.",
    metrics: [
      { label: "FRAME RATE", value: "60 FPS CONSTANT" },
      { label: "DATA SYNC", value: "WEBSOCKET / FIX" },
      { label: "AUDIT TRAIL", value: "IMMUTABLE LEDGER" },
      { label: "ENCRYPTION", value: "AES-256 / TLS 1.3" },
    ],
    capabilities: [
      "High-density WebGL / Canvas market charts and order-book depth visualizers.",
      "Institutional client portals with granular role-based permissioning.",
      "Seamless REST, FIX Protocol, and gRPC enterprise API gateways.",
    ],
  },
];

const TALENT_NODES = [
  {
    tag: "NODE // 01",
    title: "Tech Stack Depth & Engineering Rigor",
    subtitle: "Work with modern systems languages without corporate technical debt.",
    metrics: [
      { label: "PRIMARY STACK", value: "C++20 / RUST / PYTHON" },
      { label: "INFRASTRUCTURE", value: "KUBERNETES / AWS / BARE" },
      { label: "CODE REVIEWS", value: "PEER & ARCHITECTURE" },
      { label: "TEST COVERAGE", value: "> 90% MANDATORY" },
    ],
    capabilities: [
      "Solve hard computer science problems in low-latency systems and distributed data.",
      "Direct access to modern hardware clusters, high-speed networks, and modern toolchains.",
      "Strict engineering discipline: clean architecture, CI/CD pipelines, and zero fluff.",
    ],
  },
  {
    tag: "NODE // 02",
    title: "Fast-Paced Career Growth & Velocity",
    subtitle: "Accelerate your career with rapid promotions based strictly on engineering merit.",
    metrics: [
      { label: "REVIEW CYCLE", value: "BI-ANNUAL MERIT" },
      { label: "PROMOTION RATE", value: "FAST-TRACK" },
      { label: "MENTORSHIP", value: "PRINCIPAL / SENIOR" },
      { label: "IMPACT", value: "DIRECT TO PRODUCTION" },
    ],
    capabilities: [
      "Skip bureaucratic hierarchy — your code and architectural contributions drive your growth.",
      "Direct mentorship from quantitative engineering veterans with global market experience.",
      "Clear, transparent career ladders from Software Engineer to Principal Architect & R&D Lead.",
    ],
  },
  {
    tag: "NODE // 03",
    title: "Innovation Lab & Dedicated R&D Time",
    subtitle: "Dedicated time and budget to explore emerging tech, paper implementations, and AI.",
    metrics: [
      { label: "R&D ALLOCATION", value: "20% TIME BUDGET" },
      { label: "PATENTS & PAPERS", value: "SPONSORED" },
      { label: "CONFERENCES", value: "GLOBAL ATTENDANCE" },
      { label: "HARDWARE ACCESS", value: "UNLIMITED GPU/CPU" },
    ],
    capabilities: [
      "Test innovative algorithmic ideas in the internal sandbox with live market data feeds.",
      "Sponsorship for technical publications, open-source contributions, and global tech summits.",
      "Cross-functional collaborative sprints with quantitative researchers and systems leads.",
    ],
  },
  {
    tag: "NODE // 04",
    title: "Engineering Culture & High Autonomy",
    subtitle: "Built by engineers, for engineers. High trust, low friction, and great work-life balance.",
    metrics: [
      { label: "WORK SETUP", value: "HYBRID / FLEXIBLE" },
      { label: "EQUIPMENT", value: "TOP-SPEC MAC/LINUX" },
      { label: "COMPENSATION", value: "TOP 5% IN REGION" },
      { label: "ENVIRONMENT", value: "NO-BLAME CULTURE" },
    ],
    capabilities: [
      "High-trust environment: ownership over technical decisions and system designs.",
      "Top-tier competitive salary, performance bonuses, health coverage, and wellness perks.",
      "Modern collaborative hub in Manila with state-of-the-art workstations and R&D labs.",
    ],
  },
];

export function NodeSpecDrawer({ open, onClose, nodeIndex, track }: NodeSpecDrawerProps) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    orgOrStack: "",
    scopeOrGithub: "",
  });

  const nodeData =
    nodeIndex !== null
      ? (track === "enterprise" ? ENTERPRISE_NODES : TALENT_NODES)[nodeIndex % 4]
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({ name: "", email: "", orgOrStack: "", scopeOrGithub: "" });
    onClose();
  };

  if (!nodeData) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: "480px", md: "540px" },
          bgcolor: "rgba(6, 10, 22, 0.96)",
          backdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(255, 215, 0, 0.3)",
          boxShadow: "-10px 0 40px rgba(0,0,0,0.85)",
          color: "#FFFFFF",
          p: { xs: 3, sm: 4 },
        },
      }}
    >
      {/* Drawer Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography
            sx={{
              fontFamily: "monospace",
              fontSize: "11px",
              color: "#FFD700",
              letterSpacing: "0.2em",
              fontWeight: 700,
            }}
          >
            {nodeData.tag}
          </Typography>
          <Box
            sx={{
              px: 1,
              py: 0.2,
              borderRadius: "4px",
              bgcolor: "rgba(0, 255, 136, 0.15)",
              border: "1px solid rgba(0, 255, 136, 0.4)",
              color: "#00FF88",
              fontFamily: "monospace",
              fontSize: "9px",
              letterSpacing: "0.1em",
            }}
          >
            {track === "enterprise" ? "RELIABLE SYSTEM SPEC" : "CAREER GROWTH SPEC"}
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#FFF" } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Main Title & Subtitle */}
      <Typography
        variant="h5"
        sx={{
          fontFamily: "monospace",
          fontWeight: 800,
          fontSize: { xs: "1.25rem", sm: "1.45rem" },
          lineHeight: 1.3,
          letterSpacing: "0.04em",
          color: "#FFFFFF",
          mb: 1,
        }}
      >
        {nodeData.title}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.88rem",
          color: "rgba(255,255,255,0.7)",
          lineHeight: 1.6,
          mb: 3,
        }}
      >
        {nodeData.subtitle}
      </Typography>

      {/* Technical Metrics Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1.5,
          mb: 3,
          p: 2,
          bgcolor: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "6px",
        }}
      >
        {nodeData.metrics.map((m, i) => (
          <Box key={`metric-${i}`}>
            <Typography sx={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", mb: 0.3 }}>
              {m.label}
            </Typography>
            <Typography sx={{ fontFamily: "monospace", fontSize: "11px", color: "#FFD700", fontWeight: 700, letterSpacing: "0.08em" }}>
              {m.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Engineering Capabilities Bullet Points */}
      <Typography sx={{ fontFamily: "monospace", fontSize: "10px", color: "#FFD700", letterSpacing: "0.15em", mb: 1.5, textTransform: "uppercase" }}>
        {track === "enterprise" ? "Core Engineering Standards" : "Key Career & Technical Highlights"}
      </Typography>
      <Box component="ul" sx={{ pl: 2, mb: 4, display: "flex", flexDirection: "column", gap: 1 }}>
        {nodeData.capabilities.map((cap, i) => (
          <Typography component="li" key={`cap-${i}`} sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
            {cap}
          </Typography>
        ))}
      </Box>

      {/* Direct Action Conversion Form */}
      <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.12)", pt: 3 }}>
        {submitted ? (
          <Box sx={{ p: 3, textAlign: "center", bgcolor: "rgba(0, 255, 136, 0.08)", border: "1px solid rgba(0, 255, 136, 0.3)", borderRadius: "8px" }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 40, color: "#00FF88", mb: 1 }} />
            <Typography variant="h6" sx={{ fontFamily: "monospace", fontSize: "1rem", color: "#FFF", mb: 1 }}>
              {track === "enterprise" ? "R&D Discovery Requested" : "Application Fast-Tracked"}
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", mb: 2 }}>
              {track === "enterprise"
                ? "Thank you. Our Principal Systems Architect will review your technical requirements and respond within 24 hours."
                : "Thank you! Our R&D Lead will review your profile and GitHub history for fast-track engineering placement."}
            </Typography>
            <Button size="small" variant="outlined" onClick={handleReset} sx={{ color: "#FFD700", borderColor: "#FFD700" }}>
              Close Drawer
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography sx={{ fontFamily: "monospace", fontSize: "11px", color: "#FFFFFF", letterSpacing: "0.15em", fontWeight: 700 }}>
              {track === "enterprise" ? "[BOOK AN R&D DISCOVERY CONSULTATION]" : "[FAST-TRACK YOUR ENGINEERING APPLICATION]"}
            </Typography>

            <TextField
              required
              fullWidth
              size="small"
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" } }}
              InputProps={{ style: { color: "#FFF", fontSize: "0.85rem", backgroundColor: "rgba(255,255,255,0.04)" } }}
            />

            <TextField
              required
              fullWidth
              size="small"
              type="email"
              label={track === "enterprise" ? "Work Email" : "Email Address"}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" } }}
              InputProps={{ style: { color: "#FFF", fontSize: "0.85rem", backgroundColor: "rgba(255,255,255,0.04)" } }}
            />

            <TextField
              required
              fullWidth
              size="small"
              label={track === "enterprise" ? "Company / Institution Name" : "Primary Tech Stack & Expertise"}
              value={formData.orgOrStack}
              onChange={(e) => setFormData({ ...formData, orgOrStack: e.target.value })}
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" } }}
              InputProps={{ style: { color: "#FFF", fontSize: "0.85rem", backgroundColor: "rgba(255,255,255,0.04)" } }}
            />

            <TextField
              fullWidth
              size="small"
              label={track === "enterprise" ? "Project Scope / Key Requirements" : "GitHub Profile / LinkedIn URL"}
              value={formData.scopeOrGithub}
              onChange={(e) => setFormData({ ...formData, scopeOrGithub: e.target.value })}
              InputLabelProps={{ style: { color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" } }}
              InputProps={{ style: { color: "#FFF", fontSize: "0.85rem", backgroundColor: "rgba(255,255,255,0.04)" } }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 1,
                py: 1.2,
                bgcolor: "#FFD700",
                color: "#060A16",
                fontWeight: 800,
                fontFamily: "monospace",
                letterSpacing: "0.1em",
                "&:hover": { bgcolor: "#FFE44D" },
              }}
            >
              {track === "enterprise" ? "SCHEDULE R&D CONSULTATION" : "SUBMIT FAST-TRACK APPLICATION"}
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
