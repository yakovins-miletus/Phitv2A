import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import Typography from "@mui/material/Typography";

import { servicesQuery } from "@/features/services/api";
import type { Service } from "@/features/services/api";
import { DetailedServiceList } from "@/features/services/components/DetailedServiceList";
import { ServicesHeroHeader } from "@/features/services/components/ServicesHeroHeader";
import { TechStackSection } from "@/features/services/components/TechStackSection";
import { Section } from "@/shared/components/Section";
import { pageHead } from "@/shared/seo";

const FALLBACK_SERVICES: Service[] = [
  {
    id: "development",
    slug: "full-stack-development",
    name: "Software Development",
    tagline: "Cloud-native platforms built for reliability and scale",
    description:
      "We architect secure web platforms using modern stacks, engineered for enterprise reliability and high availability - enabling teams to visualize complex data and manage operations in real time.",
    icon: "hub",
    highlights: ["TypeScript", "React", "GraphQL", "Docker", "AWS", "CI/CD"],
    display_order: 1,
    sub_teams: [
      { name: "Platform Team", description: "Architects the core microservices and APIs powering web platforms" },
      { name: "Web Apps", description: "Builds responsive, high-performance user interfaces for real-time data management" },
      { name: "Infra", description: "Designs and maintains containerized cloud environments for high availability" },
      { name: "HPC", description: "Engineers high-performance computing clusters for fast data processing and execution" }
    ]
  },
  {
    id: "quant-research",
    slug: "quantitative-research",
    name: "Quantitative Research",
    tagline: "Data science and statistical modeling",
    description:
      "Our team turns raw, complex data into clear insights. We build data pipelines and machine learning models that analyze historical trends and real-time inputs with statistical precision.",
    icon: "query_stats",
    highlights: ["Python", "Machine Learning", "Deep Learning", "Statistics"],
    display_order: 2,
    sub_teams: [
      { name: "Alpha Research", description: "Discovers and tests predictive models from complex datasets" },
      { name: "Portfolio Optimization", description: "Develops algorithms to maximize efficiency and risk-adjusted outcomes" },
      { name: "Risk Modeling", description: "Builds models to forecast operational and system volatility" },
      { name: "Alternative Data", description: "Extracts actionable insights from unstructured datasets and external feeds" }
    ]
  },
  {
    id: "data-science",
    slug: "data-science",
    name: "Data Science",
    tagline: "Pipelines and data storage engineered for analytics",
    description:
      "We design automated ETL pipelines and data storage solutions with validation at every step, ensuring all downstream applications receive clean, reliable data.",
    icon: "model_training",
    highlights: ["Python", "AWS", "ETL", "Postgres", "NoSQL", "Docker"],
    display_order: 3,
    sub_teams: [
      { name: "Data Engineering", description: "Constructs the pipelines and architectures that ingest and process large datasets" },
      { name: "ML Ops", description: "Deploys, monitors, and maintains machine learning models in production environments" },
      { name: "Analytics", description: "Transforms complex datasets into intuitive dashboards and actionable business intelligence" },
      { name: "Core Data", description: "Manages central data warehouses and ensures strict governance and data quality" }
    ]
  },
  {
    id: "support",
    slug: "ops-support",
    name: "Ops Support",
    tagline: "24/7 global operational continuity and site reliability",
    description:
      "Our global engineering teams monitor and support cloud platforms, data pipelines, and core infrastructure around the clock, proactively resolving issues to ensure continuous uptime.",
    icon: "science",
    highlights: ["Linux", "Prometheus", "Grafana", "AWS / GCP / Azure"],
    display_order: 4,
    sub_teams: [
      { name: "Site Reliability (SRE)", description: "Ensures maximum uptime and performance through automated recovery and monitoring" },
      { name: "Trade Ops", description: "Provides round-the-clock support for live trading systems and market connectivity" },
      { name: "Security", description: "Implements stringent security protocols to defend against cyber threats and ensure compliance" },
      { name: "Global Support", description: "Delivers immediate 24/7 technical operations and site reliability assistance to global infrastructure" }
    ]
  },
];

export const Route = createFileRoute("/services")({
  head: () =>
    pageHead(
      "Services · Phitopolis",
      "Full-stack development, quantitative research, data science, and 24/7 global operational continuity - engineering built for financial technology at petabyte scale.",
    ),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(servicesQuery()).catch(() => undefined);
  },
  component: ServicesPage,
});

function matchCategory(service: Service, categoryId: string): boolean {
  if (categoryId === "all") return true;
  const target = categoryId.toLowerCase();
  const idStr = String(service.id).toLowerCase();
  const slugStr = (service.slug || "").toLowerCase();
  const nameStr = (service.name || "").toLowerCase();

  return (
    idStr === target ||
    idStr.includes(target) ||
    slugStr.includes(target) ||
    nameStr.includes(target)
  );
}

function ServicesPage() {
  const services = useQuery(servicesQuery());
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Genuinely empty case: successful response with zero services published.
  if (services.isSuccess && services.data.length === 0) {
    return (
      <Section>
        <ServicesHeroHeader
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <Typography variant="body1" color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
          No services are currently published.
        </Typography>
        <TechStackSection />
      </Section>
    );
  }

  const list = services.data ?? FALLBACK_SERVICES;
  const filtered = list.filter((s) => matchCategory(s, selectedCategory));
  const showEmptyState = filtered.length === 0;

  return (
    <Section>
      <ServicesHeroHeader
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      {showEmptyState ? (
        <Typography variant="body1" color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
          No services match this category.
        </Typography>
      ) : (
        <DetailedServiceList services={filtered} />
      )}
      <TechStackSection />
    </Section>
  );
}
