import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import "./PixelSwap.css";

/**
 * PixelSwap — a pixel-by-pixel dissolve between two pieces of content.
 *
 * Every pixel is a window onto its own copy of the incoming content, so the grid
 * stays bounded no matter how small the requested pixel size is. Ported from the
 * upstream JS component to strict TS; behaviour is unchanged. The transition runs
 * on discrete `active` flips (Web Animations API), NOT on a continuous scrub —
 * callers driving it from scroll progress must debounce/hysteresis the `active`
 * prop. In-flight animations are cancelled when `active` changes again.
 */

const MAX_PIXELS = 220;
const KEYFRAME_STEPS = 14;

type PatternFn = (x: number, y: number) => number | null;

const PATTERNS: Record<string, PatternFn> = {
  random: () => null,
  center: (x, y) => Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2,
  edges: (x, y) => Math.min(x, 1 - x, y, 1 - y) * 2,
  "left-to-right": (x) => x,
  "right-to-left": (x) => 1 - x,
  "top-to-bottom": (_x, y) => y,
  "bottom-to-top": (_x, y) => 1 - y,
  diagonal: (x, y) => (x + y) / 2,
  spiral: (x, y) => {
    const angle = (Math.atan2(y - 0.5, x - 0.5) + Math.PI) / (Math.PI * 2);
    const radius = Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2;
    return (angle + radius) % 1;
  },
};

export type PixelSwapPattern = keyof typeof PATTERNS;

const EASINGS: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const noise = (seed: number): number => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const makeEasing = (value: string): ((progress: number) => number) => {
  const match = /cubic-bezier\(([^)]+)\)/.exec(value);
  const points = match
    ? match[1]!.split(",").map(Number)
    : EASINGS[value];
  if (!points || points.length !== 4 || points.some(Number.isNaN)) {
    return makeEasing("ease");
  }

  const [x1, y1, x2, y2] = points as [number, number, number, number];
  if (x1 === y1 && x2 === y2) return (progress: number) => progress;

  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  return (progress: number) => {
    let t = progress;
    for (let i = 0; i < 5; i += 1) {
      const slope = (3 * ax * t + 2 * bx) * t + cx;
      if (!slope) break;
      t -= (((ax * t + bx) * t + cx) * t - progress) / slope;
    }
    t = clamp(t, 0, 1);
    return ((ay * t + by) * t + cy) * t;
  };
};

// Pixels grow slightly past their own box so gaps and rounded corners close
// completely by the end. Overlap is invisible because every pixel shows the same
// content locked to the same origin.
const coverScale = (size: number, gap: number, radius: number): number => {
  const p = clamp(radius, 0, 50) / 100;
  const corner = Math.SQRT1_2 / (Math.SQRT2 * (0.5 - p) + p);
  return ((size + gap) / size) * Math.max(1, corner);
};

interface GridPixel {
  id: number;
  left: number;
  top: number;
  offset: number;
}

interface Grid {
  pixels: GridPixel[];
  size: number;
  gap: number;
  width: number;
  height: number;
}

interface BuildGridArgs {
  width: number;
  height: number;
  pixelSize: number;
  gap: number;
  pattern: string;
  randomness: number;
}

const buildGrid = ({
  width,
  height,
  pixelSize,
  gap,
  pattern,
  randomness,
}: BuildGridArgs): Grid => {
  let size = pixelSize;
  let columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
  let rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));

  if (columns * rows > MAX_PIXELS) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / MAX_PIXELS));
    columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
    rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
  }

  const stride = size + gap;
  const originX = (width - (columns * stride - gap)) / 2;
  const originY = (height - (rows * stride - gap)) / 2;
  const order = PATTERNS[pattern] ?? PATTERNS.random!;
  const mix = clamp(randomness, 0, 1);
  const pixels: GridPixel[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const x = columns <= 1 ? 0.5 : column / (columns - 1);
      const y = rows <= 1 ? 0.5 : row / (rows - 1);
      const base = order(x, y);
      const random = noise(index + 1);

      pixels.push({
        id: index,
        left: originX + column * stride,
        top: originY + row * stride,
        offset: base === null ? random : base * (1 - mix) + random * mix,
      });
    }
  }

  return { pixels, size, gap, width, height };
};

interface Keyframes {
  window: Keyframe[];
  content: Keyframe[];
}

interface BuildKeyframesArgs {
  ease: (progress: number) => number;
  startScale: number;
  endScale: number;
  spin: number;
  fade: boolean;
}

// One shared pair of keyframe lists for the whole grid: the window transform and
// its exact inverse, so revealed content never drifts or scales.
const buildKeyframes = ({
  ease,
  startScale,
  endScale,
  spin,
  fade,
}: BuildKeyframesArgs): Keyframes => {
  const windowFrames: Keyframe[] = [];
  const contentFrames: Keyframe[] = [];

  for (let step = 0; step <= KEYFRAME_STEPS; step += 1) {
    const progress = step / KEYFRAME_STEPS;
    const eased = ease(progress);
    const scale = startScale + (endScale - startScale) * eased;
    const angle = spin * (1 - eased);

    windowFrames.push({
      offset: progress,
      opacity: fade ? Math.min(1, eased * 1.6) : 1,
      transform: `rotate(${String(angle)}deg) scale(${String(scale)})`,
    });
    contentFrames.push({
      offset: progress,
      transform: `scale(${String(1 / scale)}) rotate(${String(-angle)}deg)`,
    });
  }

  return { window: windowFrames, content: contentFrames };
};

export type PixelSwapTrigger = "hover" | "click" | "none";

export interface PixelSwapProps {
  firstContent: ReactNode;
  secondContent: ReactNode;
  pixelSize?: number;
  gap?: number;
  pixelRadius?: number;
  pixelSpin?: number;
  pixelScale?: number;
  fade?: boolean;
  duration?: number;
  pixelDuration?: number;
  pattern?: PixelSwapPattern;
  randomness?: number;
  easing?: string;
  trigger?: PixelSwapTrigger;
  initialActive?: boolean;
  active?: boolean;
  onActiveChange?: (next: boolean) => void;
  onComplete?: (active: boolean) => void;
  aspectRatio?: string;
  className?: string;
  style?: CSSProperties;
}

interface TransitionState {
  to: boolean;
  grid: Grid;
}

function PixelSwap({
  firstContent,
  secondContent,
  pixelSize = 64,
  gap = 0,
  pixelRadius = 0,
  pixelSpin = 0,
  pixelScale = 0.35,
  fade = true,
  duration = 1400,
  pixelDuration = 450,
  pattern = "random",
  randomness = 0,
  easing = "cubic-bezier(0.22, 1, 0.36, 1)",
  trigger = "hover",
  initialActive = false,
  active,
  onActiveChange,
  onComplete,
  aspectRatio = "16 / 10",
  className = "",
  style,
}: PixelSwapProps) {
  const [internalActive, setInternalActive] = useState(initialActive);
  const [shownActive, setShownActive] = useState(active ?? initialActive);
  const [transition, setTransition] = useState<TransitionState | null>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pixelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationsRef = useRef<Animation[]>([]);
  const timerRef = useRef(0);

  const desiredActive = active ?? internalActive;
  const incomingIndex = transition?.to ? 1 : 0;

  const grid = useMemo(
    () =>
      buildGrid({
        width: box.width,
        height: box.height,
        pixelSize: Math.max(8, Math.round(pixelSize)),
        gap: Math.max(0, Math.round(gap)),
        pattern,
        randomness,
      }),
    [box.width, box.height, pixelSize, gap, pattern, randomness],
  );

  // Snapshot the animation inputs so a transition already in flight is never
  // rebuilt halfway through by an unrelated prop change.
  const config = {
    duration,
    pixelDuration,
    pixelSpin,
    pixelScale,
    pixelRadius,
    fade,
    easing,
    onComplete,
  };
  const configRef = useRef(config);
  const gridRef = useRef(grid);

  useEffect(() => {
    configRef.current = config;
    gridRef.current = grid;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      setBox((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const stopAnimations = useCallback(() => {
    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current = [];
    pixelRefs.current.forEach((pixel) => pixel?.replaceChildren());
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = 0;
  }, []);

  useEffect(() => stopAnimations, [stopAnimations]);

  useEffect(() => {
    // Never drop a flip: if a transition is in flight but the target has since
    // changed (rapid scroll past two thresholds, or a scroll reversal), cancel
    // and re-aim at the current target rather than ignoring it until the old
    // one finishes.
    const headingRight = transition
      ? transition.to === desiredActive
      : desiredActive === shownActive;
    if (headingRight) return;
    setTransition({ to: desiredActive, grid: gridRef.current });
  }, [desiredActive, shownActive, transition]);

  useEffect(() => {
    if (!transition) return;
    const settings = configRef.current;
    const { grid: frozenGrid, to } = transition;

    const finish = () => {
      stopAnimations();
      setShownActive(to);
      setTransition(null);
      settings.onComplete?.(to);
    };

    const source = layerRefs.current[to ? 1 : 0];
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // No WAAPI (SSR / jsdom) — snap to the end state.
    const canAnimate = typeof Element !== "undefined" && "animate" in Element.prototype;
    if (
      !source ||
      !frozenGrid.pixels.length ||
      prefersReducedMotion ||
      !canAnimate
    ) {
      finish();
      return;
    }

    const total = Math.max(200, settings.duration);
    const pixelMs = clamp(settings.pixelDuration, 60, total);
    const spread = Math.max(0, total - pixelMs);
    const endScale = coverScale(frozenGrid.size, frozenGrid.gap, settings.pixelRadius);
    const keyframes = buildKeyframes({
      ease: makeEasing(settings.easing),
      startScale: clamp(settings.pixelScale, 0.05, 1) * endScale,
      endScale,
      spin: settings.pixelSpin,
      fade: settings.fade,
    });

    frozenGrid.pixels.forEach((pixel, index) => {
      const pixelElement = pixelRefs.current[index];
      if (!pixelElement) return;

      const content = document.createElement("div");
      content.className = "pixel-swap__pixel-content";
      content.style.left = `${String(-pixel.left)}px`;
      content.style.top = `${String(-pixel.top)}px`;
      content.style.width = `${String(frozenGrid.width)}px`;
      content.style.height = `${String(frozenGrid.height)}px`;
      const originX = pixel.left + frozenGrid.size / 2;
      const originY = pixel.top + frozenGrid.size / 2;
      content.style.transformOrigin = `${String(originX)}px ${String(originY)}px`;

      const clone = source.cloneNode(true) as HTMLElement;
      clone.dataset.visible = "true";
      clone.removeAttribute("aria-hidden");
      content.appendChild(clone);
      pixelElement.replaceChildren(content);

      const timing: KeyframeAnimationOptions = {
        duration: pixelMs,
        delay: pixel.offset * spread,
        easing: "linear",
        fill: "both",
      };
      if (typeof pixelElement.animate === "function" && typeof content.animate === "function") {
        animationsRef.current.push(
          pixelElement.animate(keyframes.window, timing),
          content.animate(keyframes.content, timing),
        );
      }
    });

    timerRef.current = window.setTimeout(finish, total);
    return stopAnimations;
  }, [stopAnimations, transition]);

  const requestActive = useCallback(
    (next: boolean) => {
      if (active === undefined) setInternalActive(next);
      onActiveChange?.(next);
    },
    [active, onActiveChange],
  );

  const interactionProps = useMemo(() => {
    if (trigger === "hover") {
      return {
        onMouseEnter: () => requestActive(true),
        onMouseLeave: () => requestActive(false),
        onFocus: () => requestActive(true),
        onBlur: () => requestActive(false),
        tabIndex: 0,
      };
    }

    if (trigger === "click") {
      return {
        onClick: () => requestActive(!desiredActive),
        onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            requestActive(!desiredActive);
          }
        },
        role: "button",
        tabIndex: 0,
      };
    }

    return {};
  }, [desiredActive, requestActive, trigger]);

  const renderLayer = (content: ReactNode, index: number) => {
    const isShown = index === (shownActive ? 1 : 0);
    return (
      <div
        key={index}
        ref={(element) => {
          layerRefs.current[index] = element;
        }}
        className="pixel-swap__layer"
        data-visible={isShown && !(transition && index === incomingIndex)}
        style={{ zIndex: isShown ? 2 : 1 }}
        aria-hidden={!isShown}
      >
        {content}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`pixel-swap ${className}`.trim()}
      style={{ aspectRatio, ...style }}
      data-active={shownActive}
      data-transitioning={!!transition}
      {...interactionProps}
    >
      {renderLayer(firstContent, 0)}
      {renderLayer(secondContent, 1)}

      {transition && (
        <div className="pixel-swap__grid" aria-hidden="true">
          {transition.grid.pixels.map((pixel, index) => (
            <div
              key={pixel.id}
              ref={(element) => {
                pixelRefs.current[index] = element;
              }}
              className="pixel-swap__pixel"
              style={{
                left: pixel.left,
                top: pixel.top,
                width: transition.grid.size,
                height: transition.grid.size,
                borderRadius: `${String(clamp(pixelRadius, 0, 50))}%`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PixelSwap;
