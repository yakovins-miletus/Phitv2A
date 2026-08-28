/** Image-paragraph convention for plain-text blog bodies.
 *
 * A body paragraph that is entirely one image path — site-relative
 * (`/images/...`, never `//host`) or `https://` with an image extension —
 * renders as an image. Whole-paragraph match only, never markup parsing, so
 * the plain-text XSS posture is unchanged.
 *
 * Twin implementation: backend/app/features/blog/body_images.py — keep the
 * two patterns identical.
 */
const IMAGE_PARAGRAPH = /^(?:\/(?!\/)|https:\/\/)\S+\.(?:png|jpe?g|webp|gif|avif)$/i;

/**
 * Reject anything with a query string or fragment.
 *
 * `\S+` is greedy, so `https://evil.example/track?id=victim&x=.png` matched the
 * pattern above: the string still *ends* in `.png`, and the query rode along.
 * That is an exfiltration channel — the URL is bound to an <img src>, so every
 * visitor's IP, User-Agent and Referer reach an attacker-chosen host, with
 * arbitrary attacker data in the query.
 *
 * No legitimate stored image path carries a query: Heimdall stores bare paths
 * like `/images/blog/<slug>/01.png` and hosts no files of its own.
 */
const HAS_QUERY_OR_FRAGMENT = /[?#]/;

export function isImageParagraph(paragraph: string): boolean {
  return IMAGE_PARAGRAPH.test(paragraph) && !HAS_QUERY_OR_FRAGMENT.test(paragraph);
}

/**
 * Validate a CMS-supplied `image_url` before binding it to an <img src>.
 *
 * Body paragraphs were already gated by `isImageParagraph`; `image_url` was not,
 * and went straight through at six call sites. Heimdall does not authenticate
 * writes at the network layer alone any more, but the field is still
 * CMS-controlled data reaching a URL sink, and it should meet the same bar as
 * the paragraphs beside it.
 *
 * Returns null when the value is unusable, so callers can fall back rather than
 * emit a broken or hostile request.
 */
export function safeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return isImageParagraph(trimmed) ? trimmed : null;
}

/**
 * Site-relative PNG/JPG under `/images/` — the only paths we are allowed to retarget.
 *
 * Deliberately NOT `https://` and NOT `.gif`: an absolute URL points at a host whose
 * files we do not control, and animated GIFs do not survive a still-image swap.
 */
const RETARGETABLE = /^(\/images\/[^\s?#]+)\.(?:png|jpe?g)$/i;

/**
 * Prefer the WebP twin of a stored blog image path.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────────────────
 *
 * `docs/blog-image-migration.md` describes a PNG/JPG → WebP switch that was prepared
 * and then parked, because the image paths live in **backend post bodies**, not in this
 * repo: renaming files here would 404 every image in every article. The doc's step 1
 * is "backend: replace each old path with its new path in the stored post bodies" —
 * a content migration against a database, for a purely presentational change.
 *
 * That dependency is unnecessary. The stored path is a *reference*, and resolving a
 * reference is the client's job. Rewriting the extension at render time gets the same
 * 30 MB saving with a one-file frontend change, no database write, and no window where
 * the two systems disagree. The backend can keep storing `.png` forever.
 *
 * ── SAFETY ───────────────────────────────────────────────────────────────────────
 *
 * Every `/images/blog/**` PNG/JPG in `public/` has a WebP twin (verified at the time of
 * writing: 182 blog rasters, 182 twins — the 5 that were missing were converted). If a
 * twin is ever absent the <img> 404s, so callers must keep an `onError` fallback to the
 * original path. `BlogPostArticle` does exactly that.
 */
export function preferWebp(src: string): string {
  const match = RETARGETABLE.exec(src);
  return match ? `${match[1]}.webp` : src;
}

/** The original path, for an `onError` fallback after `preferWebp` has been applied. */
export function originalFromWebp(src: string, original: string): string {
  return src === original ? src : original;
}

/**
 * Resolve a CMS `image_url` into something actually renderable.
 *
 * Composes the two steps that must always happen together:
 *   1. `safeImageUrl` — reject anything that is not a plain image path.
 *   2. `preferWebp`   — rewrite `/images/**.png|.jpg` to its `.webp` twin.
 *
 * ── WHY BOTH ARE REQUIRED ────────────────────────────────────────────────────
 *
 * `public/images/blog/**` contains **only** `.webp` files — the PNG/JPG
 * originals were removed once the migration in docs/blog-image-migration.md
 * completed on this side. Heimdall still stores the original `.png` / `.jpg`
 * paths, because the migration doc's step 1 (rewriting paths in stored post
 * bodies) was deliberately never done: the stored value is a *reference*, and
 * resolving it is the client's job.
 *
 * Consequence: binding `image_url` straight to an <img src> yields a 404 and a
 * broken card. The article body already went through `preferWebp`; the list and
 * hero cards did not, so every thumbnail on /blog and the homepage was broken.
 *
 * Returns `null` when the value is unusable. `fallback` is the un-rewritten path
 * for an `onError` handler, so a missing twin degrades to the original rather
 * than to a broken image.
 */
export function resolveImageUrl(
  url: string | null | undefined,
): { src: string; fallback: string } | null {
  const safe = safeImageUrl(url);
  if (safe === null) return null;
  return { src: preferWebp(safe), fallback: safe };
}
