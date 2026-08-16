import { Suspense, lazy, useRef, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { alpha } from "@mui/material/styles";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { RouterLink } from "@/shared/components/RouterLink";
import { Magnetic } from "@/shared/components/Magnetic";
import { useStagePresence } from "@/shared/components/StageSection";
import { STAGE_ATTR, setActiveSection } from "@/shared/sections";
import { NAV_ANCHORS, useNavbar } from "@/shared/components/NavbarContext";
import { HeroCanvas as LegacyHeroCanvas, type HeroCanvasHandle } from "./HeroCanvas";
import { WORDMARK_INSET_MD, WORDMARK_INSET_SM } from "./heroPlaneRenderer";
import { useHeroModeState, useHeroTrack, setHeroTrack } from "./heroModeStore";
import { setSkyMode, useSkyModeState } from "./skyModeStore";
import { useBackgroundVideo, HERO_BG_VIDEO } from "@/shared/components/useBackgroundVideo";
import { ParallaxHeroBg } from "./ParallaxHeroBg";

const SANS = "Inter, system-ui, -apple-system, sans-serif";

const ACTIVE_NODE_DATA = [
  { tag: "NODE 01 // TEAM", label: "Quantitative Research & Modeling Team" },
  { tag: "NODE 02 // TEAM", label: "Core Execution & Systems Engineering Team" },
  { tag: "NODE 03 // TEAM", label: "Market Data & Data Fabrics Team" },
  { tag: "NODE 04 // TEAM", label: "Global Infrastructure & Trading Operations Team" },
] as const;
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
import { NOIR } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { useReducedMotion, usePreloaderReady } from "@/shared/motion";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

gsap.registerPlugin(ScrollTrigger, CustomEase, SplitText, useGSAP);

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
  border: "1px solid rgba(255, 255, 255, 0.85)",
  outline: "1px solid rgba(10, 42, 102, 0.14)",
  backgroundColor: "rgba(255, 255, 255, 0.72)",
  backdropFilter: "blur(16px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
  boxShadow: "0 8px 24px rgba(10, 42, 102, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.9)",
  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
  "&, & *": {
    textDecoration: "none !important",
  },
  "@media (hover: hover)": {
    "&:hover": {
      backgroundColor: "rgba(10, 42, 102, 0.92)",
      outline: "1px solid rgba(255, 215, 0, 0.50)",
      boxShadow: "0 12px 32px rgba(10, 42, 102, 0.35), 0 0 16px rgba(255, 215, 0, 0.30)",
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
  const flankTopRef = useRef<HTMLDivElement>(null);
  const flankBottomRef = useRef<HTMLDivElement>(null);
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

  const handleNodeSelect = (index: number) => {
    setSelectedNodeIndex((prev) => (prev === index ? null : index));
  };

  const { mode: skyMode } = useSkyModeState();
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

      CustomEase.create("gunshotSnap", "M0,0 C0.1,0.9 0.2,1 1,1");
      CustomEase.create("drift", "M0,0 C0.2,0 0.2,1 1,1");

      const yQuick = gsap.quickTo(el, "y", { duration: 0.8, ease: "power3.out" });
      const proxy = { progress: 0 };

      let splitTop: SplitText | undefined;
      let splitBottom: SplitText | undefined;
      if (flankTopRef.current && flankBottomRef.current) {
        splitTop = new SplitText(flankTopRef.current, { type: "lines,chars" });
        splitBottom = new SplitText(flankBottomRef.current, { type: "lines,chars" });
        gsap.set([splitTop.chars, splitBottom.chars], { yPercent: 100, opacity: 0 });
      }

      const master = gsap.timeline({
        paused: true,
        onUpdate: () => {
          const p = proxy.progress;

          writeHeroVars(el, heroVars(p, false));
          if (pinRef.current) {
            writeHeroVars(pinRef.current, heroVars(p, false));
          }
          canvasHandleRef.current?.setProgress(p);

          if (p < 0.20) setActiveSection("hero-flatten");
          else if (p < 0.35) setActiveSection("hero-align");
          else if (p < 0.50) setActiveSection("hero-reveal");
          else if (p < 0.60) setActiveSection("hero-dwell");
          else setActiveSection("hero");

          if (!wallWarmedRef.current && p > WALL_WARM_AT) {
            wallWarmedRef.current = true;
            void import("./HeroImageWall");
          }

          const next = heroStage(p, false);
          if (!sameStage(stageRef.current, next)) {
            stageRef.current = next;
            setStage(next);
            if (next.gunshot) setWallMounted(true);
          }
        }
      });

      master.to(proxy, { progress: 1.1, duration: 1.1, ease: "none" });

      if (splitTop && splitBottom) {
        master.to(splitTop.chars, {
          yPercent: 0,
          opacity: 1,
          duration: 0.15,
          stagger: 0.005,
          ease: "gunshotSnap",
        }, 0.60);
        master.to(splitBottom.chars, {
          yPercent: 0,
          opacity: 1,
          duration: 0.15,
          stagger: 0.005,
          ease: "gunshotSnap",
        }, 0.60);
      }

      /**
       * `quickTo`, not a fresh `gsap.to(proxy, …)` per scroll tick.
       *
       * The pin's `onUpdate` below fires on every scroll tick across an 800%
       * pin — hundreds of times per scroll pass. The old code built and
       * discarded a whole Tween each time; `overwrite: "auto"` kept them from
       * stacking, but every tick still paid for construction. `quickTo`
       * builds the tween once and `resetTo`s its target on each call, which
       * is exactly what it exists for (the same pattern `yQuick` above
       * already uses for the drift's `y`). Same duration, same "drift" ease,
       * same `onUpdate` bridge into `master` — the eased chase toward each
       * new progress value looks identical, just without the per-tick
       * allocation.
       */
      const progressQuick = gsap.quickTo(proxy, "progress", {
        duration: 0.4,
        ease: "drift",
        onUpdate: () => master.progress(proxy.progress / 1.1),
      });

      ScrollTrigger.create({
        trigger: pinRef.current,
        start: "top top",
        end: HERO_PIN_DISTANCE,
        scrub: 0.6,
        pin: true,
        // Under Lenis smoothing, an 800%-tall pin with no `anticipatePin`
        // produces a one-frame jump at pin-start — ScrollTrigger has to wait
        // for the scroll position to actually reach the pin before it can
        // measure and apply it, and Lenis's smoothing makes that arrival
        // visible as a snap. `invalidateOnRefresh` recomputes start/end (and
        // re-runs this tween's setup) on resize, since the drift math below
        // reads `window.innerHeight` and a stale viewport height would drift
        // out of sync with the actual one. Mirrors
        // `DailyLifeSection.tsx`'s own pin config.
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = Math.min(1.1, self.progress / ANIM_LIMIT);
          progressQuick(p);

          if (self.progress > ANIM_LIMIT) {
            const overlapT = (self.progress - ANIM_LIMIT) / (1 - ANIM_LIMIT);
            const driftVal = overlapT * -30 * (window.innerHeight / 100);
            yQuick(driftVal);
          } else {
            yQuick(0);
          }
        },
      });
    },
    { scope: pinRef, dependencies: [reduced] }
  );

  // Every continuous value now lives in a CSS custom property written by the driver
  // above (see heroVars.ts). Nothing below recomputes per frame.

  return (
    <Box ref={pinRef} sx={{ position: "relative", height: "100dvh" }}>
      <Box
        ref={containerRef}
        id="hero"
        {...{ [STAGE_ATTR]: "" }}
        data-hero-mode={mode}
        data-sky={roomIsDark ? "dark" : "light"}
        sx={{
          ...PLAYGROUND_FLIP_SX,
          position: "relative",
          height: "100dvh",
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
            {/* Top Text: 7 YEARS OF EXCELLENCE */}
            <Box
              ref={flankTopRef}
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, calc(-50% + var(--hp-lefty, 0) * 1vh))",
                opacity: "var(--hp-flank, 0)",
                pointerEvents: "none",
                zIndex: 4,
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "0.75rem", sm: "1.05rem", md: "1.35rem" },
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: stage.borderDone ? NOIR.gold : NOIR.navyField,
                  textShadow: "0 2px 10px rgba(10, 42, 102, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  transition: "color 0.15s ease-out",
                }}
              >
                7 YEARS OF EXCELLENCE
              </Typography>
            </Box>

            {/* Bottom Text: GENERATIONS OF COMPETITIVENESS */}
            <Box
              ref={flankBottomRef}
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, calc(-50% + var(--hp-righty, 0) * 1vh))",
                opacity: "var(--hp-flank, 0)",
                pointerEvents: "none",
                zIndex: 4,
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "0.75rem", sm: "1.05rem", md: "1.35rem" },
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: stage.borderDone ? NOIR.gold : NOIR.navyField,
                  textShadow: "0 2px 10px rgba(10, 42, 102, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  transition: "color 0.15s ease-out",
                }}
              >
                GENERATIONS OF COMPETITIVENESS
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
            borderRadius: "calc(var(--hp-g, 0) * 28px)",
            border: "2px solid rgba(10, 42, 102, calc(0.35 * var(--hp-g, 0)))",
            outline: "1px solid rgba(255, 215, 0, calc(0.50 * var(--hp-g, 0)))",
            outlineOffset: "-3px",
            boxShadow: "0 24px 60px rgba(6, 10, 22, calc(0.45 * var(--hp-g, 0))), 0 0 40px rgba(10, 42, 102, calc(0.20 * var(--hp-g, 0)))",
            overflow: "hidden",
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
              background: "linear-gradient(180deg, #FFFFFF 0%, #F4F7FA 100%)",
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
              <LegacyHeroCanvas
                handleRef={canvasHandleRef}
                varsHostRef={containerRef}
                activeNode={selectedNodeIndex}
                onNodeSelect={handleNodeSelect}
              />
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

          {/* Active Node Telemetry HUD Chip (Single focused readout on click) */}
          {selectedNodeIndex !== null && (
            <Box
              sx={{
                position: "absolute",
                top: { xs: 72, md: 88 },
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                gap: { xs: 1, md: 1.5 },
                px: { xs: 2, md: 2.75 },
                py: 0.9,
                borderRadius: "100px",
                backgroundColor: "rgba(6, 16, 38, 0.92)",
                border: "1px solid rgba(255, 199, 44, 0.65)",
                boxShadow: "0 12px 32px rgba(6, 10, 22, 0.45), 0 0 20px rgba(255, 199, 44, 0.25)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                pointerEvents: "auto",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onClick={() => setSelectedNodeIndex(null)}
              title="Click to dismiss"
            >
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  bgcolor: NOIR.gold,
                  boxShadow: "0 0 8px #FFC72C",
                }}
              />
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "0.68rem", md: "0.72rem" },
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  color: NOIR.gold,
                  whiteSpace: "nowrap",
                }}
              >
                {ACTIVE_NODE_DATA[selectedNodeIndex]?.tag}
              </Typography>
              <Box sx={{ width: "1px", height: 12, bgcolor: "rgba(255, 255, 255, 0.25)" }} />
              <Typography
                sx={{
                  fontFamily: SANS,
                  fontSize: { xs: "0.74rem", md: "0.8rem" },
                  fontWeight: 600,
                  color: "#FFFFFF",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                {ACTIVE_NODE_DATA[selectedNodeIndex]?.label}
              </Typography>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "rgba(255, 255, 255, 0.45)",
                  ml: 0.5,
                }}
              >
                ✕
              </Typography>
            </Box>
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


          {/* PHITOPOLIS Word Transition & Motto Lockup — Mode-Aware */}
          {use3D ? (
            /* Left-Aligned Brand Lockup (Phitopolis + Motto + Subtitle) - Monolith Mode */
            <Box
              className="hero-wordmark-frame"
              sx={{
                position: "absolute",
                top: "50%",
                left: { xs: "5%", sm: "7%", md: "9%" },
                transform: "translateY(-50%)",
                zIndex: 7,
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
                    opacity: 0.95,
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
                  opacity: 0.75,
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
          ) : (
            /* PHITOPOLIS Word Transition — Legacy 2D Hero Sequence Mode */
            <Box
              className="hero-wordmark-frame"
              sx={{
                position: "absolute",
                top: { xs: "calc(50% + 90px)", sm: "50%", md: "50%" },
                left: {
                  xs: "50%",
                  sm: `calc(50% - ${WORDMARK_INSET_SM}px)`,
                  md: `calc(50% - ${WORDMARK_INSET_MD}px)`,
                },
                width: "auto",
                textAlign: { xs: "center", sm: "left" },
                zIndex: 7,
                overflow: "hidden",
                clipPath: "inset(0 0 0 0)",
                opacity: "var(--hp-word, 0)",
                pointerEvents: "none",
                transform: {
                  xs: "translate(-50%, -50%)",
                  sm: "translate(0, -50%)",
                },
              }}
            >
              <Box sx={{ position: "relative", overflow: "hidden", py: 0.5 }}>
                <Typography
                  variant="h1"
                  component="h1"
                  aria-label="Phitopolis"
                  className="hero-wordmark"
                  sx={{
                    fontSize: { xs: "2.6rem", sm: "4.0rem", md: "5.8rem" },
                    fontWeight: 900,
                    letterSpacing: "0.02em",
                    lineHeight: 1,
                    textTransform: "uppercase",
                    userSelect: "none",
                    color: NOIR.navyField,
                    transform: "translateY(calc(var(--hp-wordlift, 0) * 1%))",
                  }}
                >
                  PH<Box component="span" sx={{ color: NOIR.gold }}>IT</Box>OPOLIS
                </Typography>
              </Box>
            </Box>
          )}

        </Box>


        {/* Primary Navy Professional Radial Vignette */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 6,
            pointerEvents: "none",
            background: "radial-gradient(ellipse 92% 92% at 50% 50%, transparent 35%, rgba(10, 42, 102, 0.12) 65%, rgba(10, 42, 102, 0.35) 88%, rgba(10, 42, 102, 0.58) 100%)",
            opacity: "var(--hp-panel, 1)",
          }}
        />

        {/* Top Left Motto Section — Legacy / Default Hero Mode */}
        <Box
          className="hero-motto-block"
          sx={{
            position: "absolute",
            top: { xs: 64, md: 80 },
            left: HERO_GUTTER,
            zIndex: 7,
            maxWidth: { xs: "calc(100% - 32px)", sm: "440px", md: "520px" },
            opacity: ready ? "var(--hp-panel, 1)" : 0,
            pointerEvents: "none",
            transition: `opacity 2.4s ${EASE_OUT_EXPO_CSS}`,
          }}
        >
          <Typography
            variant="h2"
            className="hero-motto"
            sx={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 800,
              textTransform: "none",
              fontSize: { xs: "1.4rem", sm: "1.9rem", md: "2.3rem" },
              letterSpacing: "-0.02em",
              lineHeight: 1.18,
              color: roomIsDark ? NOIR.frost : NOIR.navyField,
            }}
          >
            Making Tomorrow's Technology Available Today
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
            zIndex: 7,
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
