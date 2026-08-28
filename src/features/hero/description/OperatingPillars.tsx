import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { CONTENT } from "@/shared/content";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { homeSection, sectionOrder } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { NOIR } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const GROUND = GROUNDS[homeSection("hero-pillars").ground ?? "void"];

interface Pillar {
  id: string;
  name: string;
  detail: string;
  image: string;
  alt: string;
}

const SCRIM = `linear-gradient(to right, rgba(${NOIR.navyInkRgb}, 0.15) 0%, rgba(${NOIR.navyInkRgb}, 0.5) 45%, rgba(${NOIR.navyInkRgb}, 0.94) 75%, rgba(${NOIR.navyInkRgb}, 0.98) 100%)`;

export function OperatingPillars() {
  const { pillars } = CONTENT.hero.salesPitch as { pillars: readonly Pillar[] };
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !wrapRef.current || !trackRef.current) return;

      const track = trackRef.current;
      const wrap = wrapRef.current;

      const distance = track.scrollWidth - window.innerWidth;
      if (distance <= 0) return;

      const tween = gsap.to(track, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: () => `+=${distance + window.innerHeight * 0.4}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          refreshPriority: refreshPriorityFor(sectionOrder("hero-pillars")),
          onUpdate: (self) => {
            const idx = Math.min(
              pillars.length - 1,
              Math.floor(self.progress * pillars.length)
            );
            setActiveIndex(idx);
          },
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
      };
    },
    { scope: wrapRef, dependencies: [reduced, pillars.length] }
  );

  return (
    <SectionBeat
      section={homeSection("hero-pillars")}
      sx={{ minHeight: "auto", p: 0 }}
    >
      <Box
        ref={wrapRef}
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: "auto", md: "100dvh" },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          py: { xs: 8, md: 6 },
          bgcolor: GROUND.bg,
        }}
      >
        {/* Sticky Editorial Header */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "1400px",
            mx: "auto",
            px: { xs: 3, sm: 6, md: 8, lg: 10 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 2,
            borderBottom: "1px solid rgba(10, 42, 102, 0.12)",
            zIndex: 10,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.72rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: NOIR.navyField,
                fontWeight: 700,
              }}
            >
              02 / OPERATING PILLARS
            </Typography>
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                bgcolor: NOIR.gold,
              }}
            />
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.68rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "text.secondary",
                display: { xs: "none", sm: "block" },
              }}
            >
              CORE DISCIPLINES
            </Typography>
          </Box>

          {/* Active Pillar Counter */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.8rem",
                fontWeight: 700,
                color: NOIR.navyField,
                letterSpacing: "0.1em",
              }}
            >
              {`0${activeIndex + 1}`}
            </Typography>
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.75rem",
                color: "rgba(10, 42, 102, 0.4)",
              }}
            >
              / {`0${pillars.length}`}
            </Typography>
          </Box>
        </Box>

        {/* Horizontal Card Track */}
        <Box
          ref={trackRef}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 4, md: 6, lg: 8 },
            px: { xs: 3, sm: 6, md: 8, lg: 10 },
            py: { xs: 4, md: 2 },
            width: { xs: "100%", md: "max-content" },
            flexDirection: { xs: "column", md: "row" },
            willChange: { md: "transform" },
          }}
        >
          {pillars.map((pillar, idx) => (
            <CinematicPillarCard
              key={pillar.id}
              pillar={pillar}
              index={idx}
              isActive={idx === activeIndex}
            />
          ))}
        </Box>

        {/* Bottom Status / Navigation Rail */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "1400px",
            mx: "auto",
            px: { xs: 3, sm: 6, md: 8, lg: 10 },
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "space-between",
            pt: 2,
            borderTop: "1px solid rgba(10, 42, 102, 0.08)",
            zIndex: 10,
          }}
        >
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            SCROLL TO EXPLORE DISCIPLINES
          </Typography>

          {/* Progress Dot Indicators */}
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            {pillars.map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: i === activeIndex ? 24 : 6,
                  height: 6,
                  borderRadius: "3px",
                  bgcolor: i === activeIndex ? NOIR.gold : "rgba(10, 42, 102, 0.15)",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </SectionBeat>
  );
}

function CinematicPillarCard({
  pillar,
  index,
  isActive,
}: {
  pillar: Pillar;
  index: number;
  isActive: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showPlaceholder = !pillar.image || imageFailed;

  return (
    <Box
      sx={{
        position: "relative",
        width: { xs: "100%", sm: "85vw", md: "70vw", lg: "64vw" },
        maxWidth: "960px",
        height: { xs: "480px", md: "58vh" },
        minHeight: "440px",
        borderRadius: "1.75rem",
        overflow: "hidden",
        bgcolor: NOIR.navyDeep,
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: isActive
          ? "0 28px 60px -12px rgba(6, 24, 59, 0.35), 0 0 0 1px rgba(255, 199, 44, 0.3)"
          : "0 16px 36px -8px rgba(6, 24, 59, 0.2)",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        flexShrink: 0,
      }}
    >
      {/* Background Photography / Placeholder */}
      {!showPlaceholder ? (
        <Box
          component="img"
          src={pillar.image}
          alt={pillar.alt}
          onError={() => setImageFailed(true)}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: isActive ? "scale(1.03)" : "scale(1)",
            transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      ) : (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background: `repeating-linear-gradient(-45deg, rgba(${NOIR.goldRgb}, 0.04) 0px, rgba(${NOIR.goldRgb}, 0.04) 2px, transparent 2px, transparent 16px), ${NOIR.navyDeep}`,
          }}
        />
      )}

      {/* Cinematic Navy Scrim */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: SCRIM,
        }}
      />

      {/* Card Content & Typographic Layout */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: { xs: 3.5, sm: 5, md: 6 },
        }}
      >
        {/* Top Card Bar: Numerical Index & Tag */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 1.75,
              py: 0.5,
              borderRadius: "9999px",
              border: "1px solid rgba(255, 199, 44, 0.3)",
              bgcolor: "rgba(6, 24, 59, 0.6)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.68rem",
                color: NOIR.gold,
                fontWeight: 700,
                letterSpacing: "0.15em",
              }}
            >
              PILLAR // 0{index + 1}
            </Typography>
          </Box>

          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255, 255, 255, 0.4)",
            }}
          >
            PHITOPOLIS R&D
          </Typography>
        </Box>

        {/* Bottom Card Content: Name & Detail */}
        <Box
          sx={{
            maxWidth: { xs: "100%", md: "52ch" },
            alignSelf: "flex-end",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Typography
            component="h3"
            sx={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 700,
              fontSize: { xs: "1.75rem", sm: "2.1rem", md: "2.4rem" },
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
            }}
          >
            {pillar.name}
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: "0.95rem", md: "1.1rem" },
              lineHeight: 1.6,
              color: "rgba(255, 255, 255, 0.78)",
              letterSpacing: "-0.01em",
            }}
          >
            {pillar.detail}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

