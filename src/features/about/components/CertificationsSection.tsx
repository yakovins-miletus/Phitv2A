import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useAnimationFrame } from "motion/react";

import { Reveal } from "@/shared/components/Reveal";
import { useReducedMotion } from "@/shared/motion";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { CONTENT } from "@/shared/content";

interface CertBadgeData {
  name: string;
  logo: string;
  provider: string;
}

/**
 * WS-16 #4: rebuilt from a static responsive `Grid` into one full-viewport
 * section with the badges on a self-moving shelf.
 *
 * Reuses `PoweredBySection`'s `TechMarqueeRow` mechanism — `useAnimationFrame`
 * stepping a `translateX` offset — rather than a third scroll-linked loop.
 * Two differences from that mechanism, both required here and absent there:
 *   - an `IntersectionObserver` stops the rAF loop while the shelf is
 *     offscreen (PoweredBySection's rows never needed this: they sit near
 *     the top of a page that is always at least partly visible while any
 *     row could be running; a full-viewport section further down the page
 *     does not carry that guarantee).
 *   - `prefers-reduced-motion` renders every badge, static and legible, in a
 *     wrapped grid instead of a moving shelf.
 * Hard requirement carried over from the ticket: no hover-pause. None is
 * added here, matching every other marquee in the repo.
 */
const CertBadge = React.memo(({ cert }: { cert: CertBadgeData }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={2}
    sx={{ flexShrink: 0, px: 4 }}
  >
    <Box
      component="img"
      decoding="async"
      loading="lazy"
      src={cert.logo}
      alt={cert.name}
      sx={{ width: 56, height: 56, objectFit: "contain", flexShrink: 0 }}
    />
    <Stack spacing={0.25}>
      <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "common.white", whiteSpace: "nowrap" }}>
        {cert.name}
      </Typography>
      <Typography sx={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>
        {cert.provider.toUpperCase()}
      </Typography>
    </Stack>
  </Stack>
));
CertBadge.displayName = "CertBadge";

// With 4 rows instead of 2, each row holds far fewer badges (~4 vs ~8), so a
// plain doubled copy of the row's items can be narrower than the viewport —
// the marquee would run out of content mid-loop and visibly jump/gap at the
// seam. REPEAT_COUNT repeats the row's items enough times to comfortably
// exceed any viewport width, and the wrap divisor below MUST match it: one
// full loop period is `scrollWidth / REPEAT_COUNT`, so the offset has to wrap
// there, not at a hardcoded `/2`. Changing one without the other reintroduces
// the visible jump.
const REPEAT_COUNT = 4;

// Number of counter-moving marquee rows; data-driven split below reads this
// rather than a hardcoded 2-way slice.
const MARQUEE_ROWS = 4;

// Alternating direction/speed per row index so no two rows sync up visually.
const ROW_SPEEDS_PPS = [26, 20, 23, 17];

function CertMarqueeRow({
  items,
  basePPS,
  reverse = false,
  running,
}: {
  items: CertBadgeData[];
  basePPS: number;
  reverse?: boolean;
  running: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const repeatedItems = Array.from({ length: REPEAT_COUNT }, () => items).flat();

  useAnimationFrame((_, delta) => {
    if (!running || !containerRef.current) return;
    const step = (basePPS * delta) / 1000 * (reverse ? -1 : 1);
    offsetRef.current += step;

    const periodWidth = containerRef.current.scrollWidth / REPEAT_COUNT;
    if (periodWidth <= 0) return;
    if (offsetRef.current > periodWidth) offsetRef.current -= periodWidth;
    if (offsetRef.current < 0) offsetRef.current += periodWidth;
    containerRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
  });

  return (
    <Box sx={{ overflow: "hidden", py: 2 }}>
      <Box ref={containerRef} sx={{ display: "flex", alignItems: "center", willChange: "transform" }}>
        {repeatedItems.map((cert, idx) => (
          <CertBadge key={`${cert.name}-${String(idx)}`} cert={cert} />
        ))}
      </Box>
    </Box>
  );
}

export function CertificationsSection() {
  const { headline, note, groups } = CONTENT.certifications;
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setOnScreen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => setOnScreen(entries[0]?.isIntersecting ?? false),
      { rootMargin: "80px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const allBadges: CertBadgeData[] = groups.flatMap((group) =>
    group.items.map((item) => ({ name: item.name, logo: item.logo, provider: group.provider })),
  );

  // Split the flattened badge list across MARQUEE_ROWS counter-moving rows.
  // Round-robin (rather than a contiguous chunk-in-order split) keeps rows
  // balanced even when the badge count isn't divisible by MARQUEE_ROWS (no
  // empty trailing row), and as a bonus mixes providers within each row
  // instead of clustering e.g. all 5 AWS badges into row 0.
  const rows: CertBadgeData[][] = Array.from({ length: MARQUEE_ROWS }, (_, r) =>
    allBadges.filter((_, i) => i % MARQUEE_ROWS === r),
  );

  const running = onScreen && !reducedMotion;

  return (
    <Box
      ref={sectionRef}
      component="section"
      sx={{
        minHeight: "100vh",
        bgcolor: NOIR.navyField,
        color: "common.white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: { xs: 6, md: 10 },
        py: { xs: 10, md: 0 },
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: { xs: 3, md: 8 } }}>
        <Reveal>
          <Stack spacing={2} sx={{ maxWidth: 720 }}>
            <Typography variant="h2" component="h2" sx={{ fontWeight: 800, color: "common.white" }}>
              {headline}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", lineHeight: 1.6 }}>
              {note}
            </Typography>
          </Stack>
        </Reveal>
      </Box>

      {reducedMotion ? (
        // Reduced motion: every badge, static and legible, no shelf.
        <Box sx={{ px: { xs: 3, md: 8 } }}>
          <Grid container spacing={{ xs: 3, md: 4 }}>
            {allBadges.map((cert) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={cert.name}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    component="img"
                    decoding="async"
                    loading="lazy"
                    src={cert.logo}
                    alt={cert.name}
                    sx={{ width: 48, height: 48, objectFit: "contain", flexShrink: 0 }}
                  />
                  <Stack spacing={0.25}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "common.white" }}>
                      {cert.name}
                    </Typography>
                    <Typography sx={{ fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>
                      {cert.provider.toUpperCase()}
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <Stack spacing={0}>
          {rows.map((row, idx) => (
            <CertMarqueeRow
              key={idx}
              items={row}
              basePPS={ROW_SPEEDS_PPS[idx % ROW_SPEEDS_PPS.length] ?? 20}
              reverse={idx % 2 === 1}
              running={running}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
