import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MailIcon from "@mui/icons-material/Mail";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TwitterIcon from "@mui/icons-material/Twitter";
import ExploreIcon from "@mui/icons-material/Explore";
import WorkIcon from "@mui/icons-material/Work";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import TerminalIcon from "@mui/icons-material/Terminal";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ArticleIcon from "@mui/icons-material/Article";
import ScienceIcon from "@mui/icons-material/Science";
import SendIcon from "@mui/icons-material/Send";
import HomeIcon from "@mui/icons-material/Home";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import { alpha } from "@mui/material/styles";

import { RouterLink, RouterButton } from "@/shared/components/RouterLink";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

interface SiteFooterProps {
  footerAnchorRef: React.RefObject<HTMLElement | null>;
  /** The next chapter in the site's reading order, or undefined on unknown routes. */
  currentNarration: { next: string; label: string; to?: string } | undefined;
}

interface ChapterVisualMeta {
  chapterNum: string;
  subtitle: string;
  icon: React.ReactNode;
  tags: string[];
}

const CHAPTER_VISUAL_MAP: Record<string, ChapterVisualMeta> = {
  "/about": {
    chapterNum: "02 • THE FIRM",
    subtitle: "Origin story, R&D philosophy, and 2019–2026 growth timeline",
    icon: <CorporateFareIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
    tags: ["Growth Timeline", "Quant R&D", "Manila HQ"],
  },
  "/services": {
    chapterNum: "03 • CAPABILITIES",
    subtitle: "High-frequency trading engines, ML pipelines, & cloud architecture",
    icon: <TerminalIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
    tags: ["Low-Latency HFT", "ML Infrastructure", "Cloud Arch"],
  },
  "/careers": {
    chapterNum: "04 • TALENT",
    subtitle: "Graduate fellowships, quant roles, & engineering opportunities",
    icon: <RocketLaunchIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
    tags: ["Graduate Program", "Quant Roles", "Fellowships"],
  },
  "/blog": {
    chapterNum: "05 • INTELLIGENCE",
    subtitle: "Deep-dives into systems engineering, algorithms, & market tech",
    icon: <ArticleIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
    tags: ["Research Papers", "Tech Insights", "Quant Notes"],
  },
  "/innovation-hub": {
    chapterNum: "06 • LAB DEMOS",
    subtitle: "WebAssembly benchmarks, GPU acceleration, & live prototypes",
    icon: <ScienceIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
    tags: ["GPU Benchmarks", "Wasm Prototypes", "Live Demos"],
  },
  "/contact": {
    chapterNum: "07 • DISCOVERY",
    subtitle: "Connect with our engineering team for partnerships & inquiries",
    icon: <SendIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
    tags: ["Direct Inquiries", "BGC Lab Access", "Partnerships"],
  },
  "/": {
    chapterNum: "01 • MAIN CORE",
    subtitle: "Return to the primary Phitopolis interactive system showcase",
    icon: <HomeIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
    tags: ["Hero System", "Core Overview", "Lab Active"],
  },
};

import PsychologyIcon from "@mui/icons-material/Psychology";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

interface PatternChart {
  id: number;
  label: string;
  points: number[];
  isAnomalous: boolean;
  type: string;
  anomalyReason: string;
}

const PATTERN_SETS: PatternChart[][] = [
  [
    { id: 1, label: "FLOW 0x8A", points: [20, 22, 19, 21, 20, 23, 21, 19], isAnomalous: false, type: "noise", anomalyReason: "Standard market noise" },
    { id: 2, label: "FLOW 0x9B", points: [20, 21, 19, 38, 5, 20, 21, 20], isAnomalous: true, type: "spike", anomalyReason: "Extreme Volume Spike & Flash Dip" },
    { id: 3, label: "FLOW 0x4C", points: [18, 20, 22, 21, 19, 20, 22, 18], isAnomalous: false, type: "noise", anomalyReason: "Normal random walk" },
    { id: 4, label: "FLOW 0x3D", points: [22, 21, 23, 20, 22, 19, 21, 20], isAnomalous: false, type: "noise", anomalyReason: "Steady liquidity stream" },
  ],
  [
    { id: 1, label: "BATCH #401", points: [15, 16, 15, 17, 16, 15, 16, 15], isAnomalous: false, type: "noise", anomalyReason: "Low variance noise" },
    { id: 2, label: "BATCH #402", points: [16, 17, 15, 16, 17, 16, 15, 17], isAnomalous: false, type: "noise", anomalyReason: "Balanced order flow" },
    { id: 3, label: "BATCH #403", points: [5, 35, 5, 35, 5, 35, 5, 35], isAnomalous: true, type: "step", anomalyReason: "Unnatural Bot Step-Function" },
    { id: 4, label: "BATCH #404", points: [18, 19, 21, 20, 19, 21, 20, 19], isAnomalous: false, type: "noise", anomalyReason: "Organic retail trades" },
  ],
  [
    { id: 1, label: "NODE ALPHA", points: [25, 26, 24, 27, 25, 26, 24, 25], isAnomalous: false, type: "noise", anomalyReason: "High liquidity noise" },
    { id: 2, label: "NODE BETA", points: [24, 25, 23, 24, 25, 24, 26, 25], isAnomalous: false, type: "noise", anomalyReason: "Standard market noise" },
    { id: 3, label: "NODE GAMMA", points: [26, 25, 27, 24, 25, 26, 25, 24], isAnomalous: false, type: "noise", anomalyReason: "Baseline exchange feed" },
    { id: 4, label: "NODE DELTA", points: [25, 26, 2, 38, 1, 39, 20, 21], isAnomalous: true, type: "crash", anomalyReason: "Spoofing & Extreme Volatility" },
  ],
  [
    { id: 1, label: "FEED_X1", points: [10, 12, 36, 38, 37, 39, 10, 11], isAnomalous: true, type: "spike", anomalyReason: "Order Layering Anomaly" },
    { id: 2, label: "FEED_X2", points: [20, 21, 22, 20, 19, 21, 22, 20], isAnomalous: false, type: "noise", anomalyReason: "Standard market noise" },
    { id: 3, label: "FEED_X3", points: [19, 20, 18, 21, 20, 19, 21, 20], isAnomalous: false, type: "noise", anomalyReason: "Institutional sweep noise" },
    { id: 4, label: "FEED_X4", points: [21, 19, 20, 22, 21, 20, 19, 21], isAnomalous: false, type: "noise", anomalyReason: "Market maker quotes" },
  ],
];

/** Interactive Gamified Signal or Noise Anomaly Detection Minigame Component */
function SignalNoiseMinigame() {
  const [round, setRound] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [resolved, setResolved] = useState(false);

  const currentSet = PATTERN_SETS[round % PATTERN_SETS.length];
  const anomalousCard = currentSet.find((c) => c.isAnomalous);

  const handleSelect = (card: PatternChart) => {
    if (resolved) return;
    setSelectedId(card.id);
    setResolved(true);

    if (card.isAnomalous) {
      setScore((prev) => prev + 100);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNextRound = () => {
    setSelectedId(null);
    setResolved(false);
    setRound((prev) => prev + 1);
  };

  const handleReset = () => {
    setSelectedId(null);
    setResolved(false);
    setRound(0);
    setScore(0);
    setStreak(0);
  };

  const getBadge = () => {
    if (streak >= 4) return { label: "QUANT SENTINEL", color: NOIR.gold };
    if (streak >= 2) return { label: "RISK DETECTIVE", color: NOIR.live };
    if (score >= 100) return { label: "FRAUD ANALYST", color: "#64B5F6" };
    return { label: "NOVICE DETECTOR", color: "rgba(255,255,255,0.6)" };
  };

  const badge = getBadge();
  const isSelectedCorrect = selectedId !== null && currentSet.find((c) => c.id === selectedId)?.isAnomalous;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        p: { xs: 2.5, sm: 3 },
        borderRadius: 5,
        bgcolor: "rgba(6, 18, 43, 0.88)",
        border: `1px solid ${alpha(NOIR.gold, 0.35)}`,
        backdropFilter: "blur(20px)",
        boxShadow: `0 20px 50px rgba(0,0,0,0.5), inset 0 1px 1px ${alpha(NOIR.gold, 0.2)}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header & Badges */}
      <Stack spacing={1.5}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PsychologyIcon sx={{ color: NOIR.gold, fontSize: 20 }} />
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.72rem",
                letterSpacing: "0.18em",
                color: NOIR.gold,
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              SIGNAL OR NOISE?
            </Typography>
          </Box>
          <Box
            sx={{
              px: 1,
              py: 0.2,
              borderRadius: "6px",
              bgcolor: alpha(badge.color, 0.15),
              border: `1px solid ${alpha(badge.color, 0.4)}`,
              color: badge.color,
              fontFamily: MONO,
              fontSize: "0.58rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: 12 }} />
            {badge.label}
          </Box>
        </Box>

        <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.72)", fontSize: "0.72rem", lineHeight: 1.3 }}>
          ML Risk Engine: Identify the <Typography component="span" sx={{ color: NOIR.gold, fontWeight: 700 }}>anomalous pattern</Typography> among transaction streams below.
        </Typography>

        {/* Stats Row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 0.8,
            borderRadius: 2.5,
            bgcolor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <Typography variant="caption" sx={{ fontFamily: MONO, fontSize: "0.68rem", color: "rgba(255,255,255,0.7)" }}>
            SCORE: <Typography component="span" sx={{ color: "#FFFFFF", fontWeight: 800 }}>{score} PTS</Typography>
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: MONO, fontSize: "0.68rem", color: NOIR.live, fontWeight: 700 }}>
            STREAK: 🔥 {streak}
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: MONO, fontSize: "0.65rem", color: "rgba(255,255,255,0.5)" }}>
            SET #{round + 1}
          </Typography>
        </Box>
      </Stack>

      {/* 4 Mini Sparkline Pattern Cards */}
      <Grid container spacing={1.2} sx={{ my: 1.5 }}>
        {currentSet.map((card) => {
          const isSelected = selectedId === card.id;
          let borderColor = "rgba(255, 255, 255, 0.12)";
          let bgColor = "rgba(255, 255, 255, 0.02)";

          if (resolved) {
            if (card.isAnomalous) {
              borderColor = NOIR.live;
              bgColor = "rgba(58, 161, 137, 0.15)";
            } else if (isSelected && !card.isAnomalous) {
              borderColor = "#FF5252";
              bgColor = "rgba(255, 82, 82, 0.15)";
            }
          }

          // Generate SVG Path
          const svgWidth = 110;
          const svgHeight = 28;
          const maxVal = 40;
          const pointsStr = card.points
            .map((val, idx) => {
              const x = (idx / (card.points.length - 1)) * svgWidth;
              const y = svgHeight - (val / maxVal) * (svgHeight - 6) - 3;
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" L ");

          const strokeColor = resolved
            ? card.isAnomalous
              ? NOIR.live
              : isSelected
              ? "#FF5252"
              : "rgba(255,255,255,0.4)"
            : NOIR.gold;

          return (
            <Grid key={card.id} size={{ xs: 6 }}>
              <Box
                onClick={() => handleSelect(card)}
                sx={{
                  p: 1.2,
                  borderRadius: 3,
                  bgcolor: bgColor,
                  border: `1px solid ${borderColor}`,
                  cursor: resolved ? "default" : "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                  "&:hover": !resolved
                    ? {
                        borderColor: NOIR.gold,
                        bgcolor: "rgba(255, 199, 44, 0.06)",
                        transform: "translateY(-2px)",
                      }
                    : {},
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontFamily: MONO, fontSize: "0.6rem", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                    {card.label}
                  </Typography>
                  {resolved && card.isAnomalous && (
                    <CheckCircleIcon sx={{ fontSize: 13, color: NOIR.live }} />
                  )}
                  {resolved && isSelected && !card.isAnomalous && (
                    <CancelIcon sx={{ fontSize: 13, color: "#FF5252" }} />
                  )}
                </Box>

                {/* SVG Mini Sparkline */}
                <Box sx={{ height: 28, width: "100%" }}>
                  <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                    <path
                      d={`M ${pointsStr}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Result Status Readout & Controls */}
      <Stack spacing={1.2}>
        <Box sx={{ minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {resolved ? (
            <Typography
              variant="caption"
              sx={{
                fontFamily: MONO,
                fontSize: "0.68rem",
                color: isSelectedCorrect ? NOIR.live : "#FF8A80",
                fontWeight: 700,
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                gap: 0.8,
              }}
            >
              {isSelectedCorrect ? (
                <>
                  <CheckCircleIcon sx={{ fontSize: 15 }} />
                  CORRECT! ANOMALY DETECTED (+100 PTS)
                </>
              ) : (
                <>
                  <CancelIcon sx={{ fontSize: 15 }} />
                  NOISE PATTERN! TARGET WAS {anomalousCard?.label}
                </>
              )}
            </Typography>
          ) : (
            <Typography
              variant="caption"
              sx={{
                fontFamily: MONO,
                fontSize: "0.64rem",
                color: "rgba(255,255,255,0.5)",
                textAlign: "center",
              }}
            >
              CLICK A CHART TO CLASSIFY ANOMALY
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            fullWidth
            variant="contained"
            disabled={!resolved}
            onClick={handleNextRound}
            endIcon={<NavigateNextIcon />}
            sx={{
              bgcolor: NOIR.gold,
              color: NOIR.navyField,
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: "0.72rem",
              py: 0.8,
              borderRadius: 2.5,
              "&:hover": { bgcolor: NOIR.goldLight },
              "&.Mui-disabled": {
                bgcolor: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.3)",
              },
            }}
          >
            NEXT CHALLENGE
          </Button>

          <IconButton
            onClick={handleReset}
            title="Reset Score"
            sx={{
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 2.5,
              color: "rgba(255,255,255,0.7)",
              "&:hover": { color: "#FFFFFF", borderColor: NOIR.gold },
            }}
          >
            <RestartAltIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}

export function SiteFooter({ footerAnchorRef, currentNarration }: SiteFooterProps) {
  return (
    <Box
      component="footer"
      ref={footerAnchorRef}
      sx={{
        bgcolor: NOIR.navyDeep,
        color: "#FFFFFF",
        borderTop: `1px solid ${alpha(NOIR.gold, 0.25)}`,
        pt: { xs: 6, md: 8 },
        pb: { xs: 4, md: 6 },
        mt: "auto",
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      {/* Background Ambient Radial Glow & Watermark */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 30%, rgba(255, 199, 44, 0.08) 0%, transparent 65%), linear-gradient(180deg, rgba(6, 24, 59, 0.95) 0%, #04122E 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Giant Stylized Watermark Typography */}
      <Typography
        sx={{
          position: "absolute",
          bottom: { xs: -20, md: -40 },
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: MONO,
          fontWeight: 900,
          fontSize: { xs: "12vw", md: "15vw" },
          color: "rgba(255, 255, 255, 0.02)",
          letterSpacing: "-0.04em",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
      >
        PHITOPOLIS
      </Typography>

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* Vertically Centered Navigation & Interactive Minigame Layout */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", py: { xs: 4, md: 6 } }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="stretch">
            {/* Row 1 & 2 Left Column: Spans 2 Rows vertically - Interactive Signal or Noise Minigame */}
            <Grid size={{ xs: 12, md: 4.5, lg: 4 }}>
              <SignalNoiseMinigame />
            </Grid>

            {/* Right Area: Spans Columns 2 to 4 */}
            <Grid size={{ xs: 12, md: 7.5, lg: 8 }}>
              <Stack spacing={{ xs: 4, md: 5 }} justifyContent="space-between" sx={{ height: "100%" }}>
                {/* ── ROW 1: 3 NAVIGATION COLUMNS (PATHWAYS, TALENT, ENTERPRISE CONTACT) ── */}
                <Grid container spacing={{ xs: 4, md: 4 }}>
                  {/* Col 2: Navigation Pathways */}
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Stack spacing={2.5}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ExploreIcon sx={{ fontSize: 16, color: NOIR.gold }} />
                        <Typography
                          sx={{
                            fontFamily: MONO,
                            fontSize: "0.75rem",
                            letterSpacing: "0.18em",
                            color: NOIR.gold,
                            fontWeight: 800,
                            textTransform: "uppercase",
                          }}
                        >
                          PATHWAYS
                        </Typography>
                      </Box>
                      <Stack spacing={1.4}>
                        {[
                          { label: "Home Core", to: "/" },
                          { label: "About Us", to: "/about" },
                          { label: "Core Services", to: "/services" },
                          { label: "Careers & Fellowships", to: "/careers", badge: "HIRING" },
                          { label: "Blog & Intelligence", to: "/blog" },
                          { label: "Innovation Lab", to: "/innovation-hub", badge: "LIVE DEMO" },
                          { label: "Contact Us", to: "/contact" },
                        ].map((link) => (
                          <Box key={link.to} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <RouterLink
                              to={link.to}
                              sx={{
                                color: "rgba(255, 255, 255, 0.75)",
                                textDecoration: "none",
                                fontSize: "0.9rem",
                                fontWeight: 500,
                                transition: "all 0.2s ease",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.8,
                                "&:hover": { color: NOIR.gold, transform: "translateX(4px)" },
                              }}
                            >
                              {link.label}
                            </RouterLink>
                            {link.badge && (
                              <Box
                                sx={{
                                  px: 0.8,
                                  py: 0.1,
                                  borderRadius: "4px",
                                  bgcolor: alpha(NOIR.gold, 0.15),
                                  border: `1px solid ${alpha(NOIR.gold, 0.4)}`,
                                  color: NOIR.gold,
                                  fontFamily: MONO,
                                  fontSize: "0.58rem",
                                  fontWeight: 800,
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {link.badge}
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Stack>
                  </Grid>

                  {/* Col 3: Graduate & Talent Programs */}
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Stack spacing={2.5}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <WorkIcon sx={{ fontSize: 16, color: NOIR.gold }} />
                        <Typography
                          sx={{
                            fontFamily: MONO,
                            fontSize: "0.75rem",
                            letterSpacing: "0.18em",
                            color: NOIR.gold,
                            fontWeight: 800,
                            textTransform: "uppercase",
                          }}
                        >
                          TALENT PROGRAMS
                        </Typography>
                      </Box>
                      <Stack spacing={1.4}>
                        {[
                          { label: "Graduate Program", to: "/careers/technical-graduate-program", badge: "FELLOWSHIP" },
                          { label: "R&D Internship", to: "/careers/rd-internship-program" },
                          { label: "Quant Researcher", to: "/careers/quant-researcher", badge: "OPEN" },
                          { label: "Software Engineer", to: "/careers/software-engineer" },
                          { label: "Full Stack Developer", to: "/careers/full-stack-developer" },
                          { label: "Data Scientist", to: "/careers/data-scientist" },
                          { label: "DevOps Engineer", to: "/careers/devops-engineer" },
                        ].map((job) => (
                          <Box key={job.to} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <RouterLink
                              to={job.to}
                              sx={{
                                color: "rgba(255, 255, 255, 0.75)",
                                textDecoration: "none",
                                fontSize: "0.9rem",
                                fontWeight: 500,
                                transition: "all 0.2s ease",
                                display: "inline-flex",
                                alignItems: "center",
                                "&:hover": { color: NOIR.gold, transform: "translateX(4px)" },
                              }}
                            >
                              {job.label}
                            </RouterLink>
                            {job.badge && (
                              <Box
                                sx={{
                                  px: 0.8,
                                  py: 0.1,
                                  borderRadius: "4px",
                                  bgcolor: "rgba(58, 161, 137, 0.15)",
                                  border: `1px solid ${alpha(NOIR.live, 0.4)}`,
                                  color: NOIR.live,
                                  fontFamily: MONO,
                                  fontSize: "0.58rem",
                                  fontWeight: 800,
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {job.badge}
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Stack>
                  </Grid>

                  {/* Col 4: Contact & Enterprise Standards (With BGC Office moved above General Inquiries) */}
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Stack spacing={2.5}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ContactMailIcon sx={{ fontSize: 16, color: NOIR.gold }} />
                        <Typography
                          sx={{
                            fontFamily: MONO,
                            fontSize: "0.75rem",
                            letterSpacing: "0.18em",
                            color: NOIR.gold,
                            fontWeight: 800,
                            textTransform: "uppercase",
                          }}
                        >
                          ENTERPRISE CONTACT
                        </Typography>
                      </Box>
                      <Stack spacing={2}>
                        {/* BGC Office moved above General Inquiries */}
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                          <LocationOnIcon sx={{ color: NOIR.gold, fontSize: "1.1rem", mt: 0.2 }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "common.white", fontSize: "0.88rem" }}>
                              BGC Office (Taguig, Metro Manila)
                            </Typography>
                            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block", fontSize: "0.72rem" }}>
                              27/F Ecotower, 32nd St. cor. 9th Ave, Bonifacio Global City
                            </Typography>
                          </Box>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(255, 255, 255, 0.62)", display: "block", mb: 0.3, fontSize: "0.68rem" }}>
                            GENERAL INQUIRIES
                          </Typography>
                          <Typography
                            component="a"
                            href="mailto:info@phitopolis.com"
                            sx={{
                              color: "common.white",
                              textDecoration: "none",
                              fontWeight: 700,
                              fontSize: "0.92rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 1,
                              "&:hover": { color: NOIR.gold },
                            }}
                          >
                            <MailIcon sx={{ fontSize: 16, color: NOIR.gold }} />
                            info@phitopolis.com
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(255, 255, 255, 0.62)", display: "block", mb: 0.3, fontSize: "0.68rem" }}>
                            CAREERS & FELLOWSHIPS
                          </Typography>
                          <Typography
                            component="a"
                            href="mailto:careers@phitopolis.com"
                            sx={{
                              color: "common.white",
                              textDecoration: "none",
                              fontWeight: 700,
                              fontSize: "0.92rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 1,
                              "&:hover": { color: NOIR.gold },
                            }}
                          >
                            <MailIcon sx={{ fontSize: 16, color: NOIR.gold }} />
                            careers@phitopolis.com
                          </Typography>
                        </Box>

                        <Box sx={{ pt: 0.5 }}>
                          <RouterButton
                            to="/contact"
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                              bgcolor: NOIR.gold,
                              color: NOIR.navyField,
                              fontFamily: MONO,
                              fontWeight: 800,
                              fontSize: "0.75rem",
                              py: 1,
                              px: 2.5,
                              borderRadius: 3,
                              boxShadow: `0 4px 16px ${alpha(NOIR.gold, 0.25)}`,
                              "&:hover": {
                                bgcolor: NOIR.goldLight,
                                boxShadow: `0 6px 20px ${alpha(NOIR.gold, 0.4)}`,
                              },
                            }}
                          >
                            START A CONVERSATION
                          </RouterButton>
                        </Box>
                      </Stack>
                    </Stack>
                  </Grid>
                </Grid>

                {/* ── ROW 2: DYNAMIC NEXT PAGE / NEXT CHAPTER SECTION (SPANS COLUMNS 2 TO 4) ── */}
                {currentNarration && (() => {
                  const meta = CHAPTER_VISUAL_MAP[currentNarration.next] ?? {
                    chapterNum: "NEXT ROUTE",
                    subtitle: "Discover the next phase of the Phitopolis journey",
                    icon: <AutoAwesomeIcon sx={{ fontSize: 26, color: NOIR.gold }} />,
                    tags: ["Explore", "Phitopolis"],
                  };

                  return (
                    <Box
                      sx={{
                        width: "100%",
                        pt: { xs: 1, md: 2 },
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          alignItems: { xs: "flex-start", sm: "center" },
                          justifyContent: "space-between",
                          gap: { xs: 2.5, sm: 3.5 },
                          py: 2.5,
                          px: { xs: 3, sm: 4 },
                          borderRadius: 5,
                          bgcolor: "rgba(10, 24, 51, 0.75)",
                          border: `1px solid ${alpha(NOIR.gold, 0.35)}`,
                          backdropFilter: "blur(20px)",
                          boxShadow: `0 16px 40px rgba(0, 0, 0, 0.4), inset 0 1px 1px ${alpha(NOIR.gold, 0.2)}`,
                          width: "100%",
                          overflow: "hidden",
                          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                          "&:hover": {
                            borderColor: NOIR.gold,
                            transform: "translateY(-3px)",
                            boxShadow: `0 24px 50px ${alpha(NOIR.gold, 0.22)}, inset 0 1px 1px ${alpha(NOIR.gold, 0.4)}`,
                            bgcolor: "rgba(14, 32, 66, 0.85)",
                          },
                        }}
                      >
                        {/* Ambient Glow */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: "-50%",
                            right: "-20%",
                            width: 220,
                            height: 220,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${alpha(NOIR.gold, 0.12)} 0%, transparent 70%)`,
                            pointerEvents: "none",
                          }}
                        />

                        <Stack direction="row" spacing={2.5} alignItems="center">
                          {/* Visual Aid Icon Badge */}
                          <Box
                            sx={{
                              display: { xs: "none", sm: "flex" },
                              alignItems: "center",
                              justifyContent: "center",
                              width: 50,
                              height: 50,
                              borderRadius: "16px",
                              bgcolor: "rgba(255, 199, 44, 0.08)",
                              border: `1px solid ${alpha(NOIR.gold, 0.3)}`,
                              boxShadow: `0 0 20px ${alpha(NOIR.gold, 0.15)}`,
                              flexShrink: 0,
                            }}
                          >
                            {meta.icon}
                          </Box>

                          <Stack spacing={0.5}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  bgcolor: NOIR.gold,
                                  boxShadow: `0 0 8px ${NOIR.gold}`,
                                }}
                              />
                              <Typography
                                sx={{
                                  fontFamily: MONO,
                                  fontSize: "0.68rem",
                                  letterSpacing: "0.18em",
                                  textTransform: "uppercase",
                                  color: NOIR.gold,
                                  fontWeight: 800,
                                }}
                              >
                                NEXT CHAPTER • {meta.chapterNum}
                              </Typography>
                            </Box>

                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 800,
                                color: "#FFFFFF",
                                fontSize: "1.05rem",
                                letterSpacing: "-0.01em",
                                lineHeight: 1.2,
                              }}
                            >
                              {currentNarration.label}
                            </Typography>

                            <Typography
                              variant="caption"
                              sx={{
                                color: "rgba(255, 255, 255, 0.68)",
                                fontSize: "0.78rem",
                                display: "block",
                                lineHeight: 1.3,
                              }}
                            >
                              {meta.subtitle}
                            </Typography>

                            {/* Visual Feature Tags */}
                            <Stack direction="row" spacing={1} sx={{ pt: 0.5, flexWrap: "wrap", gap: 0.5 }}>
                              {meta.tags.map((tag) => (
                                <Box
                                  key={tag}
                                  sx={{
                                    px: 1,
                                    py: 0.2,
                                    borderRadius: "6px",
                                    bgcolor: "rgba(255, 255, 255, 0.06)",
                                    border: "1px solid rgba(255, 255, 255, 0.12)",
                                    color: "rgba(255, 255, 255, 0.75)",
                                    fontFamily: MONO,
                                    fontSize: "0.62rem",
                                    fontWeight: 600,
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  {tag}
                                </Box>
                              ))}
                            </Stack>
                          </Stack>
                        </Stack>

                        <RouterButton
                          to={currentNarration.next}
                          variant="contained"
                          endIcon={<ArrowForwardIcon sx={{ fontSize: "1.1rem !important" }} />}
                          sx={{
                            borderRadius: "100px",
                            px: 3.5,
                            py: 1.2,
                            fontFamily: MONO,
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            letterSpacing: "0.14em",
                            bgcolor: NOIR.gold,
                            color: NOIR.navyField,
                            whiteSpace: "nowrap",
                            alignSelf: { xs: "stretch", sm: "center" },
                            boxShadow: `0 4px 20px ${alpha(NOIR.gold, 0.3)}`,
                            "&:hover": {
                              bgcolor: NOIR.goldLight,
                              boxShadow: `0 8px 25px ${alpha(NOIR.gold, 0.5)}`,
                              transform: "translateX(2px)",
                            },
                          }}
                        >
                          EXPLORE
                        </RouterButton>
                      </Box>
                    </Box>
                  );
                })()}
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* ── 3. BOTTOM SYSTEM BAR (Copyright & Social links only) ── */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{
            pt: 3,
            pb: 1,
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            color: "rgba(255, 255, 255, 0.6)",
          }}
        >
          <Typography variant="caption" sx={{ fontFamily: MONO, fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.8)" }}>
            © 2026 Phitopolis International Corp. All rights reserved.
          </Typography>

          {/* Social Icons */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton component="a" href="#" aria-label="GitHub" sx={{ color: "common.white", "&:hover": { color: NOIR.gold } }}>
              <GitHubIcon fontSize="small" />
            </IconButton>
            <IconButton component="a" href="#" aria-label="LinkedIn" sx={{ color: "common.white", "&:hover": { color: NOIR.gold } }}>
              <LinkedInIcon fontSize="small" />
            </IconButton>
            <IconButton component="a" href="#" aria-label="Twitter" sx={{ color: "common.white", "&:hover": { color: NOIR.gold } }}>
              <TwitterIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
