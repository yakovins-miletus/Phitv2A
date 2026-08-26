import React, { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  useAnimationFrame,
  useScroll,
  useSpring,
  useVelocity,
} from "motion/react";

import { Reveal } from "@/shared/components/Reveal";
import { RevealLines } from "@/shared/components/reveal/RevealLines";
import { FONT, MONO } from "@/shared/theme/theme";
import { NOIR, TECH_CAT_ACCENTS } from "@/shared/theme/palette";
import {
  LOCAL_TECHS,
  ROW1_TECHS,
  ROW2_TECHS,
  ROW3_TECHS,
  TECH_SLUGS,
} from "@/shared/content/techStack";

import { MetaLabel } from "./MetaLabel";

// ── Tech Stack / Powered By Section ──
// Data (TECH_SLUGS, ROW1/2/3_TECHS, LOCAL_TECHS) lives in
// @/shared/content/techStack so HeroWordWall can reuse the same curated
// list without duplicating it.

/** Re-exported from the palette; `dev`/`infra`/`data` used to be Tailwind
    violet-400 / blue-400 / emerald-400 sitting next to a brand-gold `ai`. */
const TECH_CAT_COLORS = TECH_CAT_ACCENTS;

const TechCard = React.memo(({ tech, activeCat }: { tech: { name: string; cat: string }; activeCat: string | null }) => {
  const localPath = LOCAL_TECHS[tech.name];
  const slug = TECH_SLUGS[tech.name];
  const [imageValid, setImageValid] = useState(true);
  const isFiltered = activeCat !== null && tech.cat !== activeCat;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2.5,
        flexShrink: 0,
        px: 6,
        opacity: isFiltered ? 0.12 : 1,
        filter: isFiltered ? "grayscale(1)" : "none",
        transition: "opacity 0.35s ease, filter 0.35s ease"
      }}
    >
      {localPath ? (
        <Box
          component="img" decoding="async" loading="lazy"
          src={localPath}
          alt={tech.name}
          sx={{
            width: 52,
            height: 52,
            flexShrink: 0,
            objectFit: "contain",
            opacity: 0.85
          }}
        />
      ) : slug && imageValid ? (
        <Box
          component="img" decoding="async" loading="lazy"
          src={`https://cdn.simpleicons.org/${slug}`}
          alt={tech.name}
          onError={() => setImageValid(false)}
          sx={{
            width: 52,
            height: 52,
            flexShrink: 0,
            objectFit: "contain",
            opacity: 0.85
          }}
        />
      ) : (
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 1.5,
            flexShrink: 0,
            bgcolor: TECH_CAT_COLORS[tech.cat] || "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: 800,
              color: NOIR.white,
              lineHeight: 1,
              fontFamily: MONO
            }}
          >
            {tech.name[0]}
          </Typography>
        </Box>
      )}
      <Typography
        sx={{
          fontFamily: MONO,
          fontWeight: 600,
          fontSize: "1.75rem",
          color: "primary.main",
          letterSpacing: "-0.02em",
          whiteSpace: "nowrap"
        }}
      >
        {tech.name}
      </Typography>
    </Box>
  );
});

TechCard.displayName = "TechCard";

function TechMarqueeRow({ items, basePPS = 55, reverse = false, activeCat }: { items: typeof ROW1_TECHS; basePPS?: number; reverse?: boolean; activeCat: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothedVelocity = useSpring(scrollVelocity, { damping: 40, stiffness: 300 });

  const doubledItems = [...items, ...items];

  useAnimationFrame((_, delta) => {
    if (!containerRef.current) return;
    const speedMultiplier = 1 + Math.abs(smoothedVelocity.get()) / 800;
    const step = (basePPS * speedMultiplier * delta) / 1000 * (reverse ? -1 : 1);
    offsetRef.current += step;

    const halfWidth = containerRef.current.scrollWidth / 2;
    if (offsetRef.current > halfWidth) {
      offsetRef.current -= halfWidth;
    }
    if (offsetRef.current < 0) {
      offsetRef.current += halfWidth;
    }
    containerRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
  });

  return (
    <Box sx={{ overflow: "hidden", py: 1 }}>
      <Box
        ref={containerRef}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          willChange: "transform",
          pr: 1.25
        }}
      >
        {doubledItems.map((tech, idx) => (
          <TechCard key={`${tech.name}-${String(idx)}`} tech={tech} activeCat={activeCat} />
        ))}
      </Box>
    </Box>
  );
}

export function PoweredBySection() {
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const categories = {
    "AI / ML": "ai",
    "Languages & Frameworks": "dev",
    "Cloud & Infra": "infra",
    "Data & Storage": "data"
  };

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        py: { xs: 8, md: 10 },
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
      }}
    >
      <Box sx={{ px: { xs: 3, md: 5 }, mb: 8 }}>
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "flex-end" }}
            justifyContent="space-between"
            spacing={3}
          >
            <Stack spacing={1.5}>
              <MetaLabel>Tech Stack</MetaLabel>
              <RevealLines headingLevel={2}>
                <Typography
                  variant="h2"
                  component="h2"
                  sx={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: "clamp(2.8rem, 5vw, 5rem)",
                    textTransform: "lowercase",
                    color: "primary.main",
                    lineHeight: 1
                  }}
                >
                  powered by
                </Typography>
              </RevealLines>
            </Stack>

            <Reveal delay={0.1}>
              <Typography
                component="p"
                sx={{
                  color: "text.secondary",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.9rem",
                  lineHeight: 1.75,
                  maxWidth: 420
                }}
              >
                the full arsenal — from model training and orchestration to deployment, data pipelines, and cloud infrastructure. Every tool chosen deliberately, every stack decision backed by real production experience.
              </Typography>
            </Reveal>
          </Stack>

          <Reveal delay={0.2}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                mt: 5,
                flexWrap: "wrap"
              }}
            >
            {Object.entries(categories).map(([label, slug]) => {
              const isActive = activeCat === slug;
              const activeColor = TECH_CAT_COLORS[slug];
              return (
                <Box
                  component="button"
                  key={slug}
                  onClick={() => setActiveCat((c) => (c === slug ? null : slug))}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    p: "4px 0",
                    // No `outline: none` — these are real buttons that filter the
                    // rack. See the note in AppShell: a local suppression outranks
                    // the theme's `*:focus-visible` ring.
                    outlineOffset: "4px",
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: isActive ? activeColor : activeCat ? "rgba(0,0,0,0.2)" : activeColor,
                      transition: "background-color 0.3s"
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 11,
                      // Dimming used to be rgba(0,0,0,0.3), which is unreadable rather
                      // than de-emphasised. text.disabled is the theme's own
                      // de-emphasis and stays legible.
                      color: isActive ? activeColor : activeCat ? "text.disabled" : "text.secondary",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      fontWeight: isActive ? 700 : 500,
                      transition: "color 0.3s",
                      display: "flex",
                      alignItems: "center",
                      gap: 1
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              );
            })}
            </Box>
          </Reveal>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <TechMarqueeRow items={ROW1_TECHS} basePPS={28} activeCat={activeCat} />
        <TechMarqueeRow items={ROW2_TECHS} basePPS={22} reverse activeCat={activeCat} />
        <TechMarqueeRow items={ROW3_TECHS} basePPS={34} activeCat={activeCat} />
      </Box>
    </Box>
  );
}