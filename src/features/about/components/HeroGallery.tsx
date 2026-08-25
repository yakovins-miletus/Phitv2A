import { useEffect, useRef, useState, type RefObject } from "react";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { motion, useInView } from "motion/react";

import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";
import { useReducedMotion } from "@/shared/motion";

/**
 * WS-05 — right-hand photo strips.
 *
 * Replaces the two right-hand cards (`AboutPageHero2.webp`, `AteneoQR.webp`)
 * that used to sit at `HeroGallery.tsx:64-142`. The gold-bordered left image
 * (`AboutPage1.webp`) is untouched — see `PrimaryImage` below.
 *
 * Six tiles copied from `src/features/hero/heroWallTiles.ts` (the home hero's
 * 29-tile drift wall — WS-03 frees them for reuse elsewhere, but has not
 * landed yet, so paths are copied as literal strings here rather than
 * imported: this file has no dependency on that module's shape or on WS-03
 * landing first). Copying rather than importing also means a future edit to
 * `heroWallTiles.ts` (WS-03 or otherwise) can't silently change what renders
 * here — this list is `HeroGallery`'s own, on `HeroGallery`'s own review bar.
 *
 * Picked for holding up shown directly, in full colour, at a size a reader
 * can actually study — the home wall deliberately does not need that (it is
 * grayscaled, blended, small, and always mid-drift). Spot-checked every
 * candidate before picking:
 *  - `phitopolis-datathon-2k25-the-grads-all-star-showdown-02` — grads at
 *    their workstations, single clean scene, reads as "the actual work."
 *  - `inspiring-the-next-generation-of-quants-...-dlsu-01` — Phitopolis
 *    speakers at a GDSC De La Salle University talk.
 *  - `phitopolis-external-talk-01` — the team at an outside speaking
 *    engagement.
 *  - `expanding-horizons-phitopolis-unveils-its-new-office-02` — the whole
 *    team at the new-office reveal.
 *  - `likhapolis-pagbibigay-kulay-at-saya-02` — a community art CSR event.
 *  - `csr-activity-repainting-community-spaces-01` — a volunteer repainting
 *    a community space.
 *
 * Passed over, and why: several `hero-wall` derivatives are actually
 * collage-of-four-photos composites baked into one file (the 5th/6th
 * anniversary tiles, the 2026 summer outing, "a work day in software
 * engineering", the AWS-certification tile) — those read fine as a small,
 * blended, in-motion background texture but fall apart as a single studied
 * strip: visible seams, mismatched crops, tiny illegible sub-photos. Also
 * passed over: a few tiles whose single subject isn't right for a hero next
 * to the company's own words about itself (a chafing dish of food, an empty
 * classroom, a bottled-water station sign, a very close-up crowd of
 * children's faces) — none of those are wrong to have in the archive, they
 * are just wrong for this spot.
 */
const STRIP_TILES: readonly { readonly id: string; readonly src: string; readonly alt: string }[] = [
  {
    id: "datathon-2k25",
    src: "/images/hero-wall/phitopolis-datathon-2k25-the-grads-all-star-showdown-02.webp",
    alt: "Grads collaborating at their workstations during the Datathon 2K25 all-star showdown",
  },
  {
    id: "gdsc-dlsu",
    src: "/images/hero-wall/inspiring-the-next-generation-of-quants-our-talks-at-the-google-developers-student-club-dlsu-01.webp",
    alt: "Phitopolis speakers at a Google Developer Student Club talk, De La Salle University",
  },
  {
    id: "external-talk",
    src: "/images/hero-wall/phitopolis-external-talk-01.webp",
    alt: "Phitopolis team members at an external speaking engagement",
  },
  {
    id: "new-office",
    src: "/images/hero-wall/expanding-horizons-phitopolis-unveils-its-new-office-02.webp",
    alt: "The Phitopolis team gathered to unveil the new office",
  },
  {
    id: "likhapolis",
    src: "/images/hero-wall/likhapolis-pagbibigay-kulay-at-saya-02.webp",
    alt: "Team members with community art from the Likhapolis event",
  },
  {
    id: "csr-repaint",
    src: "/images/hero-wall/csr-activity-repainting-community-spaces-01.webp",
    alt: "A volunteer repainting a community space during a CSR activity",
  },
] as const;

/** Native intrinsic size hint on every `<img>` — the width/height *attributes*,
 *  not just CSS — so the browser can compute an aspect ratio before the file
 *  decodes. Chosen to match the strip crop (~3:1), not the source frame; the
 *  displayed box is smaller still (flexbox divides the column's fixed height
 *  across `STRIP_TILES.length` items), so this is defense in depth on top of
 *  a layout that already doesn't depend on image intrinsic size for its box
 *  height. No CLS either way. */
const INTRINSIC_WIDTH = 660;
const INTRINSIC_HEIGHT = 220;

/** The slant: a few degrees of `rotateZ`, always negative (top edge leans
 *  toward the top-left, per the brief), with a small per-tile jitter so six
 *  strips don't read as one stamped-out asset repeated six times. This is
 *  the entire "z facing slightly" — no rotateX/rotateY, no perspective. */
const BASE_TILT_DEG = -4;
const TILT_JITTER_DEG: readonly number[] = [0, -1.4, 0.8, -1.8, 0.4, -1];

/** Idle-drift amplitude (px) and per-tile duration (s). Small and slow on
 *  purpose — restraint clause in the brief ("slightly" x2): this is a tilt
 *  that breathes, not a carousel, not a third scroll-linked motion system. */
const DRIFT_Y_PX = 5;
const DRIFT_DURATION_S: readonly number[] = [6.5, 7.8, 6.9, 8.4, 7.2, 7.6];

/**
 * Gate for the idle drift.
 *
 * Mirrors the three stop conditions `DriftWall.tsx` (see its frame loop,
 * roughly lines 318-380) treats as load-bearing — reduced motion, the tab
 * hidden, and out of view — adapted to a much smaller mechanism.
 *
 * `DriftWall` hand-writes a `requestAnimationFrame` loop because it drives 24
 * continuously ping-ponging tiles by writing `transform` straight onto the
 * DOM every frame, and stopping that loop is the only way to stop the work.
 * Six tiles doing one small, bounded keyframe loop don't need that: passed a
 * transform-only keyframe list, `motion/react`'s `animate` prop compiles to
 * the Web Animations API, which runs off the main thread and costs nothing
 * once `useInView` reports false — there is no loop to cancel. `visible`
 * still has to be tracked explicitly on `visibilitychange`, because a
 * backgrounded tab does not un-intersect anything on its own; without it a
 * WAAPI animation would keep quietly running behind the preloader or another
 * tab, same as the failure mode `DriftWall`'s own visibility listener exists
 * to prevent.
 */
function useDriftActive(ref: RefObject<Element | null>): boolean {
  const reduced = useReducedMotion() === true;
  const inView = useInView(ref, { amount: 0 });
  const [visible, setVisible] = useState(() => typeof document === "undefined" || !document.hidden);

  useEffect(() => {
    const onVisibility = () => {
      setVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return !reduced && inView && visible;
}

export function HeroGallery() {
  const theme = useTheme();
  // noSsr: this app is client-rendered only, so reading matchMedia
  // synchronously on first render is safe and avoids ever mounting both the
  // desktop strip column and the mobile stack (which would double the image
  // requests for no reason).
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"), { noSsr: true });

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 880,
        mx: "auto",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(12, 1fr)" },
        gridTemplateRows: { xs: "auto auto", sm: "repeat(2, 1fr)" },
        gap: { xs: 3, sm: 3, md: 4 },
        height: { xs: "auto", sm: 520, md: 600 },
        alignItems: "stretch",
      }}
    >
      <PrimaryImage />
      {isDesktop ? <PhotoStripColumn /> : <MobileStrips />}
    </Box>
  );
}

/** ── Image 1: Primary Focal Centerpiece — unchanged by WS-05 ── */
function PrimaryImage() {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.3, ease: EASE_OUT_EXPO, delay: 0.1 }}
      whileHover={{ scale: 1.02 }}
      sx={{
        gridColumn: { xs: "1 / -1", sm: "1 / 8" },
        gridRow: { xs: "auto", sm: "1 / 3" },
        position: "relative",
        borderRadius: "24px",
        overflow: "hidden",
        border: `2.5px solid ${NOIR.gold}`,
        minHeight: { xs: 320, sm: "auto" },
        transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      }}
    >
      <Box
        component="img"
        decoding="async"
        src="/images/AboutPage1.webp"
        alt="Phitopolis Headquarters & Engineers"
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      {/* Subtle Dark Gradient Overlay for bottom text legibility */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(9, 18, 38, 0.88) 0%, rgba(9, 18, 38, 0.1) 60%)",
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}

/**
 * Desktop (`sm+`): the slanted, drifting strip column.
 *
 * One `useInView` on the column, shared by every strip's drift gate, rather
 * than one observer per tile — six tiles are either all onscreen or all not,
 * since they're stacked in one small column; a per-tile observer would just
 * be five redundant ones.
 */
function PhotoStripColumn() {
  const containerRef = useRef<HTMLDivElement>(null);
  const active = useDriftActive(containerRef);

  return (
    <Box
      ref={containerRef}
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.2, ease: EASE_OUT_EXPO, delay: 0.2 }}
      sx={{
        gridColumn: "8 / 13",
        gridRow: "1 / 3",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 1.5,
        // The BackgroundReveal <img> behind this hero must stay the LCP
        // candidate. These strips are individually far smaller on screen
        // than that full-bleed background, so they never contend for the
        // largest-rendered-element slot — no preload/fetchPriority needed.
      }}
    >
      {STRIP_TILES.map((tile, index) => (
        <PhotoStrip key={tile.id} tile={tile} index={index} active={active} />
      ))}
    </Box>
  );
}

function PhotoStrip({
  tile,
  index,
  active,
}: {
  tile: (typeof STRIP_TILES)[number];
  index: number;
  active: boolean;
}) {
  const tilt = BASE_TILT_DEG + (TILT_JITTER_DEG[index % TILT_JITTER_DEG.length] ?? 0);
  const duration = DRIFT_DURATION_S[index % DRIFT_DURATION_S.length] ?? 7;

  return (
    <Box
      component={motion.div}
      animate={active ? { y: [0, -DRIFT_Y_PX, 0, DRIFT_Y_PX, 0], rotate: tilt } : { y: 0, rotate: tilt }}
      transition={
        active
          ? { duration, ease: "easeInOut", repeat: Infinity, delay: index * 0.35 }
          : { duration: 0.4, ease: EASE_OUT_EXPO }
      }
      sx={{
        position: "relative",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1.5px solid rgba(255, 255, 255, 0.18)",
        boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35)",
        flex: "1 1 0",
        minHeight: 0,
        transformOrigin: "50% 50%",
      }}
    >
      <Box
        component="img"
        decoding="async"
        loading="lazy"
        fetchPriority="low"
        width={INTRINSIC_WIDTH}
        height={INTRINSIC_HEIGHT}
        src={tile.src}
        alt={tile.alt}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(9, 18, 38, 0.55) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}

/**
 * `xs`: a plain stacked pair, no slant, no drift.
 *
 * "A slanted strip column is a desktop idea" (WS-05) — narrow viewports get
 * the first two strips at a size worth looking at instead of six slivers.
 * Same card treatment (border, radius, gradient) the original mobile-stacked
 * `AboutPageHero2`/`AteneoQR` cards used, just pointed at the new imagery.
 */
function MobileStrips() {
  const featured = STRIP_TILES.slice(0, 2);

  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {featured.map((tile, index) => (
        <Box
          key={tile.id}
          component={motion.div}
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASE_OUT_EXPO, delay: 0.2 + index * 0.1 }}
          sx={{
            position: "relative",
            borderRadius: "20px",
            overflow: "hidden",
            border: "1.5px solid rgba(255, 255, 255, 0.18)",
            minHeight: 200,
          }}
        >
          <Box
            component="img"
            decoding="async"
            width={INTRINSIC_WIDTH}
            height={INTRINSIC_HEIGHT}
            src={tile.src}
            alt={tile.alt}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(9, 18, 38, 0.85) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />
        </Box>
      ))}
    </Box>
  );
}
