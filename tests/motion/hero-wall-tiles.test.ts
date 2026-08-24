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

import { existsSync } from "node:fs";
import { resolve } from "node:path";

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

  it("draws only from the generated hero-wall derivatives", () => {
    // NOT `/images/blog/...`, and that is the point of this assertion.
    //
    // The tile renders at 300x280 while the blog originals are 1520px+, and the
    // wall prefetches all 25 on the home page — 2.55MB of transfer for 300px
    // tiles. `/images/hero-wall/<slug>-<NN>.webp` holds 600x560 derivatives
    // (1.13MB total) that look identical on screen.
    //
    // Pointing a tile back at the blog original still *works*, which is exactly
    // why this is pinned: the regression is invisible in the browser and only
    // shows up as bytes.
    for (const tile of HERO_WALL_TILES) {
      expect(tile.src).toMatch(/^\/images\/hero-wall\/[^/]+\.webp$/);
    }
  });

  it("points at files that actually exist in public/", () => {
    // The failure the header describes — a fat-fingered path rendering a broken
    // tile 60% of the way down an eight-viewport scroll — is now more likely,
    // not less: these paths are generated derivatives rather than the blog
    // originals someone can eyeball in the media library. A shape-only regex
    // would pass happily on a file that was never generated.
    for (const tile of HERO_WALL_TILES) {
      const onDisk = resolve(process.cwd(), `public${tile.src}`);
      expect(existsSync(onDisk), `missing derivative: public${tile.src}`).toBe(true);
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
    // The event slug used to be a path segment (`/images/blog/<slug>/<NN>.webp`,
    // index 3). In the flat derivative tree it is the filename minus the frame
    // number, so it has to be parsed rather than indexed — a `split("/")[3]`
    // here would now return the whole filename and silently degrade this into a
    // second copy of the duplicate-src check above.
    const events = HERO_WALL_TILES.map((t) =>
      t.src.replace(/^\/images\/hero-wall\//, "").replace(/-\d+\.webp$/, ""),
    );
    expect(new Set(events).size).toBe(events.length);
  });
});
