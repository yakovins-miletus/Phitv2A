import { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import WorkIcon from "@mui/icons-material/Work";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { createFileRoute } from "@tanstack/react-router";

import { CAREER_POSITIONS } from "@/shared/careersData";
import { Reveal, StaggerGroup, StaggerItem } from "@/shared/components/Reveal";
import { Section } from "@/shared/components/Section";
import { RouterButton } from "@/shared/components/RouterLink";
import { JobDetailsDrawer } from "@/shared/components/JobDetailsDrawer";
import { BrochureDrawer } from "@/shared/components/BrochureDrawer";
import { pageHead } from "@/shared/seo";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

export const Route = createFileRoute("/careers/")({
  head: () =>
    pageHead(
      "Careers & Graduate Programs | Phitopolis R&D",
      "Join Phitopolis R&D in Manila — explore paid engineering internships, full-time technical graduate fellowships, and senior engineering roles."
    ),
  component: CareersIndexPage,
});

export function CareersIndexPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeJobTitle, setActiveJobTitle] = useState<string | null>(null);
  const [brochureOpen, setBrochureOpen] = useState(false);

  const categories = [
    { label: "All", count: CAREER_POSITIONS.length },
    { label: "Graduate Program", count: CAREER_POSITIONS.filter((p) => p.category === "Graduate Program").length },
    { label: "Internships", count: CAREER_POSITIONS.filter((p) => p.category === "Internships").length },
    { label: "Engineering & Quant", count: CAREER_POSITIONS.filter((p) => p.category === "Engineering & Quant").length },
    { label: "Cloud & Infrastructure", count: CAREER_POSITIONS.filter((p) => p.category === "Cloud & Infrastructure").length },
  ];

  const filteredPositions = useMemo(() => {
    return CAREER_POSITIONS.filter((position) => {
      const matchesCategory = selectedCategory === "All" || position.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        position.title.toLowerCase().includes(q) ||
        position.department.toLowerCase().includes(q) ||
        position.summary.toLowerCase().includes(q) ||
        position.stack.some((tech) => tech.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <Box sx={{ width: "100%", bgcolor: NOIR.void, pt: { xs: 12, md: 18 }, pb: { xs: 10, md: 16 } }}>
      <Section>
        <Stack spacing={{ xs: 6, md: 10 }}>
          {/* ── Interactive Recruitment Header ── */}
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={2.5}>
                <Reveal>
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                    <WorkIcon sx={{ color: NOIR.goldDark, fontSize: "1.2rem" }} />
                    <Typography
                      variant="overline"
                      sx={{
                        color: NOIR.goldDark,
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
                  <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                      fontWeight: 900,
                      color: NOIR.navyField,
                      fontSize: { xs: "2.4rem", sm: "3.4rem", md: "4.2rem" },
                      lineHeight: 1.08,
                      letterSpacing: "-0.025em",
                    }}
                  >
                    Build the Future of Quantitative Systems
                  </Typography>
                </Reveal>
                <Reveal delay={0.2}>
                  <Typography variant="subtitle1" sx={{ color: "rgba(10, 42, 102, 0.82)", fontSize: "1.18rem", lineHeight: 1.65, maxWidth: 680 }}>
                    We are actively recruiting ambitious engineering, computer science, and quantitative talent for our Technical Graduate Program, paid R&D internships, and senior engineering positions in Manila.
                  </Typography>
                </Reveal>
              </Stack>
            </Grid>

            {/* Right Hero Interactive Portal Card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Reveal delay={0.25}>
                <Box
                  sx={{
                    p: { xs: 3.5, md: 4 },
                    borderRadius: 5,
                    bgcolor: "rgba(244, 247, 252, 0.95)",
                    border: "1px solid rgba(10, 42, 102, 0.18)",
                    boxShadow: "0 10px 32px rgba(10, 42, 102, 0.06)",
                  }}
                >
                  <Stack spacing={2.5}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AutoAwesomeIcon sx={{ color: NOIR.goldDark, fontSize: "1.1rem" }} />
                      <Typography variant="overline" sx={{ fontFamily: MONO, fontWeight: 800, color: NOIR.navyField, letterSpacing: "0.12em", fontSize: "0.75rem" }}>
                        RECRUITMENT HIGHLIGHTS
                      </Typography>
                    </Box>

                    <Stack spacing={1.5}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Chip label="BGC Office" size="small" sx={{ fontFamily: MONO, fontWeight: 700, bgcolor: "rgba(10, 42, 102, 0.08)", color: NOIR.navyField }} />
                        <Typography variant="body2" sx={{ color: NOIR.navyField, fontWeight: 600 }}>
                          Hybrid Schedule (3 Days On-site / 2 Remote)
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Chip label="Mentorship" size="small" sx={{ fontFamily: MONO, fontWeight: 700, bgcolor: "rgba(255, 199, 44, 0.25)", color: NOIR.navyField }} />
                        <Typography variant="body2" sx={{ color: NOIR.navyField, fontWeight: 600 }}>
                          1-on-1 Senior Staff Engineering Mentorship
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Chip label="Fast-Track" size="small" sx={{ fontFamily: MONO, fontWeight: 700, bgcolor: "rgba(10, 42, 102, 0.08)", color: NOIR.navyField }} />
                        <Typography variant="body2" sx={{ color: NOIR.navyField, fontWeight: 600 }}>
                          Direct Full-Time Offers for Top Interns
                        </Typography>
                      </Box>
                    </Stack>

                    <Button
                      variant="outlined"
                      onClick={() => setBrochureOpen(true)}
                      startIcon={<PictureAsPdfIcon />}
                      sx={{
                        borderRadius: "100px",
                        py: 1.2,
                        fontFamily: MONO,
                        fontWeight: 800,
                        fontSize: "0.78rem",
                        borderColor: NOIR.navyField,
                        color: NOIR.navyField,
                        bgcolor: "rgba(10, 42, 102, 0.04)",
                        "&:hover": {
                          bgcolor: "rgba(10, 42, 102, 0.08)",
                          borderColor: NOIR.navyField,
                        },
                      }}
                    >
                      VIEW PROGRAM BROCHURE (PDF)
                    </Button>
                  </Stack>
                </Box>
              </Reveal>
            </Grid>
          </Grid>

          {/* ── Search & Department Filter Rail ── */}
          <Reveal delay={0.3}>
            <Stack spacing={3} sx={{ pb: 1, borderBottom: "1px solid rgba(10, 42, 102, 0.18)" }}>
              <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                {/* Search Bar */}
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    placeholder="Search by role, stack (e.g. C++, Python, React)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    variant="outlined"
                    size="small"
                    fullWidth
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: NOIR.navyField }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "100px",
                        bgcolor: "rgba(244, 247, 252, 0.95)",
                        fontFamily: MONO,
                        fontSize: "0.82rem",
                        "& fieldset": { borderColor: "rgba(10, 42, 102, 0.22)" },
                        "&:hover fieldset": { borderColor: NOIR.navyField },
                        "&.Mui-focused fieldset": { borderColor: NOIR.navyField },
                      },
                    }}
                  />
                </Grid>

                {/* Filter Pills */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                    {categories.map((cat) => (
                      <Chip
                        key={cat.label}
                        label={`${cat.label.toUpperCase()} (${cat.count})`}
                        onClick={() => setSelectedCategory(cat.label)}
                        sx={{
                          fontFamily: MONO,
                          fontWeight: 800,
                          fontSize: "0.72rem",
                          bgcolor: selectedCategory === cat.label ? NOIR.navyField : "rgba(244, 247, 252, 0.95)",
                          color: selectedCategory === cat.label ? "common.white" : NOIR.navyField,
                          border: "1px solid",
                          borderColor: selectedCategory === cat.label ? NOIR.navyField : "rgba(10, 42, 102, 0.18)",
                          cursor: "pointer",
                          py: 2,
                          px: 1,
                          transition: "all 0.2s ease",
                        }}
                      />
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </Reveal>

          {/* ── Positions Grid (Clean Card Styling: No Hover Float/Glow & Solid Primary Navy Buttons) ── */}
          <StaggerGroup key={selectedCategory + searchQuery}>
            <Grid container spacing={{ xs: 3, md: 4 }}>
              {filteredPositions.map((position) => (
                <Grid size={{ xs: 12, md: 6 }} key={position.id}>
                  <StaggerItem>
                    <Box
                      sx={{
                        p: { xs: 4, md: 4.5 },
                        borderRadius: 5,
                        bgcolor: "rgba(244, 247, 252, 0.96)",
                        border: "1px solid rgba(10, 42, 102, 0.18)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        height: "100%",
                        position: "relative",
                        // Strictly NO hover float/translate or glow shadow on hover per user rule:
                        boxShadow: "0 2px 12px rgba(10, 42, 102, 0.04)",
                        transition: "border-color 0.25s ease",
                        "&:hover": {
                          borderColor: NOIR.navyField,
                        },
                      }}
                    >
                      <Stack spacing={2.5}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography
                            variant="overline"
                            sx={{
                              fontFamily: MONO,
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              color: NOIR.goldDark,
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
                              fontWeight: 800,
                              bgcolor: position.category === "Graduate Program" ? "rgba(255, 199, 44, 0.25)" : "rgba(10, 42, 102, 0.08)",
                              color: NOIR.navyField,
                              border: "1px solid rgba(10, 42, 102, 0.15)",
                            }}
                          />
                        </Box>

                        <Stack spacing={1}>
                          <Typography variant="h3" component="h2" sx={{ fontWeight: 800, color: NOIR.navyField, fontSize: { xs: "1.4rem", md: "1.65rem" } }}>
                            {position.title}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <LocationOnIcon sx={{ fontSize: "1rem", color: NOIR.navyField }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: NOIR.navyField }}>
                              {position.location} • {position.department}
                            </Typography>
                          </Box>
                        </Stack>

                        <Typography variant="body1" sx={{ color: "rgba(10, 42, 102, 0.82)", lineHeight: 1.65, fontSize: "0.98rem" }}>
                          {position.summary}
                        </Typography>

                        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ pt: 0.5 }}>
                          {position.stack.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{
                                fontFamily: MONO,
                                fontSize: "0.68rem",
                                fontWeight: 800,
                                bgcolor: "rgba(10, 42, 102, 0.08)",
                                color: NOIR.navyField,
                                border: "1px solid rgba(10, 42, 102, 0.15)",
                              }}
                            />
                          ))}
                        </Stack>
                      </Stack>

                      {/* Action Buttons: Solid High-Contrast Primary Navy Background */}
                      <Box sx={{ pt: 3.5, mt: "auto", display: "flex", gap: 1.5 }}>
                        <Button
                          variant="contained"
                          onClick={() => setActiveJobTitle(position.title)}
                          sx={{
                            flexGrow: 1,
                            py: 1.4,
                            bgcolor: NOIR.navyField,
                            color: "common.white",
                            fontFamily: MONO,
                            fontWeight: 800,
                            fontSize: "0.78rem",
                            borderRadius: 3,
                            boxShadow: "none",
                            "&:hover": {
                              bgcolor: "#081F4D",
                              boxShadow: "none",
                            },
                          }}
                        >
                          QUICK PREVIEW
                        </Button>

                        <RouterButton
                          to="/careers/$jobId"
                          params={{ jobId: position.id }}
                          variant="outlined"
                          endIcon={<ArrowForwardIcon />}
                          sx={{
                            py: 1.4,
                            px: 2.5,
                            fontFamily: MONO,
                            fontWeight: 800,
                            fontSize: "0.78rem",
                            borderRadius: 3,
                            borderColor: NOIR.navyField,
                            color: NOIR.navyField,
                            bgcolor: "rgba(10, 42, 102, 0.04)",
                            "&:hover": {
                              borderColor: NOIR.navyField,
                              bgcolor: "rgba(10, 42, 102, 0.1)",
                            },
                          }}
                        >
                          APPLY NOW
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

      {/* Interactive Job Details Modal Drawer */}
      <JobDetailsDrawer
        open={Boolean(activeJobTitle)}
        jobTitle={activeJobTitle}
        onClose={() => setActiveJobTitle(null)}
      />

      {/* Program Brochure Modal Drawer */}
      <BrochureDrawer
        open={brochureOpen}
        onClose={() => setBrochureOpen(false)}
      />
    </Box>
  );
}
