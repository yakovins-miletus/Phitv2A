import { useRef, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { motion, useScroll, useTransform, useSpring } from "motion/react";

import { Section } from "@/shared/components/Section";
import { Reveal } from "@/shared/components/Reveal";
import { RouterButton } from "@/shared/components/RouterLink";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";

interface Cohort {
  id: string;
  year: string;
  badge: string;
  title: string;
  description: string;
  image: string;
  highlights: string[];
}

const GRADUATE_COHORTS: Cohort[] = [
  {
    id: "2023",
    year: "2023 Grad Cohort",
    badge: "FOUNDATIONAL FELLOWS",
    title: "2023 Inaugural Graduate Cohort",
    description: "The pioneer cohort of software and quantitative research fellows who established Phitopolis R&D standards, setting the benchmark for high-performance software engineering in Manila.",
    image: "/images/grads/2023Grads.webp",
    highlights: ["Software Engineering", "Quant Systems", "Platform R&D"],
  },
  {
    id: "2024-b1",
    year: "2024 Batch 1",
    badge: "SYSTEMS & INFRASTRUCTURE",
    title: "2024 Batch 1 R&D Cohort",
    description: "High-performing engineering graduates specializing in core systems architecture, distributed data pipelines, and low-latency C++ engines.",
    image: "/images/grads/2024B1.webp",
    highlights: ["Core Engineering", "Systems Design", "High-Performance Computing"],
  },
  {
    id: "2024-b2",
    year: "2024 Batch 2",
    badge: "ADVANCED SYSTEMS",
    title: "2024 Batch 2 R&D Cohort",
    description: "Engineering graduates expanding distributed computing pipelines, cloud infrastructure, and automated testing frameworks.",
    image: "/images/grads/2024B2Grads.webp",
    highlights: ["Distributed Systems", "Data Pipelines", "Cloud R&D"],
  },
  {
    id: "2024-2025",
    year: "2024–2025",
    badge: "QUANT & AI RESEARCH",
    title: "2024–2025 Joint Innovation Cohort",
    description: "Cross-functional cohort focused on high-frequency trading tools, automated testing engines, and GenAI integration workflows.",
    image: "/images/grads/2024B2and2025.webp",
    highlights: ["GenAI Integration", "High-Throughput C++", "Data Analytics"],
  },
  {
    id: "2026-b1",
    year: "2026 Batch 1",
    badge: "AI AGENTS & PLATFORM",
    title: "2026 Batch 1 Tech Graduates",
    description: "Our newest cohort, working on web architecture, cloud-native pipelines, and AI agents for global systems.",
    image: "/images/grads/2026B1Grads.webp",
    highlights: ["AI Agents", "Modern Web Architecture", "DevOps Systems"],
  },
  {
    id: "2026-b2",
    year: "2026 Batch 2",
    badge: "AI AGENTS & PLATFORM",
    title: "2026 Batch 2 Tech Graduates",
    description: "Our latest cohort, extending web architecture, cloud-native pipelines, and AI agents for global systems.",
    image: "/images/grads/2026B2Grads.webp",
    highlights: ["AI Agents", "Modern Web Architecture", "DevOps Systems"],
  },
];

export function GraduateHallOfFameSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);

  // Scroll progress for the overall section timeline
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 20 });
  const lineHeight = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  // Track active batch based on scroll position
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const idx = Math.min(
        GRADUATE_COHORTS.length - 1,
        Math.max(0, Math.floor(latest * GRADUATE_COHORTS.length))
      );
      setActiveBatchIndex(idx);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <Section muted>
      <Box ref={containerRef} sx={{ position: "relative", width: "100%" }}>
        <Stack spacing={{ xs: 8, md: 10 }} sx={{ width: "100%" }}>
          {/* Section Header */}
          <Stack spacing={2} sx={{ maxWidth: 840 }}>
            <Reveal>
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                <EmojiEventsIcon sx={{ color: "var(--accent-ink)", fontSize: "1.2rem" }} />
                <Typography
                  variant="overline"
                  sx={{
                    color: "var(--accent-ink)",
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                    fontSize: "0.85rem",
                    fontFamily: MONO,
                  }}
                >
                  HALL OF FAME
                </Typography>
              </Box>
            </Reveal>
            <Reveal delay={0.1}>
              <Typography variant="h2" component="h2" sx={{ fontWeight: 800 }}>
                Phitopolis Graduate Program
              </Typography>
            </Reveal>
            <Reveal delay={0.2}>
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: "1.15rem", lineHeight: 1.6 }}>
                Our technical graduate cohorts: engineering and quantitative research fellows trained in Manila for global production systems.
              </Typography>
            </Reveal>
          </Stack>

          {/* Container-bounded Layout Grid with Sticky Mini Guide Rail */}
          <Box sx={{ position: "relative", display: "flex", gap: { xs: 3, md: 6 } }}>
            {/* Sticky Mini Guide Rail */}
            <Box
              sx={{
                display: { xs: "none", md: "block" },
                position: "sticky",
                top: 120,
                height: "fit-content",
                width: 150,
                flexShrink: 0,
                zIndex: 10,
              }}
            >
              <Stack spacing={2.5}>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: MONO,
                    fontWeight: 800,
                    color: NOIR.navyField,
                    letterSpacing: "0.15em",
                    fontSize: "0.7rem",
                  }}
                >
                  PROGRAM TIMELINE
                </Typography>

                {GRADUATE_COHORTS.map((cohort, index) => {
                  const isActive = activeBatchIndex === index;
                  return (
                    <Box
                      key={cohort.id}
                      onClick={() => {
                        const el = document.getElementById(`cohort-${cohort.id}`);
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      sx={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        opacity: isActive ? 1 : 0.45,
                        transition: "all 0.3s ease",
                      }}
                    >
                      <Box
                        sx={{
                          width: isActive ? 10 : 6,
                          height: isActive ? 10 : 6,
                          borderRadius: "50%",
                          bgcolor: isActive ? "var(--accent)" : NOIR.navyField,
                          boxShadow: isActive ? "0 0 0 4px rgba(var(--accent-rgb), 0.3)" : "none",
                          transition: "all 0.3s ease",
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: MONO,
                          fontWeight: isActive ? 800 : 600,
                          fontSize: "0.78rem",
                          color: isActive ? NOIR.navyField : "text.secondary",
                        }}
                      >
                        {cohort.year}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* Sequential 1-at-a-time Timeline Stream */}
            <Box sx={{ position: "relative", flex: 1 }}>
              {/* Animated Vertical Timeline Line */}
              <Box
                sx={{
                  position: "absolute",
                  top: 20,
                  bottom: 20,
                  left: { xs: 16, md: 24 },
                  width: 2,
                  bgcolor: "rgba(10, 42, 102, 0.1)",
                  zIndex: 0,
                }}
              >
                <motion.div
                  style={{
                    width: "100%",
                    height: lineHeight,
                    // motion.div style — `var()` resolves fine here, but the
                    // token import keeps this greppable alongside the rest.
                    backgroundColor: NOIR.gold,
                    originY: 0,
                  }}
                />
              </Box>

              {/* 1-at-a-time Cohort Batch Progression Stream */}
              <Stack spacing={{ xs: 8, md: 12 }}>
                {GRADUATE_COHORTS.map((cohort, index) => (
                  <Box
                    key={cohort.id}
                    id={`cohort-${cohort.id}`}
                    sx={{
                      position: "relative",
                      pl: { xs: 6, md: 9 },
                      scrollMarginTop: 140,
                    }}
                  >
                    {/* Timeline Circle Node Marker */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: { xs: 7, md: 15 },
                        top: 6,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        bgcolor: "white",
                        border: "3px solid #0A2A66",
                        boxShadow:
                          activeBatchIndex === index ? "0 0 0 6px rgba(var(--accent-rgb), 0.4)" : "none",
                        zIndex: 2,
                        transition: "box-shadow 0.3s ease",
                      }}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
                    >
                      <Stack spacing={3}>
                        {/* Batch Frameless Image */}
                        <Box
                          sx={{
                            position: "relative",
                            width: "100%",
                            aspectRatio: { xs: "16/10", md: "16/9" },
                            borderRadius: { xs: 5, md: 7 },
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            component="img" decoding="async" loading="lazy"
                            src={cohort.image}
                            alt={cohort.title}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </Box>

                        {/* Clean Frameless Text Block */}
                        <Stack spacing={1.2}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: MONO,
                              fontSize: "0.78rem",
                              color: "rgba(10, 42, 102, 0.7)",
                            }}
                          >
                            {cohort.year}
                          </Typography>
                          <Typography variant="h3" component="h3" sx={{ fontWeight: 800, color: "text.primary", fontSize: { xs: "1.5rem", md: "1.85rem" } }}>
                            {cohort.title}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65, fontSize: "1.02rem" }}>
                            {cohort.description}
                          </Typography>
                        </Stack>
                      </Stack>
                    </motion.div>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>

          {/* Invitation Banner for Joining the Technical Graduate Program */}
          <Reveal delay={0.2}>
            <Box
              sx={{
                mt: { xs: 6, md: 10 },
                p: { xs: 4, md: 6 },
                borderRadius: { xs: 5, md: 7 },
                bgcolor: "rgba(244, 247, 252, 0.95)",
                border: "1px solid rgba(10, 42, 102, 0.18)",
                color: NOIR.navyField,
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "flex-start", md: "center" },
                justifyContent: "space-between",
                gap: 4,
                boxShadow: "0 8px 30px rgba(10, 42, 102, 0.08)",
              }}
            >
              <Stack spacing={1.5} sx={{ maxWidth: 680 }}>
                <Typography variant="h3" component="h3" sx={{ fontWeight: 800, color: NOIR.navyField, fontSize: { xs: "1.6rem", md: "2.1rem" } }}>
                  Ready to Shape the Future of Production Systems?
                </Typography>
                <Typography variant="body1" sx={{ color: "rgba(10, 42, 102, 0.82)", lineHeight: 1.65, fontSize: "1.05rem" }}>
                  Applications for our next Technical Graduate Program intake and paid R&D internships are now open. Start your engineering career with 1-on-1 mentorship.
                </Typography>
              </Stack>

              <RouterButton
                to="/careers"
                variant="contained"
                sx={{
                  // The gold-fill / navy-label pairing IS `secondary` — pinned at
                  // 8.44:1 by tests/a11y-contrast.test.ts "navy reads on a gold fill".
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  letterSpacing: "0.08em",
                  px: 4,
                  py: 1.8,
                  borderRadius: 3,
                  whiteSpace: "nowrap",
                  "&:hover": {
                    bgcolor: "secondary.light",
                  },
                }}
              >
                APPLY FOR GRADUATE PROGRAM
              </RouterButton>
            </Box>
          </Reveal>
        </Stack>
      </Box>
    </Section>
  );
}
