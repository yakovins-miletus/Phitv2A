/**
 * The photographs the hero's drift wall is built from.
 *
 * Sourced from the Heimdall CMS's blog media library — `public/images/blog/<slug>/`,
 * the same tree `blog_posts.image_url` points at. One frame per event, 25 events, so
 * the wall reads as a cross-section of the firm rather than a slideshow of one day.
 *
 * **The count is 25 because the wall is 5 columns wide, and it must stay a multiple
 * of the column count.** Items are dealt round-robin, so 24 across 5 columns leaves
 * one column short — and a short column's wrap cycle is shorter than its neighbours',
 * which means the shared repeat count no longer covers it and a gap slides in from
 * the bottom edge. Adding or removing a tile means adding or removing five.
 *
 * Selection rule, and it is not "whatever looked nice":
 *
 *   1. **Aspect ratio between 0.72 and 1.85.** The tile is 300x280 (AR 1.07) and the
 *      images are `object-fit: cover`, so a 1920x604 banner would show its middle
 *      third and nothing else. Every entry below sits within one stop of square.
 *   2. **At least 500x400 native.** Smaller sources upscale into the tile and go soft
 *      exactly where the wall is closest to the viewer.
 *   3. **Smallest qualifying file per folder.** The set is fetched at
 *      `fetchPriority="low"` after the hero's LCP, but 24 images is still 24 images.
 *
 * No GIFs: `quants-in-the-wild/{02,03,04}.gif` are animated, and an animated frame
 * inside an already-drifting wall is two motions fighting for the same tile.
 *
 * There is deliberately no `alt` and no `href` field. The wall is decorative — its
 * wrapper is `aria-hidden` and `pointerEvents: none` (see `HeroImageWall.tsx`) — and
 * an optional `alt` on the type is an invitation for someone to fill it in and
 * quietly promote a background texture into the accessibility tree. Every one of
 * these photographs already appears with real context and a real caption on its own
 * blog post.
 *
 * Ordering is load-bearing in one small way: `DriftWall` distributes items
 * round-robin (`i % columns`), so consecutive entries land in *different* columns.
 * The list is interleaved by subject — grads, community, office, event — so no
 * single column ends up being all CSR or all cohort photos.
 */

/** One tile in the wall. */
export interface DriftItem {
  /** Stable React key. The path is already unique; an explicit id survives a rename. */
  readonly id: string;
  /** Absolute public path. Always `/images/blog/<event>/<NN>.webp`. */
  readonly src: string;
}

export const HERO_WALL_TILES: readonly DriftItem[] = [
  { id: "ateneo-talk", src: "/images/blog/ateneo-career-talk-2025/01.webp" },
  { id: "repainting", src: "/images/blog/csr-activity-repainting-community-spaces/01.webp" },
  { id: "grads-b2-week", src: "/images/blog/2024-grads-batch-2-grad-week/05.webp" },
  { id: "dataops-clark", src: "/images/blog/data-ops-training-in-clark-pampanga/04.webp" },
  {
    id: "datathon-2k25",
    src: "/images/blog/phitopolis-datathon-2k25-the-grads-all-star-showdown/02.webp",
  },
  {
    id: "gift-it-forward",
    src: "/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/04.webp",
  },
  {
    id: "gdsc-dlsu",
    src: "/images/blog/inspiring-the-next-generation-of-quants-our-talks-at-the-google-developers-student-club-dlsu/01.webp",
  },
  {
    id: "sixth-year",
    src: "/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/06.webp",
  },
  { id: "boomerang-fu", src: "/images/blog/game-on-boomerang-fu-brings-the-heat-and-the-chaos/02.webp" },
  { id: "wellness-2025", src: "/images/blog/phitopolis-wellness-week-2025/02.webp" },
  {
    id: "onboarding-2026",
    src: "/images/blog/2026-technical-graduate-batch-1-onboarding-week/02.webp",
  },
  { id: "wellness-2026", src: "/images/blog/2026-wellness-week/05.webp" },
  {
    id: "joy-in-every-bag",
    src: "/images/blog/joy-in-every-bag-christmas-gift-giving-at-brgy-pinagsama/03.webp",
  },
  {
    id: "brigada-papa",
    src: "/images/blog/csr-activity-brigada-eskwela-at-gen-ricardo-g-papa-sr-memorial-high-school/04.webp",
  },
  {
    id: "dataops-immersion",
    src: "/images/blog/immersion-in-dataops-a-journey-behind-the-scenes-of-data-operations/01.webp",
  },
  {
    id: "new-office",
    src: "/images/blog/expanding-horizons-phitopolis-unveils-its-new-office/02.webp",
  },
  {
    id: "grads-b1-two-years",
    src: "/images/blog/2024-technical-graduates-batch-1-two-years-milestones-of-growth/04.webp",
  },
  { id: "summer-2026", src: "/images/blog/out-of-office-phitopolis-summer-2026/05.webp" },
  {
    id: "aws-certified",
    src: "/images/blog/2024-graduates-aws-cloud-practitioner-certification/02.webp",
  },
  { id: "external-talk", src: "/images/blog/phitopolis-external-talk/01.webp" },
  { id: "workday-swe", src: "/images/blog/a-work-day-in-software-engineering/02.webp" },
  { id: "likhapolis", src: "/images/blog/likhapolis-pagbibigay-kulay-at-saya/02.webp" },
  { id: "slippers-100", src: "/images/blog/csr-activity-100-slippers-for-100-kids/02.webp" },
  {
    id: "school-kits",
    src: "/images/blog/sunshine-stories-and-school-kits-a-csr-day-to-remember/02.webp",
  },
  { id: "christmas-2024", src: "/images/blog/christmas-party-2024/04.webp" },
];
