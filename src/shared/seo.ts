// Per-route document head. TanStack Router merges the deepest match's meta over
// the root defaults; <HeadContent /> (rendered in __root) syncs them to <head>.

interface HeadMeta {
  title?: string;
  name?: string;
  content?: string;
  property?: string;
}

interface HeadLink {
  rel: string;
  href: string;
}

// Absolute production origin, used to turn root-relative paths/images into the
// absolute URLs crawlers require for canonical/og:url/og:image/twitter:image —
// a relative value is simply wrong there, not merely non-ideal. Sourced from
// `VITE_SITE_URL` (see .env.production / .env.development). `VITE_API_URL` is
// deliberately NOT reused for this: in production it's `/` (same-origin, see
// .env.production), which carries no hostname at all.
//
// Falls back to the browser's own origin so links still resolve if the env
// var is ever unset (e.g. a preview deploy), rather than emitting a bare path.
const SITE_URL =
  (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

// Site-wide fallback social-preview image: the same hero background used on
// the home page (see src/features/hero/ParallaxHeroBg.tsx), so an unfurl
// always has *something* on-brand even when a route has no image of its own.
const DEFAULT_OG_IMAGE = "/images/hero-sky-bg.jpg";

const SITE_NAME = "Phitopolis";

/** Resolve a root-relative path or already-absolute URL against `SITE_URL`. */
function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export interface PageHeadOptions {
  /** Emits `<meta name="robots" content="noindex, nofollow">`. Set for pages that
   *  should never be indexed or crawled onward — currently just the not-found
   *  route, whose "URL" is whatever a visitor (or crawler) happened to type. */
  noindex?: boolean;
  /** Overrides the path used to build `canonical`/`og:url`, which otherwise
   *  default to the current `window.location.pathname`. Pass `null` to point
   *  both at the site root instead and suppress the canonical `<link>` entirely
   *  — for a route matched by "anything unmatched" (the 404 page), the request
   *  path is attacker/typo-controlled, so echoing it back as the canonical
   *  location would hand a crawler a self-confirming "this junk URL is real
   *  content" signal. Root-relative paths are also accepted for routes that
   *  want a canonical other than their own literal path. */
  canonicalPath?: string | null;
}

/** Build a route `head` from a page title and description, including Open Graph
 *  and Twitter Card tags so shared links render well, plus a canonical link.
 *  Titles carry the brand suffix themselves.
 *
 *  `image` overrides the default social-preview image (root-relative or
 *  absolute; `null`/omitted falls back to `DEFAULT_OG_IMAGE`) — pass a post's
 *  own `image_url` where one exists.
 *
 *  `options` covers the not-indexable case (see `PageHeadOptions`); every
 *  existing call site omits it and keeps today's canonical-echoes-current-path
 *  behavior unchanged. */
export function pageHead(
  title: string,
  description: string,
  image?: string | null,
  options?: PageHeadOptions,
): { meta: HeadMeta[]; links: HeadLink[] } {
  // CSR-only app (see index.html): head() reruns on every navigation, and
  // `window` is always available by the time it does, so this reliably
  // reflects the current route rather than whatever path first hydrated.
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const canonicalPath = options?.canonicalPath === undefined ? path : options.canonicalPath;
  // `canonicalPath === null` means "don't trust the request path" — fall back
  // to the bare site root for og:url rather than a per-route path at all.
  const url = canonicalPath === null ? SITE_URL || "/" : `${SITE_URL}${canonicalPath}`;
  const ogImage = absoluteUrl(image ?? DEFAULT_OG_IMAGE);

  const meta: HeadMeta[] = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: ogImage },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
  ];

  if (options?.noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  return {
    meta,
    // `canonicalPath: null` omits the canonical link entirely rather than
    // pointing it at a URL that never actually resolves to this content.
    links: canonicalPath === null ? [] : [{ rel: "canonical", href: url }],
  };
}
