import { describe, expect, it } from "vitest";

import { resolveRouteManifest } from "@/shared/components/AppShell";

describe("resolveRouteManifest — route-aware warm-up manifest", () => {
  it("home landing warms the hero logo (blocking) + the ServiceGlobe chunk", () => {
    const m = resolveRouteManifest("/");
    expect(m.blocking).toContain("/phitopolis_logo_hero.svg");
    expect(m.warmGlobe).toBe(true);
    // The one below-fold raster on `/`: OperatingPillars' three backgrounds,
    // warmed in the background so they never extend the intro.
    expect(m.background).toEqual([
      "/images/pillars/research.webp",
      "/images/pillars/development.webp",
      "/images/pillars/support.webp",
    ]);
    expect(m.blocking).not.toEqual(expect.arrayContaining(["/images/pillars/research.webp"]));
  });

  it("home blocking tier stays tiny (preloaded in full, so it must be cheap)", () => {
    expect(resolveRouteManifest("/").blocking).toHaveLength(1);
  });

  it("about landing warms its hero background + primary photo + first strip tiles", () => {
    const m = resolveRouteManifest("/about");
    expect(m.blocking).toContain("/images/about-hero-bg.webp");
    expect(m.blocking).toContain("/images/AboutPage1.webp");
    expect(m.blocking.length).toBeGreaterThanOrEqual(3);
    expect(m.background.length).toBeGreaterThan(0);
    // The three.js globe is a home-only scene.
    expect(m.warmGlobe).toBe(false);
  });

  it("does not warm home hero imagery when /blog is the landing route", () => {
    const m = resolveRouteManifest("/blog");
    expect(m.blocking).toEqual([]);
    expect(m.warmGlobe).toBe(false);
    expect([...m.blocking, ...m.background]).not.toContain("/phitopolis_logo_hero.svg");
  });

  it("warms each route's hero video loop in the background tier only", () => {
    for (const [path, stem] of [
      ["/blog", "blog"],
      ["/careers", "careers"],
      ["/services", "services"],
      ["/blog/", "blog"],
      ["/careers/", "careers"],
    ] as const) {
      const m = resolveRouteManifest(path);
      expect(m.blocking).toEqual([]);
      expect(m.background).toContain(`/videos/daily-life-${stem}-loop.webm`);
      expect(m.background).toContain(`/videos/daily-life-${stem}-loop.mp4`);
    }
    // A video loop is never a reveal-gating asset on any route.
    for (const path of ["/", "/about", "/blog", "/careers", "/services", "/contact"]) {
      expect(resolveRouteManifest(path).blocking.some((u) => u.endsWith(".mp4") || u.endsWith(".webm"))).toBe(
        false,
      );
    }
  });

  it("never blocks on OperatingPillars imagery, and never lists the retired split-pane hero", () => {
    for (const path of ["/", "/about", "/services", "/contact"]) {
      const m = resolveRouteManifest(path);
      // Pillars imagery may be background-warmed on `/`, but must never gate a reveal.
      expect(m.blocking.some((u) => u.startsWith("/images/pillars/"))).toBe(false);
      const all = [...m.blocking, ...m.background];
      expect(all).not.toContain("/images/topHalfHero.webp");
      expect(all).not.toContain("/images/botHalfHero.webp");
    }
    // Pillars are only warmed on the home landing.
    for (const path of ["/about", "/services", "/contact"]) {
      const all = [
        ...resolveRouteManifest(path).blocking,
        ...resolveRouteManifest(path).background,
      ];
      expect(all.some((u) => u.startsWith("/images/pillars/"))).toBe(false);
    }
  });
});
