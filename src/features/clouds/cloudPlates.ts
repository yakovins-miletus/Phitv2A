/**
 * The cloud-plate manifest — path, intrinsic size and suggested parallax
 * depth for every plate `scripts/extract-clouds.mjs` wrote to
 * `public/images/clouds/`.
 *
 * The single source of truth for dimensions: `CloudProps` reads `width`/
 * `height` from here rather than guessing, which is what lets it set the
 * `<img>`'s own `width`/`height` attributes and avoid a layout shift while
 * the plate loads. Regenerate this file's numbers (the extraction script
 * prints them) if the script is ever re-run with different crop/scale
 * settings — they are not derived at build time.
 */

export interface CloudPlate {
  id: string;
  /** Path under `public/`, so it can be used directly as an `<img src>`. */
  src640: string;
  src1280: string;
  /** Intrinsic size of the 1280w file; the 640w file is exactly half. */
  width: number;
  height: number;
  /**
   * Suggested parallax depth, 0..1 — how far this plate travels relative to
   * scroll versus the page itself. Lower reads as farther away (moves less);
   * `CloudProps` multiplies scroll delta by this, it does not interpret it
   * as anything more elaborate.
   */
  depth: number;
}

export const CLOUD_PLATES: readonly CloudPlate[] = [
  {
    id: "cloud-01",
    src640: "/images/clouds/cloud-01-640w.webp",
    src1280: "/images/clouds/cloud-01-1280w.webp",
    width: 1280,
    height: 273,
    depth: 0.18,
  },
  {
    id: "cloud-02",
    src640: "/images/clouds/cloud-02-640w.webp",
    src1280: "/images/clouds/cloud-02-1280w.webp",
    width: 1280,
    height: 273,
    depth: 0.32,
  },
  {
    id: "cloud-03",
    src640: "/images/clouds/cloud-03-640w.webp",
    src1280: "/images/clouds/cloud-03-1280w.webp",
    width: 1280,
    height: 273,
    depth: 0.24,
  },
  {
    id: "cloud-04",
    src640: "/images/clouds/cloud-04-640w.webp",
    src1280: "/images/clouds/cloud-04-1280w.webp",
    width: 1280,
    height: 273,
    depth: 0.4,
  },
  {
    id: "cloud-05",
    src640: "/images/clouds/cloud-05-640w.webp",
    src1280: "/images/clouds/cloud-05-1280w.webp",
    width: 1280,
    height: 273,
    depth: 0.14,
  },
  {
    id: "cloud-06",
    src640: "/images/clouds/cloud-06-640w.webp",
    src1280: "/images/clouds/cloud-06-1280w.webp",
    width: 1280,
    height: 273,
    depth: 0.28,
  },
] as const;
