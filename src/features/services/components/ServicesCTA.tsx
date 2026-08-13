import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

export function ServicesCTA() {
  return (
    <Box
      sx={{
        mt: { xs: 8, md: 12 },
        mb: { xs: 4, md: 6 },
        p: { xs: 4, sm: 6, md: 7 },
        borderRadius: 5,
        bgcolor: "rgba(244, 247, 252, 0.95)",
        border: "1px solid rgba(10, 42, 102, 0.18)",
        boxShadow: "0 10px 32px rgba(10, 42, 102, 0.06)",
        backdropFilter: "blur(8px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 4, md: 6 }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        sx={{ position: "relative", zIndex: 2 }}
      >
        <Box sx={{ maxWidth: "660px" }}>
          <Typography
            variant="overline"
            sx={{
              fontFamily: MONO,
              fontSize: "0.82rem",
              letterSpacing: "0.18em",
              color: NOIR.navyField,
              fontWeight: 800,
              display: "block",
              mb: 1,
            }}
          >
            PARTNER WITH PHITOPOLIS
          </Typography>

          <Typography
            variant="h2"
            sx={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 900,
              fontSize: { xs: "1.8rem", sm: "2.3rem", md: "2.6rem" },
              color: NOIR.navyField,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              mb: 2,
            }}
          >
            Accelerate Your Engineering & R&D Capabilities
          </Typography>

          <Typography
            sx={{
              fontSize: "1.05rem",
              color: "rgba(10, 42, 102, 0.8)",
              lineHeight: 1.65,
            }}
          >
            Connect with our engineering leadership to discuss technical specifications, custom platform development, or operational integration.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ minWidth: "fit-content" }}>
          <Button
            component={Link}
            to="/contact"
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: "0.85rem",
              letterSpacing: "0.06em",
              bgcolor: NOIR.navyField,
              color: "#FFFFFF",
              px: 3.5,
              py: 1.4,
              borderRadius: "8px",
              boxShadow: "none",
              textTransform: "none",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "#081F4D",
                boxShadow: "none",
              },
            }}
          >
            Contact Engineering
          </Button>

          <Button
            component={Link}
            to="/careers"
            variant="outlined"
            startIcon={<WorkOutlineIcon />}
            sx={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: "0.85rem",
              letterSpacing: "0.06em",
              borderColor: "rgba(10, 42, 102, 0.25)",
              color: NOIR.navyField,
              px: 3,
              py: 1.4,
              borderRadius: "8px",
              boxShadow: "none",
              textTransform: "none",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: NOIR.navyField,
                bgcolor: "rgba(10, 42, 102, 0.05)",
              },
            }}
          >
            Explore Careers
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
