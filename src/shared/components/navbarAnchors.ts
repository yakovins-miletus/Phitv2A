/**
 * Navbar anchor ids: the sections that trigger the navbar to switch between dark
 * and light modes, and bind `:focus-visible` to a named element on the page.
 *
 * Two separate registries existed before this export: section ids (from
 * sections.ts, used by SectionBeat and beat-reveal) and anchor ids (used by
 * useNavbarAnchor only, tracked by a separate Set). They were independently
 * managed as side effects of the `setActiveSection()` call and the anchor's own
 * `useEffect`, and the fact that they mostly aligned was a convention enforced
 * only by names and comments, not by types.
 *
 * What was NOT on purpose is that both took a bare `string`, so nothing stopped
 * someone passing "daily-life" (a section id) where "daily-life-video" (an
 * anchor id) was meant — silently registering an anchor that never intersects.
 * Anchor ids now live here and useNavbarAnchor only accepts one of them.
 */
export const NAV_ANCHORS = {
  /** The hero page's gunshot & smoking dark image sequence. */
  HERO_GUNSHOT: 'hero-gunshot',
  /** The daily-life film, which the navbar must go light over. */
  DAILY_LIFE_VIDEO: 'daily-life-video',
  /** The About page's hero section. */
  ABOUT_HERO: 'about-hero',
  /** The About page's journey timeline. */
  ABOUT_TIMELINE: 'timeline',
  /** The About page's certifications section. */
  ABOUT_CERTIFICATIONS: 'about-certifications',
  /** The About page's values section. */
  ABOUT_VALUES: 'about-values',
  /** The About page's daily life section. */
  ABOUT_DAILY_LIFE: 'about-daily-life',
  /** The About page's academic pathways section. */
  ABOUT_ACADEMICS: 'about-academics',
  /** The immersive process section on the home page. */
  PROCESS_IMMERSIVE: 'process-immersive',
  /** The Blog page's hero section. */
  BLOG_HERO: 'blog-hero',
  /** The About page's blog section (relocated from home — PRD-home-client-focus §US-2). */
  ABOUT_BLOG_SECTION: 'about-blog-section',
  /** Home page: the global-markets wager beat. Navy ground (deep), navbar must go dark.
   *  Anchor id is deliberately distinct from the `global-markets` *section* id
   *  (SectionBeat) — the two registries must stay disjoint (see
   *  anchor-namespaces.test.ts). */
  GLOBAL_MARKETS: 'home-global-markets',
  /** The Home page's closing shelf — light (white) ground, so the navbar must go dark-chrome. */
  HOME_CLOSING: 'home-closing',
  /** AppShell's footer, on every route. */
  SITE_FOOTER: 'site-footer',
  /** The Innovation Lab coming soon page. */
  INNOVATION_LAB: 'innovation-lab',
  /** The Innovation Hub page's hero section. Was incorrectly reusing ABOUT_HERO —
   *  two unrelated routes sharing one anchor id meant scrolling either page's
   *  hero could leave the OTHER route's last-registered dark/light state behind
   *  on navigation, since they are never both mounted but the id collision made
   *  them indistinguishable to anything inspecting the anchor set. */
  INNOVATION_HERO: 'innovation-hero',
  /** Home page: services/capabilities section. Light ground — previously had no
   *  anchor, so the navbar held whatever the last real anchor above it said for
   *  the entire scroll through it. */
  HOME_SERVICES: 'home-services',
  /** Home page: the use-cases horizontal-scroll narrative. Light ground. */
  HOME_USE_CASES: 'home-use-cases',
  /** Home page: global footprint / reach section. Light ground — sits directly
   *  between two now-dark sections (process, daily-life), so this anchor is
   *  what corrects the navbar back to light between them. */
  HOME_REACH: 'home-reach',
  /** About page: talent & careers section (relocated from home). Light ground. */
  ABOUT_CANDIDATES: 'about-candidates',
  /** About page: testimonials section (relocated from home). Light ground. */
  ABOUT_TESTIMONIALS: 'about-testimonials',
  /** The /services route. One anchor for the whole page — it's a single uniform
   *  light ground throughout, not a SectionBeat/ground-per-section page. */
  SERVICES_PAGE: 'services-page',
  /** The /careers route. Same rationale as SERVICES_PAGE. */
  CAREERS_PAGE: 'careers-page',
  /** The /careers route's dark cinematic video band, above the light register
   *  header — the navbar must go light-chrome over it. */
  CAREERS_HERO: 'careers-hero',
  /** The /services route's dark cinematic video hero, above the light service
   *  list — same unified `VideoPageHero` treatment as CAREERS_HERO / BLOG_HERO,
   *  so the navbar must go light-chrome over it. */
  SERVICES_HERO: 'services-hero',
  /** The /blog listing page's content area (sidebar + toolbar + post grid),
   *  below BLOG_HERO. Light ground. */
  BLOG_LISTING: 'blog-listing',
  /** The /contact route. One anchor for the whole page, light ground throughout. */
  CONTACT_PAGE: 'contact-page',
  /** Home page: the `BarTransitionSection` wipe blocks. Each is a full opaque
   *  viewport between two grounds — without an anchor the navbar lost all
   *  dark/light state whenever one filled the screen. One id per boundary
   *  (they are never both under the navbar at once, but unique ids avoid a
   *  register/deregister race at the handoff). Registered with the DESTINATION
   *  ground's darkness — see BarTransitionSection. */
  HOME_BRIDGE_MARKETS: 'home-bridge-markets',
  HOME_BRIDGE_PILLARS: 'home-bridge-pillars',
  HOME_BRIDGE_USECASES: 'home-bridge-usecases',
  HOME_BRIDGE_PROCESS: 'home-bridge-process',
  HOME_BRIDGE_REACH: 'home-bridge-reach',
} as const;

export type NavAnchorId = (typeof NAV_ANCHORS)[keyof typeof NAV_ANCHORS];
