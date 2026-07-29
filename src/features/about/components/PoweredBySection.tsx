import React, { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  motion,
  useAnimationFrame,
  useInView,
  useScroll,
  useSpring,
  useVelocity,
} from "motion/react";

import { FONT, MONO } from "@/shared/theme/theme";

import { MetaLabel } from "./MetaLabel";

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

export function PoweredBySection() {
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