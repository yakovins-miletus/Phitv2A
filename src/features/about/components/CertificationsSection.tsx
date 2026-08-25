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
  const doubledItems = [...items, ...items];

  useAnimationFrame((_, delta) => {
    if (!running || !containerRef.current) return;
    const step = (basePPS * delta) / 1000 * (reverse ? -1 : 1);
    offsetRef.current += step;

    const halfWidth = containerRef.current.scrollWidth / 2;
    if (halfWidth <= 0) return;
    if (offsetRef.current > halfWidth) offsetRef.current -= halfWidth;
    if (offsetRef.current < 0) offsetRef.current += halfWidth;
    containerRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
  });

  return (
    <Box sx={{ overflow: "hidden", py: 2 }}>
      <Box ref={containerRef} sx={{ display: "flex", alignItems: "center", willChange: "transform" }}>
        {doubledItems.map((cert, idx) => (
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

  // Split the flattened badge list across two counter-moving rows.
  const mid = Math.ceil(allBadges.length / 2);
  const rowA = allBadges.slice(0, mid);
  const rowB = allBadges.slice(mid);

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
          <CertMarqueeRow items={rowA} basePPS={26} running={running} />
          <CertMarqueeRow items={rowB} basePPS={20} reverse running={running} />
        </Stack>
      )}
    </Box>
  );
}
