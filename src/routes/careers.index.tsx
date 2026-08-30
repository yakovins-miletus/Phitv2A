import { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { SpecularButton as Button, SpecularIconButton as IconButton } from "@/shared/components/ui/specular";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

import { CAREER_POSITIONS } from "@/shared/careersData";
import { Reveal } from "@/shared/components/Reveal";
import { Section } from "@/shared/components/Section";
import { RouterButton } from "@/shared/components/RouterLink";
import { BrochureDrawer } from "@/shared/components/BrochureDrawer";
import { pageHead } from "@/shared/seo";
import { MONO, DISPLAY_FONT, BODY_FONT, TYPE_SCALE, LINE_HEIGHT, TRACKING } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { useNavbarAnchor } from "@/shared/components/navbarHooks";
import { CAREERS_LOOP, useBackgroundVideo } from "@/shared/components/useBackgroundVideo";

export const Route = createFileRoute("/careers/")({
  head: () =>
    pageHead(
      "Careers & Graduate Programs | Phitopolis R&D",
      "Join Phitopolis R&D in Manila to explore paid engineering internships, full-time technical graduate fellowships, and senior engineering roles."
    ),
  component: CareersIndexPage,
});

/**
 * Dark cinematic band above the light "register" header — a ~7s loop cut from
 * the `daily-life` film (a graduate cohort at the window). Gated by
 * `useBackgroundVideo` (near-viewport, off-screen pause, reduced-motion / low
 * power → poster only). The headline here is a `<p>`, not a heading: the page's
 * real h1 stays in the register section below.
 */
function CareersVideoHero() {
  const heroAnchorRef = useNavbarAnchor(NAV_ANCHORS.CAREERS_HERO, { dark: true });
  const { containerRef, videoRef, shouldLoad, posterOnly } = useBackgroundVideo();

  return (
    <Box
      ref={heroAnchorRef}
      sx={{
        position: "relative",
        width: "100%",
        minHeight: { xs: "50vh", md: "58vh" },
        display: "flex",
        alignItems: "flex-end",
        overflow: "hidden",
        bgcolor: NOIR.navyDeep,
        color: "common.white",
      }}
    >
      <Box
        ref={containerRef}
        aria-hidden
        sx={{ position: "absolute", inset: 0, filter: "brightness(0.6) contrast(1.06)" }}
      >
        <Box
          component="video"
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={CAREERS_LOOP.poster}
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        >
          {!posterOnly && shouldLoad && (
            <>
              <source src={CAREERS_LOOP.webm} type="video/webm" />
              <source src={CAREERS_LOOP.mp4} type="video/mp4" />
            </>
          )}
        </Box>
      </Box>

      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(6,24,59,0.55) 0%, rgba(6,24,59,0.15) 40%, rgba(6,24,59,0.75) 100%)",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1, width: "100%", px: { xs: 3, md: 8 }, py: { xs: 6, md: 9 } }}>
        <Stack spacing={2} sx={{ maxWidth: "60ch" }}>
          <Reveal>
            <Typography
              component="span"
              sx={{
                fontFamily: MONO,
                fontSize: TYPE_SCALE.micro,
                fontWeight: 700,
                letterSpacing: TRACKING.meta,
                color: "var(--accent-ink)",
                textTransform: "uppercase",
                textShadow: "0 2px 10px rgba(0,0,0,0.7)",
              }}
            >
              CAREERS · PHITOPOLIS R&D MANILA
            </Typography>
          </Reveal>
          <Reveal delay={0.08}>
            <Typography
              component="p"
              sx={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 700,
                fontSize: { xs: "2rem", sm: "2.8rem", md: "3.5rem" },
                lineHeight: 1.08,
                letterSpacing: TRACKING.display,
                color: "common.white",
                textShadow: "0 4px 24px rgba(0,0,0,0.7)",
              }}
            >
              See a day here before you decide to spend years.
            </Typography>
          </Reveal>
        </Stack>
      </Box>
    </Box>
  );
}

export function CareersIndexPage() {
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.CAREERS_PAGE, { dark: false });
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [brochureOpen, setBrochureOpen] = useState(false);
  const reducedMotion = useReducedMotion();

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

  const toggleExpanded = (id: string) => {
    setExpandedJobId((curr) => (curr === id ? null : id));
  };

  return (
    <>
    <CareersVideoHero />
    <Box
      ref={anchorRef}
      data-ground="light"
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: "var(--g-void)",
        background: "var(--g-page)",
        color: "var(--text-1)",
        pt: { xs: 6, md: 9 },
        pb: { xs: 10, md: 16 },
        position: "relative",
      }}
    >
      <Section>
        <Stack spacing={{ xs: 6, md: 8 }} sx={{ position: "relative", zIndex: 1 }}>
          {/* ── Archival Register Header & Meta-bar ── */}
          <Box>
            <Reveal>
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.2, mb: 2 }}>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: MONO,
                    fontSize: TYPE_SCALE.micro,
                    fontWeight: 700,
                    letterSpacing: TRACKING.meta,
                    color: "var(--accent-ink)",
                    textTransform: "uppercase",
                  }}
                >
                  REGISTER · PHITOPOLIS R&D MANILA
                </Typography>
              </Box>
            </Reveal>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", md: "flex-end" },
                gap: 3,
              }}
            >
              <Box sx={{ maxWidth: "70ch" }}>
                <Reveal delay={0.05}>
                  <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                      fontFamily: DISPLAY_FONT,
                      fontSize: { xs: "2.2rem", sm: "3rem", md: "3.75rem" },
                      fontWeight: 700,
                      letterSpacing: TRACKING.display,
                      lineHeight: 1.06,
                      color: "var(--text-1)",
                      mb: 2,
                    }}
                  >
                    Active Engineering Positions & Graduate Fellowships
                  </Typography>
                </Reveal>
                <Reveal delay={0.1}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontFamily: BODY_FONT,
                      fontSize: { xs: "1rem", md: "1.125rem" },
                      color: "var(--text-2)",
                      lineHeight: LINE_HEIGHT.relaxed,
                      maxWidth: "65ch",
                    }}
                  >
                    Open engineering roles, quantitative research fellowships, and paid R&D internships at our Manila development center. Explore file dossiers below.
                  </Typography>
                </Reveal>
              </Box>

              {/* Quiet Tertiary Utility: Program Brochure Trigger */}
              <Reveal delay={0.15}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setBrochureOpen(true)}
                  startIcon={<PictureAsPdfIcon sx={{ fontSize: "1rem" }} />}
                  sx={{
                    fontFamily: MONO,
                    fontSize: TYPE_SCALE.caption,
                    letterSpacing: "0.06em",
                    color: "var(--text-2)",
                    borderColor: "var(--glass-border-1)",
                    bgcolor: "var(--glass-fill-1)",
                    borderRadius: "var(--r-control)",
                    px: 2.2,
                    py: 0.9,
                    whiteSpace: "nowrap",
                    "&:hover": {
                      borderColor: "var(--glass-border-2)",
                      bgcolor: "var(--glass-fill-2)",
                      color: "var(--text-1)",
                    },
                    "&:focus-visible": {
                      outline: "2px solid var(--accent-fg)",
                      boxShadow: "0 0 0 4px var(--focus-halo)",
                    },
                  }}
                >
                  PROGRAM BROCHURE (PDF)
                </Button>
              </Reveal>
            </Box>
          </Box>

          {/* ── Search & Category Filter Rail ── */}
          <Reveal delay={0.2}>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", md: "center" },
                  gap: 2.5,
                }}
              >
                {/* Search Input Well */}
                <Box sx={{ width: { xs: "100%", md: "380px" } }}>
                  <TextField
                    placeholder="Search by role, stack (e.g. C++, Python, AWS)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    variant="outlined"
                    size="small"
                    fullWidth
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: "var(--text-3)", fontSize: "1.1rem" }} />
                          </InputAdornment>
                        ),
                        endAdornment: searchQuery ? (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setSearchQuery("")}
                              aria-label="Clear search query"
                              sx={{ color: "var(--text-3)", p: 0.5, "&:hover": { color: "var(--text-1)" } }}
                            >
                              <CloseIcon sx={{ fontSize: "0.95rem" }} />
                            </IconButton>
                          </InputAdornment>
                        ) : null,
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "var(--r-control)",
                        bgcolor: "var(--glass-fill-1)",
                        fontFamily: MONO,
                        fontSize: TYPE_SCALE.caption,
                        color: "var(--text-1)",
                        "& fieldset": { borderColor: "var(--glass-border-1)" },
                        "&:hover fieldset": { borderColor: "var(--glass-border-2)" },
                        "&.Mui-focused fieldset": {
                          borderColor: "var(--accent-fg)",
                          boxShadow: "0 0 0 3px var(--focus-halo)",
                        },
                      },
                      "& .MuiInputBase-input::placeholder": {
                        color: "var(--text-3)",
                        opacity: 1,
                      },
                    }}
                  />
                </Box>

                {/* Category Chips */}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.label;
                    return (
                      <Chip
                        key={cat.label}
                        label={
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.8 }}>
                            <Typography
                              component="span"
                              sx={{
                                fontFamily: MONO,
                                fontSize: TYPE_SCALE.micro,
                                fontWeight: 700,
                                letterSpacing: "0.06em",
                              }}
                            >
                              {cat.label.toUpperCase()} [{cat.count}]
                            </Typography>
                          </Box>
                        }
                        onClick={() => setSelectedCategory(cat.label)}
                        sx={{
                          cursor: "pointer",
                          height: 32,
                          px: 0.5,
                          borderRadius: "var(--r-control)",
                          bgcolor: isSelected ? "var(--accent-15)" : "var(--glass-fill-1)",
                          color: isSelected ? "var(--accent-ink)" : "var(--text-2)",
                          border: "1px solid",
                          borderColor: isSelected ? "var(--accent-border)" : "var(--glass-border-1)",
                          transition: "all var(--dur) var(--ease-out)",
                          "&:hover": {
                            bgcolor: isSelected ? "var(--accent-20)" : "var(--glass-fill-2)",
                            borderColor: isSelected ? "var(--accent-fg)" : "var(--glass-border-2)",
                            color: isSelected ? "var(--accent-ink)" : "var(--text-1)",
                          },
                          "&:focus-visible": {
                            outline: "2px solid var(--accent-fg)",
                            boxShadow: "0 0 0 4px var(--focus-halo)",
                          },
                        }}
                      />
                    );
                  })}
                </Stack>
              </Box>
            </Stack>
          </Reveal>

          {/* ── Staggered Folder-Tab Register ── */}
          <Box>
            {filteredPositions.length === 0 ? (
              <Reveal>
                <Box
                  sx={{
                    p: { xs: 4, sm: 6 },
                    borderRadius: "var(--r-card)",
                    border: "1px dashed var(--glass-border-2)",
                    bgcolor: "var(--glass-fill-1)",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: TYPE_SCALE.micro,
                      letterSpacing: TRACKING.meta,
                      color: "var(--accent-ink)",
                      mb: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    ARCHIVE STATUS // 0 MATCHES
                  </Typography>
                  <Typography
                    variant="h4"
                    component="p"
                    sx={{
                      fontFamily: DISPLAY_FONT,
                      fontWeight: 600,
                      color: "var(--text-1)",
                      mb: 1.5,
                    }}
                  >
                    No positions match your search query
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "var(--text-2)",
                      maxWidth: "45ch",
                      mx: "auto",
                      mb: 3,
                    }}
                  >
                    No active register files found for &ldquo;{searchQuery}&rdquo;. Try searching for alternative skills or resetting your filters.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                    sx={{
                      fontFamily: MONO,
                      fontSize: TYPE_SCALE.caption,
                      borderRadius: "var(--r-control)",
                      borderColor: "var(--accent-border)",
                      color: "var(--accent-ink)",
                      bgcolor: "var(--accent-15)",
                      "&:hover": {
                        bgcolor: "var(--accent-25)",
                        borderColor: "var(--accent-fg)",
                      },
                    }}
                  >
                    RESET REGISTERS
                  </Button>
                </Box>
              </Reveal>
            ) : (
              <Stack spacing={5}>
                {categories
                  .filter((cat) => cat.label !== "All")
                  .map((cat) => {
                    const groupPositions = filteredPositions.filter((p) => p.category === cat.label);
                    if (groupPositions.length === 0) return null;

                    return (
                      <Box key={cat.label}>
                        {/* One hairline rule per GROUP, not per row */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 1.5,
                            pb: 1.2,
                            mb: 2.5,
                            borderBottom: "1px solid var(--divider)",
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: MONO,
                              fontSize: TYPE_SCALE.micro,
                              fontWeight: 700,
                              letterSpacing: TRACKING.meta,
                              color: "var(--text-2)",
                              textTransform: "uppercase",
                            }}
                          >
                            {cat.label}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: MONO,
                              fontSize: TYPE_SCALE.micro,
                              color: "var(--text-3)",
                            }}
                          >
                            {`[${String(groupPositions.length)}]`}
                          </Typography>
                        </Box>

                        <Stack spacing={2}>
                          {groupPositions.map((position, index) => {
                            const isExpanded = expandedJobId === position.id;

                            return (
                              <Reveal key={position.id} delay={0.04 * index}>
                                {/* Flat File Card */}
                                <Box
                                  sx={{
                                    borderRadius: "var(--r-card)",
                                    bgcolor: "var(--g-panel)",
                                    border: "1px solid",
                                    borderColor: "var(--glass-border-1)",
                                    boxShadow: isExpanded ? "var(--glass-shadow-2)" : "var(--glass-shadow-1)",
                                    transition: "background-color var(--dur) var(--ease-out), border-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out)",
                                    overflow: "hidden",
                                  }}
                                >
                          {/* Clickable Folder Header Trigger */}
                          <Box
                            component="button"
                            type="button"
                            id={`job-tab-${position.id}`}
                            aria-expanded={isExpanded}
                            aria-controls={`job-peek-${position.id}`}
                            onClick={() => toggleExpanded(position.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleExpanded(position.id);
                              }
                            }}
                            sx={{
                              width: "100%",
                              display: "flex",
                              flexDirection: { xs: "column", md: "row" },
                              alignItems: { xs: "flex-start", md: "center" },
                              justifyContent: "space-between",
                              gap: { xs: 2, md: 3 },
                              p: { xs: 2.5, sm: 3, md: 3.5 },
                              bgcolor: "transparent",
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                              outline: "none",
                              color: "inherit",
                              "&:focus-visible": {
                                outline: "2px solid var(--accent-fg)",
                                boxShadow: "0 0 0 4px var(--focus-halo)",
                                borderRadius: "var(--r-card)",
                              },
                              "&:hover": {
                                "& .job-title": {
                                  color: "var(--accent-ink)",
                                },
                                "& .expand-indicator": {
                                  borderColor: "var(--accent-fg)",
                                  color: "var(--accent-ink)",
                                },
                              },
                            }}
                          >
                            {/* Left: Title & Meta Info */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="h3"
                                component="h2"
                                className="job-title"
                                sx={{
                                  fontFamily: DISPLAY_FONT,
                                  fontSize: { xs: "1.25rem", sm: "1.4rem", md: "1.6rem" },
                                  fontWeight: 700,
                                  color: "var(--text-1)",
                                  lineHeight: LINE_HEIGHT.snug,
                                  letterSpacing: TRACKING.display,
                                  wordBreak: "break-word",
                                  transition: "color var(--dur) var(--ease-out)",
                                }}
                              >
                                {position.title}
                              </Typography>

                              <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="center"
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ mt: 1.2 }}
                              >
                                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                                  <LocationOnIcon sx={{ fontSize: "0.95rem", color: "var(--text-3)" }} />
                                  <Typography
                                    sx={{
                                      fontFamily: BODY_FONT,
                                      fontSize: TYPE_SCALE.body2,
                                      color: "var(--text-2)",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {position.location}
                                  </Typography>
                                </Box>
                                <Box component="span" sx={{ color: "var(--glass-border-2)", userSelect: "none" }}>•</Box>
                                <Typography
                                  sx={{
                                    fontFamily: BODY_FONT,
                                    fontSize: TYPE_SCALE.body2,
                                    color: "var(--text-3)",
                                  }}
                                >
                                  {position.department}
                                </Typography>
                                <Chip
                                  label={position.type}
                                  size="small"
                                  sx={{
                                    fontFamily: MONO,
                                    fontSize: TYPE_SCALE.micro,
                                    fontWeight: 700,
                                    letterSpacing: "0.05em",
                                    bgcolor: "var(--glass-fill-2)",
                                    color: "var(--text-2)",
                                    border: "1px solid var(--glass-border-1)",
                                    height: 22,
                                    "& .MuiChip-label": { px: 1 },
                                  }}
                                />
                              </Stack>
                            </Box>

                            {/* Right: Expand Affordance Button/Indicator */}
                            <Box
                              className="expand-indicator"
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 1,
                                px: 2,
                                py: 0.8,
                                borderRadius: "var(--r-pill)",
                                bgcolor: "var(--glass-fill-2)",
                                border: "1px solid",
                                borderColor: isExpanded ? "var(--glass-border-2)" : "var(--glass-border-1)",
                                color: isExpanded ? "var(--text-1)" : "var(--text-2)",
                                fontFamily: MONO,
                                fontSize: TYPE_SCALE.micro,
                                fontWeight: 700,
                                letterSpacing: TRACKING.meta,
                                transition: "all var(--dur) var(--ease-out)",
                                flexShrink: 0,
                              }}
                            >
                              <Box component="span">
                                {isExpanded ? "COLLAPSE" : "PEEK DOSSIER"}
                              </Box>
                              <KeyboardArrowDownIcon
                                sx={{
                                  fontSize: "1.1rem",
                                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                  transition: "transform var(--dur) var(--ease-out)",
                                }}
                              />
                            </Box>
                          </Box>

                          {/* In-Place Peek Expansion (Motion v12) */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                id={`job-peek-${position.id}`}
                                role="region"
                                aria-labelledby={`job-tab-${position.id}`}
                                initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={reducedMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
                                transition={
                                  reducedMotion
                                    ? { duration: 0 }
                                    : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                                }
                                style={{ overflow: "hidden" }}
                              >
                                <Box
                                  sx={{
                                    px: { xs: 2.5, sm: 3, md: 3.5 },
                                    pb: { xs: 3, sm: 3.5, md: 4 },
                                    pt: 2.5,
                                    borderTop: "1px solid var(--glass-border-1)",
                                  }}
                                >
                                  {/* Datasheet Meta-Rail — no surface, mono label treatment carries it */}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: { xs: 1, md: 2.5 },
                                      alignItems: "baseline",
                                      mb: 3.5,
                                    }}
                                  >
                                    <Typography sx={{ fontFamily: MONO, fontSize: TYPE_SCALE.micro, letterSpacing: TRACKING.meta, color: "var(--text-3)" }}>
                                      DEPT // <Box component="span" sx={{ color: "var(--text-1)", fontWeight: 700 }}>{position.department.toUpperCase()}</Box>
                                    </Typography>
                                    <Box component="span" sx={{ color: "var(--glass-border-2)", userSelect: "none" }}>|</Box>
                                    <Typography sx={{ fontFamily: MONO, fontSize: TYPE_SCALE.micro, letterSpacing: TRACKING.meta, color: "var(--text-3)" }}>
                                      LOC // <Box component="span" sx={{ color: "var(--text-1)", fontWeight: 700 }}>{position.location.toUpperCase()}</Box>
                                    </Typography>
                                    <Box component="span" sx={{ color: "var(--glass-border-2)", userSelect: "none", display: { xs: "none", sm: "inline" } }}>|</Box>
                                    <Typography sx={{ fontFamily: MONO, fontSize: TYPE_SCALE.micro, letterSpacing: TRACKING.meta, color: "var(--text-3)" }}>
                                      TYPE // <Box component="span" sx={{ color: "var(--text-1)", fontWeight: 700 }}>{position.type.toUpperCase()}</Box>
                                    </Typography>
                                  </Box>

                                  {/* Summary Prose (45-75ch measure) */}
                                  <Box sx={{ mb: 3.5 }}>
                                    <Typography
                                      sx={{
                                        fontFamily: MONO,
                                        fontSize: TYPE_SCALE.micro,
                                        letterSpacing: TRACKING.meta,
                                        color: "var(--text-3)",
                                        mb: 0.8,
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      ROLE SPECIFICATION SUMMARY
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        color: "var(--text-2)",
                                        lineHeight: LINE_HEIGHT.relaxed,
                                        fontSize: TYPE_SCALE.body1,
                                        maxWidth: "65ch",
                                      }}
                                    >
                                      {position.summary}
                                    </Typography>
                                  </Box>

                                  {/* Tech Stack Chips */}
                                  <Box sx={{ mb: 4 }}>
                                    <Typography
                                      sx={{
                                        fontFamily: MONO,
                                        fontSize: TYPE_SCALE.micro,
                                        letterSpacing: TRACKING.meta,
                                        color: "var(--text-3)",
                                        mb: 0.8,
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      ENGINEERING STACK
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                      {position.stack.map((tag) => (
                                        <Chip
                                          key={tag}
                                          label={tag}
                                          size="small"
                                          sx={{
                                            fontFamily: MONO,
                                            fontSize: TYPE_SCALE.micro,
                                            fontWeight: 600,
                                            bgcolor: "var(--glass-fill-2)",
                                            color: "var(--text-1)",
                                            border: "1px solid var(--glass-border-1)",
                                            borderRadius: "var(--r-control)",
                                            height: 26,
                                            "& .MuiChip-label": { px: 1.2 },
                                          }}
                                        />
                                      ))}
                                    </Stack>
                                  </Box>

                                  {/* Sole Primary Action: Navigate to Canonical Detail Route */}
                                  <RouterButton
                                    to="/careers/$jobId"
                                    params={{ jobId: position.id }}
                                    variant="contained"
                                    endIcon={<ArrowForwardIcon sx={{ fontSize: "1rem" }} />}
                                    sx={{
                                      py: 1.2,
                                      px: 3.5,
                                      fontFamily: MONO,
                                      fontWeight: 800,
                                      fontSize: TYPE_SCALE.caption,
                                      letterSpacing: "0.08em",
                                      bgcolor: NOIR.gold,
                                      color: NOIR.navyInk,
                                      borderRadius: "var(--r-control)",
                                      boxShadow: "0 4px 14px rgba(var(--accent-rgb), 0.25)",
                                      "&:hover": {
                                        bgcolor: NOIR.goldLight,
                                        boxShadow: "0 6px 20px rgba(var(--accent-rgb), 0.4)",
                                        transform: "translateY(-1px)",
                                      },
                                      "&:focus-visible": {
                                        outline: "2px solid var(--accent-fg)",
                                        boxShadow: "0 0 0 4px var(--focus-halo)",
                                      },
                                      transition: "all var(--dur) var(--ease-out)",
                                    }}
                                  >
                                    OPEN FULL ROLE
                                  </RouterButton>
                                </Box>
                              </motion.div>
                            )}
                          </AnimatePresence>
                                </Box>
                              </Reveal>
                            );
                          })}
                        </Stack>
                      </Box>
                    );
                  })}
              </Stack>
            )}
          </Box>
        </Stack>
      </Section>

      {/* Program Brochure Modal Drawer */}
      <BrochureDrawer
        open={brochureOpen}
        onClose={() => setBrochureOpen(false)}
      />
    </Box>
    </>
  );
}
