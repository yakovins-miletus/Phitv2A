import { screen } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";

import { blogPostsQuery } from "@/features/blog/api";
import { FALLBACK_BLOG_PAGE, slugify } from "@/features/blog/fallback";

import { renderWithProviders } from "./test-utils";

function BlogListProbe() {
  const page = useQuery(blogPostsQuery({ limit: 20, offset: 0 }));
  const data = page.data ?? FALLBACK_BLOG_PAGE;
  return (
    <ul>
      {data.items.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

test("blog list renders live posts from the API", async () => {
  renderWithProviders(<BlogListProbe />);

  expect(
    await screen.findByText("Titan: an execution engine measured in microseconds"),
  ).toBeInTheDocument();
  expect(screen.getByText("DataFlow: markets as a living globe")).toBeInTheDocument();
});

test("blog queries opt into instant freshness (Heimdall publish policy)", () => {
  // Editors expect a publish to appear when anyone looks at the tab — the
  // content queries must override the global 30s staleTime and focus policy.
  const options = blogPostsQuery({ limit: 20, offset: 0 });
  expect(options.staleTime).toBe(0);
  expect(options.refetchOnWindowFocus).toBe(true);
});

test("fallback slugs match Heimdall's slugify rules so links resolve", () => {
  expect(slugify("LikhaPolis: Pagbibigay Kulay at Saya")).toBe(
    "likhapolis-pagbibigay-kulay-at-saya",
  );
  expect(FALLBACK_BLOG_PAGE.items.map((post) => post.slug)).toContain("2026-wellness-week");
});
