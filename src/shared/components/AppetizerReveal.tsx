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

      // Standard Animation with ScrollTrigger
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: '+=100%',
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          },
        });

        // 1. Open the mask vertically from the center
        // We use viewport units (vh) so the slit is exactly in the middle of the screen
        tl.fromTo(
          maskRef.current,
          { clipPath: 'inset(40vh 0 40vh 0)' },
          { clipPath: 'inset(0vh 0px 0vh 0px)', ease: 'none' },
          0
        );

        // 2. Glide the header up to its final position at the top
        // Final position is pt: '10vh'. To start at 40vh, we translate by 30vh.
        tl.fromTo(
          headerRef.current,
          { y: '30vh' },
          { y: '0vh', ease: 'none' },
          0
        );

        // 3. Reveal the main content with a subtle upward shift
        tl.fromTo(
          mainContentRef.current,
          { y: '30vh', opacity: 0 },
          { y: '0vh', opacity: 1, ease: 'none' },
          0.2
        );
      });

      // Reduced Motion Fallback
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(maskRef.current, { clipPath: 'inset(0vh 0px 0vh 0px)' });
        gsap.set(headerRef.current, { y: 0 });
        gsap.set(mainContentRef.current, { y: 0, opacity: 1 });
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
        display: 'grid',
        // Container grows naturally based on the grid contents
      }}
    >
      <Box
        ref={maskRef}
        sx={{
          gridArea: '1 / 1',
          display: 'grid',
          width: '100%',
          clipPath: 'inset(40vh 0 40vh 0)', // Initial slit
          overflow: 'hidden',
        }}
      >
        {/* Header Content */}
        <Box
          ref={headerRef}
          sx={{
            gridArea: '1 / 1',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignSelf: 'start', // Stay at the top of the grid cell
            pt: '10vh', // Final resting position
            zIndex: 10,
          }}
        >
          {headerContent}
        </Box>

        {/* Main Content */}
        <Box
          ref={mainContentRef}
          sx={{
            gridArea: '1 / 1',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'start',
            alignSelf: 'start',
            pt: { xs: '35vh', md: '30vh' }, // Clear the header's final position safely
            pb: 10,
            zIndex: 1,
          }}
        >
          {mainContent}
        </Box>
      </Box>
    </Box>
  );
}
