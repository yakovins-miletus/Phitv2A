import { useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";
import { BEAT_START } from "@/shared/motion/beatThresholds";
import {
  MINI_ESTABLISH,
  laserSweepX,
  rulerTransformOrigin,
} from "@/shared/components/stage/establishChoreo";

gsap.registerPlugin(ScrollTrigger);

export interface MiniEstablishingShotProps {
  indexTag?: string;
  category: string;
  title: string;
  titleAccent?: string;
  tracer?: string;
  status?: string;
  dark?: boolean;
  align?: "left" | "center";
  /**
   * When `true` (the default, i.e. every call site today) the shot owns its own
   * ScrollTrigger and timeline and behaves exactly as it always has. When
   * `false` it renders markup only — no trigger, no timeline — and a parent
   * (`SectionBeat`) drives the same steps off the `.est-*` class hooks so the
   * shot and the section it announces share one clock.
   */
  selfDriven?: boolean;
}

export function MiniEstablishingShot({
  indexTag,
  category,
  title,
  titleAccent,
  tracer,
  status = "ACTIVE",
  dark = false,
  align = "left",
  selfDriven = true,
}: MiniEstablishingShotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const maskWrapRef = useRef<HTMLDivElement>(null);
  const laserBarRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !containerRef.current) return;
      // Presentational mode: a parent owns the beat. Build nothing at all.
      if (!selfDriven) return;

      const c = MINI_ESTABLISH;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: BEAT_START,
          once: true,
        },
      });

      if (metaRef.current) {
        tl.fromTo(
          metaRef.current,
          c.meta.from,
          { ...c.meta.to, duration: c.meta.duration, ease: c.meta.ease },
          c.meta.at,
        );
      }

      if (rulerRef.current) {
        tl.fromTo(
          rulerRef.current,
          { ...c.ruler.from, transformOrigin: rulerTransformOrigin(align) },
          { ...c.ruler.to, duration: c.ruler.duration, ease: c.ruler.ease },
          c.ruler.at,
        );
      }

      if (maskWrapRef.current) {
        tl.fromTo(
          maskWrapRef.current,
          c.mask.from,
          { ...c.mask.to, duration: c.mask.duration, ease: c.mask.ease },
          c.mask.at,
        );
      }

      // A transform, not `left` — the sweep composites instead of forcing layout.
      if (laserBarRef.current) {
        const bar = laserBarRef.current;
        tl.fromTo(
          bar,
          c.laser.from,
          {
            ...c.laser.to,
            x: () => laserSweepX(bar),
            duration: c.laser.duration,
            ease: c.laser.ease,
          },
          c.laser.at,
        ).to(bar, { ...c.laserOut.to, duration: c.laserOut.duration }, c.laserOut.at);
      }
    },
    { scope: containerRef, dependencies: [reduced, align, dark, selfDriven] },
  );

  return (
    <Box
      ref={containerRef}
      sx={{
        width: "100%",
        mb: { xs: 4, md: 6 },
        textAlign: align,
        overflow: "hidden",
      }}
    >
      {/* Top Coordinate Kicker Bar */}
      <Box
        ref={metaRef}
        className="est-meta"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: align === "center" ? "center" : "flex-start",
          gap: 2,
          mb: 1.5,
          flexWrap: "wrap",
        }}
      >
        {indexTag && (
          <Typography
            variant="overline"
            sx={{
              fontFamily: MONO,
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: dark ? NOIR.gold : NOIR.goldDark,
            }}
          >
            {indexTag}
          </Typography>
        )}

        <Typography
          variant="overline"
          sx={{
            fontFamily: MONO,
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: dark ? NOIR.frost : NOIR.navyField,
          }}
        >
          // {category}
        </Typography>

        {status && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              ml: align === "center" ? 0 : "auto",
              px: 1.25,
              py: 0.25,
              borderRadius: "4px",
              backgroundColor: dark ? "rgba(255, 255, 255, 0.05)" : "rgba(10, 42, 102, 0.05)",
              border: `1px solid ${dark ? "rgba(255, 255, 255, 0.12)" : "rgba(10, 42, 102, 0.12)"}`,
            }}
          >
            <Box
              sx={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                backgroundColor: NOIR.live,
              }}
            />
            <Typography
              variant="overline"
              sx={{
                fontFamily: MONO,
                fontSize: "0.625rem",
                letterSpacing: "0.12em",
                color: dark ? "rgba(255, 255, 255, 0.7)" : "rgba(10, 42, 102, 0.7)",
              }}
            >
              {status}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Kinetic Caliper Hairline Ruler */}
      <Box
        ref={rulerRef}
        className="est-ruler"
        sx={{
          height: "1px",
          width: "100%",
          maxWidth: align === "center" ? 360 : 280,
          mx: align === "center" ? "auto" : 0,
          background: `linear-gradient(90deg, ${dark ? NOIR.gold : NOIR.goldDark}, ${dark ? "rgba(255, 255, 255, 0.2)" : "rgba(10, 42, 102, 0.2)"})`,
          mb: 2.5,
        }}
      />

      {/* Mask Container with Laser Sweep */}
      <Box sx={{ position: "relative", width: "100%" }}>
        {!reduced && (
          <Box
            ref={laserBarRef}
            className="est-laser"
            aria-hidden="true"
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              // Anchored at the left edge; the sweep is a transform (see
              // `laserSweepX`), never an animated `left`.
              left: 0,
              width: "2px",
              backgroundColor: dark ? NOIR.gold : NOIR.goldDark,
              boxShadow: dark
                ? `0 0 12px ${NOIR.gold}`
                : `0 0 12px ${NOIR.goldDark}`,
              zIndex: 3,
              pointerEvents: "none",
            }}
          />
        )}

        <Box
          ref={maskWrapRef}
          className="est-mask"
          sx={{
            position: "relative",
            zIndex: 1,
            clipPath: reduced ? "none" : "inset(0% 0% 0% 0%)",
          }}
        >
          {/* Headline */}
          <Box sx={{ mb: tracer ? 2 : 0 }}>
            <Typography
              variant="h2"
              component="h3"
              sx={{
                fontFamily: DISPLAY_FONT,
                fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.85rem" },
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.025em",
                color: dark ? NOIR.frost : NOIR.navyField,
                textTransform: "none",
              }}
            >
              {title}{" "}
              {titleAccent && (
                <Box
                  component="span"
                  sx={{
                    color: dark ? NOIR.gold : NOIR.goldDark,
                    display: "inline",
                    fontWeight: 800,
                  }}
                >
                  {titleAccent}
                </Box>
              )}
            </Typography>
          </Box>

          {/* L1 Tracer Context */}
          {tracer && (
            <Box
              sx={{
                maxWidth: align === "center" ? "68ch" : "60ch",
                mx: align === "center" ? "auto" : 0,
                pl: align === "center" ? 0 : 2,
                borderLeft: align === "center" ? "none" : `2px solid ${dark ? NOIR.gold : NOIR.goldDark}`,
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "0.8125rem", md: "0.875rem" },
                  lineHeight: 1.6,
                  letterSpacing: "0.01em",
                  color: dark ? "rgba(255, 255, 255, 0.78)" : "rgba(10, 42, 102, 0.82)",
                }}
              >
                {tracer}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
