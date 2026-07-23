// Per-route document head. TanStack Router merges the deepest match's meta over
// the root defaults; <HeadContent /> (rendered in __root) syncs them to <head>.

interface HeadMeta {
  title?: string;
  name?: string;
  content?: string;
  property?: string;
}

/** Build a route `head` from a page title and description, including Open Graph
 *  tags so shared links render well. Titles carry the brand suffix themselves. */
export function pageHead(title: string, description: string): { meta: HeadMeta[] } {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  };
}
