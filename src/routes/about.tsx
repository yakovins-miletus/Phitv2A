import React, { useState, useRef } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PsychologyIcon from "@mui/icons-material/Psychology";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import CodeIcon from "@mui/icons-material/Code";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import ShieldIcon from "@mui/icons-material/Shield";
import VerifiedIcon from "@mui/icons-material/Verified";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

const VALUE_ICONS: Record<string, React.ComponentType<any>> = {
  "Integrity": ShieldIcon,
  "Accountability": VerifiedIcon,
  "Forward Thinking": TrendingUpIcon,
  "Excellence": WorkspacePremiumIcon,
};
import { motion, useScroll, useTransform, useVelocity, useSpring, useAnimationFrame, useInView } from "motion/react";
import { createFileRoute } from "@tanstack/react-router";

import { CONTENT } from "@/shared/content";
import { FillText } from "@/shared/components/FillText";
import { Reveal, StaggerGroup, StaggerItem } from "@/shared/components/Reveal";
import { Section } from "@/shared/components/Section";
import { StatStrip } from "@/shared/components/StatStrip";
import { useNavbarAnchor } from "@/shared/components/NavbarContext";
import { JourneyTimeline } from "@/features/about/JourneyTimeline";
import { pageHead } from "@/shared/seo";
import { NOIR } from "@/shared/theme/palette";
import { MONO, FONT } from "@/shared/theme/theme";
import { usePreloaderReady } from "@/shared/motion";
import { EASE_IN_OUT_QUART, EASE_OUT_EXPO } from "@/shared/motion/easing";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "About · Phitopolis",
      "Seven years building a top-tier R&D firm in Manila for global markets — our story, mission and values, proven impact, certifications, and our offices.",
    ),
  component: AboutPage,
});

// A hairline meta label, used to head sub-blocks.
function MetaLabel({ children }: { children: string }) {
  return (
    <Typography
      sx={{
        fontFamily: MONO,
        fontSize: "0.72rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "text.secondary",
      }}
    >
      {children}
    </Typography>
  );
}

// Section 1: The four values.
function PrinciplesSection() {
  const { values } = CONTENT.principles;
  return (
    <Section muted>
      <Stack spacing={{ xs: 6, md: 8 }}>
        <Stack spacing={3}>
          <Reveal>
            <Typography variant="h2" component="h2">
              Rooted in values
            </Typography>
          </Reveal>
          <StaggerGroup>
            <Stack divider={<Divider />} sx={{ borderTop: 1, borderBottom: 1, borderColor: "divider" }}>
              {values.map((value) => {
                const Icon = VALUE_ICONS[value.label] || ShieldIcon;
                return (
                  <StaggerItem key={value.label}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={{ xs: 1.5, md: 6 }}
                      sx={{ 
                        py: 3, px: 2, borderRadius: 2, alignItems: { md: "baseline" },
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover .value-title": { 
                          color: "transparent", 
                          backgroundImage: "linear-gradient(135deg, #FFC72C 35%, #FFF6D6 50%, #FFC72C 65%)",
                          backgroundSize: "200% 100%",
                          animation: "valueShimmer 1.8s infinite linear",
                          transition: "color 0.3s ease",
                        },
                        "&:hover .value-def": { 
                          color: "transparent", 
                          backgroundImage: "linear-gradient(135deg, #0A2A66 35%, #3B5585 50%, #0A2A66 65%)",
                          backgroundSize: "200% 100%",
                          animation: "valueShimmer 1.8s infinite linear",
                          transition: "color 0.3s ease",
                        },
                        "&:hover .value-client": { 
                          color: "transparent", 
                          backgroundImage: "linear-gradient(135deg, #6B7FA8 35%, #A2B2D1 50%, #6B7FA8 65%)",
                          backgroundSize: "200% 100%",
                          animation: "valueShimmer 1.8s infinite linear",
                          transition: "color 0.3s ease",
                        },
                        "&:hover .value-icon-container": { width: { xs: "28px", md: "36px" }, opacity: 1, marginRight: { xs: "8px", md: "12px" } },
                        "@keyframes valueShimmer": {
                          "0%": { backgroundPosition: "150% 0" },
                          "100%": { backgroundPosition: "-50% 0" }
                        }
                      }}
                    >
                      {/* Left header group (Icon + Title) */}
                      <Box sx={{ display: "flex", alignItems: "center", flexBasis: { md: 260 }, flexShrink: 0 }}>
                        {/* Inline Push Icon */}
                        <Box
                          className="value-icon-container"
                          sx={{
                            width: 0,
                            opacity: 0,
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "secondary.main",
                            transition: "all 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
                            pointerEvents: "none",
                            "& svg": {
                              fontSize: { xs: "24px", md: "28px" },
                            }
                          }}
                        >
                          <Icon />
                        </Box>

                        <Typography
                          variant="h4"
                          className="value-title"
                          sx={{ 
                            color: "primary.main",
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            transition: "none",
                          }}
                        >
                          {value.label}
                        </Typography>
                      </Box>

                      <Stack spacing={1.5} sx={{ position: "relative", zIndex: 1 }}>
                        <Typography 
                          variant="body1" 
                          className="value-def"
                          sx={{
                            color: "text.primary",
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            transition: "none",
                          }}
                        >
                          {value.definition}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          className="value-client"
                          sx={{
                            color: "text.secondary",
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            transition: "none",
                          }}
                        >
                          {value.valueToClient}
                        </Typography>
                      </Stack>
                    </Stack>
                  </StaggerItem>
                );
              })}
            </Stack>
          </StaggerGroup>
        </Stack>
      </Stack>
    </Section>
  );
}

// Section 2: Core Culture — moved here from the Home page, underneath Values.
const CULTURE_ICONS = [
  PsychologyIcon,
  LightbulbIcon,
  RecordVoiceOverIcon,
  CodeIcon,
  GroupWorkIcon,
];
function CultureSection() {
  const [isFilled, setIsFilled] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <Section>
        <Box sx={{ mb: { xs: 3, md: 4 } }}>
          <FillText text="Core Competencies" onComplete={setIsFilled} />
        </Box>
        <StaggerGroup>
          <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="center">
            {CONTENT.culture.map((val, i) => {
              const Icon = CULTURE_ICONS[i % CULTURE_ICONS.length] || PsychologyIcon;
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={val}>
                  <StaggerItem>
                    <Box sx={{
                      p: 3,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      bgcolor: isFilled ? `rgba(${NOIR.navyFieldRgb}, 0.03)` : 'transparent',
                      transform: isFilled ? 'translateY(-4px)' : 'none',
                      boxShadow: isFilled ? `0 8px 24px rgba(${NOIR.navyFieldRgb}, 0.12)` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: "-1px",
                        border: 1,
                        borderColor: 'primary.main',
                        borderRadius: 'inherit',
                        pointerEvents: 'none',
                        clipPath: isFilled ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' : 'polygon(0 0, 0 0, 0 100%, 0 100%)',
                        transition: 'clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        transitionDelay: `${i * 0.1}s`,
                      }
                    }}>
                      <Box sx={{
                        opacity: isFilled ? 1 : 0,
                        transform: isFilled ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(-45deg)',
                        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transitionDelay: `${i * 0.1}s`,
                        color: 'primary.main',
                        display: 'flex'
                      }}>
                         <Icon fontSize="large" />
                      </Box>
                      <Typography variant="h4" color={isFilled ? 'primary.main' : 'text.primary'} sx={{
                         transition: 'color 0.5s ease',
                         transitionDelay: `${i * 0.1}s`,
                      }}>
                         {val}
                      </Typography>
                    </Box>
                  </StaggerItem>
                </Grid>
              );
            })}
          </Grid>
        </StaggerGroup>
      </Section>
    </Box>
  );
}

// Section 3: Proven impact — outcome stats.
function ImpactSection() {
  return (
    <Section muted>
      <Stack spacing={{ xs: 4, md: 6 }}>
        <Reveal>
          <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
            <MetaLabel>Proven Impact</MetaLabel>
            <Typography variant="h2" component="h2">
              Results that speak in numbers
            </Typography>
          </Stack>
        </Reveal>
        <Reveal delay={0.1}>
          <StatStrip stats={CONTENT.impact} />
        </Reveal>
      </Stack>
    </Section>
  );
}

// Section 4: Talent credibility — education and disciplines as insight.
function TalentSection() {
  const { highlights, disciplines, schools } = CONTENT.talent;
  return (
    <Section>
      <Stack spacing={{ xs: 5, md: 7 }}>
        <Reveal>
          <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
            <MetaLabel>Where Our Talent Comes From</MetaLabel>
            <Typography variant="h2" component="h2">
              Recruited from the top programs in the Philippines and Asia
            </Typography>
          </Stack>
        </Reveal>

        <Reveal delay={0.1}>
          <StatStrip stats={highlights} />
        </Reveal>

        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Reveal>
              <Stack spacing={2}>
                <MetaLabel>Disciplines</MetaLabel>
                <StaggerGroup>
                  <Stack spacing={2}>
                    {disciplines.map((discipline) => (
                      <StaggerItem key={discipline.label}>
                        <Box sx={{
                          p: 1.5, borderRadius: 1, ml: -1.5,
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": { bgcolor: "action.hover", transform: "translateX(8px)" }
                        }}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                            <Typography variant="body2" color="text.primary">
                              {discipline.label}
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: MONO, color: "text.secondary" }}>
                              {discipline.pct}%
                            </Typography>
                          </Stack>
                          <Box sx={{ height: 4, borderRadius: 2, bgcolor: "divider", overflow: "hidden" }}>
                            <Box sx={{ width: `${String(discipline.pct)}%`, height: 1, bgcolor: NOIR.gold }} />
                          </Box>
                        </Box>
                      </StaggerItem>
                    ))}
                  </Stack>
                </StaggerGroup>
              </Stack>
            </Reveal>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Reveal delay={0.1}>
              <Stack spacing={2}>
                <MetaLabel>Alma Maters</MetaLabel>
                <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
                  {schools.map((school) => (
                    <Stack
                      key={school.name}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      title={school.name}
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        bgcolor: "background.default",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          borderColor: "primary.main",
                        }
                      }}
                    >
                      {school.logo ? (
                        <Box component="img" src={school.logo} alt={school.name} sx={{ width: 20, height: 20, objectFit: "contain", borderRadius: "50%", bgcolor: "white" }} />
                      ) : (
                        <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: "divider" }} />
                      )}
                      <Typography variant="body2" sx={{ fontFamily: MONO, fontSize: "0.75rem", fontWeight: 500, color: "text.primary" }}>
                        {school.abbr}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
                  A multi-disciplined team covering every layer of the stack — from the country's
                  leading computer-science programs to internationally educated specialists
                </Typography>
              </Stack>
            </Reveal>
          </Grid>
        </Grid>
      </Stack>
    </Section>
  );
}

// Section 5: Certifications — grouped by provider, framed as insight.
function CertificationsSection() {
  const { headline, note, groups } = CONTENT.certifications;
  return (
    <Section muted>
      <Stack spacing={{ xs: 6, md: 8 }}>
        <Reveal>
          <Stack spacing={2} sx={{ maxWidth: 720 }}>
            <MetaLabel>Certifications</MetaLabel>
            <Typography variant="h2" component="h2" sx={{ fontWeight: 700 }}>
              {headline}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {note}
            </Typography>
          </Stack>
        </Reveal>

        <StaggerGroup>
          <Grid container spacing={4}>
            {groups.map((group) => (
              <Grid size={{ xs: 12 }} key={group.provider}>
                <StaggerItem>
                  <Box sx={{ 
                    p: { xs: 3, md: 5 }, 
                    border: 1, 
                    borderColor: "divider", 
                    borderRadius: 3, 
                    bgcolor: "background.default",
                    overflow: "hidden"
                  }}>
                    {/* Shelf Header */}
                    <Box sx={{ mb: 4, pb: 2, borderBottom: 1, borderColor: "divider" }}>
                      <Typography variant="h3" color="primary.main" sx={{ fontWeight: 600 }}>
                        {group.provider}
                      </Typography>
                    </Box>

                    {/* Trophy Display Grid */}
                    <Grid container spacing={3}>
                      {group.items.map((item) => (
                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.name}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              textAlign: "center",
                              p: 3,
                              height: 1,
                              border: 1,
                              borderColor: "divider",
                              borderRadius: 2,
                              bgcolor: "background.paper",
                              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              "&:hover": {
                                borderColor: "secondary.main",
                                "& .cert-logo-container": {
                                  borderColor: "secondary.main",
                                  transform: "scale(1.08)",
                                },
                                "& .cert-name": {
                                  color: "primary.main"
                                }
                              }
                            }}
                          >
                            {/* Large Trophy Logo container */}
                            <Box
                              className="cert-logo-container"
                              sx={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                border: "2px solid",
                                borderColor: "divider",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "white",
                                p: 1.5,
                                mb: 2,
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              }}
                            >
                              <Box component="img" src={item.logo} alt="" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            </Box>

                            <Typography 
                              className="cert-name"
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                lineHeight: 1.4,
                                transition: "color 0.3s ease",
                                maxWidth: 150
                              }}
                            >
                              {item.name}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </StaggerItem>
              </Grid>
            ))}
          </Grid>
        </StaggerGroup>
      </Stack>
    </Section>
  );
}

function SmoothSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Extremely subtle continuous vertical shift for that floaty, premium feel
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 1.2, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}

function BackgroundReveal() {
  const ready = usePreloaderReady();

  return (
    <Box
      className="background-reveal-container"
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Background Image */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={ready ? { scale: 1, opacity: 1 } : { scale: 1.1, opacity: 0 }}
        transition={{
          duration: 1.8,
          ease: EASE_OUT_EXPO, // easeOutExpo
          delay: 0.1,
        }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/images/AboutPageHero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 1,
        }}
      />

      {/* White Curtain (reveals first) */}
      <motion.div
        initial={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
        animate={ready ? { clipPath: "polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)" } : {}}
        transition={{
          duration: 1.6,
          ease: EASE_IN_OUT_QUART, // Custom cubic-bezier for curtain reveal
          delay: 0.1,
        }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#FFFFFF", // Default background color instead of primary
          zIndex: 4,
        }}
      />

      {/* Gold Curtain (reveals second, creating a trailing border effect) */}
      <motion.div
        initial={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
        animate={ready ? { clipPath: "polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)" } : {}}
        transition={{
          duration: 1.6,
          ease: EASE_IN_OUT_QUART,
          delay: 0.22, // Lagged behind Navy
        }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#FFC72C", // Phitopolis Gold
          zIndex: 3,
        }}
      />

      {/* Static Overlay for typography legibility (dark navy for white text contrast) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(10, 42, 102, 0.8) 0%, rgba(10, 42, 102, 0.55) 50%, rgba(10, 42, 102, 0.3) 100%)",
          zIndex: 1.5,
        }}
      />
    </Box>
  );
}

function AboutPage() {
  const timelineAnchorRef = useNavbarAnchor("timeline", { dark: true });

  return (
    <Box sx={{ pt: 0, pb: { xs: 12, md: 16 }, display: "flex", flexDirection: "column", gap: { xs: 8, md: 20 } }}>
      <SmoothSection>
        <Box sx={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }}>
          <BackgroundReveal />
          <Box
            sx={{
              position: "absolute",
              left: { xs: 40, sm: 100, md: 280 },
              bottom: { xs: 24, sm: 40, md: 64 },
              zIndex: 2,
              p: 0,
              maxWidth: { xs: "calc(100% - 80px)", sm: 500, md: 720 },
            }}
          >
            <Reveal>
              <Stack spacing={2.5}>
                <Typography variant="overline" sx={{ color: "secondary.main", fontWeight: 700, letterSpacing: "0.15em" }}>
                  {CONTENT.about.overline}
                </Typography>
                <Typography variant="h2" component="h1" sx={{ fontWeight: 800, color: "common.white" }}>
                  {CONTENT.about.heading}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: "rgba(255, 255, 255, 0.85)" }}>
                  {CONTENT.about.lead}
                </Typography>
              </Stack>
            </Reveal>
          </Box>
        </Box>
      </SmoothSection>

      <SmoothSection>
        <PoweredBySection />
      </SmoothSection>
      
      <SmoothSection>
        <PrinciplesSection />
      </SmoothSection>
      
      <SmoothSection>
        <CultureSection />
      </SmoothSection>
      
      <SmoothSection>
        <Box ref={timelineAnchorRef}>
          <JourneyTimeline />
        </Box>
      </SmoothSection>
      
      <SmoothSection>
        <ImpactSection />
      </SmoothSection>
      
      <SmoothSection>
        <TalentSection />
      </SmoothSection>
      
      <SmoothSection>
        <CertificationsSection />
      </SmoothSection>
    </Box>
  );
}

// ── Tech Stack / Powered By Section ──

const TECH_SLUGS: Record<string, string> = {
  "Anthropic Claude": "anthropic",
  LangChain: "langchain",
  "Hugging Face": "huggingface",
  PyTorch: "pytorch",
  TensorFlow: "tensorflow",
  Ollama: "ollama",
  CrewAI: "crewai",
  MLflow: "mlflow",
  "Weights & Biases": "weightsandbiases",
  "scikit-learn": "scikitlearn",
  Python: "python",
  FastAPI: "fastapi",
  "Node.js": "nodedotjs",
  React: "react",
  TypeScript: "typescript",
  "Next.js": "nextdotjs",
  GraphQL: "graphql",
  Celery: "celery",
  Docker: "docker",
  Kubernetes: "kubernetes",
  Terraform: "terraform",
  GCP: "googlecloud",
  Nginx: "nginx",
  Prometheus: "prometheus",
  Grafana: "grafana",
  PostgreSQL: "postgresql",
  Redis: "redis",
  MongoDB: "mongodb",
  Kafka: "apachekafka",
  Snowflake: "snowflake",
  "Apache Spark": "apachespark",
  Airflow: "apacheairflow",
  Go: "go",
  Rust: "rust",
  Java: "openjdk",
  "Vue.js": "vuedotjs",
  Angular: "angular",
  Svelte: "svelte",
  Django: "django",
  "Spring Boot": "springboot",
  Flutter: "flutter",
  Laravel: "laravel",
  ".NET": "dotnet",
  AWS: "amazonaws",
  Azure: "microsoftazure",
  "GitHub Actions": "githubactions",
  Ansible: "ansible",
  Elasticsearch: "elasticsearch",
  Cassandra: "apachecassandra",
  ClickHouse: "clickhouse",
  dbt: "dbt",
  RabbitMQ: "rabbitmq",
  Supabase: "supabase",
  Firebase: "firebase",
  DynamoDB: "amazondynamodb",
  OpenAI: "openai",
  Jupyter: "jupyter",
  ONNX: "onnx",
  Pandas: "pandas",
  NumPy: "numpy",
  Polars: "polars",
  Gemini: "googlegemini",
  JavaScript: "javascript",
  "Express.js": "express",
  "React Native": "react",
  Swift: "swift",
  Kotlin: "kotlin",
  Vite: "vite",
  NestJS: "nestjs",
  "Tailwind CSS": "tailwindcss",
  Datadog: "datadog",
  Helm: "helm",
  Sentry: "sentry",
  MySQL: "mysql",
  Neo4j: "neo4j",
  BigQuery: "googlebigquery"
};

const ROW1_TECHS = [
  { name: "Anthropic Claude", cat: "ai" },
  { name: "Docker", cat: "infra" },
  { name: "PostgreSQL", cat: "data" },
  { name: "JavaScript", cat: "dev" },
  { name: "LangChain", cat: "ai" },
  { name: "Kubernetes", cat: "infra" },
  { name: "Redis", cat: "data" },
  { name: "Express.js", cat: "dev" },
  { name: "Hugging Face", cat: "ai" },
  { name: "Terraform", cat: "infra" },
  { name: "MongoDB", cat: "data" },
  { name: "Vue.js", cat: "dev" },
  { name: "PyTorch", cat: "ai" },
  { name: "GCP", cat: "infra" },
  { name: "Kafka", cat: "data" },
  { name: "Angular", cat: "dev" },
  { name: "TensorFlow", cat: "ai" },
  { name: "Nginx", cat: "infra" },
  { name: "Snowflake", cat: "data" },
  { name: "Svelte", cat: "dev" },
  { name: "Gemini", cat: "ai" },
  { name: "Django", cat: "dev" },
  { name: "Prometheus", cat: "infra" },
  { name: "Apache Spark", cat: "data" },
  { name: "Laravel", cat: "dev" }
];

const ROW2_TECHS = [
  { name: "Ollama", cat: "ai" },
  { name: "AWS", cat: "infra" },
  { name: "Airflow", cat: "data" },
  { name: "Python", cat: "dev" },
  { name: "CrewAI", cat: "ai" },
  { name: "Azure", cat: "infra" },
  { name: "Elasticsearch", cat: "data" },
  { name: "FastAPI", cat: "dev" },
  { name: "MLflow", cat: "ai" },
  { name: "GitHub Actions", cat: "infra" },
  { name: "Cassandra", cat: "data" },
  { name: "Node.js", cat: "dev" },
  { name: "Weights & Biases", cat: "ai" },
  { name: "Ansible", cat: "infra" },
  { name: "ClickHouse", cat: "data" },
  { name: "React", cat: "dev" },
  { name: "OpenAI", cat: "ai" },
  { name: "Grafana", cat: "infra" },
  { name: "dbt", cat: "data" },
  { name: "TypeScript", cat: "dev" },
  { name: "Datadog", cat: "infra" },
  { name: "RabbitMQ", cat: "data" },
  { name: "Celery", cat: "dev" },
  { name: "Spring Boot", cat: "dev" },
  { name: ".NET", cat: "dev" }
];

const ROW3_TECHS = [
  { name: "Jupyter", cat: "ai" },
  { name: "Helm", cat: "infra" },
  { name: "Supabase", cat: "data" },
  { name: "Next.js", cat: "dev" },
  { name: "ONNX", cat: "ai" },
  { name: "Sentry", cat: "infra" },
  { name: "Firebase", cat: "data" },
  { name: "GraphQL", cat: "dev" },
  { name: "Pandas", cat: "ai" },
  { name: "Polars", cat: "data" },
  { name: "DynamoDB", cat: "data" },
  { name: "React Native", cat: "dev" },
  { name: "NumPy", cat: "ai" },
  { name: "MySQL", cat: "data" },
  { name: "Vite", cat: "dev" },
  { name: "scikit-learn", cat: "ai" },
  { name: "Neo4j", cat: "data" },
  { name: "NestJS", cat: "dev" },
  { name: "BigQuery", cat: "data" },
  { name: "Tailwind CSS", cat: "dev" },
  { name: "Go", cat: "dev" },
  { name: "Rust", cat: "dev" },
  { name: "Java", cat: "dev" },
  { name: "Swift", cat: "dev" },
  { name: "Kotlin", cat: "dev" },
  { name: "Flutter", cat: "dev" }
];

const TECH_CAT_COLORS: Record<string, string> = {
  ai: "#FFC72C",
  dev: "#A78BFA",
  infra: "#60A5FA",
  data: "#34D399"
};

const LOCAL_TECHS: Record<string, string> = {
  "AWS": "/logos/tech/aws.svg",
  "Azure": "/logos/tech/azure.svg",
  "dbt": "/logos/tech/dbt.svg",
  "DynamoDB": "/logos/tech/dynamodb.svg",
  "OpenAI": "/logos/tech/openai.svg"
};

const TechCard = React.memo(({ tech, activeCat }: { tech: { name: string; cat: string }; activeCat: string | null }) => {
  const localPath = LOCAL_TECHS[tech.name];
  const slug = TECH_SLUGS[tech.name];
  const [imageValid, setImageValid] = useState(true);
  const isFiltered = activeCat !== null && tech.cat !== activeCat;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2.5,
        flexShrink: 0,
        px: 6,
        opacity: isFiltered ? 0.12 : 1,
        filter: isFiltered ? "grayscale(1)" : "none",
        transition: "opacity 0.35s ease, filter 0.35s ease"
      }}
    >
      {localPath ? (
        <Box
          component="img"
          src={localPath}
          alt={tech.name}
          sx={{
            width: 52,
            height: 52,
            flexShrink: 0,
            objectFit: "contain",
            opacity: 0.85
          }}
        />
      ) : slug && imageValid ? (
        <Box
          component="img"
          src={`https://cdn.simpleicons.org/${slug}`}
          alt={tech.name}
          onError={() => setImageValid(false)}
          sx={{
            width: 52,
            height: 52,
            flexShrink: 0,
            objectFit: "contain",
            opacity: 0.85
          }}
        />
      ) : (
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 1.5,
            flexShrink: 0,
            bgcolor: TECH_CAT_COLORS[tech.cat] || "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1,
              fontFamily: MONO
            }}
          >
            {tech.name[0]}
          </Typography>
        </Box>
      )}
      <Typography
        sx={{
          fontFamily: MONO,
          fontWeight: 600,
          fontSize: "1.75rem",
          color: "primary.main",
          letterSpacing: "-0.02em",
          whiteSpace: "nowrap"
        }}
      >
        {tech.name}
      </Typography>
    </Box>
  );
});

TechCard.displayName = "TechCard";

function TechMarqueeRow({ items, basePPS = 55, reverse = false, activeCat }: { items: typeof ROW1_TECHS; basePPS?: number; reverse?: boolean; activeCat: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothedVelocity = useSpring(scrollVelocity, { damping: 40, stiffness: 300 });

  const doubledItems = [...items, ...items];

  useAnimationFrame((_, delta) => {
    if (!containerRef.current) return;
    const speedMultiplier = 1 + Math.abs(smoothedVelocity.get()) / 800;
    const step = (basePPS * speedMultiplier * delta) / 1000 * (reverse ? -1 : 1);
    offsetRef.current += step;

    const halfWidth = containerRef.current.scrollWidth / 2;
    if (offsetRef.current > halfWidth) {
      offsetRef.current -= halfWidth;
    }
    if (offsetRef.current < 0) {
      offsetRef.current += halfWidth;
    }
    containerRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
  });

  return (
    <Box sx={{ overflow: "hidden", py: 1 }}>
      <Box
        ref={containerRef}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          willChange: "transform",
          pr: 1.25
        }}
      >
        {doubledItems.map((tech, idx) => (
          <TechCard key={`${tech.name}-${String(idx)}`} tech={tech} activeCat={activeCat} />
        ))}
      </Box>
    </Box>
  );
}

function PoweredBySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-60px" });
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const categories = {
    "AI / ML": "ai",
    "Languages & Frameworks": "dev",
    "Cloud & Infra": "infra",
    "Data & Storage": "data"
  };

  return (
    <Box
      ref={sectionRef}
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        py: { xs: 8, md: 12 },
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
      }}
    >
      <Box sx={{ px: { xs: 3, md: 5 }, mb: 8 }}>
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "flex-end" }}
            justifyContent="space-between"
            spacing={3}
          >
            <Stack spacing={1.5}>
              <MetaLabel>Tech Stack</MetaLabel>
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: "clamp(2.8rem, 5vw, 5rem)",
                  textTransform: "lowercase",
                  color: "primary.main",
                  lineHeight: 1
                }}
              >
                powered by
              </Typography>
            </Stack>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.45, duration: 0.65 }}
              style={{
                color: "text.secondary",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.9rem",
                lineHeight: 1.75,
                maxWidth: 420
              }}
            >
              the full arsenal — from model training and orchestration to deployment, data pipelines, and cloud infrastructure. Every tool chosen deliberately, every stack decision backed by real production experience.
            </motion.p>
          </Stack>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              mt: 5,
              flexWrap: "wrap",
              opacity: inView ? 1 : 0,
              transition: "opacity 0.5s ease 0.6s"
            }}
          >
            {Object.entries(categories).map(([label, slug]) => {
              const isActive = activeCat === slug;
              const activeColor = TECH_CAT_COLORS[slug];
              const isDataStorage = slug === "data";
              return (
                <Box
                  component="button"
                  key={slug}
                  onClick={() => setActiveCat((c) => (c === slug ? null : slug))}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    p: "4px 0",
                    outline: "none"
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: isActive ? activeColor : activeCat ? "rgba(0,0,0,0.2)" : activeColor,
                      transition: "background-color 0.3s"
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 11,
                      color: isActive ? activeColor : activeCat ? "rgba(0,0,0,0.3)" : "text.secondary",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      fontWeight: isActive ? 700 : 500,
                      transition: "color 0.3s",
                      display: "flex",
                      alignItems: "center",
                      gap: 1
                    }}
                  >
                    {label}
                    {isDataStorage && !activeCat && (
                      <Box
                        component="span"
                        sx={{
                          fontFamily: MONO,
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          textTransform: "lowercase",
                          opacity: 0.15,
                          color: "primary.main"
                        }}
                      >
                        (click me)
                      </Box>
                    )}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <TechMarqueeRow items={ROW1_TECHS} basePPS={28} activeCat={activeCat} />
        <TechMarqueeRow items={ROW2_TECHS} basePPS={22} reverse activeCat={activeCat} />
        <TechMarqueeRow items={ROW3_TECHS} basePPS={34} activeCat={activeCat} />
      </Box>
    </Box>
  );
}
