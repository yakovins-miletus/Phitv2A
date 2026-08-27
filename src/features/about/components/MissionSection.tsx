import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Reveal } from "@/shared/components/Reveal";
import { RevealLines } from "@/shared/components/reveal/RevealLines";
import { MetaLabel } from "./MetaLabel";
import { FONT } from "@/shared/theme/theme";

export function MissionSection() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        py: { xs: 8, md: 10 }
      }}
    >
      <Box sx={{ px: { xs: 3, md: 5 } }}>
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
          <Stack spacing={4}>
            <Stack spacing={1.5}>
              <MetaLabel>COMPANY</MetaLabel>
              <RevealLines headingLevel={2}>
                <Typography
                  variant="h2"
                  component="h2"
                  sx={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: "clamp(2.8rem, 5vw, 5rem)",
                    color: "primary.main",
                    lineHeight: 1,
                    letterSpacing: "-0.02em"
                  }}
                >
                  Our Mission
                </Typography>
              </RevealLines>
            </Stack>
            
            <Reveal delay={0.1}>
              <Typography
                component="p"
                sx={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 400,
                  fontSize: { xs: "1.35rem", md: "2.2rem" },
                  lineHeight: 1.4,
                  color: "text.primary",
                  maxWidth: 960
                }}
              >
                At Phitopolis, we view global markets as the ultimate intellectual puzzle. Operating as a specialized R&D firm, we build cloud-native systems, data science engines, and artificial intelligence solutions for international clients operating in high-complexity environments.
              </Typography>
            </Reveal>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
