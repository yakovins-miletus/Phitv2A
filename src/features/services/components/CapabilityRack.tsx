import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

import { CONTENT } from "@/shared/content";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { SectionLede } from "@/shared/components/SectionLede";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { Reveal } from "@/shared/components/Reveal";
import { ServiceVector } from "./ServiceDrawer";

export function CapabilityRack() {
  return (
    <StageSection section={homeSection("services")}>
      <SectionLede
        gunshot={CONTENT.ledes.services.gunshot}
        tracer={CONTENT.ledes.services.tracer}
        eyebrow="Capabilities"
      />

      <Stack spacing={0} sx={{ mt: { xs: 6, md: 8 } }}>
        {CONTENT.services.map((service) => {
          return (
            <Box
              key={service.id}
              sx={{
                py: { xs: 8, md: 12 },
                borderTop: 1,
                borderColor: "divider",
                position: "relative",
              }}
            >
              <Reveal>
                <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={4}>
                      <Typography
                        variant="overline"
                        sx={{
                          fontFamily: MONO,
                          color: NOIR.goldDark,
                          letterSpacing: "0.15em",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          display: "block",
                          textTransform: "uppercase",
                        }}
                      >
                        {service.title}
                      </Typography>
                      
                      <Typography
                        variant="h2"
                        component="h3"
                        sx={{
                          fontWeight: 800,
                          fontSize: { xs: "2rem", sm: "2.8rem", md: "3.5rem", lg: "4rem" },
                          lineHeight: 1.1,
                          letterSpacing: "-0.03em",
                          color: "text.primary",
                        }}
                      >
                        {service.gunshot}
                      </Typography>

                      <Box
                        sx={{
                          borderLeft: 4,
                          borderColor: NOIR.gold,
                          pl: 3,
                          py: 1,
                        }}
                      >
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 400,
                            color: "text.secondary",
                            lineHeight: 1.6,
                            fontSize: { xs: "1.2rem", md: "1.4rem" }
                          }}
                        >
                          {service.tracer}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: { xs: 520, md: 640 },
                        aspectRatio: "1/1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: { xs: "auto", md: 0 },
                        ml: { md: "auto" },
                      }}
                    >
                      <ServiceVector id={service.id} />
                    </Box>
                  </Grid>
                </Grid>
              </Reveal>
            </Box>
          );
        })}
      </Stack>
    </StageSection>
  );
}
