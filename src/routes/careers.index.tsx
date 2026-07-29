import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import WorkIcon from "@mui/icons-material/Work";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { createFileRoute } from "@tanstack/react-router";

import { CAREER_POSITIONS } from "@/shared/careersData";
import { Reveal, StaggerGroup, StaggerItem } from "@/shared/components/Reveal";
import { Section } from "@/shared/components/Section";
import { RouterButton } from "@/shared/components/RouterLink";
import { pageHead } from "@/shared/seo";
import { MONO } from "@/shared/theme/theme";

export const Route = createFileRoute("/careers/")({
  head: () =>
    pageHead(
      "Careers & Graduate Programs | Phitopolis",
      "Join Phitopolis R&D in Manila — explore paid engineering internships, full-time technical graduate fellowships, and senior engineering roles."
    ),
  component: CareersIndexPage,
});

function CareersIndexPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Graduate Program", "Internships", "Engineering & Quant", "Cloud & Infrastructure"];

  const filteredPositions = selectedCategory === "All"
    ? CAREER_POSITIONS
    : CAREER_POSITIONS.filter((p) => p.category === selectedCategory);

  return (
    <Box sx={{ width: "100%", pt: { xs: 12, md: 18 }, pb: { xs: 10, md: 16 } }}>
      <Section>
        <Stack spacing={{ xs: 8, md: 12 }}>
          {/* Header Banner */}
          <Stack spacing={2} sx={{ maxWidth: 840 }}>
            <Reveal>
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                <WorkIcon sx={{ color: "#FFC72C", fontSize: "1.2rem" }} />
                <Typography
                  variant="overline"
                  sx={{
                    color: "#FFC72C",
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                    fontSize: "0.85rem",
                    fontFamily: MONO,
                  }}
                >
                  CAREERS & GRADUATE PATHWAYS
                </Typography>
              </Box>
            </Reveal>
            <Reveal delay={0.1}>
              <Typography variant="h1" component="h1" sx={{ fontWeight: 800 }}>
                Build the Future of Quantitative Systems
              </Typography>
            </Reveal>
            <Reveal delay={0.2}>
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: "1.2rem", lineHeight: 1.65 }}>
                We are actively recruiting ambitious engineering, computer science, and quantitative talent for our Technical Graduate Program, paid R&D internships, and senior engineering positions in Manila.
              </Typography>
            </Reveal>
          </Stack>

          {/* Category Filters */}
          <Reveal delay={0.3}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ pb: 1, borderBottom: "1px solid", borderColor: "divider" }}>
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  label={cat.toUpperCase()}
                  onClick={() => setSelectedCategory(cat)}
                  sx={{
                    fontFamily: MONO,
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    bgcolor: selectedCategory === cat ? "#0A2A66" : "background.paper",
                    color: selectedCategory === cat ? "common.white" : "text.secondary",
                    border: "1px solid",
                    borderColor: selectedCategory === cat ? "#0A2A66" : "divider",
                    cursor: "pointer",
                    py: 2.2,
                    px: 1,
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </Stack>
          </Reveal>

          {/* Positions Grid */}
          <StaggerGroup key={selectedCategory}>
            <Grid container spacing={{ xs: 4, md: 5 }}>
              {filteredPositions.map((position) => (
                <Grid size={{ xs: 12, md: 6 }} key={position.id}>
                  <StaggerItem>
                    <Box
                      sx={{
                        p: { xs: 4, md: 5 },
                        borderRadius: 6,
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "rgba(10, 42, 102, 0.1)",
                        display: "flex",
                        flexDirection: "column",
                        justify: "space-between",
                        height: "100%",
                        position: "relative",
                        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                        "&:hover": {
                          borderColor: "#FFC72C",
                          boxShadow: "0 16px 40px rgba(10, 42, 102, 0.12)",
                          transform: "translateY(-4px)",
                        },
                      }}
                    >
                      <Stack spacing={3}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography
                            variant="overline"
                            sx={{
                              fontFamily: MONO,
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              color: "#0A2A66",
                              letterSpacing: "0.1em",
                            }}
                          >
                            {position.badge}
                          </Typography>
                          <Chip
                            label={position.type}
                            size="small"
                            sx={{
                              fontFamily: MONO,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              bgcolor: position.category === "Graduate Program" ? "rgba(255, 199, 44, 0.2)" : "rgba(10, 42, 102, 0.08)",
                              color: position.category === "Graduate Program" ? "#0A2A66" : "text.secondary",
                            }}
                          />
                        </Box>

                        <Stack spacing={1}>
                          <Typography variant="h3" component="h2" sx={{ fontWeight: 800, fontSize: { xs: "1.45rem", md: "1.7rem" } }}>
                            {position.title}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <LocationOnIcon sx={{ fontSize: "1rem", color: "text.secondary" }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              {position.location} • {position.department}
                            </Typography>
                          </Box>
                        </Stack>

                        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65, fontSize: "1rem" }}>
                          {position.summary}
                        </Typography>

                        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ pt: 1 }}>
                          {position.stack.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{
                                fontFamily: MONO,
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                bgcolor: "rgba(10, 42, 102, 0.05)",
                                color: "text.secondary",
                              }}
                            />
                          ))}
                        </Stack>
                      </Stack>

                      <Box sx={{ pt: 4, mt: "auto" }}>
                        <RouterButton
                          to="/careers/$jobId"
                          params={{ jobId: position.id }}
                          variant="outlined"
                          endIcon={<ArrowForwardIcon />}
                          sx={{
                            width: "100%",
                            py: 1.5,
                            fontFamily: MONO,
                            fontWeight: 800,
                            fontSize: "0.8rem",
                            borderRadius: 3,
                            borderColor: "#0A2A66",
                            color: "#0A2A66",
                            "&:hover": {
                              borderColor: "#0A2A66",
                              bgcolor: "rgba(10, 42, 102, 0.05)",
                            },
                          }}
                        >
                          VIEW POSITION & APPLY
                        </RouterButton>
                      </Box>
                    </Box>
                  </StaggerItem>
                </Grid>
              ))}
            </Grid>
          </StaggerGroup>
        </Stack>
      </Section>
    </Box>
  );
}
