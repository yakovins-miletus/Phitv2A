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

const FALLBACK_INNOVATION_DATA = [
  { title: "Alpha Generation with LLMs", category: "Data Science", excerpt: "Using large language models for financial insights." },
  { title: "Distributed Order Matching Engine", category: "Software Engineering", excerpt: "Building a scalable order matching system." },
  { title: "Zero-Trust Infrastructure", category: "DevOps", excerpt: "Securing internal networks with zero-trust principles." },
];

const FALLBACK_DATES = [
  "2026-07-17",
  "2026-05-21",
  "2026-05-12",
];

export const FALLBACK_INNOVATION_PAGE: InnovationPostPage = {
  items: FALLBACK_INNOVATION_DATA.map((post, index) => ({
    id: `fallback-${String(index)}`,
    slug: slugify(post.title),
    title: post.title,
    category: post.category,
    excerpt: post.excerpt,
    image_url: null,
    author: null,
    published_on: FALLBACK_DATES[index] ?? "2026-01-01",
    featured: index === 0,
  })),
  total: FALLBACK_INNOVATION_DATA.length,
  limit: 10,
  offset: 0,
};
