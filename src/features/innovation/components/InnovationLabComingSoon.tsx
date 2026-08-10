import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { Flask, Cpu, HardDrives, TerminalWindow, CheckCircle, Sparkle, PaperPlaneRight } from "@phosphor-icons/react";

import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { Reveal } from "@/shared/components/Reveal";
import { NAV_ANCHORS, useNavbarAnchor } from "@/shared/components/NavbarContext";
import { BACKGROUND_LOOP, useBackgroundVideo } from "@/shared/components/useBackgroundVideo";

const UPCOMING_PILLARS = [
  {
    icon: Cpu,
    tag: "SYSTEMS & KERNELS",
    title: "Microsecond C++ & Rust Engines",
    description:
      "Zero-copy queue structures, lock-free memory allocators, and ultra-fast market data parsing routines battle-tested in internal production environments.",
  },
  {
    icon: Flask,
    tag: "QUANT & ML SIGNALS",
    title: "Statistical Signal Notebooks",
    description:
      "Jupyter notebooks and Python libraries for time-series anomaly detection, alpha signal backtesting, and quantitative data exploration.",
  },
  {
    icon: HardDrives,
    tag: "CLOUD & INFRASTRUCTURE",
    title: "DevOps & Observability Modules",
    description:
      "Production-ready Kubernetes manifests, Terraform templates, and custom Prometheus/Grafana monitoring exporters for high-frequency infrastructure.",
  },
  {
    icon: TerminalWindow,
    tag: "OPEN SOURCE TOOLS",
    title: "Developer Libraries & CLI Utilities",
    description:
      "Internal CLI toolkits, React/TypeScript UI primitives, and developer productivity tools engineered during R&D hackathons.",
  },
];

function PillarCard({ pillar }: { pillar: typeof UPCOMING_PILLARS[0] }) {
  return (
    <Box
      sx={{
        p: 3.5,
        borderRadius: 4,
        bgcolor: "rgba(10, 20, 40, 0.35)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        pointerEvents: "auto",
        "&:hover": {
          transform: "scale(1.05)",
          bgcolor: "rgba(10, 20, 40, 0.65)",
          borderColor: "var(--accent-40)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 40px var(--accent-15)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 3,
            bgcolor: "rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "common.white",
          }}
        >
          <Box component={pillar.icon} sx={{ fontSize: "1.4rem" }} />
        </Box>
        <Chip
          label={pillar.tag}
          size="small"
          sx={{
            fontFamily: MONO,
            fontSize: "0.62rem",
            fontWeight: 800,
            bgcolor: "rgba(255, 255, 255, 0.08)",
            color: "common.white",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        />
      </Box>

      <Typography variant="h5" component="h3" sx={{ fontWeight: 800, color: "common.white", mb: 1.5, fontSize: "1.05rem", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
        {pillar.title}
      </Typography>

      <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.65)", lineHeight: 1.5, fontSize: "0.85rem" }}>
        {pillar.description}
      </Typography>
    </Box>
  );
}

export function InnovationLabComingSoon() {
  const { containerRef, videoRef, shouldLoad, posterOnly } = useBackgroundVideo();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.INNOVATION_LAB, { dark: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().length > 0) {
      setSubmitted(true);
    }
  };

  return (
    <Box ref={anchorRef} sx={{ width: "100%", bgcolor: NOIR.navyDeep, minHeight: "100vh", height: { xs: "auto", lg: "100vh" }, overflow: "hidden", position: "relative" }}>
      {/* ── Background Video / Ambient Stage ── */}
      <Box
        ref={containerRef}
        aria-hidden
        sx={{ position: "absolute", inset: 0, filter: "brightness(0.7) contrast(1.1)", pointerEvents: "none" }}
      >
        <Box
          component="video"
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={BACKGROUND_LOOP.poster}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        >
          {!posterOnly && shouldLoad && (
            <>
              <source src={BACKGROUND_LOOP.webm} type="video/webm" />
              <source src={BACKGROUND_LOOP.mp4} type="video/mp4" />
            </>
          )}
        </Box>
      </Box>

      {/* Contrast Overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(0, 0, 0, 0.65)",
          pointerEvents: "none",
        }}
      />

      {/* ── Center Stage (Hero & Signup) ── */}
      <Box
        sx={{
          position: { xs: "relative", lg: "absolute" },
          top: { lg: "50%" },
          left: { lg: "50%" },
          transform: { lg: "translate(-50%, -50%)" },
          zIndex: 10,
          width: "100%",
          maxWidth: 800,
          px: 3,
          pt: { xs: 16, lg: 0 },
          pb: { xs: 8, lg: 0 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Reveal delay={0.1}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, mb: 3, px: 2, py: 0.5, borderRadius: "100px", bgcolor: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: NOIR.gold, boxShadow: `0 0 10px ${NOIR.gold}` }} />
            <Typography variant="overline" sx={{ color: "common.white", fontWeight: 800, letterSpacing: "0.15em", fontFamily: MONO, fontSize: "0.7rem", lineHeight: 1.5 }}>
              COMING SOON
            </Typography>
          </Box>
        </Reveal>

        <Reveal delay={0.15}>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "2.6rem", sm: "4rem", md: "5rem" },
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: "common.white",
              textShadow: "0 4px 24px rgba(0,0,0,0.8)",
              mb: 3,
            }}
          >
            Innovation Labs
          </Typography>
        </Reveal>

        <Reveal delay={0.2}>
          <Typography
            variant="h5"
            sx={{
              color: "rgba(255, 255, 255, 0.88)",
              fontSize: { xs: "1.1rem", md: "1.2rem" },
              lineHeight: 1.6,
              fontWeight: 400,
              mb: 6,
              maxWidth: 680,
            }}
          >
            We are preparing to open-source our internal engineering toolkits. Soon, you will be able to access our microsecond C++ kernels, ML signal prototypes, and developer utilities directly from this public repository.
          </Typography>
        </Reveal>

        <Reveal delay={0.3}>
          <Box
            sx={{
              width: "100%",
              maxWidth: 640,
              p: 3,
              px: 4,
              borderRadius: 4,
              bgcolor: "rgba(10, 20, 40, 0.25)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
            }}
          >
            <Stack spacing={3} alignItems="center">
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                <Box component={Sparkle} sx={{ color: NOIR.gold, fontSize: "1.2rem" }} />
                <Typography variant="overline" sx={{ color: NOIR.gold, fontWeight: 800, letterSpacing: "0.15em", fontFamily: MONO, fontSize: "0.78rem" }}>
                  JOIN THE LAUNCH WAITLIST
                </Typography>
              </Box>

              {submitted ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, px: 3, borderRadius: "100px", bgcolor: "rgba(58, 161, 137, 0.15)", border: "1px solid rgba(38, 166, 154, 0.5)", color: "#00BFA5" }}>
                  <Box component={CheckCircle} sx={{ color: "#00BFA5", fontSize: "1.4rem" }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: MONO, fontSize: "0.85rem", color: "common.white" }}>
                    You're on the waitlist! We will notify you at launch.
                  </Typography>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, width: "100%" }}>
                  <TextField
                    type="email"
                    required
                    placeholder="enter.your.email@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{
                      flexGrow: 1,
                      minWidth: 0,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "100px",
                        bgcolor: "rgba(255, 255, 255, 0.08)",
                        color: "common.white",
                        fontFamily: MONO,
                        fontSize: "0.85rem",
                        "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                        "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.4)" },
                        "&.Mui-focused fieldset": { borderColor: NOIR.gold },
                      },
                      "& input::placeholder": { color: "rgba(255, 255, 255, 0.5)" },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    endIcon={<Box component={PaperPlaneRight} />}
                    sx={{
                      borderRadius: "100px",
                      px: 3,
                      py: 1,
                      bgcolor: NOIR.gold,
                      color: NOIR.navyDeep,
                      fontWeight: 800,
                      fontFamily: MONO,
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                      "&:hover": { bgcolor: NOIR.goldDark },
                    }}
                  >
                    NOTIFY ME
                  </Button>
                </Box>
              )}
            </Stack>
          </Box>
        </Reveal>
      </Box>

      {/* ── 4-Corner Adverts (Pillars) ── */}
      <Box sx={{ position: { xs: "relative", lg: "absolute" }, inset: 0, zIndex: 5, pointerEvents: "none", p: { xs: 3, lg: 0 } }}>
        
        {/* Mobile/Tablet Fallback Stack */}
        <Box sx={{ display: { xs: "flex", lg: "none" }, flexDirection: "column", gap: 3, pb: 8 }}>
          {UPCOMING_PILLARS.map((pillar) => (
            <PillarCard key={pillar.title} pillar={pillar} />
          ))}
        </Box>

        {/* Desktop 4-Corner HUD Layout */}
        <Box sx={{ display: { xs: "none", lg: "block" }, height: "100%" }}>
          {UPCOMING_PILLARS.map((pillar, index) => {
            const cornerStyles = [
              { top: 112, left: 32 },
              { top: 112, right: 32 },
              { bottom: 32, left: 32 },
              { bottom: 32, right: 32 },
            ];
            return (
              <Box key={pillar.title} sx={{ position: "absolute", width: 300, pointerEvents: "auto", ...cornerStyles[index] }}>
                <Reveal delay={0.4 + (index * 0.1)}>
                  <PillarCard pillar={pillar} />
                </Reveal>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
