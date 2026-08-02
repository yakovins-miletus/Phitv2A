import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";

import { CONTENT } from "@/shared/content";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { SectionLede } from "@/shared/components/SectionLede";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { ServiceVector } from "./ServiceDrawer";
import { Reveal } from "@/shared/components/Reveal";

export function CapabilityRack() {
  return (
    <StageSection section={homeSection("services")}>
      <SectionLede
        gunshot={CONTENT.ledes.services.gunshot}
        tracer={CONTENT.ledes.services.tracer}
        eyebrow="Capabilities"
      />

      <Stack spacing={{ xs: 8, md: 14 }} sx={{ mt: { xs: 6, md: 8 } }}>
        {CONTENT.services.map((service, index) => {
          return (
            <Box
              key={service.id}
              sx={{
                pt: { xs: 6, md: 8 },
                borderTop: 1,
                borderColor: "divider",
                position: "relative",
              }}
            >
              <Grid container spacing={{ xs: 4, lg: 8 }}>
                {/* Left Column: What they are */}
                <Grid size={{ xs: 12, md: 5 }}>
                  <Reveal>
                    <Stack spacing={3}>
                      {/* Section Kicker */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography
                          sx={{
                            fontFamily: MONO,
                            fontSize: "0.78rem",
                            letterSpacing: "0.2em",
                            color: NOIR.goldDark,
                            fontWeight: 700,
                          }}
                        >
                          0{index + 1}
                        </Typography>
                        <Box sx={{ width: 24, height: "1px", bgcolor: NOIR.gold }} />
                        <Typography
                          sx={{
                            fontFamily: MONO,
                            fontSize: "0.78rem",
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: "text.secondary",
                            fontWeight: 600,
                          }}
                        >
                          {service.title}
                        </Typography>
                      </Box>

                      {/* Main Gunshot Heading */}
                      <Typography
                        variant="h3"
                        component="h3"
                        sx={{
                          fontWeight: 800,
                          fontSize: { xs: "1.6rem", sm: "2rem", md: "2.4rem" },
                          lineHeight: 1.25,
                          letterSpacing: "-0.02em",
                          color: "text.primary",
                        }}
                      >
                        {service.gunshot}
                      </Typography>

                      {/* Summary Description */}
                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: "1.05rem",
                          lineHeight: 1.65,
                          color: "text.secondary",
                        }}
                      >
                        {service.summary}
                      </Typography>

                      {/* Technologies Chips */}
                      <Box sx={{ pt: 1 }}>
                        <Typography
                          variant="overline"
                          sx={{
                            color: NOIR.goldDark,
                            letterSpacing: "0.12em",
                            fontWeight: 800,
                            mb: 1.5,
                            display: "block",
                          }}
                        >
                          Core Tech Stack
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {service.techStack.map((tech) => (
                            <Chip
                              key={tech}
                              label={tech}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontFamily: MONO,
                                fontSize: "0.7rem",
                                letterSpacing: "0.05em",
                                color: "text.primary",
                                borderColor: "divider",
                                bgcolor: "action.hover",
                                borderRadius: 1,
                                py: 1.2,
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    </Stack>
                  </Reveal>
                </Grid>

                {/* Right Column: What they do */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <Reveal>
                    <Grid container spacing={4} alignItems="center">
                      <Grid size={{ xs: 12, sm: 7 }}>
                        <Stack spacing={4}>
                          <Box>
                            <Typography
                              variant="overline"
                              sx={{
                                color: "text.secondary",
                                letterSpacing: "0.15em",
                                display: "block",
                                mb: 1.5,
                                fontWeight: 700,
                              }}
                            >
                              Operational Details
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                lineHeight: 1.75,
                                fontSize: "1.05rem",
                                color: "text.secondary",
                              }}
                            >
                              {service.details}
                            </Typography>
                          </Box>

                          {/* Tracer Callout Box */}
                          <Box
                            sx={{
                              borderLeft: 3,
                              borderColor: NOIR.gold,
                              pl: 2.5,
                              py: 0.5,
                              bgcolor: "rgba(10,42,102,0.02)",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontStyle: "italic",
                                lineHeight: 1.7,
                                color: "text.secondary",
                                fontSize: "0.95rem",
                              }}
                            >
                              {service.tracer}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>

                      {/* Vector Illustration Grid Slat */}
                      <Grid
                        size={{ xs: 12, sm: 5 }}
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          pt: { xs: 4, sm: 0 },
                        }}
                      >
                        <Box
                          sx={{
                            width: "100%",
                            maxWidth: { xs: 220, sm: 260 },
                            height: { xs: 220, sm: 260 },
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "rgba(10,42,102,0.03)",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: "24px",
                            p: 2,
                            boxShadow: "inset 0 0 20px rgba(0,0,0,0.02)",
                          }}
                        >
                          <ServiceVector id={service.id} />
                        </Box>
                      </Grid>
                    </Grid>
                  </Reveal>
                </Grid>
              </Grid>
            </Box>
          );
        })}
      </Stack>
    </StageSection>
  );
}
