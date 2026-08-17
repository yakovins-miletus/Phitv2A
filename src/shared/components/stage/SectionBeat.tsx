import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { GROUNDS } from "@/shared/theme/grounds";
import { STAGE_ATTR } from "@/shared/sections";
import type { SectionDef } from "@/shared/sections";
import { useReducedMotion } from "@/shared/motion";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import {
  BEAT_ENTER_START,
  BEAT_EXIT_START,
  BEAT_EXIT_END,
  refreshPriorityFor,
} from "@/shared/motion/beatThresholds";
import { useStagePresence } from "./stagePresence";
import { StageKicker } from "./StageKicker";
import {
  STAGE_CHOREO,
  STAGE_LIT,
  STAGE_LIT_CLIP,
  STAGE_EXIT,
  resolveChoreoFrom,
} from "@/shared/components/stageChoreo";
import {
  MAJOR_ESTABLISH,
  MINI_ESTABLISH,
  laserSweepX,
  rulerTransformOrigin,
} from "./establishChoreo";
import type { EstablishChoreo } from "./establishChoreo";

gsap.registerPlugin(ScrollTrigger);

/**
 * `SectionBeat` — one *beat* of the home page: the establishing shot that
 * announces a section plus the section content itself, played by **one timeline
 * on one ScrollTrigger**.
 *
 * It replaces the two-components-two-clocks arrangement (`MajorEstablishingShot`
 * / `MiniEstablishingShot` each owning a `once: true` time-based trigger, the
 * content owning a separate scrub) that could not stay in sync at arbitrary
 * scroll velocity: fast scroll left the shot animating over an already-lit
 * section, slow scroll finished the shot and then stalled. Here the shot's five
 * steps and the section's reveal are labels on the same timeline, so their
 * relationship is fixed in seconds and independent of scroll speed.
 *
 * Two triggers, deliberately:
 *   1. Entrance — one-shot (`once: true`, `toggleActions: "play none none
 *      none"`), time-based, NO scrub.
 *   2. Exit dim — a separate top-level tween with a scrub over a disjoint range
 *      (`BEAT_EXIT_START` → `BEAT_EXIT_END`). GreenSock forbids `scrub` +
 *      `toggleActions` on ONE trigger; two triggers on one element with
 *      non-overlapping ranges is the sanctioned way to keep the cinematic
 *      recede.
 *
 * INVARIANT — no stranded content (inherited from `stageChoreo.ts:5-9` and
 * `establishChoreo.ts`, and *load-bearing* here because the entrance is
 * `once: true`): **every tween is a `fromTo`/`from`, and the DOM default IS the
 * final lit state.** If the entrance trigger never fires — a hard refresh below
 * this section, a hash nav straight past it — GSAP never writes the from-state
 * and the content simply renders lit. Never `gsap.set()` an element hidden and
 * animate it in; never express the hidden state in `sx`/`style`.
 */

/** How long to wait before rescuing a beat whose entrance trigger never fired.
 *  Comfortably past first paint, ScrollTrigger's own refresh, and the entrance
 *  choreography, so it only ever catches genuine failures. */
const BEAT_FAILSAFE_MS = 2000;


/** Announce → content overlap, in seconds.
 *
 *  The section reveal starts 0.55s into the establishing shot rather than after
 *  it. Both shot tempos put their headline wipe (`mask`, `at: 0.1`, ~0.85-0.95s
 *  long) roughly two-thirds done at 0.55s, so the content begins rising while
 *  the headline is still resolving — the pair reads as one breath, one
 *  continuous gesture, instead of "card, pause, section". Waiting for the full
 *  1.05s/1.30s reads as two separate events; overlapping much earlier (~0.3s)
 *  puts the content in motion before the headline is legible, which defeats the
 *  point of announcing it. Tuning knob: raise it to separate the pair, lower it
 *  to tighten. */
const ANNOUNCE_OVERLAP = 0.55;

/** Entrance duration for the content reveal. Time-based (the whole point of the
 *  refactor), and close to the shot tempos so neither half of the beat visibly
 *  outlasts the other. */
const CONTENT_ENTER_DURATION = 0.9;
const CONTENT_ENTER_EASE = "power3.out";

/** Kicker hairline draw, offset inside the content phase so it trails the rise
 *  rather than racing it. */
const KICKER_AT = "content+=0.16";
const KICKER_DURATION = 0.5;

/**
 * The establishing half of a beat, as *data*.
 *
 * An earlier revision inferred both of these from the rendered markup —
 * `root.querySelector("section[id^='shot-']")` for the tempo and
 * `getComputedStyle(ruler).textAlign` for the caliper's growth anchor. Both
 * worked and both were wrong in kind: the timeline's token set became a
 * function of a DOM id prefix and an inherited CSS property, so renaming a shot
 * id or restyling a container would silently retempo the animation, and the
 * `getComputedStyle` read forced a style recalculation at tween-build time.
 * The shot's identity is known at the call site; it is passed, not sniffed.
 *
 * Modelled as a union so the compiler enforces the pairing: pass a shot and you
 * MUST declare its scale; pass no shot and you may not declare one.
 */
type EstablishProps =
  | {
      establishing?: undefined;
      establishScale?: undefined;
      establishAlign?: undefined;
    }
  | {
      /**
       * The establishing shot that announces this section, rendered *before*
       * the content in DOM order (announce-then-content — natural reading
       * order, no CSS `order`, no absolute positioning, no transform-faked
       * ordering).
       *
       * MUST be passed `selfDriven={false}` so it renders markup only and this
       * component drives it via the `.est-*` class hooks.
       */
      establishing: ReactNode;
      /** Which tempo the shot plays at — `MAJOR_ESTABLISH` (1.30s statement)
       *  or `MINI_ESTABLISH` (1.05s aside). Also decides layout: major shots
       *  are self-contained full-width `<section>`s that bring their own
       *  `<Container>`, so they render outside this beat's Container; mini
       *  shots are inline blocks that share it. */
      establishScale: "major" | "mini";
      /** Caliper growth anchor. Mirrors `MiniEstablishingShot`'s `align` prop;
       *  major shots are always left-anchored. Defaults to `"left"`. */
      establishAlign?: "left" | "center";
    };

interface SectionBeatBaseProps {
  section: SectionDef;
  /**
   * Page order of this beat, low to high (hero = 0), mapped through
   * `refreshPriorityFor(order)`. Required: React mounts these components in a
   * different order than they appear on the page, and refresh must run
   * top-to-bottom or the pin-spacers above a beat resolve after it and shift its
   * start/end.
   */
  order: number;
  /** Rendered outside the animated `.stage-inner`, so it inherits none of the
   *  reveal's transforms. */
  background?: ReactNode;
  /** Paper band with hairline borders — used to alternate page rhythm. */
  muted?: boolean;
  /** Suppresses the scrubbed exit-dim tween below. Default `false` (exit dim
   *  plays), matching every beat migrated so far — this is additive and
   *  changes nothing at any existing call site. Set `true` only for a beat
   *  with nothing after it to recede toward, e.g. the page's closing section. */
  noExitDim?: boolean;
  /**
   * Escape hatch for the two pinned specials (`UseCasesNarrative`,
   * `DailyLifeSection`). Default `false` — every existing call site is
   * unaffected.
   *
   * When `true`, `children` render in a plain sibling `<div>` OUTSIDE the
   * animated `Container`/`.stage-inner` instead of inside it. The shot still
   * gets its own entrance timeline/ScrollTrigger (so the pair still announces
   * as one beat) and `useStagePresence`/`refreshPriority` are still wired —
   * only the content wrapping changes. This matters because `children` here
   * is itself a pinned ScrollTrigger (`pin: true`): GreenSock requires
   * `containerAnimation` for a trigger element with a moving ancestor, and
   * `containerAnimation` disables pinning/snapping — never acceptable for
   * these two sections. `.stage-inner`'s scale/opacity/y tween and the
   * exit-dim tween both target `.stage-inner` only, so with `bare` there is
   * nothing for either to find — `noExitDim` should also be passed `true`
   * alongside `bare` for exactly that reason (kept as a separate prop rather
   * than implied, so the two independent responsibilities the props already
   * had before `bare` existed don't need to become one).
   */
  bare?: boolean;
  children: ReactNode;
  sx?: SxProps<Theme> | undefined;
}

export type SectionBeatProps = SectionBeatBaseProps & EstablishProps;

/** Token set for a declared scale. Data in, data out — no DOM query. */
const ESTABLISH_CHOREO: Record<"major" | "mini", EstablishChoreo> = {
  major: MAJOR_ESTABLISH,
  mini: MINI_ESTABLISH,
};

/** Dev-only guard: two beats sharing an `order` would take the same
 *  `refreshPriority`, and ScrollTrigger would fall back to DOM position between
 *  them — silently reintroducing the arbitrary refresh order this prop exists to
 *  eliminate. */
const mountedOrders = new Set<number>();

function useUniqueOrderAssertion(order: number, id: string): void {
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (mountedOrders.has(order)) {
      console.error(
        `[SectionBeat] duplicate order ${order} (section "${id}"). Each beat needs a unique page order — see beatThresholds.ts.`,
      );
    }
    mountedOrders.add(order);
    return () => {
      mountedOrders.delete(order);
    };
  }, [order, id]);
}

export function SectionBeat({
  section,
  establishing,
  establishScale,
  establishAlign = "left",
  order,
  background,
  muted = false,
  noExitDim = false,
  bare = false,
  children,
  sx,
}: SectionBeatProps) {
  // The ground comes from the section registry, not a prop, so the scroll-driven
  // ground layer reads exactly what this paints. See SectionDef.ground.
  const surface = section.ground ? GROUNDS[section.ground] : null;
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useUniqueOrderAssertion(order, section.id);
  useStagePresence(ref, section.id, order);

  useGSAP(
    () => {
      // `reduced` is `null` on first render, so it MUST stay in the dependency
      // array below — otherwise the wrong branch sticks permanently.
      if (reduced === true || !ref.current) return;
      const root = ref.current;
      const inner = root.querySelector(".stage-inner");
      if (!inner) return;

      const priority = refreshPriorityFor(order);
      const hasShot = Boolean(establishing) && root.querySelector(".est-mask") !== null;

      const variant = section.choreo ?? "rise";
      const isNarrow = window.matchMedia("(max-width: 599.95px)").matches;
      const from = resolveChoreoFrom(variant, isNarrow);
      gsap.set(inner, { transformOrigin: STAGE_CHOREO[variant].transformOrigin });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: BEAT_ENTER_START,
          once: true,
          toggleActions: "play none none none",
          refreshPriority: priority,
          // NO `invalidateOnRefresh` here — it is load-bearing that this is
          // absent, and it pairs badly with `once: true`.
          //
          // Invalidating re-arms the from-vars, and because `fromTo` renders
          // them immediately that re-hides the content. A `once` trigger has
          // already spent its single firing by then and will never play again,
          // so the section stays dark for good. Refreshes are routine — resize,
          // late image loads, fonts settling — which is why this presented as
          // "it was fine, then it vanished". The exit tween below keeps its
          // own invalidateOnRefresh: it is scrubbed, its values are
          // layout-dependent, and it re-runs on every pass.
        },
      });

      tl.addLabel("announce", 0);

      if (hasShot) {
        const c = ESTABLISH_CHOREO[establishScale ?? "mini"];
        // Scoped selectors only — every query below is rooted at this
        // component's own element (see gsap-react/SKILL.md:128). The shot markup
        // is a child of this scope, which is exactly why the `.est-*` hooks
        // exist.
        const [meta] = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".est-meta"));
        const [ruler] = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".est-ruler"));
        const [mask] = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".est-mask"));
        const [laser] = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".est-laser"));

        if (meta) {
          tl.fromTo(
            meta,
            c.meta.from,
            { ...c.meta.to, duration: c.meta.duration, ease: c.meta.ease },
            `announce+=${c.meta.at}`,
          );
        }

        if (ruler) {
          // Centred mini shots grow their caliper from the middle; everything
          // else is left-anchored. Declared by the call site (`establishAlign`),
          // never read back off the DOM.
          tl.fromTo(
            ruler,
            { ...c.ruler.from, transformOrigin: rulerTransformOrigin(establishAlign) },
            { ...c.ruler.to, duration: c.ruler.duration, ease: c.ruler.ease },
            `announce+=${c.ruler.at}`,
          );
        }

        if (mask) {
          tl.fromTo(
            mask,
            c.mask.from,
            { ...c.mask.to, duration: c.mask.duration, ease: c.mask.ease },
            `announce+=${c.mask.at}`,
          );
        }

        if (laser) {
          // A transform, not `left` — the sweep composites instead of forcing
          // layout on every frame.
          tl.fromTo(
            laser,
            c.laser.from,
            {
              ...c.laser.to,
              x: () => laserSweepX(laser),
              duration: c.laser.duration,
              ease: c.laser.ease,
            },
            `announce+=${c.laser.at}`,
          ).to(laser, { ...c.laserOut.to, duration: c.laserOut.duration }, c.laserOut.at);
        }
      }

      // Unpaired sections collapse the two labels onto each other, so one
      // component serves paired and unpaired beats with no branching below.
      tl.addLabel("content", hasShot ? `announce+=${ANNOUNCE_OVERLAP}` : "announce");

      // `bare` beats render their `children` outside `.stage-inner` entirely
      // (see the `bare` doc on SectionBeatBaseProps) — there is nothing of the
      // pinned section inside `inner` to reveal, so this tween would just
      // animate an empty/kicker-only container. Skipped, not merely inert:
      // the ladder probe should find no such tween on these beats.
      if (!bare) {
        tl.fromTo(
          inner,
          from,
          {
            ...STAGE_LIT,
            // Only clip-carrying variants ever touch clip-path (see stageChoreo).
            ...(from.clipPath !== undefined ? { clipPath: STAGE_LIT_CLIP } : {}),
            duration: CONTENT_ENTER_DURATION,
            ease: CONTENT_ENTER_EASE,
            // Nothing is pre-hidden: the from-vars land when the trigger fires,
            // not when the tween is built. Paired with BEAT_ENTER_START ("top
            // bottom") this is invisible — the section is still fully below the
            // fold at that moment — and it means a beat whose trigger never
            // fires renders LIT rather than blank, which is the INVARIANT above.
            immediateRender: false,
          },
          "content",
        );
      }

      const line = root.querySelector(".stage-kicker-line");
      if (line) {
        tl.fromTo(
          line,
          { scaleX: 0 },
          { scaleX: 1, duration: KICKER_DURATION, ease: "power2.out" },
          KICKER_AT,
        );
      }

      // Exit dim — SEPARATE top-level tween, never a child of the entrance
      // timeline, and over a range disjoint from the entrance trigger's.
      // Skipped entirely for beats with nothing after them to recede toward
      // (e.g. the page's closing section) — no trigger is created at all,
      // not merely a no-op tween, so there is nothing to find on the ladder
      // probe either.
      if (!noExitDim) {
        gsap.to(inner, {
          ...STAGE_EXIT,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: BEAT_EXIT_START,
            end: BEAT_EXIT_END,
            scrub: SCROLL_SPEED,
            refreshPriority: priority,
            invalidateOnRefresh: true,
          },
        });
      }

      // Failsafe for the INVARIANT above.
      //
      // The from-vars are applied at mount (see the note on the content
      // tween), so until the entrance trigger fires this section is dark. That
      // is correct while it is still below the fold — and a bug the moment the
      // trigger fails to fire for a section the reader is actually looking at.
      // That is precisely what stranded services/process/reach/candidates/blog
      // on the live build.
      //
      // So: once, after layout has had time to settle, if the section already
      // satisfies its own start condition and the timeline still has not run,
      // jump it to the end. `progress(1)` rather than `play()` — the reader is
      // already looking at this content, and animating it in now would be the
      // same late snap this whole comment exists to avoid.
      const failsafe = window.setTimeout(() => {
        if (tl.progress() > 0) return;
        const box = root.getBoundingClientRect();
        // On screen at all: the reader can see this section, so it must be lit.
        if (box.top < window.innerHeight && box.bottom > 0) tl.progress(1);
      }, BEAT_FAILSAFE_MS);

      return () => {
        window.clearTimeout(failsafe);
      };
    },
    {
      scope: ref,
      dependencies: [reduced, section.choreo, order, establishScale, establishAlign, noExitDim, bare],
    },
  );

  return (
    <Box
      component="section"
      ref={ref}
      id={section.id}
      {...{ [STAGE_ATTR]: "" }}
      sx={{
        // minHeight (not height) so tall stages (Careers, Blog) still grow;
        minHeight: "100svh",
        display: "flex",
        // A major shot renders as a sibling of the content Container, so the
        // flex axis has to be vertical or the two would sit side by side.
        // Same reasoning applies whenever `bare` adds a second top-level flex
        // child (the sibling content div) alongside the Container, regardless
        // of shot scale — row would place the shot and the pinned content
        // side by side instead of stacked.
        ...(bare || (establishing && establishScale === "major")
          ? { flexDirection: "column", alignItems: "stretch", justifyContent: "center" }
          : { alignItems: "center" }),
        py: bare ? 0 : { xs: 6, md: 10 },
        // Transparent by design: GroundLayer paints the surface behind every
        // section and moves it with scroll.
        bgcolor: "transparent",
        color: surface ? surface.fg : undefined,
        borderTop: surface ? 0 : muted ? 1 : 0,
        borderBottom: surface ? 0 : muted ? 1 : 0,
        borderColor: "divider",
        overflow: "visible",
        ...sx,
      }}
    >
      {/* Announce, then content — DOM order matches visual order.
          A major shot is a full-width `<section>` that supplies its own
          `<Container>`; nesting it inside this one would double the gutters and
          indent the headline relative to the content it announces, so it sits
          outside. Mini shots are inline blocks and share the Container. */}
      {establishing && establishScale === "major" ? (
        <div className="beat-shot" style={{ position: "relative", zIndex: 2, width: "100%" }}>
          {establishing}
        </div>
      ) : null}
      <Container maxWidth="2xl" sx={{ position: "relative", height: "100%", overflow: "visible" }}>
        {background}
        {establishing && establishScale !== "major" ? (
          <div className="beat-shot" style={{ position: "relative", zIndex: 2 }}>
            {establishing}
          </div>
        ) : null}
        <div className="stage-inner" style={{ position: "relative", zIndex: 1, overflow: "visible" }}>
          <Stack spacing={4}>
            {section.kicker ? <StageKicker index={section.kicker} label={section.label} /> : null}
            {/* `bare` beats render `children` in a plain sibling below,
                never here — a parent transform on `.stage-inner` moving a
                pinned child's trigger element is exactly the bug class this
                prop exists to avoid. See the `bare` doc above. */}
            {!bare ? children : null}
          </Stack>
        </div>
      </Container>
      {bare ? (
        <div className="beat-bare-content" style={{ position: "relative", width: "100%" }}>
          {children}
        </div>
      ) : null}
    </Box>
  );
}
