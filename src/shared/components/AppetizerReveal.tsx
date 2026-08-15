import React, { useRef } from 'react';
import Box from '@mui/material/Box';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface AppetizerRevealProps {
  headerContent: React.ReactNode;
  mainContent: React.ReactNode;
}

/**
 * A scroll-triggered reveal for header + main content pairs.
 *
 * ## What changed (and why)
 *
 * This component used to pin itself with `ScrollTrigger` (`pin: true`,
 * `end: '+=100%'`). That worked in isolation but broke catastrophically
 * when nested inside `StageSection`, which wraps children in a
 * `.stage-inner` div and scrubs `transform` + `filter` onto it.
 *
 * Any element with a CSS `transform` creates a new containing block for
 * `position: fixed` descendants. So when ScrollTrigger set this component
 * to `position: fixed`, it was confined to `.stage-inner` instead of the
 * viewport — it scrolled away while the pin-spacer injected 100vh of
 * empty padding, producing the massive blank voids in the Pillars and
 * Market Position sections.
 *
 * The fix removes the pin entirely and converts to a scrubbed entrance
 * animation that plays as the section scrolls through the viewport.
 * The clip-path "slit" opens and header/content slide into place over
 * ~40% of the section's scroll travel, then hold. No pin, no spacer,
 * no containing-block conflict.
 */
export function AppetizerReveal({
  headerContent,
  mainContent,
}: AppetizerRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Standard Animation — NO PIN. Scrubs as the section travels through
      // the viewport, driven by the parent StageSection's own scroll range.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
            end: 'top 15%',
            scrub: 0.8,
            invalidateOnRefresh: true,
            // NO pin — this is the critical fix. The parent StageSection
            // already manages the section's entrance/exit scrub.
          },
        });

        // 1. Open the mask from the center — uses percentage-based insets
        // instead of vh units since we're no longer pinned at top:0.
        tl.fromTo(
          maskRef.current,
          { clipPath: 'inset(30% 0 30% 0)' },
          { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: 0.6 },
          0
        );

        // 2. Glide the header into its resting position
        if (headerRef.current) {
          tl.fromTo(
            headerRef.current,
            { y: 60, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, ease: 'none', duration: 0.5 },
            0.1
          );
        }

        // 3. Reveal the main content with a subtle upward shift
        tl.fromTo(
          mainContentRef.current,
          { y: 80, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, ease: 'none', duration: 0.5 },
          0.3
        );
      });

      // Reduced Motion Fallback — show everything immediately
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(maskRef.current, { clipPath: 'inset(0% 0% 0% 0%)' });
        if (headerRef.current) {
          gsap.set(headerRef.current, { y: 0, autoAlpha: 1 });
        }
        gsap.set(mainContentRef.current, { y: 0, autoAlpha: 1 });
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
      }}
    >
      <Box
        ref={maskRef}
        sx={{
          width: '100%',
          // Start fully open — GSAP fromTo handles the initial clip for
          // motion users; reduced-motion users see everything immediately.
          // The clipPath is set by the timeline, not by CSS, so there is
          // no flash-of-clipped-content before GSAP initialises.
        }}
      >
        {/* Header Content */}
        {headerContent && (
          <Box
            ref={headerRef}
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              mb: { xs: 4, md: 6 },
            }}
          >
            {headerContent}
          </Box>
        )}

        {/* Main Content */}
        <Box
          ref={mainContentRef}
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            pb: 4,
          }}
        >
          {mainContent}
        </Box>
      </Box>
    </Box>
  );
}
