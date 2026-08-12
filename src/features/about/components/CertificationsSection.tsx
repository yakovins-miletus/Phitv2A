import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

import { Section } from "@/shared/components/Section";
import { Reveal, StaggerGroup, StaggerItem } from "@/shared/components/Reveal";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { CONTENT } from "@/shared/content";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

export function CertificationsSection() {
  const { headline, note, groups } = CONTENT.certifications;
  const [selectedProvider, setSelectedProvider] = useState<string>("all");

  const totalCerts = groups.reduce((acc, g) => acc + g.count, 0);

  const displayedGroups = selectedProvider === "all"
    ? groups
    : groups.filter((g) => g.provider.toLowerCase().includes(selectedProvider.toLowerCase()));

  return (
    <Section muted>
      <Stack spacing={{ xs: 6, md: 8 }} sx={{ width: "100%" }}>
        {/* Section Header */}
        <Stack spacing={2} sx={{ maxWidth: 840 }}>
          <Reveal>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
              <VerifiedUserIcon sx={{ color: "var(--accent-fg)", fontSize: "1.2rem" }} />
              <Typography
                variant="overline"
                sx={{
                  color: "var(--accent-fg)",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  fontSize: "0.85rem",
                  fontFamily: MONO,
                }}
              >
                VERIFIED COMPETENCY
              </Typography>
            </Box>
          </Reveal>
          <Reveal delay={0.1}>
            <Typography variant="h2" component="h2" sx={{ fontWeight: 800 }}>
              {headline}
            </Typography>
          </Reveal>
          <Reveal delay={0.2}>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: "1.15rem", lineHeight: 1.6 }}>
              {note}
            </Typography>
          </Reveal>
        </Stack>

        {/* Provider Filter Tabs & Counter Badge */}
        <Reveal delay={0.3}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
            sx={{
              pb: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={`ALL (${totalCerts})`}
                onClick={() => setSelectedProvider("all")}
                sx={{
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  bgcolor: selectedProvider === "all" ? NOIR.navyField : "background.paper",
                  color: selectedProvider === "all" ? "common.white" : "text.secondary",
                  border: "1px solid",
                  borderColor: selectedProvider === "all" ? NOIR.navyField : "divider",
                  cursor: "pointer",
                  py: 2,
                  px: 1,
                  transition: "all 0.3s ease",
                }}
              />
              {groups.map((group) => {
                const isSelected = selectedProvider.toLowerCase() === group.provider.toLowerCase();
                return (
                  <Chip
                    key={group.provider}
                    label={`${group.provider.toUpperCase()} (${group.count})`}
                    onClick={() => setSelectedProvider(group.provider)}
                    sx={{
                      fontFamily: MONO,
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      bgcolor: isSelected ? NOIR.navyField : "background.paper",
                      color: isSelected ? "common.white" : "text.secondary",
                      border: "1px solid",
                      borderColor: isSelected ? NOIR.navyField : "divider",
                      cursor: "pointer",
                      py: 2,
                      px: 0.8,
                      transition: "all 0.3s ease",
                    }}
                  />
                );
              })}
            </Stack>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <WorkspacePremiumIcon sx={{ color: "var(--accent-fg)", fontSize: "1.1rem" }} />
              <Typography variant="caption" sx={{ fontFamily: MONO, fontWeight: 700, color: "text.secondary", letterSpacing: "0.05em" }}>
                {totalCerts} ACTIVE ENTERPRISE CERTIFICATIONS
              </Typography>
            </Box>
          </Stack>
        </Reveal>

        {/* Modern Certification Provider Showcases */}
        <StaggerGroup key={selectedProvider}>
          <Stack spacing={{ xs: 6, md: 8 }}>
            {displayedGroups.map((group) => (
              <Box key={group.provider} sx={{ width: "100%" }}>
                <StaggerItem>
                  <Stack spacing={3}>
                    {/* Provider Subheader */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Typography variant="h4" component="h3" sx={{ fontWeight: 800, color: NOIR.navyField }}>
                        {group.provider}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: MONO, fontWeight: 800, color: "text.secondary" }}>
                        {group.count} CERTIFIED FELLOWS
                      </Typography>
                    </Box>

                    {/* Modern Frameless Certification Grid */}
                    <Grid container spacing={{ xs: 3, md: 4 }}>
                      {group.items.map((cert) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={cert.name}>
                          <Box
                            sx={{
                              p: 3,
                              borderRadius: 5,
                              bgcolor: "background.paper",
                              border: "1px solid",
                              borderColor: "rgba(10, 42, 102, 0.08)",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              textAlign: "center",
                              height: "100%",
                              position: "relative",
                              overflow: "hidden",
                              transition: `all 0.35s ${EASE_OUT_EXPO_CSS}`,
                              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)",
                              "&:hover": {
                                borderColor: "var(--accent)",
                                boxShadow: "0 12px 30px rgba(10, 42, 102, 0.08)",
                                "& .cert-badge-glow": {
                                  borderColor: "var(--accent)",
                                  transform: "scale(1.05)",
                                },
                              },
                            }}
                          >
                            {/* Certification Emblem Ring */}
                            <Box
                              className="cert-badge-glow"
                              sx={{
                                width: 88,
                                height: 88,
                                borderRadius: "50%",
                                bgcolor: "white",
                                border: "2px solid",
                                borderColor: "rgba(10, 42, 102, 0.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                p: 1.5,
                                mb: 2.5,
                                transition: `all 0.35s ${EASE_OUT_EXPO_CSS}`,
                                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.04)",
                              }}
                            >
                              <Box
                                component="img" decoding="async" loading="lazy"
                                src={cert.logo}
                                alt={cert.name}
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                }}
                              />
                            </Box>

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
