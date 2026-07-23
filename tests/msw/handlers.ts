import { HttpResponse, http } from "msw";

import type { components } from "@/shared/api/schema";

type Schemas = components["schemas"];

export const servicesFixture: Schemas["ServiceOut"][] = [
  {
    id: "1",
    slug: "development",
    name: "Development",
    tagline: "Systems leveraging data science, machine learning and big data.",
    description: "C++, Python and MERN systems on public and private cloud.",
    icon: "hub",
    highlights: ["C++/Python/MERN in production", "AWS cloud", "Global clients"],
    display_order: 1,
  },
  {
    id: "2",
    slug: "research",
    name: "Research",
    tagline: "Statistics, machine learning, and AI against large, noisy data.",
    description: "Modeling large, noisy, and complex data sets.",
    icon: "query_stats",
    highlights: ["Statistical modeling", "Reproducible methodology", "Deployable findings"],
    display_order: 2,
  },
];

export const contactCreatedFixture: Schemas["ContactMessageOut"] = {
  id: "41",
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Partnership question",
  message: "We would like to explore a research partnership with your lab.",
  created_at: "2026-06-30T12:00:00Z",
};

export const blogPostFixture: Schemas["BlogPostOut"] = {
  id: "1",
  slug: "titan-an-execution-engine-measured-in-microseconds",
  title: "Titan: an execution engine measured in microseconds",
  category: "Engineering",
  excerpt: "How we built an order router that drinks millions of market ticks per second.",
  body: "Titan is our execution engine.\n\nBuilt in C++ with low-latency discipline.",
  image_url: null,
  author: null,
  published_on: "2026-07-01",
  featured: true,
};

export const blogPageFixture: Schemas["BlogPostPage"] = {
  items: [
    {
      id: blogPostFixture.id,
      slug: blogPostFixture.slug,
      title: blogPostFixture.title,
      category: blogPostFixture.category,
      excerpt: blogPostFixture.excerpt,
      image_url: blogPostFixture.image_url,
      author: blogPostFixture.author,
      published_on: blogPostFixture.published_on,
      featured: blogPostFixture.featured,
    },
    {
      id: "2",
      slug: "dataflow-markets-as-a-living-globe",
      title: "DataFlow: markets as a living globe",
      category: "Design",
      excerpt: "WebGL storytelling for global liquidity.",
      image_url: null,
      author: null,
      published_on: "2026-04-22",
      featured: false,
    },
  ],
  total: 2,
  limit: 20,
  offset: 0,
};

export const handlers = [
  http.get("*/api/v1/services", () => HttpResponse.json(servicesFixture)),
  http.post("*/api/v1/contact-messages", () =>
    HttpResponse.json(contactCreatedFixture, { status: 201 }),
  ),
  http.get("*/api/v1/blog-posts", () => HttpResponse.json(blogPageFixture)),
  http.get("*/api/v1/blog-posts/:slug", () => HttpResponse.json(blogPostFixture)),
];
