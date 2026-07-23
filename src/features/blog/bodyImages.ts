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
