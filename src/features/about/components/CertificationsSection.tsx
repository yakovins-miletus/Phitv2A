import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { Section } from "@/shared/components/Section";
import { Reveal, StaggerGroup, StaggerItem } from "@/shared/components/Reveal";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { CONTENT } from "@/shared/content";

export function CertificationsSection() {
  const { headline, note, groups } = CONTENT.certifications;

  return (
    <Section muted>
      <Stack spacing={{ xs: 6, md: 8 }} sx={{ width: "100%" }}>
        {/* Section Header */}
        <Stack spacing={2} sx={{ maxWidth: 840 }}>
          <Reveal>
            <Typography variant="h2" component="h2" sx={{ fontWeight: 800 }}>
              {headline}
            </Typography>
          </Reveal>
          <Reveal delay={0.1}>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: "1.15rem", lineHeight: 1.6 }}>
              {note}
            </Typography>
          </Reveal>
        </Stack>

        {/* Certification Provider Groups */}
        <StaggerGroup>
          <Stack spacing={{ xs: 6, md: 8 }}>
            {groups.map((group) => (
              <Box key={group.provider} sx={{ width: "100%" }}>
                <StaggerItem>
                  <Stack spacing={3}>
                    {/* Provider Subheader */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pb: 2,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="h4" component="h3" sx={{ fontWeight: 800, color: NOIR.navyField }}>
                        {group.provider}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: MONO, fontWeight: 800, color: "text.secondary" }}>
                        {group.items.length} CERTIFIED FELLOWS
                      </Typography>
                    </Box>

                    {/* Frameless Certification Grid */}
                    <Grid container spacing={{ xs: 3, md: 4 }}>
                      {group.items.map((cert) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={cert.name}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              textAlign: "center",
                              height: "100%",
                              p: 2,
                            }}
                          >
                            <Box
                              component="img"
                              decoding="async"
                              loading="lazy"
                              src={cert.logo}
                              alt={cert.name}
                              width={64}
                              height={64}
                              sx={{
                                objectFit: "contain",
                                mb: 2.5,
                                transition: "opacity 0.3s ease",
                              }}
                            />

                            {/* Certification Details */}
                            <Stack spacing={1} alignItems="center" sx={{ flex: 1, justifyContent: "center" }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.4, fontSize: "0.95rem" }}>
                                {cert.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.08em" }}>
                                {group.provider.toUpperCase()}
                              </Typography>
                            </Stack>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Stack>
                </StaggerItem>
              </Box>
            ))}
          </Stack>
        </StaggerGroup>
      </Stack>
    </Section>
  );
}
