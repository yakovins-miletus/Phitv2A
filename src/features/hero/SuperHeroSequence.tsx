import { Suspense, lazy, useRef, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { alpha } from "@mui/material/styles";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { RouterLink } from "@/shared/components/RouterLink";
import { Magnetic } from "@/shared/components/Magnetic";
import { useStagePresence } from "@/shared/components/StageSection";
import { STAGE_ATTR, setActiveSection } from "@/shared/sections";
import { NAV_ANCHORS, useNavbar } from "@/shared/components/NavbarContext";
import { HeroCanvas as LegacyHeroCanvas, type HeroCanvasHandle } from "./HeroCanvas";
import { WORDMARK_INSET_MD, WORDMARK_INSET_SM } from "./heroPlaneRenderer";
import { useHeroModeState, useHeroTrack, setHeroTrack } from "./heroModeStore";
import { useHeroBgModeState } from "./heroBgModeStore";
import { setSkyMode, useSkyModeState } from "./skyModeStore";
import { useBackgroundVideo, HERO_BG_VIDEO } from "@/shared/components/useBackgroundVideo";
import { ParallaxHeroBg } from "./ParallaxHeroBg";
import { NodeSpecDrawer } from "./components/NodeSpecDrawer";
/**
 * The 3D PoC gallery.
 *
 * `React.lazy` keeps `three` + `@react-three/fiber` + `drei` out of the route chunk
 * and behind a dynamic import that only runs when someone flips the toggle, so a
 * visitor who never opens it pays nothing. Each of the four *scenes* is then lazy
 * again inside `playground/variants.ts`, so switching a tab fetches only that scene.
 *
 * `docs/hero-upgrade/README.md` standing rule 1 ("the 3D playground variant is out
 * of scope; `PlaygroundScene.tsx` and `R3FHeroCanvas.tsx` internals must show no
 * diff") is **retired as of this change** — the gallery IS the work now, and
 * `PlaygroundScene.tsx` is deleted. That file records the retirement.
 */
const R3FHeroCanvas = lazy(() =>
  import("./R3FHeroCanvas").then((m) => ({ default: m.R3FHeroCanvas })),
);
/**
 * The gunshot's drift wall — 24 photographs from the blog library, drifting behind a
 * perspective tilt. Replaces the two 50vh split panes that auto-panned here.
 *
 * Lazy for the same reason as the gallery above: it drags `driftWall.css` and ~2.4MB
 * of imagery, none of which a visitor who bounces off the first viewport should pay
 * for. Unlike the gallery it is not behind a toggle — it is on the default scroll
 * path — so the chunk is prefetched during idle (see the effect near the stage
 * latch), and only the *fetch* is deferred, never the decision.
 */
const HeroImageWall = lazy(() =>
  import("./HeroImageWall").then((m) => ({ default: m.HeroImageWall })),
);
import { heroStage, heroVars, sameStage, writeHeroVars, type HeroStage } from "./heroVars";
import { DWELL_END } from "./heroPhases";
import { NOIR, DAWN } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { useReducedMotion, usePreloaderReady } from "@/shared/motion";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The hero holds for viewport height to give room for 3 logo phases,
 *  an empty dwell threshold, the gunshot transition, smoking drift, and AT PHITOPOLIS mini transformation. */
/** Pin distance: 1800% for the hero animation + 100% extra overlap window
 *  where the overlay sheet slides up over the still-pinned hero. */
/**
 * How tall the pin is.
 *
 * Was `+=1900%` — nineteen viewport heights of scroll for nine phases, most of it
 * buffer. The phase boundaries in `heroPhases.ts` are all *fractions* of the pin's
 * 0..1 progress, so shortening the pin moves none of them and every assertion in
 * `tests/motion/hero-phases.test.ts` holds unchanged; only the amount of wheel
 * travel each fraction costs the reader changes. Eight is still generous.
 */
const HERO_PIN_DISTANCE = "+=800%";

/** Pin progress at which the drift wall's chunk is fetched. The gunshot starts at
 *  0.60, so this buys roughly four viewports of scroll to cover the request. */
const WALL_WARM_AT = 0.2;

/**
 * The dark-room flip.
 *
 * The Monolith room is near-black (`PALETTE.navyInk`), and the hero's own chrome
 * is designed for a near-white card — navy headline, navy motto, white pills. Left
 * alone, Monolith rendered navy text on black. These selectors invert the chrome
 * for exactly as long as the room under it is dark.
 *
 * **Two attributes, not one.** `data-hero-mode` is structural — which mode is
 * mounted — and gates the things that have no meaning in Monolith: the CSS dawn
 * sky, the wordmark lockup. `data-sky` is the *colour* question, and Monolith's
 * day cycle can answer it either way: at noon the room is a pale blue sky over a
 * lit floor, and frost-on-frost chrome would be as unreadable there as navy-on-black
 * is at midnight. Splitting them is what lets the same command that raises the sun
 * hand the page back its light-ground chrome.
 *
 * Static, and attached once to the container's `sx`: Emotion serialises this object
 * a single time at mount and each flip is then a lone attribute write, not a
 * restyle. Nothing here runs per frame.
 *
 * Contrast, both directions, measured against the tokens in `palette.ts`:
 * `frost` on `navyInk` is 17.43:1; the pills invert to `navyField` text on `frost`,
 * which is the same pair the site already ships at 12.73:1.
 */
const PLAYGROUND_FLIP_SX = {
  '&[data-hero-mode="monolith"]': {
    "& .hero-card": { backgroundColor: NOIR.navyInk },
    "& .hero-sky": { opacity: 0 },
    // Show wordmark frame in monolith mode (positioned on left lockup) and don't fade on scroll
    "& .hero-wordmark-frame": { opacity: "1 !important" },
    // Hide centered motto block in monolith mode (left lockup contains motto)
    "& .hero-motto-block": { display: "none" },
    "& .hero-directory": { display: "none" },
  },
  '&[data-sky="dark"]': {
    // `.hero-wordmark` is deliberately absent here. It used to be flipped to
    // frost alongside the motto; with the frame hidden that rule only recoloured
    // something nobody can see.
    "& .hero-motto": { color: NOIR.frost },
    "& .hero-eyebrow": { color: `rgba(${NOIR.frostRgb}, 0.72)` },
    // The scroll cue was missing from this list entirely, and it paints
    // `text.secondary` — navy at 0.82 — so on the dark room it was not dim, it
    // was gone. Its *position* is untouched; this is the contrast bug, not the
    // alignment one.
    "& .hero-scroll-cue": { color: `rgba(${NOIR.frostRgb}, 0.72)` },
    // The unfilled part of the gunshot meter. Navy at 0.18 is invisible on a
    // dark room, which would leave a gold fill floating on nothing.
    "& .hero-gunshot-track": { backgroundColor: `rgba(${NOIR.frostRgb}, 0.22)` },
    "& .hero-pill": {
      backgroundColor: `rgba(${NOIR.frostRgb}, 0.08)`,
      boxShadow: "none",
      "& .btn-text": { color: NOIR.frost },
    },
  },
  "& .hero-card, & .hero-motto, & .hero-eyebrow, & .hero-scroll-cue, & .hero-gunshot-track, & .hero-pill":
    {
      transition: "background-color 0.32s ease, color 0.32s ease, border-color 0.32s ease",
    },
  "@media (prefers-reduced-motion: reduce)": {
    "& .hero-card, & .hero-motto, & .hero-eyebrow, & .hero-scroll-cue, & .hero-gunshot-track, & .hero-pill":
      {
        transition: "none",
      },
  },
} as const;
const ANIM_LIMIT = 700 / 800;

/**
 * How far it is to the gunshot, as a hairline that fills.
 *
 * The hero pins for eight viewports and the gunshot does not begin until
 * `DWELL_END` — six of them. Before this there was nothing on screen saying so,
 * which makes the pin feel broken rather than long: the reader scrolls, the page
 * does not advance, and they have no way to know whether that is the design or a
 * stuck page. A meter turns "nothing is happening" into "something is coming",
 * which is a different experience of the same six viewports.
 *
 * **Pure CSS, no JavaScript.** The fill reads `--hp` — the same custom property
 * the pin driver already writes once per frame — through a `calc` in a static
 * `sx` object. Emotion serialises this once at mount and scroll never touches
 * React, which is the property the whole hero rests on. A `<progress>` or a
 * state-driven width would put a render on every scroll tick and undo it.
 *
 * The divisor is `DWELL_END` imported from `heroPhases.ts`, not a literal: that
 * file owns where the gunshot starts, and a meter that fills to a different
 * number than the thing it is measuring is worse than no meter.
 */
const GUNSHOT_TRACK_SX = {
  position: "relative",
  width: 132,
  height: "2px",
  borderRadius: "1px",
  overflow: "hidden",
  backgroundColor: "rgba(10, 42, 102, 0.18)",
  "& .hero-gunshot-fill": {
    position: "absolute",
    inset: 0,
    backgroundColor: NOIR.gold,
    transformOrigin: "left center",
    // `clamp` rather than `min`: progress can overshoot 1 (the driver clamps at
    // 1.1) and a scaleX above 1 would run the fill out past its own track.
    transform: `scaleX(clamp(0, calc(var(--hp, 0) / ${DWELL_END}), 1))`,
  },
} as const;

/**
 * The three directory link pills below the hero card.
 *
 * These were three byte-identical 17-line `sx` blocks — a repeated treatment, so it
 * earns a token rather than a third copy. Glass is safe here: the pills are siblings
 * of the scaled card, not children of it, so nothing re-samples their backdrop per
 * frame. (Anything *inside* the pin must stay opaque — see the note on the card's own
 * bgcolor.)
 *
 * The old `transition: all 0.9s` is gone twice over: `all` swept in `backdrop-filter`,
 * which recomputes the blur on every frame of the transition, and 0.9s is nearly three
 * times the interaction ceiling.
 */
const LINK_PILL_SX = {
  borderRadius: "100px",
  textDecoration: "none !important",
  border: "none",
  backgroundColor: "#FFFFFF",
  boxShadow: "0 4px 16px rgba(10, 42, 102, 0.08)",
  transition: "all 0.25s ease",
  "&, & *": {
    textDecoration: "none !important",
  },
  "@media (hover: hover)": {
    "&:hover": {
      transform: "translateY(-2px)",
      backgroundColor: NOIR.navyField,
      boxShadow: `0 4px 20px rgba(10, 42, 102, 0.25), 0 0 12px ${NOIR.gold}40`,
      "& .btn-text": {
        color: `${NOIR.gold} !important`,
      },
    },
  },
  "&:active": { transform: "translateY(0)" },
  "@media (prefers-reduced-motion: reduce)": {
    "&:hover, &:active": { transform: "none" },
  },
} as const;

// Stage 01: Hero Signal Core Landing Stage (Pinned scroll sequence with 3D-to-2D transition)
//
// Scroll drives this sequence WITHOUT React state. `onUpdate` writes CSS custom
// properties onto the hero container and pushes progress into the canvas through an
// imperative handle; every `sx` below is a static object that reads `var(--hp-*)`, so
// Emotion serializes each rule once at mount instead of re-injecting it per frame.
// Only the coarse `stage` — nine booleans that flip ~4 times across the whole pin —
// lives in state, because conditional mounts cannot be expressed in CSS.
//
// Before this change one scroll pass injected 1,335 stylesheet rules and dropped 32% of
// frames; see docs/perf-baseline.md.

/** The hero's shared left/right inset, at every anchor that lines up against the
 *  header's own gutter: the mode badge, the (removed) directory, the scroll cue.
 *  72 on desktop is `AppShell`'s `minimal` toolbar padding, not a chosen number —
 *  see the badge's own comment for the measurement. */
const HERO_GUTTER = { xs: 32, md: 72 } as const;

export function HeroSignalCore() {
  const pinRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  // Stage 4: the scaled card's own element — the sky/disc parallax publisher
  // target. A distinct ref from `containerRef` (the outer #hero box) so the
  // vars are written on the same element the sky Box is a direct child of.
  const cardRef = useRef<HTMLElement>(null);
  const canvasHandleRef = useRef<HeroCanvasHandle | null>(null);
  const reduced = useReducedMotion();
  const ready = usePreloaderReady();

  /**
   * Hero mode ("legacy" the 2D dot plane, or "monolith" the R3F room) and the
   * active time of day, read from `heroModeStore.ts`.
   *
   * Both used to be `useState` owned here. They moved out because the command
   * palette — mounted in `AppShell`, a sibling subtree with nothing shared above
   * it but `NavbarContext` — needs to both *set* these (running a command) and
   * *read* them back (to mark the live one `● ACTIVE`), which a value owned
   * inside this component cannot support without a new provider. See
   * `heroModeStore.ts` for the full rationale.
   *
   * The page chrome outside the canvas — the navbar, the EyeFlow chapter rail,
   * this hero's own mode badge — reads `dayPhase` through the same `isPhaseDark`
   * every mode-aware surface uses, so none of them can disagree about the sky
   * they are describing.
   */
  const { mode } = useHeroModeState();
  const use3D = mode === "monolith";
  const heroTrack = useHeroTrack();
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNodeSelect = (index: number) => {
    setSelectedNodeIndex(index);
    setDrawerOpen(true);
  };

  const { mode: skyMode } = useSkyModeState();
  const { mode: heroBgMode } = useHeroBgModeState();
  /** Video is only meaningful over the Monolith room — the legacy 2D canvas
   *  has no notion of a background mode at all. */
  const useVideoBg = false; // Disabled to use ParallaxHeroBg instead
  const heroBgVideo = useBackgroundVideo();

  /**
   * Ref-based parallax — no React re-renders.
   *
   * The old `useState` approach fired `setVideoParallax` on every mousemove,
   * which is a React setState at 60 fps — 60 commits/sec for a CSS transform
   * that could have been a direct DOM write. This version stores the target in
   * a ref, and a rAF loop smoothly interpolates the video element's transform
   * directly, never touching React state.
   */
  const parallaxTarget = useRef({ x: 0, y: 0 });
  const parallaxCurrent = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!useVideoBg || reduced) return;

    const onMove = (e: MouseEvent) => {
      parallaxTarget.current.x = (e.clientX / window.innerWidth - 0.5) * -18;
      parallaxTarget.current.y = (e.clientY / window.innerHeight - 0.5) * -18;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    let raf: number;
    const tick = () => {
      const cur = parallaxCurrent.current;
      const tgt = parallaxTarget.current;
      // Smooth lerp — 8% per frame ≈ 120ms settle at 60fps
      cur.x += (tgt.x - cur.x) * 0.08;
      cur.y += (tgt.y - cur.y) * 0.08;

      const video = heroBgVideo.videoRef.current;
      if (video) {
        video.style.transform =
          `translate3d(${cur.x}px, ${cur.y}px, 0) scale(1.04)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [useVideoBg, reduced, heroBgVideo.videoRef]);

  /**
   * Ping-pong video playback.
   *
   * The hero video (`hero-night-to-dawn`) is an 8-second night→dawn
   * transition. With `loop`, it hard-cuts from dawn back to night — a jarring
   * snap. This effect lets the video play forward normally (the browser's
   * native decoder handles it perfectly), then when it reaches the end,
   * manually scrubs backward using rAF. For a ~300KB fully-buffered clip,
   * backward seeking is instantaneous.
   */
  useEffect(() => {
    if (!useVideoBg || reduced) return;
    const video = heroBgVideo.videoRef.current;
    if (!video) return;

    // Disable native loop — we own the playback direction
    video.loop = false;

    let direction: 1 | -1 = 1;
    let rafId: number;
    let lastTs = 0;

    const step = (ts: number) => {
      if (lastTs === 0) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.05); // cap at 50ms
      lastTs = ts;

      if (video.readyState >= 3 && video.duration > 0) {
        if (direction === 1) {
          // Forward: let native playback handle it, just watch for the end
          if (video.currentTime >= video.duration - 0.08) {
            direction = -1;
            video.pause();
          }
        } else {
          // Backward: manually scrub currentTime
          const next = video.currentTime - dt;
          if (next <= 0.08) {
            video.currentTime = 0.08;
            direction = 1;
            void video.play().catch(() => {});
          } else {
            video.currentTime = next;
          }
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [useVideoBg, reduced, heroBgVideo.videoRef]);

  /**
   * Eager video preload.
   *
   * When monolith mode is active, preload the hero video sources via `<link
   * rel="preload">` so they are already in the browser cache when the user
   * switches to video background mode. The files are tiny (~300KB mp4,
   * ~170KB webm) so this is effectively free.
   */
  useEffect(() => {
    if (!use3D || heroBgVideo.posterOnly) return;

    const links: HTMLLinkElement[] = [];
    for (const [src, type] of [
      [HERO_BG_VIDEO.mp4, "video/mp4"],
      [HERO_BG_VIDEO.webm, "video/webm"],
    ] as const) {
      // Don't duplicate if already present
      if (document.querySelector(`link[rel="preload"][href="${src}"]`)) continue;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "video";
      link.type = type;
      link.href = src;
      document.head.appendChild(link);
      links.push(link);
    }

    return () => {
      for (const link of links) link.remove();
    };
  }, [use3D, heroBgVideo.posterOnly]);

  const [stage, setStage] = useState<HeroStage>(() => heroStage(0, reduced === true));
  const stageRef = useRef(stage);

  /**
   * The drift wall mounts once and never unmounts.
   *
   * `stage.gunshot` flips at pin progress ~0.601, a boundary a reader crosses by
   * scrolling two viewports — and crossing it backwards on a plain `stage.gunshot &&`
   * gate would tear the wall down, reset all four column offsets to 0 (the drift
   * visibly snaps) and re-run 24 image decodes. Latching costs ~100 contained,
   * invisible DOM nodes for the rest of the visit; `opacity: var(--hp-g)` hides it for
   * free and `stage.wallDrift` stops its rAF, so an invisible wall animates nothing.
   *
   * Latched from inside the pin's `onUpdate` alongside the `setStage` that would have
   * driven it, rather than from an effect watching `stage.gunshot`. Same value, one
   * fewer render pass, and it keeps the setState in an event handler where it belongs
   * — the effect form is exactly what `react-hooks/set-state-in-effect` exists to
   * catch. The seeding effect below never needs to latch: it runs at progress 0, where
   * `gunshot` is false by construction.
   */
  const [wallMounted, setWallMounted] = useState(false);

  /**
   * One-shot warm-up for the wall's chunk, fired from the pin driver below.
   *
   * Without it the lazy import starts at progress 0.601 — the same instant the wall
   * is supposed to appear — and the Suspense boundary shows its `null` fallback for
   * however long the fetch takes. Verified: seeking straight to p = 0.65 renders the
   * navy wash with no wall behind it.
   *
   * Hung off scroll rather than off an idle callback at mount, for two reasons. It
   * cannot compete with the preloader's own warmup, because nothing scrolls while the
   * overlay is up. And it does not depend on `usePreloaderReady()`, which never
   * resolves if the entrance warmup stalls — an idle prefetch gated on it silently
   * never runs, which is exactly the case that needs the prefetch most.
   *
   * `WALL_WARM_AT` is four viewports of scroll ahead of the gunshot: far enough to
   * hide the fetch, late enough that a reader who bounces off the first screen never
   * pays for it.
   */
  const wallWarmedRef = useRef(false);

  useStagePresence(containerRef, "hero");
  const { registerAnchor } = useNavbar();

  /**
   * Who owns the navbar's light/dark, and when.
   *
   * Two things can put a dark ground under the header, and they take turns rather
   * than fight. Before the pin's dwell ends, what is under the navbar is the hero
   * card — so if the gallery is on, its *sky* decides, and dragging the slider to
   * noon hands the navbar back its navy chrome. From the dwell onward the pin's
   * own gunshot wash is what is up there, and `stage.navDark` decides as it always
   * has.
   *
   * Without this the gallery shipped navy-on-near-black: the header, the EyeFlow
   * chapter rail and the hero's own scroll cue all painted light-ground colours
   * over a room that had gone black under them, because nothing ever told them.
   */
  /** Is the ground under the hero's chrome dark right now? Off, it is the pale
   *  dawn card. On, it is Monolith's room in night mode — Monolith is the only
   *  mode with a sky toggle, so this is `skyMode` gated on being in that mode.
   *  Reads the user's own choice from `skyModeStore.ts` rather than
   *  `isPhaseDark` (which the room's one-authored-look days answered on its
   *  own); the toggle button below is what actually sets it. */
  const roomIsDark = use3D && skyMode === "night";

  const navActive = stage.navActive || use3D;
  const navDark = use3D && !stage.navActive ? roomIsDark : stage.navDark;

  useEffect(() => {
    if (navActive) {
      registerAnchor(NAV_ANCHORS.HERO_GUNSHOT, true, navDark);
    } else {
      registerAnchor(NAV_ANCHORS.HERO_GUNSHOT, false, false);
    }
    return () => {
      registerAnchor(NAV_ANCHORS.HERO_GUNSHOT, false, false);
    };
  }, [navActive, navDark, registerAnchor]);

  // Seed the custom properties before first paint so the hero renders its settled state
  // even if no scroll ever happens (reduced motion, or a user who never scrolls).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isReduced = reduced === true;
    writeHeroVars(el, heroVars(0, isReduced));
    if (pinRef.current) {
      writeHeroVars(pinRef.current, heroVars(0, isReduced));
    }
    const next = heroStage(0, isReduced);
    stageRef.current = next;
    setStage(next);
  }, [reduced]);

  useGSAP(
    () => {
      if (reduced) return;

      const el = containerRef.current;
      if (!el) return;

      ScrollTrigger.create({
        trigger: pinRef.current,
        start: "top top",
        end: HERO_PIN_DISTANCE,
        scrub: 0.6,
        pin: true,
        onUpdate: (self) => {
          // Clamp so animations complete at 1800/1900 of the pin.
          // The final 100vh of pin time is dead air for the overlay transition.
          const p = Math.min(1.1, self.progress / ANIM_LIMIT);

          // Per-frame: one batch of custom-property writes. No React render.
          writeHeroVars(el, heroVars(p, false));
          if (pinRef.current) {
            writeHeroVars(pinRef.current, heroVars(p, false));
          }
          canvasHandleRef.current?.setProgress(p);

          // Parallax drift: during the overlap phase (progress > ANIM_LIMIT),
          // translate the hero content upward at ~30% of the scroll rate.
          // This makes the hero appear to recede slowly while the overlay
          // sheet slides over it at full scroll speed — true parallax.
          if (self.progress > ANIM_LIMIT) {
            const overlapT = (self.progress - ANIM_LIMIT) / (1 - ANIM_LIMIT);
            const drift = overlapT * -30; // up to -30vh upward drift
            el.style.transform = `translateY(${drift}vh)`;
          } else {
            el.style.transform = "";
          }

          // Update active section ID dynamically to match the current phase
          if (p < 0.20) {
            setActiveSection("hero-flatten");
          } else if (p < 0.35) {
            setActiveSection("hero-align");
          } else if (p < 0.50) {
            setActiveSection("hero-reveal");
          } else if (p < 0.60) {
            setActiveSection("hero-dwell");
          } else {
            setActiveSection("hero");
          }

          // Coarse state: only commit when a boolean actually flips, which happens
          // roughly four times across the whole 30-viewport pin.
          if (!wallWarmedRef.current && p > WALL_WARM_AT) {
            wallWarmedRef.current = true;
            void import("./HeroImageWall");
          }

          const next = heroStage(p, false);
          if (!sameStage(stageRef.current, next)) {
            stageRef.current = next;
            setStage(next);
            // One-way latch for the drift wall. Rides the same commit rather than a
            // separate effect, so crossing the gunshot boundary backwards leaves the
            // wall mounted and its column offsets intact. See `wallMounted` above.
            if (next.gunshot) setWallMounted(true);
          }
        },
      });
    },
    { scope: pinRef }
  );

  // Every continuous value now lives in a CSS custom property written by the driver
  // above (see heroVars.ts). Nothing below recomputes per frame.

  return (
    <Box ref={pinRef} sx={{ position: "relative", height: "100vh" }}>
      <Box
        ref={containerRef}
        id="hero"
        {...{ [STAGE_ATTR]: "" }}
        data-hero-mode={mode}
        data-sky={roomIsDark ? "dark" : "light"}
        sx={{
          ...PLAYGROUND_FLIP_SX,
          position: "relative",
          height: "100vh",
          // `100%`, not `100vw`. `100vw` includes the scrollbar gutter, so this box
          // was ~10px wider than the header's container and everything positioned
          // against its right edge sat that far off the header's right edge. (It is
          // also the classic source of a phantom horizontal scrollbar; `overflowX:
          // clip` on `#home-main` was hiding that rather than preventing it.)
          width: "100%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // The centre stop was an opaque `#FFFFFF`, which made the hero its own
          // ground and produced the hard cut into the mission section below it.
          // GroundLayer owns the hero's ground (`base`) now, so this is only the
          // vignette — transparent in the middle, darkening toward the edges — and
          // the ground can interpolate into `deep` below instead of switching.
          //
          // The tint inverted with the palette: it used to be navy-at-low-alpha
          // darkening a white page, and is now black darkening a dark one.
          // Standard plain black radial vignette: transparent 60% -> rgba(0,0,0,0.40) at 100%
          pt: 0,
          pb: 0,
          px: 0,
        }}
      >
        {/* The gunshot's imagery: a drift wall of blog photography, replacing the two
            50vh split panes that used to auto-pan here. Latched, not gated on
            `stage.gunshot` — see the `wallMounted` note above. */}
        {wallMounted && (
          <Suspense fallback={null}>
            <HeroImageWall paused={!stage.wallDrift} />
          </Suspense>
        )}

        {/* The navy wash over the wall.
            Gated on `wallMounted` rather than `stage.gunshot` so the wash and the wall
            can never disagree about whether this phase exists; `--hp-g` fades both to
            nothing outside it.

            0.42, down from 0.80. The wall now carries most of the tint itself through
            its own `dim` and navy `overlayColor`, and 0.80 on top of that left the
            photographs as an unreadable smudge. The floor is not aesthetic: the
            flanking text below blends with `mixBlendMode: "difference"`, which paints
            `255 - b` against a backdrop channel `b` and therefore has **zero contrast
            at b = 127.5**. The composite has to stay well under ~95 per channel or
            that text does not get dim, it disappears. 0.42 lands it near 83. The full
            working is in `HeroImageWall.tsx`'s header. */}
        {wallMounted && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              bgcolor: alpha(NOIR.navyField, 0.42),
              opacity: "var(--hp-g, 0)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Flanking Text Elements (Appear during Smoking — vertical movement) */}
        {stage.flank && (
          <>
            {/* Top Text: 7 YEARS OF EXCELLENCE — 2 rows fitting top 50vh, vertically centered */}
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: "50vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                // Translate using a tighter drift parameter to keep it centered on its half
                transform: "translateY(calc(var(--hp-lefty, 0) * 0.45vh))",
                opacity: "var(--hp-flank, 0)",
                pointerEvents: "none",
                zIndex: 4,
                overflow: "hidden",
                px: { xs: 2, md: 4 },
                mixBlendMode: "difference",
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "clamp(1.8rem, 6.2vw, 5.0rem)", md: "clamp(4.2rem, 7.8vw, 7.5rem)" },
                  fontWeight: 950,
                  lineHeight: 0.9,
                  letterSpacing: "-0.03em",
                  textTransform: "uppercase",
                  background: `linear-gradient(90deg, ${NOIR.gold} calc(var(--hp-border, 0) * 100%), rgba(255, 255, 255, 0.98) calc(var(--hp-border, 0) * 100%))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 6px 24px rgba(6, 24, 59, 0.85))",
                  textAlign: "center",
                }}
              >
                7 YEARS OF
              </Typography>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "clamp(1.8rem, 6.2vw, 5.0rem)", md: "clamp(4.2rem, 7.8vw, 7.5rem)" },
                  fontWeight: 950,
                  lineHeight: 0.9,
                  letterSpacing: "-0.03em",
                  textTransform: "uppercase",
                  background: `linear-gradient(90deg, ${NOIR.gold} calc(var(--hp-border, 0) * 100%), rgba(255, 255, 255, 0.98) calc(var(--hp-border, 0) * 100%))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 6px 24px rgba(6, 24, 59, 0.85))",
                  textAlign: "center",
                }}
              >
                EXCELLENCE
              </Typography>
            </Box>

            {/* Bottom Text: GENERATIONS OF COMPETITIVENESS — 2 rows fitting bottom 50vh, vertically centered */}
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "50vh",
                height: "50vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                // Translate using a tighter drift parameter to keep it centered on its half
                transform: "translateY(calc(var(--hp-righty, 0) * 0.45vh))",
                opacity: "var(--hp-flank, 0)",
                pointerEvents: "none",
                zIndex: 4,
                overflow: "hidden",
                px: { xs: 2, md: 4 },
                mixBlendMode: "difference",
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "clamp(1.8rem, 6.2vw, 5.0rem)", md: "clamp(4.2rem, 7.8vw, 7.5rem)" },
                  fontWeight: 950,
                  lineHeight: 0.9,
                  letterSpacing: "-0.03em",
                  textTransform: "uppercase",
                  background: `linear-gradient(90deg, ${NOIR.gold} calc(var(--hp-border, 0) * 100%), rgba(255, 255, 255, 0.98) calc(var(--hp-border, 0) * 100%))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 6px 24px rgba(6, 24, 59, 0.85))",
                  textAlign: "center",
                }}
              >
                GENERATIONS OF
              </Typography>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "clamp(1.8rem, 6.2vw, 5.0rem)", md: "clamp(4.2rem, 7.8vw, 7.5rem)" },
                  fontWeight: 950,
                  lineHeight: 0.9,
                  letterSpacing: "-0.03em",
                  textTransform: "uppercase",
                  background: `linear-gradient(90deg, ${NOIR.gold} calc(var(--hp-border, 0) * 100%), rgba(255, 255, 255, 0.98) calc(var(--hp-border, 0) * 100%))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 6px 24px rgba(6, 24, 59, 0.85))",
                  textAlign: "center",
                }}
              >
                COMPETITIVENESS
              </Typography>
            </Box>
          </>
        )}

        {/* Scaled Hero Container (Houses P Logo, AT Text & Wordmark) */}
        <Box
          ref={cardRef}
          className="hero-card"
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
            transform: "scale(calc(1.0 - (1.0 - var(--hp-scale, 1)) * 1.15))",
            transformOrigin: "center center",
            /**
             * Soft primary color with ~98% whiter ground (NOIR.void - #F4F7FC),
             * synced with webpage background color.
             */
            bgcolor: NOIR.void,
            borderRadius: "calc(var(--hp-g, 0) * 24px)",
            border: "1px solid rgba(10,42,102,calc(0.12 * var(--hp-g, 0)))",
            boxShadow: "0 20px 50px rgba(10, 42, 102, calc(0.12 * var(--hp-g, 0)))",
            maxWidth: "100%",
            maxHeight: "100%",
            m: "auto",
          }}
        >
          {/*
            The dawn ground. Lives INSIDE this card — the card is opaque
            (bgcolor: NOIR.void) and full-bleed at progress 0, so anything
            placed behind it is invisible (see "the one hard structural
            fact" in docs/hero-upgrade/stage-4.md). Still no image assets:
            two `background-image` layers on one Box.

            REPLACES the six-stop vertical DAWN gradient. That gradient ran
            zenith -> ember top to bottom and filled the frame, which made
            the card read as *sky*; the brief is a card that reads as
            *white*, ~70% of it, with the dawn arriving from the left. Two
            changes carry that:

              1. The sun moved from `82% 20%` (right) to `10% 30%` (left),
                 and its shine is now a wide, weak warm wash rather than a
                 hard disc. `--hp-sun` still scales the gold core, so
                 `sunAltitude()` drives it exactly as before.
              2. The base gradient runs *horizontally* (100deg), warm at the
                 left edge and pure white by ~62% across, instead of
                 vertically through six saturated stops.

            The canvas city's own light agrees with this by construction:
            `heroCity.ts`'s SHADOW_DIR points along +(1,1) in plane space,
            which the -45deg camera maps to screen-right — i.e. away from
            this sun. One light source, two layers, no disagreement.

            No clouds. `DAWN.cloudMid`/`cloudLo` are deliberately unused
            here; see the decision log.

            Parallax: each layer gets its own `background-position` offset
            off the same `--hp-mx`/`--hp-my` the canvas's pointer lerp
            publishes onto `cardRef` — sun 8px (front-most), wash 3px.
            `backgroundSize` is padded past 100% so parallax travel never
            exposes an edge.

            Fully gone by CONTAINER_START: opacity is `var(--hp-sky, 1)`,
            and skyPresence(CONTAINER_START) === 0 exactly (pinned in
            tests/motion/hero-phases.test.ts), so the card interior returns
            to pure NOIR.void — byte-identical to what GroundLayer already
            paints behind it at that point in the pin.
          */}
          <Box
            aria-hidden
            className="hero-sky"
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              opacity: "var(--hp-sky, 1)",
              backgroundImage: [
                `radial-gradient(circle at 8% 26%, rgba(${NOIR.goldRgb}, calc(0.26 * var(--hp-sun, 1))) 0%, rgba(${DAWN.warmRgb}, 0.20) 11%, rgba(${DAWN.warmRgb}, 0.07) 26%, rgba(${DAWN.warmRgb}, 0.00) 44%)`,
                `linear-gradient(100deg, ${DAWN.haze} 0%, ${NOIR.void} 22%, ${NOIR.white} 52%)`,
              ].join(", "),
              backgroundRepeat: "no-repeat, no-repeat",
              backgroundSize: "150% 150%, 108% 108%",
              backgroundPosition:
                "calc(10% + var(--hp-mx, 0) * 8px) calc(30% + var(--hp-my, 0) * 8px), calc(50% + var(--hp-mx, 0) * 3px) calc(50% + var(--hp-my, 0) * 3px)",
            }}
          />

          {/* 3-layer Parallax Image Background (imagebg_renew.jpg) */}
          {use3D && <ParallaxHeroBg ready={ready} />}

          {/* Video background mode: the baked night→dawn loop, filling the same
              area the R3F canvas fills but sitting behind it — the canvas below
              renders with a transparent clear colour and skips `SkyDome`/
              `CloudSea` (see `PlaygroundCanvas.tsx`'s `hideSky`) so the mark and
              its lighting draw on top of this rather than doubling up on it. */}
          {useVideoBg && (
            <Box
              aria-hidden
              ref={heroBgVideo.containerRef}
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 3,
                opacity: ready ? (reduced ? 0.4 : 0.95) : 0,
                transition: "opacity 0.6s ease-out",
                overflow: "hidden",
              }}
            >
              <Box
                component="video"
                ref={heroBgVideo.videoRef}
                autoPlay
                muted
                playsInline
                preload="none"
                poster={HERO_BG_VIDEO.poster}
                sx={{
                  position: "absolute",
                  inset: -20,
                  width: "calc(100% + 40px)",
                  height: "calc(100% + 40px)",
                  objectFit: "cover",
                  willChange: "transform",
                }}
              >
                {heroBgVideo.shouldLoad && !heroBgVideo.posterOnly && (
                  <>
                    <source src={HERO_BG_VIDEO.webm} type="video/webm" />
                    <source src={HERO_BG_VIDEO.mp4} type="video/mp4" />
                  </>
                )}
              </Box>
            </Box>
          )}

          {/* The city: streets, buildings, dawn shadows, signal pulses and the P
              mark's own district — one canvas, no DOM per scene object. */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 4,
              opacity: ready ? (reduced ? 0.4 : 0.95) : 0,
              transition: "opacity 0.6s ease-out",
            }}
          >
            {/* `containerRef` (`#hero`), not `cardRef`: the mode badge and the
                motto — the two DOM consumers of `--hp-px`/`--hp-py`/`--hp-pw`,
                the P's projected position — are siblings of `.hero-card`, not
                descendants of it, and a CSS custom property only cascades to
                descendants. `--hp-mx`/`--hp-my` moving up here too is a strict
                widening (`.hero-sky` is still a descendant of `#hero`), not a
                behaviour change. */}
            {use3D ? (
              <Suspense fallback={null}>
                <R3FHeroCanvas
                  handleRef={canvasHandleRef}
                  varsHostRef={containerRef}
                  bgMode="video" // Force transparent background for ParallaxHeroBg
                  onNodeSelect={handleNodeSelect}
                />
              </Suspense>
            ) : (
              <LegacyHeroCanvas handleRef={canvasHandleRef} varsHostRef={containerRef} />
            )}
          </Box>

          {/* The sky toggle: Monolith only, top-right corner — the same corner
              the (now command-palette-driven) mode badge used to take, per the
              comment on `.hero-directory` below. `Magnetic` for the hover feel,
              the glass token surface used elsewhere in the chrome rather than a
              one-off treatment. Sun in night mode (press to bring up the day
              sky), moon in day mode — the icon always names the mode a press
              switches *to*, matching how a light-switch plate reads.

              Hidden in video background mode: the baked night→dawn transition
              in the footage isn't user-controlled, so there is no day/night
              choice here for the button to make. */}
          {use3D && !useVideoBg && (
            <Magnetic
              sx={{
                position: "absolute",
                // Clears the MUI AppBar's toolbar band (z-index 1100, fixed
                // top-right in the same corner) — anything placed at the old
                // top:16/24 was physically under the toolbar and ate every
                // click regardless of this element's own z-index, since an
                // AppBar always stacks above page content.
                top: { xs: 72, md: 88 },
                right: { xs: 16, md: 24 },
                zIndex: 6,
              }}
            >
              <Box
                component="button"
                type="button"
                aria-label={skyMode === "night" ? "Switch to day sky" : "Switch to night sky"}
                aria-pressed={skyMode === "day"}
                onClick={() => setSkyMode(skyMode === "night" ? "day" : "night")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "var(--glass-border)",
                  background: "var(--glass-fill-2)",
                  backdropFilter: "var(--glass-filter)",
                  WebkitBackdropFilter: "var(--glass-filter)",
                  color: roomIsDark ? NOIR.frost : NOIR.navyField,
                  cursor: "pointer",
                  transition: "background-color 0.32s ease, color 0.32s ease, transform 0.2s ease",
                  "&:active": { transform: "scale(0.94)" },
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                    "&:active": { transform: "none" },
                  },
                }}
              >
                {skyMode === "night" ? (
                  // Sun — pressing it brings up the day sky.
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="4.5" fill="currentColor" />
                    <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M12 2.5v2.6M12 18.9v2.6M21.5 12h-2.6M5.1 12H2.5" />
                      <path d="M18.4 5.6l-1.85 1.85M7.45 16.55L5.6 18.4M18.4 18.4l-1.85-1.85M7.45 7.45L5.6 5.6" />
                    </g>
                  </svg>
                ) : (
                  // Moon — pressing it brings up the night sky.
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M20 14.2A8.4 8.4 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2Z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </Box>
            </Magnetic>
          )}

          {/*
            The stage-4 in-card vignette used to live here: a centred ellipse
            darkening the frame's edges toward `DAWN.cloudLo`. It is gone.

            It existed to give a saturated six-stop sky somewhere to fall off
            to. Against a ground that is now ~70% white it did the opposite of
            its job — a grey ring around a white card reads as a rendering
            artifact, and it fought the one thing the composition is built on,
            which is that the light comes from a single point off the left
            edge and nowhere else. A vignette is light coming from everywhere
            at once.

            Not replaced. The density mask in `heroCity.ts` already fades the
            lattice toward the plane's margins, so the field has no visible
            rectangular boundary without painting one.
          */}


          {/* PHITOPOLIS Word Transition — Phase 3 & Shift Left in Sub-Phase 2.
              Hidden wholesale while the 3D gallery is on; see
              `PLAYGROUND_FLIP_SX`'s `.hero-wordmark-frame` rule for why the
              lockup has no meaning there. */}
          {/* Left-Aligned Brand Lockup (Phitopolis + Motto + Subtitle) */}
          <Box
            className="hero-wordmark-frame"
            sx={{
              position: "absolute",
              top: "50%",
              left: { xs: "5%", sm: "7%", md: "9%" },
              transform: "translateY(-50%)",
              zIndex: 5,
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              maxWidth: { xs: "90%", sm: "440px", md: "560px" },
            }}
          >
            {/* H1 Brand Wordmark */}
            <Box sx={{ position: "relative", overflow: "hidden", py: 0.5 }}>
              <Typography
                variant="h1"
                component="h1"
                aria-label="Phitopolis"
                className="hero-wordmark"
                sx={{
                  fontSize: { xs: "2.5rem", sm: "3.6rem", md: "4.8rem" },
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                  textTransform: "uppercase",
                  userSelect: "none",
                  color: NOIR.frost,
                  textShadow: "0 2px 20px rgba(0,0,0,0.4)",
                  opacity: 0.95, // Reduced by 5 points from 1.0
                }}
              >
                PH<Box component="span" sx={{ color: NOIR.gold }}>IT</Box>OPOLIS
              </Typography>
            </Box>

            {/* Gold Hairline Divider */}
            <Box
              aria-hidden
              sx={{
                width: 48,
                height: 2,
                backgroundColor: NOIR.gold,
                opacity: 0.75, // Reduced by 5 points from 0.8
                borderRadius: 1,
              }}
            />

            {/* Dual-Track Segment Control Toggle */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                mt: 0.5,
                p: 0.6,
                borderRadius: "8px",
                bgcolor: "rgba(6, 10, 22, 0.75)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 215, 0, 0.3)",
                width: "fit-content",
                pointerEvents: "auto",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              <Button
                size="small"
                onClick={() => setHeroTrack("enterprise")}
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "0.65rem", sm: "0.72rem" },
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  px: 1.6,
                  py: 0.5,
                  borderRadius: "5px",
                  color: heroTrack === "enterprise" ? "#060A16" : "rgba(255,255,255,0.75)",
                  bgcolor: heroTrack === "enterprise" ? "#FFD700" : "transparent",
                  boxShadow: heroTrack === "enterprise" ? "0 0 15px rgba(255,215,0,0.35)" : "none",
                  "&:hover": {
                    bgcolor: heroTrack === "enterprise" ? "#FFE44D" : "rgba(255,255,255,0.12)",
                  },
                }}
              >
                [DEVELOPING RELIABLE SYSTEMS]
              </Button>
              <Button
                size="small"
                onClick={() => setHeroTrack("talent")}
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "0.65rem", sm: "0.72rem" },
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  px: 1.6,
                  py: 0.5,
                  borderRadius: "5px",
                  color: heroTrack === "talent" ? "#060A16" : "rgba(255,255,255,0.75)",
                  bgcolor: heroTrack === "talent" ? "#FFD700" : "transparent",
                  boxShadow: heroTrack === "talent" ? "0 0 15px rgba(255,215,0,0.35)" : "none",
                  "&:hover": {
                    bgcolor: heroTrack === "talent" ? "#FFE44D" : "rgba(255,255,255,0.12)",
                  },
                }}
              >
                [FAST-PACED CAREER GROWTH]
              </Button>
            </Box>

            {/* Motto */}
            <Typography
              sx={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 800,
                textTransform: "uppercase",
                fontSize: { xs: "0.75rem", sm: "0.88rem", md: "1.02rem" },
                letterSpacing: "0.18em",
                lineHeight: 1.4,
                color: NOIR.frost,
                opacity: 0.95,
                mt: 0.5,
              }}
            >
              {heroTrack === "enterprise" ? (
                <>
                  Engineering Reliable{" "}
                  <Box component="span" sx={{ color: NOIR.gold }}>
                    ·
                  </Box>{" "}
                  FinTech & Quant Systems
                </>
              ) : (
                <>
                  Fast-Paced Career Growth{" "}
                  <Box component="span" sx={{ color: NOIR.gold }}>
                    ·
                  </Box>{" "}
                  For Serious Engineers
                </>
              )}
            </Typography>

            {/* Subtitle / Minor text */}
            <Typography
              sx={{
                fontFamily: MONO,
                fontWeight: 600,
                fontSize: { xs: "0.68rem", sm: "0.76rem", md: "0.82rem" },
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: `rgba(${NOIR.frostRgb}, 0.78)`,
                lineHeight: 1.5,
              }}
            >
              {heroTrack === "enterprise"
                ? "Building high-availability market infrastructure and R&D products from the Philippines."
                : "Accelerate your engineering impact on complex R&D products in Manila."}
            </Typography>
          </Box>
        </Box>


        {/* Plain Navy Radial Vignette */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            pointerEvents: "none",
            background: "radial-gradient(ellipse at center, transparent 60%, rgba(10, 42, 102, 0.15) 100%)",
            opacity: "var(--hp-panel, 1)",
          }}
        />

        {/*
         * The motto — a wordmark-kicker line under the mark, not a headline.
         *
         * Used to be a fixed 2.6rem block, top-left, its own headline
         * competing with the P for the frame's attention. It is centred under
         * the mark now, in the mark's own type voice (Outfit 900, uppercase,
         * wide tracking — see the wordmark's `PH`**`IT`**`OPOLIS` a few
         * hundred lines up), sized and weighted like a sub-lockup line
         * because that is what it now reads as.
         *
         * Anchored to `--hp-px`/`--hp-py` — the P's own projected centre-x
         * and bottom-y, written per frame by whichever renderer is live
         * (`heroPlaneRenderer.ts` in Legacy, `MonolithScene`'s anchor probe
         * in `PlaygroundCanvas.tsx`) — rather than to a fixed slot, so "just
         * below the P" stays true as the mark scales and slides through the
         * pin instead of only at rest. The defaults (`0.5`/`0.60`) are the
         * mark's resting position, so the line is already in the right place
         * for the first frame, before either renderer has published anything.
         *
         * Card scale is not a factor: `.hero-card` only starts scaling down
         * at `DWELL_END` (progress 0.60, `gunshotProgress`), and `--hp-panel`
         * has already faded this block to 0 by progress 0.25 — the two
         * animations never overlap.
         */}
        <Box
          className="hero-motto-block"
          sx={{
            position: "absolute",
            left: "calc(var(--hp-px, 0.5) * 100%)",
            top: "calc(var(--hp-py, 0.60) * 100%)",
            // Extra clearance past the anchor itself: `--hp-py` lands on the
            // glyph's own bottom edge, but the ambient shadow pool beneath it
            // (`blitShadow(..., lw * 0.72, ...)` in heroPlaneRenderer.ts) is
            // wider than the glyph is tall and reaches a bit further down —
            // this pushes the line clear of that too, not just the letterform.
            transform: "translate(-50%, 0) translateY(clamp(48px, 7vh, 110px))",
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            opacity: ready ? "var(--hp-panel, 1)" : 0,
            transition: `opacity 2.4s ${EASE_OUT_EXPO_CSS}, transform 2.4s ${EASE_OUT_EXPO_CSS}`,
            maxWidth: "min(92vw, 46rem)",
            pointerEvents: "none",
          }}
        >
          {/* The sub-lockup hairline — the standard "line over a kicker" move,
              and the same gesture the wordmark makes with its gold middle
              letters: a small gold touch tying this line to the mark above it
              rather than letting it float as unrelated copy. */}
          <Box
            aria-hidden
            sx={{
              width: 32,
              height: 1,
              mb: "14px",
              backgroundColor: NOIR.gold,
              opacity: 0.5,
            }}
          />
          <Typography
            className="hero-motto"
            sx={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 900,
              textTransform: "uppercase",
              fontSize: "clamp(0.60rem, 0.92vw, 0.84rem)",
              letterSpacing: "0.30em",
              // Optical fix: a centred, widely tracked line reads as shifted
              // right by half a letter's worth of trailing tracking space —
              // this pulls it back without touching `textAlign`.
              pl: "0.30em",
              lineHeight: 1,
              opacity: 0.78,
              whiteSpace: { xs: "normal", md: "nowrap" },
              /**
               * Bound to the room rather than left to the cascade.
               *
               * `PLAYGROUND_FLIP_SX` also carries a `[data-sky="dark"] &
               * .hero-motto { color: frost }` rule, and that rule *matches* this
               * element — verified in the browser — while losing to this `sx`
               * anyway. Chasing which of two emotion-generated classes wins is
               * the wrong thing to spend certainty on for a contrast rule: this
               * is the one line of copy over a canvas that can be near-white or
               * near-black, so it needs to be right by construction rather than
               * right by specificity.
               *
               * `roomIsDark` is the same value that sets `data-sky` a few
               * hundred lines up and the same one the navbar reads, so there is
               * still exactly one source of truth for "is the room dark" — this
               * just consumes it directly instead of through a selector.
               */
              color: roomIsDark ? NOIR.frost : NOIR.navyField,
            }}
          >
            Making Tomorrow's Technology{" "}
            <Box component="span" sx={{ color: NOIR.gold }}>
              ·
            </Box>{" "}
            Available Today
          </Typography>
        </Box>

        {/* Bottom Left Navigation Launcher: Clumped links. Hidden while the
            gallery is on — the mode badge takes the top-right corner instead. */}
        <Box
          className="hero-directory"
          sx={{
            position: "absolute",
            bottom: { xs: 28, md: 44 },
            left: HERO_GUTTER,
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            gap: 1.2,
            opacity: ready ? "var(--hp-panel, 1)" : 0,
            pointerEvents: ready && stage.panelInteractive ? "auto" : "none",
            transform: ready ? "translateY(0)" : "translateY(16px)",
            transition: `opacity 2.4s ${EASE_OUT_EXPO_CSS}, transform 2.4s ${EASE_OUT_EXPO_CSS}`,
            transitionDelay: ready ? "0.45s" : "0s",
            maxWidth: { xs: "calc(100% - 64px)", md: "850px" },
          }}
        >
          <Typography
            className="hero-eyebrow"
            sx={{
              fontFamily: MONO,
              fontSize: "0.65rem",
              fontWeight: 800,
              letterSpacing: "0.16em",
              color: NOIR.navyField,
              textTransform: "uppercase",
            }}
          >
            EXPLORE PHITOPOLIS // DIRECTORY
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: "stretch",
            }}
          >
            {/* Link 1: ABOUT */}
            <Box
              component={RouterLink}
              className="hero-pill"
              to="/about"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                px: 3,
                py: 1.2,
                ...LINK_PILL_SX,
              }}
            >
              <Typography
                className="btn-text"
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  color: NOIR.navyField,
                  textTransform: "uppercase",
                  transition: "color var(--dur) var(--ease-out)",
                }}
              >
                ABOUT PHITOPOLIS <Box component="span" sx={{ ml: 0.5 }}>→</Box>
              </Typography>
            </Box>

            {/* Link 2: SERVICES */}
            <Box
              component={RouterLink}
              className="hero-pill"
              to="/services"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                px: 3,
                py: 1.2,
                ...LINK_PILL_SX,
              }}
            >
              <Typography
                className="btn-text"
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  color: NOIR.navyField,
                  textTransform: "uppercase",
                  transition: "color var(--dur) var(--ease-out)",
                }}
              >
                WHAT WE DO <Box component="span" sx={{ ml: 0.5 }}>→</Box>
              </Typography>
            </Box>

            {/* Link 3: BLOG */}
            <Box
              component={RouterLink}
              className="hero-pill"
              to="/blog"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                px: 3,
                py: 1.2,
                ...LINK_PILL_SX,
              }}
            >
              <Typography
                className="btn-text"
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  color: NOIR.navyField,
                  textTransform: "uppercase",
                  transition: "color var(--dur) var(--ease-out)",
                }}
              >
                EXPLORE COMMUNITY <Box component="span" sx={{ ml: 0.5 }}>→</Box>
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Bottom Scroll Cue, and how far it is to the gunshot.
            See `GUNSHOT_TRACK_SX` for why the meter is pure CSS. */}
        <Box
          sx={{
            position: { xs: "relative", md: "absolute" },
            // Matches the directory's own bottom baseline (44) and the shared
            // gutter (72) — both were bespoke numbers (48/56) that broke the
            // rhythm the other bottom-anchored chrome holds.
            bottom: { md: 44 },
            right: HERO_GUTTER,
            zIndex: 4,
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 1,
            opacity: ready ? "var(--hp-panel, 1)" : 0,
            transition: "opacity 2.4s ease-out",
            transitionDelay: ready ? "0.9s" : "0s",
          }}
        >
          <Typography
            className="hero-scroll-cue"
            sx={{
              fontFamily: MONO,
              fontSize: "0.68rem",
              letterSpacing: "0.16em",
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              gap: 1,
              // The bounce is the *invitation* to scroll, so it retires once the
              // reader has clearly accepted — a cue that keeps nudging while the
              // meter is filling is a cue that has stopped listening.
              animation: stage.gunshot ? "none" : "pulseBounce 7.2s ease-in-out infinite",
              "@keyframes pulseBounce": {
                "0%, 100%": { transform: "translateY(0)" },
                "50%": { transform: "translateY(5px)" },
              },
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          >
            {stage.gunshot ? "[ SEQUENCE ENGAGED ]" : "[ SCROLL TO EXPLORE ↓ ]"}
          </Typography>

          <Box className="hero-gunshot-track" sx={GUNSHOT_TRACK_SX} aria-hidden>
            <Box className="hero-gunshot-fill" />
          </Box>

          <Typography
            className="hero-scroll-cue"
            sx={{
              fontFamily: MONO,
              fontSize: "0.56rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: stage.gunshot ? NOIR.gold : "text.secondary",
              opacity: stage.gunshot ? 1 : 0.7,
              transition: "color 0.4s ease, opacity 0.4s ease",
            }}
          >
            GUNSHOT
          </Typography>
        </Box>
      </Box>

      {/* Interactive R&D Spec Sheet Drawer */}
      <NodeSpecDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        nodeIndex={selectedNodeIndex}
        track={heroTrack}
      />
    </Box>
  );
}

// Appended Section right after the hero page: Immersive Executive Sales Pitch Section
/**
 * The hero.
 *
 * This used to also render `HeroDescriptionSection` — a pinned 100vh four-beat deck
 * that lived below the signal core. Those beats are now three real scrolling
 * sections under `./description/`, rendered by the route rather than nested here,
 * so each can own its ground and choreo and none of them depends on a scroll pin to
 * become reachable.
 */
export function SuperHeroSequence() {
  return <HeroSignalCore />;
}
