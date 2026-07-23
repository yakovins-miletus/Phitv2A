import { CONTENT } from "@/shared/content";

import type { BlogPostPage } from "./api";

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

const FALLBACK_DATES = [
  "2026-07-17",
  "2026-05-21",
  "2026-05-12",
  "2026-04-14",
  "2026-04-07",
  "2026-04-01",
  "2026-03-27",
  "2026-02-18",
  "2026-02-06",
];

/** Static fallback derived from the site's insight teasers, so the Blog
 *  always renders real content — live posts when the API is reachable,
 *  these teasers when it is not. Never a frozen spinner. */
export const FALLBACK_BLOG_PAGE: BlogPostPage = {
  items: CONTENT.blog.map((post, index) => ({
    id: `fallback-${String(index)}`,
    slug: slugify(post.title),
    title: post.title,
    category: post.category,
    excerpt: post.blurb,
    image_url: null,
    author: null,
    published_on: FALLBACK_DATES[index] ?? "2026-01-01",
    featured: index === 0,
  })),
  total: CONTENT.blog.length,
  // Mirrors the route's PAGE_SIZE so the fallback's pagination math matches.
  limit: 9,
  offset: 0,
};
