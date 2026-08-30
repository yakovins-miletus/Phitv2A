import { describe, expect, it } from "vitest";

import { resolveRouteManifest } from "@/shared/components/AppShell";

describe("resolveRouteManifest — route-aware warm-up manifest", () => {
  it("home landing warms the hero logo (blocking) + the ServiceGlobe chunk", () => {
    const m = resolveRouteManifest("/");
    expect(m.blocking).toContain("/phitopolis_logo_hero.svg");
    expect(m.warmGlobe).toBe(true);
    // Home below-fold is canvas / SVG / CSS — no raster imagery to warm.
    expect(m.background).toEqual([]);
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
    expect(m.background).toEqual([]);
    expect(m.warmGlobe).toBe(false);
    expect([...m.blocking, ...m.background]).not.toContain("/phitopolis_logo_hero.svg");
  });

  it("never lists the non-existent OperatingPillars imagery or the retired split-pane hero", () => {
    for (const path of ["/", "/about", "/services", "/contact"]) {
      const all = [...resolveRouteManifest(path).blocking, ...resolveRouteManifest(path).background];
      expect(all.some((u) => u.startsWith("/images/pillars/"))).toBe(false);
      expect(all).not.toContain("/images/topHalfHero.webp");
      expect(all).not.toContain("/images/botHalfHero.webp");
    }
  });
});
