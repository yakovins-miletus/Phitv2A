import { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { motion } from "motion/react";
import {
  Stack as StackIcon, Browsers, HardDrives, Lightning,
  TrendUp, Scales, ShieldWarning, GlobeHemisphereWest,
  TreeStructure, Robot, ChartBar, Database,
  Heartbeat, ArrowsLeftRight, ShieldCheck, Headset,
  type Icon as PhosphorIcon
} from "@phosphor-icons/react";

import { ServiceIcon } from "./ServiceIcon";
import { MONO } from "@/shared/theme/theme";
import { usePointerFine } from "@/shared/motion";
import type { Service } from "../api";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

const BANNER_MAP: Record<string, string> = {
  "Data Science": "/images/data-science-banner.webp",
  "Ops Support": "/images/ops-support-banner.webp",
  "Quantitative Research": "/images/quant-research-banner.webp",
  "Software Development": "/images/software-engineer-banner.webp",
};

const TEAM_ICONS: Record<string, PhosphorIcon> = {
  "Platform Team": StackIcon,
  "Web Apps": Browsers,
  "Infra": HardDrives,
  "HPC": Lightning,
  "Alpha Research": TrendUp,
  "Portfolio Optimization": Scales,
  "Risk Modeling": ShieldWarning,
  "Alternative Data": GlobeHemisphereWest,
  "Data Engineering": TreeStructure,
  "ML Ops": Robot,
  "Analytics": ChartBar,
  "Core Data": Database,
  "Site Reliability (SRE)": Heartbeat,
  "Trade Ops": ArrowsLeftRight,
  "Security": ShieldCheck,
  "Global Support": Headset,
};

function SubTeamVisualTile({ team }: { team: { name: string; description: string } }) {
  const Icon = TEAM_ICONS[team.name] || StackIcon;

  return (
    <Box
      sx={{
        position: "relative",
        height: 1,
        minHeight: 180,
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        transition: "border-color 0.4s ease",
        "&:hover": {
          borderColor: "primary.main",
        },
        "&:hover .team-description": {
          opacity: 1,
          transform: "translateY(0)",
        },
        "&:hover .team-icon": {
          opacity: 0,
          transform: "translateY(-20px)",
        },
        "&:hover .team-name": {
          opacity: 0,
          transform: "translateY(-10px)",
        }
      }}
    >
      <Box
        className="team-icon"
        sx={{
          color: "primary.main",
          transition: `all 0.4s ${EASE_OUT_EXPO_CSS}`,
          transform: "translateY(0)",
          opacity: 1,
          mb: 2,
        }}
      >
        <Icon weight="duotone" size={56} />
      </Box>
      <Typography 
        className="team-name"
        variant="subtitle2" 
        sx={{ 
          fontWeight: 600, 
          textAlign: "center",
          transition: `all 0.4s ${EASE_OUT_EXPO_CSS}`,
          transform: "translateY(0)",
          opacity: 1,
        }}
      >
        {team.name}
      </Typography>
      
      <Box
        className="team-description"
        sx={{
          position: "absolute",
          inset: 0,
          p: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0,
          transform: "translateY(20px)",
          transition: `all 0.4s ${EASE_OUT_EXPO_CSS}`,
          bgcolor: "background.default",
        }}
      >
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ lineHeight: 1.6 }}>
          {team.description}
        </Typography>
      </Box>
    </Box>
  );
}



function SpatialBannerCard({ src, alt }: { src: string; alt: string }) {
  const isFinePointer = usePointerFine();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [sheenPos, setSheenPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isFinePointer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    setRotation({ x: -y * 12, y: x * 12 });
    setSheenPos({ x: xPct, y: yPct });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <Box
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        perspective: "1200px",
        mb: 6,
        width: "100%",
      }}
    >
      <motion.div
        animate={{
          rotateX: rotation.x,
          rotateY: rotation.y,
          scale: isHovered ? 1.015 : 1,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{
          width: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: isHovered
            ? "0 25px 50px -12px rgba(10,42,102,0.35)"
            : "0 10px 30px -10px rgba(0,0,0,0.15)",
        }}
      >
        <Box
          component="img" decoding="async" loading="lazy"
          src={src}
          alt={alt}
          sx={{
            width: "100%",
            height: "auto",
            maxHeight: { xs: 240, md: 360 },
            objectFit: "cover",
            display: "block",
            borderRadius: 2,
            transform: "translateZ(0px)",
          }}
        />

        {/* Dynamic Light Sheen Overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: isHovered ? 0.35 : 0,
            transition: "opacity 0.3s ease",
            background: `radial-gradient(circle at ${sheenPos.x}% ${sheenPos.y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
            mixBlendMode: "overlay",
          }}
        />
      </motion.div>
    </Box>
  );
}

function DetailedServiceSection({ service }: { service: Service }) {
  const bannerSrc = BANNER_MAP[service.name];

  return (
    <Box sx={{ py: 6, borderBottom: 1, borderColor: "divider", position: "relative", "&:last-child": { borderBottom: 0 } }}>
      {bannerSrc && <SpatialBannerCard src={bannerSrc} alt={`${service.name} banner`} />}
      
      <Grid container spacing={{ xs: 6, lg: 8 }} sx={{ position: "relative" }}>
        {/* Visual Connector Line (Desktop) */}
        <Box 
          sx={{
            display: { xs: "none", md: "block" },
            position: "absolute",
            top: "50%",
            left: "40%", 
            width: "10%",
            height: "1px",
            background: "linear-gradient(90deg, var(--mui-palette-divider) 0%, transparent 100%)",
            zIndex: 0,
          }}
        />

        {/* Left Column: Summary */}
        <Grid size={{ xs: 12, md: 5 }} sx={{ zIndex: 1 }}>
          <Stack spacing={3}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <ServiceIcon icon={service.icon} />
              <Typography variant="h3" component="h2">
                {service.name}
              </Typography>
            </Box>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
              {service.tagline}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {service.description}
            </Typography>
            
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ pt: 1 }}>
              {service.highlights.map((highlight) => (
                <Chip
                  key={highlight}
                  label={highlight}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.75rem",
                    letterSpacing: "0.05em",
                    color: "text.primary",
                    borderColor: "divider",
                    bgcolor: "action.hover",
                    borderRadius: 1,
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Grid>

        {/* Right Column: Sub Teams */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={3}>
            <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.15em" }}>
              Specialized Teams
            </Typography>
            {service.sub_teams && service.sub_teams.length > 0 ? (
              <Grid container spacing={3}>
                {service.sub_teams.map((team, idx) => (
                  <Grid size={{ xs: 6, sm: 6 }} key={idx}>
                    <SubTeamVisualTile team={team} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                Team details are being finalized.
              </Typography>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export function DetailedServiceList({ services }: { services: Service[] }) {
  return (
    <Stack spacing={2} sx={{ mt: 4 }}>
      {services.map((service) => (
        <DetailedServiceSection key={service.id} service={service} />
      ))}
    </Stack>
  );
}
