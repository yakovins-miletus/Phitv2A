import { screen } from "@testing-library/react";

import type { BlogPost } from "@/features/blog/api";
import { BlogPostArticle } from "@/features/blog/components/BlogPostArticle";

import { renderWithProviders } from "./test-utils";

const BASE_POST: BlogPost = {
  id: "1",
  slug: "csr-day",
  title: "CSR Day",
  category: "Community & CSR",
  excerpt: "A day with the kids.",
  body: "Intro paragraph.\n\n/images/blog/csr-day/01.png\n\nOutro paragraph.",
  image_url: null,
  author: null,
  published_on: "2026-07-17",
  featured: false,
};

test("image paragraphs render as images, not text", () => {
  renderWithProviders(<BlogPostArticle post={BASE_POST} />);

  const images = screen.getAllByRole("presentation");
  expect(images.some((img) => img.getAttribute("src") === "/images/blog/csr-day/01.png")).toBe(
    true,
  );
  expect(screen.queryByText("/images/blog/csr-day/01.png")).not.toBeInTheDocument();
  expect(screen.getByText("Intro paragraph.")).toBeInTheDocument();
});

test("a plain URL or markup in the body stays literal text", () => {
  renderWithProviders(
    <BlogPostArticle
      post={{
        ...BASE_POST,
        body: "https://example.com/page\n\n<script>alert(1)</script>",
      }}
    />,
  );

  expect(screen.getByText("https://example.com/page")).toBeInTheDocument();
  expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
  expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
});

test("byline shows when the post has an author and hides when it does not", () => {
  const { unmount } = renderWithProviders(
    <BlogPostArticle post={{ ...BASE_POST, author: "Derven Gonzales" }} />,
  );
  expect(screen.getByText(/By Derven Gonzales/)).toBeInTheDocument();
  unmount();

  renderWithProviders(<BlogPostArticle post={BASE_POST} />);
  expect(screen.queryByText(/By /)).not.toBeInTheDocument();
});
