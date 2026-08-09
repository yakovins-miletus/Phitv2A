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

  // The stored body says `.png`; the renderer serves the `.webp` twin. Every blog
  // raster in public/ has one, and `preferWebp` explains why the swap happens here
  // rather than as a content migration in Heimdall's post bodies. An onError on the
  // <img> falls back to the stored path if a twin is ever missing.
  const images = screen.getAllByRole("presentation");
  expect(images.some((img) => img.getAttribute("src") === "/images/blog/csr-day/01.webp")).toBe(
    true,
  );
  expect(screen.queryByText("/images/blog/csr-day/01.png")).not.toBeInTheDocument();
  expect(screen.getByText("Intro paragraph.")).toBeInTheDocument();
});

test("an https image paragraph is served as stored, never retargeted", () => {
  // `preferWebp` only rewrites site-relative `/images/` paths. An absolute URL points
  // at a host whose files we do not control, so guessing a `.webp` twin there would
  // 404 on someone else's server.
  renderWithProviders(
    <BlogPostArticle
      post={{ ...BASE_POST, body: "Intro.\n\nhttps://cdn.example.com/photo.jpg\n\nOutro." }}
    />,
  );
  const images = screen.getAllByRole("presentation");
  expect(images.some((img) => img.getAttribute("src") === "https://cdn.example.com/photo.jpg")).toBe(
    true,
  );
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
