import { describe, expect, it } from "vitest";

import { isImageParagraph, resolveImageUrl, safeImageUrl } from "@/shared/bodyImages";

/**
 * ⚠ TWINNED with Heimdall's app/features/content/body_images.py.
 * Both sides must agree; nothing enforces that at build time.
 */
describe("isImageParagraph", () => {
  it("accepts site-relative image paths", () => {
    expect(isImageParagraph("/images/blog/a-slug/01.png")).toBe(true);
    expect(isImageParagraph("/images/blog/a-slug/01.JPG")).toBe(true);
    expect(isImageParagraph("/images/blog/a-slug/01.webp")).toBe(true);
  });

  it("accepts https image URLs", () => {
    expect(isImageParagraph("https://cdn.example.com/a.png")).toBe(true);
  });

  it("rejects javascript: and data: URIs", () => {
    expect(isImageParagraph("javascript:alert(1)//x.png")).toBe(false);
    expect(isImageParagraph("data:image/svg+xml;base64,AAAA.png")).toBe(false);
  });

  it("rejects protocol-relative and plain http URLs", () => {
    expect(isImageParagraph("//evil.example/x.png")).toBe(false);
    expect(isImageParagraph("http://evil.example/x.png")).toBe(false);
  });

  it("rejects svg, which can carry script", () => {
    expect(isImageParagraph("https://evil.example/x.svg")).toBe(false);
  });

  it("rejects a query string smuggled in front of the extension", () => {
    // Regression: `\S+` is greedy, so this matched — the string still *ends* in
    // `.png` and the query rode along. Bound to an <img src> it exfiltrates the
    // visitor's IP, User-Agent and Referer to an attacker-chosen host.
    expect(isImageParagraph("https://evil.example/track?id=victim&x=.png")).toBe(false);
    expect(isImageParagraph("/images/blog/a/01.png?stealthis=1")).toBe(false);
  });

  it("rejects a fragment", () => {
    expect(isImageParagraph("/images/blog/a/01.png#x")).toBe(false);
  });

  it("rejects prose that merely mentions a file", () => {
    expect(isImageParagraph("See the diagram at /images/blog/a/01.png for detail.")).toBe(
      false,
    );
  });
});

describe("safeImageUrl", () => {
  it("passes through a valid CMS image_url", () => {
    expect(safeImageUrl("/images/blog/a-slug/01.png")).toBe("/images/blog/a-slug/01.png");
  });

  it("trims surrounding whitespace", () => {
    expect(safeImageUrl("  /images/blog/a/01.png  ")).toBe("/images/blog/a/01.png");
  });

  it("returns null for null and undefined", () => {
    expect(safeImageUrl(null)).toBeNull();
    expect(safeImageUrl(undefined)).toBeNull();
    expect(safeImageUrl("")).toBeNull();
  });

  it("returns null for a tracking URL disguised as an image", () => {
    expect(safeImageUrl("https://evil.example/px?u=victim&x=.png")).toBeNull();
  });

  it("returns null for a non-image URL", () => {
    expect(safeImageUrl("https://evil.example/payload.svg")).toBeNull();
  });
});

describe("resolveImageUrl", () => {
  it("rewrites a stored .png to its .webp twin", () => {
    // public/images/blog/** holds ONLY .webp — the originals were removed when
    // the migration completed — while Heimdall still stores .png/.jpg paths.
    // Binding image_url straight to <img src> therefore 404s, which is exactly
    // what broke every thumbnail on /blog and the homepage.
    expect(resolveImageUrl("/images/blog/a-slug/01.png")).toEqual({
      src: "/images/blog/a-slug/01.webp",
      fallback: "/images/blog/a-slug/01.png",
    });
  });

  it("rewrites .jpg too", () => {
    expect(resolveImageUrl("/images/blog/a-slug/01.jpg")?.src).toBe(
      "/images/blog/a-slug/01.webp",
    );
  });

  it("keeps a path that is already .webp", () => {
    expect(resolveImageUrl("/images/blog/a-slug/01.webp")?.src).toBe(
      "/images/blog/a-slug/01.webp",
    );
  });

  it("leaves external https URLs alone — we do not control those files", () => {
    expect(resolveImageUrl("https://cdn.example.com/a.png")?.src).toBe(
      "https://cdn.example.com/a.png",
    );
  });

  it("always exposes the original as a fallback for onError", () => {
    const r = resolveImageUrl("/images/blog/a-slug/01.png");
    expect(r?.fallback).toBe("/images/blog/a-slug/01.png");
  });

  it("still rejects everything safeImageUrl rejects", () => {
    expect(resolveImageUrl("https://evil.example/px?u=v&x=.png")).toBeNull();
    expect(resolveImageUrl(null)).toBeNull();
  });
});
