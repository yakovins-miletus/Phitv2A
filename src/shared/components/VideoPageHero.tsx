import type { ReactNode } from "react";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { Reveal } from "@/shared/components/Reveal";
import type { NavAnchorId } from "@/shared/components/NavbarContext";
import { useNavbarAnchor } from "@/shared/components/navbarHooks";
import { useBackgroundVideo } from "@/shared/components/useBackgroundVideo";
import { MONO, DISPLAY_FONT, TYPE_SCALE, TRACKING } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

/** The `{ webm, mp4, poster }` shape exported by `useBackgroundVideo.ts`
 *  (`BLOG_LOOP`, `CAREERS_LOOP`, `SERVICES_LOOP`). */
export interface HeroLoopSources {
  readonly webm: string;
  readonly mp4: string;
  readonly poster: string;
}

export interface VideoPageHeroProps {
  /** Dark-ground anchor so the navbar inverts its chrome over the band. */
  anchor: NavAnchorId;
  /** Per-surface loop cut from `daily-life.mp4`. */
  loop: HeroLoopSources;
  /** Mono kicker above the headline (rendered uppercase). */
  eyebrow: string;
  /** The one display-size line. */
  headline: string;
  /** `h1` on pages where the hero owns the page heading (blog, services);
   *  `p` where a heading lives further down the page (careers register). */
  headingComponent?: "h1" | "p";
  /** Optional single supporting sentence. */
  lead?: string;
  /** Optional block below the lead (e.g. a filter row) — reveals with the lead. */
  children?: ReactNode;
  /** Optional right-hand column, desktop only (e.g. the blog featured card). */
  aside?: ReactNode;
}

const SCRIM = NOIR.navyFloor; // #04122E — the darkest navy, for the wash

/**
 * The single cinematic video header shared by /blog, /careers and /services.
 *
 * Every one is a full-bleed dark stage: a gated `daily-life` loop under a
 * two-part scrim (vertical fade to near-black at the base + a left wash for
 * text legibility), content pinned bottom-left inside the standard `xl`
 * container, an accent tick + mono eyebrow, a display headline, an optional
 * lead, and an optional desktop-only aside column. The anchor is always
 * dark-ground so the navbar goes light-chrome over the band, and every text
 * layer is `Reveal`-wrapped on the shared staggered cadence.
 *
 * Motion, reduced-motion and low-power handling all come from
 * `useBackgroundVideo()` (poster-only when the visitor opts out) and `Reveal`
 * (fails open) — this component adds no motion of its own.
 */
export function VideoPageHero({
  anchor,
  loop,
  eyebrow,
  headline,
  headingComponent = "h1",
  lead,
  children,
  aside,
}: VideoPageHeroProps) {
  const anchorRef = useNavbarAnchor(anchor, { dark: true });
  const { containerRef, videoRef, shouldLoad, posterOnly } = useBackgroundVideo();

  const hasAside = aside !== undefined && aside !== null && aside !== false;

  return (
    <Box
      ref={anchorRef}
      sx={{
        position: "relative",
        width: "100%",
        minHeight: { xs: "72vh", md: "82vh" },
        display: "flex",
        overflow: "hidden",
        bgcolor: NOIR.navyDeep,
        color: "common.white",
      }}
    >
      {/* Motion layer */}
      <Box
        ref={containerRef}
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          filter: "brightness(0.6) contrast(1.1) saturate(1.04)",
        }}
      >
        <Box
          component="video"
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={loop.poster}
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        >
          {!posterOnly && shouldLoad && (
            <>
              <source src={loop.webm} type="video/webm" />
              <source src={loop.mp4} type="video/mp4" />
            </>
          )}
        </Box>
      </Box>

      {/* Scrim: vertical fade to near-black at the base + a left wash. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(4,18,46,0.58) 0%, rgba(4,18,46,0.10) 30%, rgba(4,18,46,0.34) 62%, rgba(4,18,46,0.92) 100%)`,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, ${SCRIM} 0%, rgba(4,18,46,0.42) 46%, rgba(4,18,46,0) 82%)`,
        }}
      />

      {/* Content — pinned to the base of the stage. */}
      <Container
        maxWidth="xl"
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          pt: { xs: 16, md: 22 },
          pb: { xs: 8, md: 12 },
        }}
      >
        <Grid container spacing={{ xs: 5, md: 8 }} alignItems="flex-end">
          <Grid size={{ xs: 12, md: hasAside ? 7 : 12, lg: hasAside ? 7 : 9 }}>
            <Stack spacing={{ xs: 2.5, md: 3 }}>
              <Reveal>
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: { xs: 28, md: 44 },
                      height: 2,
                      borderRadius: 1,
                      bgcolor: "var(--accent-ink)",
                    }}
                  />
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: MONO,
                      fontSize: TYPE_SCALE.micro,
                      fontWeight: 700,
                      letterSpacing: TRACKING.meta,
                      textTransform: "uppercase",
                      color: "var(--accent-ink)",
                      textShadow: "0 2px 10px rgba(0,0,0,0.7)",
                    }}
                  >
                    {eyebrow}
                  </Typography>
                </Box>
              </Reveal>

              <Reveal delay={0.08}>
                <Typography
                  component={headingComponent}
                  sx={{
                    fontFamily: DISPLAY_FONT,
                    fontWeight: 700,
                    fontSize: { xs: "2.35rem", sm: "3.1rem", md: "4rem" },
                    lineHeight: 1.05,
                    letterSpacing: TRACKING.display,
                    color: "common.white",
                    textWrap: "balance",
                    maxWidth: "20ch",
                    textShadow: "0 4px 28px rgba(0,0,0,0.6)",
                  }}
                >
                  {headline}
                </Typography>
              </Reveal>

              {lead === undefined ? null : (
                <Reveal delay={0.16}>
                  <Typography
                    sx={{
                      fontSize: { xs: "1.05rem", md: "1.22rem" },
                      lineHeight: 1.6,
                      color: "rgba(255,255,255,0.84)",
                      maxWidth: "46ch",
                      textShadow: "0 2px 12px rgba(0,0,0,0.55)",
                    }}
                  >
                    {lead}
                  </Typography>
                </Reveal>
              )}

              {children == null ? null : (
                <Reveal delay={0.22}>
                  <Box sx={{ pt: { xs: 0.5, md: 1 } }}>{children}</Box>
                </Reveal>
              )}
            </Stack>
          </Grid>

          {hasAside && (
            <Grid size={{ xs: 12, md: 5, lg: 5 }} sx={{ display: { xs: "none", lg: "block" } }}>
              <Reveal delay={0.28}>{aside}</Reveal>
            </Grid>
          )}
        </Grid>
      </Container>

      {/* Base hairline — a quiet seam into the light content below. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "1px",
          bgcolor: "rgba(255,255,255,0.12)",
        }}
      />
    </Box>
  );
}
