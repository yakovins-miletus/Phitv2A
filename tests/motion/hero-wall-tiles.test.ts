/**
 * The drift wall's tile manifest, pinned.
 *
 * This is the only automated coverage the wall has, and it is deliberately data-only.
 * Nothing in the suite renders the home route under `no-preference` — `tests/setup.ts`
 * defaults `matchMedia` to `prefers-reduced-motion: reduce`, and `heroStage()` returns
 * `gunshot: false` there, so `HeroImageWall` never mounts in jsdom. (Its own
 * `ResizeObserver` is stubbed to a no-op besides, which is why DriftWall guards its
 * copy-count arithmetic against a zero measurement rather than trusting it.)
 *
 * What this catches is the realistic failure: someone edits the list, fat-fingers a
 * path, and the wall silently renders a broken-image tile that nobody notices because
 * it only appears 60% of the way through an eight-viewport scroll.
 */

import { HERO_WALL_TILES } from "@/features/hero/heroWallTiles";

describe("hero drift wall tiles", () => {
  it("carries 25 tiles — five per column at the shipped five-column ceiling", () => {
    expect(HERO_WALL_TILES).toHaveLength(25);
  });

  it("divides evenly by the column ceiling, so no column wraps short", () => {
    // Items are dealt round-robin. A remainder leaves one column with a shorter wrap
    // cycle than the repeat count was solved for, and a gap slides in from its bottom
    // edge. See the copy-count note in DriftWall.tsx.
    expect(HERO_WALL_TILES.length % 5).toBe(0);
  });

  it("has no duplicate images", () => {
    const srcs = HERO_WALL_TILES.map((t) => t.src);
    expect(new Set(srcs).size).toBe(srcs.length);
  });

  it("has unique React keys", () => {
    const ids = HERO_WALL_TILES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("draws only from the CMS blog media library", () => {
    for (const tile of HERO_WALL_TILES) {
      expect(tile.src).toMatch(/^\/images\/blog\/[^/]+\/\d+\.webp$/);
    }
  });

  it("ships no animated formats", () => {
    // An animated frame inside an already-drifting wall is two motions competing for
    // the same tile; `quants-in-the-wild` has three GIFs that must never be picked up.
    for (const tile of HERO_WALL_TILES) {
      expect(tile.src).not.toMatch(/\.(gif|apng|webm|mp4)$/);
    }
  });

  it("takes at most one frame from any single event", () => {
    const events = HERO_WALL_TILES.map((t) => t.src.split("/")[3]);
    expect(new Set(events).size).toBe(events.length);
  });
});
