import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { MagneticBox } from "@/shared/components/MagneticBox";
import { MONO } from "@/shared/theme/theme";

import type { Service } from "../api";
import { ServiceIcon } from "./ServiceIcon";

import { NOIR } from "@/shared/theme/palette";

function ServiceCard({ service }: { service: Service }) {
  return (
    <Card
      data-cursor
      sx={{
        height: 1,
        position: "relative",
        overflow: "hidden",
        boxShadow: "none",
        transition: "border-color 0.25s ease",
        "&:hover": { borderColor: "primary.dark" },
        // Gold sheen sweep on hover — transform-only, no-preference gated.
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "-60%",
          width: "45%",
          background:
            `linear-gradient(105deg, transparent, rgba(${NOIR.goldRgb}, 0.09), transparent)`,
          transform: "skewX(-18deg)",
          pointerEvents: "none",
        },
        "@media (prefers-reduced-motion: no-preference)": {
          "&:hover::after": { animation: "phitoSheen 0.9s ease" },
        },
        "@keyframes phitoSheen": {
          to: { left: "130%" },
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <ServiceIcon icon={service.icon} />
          <Typography variant="h4" component="h3">
            {service.name}
          </Typography>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
            {service.tagline}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {service.description}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {service.highlights.map((highlight) => (
              <Chip
                key={highlight}
                label={highlight}
                size="small"
                variant="outlined"
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.7rem",
                  letterSpacing: "0.08em",
                  color: "text.secondary",
                  borderColor: "divider",
                  borderRadius: 1,
                  height: "auto",
                  py: 0.5,
                  "& .MuiChip-label": { whiteSpace: "normal" },
                }}
              />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

interface ServicesGridProps {
  services: Service[];
  /** Magnetic hover on precise pointers only (home page engines section). */
  magnetic?: boolean;
}

export function ServicesGrid({ services, magnetic = false }: ServicesGridProps) {
  return (
    <Grid container spacing={3}>
      {services.map((service) => (
        <Grid key={service.id} size={{ xs: 12, sm: 6 }}>
          {magnetic ? (
            <MagneticBox>
              <ServiceCard service={service} />
            </MagneticBox>
          ) : (
            <ServiceCard service={service} />
          )}
        </Grid>
      ))}
    </Grid>
  );
}
