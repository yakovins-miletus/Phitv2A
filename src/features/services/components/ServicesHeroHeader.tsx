import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import GearIcon from "@mui/icons-material/Settings";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { Reveal } from "@/shared/components/Reveal";
import { useNavbarAnchor, NAV_ANCHORS } from "@/shared/components/NavbarContext";

interface ServicesHeroHeaderProps {
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

const CATEGORIES = [
  { id: "all", label: "All Teams" },
  { id: "development", label: "Software Dev" },
  { id: "quant-research", label: "Quant Research" },
  { id: "data-science", label: "Data Science" },
  { id: "support", label: "Ops Support" },
];

export function ServicesHeroHeader({
  selectedCategory = "all",
  onSelectCategory,
}: ServicesHeroHeaderProps) {
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.SERVICES_PAGE, { dark: false });
  return (
    <Box
      ref={anchorRef}
      sx={{
        width: "100%",
        pt: { xs: 2, md: 4 },
        pb: { xs: 6, md: 8 },
        position: "relative",
        borderRadius: 0,
        overflow: "hidden",
        bgcolor: "transparent",
        border: "none",
        mb: { xs: 5, md: 8 },
      }}
    >
      {/* Background Hero Image with Careers-style Gradial Mask */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <Box
          component="img"
          src="/images/ecotower-bgc.webp"
          alt="Phitopolis Engineering Capabilities"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: { xs: "75% center", md: "60% center" },
            opacity: 0.85,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `
              linear-gradient(to right, ${NOIR.void} 0%, rgba(244, 247, 252, 0.95) 25%, rgba(244, 247, 252, 0.78) 50%, rgba(244, 247, 252, 0.35) 75%, rgba(244, 247, 252, 0.12) 100%),
              radial-gradient(ellipse 65% 100% at 15% 50%, ${NOIR.void} 0%, rgba(244, 247, 252, 0.9) 45%, transparent 100%),
              linear-gradient(to bottom, transparent 70%, ${NOIR.void} 100%)
            `,
          }}
        />
      </Box>

      {/* Content Container - Left aligned flush with container and cards */}
      <Box sx={{ position: "relative", zIndex: 1, px: 0 }}>
        <Stack spacing={2.8} sx={{ maxWidth: 840 }}>
          <Reveal>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
              <GearIcon sx={{ color: NOIR.navyField, fontSize: "1.2rem" }} />
              <Typography
                variant="overline"
                sx={{
                  color: NOIR.navyField,
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  fontSize: "0.85rem",
                  fontFamily: MONO,
                }}
              >
                ENGINEERING CAPABILITIES & R&D
              </Typography>
            </Box>
          </Reveal>

          <Reveal delay={0.1}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 900,
                color: NOIR.navyField,
                fontSize: { xs: "2.4rem", sm: "3.4rem", md: "4.2rem" },
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                fontFamily: DISPLAY_FONT,
              }}
            >
              High-Performance Engines for Global Markets
            </Typography>
          </Reveal>

          <Reveal delay={0.2}>
            <Typography
              variant="subtitle1"
              sx={{
                color: "rgba(10, 42, 102, 0.82)",
                fontSize: "1.15rem",
                lineHeight: 1.65,
                maxWidth: 720,
              }}
            >
              From low-latency C++ trading systems and quantitative signal extraction to cloud-native platforms and 24/7 site reliability, we design, build, and operate mission-critical financial technology.
            </Typography>
          </Reveal>

          {/* Filter Pills */}
          {onSelectCategory && (
            <Reveal delay={0.25}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ pt: 1 }}>
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <Chip
                      key={cat.id}
                      label={cat.label}
                      onClick={() => onSelectCategory(cat.id)}
                      size="small"
                      sx={{
                        fontFamily: MONO,
                        fontSize: "0.76rem",
                        fontWeight: isActive ? 800 : 600,
                        letterSpacing: "0.04em",
                        color: isActive ? "#FFFFFF" : NOIR.navyField,
                        bgcolor: isActive ? NOIR.navyField : "transparent",
                        border: isActive ? `1px solid ${NOIR.navyField}` : "1px solid transparent",
                        borderRadius: "6px",
                        px: 0.8,
                        py: 0.4,
                        cursor: "pointer",
                        boxShadow: "none",
                        "&:hover": {
                          bgcolor: isActive ? NOIR.navyField : "transparent",
                        },
                      }}
                    />
                  );
                })}
              </Stack>
            </Reveal>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
