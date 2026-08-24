import { Suspense, lazy, useRef, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { RouterLink } from "@/shared/components/RouterLink";
import { useStagePresence } from "@/shared/components/StageSection";
import { STAGE_ATTR, setActiveSection } from "@/shared/sections";
import { NAV_ANCHORS, useNavbar } from "@/shared/components/NavbarContext";
import { HeroCanvas as LegacyHeroCanvas, type HeroCanvasHandle } from "./HeroCanvas";
import { WORDMARK_INSET_MD, WORDMARK_INSET_SM } from "./heroPlaneRenderer";
import { useBackgroundVideo, HERO_BG_VIDEO } from "@/shared/components/useBackgroundVideo";

const SANS = "Inter, system-ui, -apple-system, sans-serif";

const ACTIVE_NODE_DATA = [
  { tag: "NODE 01 // TEAM", label: "Quantitative Research & Modeling Team" },
  { tag: "NODE 02 // TEAM", label: "Core Execution & Systems Engineering Team" },
  { tag: "NODE 03 // TEAM", label: "Market Data & Data Fabrics Team" },
  { tag: "NODE 04 // TEAM", label: "Global Infrastructure & Trading Operations Team" },
] as const;
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
import { HERO_WALL_TILES } from "./heroWallTiles";
import { NOIR } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { useReducedMotion, usePreloaderReady } from "@/shared/motion";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";
import { HERO_PIN_DISTANCE } from "@/shared/motion/heroPin";
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";

gsap.registerPlugin(ScrollTrigger, CustomEase, SplitText, useGSAP);

/** The hero holds for viewport height to give room for 3 logo phases,
 *  an empty dwell threshold, the gunshot transition, smoking drift, and AT PHITOPOLIS mini transformation. */
/** Pin distance: 1800% for the hero animation + 100% extra overlap window
 *  where the overlay sheet slides up over the still-pinned hero. */
/**
 * How tall the pin is — now imported from `shared/motion/heroPin.ts`.
 *
 * Was `+=1900%` — nineteen viewport heights of scroll for nine phases, most of it
 * buffer. The phase boundaries in `heroPhases.ts` are all *fractions* of the pin's
 * 0..1 progress, so shortening the pin moves none of them and every assertion in
 * `tests/motion/hero-phases.test.ts` holds unchanged; only the amount of wheel
 * travel each fraction costs the reader changes. Eight is still generous.
 *
 * It lives in a shared module rather than here because `EyeFlow` and `AppShell`
 * both need the same number and both had drifted from it — see that file.
 */

/** How long to wait after the preloader clears before warming the drift wall, ms.
 *  Long enough that the warm-up never competes with the preloader's own critical-path
 *  work or the first paint of the hero itself; short enough that it is done long
 *  before a reader can reach the gunshot at progress 0.60. */
const WALL_WARM_DELAY_MS = 1200;

/**
 * The dark-room flip.
 *
 * This used to also invert the chrome for the 3D Monolith room
 * (`[data-hero-mode="monolith"]`/`[data-sky="dark"]` selectors) — retired
 * along with the gallery/mode-switching surface, since the hero renders the
 * legacy 2D card only now and `data-hero-mode`/`data-sky` are permanently
 * `"legacy"`/`"light"`. Kept as the home for the shared transition rules
 * below, and as a landing spot if a future dark treatment needs it again.
 */
const PLAYGROUND_FLIP_SX = {
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

  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);

  const handleNodeSelect = (index: number) => {
    setSelectedNodeIndex((prev) => (prev === index ? null : index));
  };

  /** Video is only meaningful over the Monolith room — the legacy 2D canvas
   *  has no notion of a background mode at all. */
  const useVideoBg = false; // Disabled to use ParallaxHeroBg instead
  const {
    containerRef: bgContainerRef,
    videoRef: bgVideoRef,
    shouldLoad: bgShouldLoad,
    posterOnly: bgPosterOnly,
  } = useBackgroundVideo();

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

      const video = bgVideoRef.current;
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
  }, [useVideoBg, reduced, bgVideoRef]);

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
    const video = bgVideoRef.current;
    if (!video) return;

    // Disable native loop — we own the playback direction
    const el = video;
    el.loop = false;

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
  }, [useVideoBg, reduced, bgVideoRef]);


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
  // Guards the one-shot ScrollTrigger.refresh() below so it fires at most once
  // per mount even though `onUpdate` runs on every scroll tick across the pin.
  const wallMountRefreshedRef = useRef(false);

  /**
   * One-shot warm-up for the wall's chunk and its 25 images, fired at mount.
   *
   * Used to be gated on scroll progress crossing 0.20 — four viewports ahead of the
   * gunshot at 0.60. That margin is a distance, not a time: under Lenis's smoothed
   * scroll and the pin's own `progressQuick` chase, a fast flick can cover four
   * viewports before the fetch it triggered at 0.20 has resolved. Verified: seeking
   * straight to p = 0.65 renders the navy wash with no wall behind it, and a quick
   * real flick from the top can reproduce the same gap on a cold cache.
   *
   * Fired on a timer instead, not gated on `usePreloaderReady()` — that flag never
   * resolves if the entrance warmup stalls, and an idle prefetch gated on it would
   * silently never run, which is exactly the case that needs the prefetch most.
   * `requestIdleCallback`'s own `timeout` option is the mechanism: it runs during
   * idle time if the browser has any inside `WALL_WARM_DELAY_MS`, and is forced to
   * run at that deadline regardless — so it never competes with the preloader's
   * critical-path work, and never misses its deadline either. Safari has no
   * `requestIdleCallback`, hence the `setTimeout` fallback.
   */
  const wallWarmedRef = useRef(false);
  const wallPrefetchLinksRef = useRef<HTMLLinkElement[]>([]);

  useEffect(() => {
    if (wallWarmedRef.current) return;

    const warm = () => {
      if (wallWarmedRef.current) return;
      wallWarmedRef.current = true;
      void import("./HeroImageWall");

      // The chunk gets the wall's *code*; these prefetch the 25 image bytes it
      // will request the moment it mounts. `prefetch`, not `preload` — this must
      // never contend with the hero's own LCP element for bandwidth.
      const links: HTMLLinkElement[] = [];
      for (const tile of HERO_WALL_TILES) {
        if (document.querySelector(`link[rel="prefetch"][href="${tile.src}"]`)) continue;
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.as = "image";
        link.href = tile.src;
        document.head.appendChild(link);
        links.push(link);
      }
      wallPrefetchLinksRef.current = links;
    };

    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(warm, { timeout: WALL_WARM_DELAY_MS });
    } else {
      timeoutHandle = setTimeout(warm, WALL_WARM_DELAY_MS);
    }

    return () => {
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
      for (const link of wallPrefetchLinksRef.current) link.remove();
      wallPrefetchLinksRef.current = [];
    };
  }, []);

  useStagePresence(containerRef, "hero");
  const { registerAnchor } = useNavbar();

  /**
   * Who owns the navbar's light/dark, and when.
   *
   * The 3D gallery mode that used to also drive this (its own sky toggle
   * could put a dark ground under the header before the pin's dwell ended)
   * was retired — the hero renders the legacy 2D card only now, so
   * `stage.navDark` alone decides, exactly as it does from the dwell onward.
   */
  const roomIsDark = false;

  const navActive = stage.navActive;
  const navDark = stage.navDark;

  useEffect(() => {
    if (navActive) {
      // Very negative `top`: this anchor is manually driven (not
      // IntersectionObserver-based, see NavbarContext.tsx's `useNavbarAnchor` doc),
      // so it never reports real geometry. A large negative sentinel means any
      // concurrently-intersecting, freshly-entered real anchor (which by
      // definition has a much larger/less-negative `top`) always wins the
      // handoff, instead of this one blocking on an arbitrary default.
      registerAnchor(NAV_ANCHORS.HERO_GUNSHOT, true, navDark, -Infinity);
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

          const next = heroStage(p, false);
          if (!sameStage(stageRef.current, next)) {
            stageRef.current = next;
            setStage(next);
            if (next.gunshot) {
              setWallMounted(true);
              // The wall's own layout (and the pin-spacer's measured height,
              // via `invalidateOnRefresh`) settles only after this commits and
              // paints. Belt-and-suspenders with the home page's ResizeObserver
              // refresh (routes/index.tsx): fired once, post-paint, so triggers
              // below the hero stop reading stale positions from before the
              // wall existed.
              if (!wallMountRefreshedRef.current) {
                wallMountRefreshedRef.current = true;
                requestAnimationFrame(() => ScrollTrigger.refresh());
              }
            }
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
        // SCRUB POLICY (beatThresholds.ts): legitimate here because this is a
        // pin whose progress IS the timeline position, not an entrance/recede
        // event. (Not `SCROLL_SPEED` — this pin's own tuned value predates
        // that shared constant and has its own reasoning below.)
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
        // First thing on the page, so first to refresh. This pin's spacer sets
        // the document offset every trigger below it measures against, and
        // ScrollTrigger refreshes the HIGHEST `refreshPriority` first (see
        // beatThresholds.ts) — `order: 0` is therefore the top of the scale,
        // ahead of every downstream beat and every un-migrated trigger.
        // Affects refresh ordering only — no phase constant, easing, ANIM_LIMIT
        // or HERO_PIN_DISTANCE value is touched, and the ladder probe confirms
        // the hero's resolved geometry is byte-identical at 375/768/1440.
        refreshPriority: refreshPriorityFor(0),
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
        data-hero-mode="legacy"
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

        {/* Flanking Text Elements (Appear during Smoking — vertical movement)
         *
         * Gold, unconditionally, rather than the old `stage.borderDone ? gold :
         * navyField` — `borderDone` doesn't flip true until progress 1.0
         * (`borderAnimProgress`), while this text is on screen from 0.74 to 0.82.
         * `navyField` on the navy gunshot wash is two near-identical hues, which is
         * why it used to read as a flat pale rectangle instead of legible type. Gold
         * is the one color in this composite guaranteed to clear the wash (see the
         * contrast note in `HeroImageWall.tsx`), so it now carries the whole phase,
         * not just the last 5% of it. A hairline rule above each line — the same
         * kicker/label treatment `EyeFlow.tsx` uses for its chapter rail — gives the
         * two lines a designed identity instead of floating text at flat weight. */}
        {stage.flank && (
          <>
            {/* Top Text: YEARS OF EXCELLENCE */}
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
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <Box sx={{ width: 40, height: "1px", bgcolor: NOIR.gold, opacity: 0.85 }} />
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "0.8rem", sm: "1.15rem", md: "1.5rem" },
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: NOIR.gold,
                  textShadow: "0 2px 14px rgba(6, 24, 59, 0.55)",
                }}
              >
                YEARS OF EXCELLENCE
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
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "0.72rem", sm: "0.95rem", md: "1.15rem" },
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: NOIR.gold,
                  textShadow: "0 2px 14px rgba(6, 24, 59, 0.55)",
                }}
              >
                GENERATIONS OF COMPETITIVENESS
              </Typography>
              <Box sx={{ width: 40, height: "1px", bgcolor: NOIR.gold, opacity: 0.85 }} />
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

          {/* Video background mode: the baked night→dawn loop, filling the same
              area the R3F canvas fills but sitting behind it — the canvas below
              renders with a transparent clear colour and skips `SkyDome`/
              `CloudSea` (see `PlaygroundCanvas.tsx`'s `hideSky`) so the mark and
              its lighting draw on top of this rather than doubling up on it. */}
          {useVideoBg && (
            <Box
              aria-hidden
              ref={bgContainerRef}
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
                ref={bgVideoRef}
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
                {bgShouldLoad && !bgPosterOnly && (
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
            <LegacyHeroCanvas
              handleRef={canvasHandleRef}
              varsHostRef={containerRef}
              activeNode={selectedNodeIndex}
              onNodeSelect={handleNodeSelect}
            />
          </Box>

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


          {/* PHITOPOLIS Word Transition — Legacy 2D Hero Sequence Mode */}
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
