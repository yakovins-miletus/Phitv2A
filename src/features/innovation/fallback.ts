import type { InnovationPostPage } from "./api";

/** Same slug rules as Heimdall's server-side slugify, so fallback links
 *  resolve against live seeded posts once the API is reachable. */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120)
      .replace(/-+$/, "") || "untitled"
  );
}

export interface EmployeePetProject {
  id: string;
  slug: string;
  title: string;
  category: "Quant & AI" | "Systems Engineering" | "Web & Visualization" | "DevOps & Cloud" | "Data Engineering";
  creator: string;
  creatorRole: string;
  excerpt: string;
  description: string;
  stack: string[];
  githubUrl?: string;
  demoUrl?: string;
  image: string;
  published_on: string;
  featured: boolean;
}

export const PET_PROJECTS: EmployeePetProject[] = [
  {
    id: "pet-1",
    slug: slugify("Titan-LLM Financial Signal Mining"),
    title: "Titan-LLM: Financial Signal Mining",
    category: "Quant & AI",
    creator: "Marco V. & Quant Fellows",
    creatorRole: "Quantitative Research Team",
    excerpt: "Pet project utilizing local LLMs to parse quarterly earnings calls into tradeable sentiment signals.",
    description: "Built during our internal R&D Hackathon, Titan-LLM ingests transcript audio and text streams in real time, converting subtle acoustic and textual cues into quantitative alpha signals.",
    stack: ["Python", "PyTorch", "Transformers", "FastAPI", "VectorDB"],
    githubUrl: "https://github.com/phitopolis",
    image: "",
    published_on: "2026-07-20",
    featured: true,
  },
  {
    id: "pet-2",
    slug: slugify("KubeFlow Auto-Scaler for High-Frequency Systems"),
    title: "KubeFlow HFT Auto-Scaler",
    category: "DevOps & Cloud",
    creator: "David K.",
    creatorRole: "Principal SRE Engineer",
    excerpt: "Custom Kubernetes controller predicting market volatility spikes to pre-warm trading pods.",
    description: "Standard HPA is too slow for market tick bursts. David engineered an event-driven predictive autoscaler using eBPF and kernel metrics to warm trading engine pods microsecond before exchange opens.",
    stack: ["Go", "Kubernetes", "eBPF", "Prometheus", "AWS"],
    githubUrl: "https://github.com/phitopolis",
    image: "",
    published_on: "2026-07-15",
    featured: false,
  },
  {
    id: "pet-3",
    slug: slugify("PhitVisual WebGL Market Liquidity Globe"),
    title: "PhitVisual 3D WebGL Globe",
    category: "Web & Visualization",
    creator: "Elena R. & R&D Interns",
    creatorRole: "Full-Stack Web Team",
    excerpt: "Real-time 3D WebGL visualization rendering global order book liquidity across continents.",
    description: "Created by our web team and R&D interns to visualize multi-exchange liquidity flows in 60fps WebGL canvas without main thread blocking.",
    stack: ["Three.js", "TypeScript", "WebGL", "WebSockets", "MUI"],
    githubUrl: "https://github.com/phitopolis",
    image: "",
    published_on: "2026-06-28",
    featured: false,
  },
  {
    id: "pet-4",
    slug: slugify("Rust-FX Microsecond Order Router"),
    title: "Rust-FX: Microsecond Order Engine",
    category: "Systems Engineering",
    creator: "Jonathan T.",
    creatorRole: "Core Systems Engineer",
    excerpt: "Zero-allocation FX order routing kernel written in Rust targeting 12-microsecond tick-to-trade.",
    description: "Jonathan's weekend pet project exploring memory-safe, zero-cost abstractions for lock-free order queue execution across global liquidity venues.",
    stack: ["Rust", "Linux", "SIMD", "Zero-Copy", "DPDK"],
    githubUrl: "https://github.com/phitopolis",
    image: "",
    published_on: "2026-06-10",
    featured: false,
  },
  {
    id: "pet-5",
    slug: slugify("DataGuard Real-Time Anomaly Engine"),
    title: "DataGuard Real-Time Anomaly Engine",
    category: "Data Engineering",
    creator: "Samantha L.",
    creatorRole: "Senior Data Architect",
    excerpt: "Automated stream validation engine flagging corrupted tick data before it reaches ML models.",
    description: "Built to stop bad exchange data feeds from poisoning quantitative backtests, DataGuard validates petabyte-scale tick data on the fly.",
    stack: ["Python", "Apache Kafka", "Polars", "Docker"],
    githubUrl: "https://github.com/phitopolis",
    image: "",
    published_on: "2026-05-24",
    featured: false,
  },
  {
    id: "pet-6",
    slug: slugify("AgentCore Autonomous Code Auditor"),
    title: "AgentCore Autonomous Code Auditor",
    category: "Quant & AI",
    creator: "Grad Program Fellows 2026",
    creatorRole: "Technical Graduate Fellows",
    excerpt: "Multi-agent LLM system auditing C++ memory safety and security vulnerabilities on PR submission.",
    description: "Developed by our 2026 Graduate Program cohort to automatically benchmark pull requests against high-performance C++ guidelines.",
    stack: ["Python", "LangChain", "LLaMA 3", "GitLab CI"],
    githubUrl: "https://github.com/phitopolis",
    image: "",
    published_on: "2026-05-02",
    featured: false,
  },
];

export const FALLBACK_INNOVATION_PAGE: InnovationPostPage = {
  items: PET_PROJECTS.map((project) => ({
    id: project.id,
    slug: project.slug,
    title: project.title,
    category: project.category,
    excerpt: project.excerpt,
    image_url: project.image,
    author: project.creator,
    published_on: project.published_on,
    featured: project.featured,
  })),
  total: PET_PROJECTS.length,
  limit: 10,
  offset: 0,
};
