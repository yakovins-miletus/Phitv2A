import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { motion } from "motion/react";

import { ServiceIcon } from "./ServiceIcon";
import { MONO } from "@/shared/theme/theme";
import { usePointerFine } from "@/shared/motion";
import type { Service } from "../api";

const BANNER_MAP: Record<string, string> = {
  "Data Science": "/images/data-science-banner.webp",
  "Ops Support": "/images/ops-support-banner.jpg",
  "Quantitative Research": "/images/quant-research-banner.jpg",
  "Software Development": "/images/software-engineer-banner.webp",
};

function SubTeamCard({ team }: { team: { name: string; description: string } }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: 1,
        bgcolor: "background.default",
        borderColor: "divider",
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: "primary.main",
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 600, mb: 1 }}>
          {team.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {team.description}
        </Typography>
      </CardContent>
    </Card>
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
    <Box sx={{ py: 6, borderBottom: 1, borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
      {bannerSrc && <SpatialBannerCard src={bannerSrc} alt={`${service.name} banner`} />}
      <Grid container spacing={{ xs: 6, lg: 8 }}>
        {/* Left Column: Summary */}
        <Grid size={{ xs: 12, md: 5 }}>
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
                  <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                    <SubTeamCard team={team} />
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
