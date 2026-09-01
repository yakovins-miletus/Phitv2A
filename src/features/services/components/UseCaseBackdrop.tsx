import { useEffect, useState } from "react";
import Box from "@mui/material/Box";

import { NOIR } from "@/shared/theme/palette";
import { useIsLowPowerDevice } from "@/shared/motion";

export interface UseCaseBackdropItem {
  id: string;
  image: string;
  imageAlt: string;
  /** Which side the block's copy column sits on — the scrim darkens that side. */
  side: "left" | "right";
}

interface UseCaseBackdropProps {
  items: readonly UseCaseBackdropItem[];
  /** The `.uc-block` elements, in order — the backdrop crossfades to whichever
   *  one occupies the middle of the viewport. */
  blockRefs: React.MutableRefObject<(HTMLElement | null)[]>;
}

/**
 * A sticky, full-viewport image stack behind the vertical use-case blocks. One
 * image is at `opacity: 1` at rest; as the reader scrolls a new block through
 * the middle of the viewport the active index flips and CSS crossfades.
 *
 * Driven by a passive, rAF-throttled scroll listener (not IntersectionObserver):
 * the section no longer owns a pin, the state changes at most 3–4 times over the
 * whole section, and a plain rect check is immune to the observer-timing edge
 * cases that pinned/transformed ancestors introduce.
 *
 * INVARIANT: `position: sticky`, never `fixed`. GSAP leaves inline transforms on
 * `.stage-inner` after the beat entrance, and a transformed ancestor becomes the
 * containing block for `fixed` descendants — which would break this. `sticky`
 * only cares about scroll ancestors with `overflow`, so the section root must
 * not set `overflow: hidden`.
 */
export function UseCaseBackdrop({ items, blockRefs }: UseCaseBackdropProps) {
  const lowPower = useIsLowPowerDevice();
  const [active, setActive] = useState(0);

  useEffect(() => {
    let raf = 0;
    let tick = 0;
    const loop = () => {
      raf = window.requestAnimationFrame(loop);
      // Recompute a few times a second, not every frame — the value changes at
      // most 3–4 times over the whole section.
      if (tick++ % 6 !== 0) return;

      // Only work while the section is anywhere near the viewport.
      const first = blockRefs.current[0];
      const lastEl = blockRefs.current[blockRefs.current.length - 1];
      if (!first || !lastEl) return;
      const vh = window.innerHeight;
      if (first.getBoundingClientRect().top > vh || lastEl.getBoundingClientRect().bottom < 0) {
        return;
      }

      const mid = vh / 2;
      let best = 0;
      let bestDist = Infinity;
      blockRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive((prev) => (prev === best ? prev : best));
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [blockRefs]);

  const instant = lowPower;

  return (
    <Box
      aria-hidden={false}
      sx={{
        position: "sticky",
        top: 0,
        height: "100svh",
        marginBottom: "-100svh",
        zIndex: 0,
        overflow: "hidden",
        // The section's own opaque `panel` fill sits behind this, so a 404'd
        // image degrades to the flat ground rather than to nothing.
        bgcolor: NOIR.panel,
      }}
    >
      {items.map((item, i) => (
        <Box
          key={item.id}
          component="img"
          src={item.image}
          alt={item.imageAlt}
          width={1536}
          height={864}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          fetchPriority="low"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: item.side === "left" ? "right center" : "left center",
            opacity: i === active ? 1 : 0,
            transition: instant ? "none" : "opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)",
            willChange: "opacity",
          }}
        />
      ))}

      {/* Directional scrim — heavier on the copy side of the active block. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          transition: instant ? "none" : "background 700ms cubic-bezier(0.16, 1, 0.3, 1)",
          background:
            items[active]?.side === "right"
              ? "linear-gradient(270deg, rgba(248,250,252,0.95) 0%, rgba(248,250,252,0.74) 44%, rgba(248,250,252,0.12) 74%), rgba(248,250,252,0.32)"
              : "linear-gradient(90deg, rgba(248,250,252,0.95) 0%, rgba(248,250,252,0.74) 44%, rgba(248,250,252,0.12) 74%), rgba(248,250,252,0.32)",
        }}
      />
    </Box>
  );
}
