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

export function isImageParagraph(paragraph: string): boolean {
  return IMAGE_PARAGRAPH.test(paragraph);
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
