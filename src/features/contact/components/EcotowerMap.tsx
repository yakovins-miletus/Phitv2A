import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { SpecularButton as Button } from "@/shared/components/ui/specular";
import PlaceIcon from "@mui/icons-material/Place";
import NavigationIcon from "@mui/icons-material/Navigation";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { alpha } from "@mui/material/styles";

export function EcotowerMap() {
  const googleMapsEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.737199468903!2d121.04838537590204!3d14.551806385927572!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c8ef4c1f9f25%3A0xd64f1c97a7e8ab56!2sEcoTower!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph";
  const googleMapsUrl = "https://maps.google.com/?q=27F+Ecotower+Building,+32nd+St,+Bonifacio+Global+City,+Taguig,+Philippines";

  return (
    <Box
      sx={{
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(10, 42, 102, 0.12)",
        bgcolor: NOIR.white,
        boxShadow: "0 12px 32px rgba(10, 42, 102, 0.06)",
        position: "relative",
      }}
    >
      {/* Clean Card Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: NOIR.white,
          borderBottom: "1px solid rgba(10, 42, 102, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <PlaceIcon sx={{ fontSize: 20, color: "var(--accent-ink)" }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: NOIR.navyField }}>
              Phitopolis Headquarters · 27/F Ecotower
            </Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: "0.68rem", color: "text.secondary" }}>
              32nd Street cor. 9th Avenue, Bonifacio Global City, Taguig, Philippines
            </Typography>
          </Box>
        </Stack>

        <Button
          component="a"
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          startIcon={<NavigationIcon sx={{ fontSize: 14 }} />}
          sx={{
            textTransform: "none",
            fontSize: "0.75rem",
            fontWeight: 600,
            borderRadius: "6px",
            color: NOIR.navyField,
            borderColor: "rgba(10, 42, 102, 0.2)",
            "&:hover": { bgcolor: alpha(NOIR.navyField, 0.06) },
          }}
        >
          Open in Google Maps
        </Button>
      </Box>

      {/* Simple Static Google Maps Embed */}
      <Box sx={{ position: "relative", width: "100%", height: 380, overflow: "hidden" }}>
        <iframe
          title="Phitopolis Ecotower BGC Google Map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={googleMapsEmbedUrl}
        />
      </Box>
    </Box>
  );
}
