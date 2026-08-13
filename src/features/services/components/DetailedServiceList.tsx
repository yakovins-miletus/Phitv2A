import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {
  Stack as StackIcon, Browsers, HardDrives, Lightning,
  TrendUp, Scales, ShieldWarning, GlobeHemisphereWest,
  TreeStructure, Robot, ChartBar, Database,
  Heartbeat, ArrowsLeftRight, ShieldCheck, Headset,
  ArrowRight, Sliders,
  type Icon as PhosphorIcon
} from "@phosphor-icons/react";

import { ServiceIcon } from "./ServiceIcon";
import { ServiceDrawer } from "./ServiceDrawer";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import type { Service } from "../api";

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

function getBannerImage(service: Service): string {
  const name = (service.name || "").toLowerCase();
  const slug = (service.slug || "").toLowerCase();
  const id = String(service.id || "").toLowerCase();

  if (name.includes("quant") || slug.includes("quant") || id.includes("quant")) {
    return "/images/quant-research-banner.webp";
  }
  if (name.includes("data") || slug.includes("data") || id.includes("data")) {
    return "/images/data-science-banner.webp";
  }
  if (name.includes("ops") || name.includes("support") || slug.includes("ops") || id.includes("support")) {
    return "/images/ops-support-banner.webp";
  }
  return "/images/software-engineer-banner.webp";
}

function SubTeamItem({ team }: { team: { name: string; description: string } }) {
  const Icon = TEAM_ICONS[team.name] || StackIcon;

  return (
    <Box
      sx={{
        p: 0,
        pl: 1.8,
        py: 0.5,
        borderRadius: 0,
        bgcolor: "transparent",
        borderLeft: "2px solid rgba(10, 42, 102, 0.12)",
        boxShadow: "none",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Box sx={{ color: NOIR.navyField, display: "flex", alignItems: "center" }}>
          <Icon weight="duotone" size={17} />
        </Box>
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: "0.84rem",
            fontWeight: 700,
            color: NOIR.navyField,
            letterSpacing: "0.02em",
          }}
        >
          {team.name}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontSize: "0.78rem",
          color: "rgba(10, 42, 102, 0.75)",
          lineHeight: 1.5,
          flexGrow: 1,
        }}
      >
        {team.description}
      </Typography>
    </Box>
  );
}

function ModernRowServiceCard({
  service,
  onOpenDrawer,
}: {
  service: Service;
  onOpenDrawer: (service: Service) => void;
}) {
  const bannerSrc = getBannerImage(service);

  return (
    <Box
      id={`service-${service.id}`}
      sx={{
        width: "100%",
        bgcolor: "transparent",
        border: "none",
        boxShadow: "none",
        backdropFilter: "none",
        pb: { xs: 5, md: 7 },
        borderBottom: "1px solid rgba(10, 42, 102, 0.08)",
        transform: "none !important",
        transition: "none !important",
        "&:hover": {
          bgcolor: "transparent",
          boxShadow: "none",
          border: "none",
          borderBottom: "1px solid rgba(10, 42, 102, 0.08)",
          transform: "none !important",
        },
      }}
    >
      <Grid container spacing={{ xs: 4, md: 5 }} alignItems="stretch">
        {/* Left Column of Row Card: Info & Sub-teams */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2.5} sx={{ height: "100%", justifyContent: "space-between" }}>
            <Box>
              {/* Header Lockup: Icon + Title + Specs Button */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
                  <Box
                    sx={{
                      p: 0,
                      borderRadius: 0,
                      bgcolor: "transparent",
                      border: "none",
                      color: NOIR.navyField,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ServiceIcon icon={service.icon} />
                  </Box>
                  <Typography
                    variant="h3"
                    component="h2"
                    sx={{
                      fontFamily: DISPLAY_FONT,
                      fontWeight: 800,
                      fontSize: { xs: "1.4rem", sm: "1.7rem", md: "1.85rem" },
                      color: NOIR.navyField,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {service.name}
                  </Typography>
                </Box>

                <Button
                  size="small"
                  onClick={() => onOpenDrawer(service)}
                  startIcon={<Sliders size={16} />}
                  endIcon={<ArrowRight size={14} />}
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    color: NOIR.navyField,
                    border: "none",
                    borderRadius: 0,
                    bgcolor: "transparent",
                    px: 1,
                    py: 0.5,
                    textTransform: "none",
                    boxShadow: "none",
                    transform: "none !important",
                    transition: "none !important",
                    "&:hover": {
                      bgcolor: "transparent",
                      color: NOIR.navyField,
                      boxShadow: "none",
                      border: "none",
                      transform: "none !important",
                    },
                  }}
                >
                  Specs
                </Button>
              </Box>

              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: NOIR.navyField,
                  letterSpacing: "0.04em",
                  mb: 1,
                }}
              >
                {service.tagline}
              </Typography>

              <Typography
                sx={{
                  fontSize: "0.95rem",
                  color: "rgba(10, 42, 102, 0.8)",
                  lineHeight: 1.65,
                  mb: 2.5,
                }}
              >
                {service.description}
              </Typography>
            </Box>

            {/* Sub-Teams 2x2 Grid with Minimalist Separator */}
            {service.sub_teams && service.sub_teams.length > 0 && (
              <Box sx={{ pt: 2.5, borderTop: "1px solid rgba(10, 42, 102, 0.08)" }}>
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.68rem",
                    color: "rgba(10, 42, 102, 0.6)",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    mb: 1.8,
                    fontWeight: 700,
                  }}
                >
                  SPECIALIZED R&D SUB-TEAMS
                </Typography>
                <Grid container spacing={2.5} alignItems="stretch">
                  {service.sub_teams.map((team, idx) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={idx} sx={{ display: "flex" }}>
                      <SubTeamItem team={team} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Stack>
        </Grid>

        {/* Right Column of Row Card: Spatial Banner Image */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box
            sx={{
              height: "100%",
              minHeight: { xs: 220, md: "100%" },
              borderRadius: 4,
              overflow: "hidden",
              border: "none",
              boxShadow: "none",
              bgcolor: "transparent",
            }}
          >
            {bannerSrc && (
              <Box
                component="img"
                decoding="async"
                loading="lazy"
                src={bannerSrc}
                alt={`${service.name} banner`}
                sx={{
                  width: "100%",
                  height: "100%",
                  minHeight: { xs: "220px", md: "100%" },
                  objectFit: "cover",
                  display: "block",
                  borderRadius: 4,
                }}
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export function DetailedServiceList({ services }: { services: Service[] }) {
  const [activeService, setActiveService] = useState<Service | null>(null);

  return (
    <>
      <Stack spacing={{ xs: 6, md: 8 }}>
        {services.map((service) => (
          <ModernRowServiceCard
            key={service.id}
            service={service}
            onOpenDrawer={(s) => setActiveService(s)}
          />
        ))}
      </Stack>

      {/* Service Architecture Specs Drawer */}
      {activeService && (
        <ServiceDrawer
          open={!!activeService}
          onClose={() => setActiveService(null)}
          service={activeService}
        />
      )}
    </>
  );
}
