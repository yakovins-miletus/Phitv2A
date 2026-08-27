/**
 * Shared "powered by" tech-stack data.
 *
 * Single source of truth for the technology list used by
 * `PoweredBySection` (the /about marquee, which loads remote Simple Icons
 * logos) and `HeroWordWall` (the hero's vertical drift columns, which are
 * text-only — see that file's docblock for why no icons are loaded there).
 *
 * Extracted from `src/features/about/components/PoweredBySection.tsx` so
 * both consumers read from one list instead of maintaining duplicates.
 */

export interface TechEntry {
  name: string;
  cat: string;
}

/** Technology name -> Simple Icons slug, for `https://cdn.simpleicons.org/<slug>`. */
export const TECH_SLUGS: Record<string, string> = {
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
  BigQuery: "googlebigquery",
};

export const ROW1_TECHS: TechEntry[] = [
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
  { name: "Laravel", cat: "dev" },
];

export const ROW2_TECHS: TechEntry[] = [
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
  { name: ".NET", cat: "dev" },
];

export const ROW3_TECHS: TechEntry[] = [
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
  { name: "Flutter", cat: "dev" },
];

/** Technologies with local SVG assets (same-origin, already shipped) instead of a CDN fetch. */
export const LOCAL_TECHS: Record<string, string> = {
  AWS: "/logos/tech/aws.svg",
  Azure: "/logos/tech/azure.svg",
  dbt: "/logos/tech/dbt.svg",
  DynamoDB: "/logos/tech/dynamodb.svg",
  OpenAI: "/logos/tech/openai.svg",
};

/**
 * Curated subset for the hero's 3 vertical drift columns — text-only, no
 * icon requests (see HeroWordWall.tsx docblock). Picked to read well as
 * short/medium uppercase words at the wall's drift speed, one flagship name
 * per category (ai/dev/infra/data) plus a few load-bearing infra terms,
 * mirroring the old word wall's mix of proper nouns and short compound
 * terms (e.g. "CLOUD-NATIVE", "MACHINE LEARNING").
 */
export const HERO_TECH_COLUMN_1 = [
  "PYTHON",
  "REACT",
  "TYPESCRIPT",
  "FASTAPI",
  "POSTGRESQL",
  "DOCKER",
  "KUBERNETES",
  "ANTHROPIC CLAUDE",
];

export const HERO_TECH_COLUMN_2 = [
  "AWS",
  "TERRAFORM",
  "KAFKA",
  "REDIS",
  "AIRFLOW",
  "PYTORCH",
  "LANGCHAIN",
  "GRAFANA",
];

export const HERO_TECH_COLUMN_3 = [
  "TENSORFLOW",
  "SNOWFLAKE",
  "GCP",
  "NGINX",
  "MONGODB",
  "APACHE SPARK",
  "GITHUB ACTIONS",
  "PROMETHEUS",
];
