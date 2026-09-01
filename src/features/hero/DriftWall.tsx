/**
 * A wall of image tiles in vertical columns, drifting at staggered speeds behind a
 * perspective tilt and an edge dissolve.
 *
 * This is a **fork** of the React Bits `DriftWall`, not a copy. The upstream
 * component is built around hover: tiles lift toward the viewer, undim, and take
 * focus. Here the wall is a background texture inside a GSAP-pinned hero, behind an
 * `aria-hidden` / `pointerEvents: none` wrapper (see `HeroImageWall.tsx`), so every
 * one of those paths is unreachable. What was removed, and why:
 *
 *  - **The root `pointermove` handler.** The layer takes no pointer events, so it
 *    could never fire.
 *  - **`document.elementFromPoint()` hit-testing.** A forced synchronous layout read
 *    inside a pointer handler, in a hero that is already running a WebGL canvas and a
 *    per-frame `writeHeroVars` batch. The single most expensive thing upstream does.
 *  - **`focus`/`blur` tile activation and the `activeId` state they drove.** Making
 *    24 unlabelled images focusable inside a pinned scroll region the reader cannot
 *    scroll away from is a keyboard trap in all but name.
 *  - **The `parallax` prop.** Its only driver was the pointer position. Keeping it
 *    and passing 0 would leave a lie in the type signature.
 *  - **The `lift` prop.** Hover-only upstream (`.is-active .inner { translateZ(...) }`).
 *    It dies with hover.
 *  - **Upstream's own `matchMedia('(prefers-reduced-motion)')` block**, in favour of
 *    `useReducedMotion()` from `@/shared/motion` — one source of truth per that
 *    module's docblock.
 *
 * Reduced-motion no longer gates this component's own rAF loop. Product decision:
 * the hero's entrance/drift choreography (this wall included) always plays, regardless
 * of the OS-level reduced-motion preference — `heroStage()` in `heroVars.ts` now always
 * takes its non-reduced branch too, so `wallDrift`/`gunshot` are never forced off by
 * that setting either. This file no longer imports `useReducedMotion()`.
 *
 * Scroll causes zero renders here, matching the contract in `HeroCanvas.tsx`: the
 * frame loop writes `transform` straight onto the column tracks and never touches
 * React state. The only state is the measured container size, which changes on resize.
 */

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { DriftItem } from "./heroWallTiles";
import "./driftWall.css";

/**
 * How much taller than the container the plane has to be, per unit of `zoom`.
 *
 * The plane is scaled and then pitched/yawed/rolled, so its footprint overshoots the
 * frame in both axes. 1.36 per unit zoom covers the worst case at the angles this
 * hero uses; anything less and a column's end swings into view during the yaw.
 *
 * Expressed per-unit rather than as a flat number so that zooming in — which makes
 * the plane cover *more* vertical distance — also raises the height the wrap has to
 * cover. A fixed overshoot would silently under-provision copies at higher zoom and
 * let a gap slide in from the bottom.
 */
const PLANE_OVERSHOOT_PER_ZOOM = 1.36;

/** Hard ceiling on vertical repeats. With the tile heights we ship, 2 is the real
 *  answer; this only bounds the pathological case of a very short tile. */
const MAX_COPIES = 3;

/** Roughly how much horizontal room one column needs before another one earns its
 *  place. Below `tileWidth * 0.55` of width per column the wall reads as a grid, not
 *  a wall, and the node count stops paying for itself. */
const COLUMN_WIDTH_RATIO = 0.55;

/** Time constant for the velocity ease-in, in seconds. Frame-rate independent. */
const VELOCITY_TAU = 0.28;

/** Longest frame delta we integrate. A backgrounded tab hands back a delta measured
 *  in seconds; without this clamp every column would jump a full wrap on return. */
const MAX_FRAME_DT = 0.05;

/**
 * Per-column speed multiplier, deterministic and evenly spread.
 *
 * The golden-ratio increment gives a low-discrepancy sequence — consecutive columns
 * land far apart in [-1, 1] — so neighbouring columns never share a speed and the
 * wall never falls into visible lockstep. `Math.random()` would do the same thing on
 * average but differently on every mount, which makes a visual regression untestable.
 */
function columnFactor(index: number, variance: number): number {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
}

/** Everything the frame loop needs for one column, in one object.
 *
 *  Upstream kept four parallel arrays (offsets, velocities, meta, refs) and indexed
 *  all of them by `c` inside the loop. Under `noUncheckedIndexedAccess` every one of
 *  those reads is `T | undefined`, and a `?? 0` on the hot path is both noise and a
 *  lie about what can actually be missing. One array of mutable records iterates with
 *  `for..of` — no index access, no fallbacks. */
interface ColumnRuntime {
  el: HTMLDivElement | null;
  /** Current scroll offset, clamped to [0, copyHeight] — see the bounce note below. */
  offset: number;
  /** Current px/s, eased toward `baseSpeed * bounceSign`. */
  velocity: number;
  /** Height of one full item cycle. Also the bounce's upper bound. */
  copyHeight: number;
  /** Signed px/s this column settles at before the bounce flips it. Carries the
   *  column's original direction (`direction` prop x per-column alternation). */
  baseSpeed: number;
  /** ±1, flipped whenever `offset` reaches either bound. Multiplied against
   *  `baseSpeed` to get the column's current target velocity — see the bounce
   *  note on the frame loop below. */
  bounceSign: number;
}

/** CSS custom properties are not in `CSSProperties`. Declaring the pattern keeps the
 *  rest of the object type-checked, which a blanket `as CSSProperties` would not. */
interface DriftWallVars extends CSSProperties {
  [key: `--dw-${string}`]: string | number;
}

export interface DriftWallProps {
  /** Tiles to distribute across the columns. */
  items: readonly DriftItem[];
  /** Column count *ceiling*. The effective count is derived from measured width. */
  columns?: number;
  tileWidth?: number;
  tileHeight?: number;
  gap?: number;
  radius?: number;
  /** Perspective pitch, degrees (rotateX). */
  tilt?: number;
  /** Perspective yaw, degrees (rotateY). */
  turn?: number;
  /** In-plane rotation, degrees (rotateZ). */
  roll?: number;
  /** Perspective distance in px. Smaller is more dramatic. */
  perspective?: number;
  /** How far the wall sits back from the viewer, px. */
  depth?: number;
  /** Uniform scale on the plane. Raise it to close bare edges the rotations open up. */
  zoom?: number;
  /** Base drift speed, px/s. */
  speed?: number;
  /** Primary drift direction. Columns alternate around it. */
  direction?: "up" | "down";
  /** How much column speeds differ from each other, 0..1. */
  variance?: number;
  /** Strength of the edge dissolve, 0..1. */
  fade?: number;
  /** Resting darkness of the tiles, 0..1. */
  dim?: number;
  /** Desaturation of the tiles, 0..1. */
  grayscale?: number;
  /** Tint painted over each tile. */
  overlayColor: string;
  /** How strongly `overlayColor` is laid over the tiles, 0..1. */
  tint?: number;
  /** Freeze the drift and stop the rAF loop entirely. */
  paused?: boolean;
}

export function DriftWall({
  items,
  columns = 4,
  tileWidth = 300,
  tileHeight = 280,
  gap = 24,
  radius = 14,
  tilt = 16,
  turn = -10,
  roll = -8,
  perspective = 1600,
  depth = 220,
  zoom = 1.18,
  speed = 26,
  direction = "up",
  variance = 0.35,
  fade = 0.22,
  dim = 0.55,
  grayscale = 0.35,
  overlayColor,
  tint = 0.42,
  paused = false,
}: DriftWallProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ColumnRuntime[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  /** Measured container box. The initial 0s are never used to size anything — the
   *  guards below treat a zero measurement as "not laid out yet". */
  const [box, setBox] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setBox((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  /** Effective column count, derived from measured width rather than a media query,
   *  so it tracks the container instead of the viewport. One state commit per resize;
   *  nothing here runs per frame. */
  const effectiveColumns = useMemo(() => {
    if (box.width <= 0) return columns;
    const fits = Math.floor(box.width / (tileWidth * COLUMN_WIDTH_RATIO));
    return Math.max(2, Math.min(columns, fits));
  }, [box.width, columns, tileWidth]);

  /**
   * Round-robin the items into columns.
   *
   * `filter` rather than the upstream `cols[i % columns].push(item)`: that push is an
   * index access into a possibly-empty slot, which `noUncheckedIndexedAccess` rejects,
   * and patching it with `?.push` would silently drop tiles instead of failing. The
   * distribution is identical. O(n x columns) on 24 items, once per resize.
   */
  const columnItems = useMemo<readonly (readonly DriftItem[])[]>(
    () =>
      Array.from({ length: effectiveColumns }, (_, c) =>
        items.filter((_, i) => i % effectiveColumns === c),
      ),
    [items, effectiveColumns],
  );

  /**
   * How many times each column's item list repeats.
   *
   * The wall bounces rather than wraps (see the frame loop below), but the sizing
   * requirement is the same one that used to serve the wrap: the track has to stay
   * at least one full copy taller than the plane, so that even at the bounce's own
   * extremes — `offset` at 0 or at `copyHeight` — the visible window is still
   * covered by real tiles rather than running off the end of the track. Once
   * `copyHeight >= planeHeight` that is satisfied by two copies, which is the whole
   * reason the tiles are sized the way they are.
   *
   * Solved against the **shortest** column, not the longest. One repeat count is
   * shared by every column, but each column wraps on its own cycle, so the column
   * with the fewest items has the shortest cycle and is the one that runs out of
   * covering material first. Sizing to the longest column looks correct and lets a
   * gap slide in from the bottom of any column that is one item short — which is
   * what happens the moment the item count stops dividing evenly by the column
   * count. (`heroWallTiles.ts` keeps it divisible; this makes the failure a
   * non-event rather than a trap.)
   *
   * The guards are not defensive padding. `ceil(planeHeight / copyHeight)` is
   * `Infinity` when either operand is 0 — an empty column, or a container that has
   * not been laid out — and `Array.from({ length: Infinity })` **throws** a
   * RangeError. jsdom hits exactly this: `tests/setup.ts` stubs ResizeObserver as a
   * no-op, so the measured height stays 0 forever.
   */
  const copies = useMemo(() => {
    const planeHeight = box.height * PLANE_OVERSHOOT_PER_ZOOM * zoom;
    const shortest = columnItems.reduce(
      (min, col) => Math.min(min, col.length),
      Number.POSITIVE_INFINITY,
    );
    const copyHeight = Number.isFinite(shortest) ? shortest * (tileHeight + gap) : 0;
    if (copyHeight <= 0 || planeHeight <= 0) return 1;
    return Math.min(MAX_COPIES, Math.ceil(planeHeight / copyHeight) + 1);
  }, [box.height, columnItems, tileHeight, gap, zoom]);

  /**
   * Rebuild the frame-loop state whenever the wall's shape changes.
   *
   * The track elements are collected here by query rather than through `ref`
   * callbacks. React 19 inspects a ref callback's return value for a cleanup
   * function, so the upstream `ref={el => (refs.current[c] = el)}` is both a type
   * error and a runtime warning — and the assignment form indexes into an array that
   * may be shorter than the column count mid-resize. Building the array in one pass
   * from the DOM makes both problems structural rather than guarded, and drops N
   * closures from every render.
   */
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const tracks = el.querySelectorAll<HTMLDivElement>(".dw-track");
    const dirSign = direction === "up" ? 1 : -1;

    runtimeRef.current = Array.from(tracks, (track, c) => {
      const col = columnItems[c];
      const copyHeight = Math.max(1, (col?.length ?? 1) * (tileHeight + gap));
      // Alternating sign so adjacent columns move against each other; that
      // counter-motion is what reads as depth rather than as a single scrolling sheet.
      const altSign = c % 2 === 0 ? 1 : -1;
      return {
        el: track,
        // Stagger the starting phase so the columns do not all begin on a tile edge.
        offset: copyHeight * ((c * 0.37) % 1),
        velocity: 0,
        copyHeight,
        baseSpeed: speed * columnFactor(c, variance) * dirSign * altSign,
        bounceSign: 1,
      };
    });

    // Paint the staggered start immediately. Without this the first frame shows every
    // column aligned, and the stagger visibly snaps in one frame later.
    for (const col of runtimeRef.current) {
      if (col.el) col.el.style.transform = `translate3d(0, ${-col.offset}px, 0)`;
    }
  }, [columnItems, copies, tileHeight, gap, speed, variance, direction]);

  /**
   * The frame loop.
   *
   * Stops entirely when paused, or when the tab is hidden — the contract
   * `HeroCanvas.tsx` sets for everything in this hero: the loop does not idle. A
   * paused wall costs one contained, un-animated subtree. Does not stop for
   * reduced motion: the hero's entrance/drift choreography always plays.
   *
   * Also does not start before the container has been measured. Until the
   * ResizeObserver delivers, `copies` is 1, and one copy cannot wrap seamlessly — it
   * would drift a visible gap in from the bottom edge for however many frames the
   * measurement takes. Static and unmeasured is fine; moving and unmeasured is not.
   */
  useEffect(() => {
    if (paused || box.height <= 0) return;

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };

    const frame = (ts: number) => {
      const last = lastTsRef.current;
      lastTsRef.current = ts;
      // First frame after a start or a resume has no delta to integrate.
      if (last !== null) {
        const dt = Math.min(MAX_FRAME_DT, Math.max(0, ts - last) / 1000);
        const ease = 1 - Math.exp(-dt / VELOCITY_TAU);
        for (const col of runtimeRef.current) {
          col.velocity += (col.baseSpeed * col.bounceSign - col.velocity) * ease;
          let next = col.offset + col.velocity * dt;
          // Ping-pong instead of wrap: reflect at both bounds rather than modulo
          // back to 0. A wrap reads as an infinite belt of new material — which is
          // what made the wall feel like it kept "loading new images" even once
          // every tile had decoded. A column repeats after one `copyHeight`, so
          // reflecting inside [0, copyHeight] never needs a fresh, still-decoding
          // copy to slide into view: the wall settles into a fixed, composed set
          // that drifts back and forth rather than an unbounded stream.
          if (next <= 0) {
            next = 0;
            col.bounceSign = 1;
            col.velocity = -col.velocity;
          } else if (next >= col.copyHeight) {
            next = col.copyHeight;
            col.bounceSign = -1;
            col.velocity = -col.velocity;
          }
          col.offset = next;
          if (col.el) col.el.style.transform = `translate3d(0, ${-col.offset}px, 0)`;
        }
      }
      rafRef.current = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (rafRef.current === null) rafRef.current = requestAnimationFrame(frame);
    };

    if (!document.hidden) rafRef.current = requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [paused, box.height]);

  const vars: DriftWallVars = {
    "--dw-tile-w": `${String(tileWidth)}px`,
    "--dw-tile-h": `${String(tileHeight)}px`,
    "--dw-gap": `${String(gap)}px`,
    "--dw-radius": `${String(radius)}px`,
    "--dw-perspective": `${String(perspective)}px`,
    "--dw-depth": `${String(depth)}px`,
    "--dw-zoom": zoom,
    "--dw-tilt": `${String(tilt)}deg`,
    "--dw-turn": `${String(turn)}deg`,
    "--dw-roll": `${String(roll)}deg`,
    "--dw-dim": dim,
    "--dw-gray": grayscale,
    "--dw-overlay": overlayColor,
    "--dw-tint": tint,
    // `fade` is authored as "how much dissolve"; the mask wants "where the opaque
    // core ends", which is its complement.
    "--dw-edge": `${String(Math.max(0, (1 - fade) * 100))}%`,
  };

  return (
    <div ref={rootRef} className="dw-root" style={vars}>
      <div className="dw-plane">
        {columnItems.map((col, c) => (
          // Keyed by index on purpose: a column has no identity beyond its position,
          // and a positional key is what lets a resize re-slice the items without
          // tearing down and rebuilding every track element.
          <div className="dw-col" key={`col-${String(c)}`}>
            <div className="dw-track">
              {Array.from({ length: copies }, (_, copy) =>
                col.map((item) => (
                  <DriftTile key={`${item.id}-${String(copy)}`} src={item.src} />
                )),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * One tile.
 *
 * `loading="eager"` is deliberate and looks wrong. The wall mounts already inside the
 * viewport — it fills a pinned, full-bleed 100vh element — so `lazy` would fetch on
 * the same tick anyway, while adding a real chance of a blank first frame at exactly
 * the moment the wall is supposed to arrive. `fetchPriority="low"` is the attribute
 * that actually does the intended job: it keeps ~2.4MB of photography from competing
 * with the hero's LCP element.
 *
 * `alt=""` is redundant under the `aria-hidden` wrapper and correct if that attribute
 * is ever removed.
 */
function DriftTile({ src }: { src: string }) {
  return (
    <div className="dw-tile">
      <span className="dw-inner">
        <img src={src} alt="" loading="eager" decoding="async" fetchPriority="low" draggable={false} />
        <span className="dw-scrim" />
      </span>
    </div>
  );
}
