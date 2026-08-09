import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";

import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";
import { ProcessNode } from "./process/ProcessNode";
import { ProcessPayload } from "./process/ProcessPayload";
import { ACTIVATION_RAMP, SPINE_X, WELL, type NodeStatus } from "./process/processStages";

export interface ProcessStep {
  number: string;
  label: string;
  caption: string;
}

interface ProcessDiagramProps {
  steps: readonly ProcessStep[];
}

/**
 * "From problem to production", as a pipeline that actually runs.
 *
 * One payload travels the spine and changes state at each phase; each phase it
 * passes locks in and reports QUEUED → RUNNING → SHIPPED; the last phase docks
 * it into a branded plate and ships it.
 *
 * This component is the conductor and owns exactly three things: scroll
 * progress, where each node's dock sits, and which node the payload has
 * reached. Everything visual belongs to ./process/*.
 *
 * ## Why the dock positions are measured
 *
 * The obvious implementation gives node `i` a threshold of `i / (n - 1)`. It
 * looks right in a mock and is wrong on the page: the endpoint rows carry a
 * 4rem heading and a payload well, the middle rows a 2.5rem heading, so the
 * real gaps between dock centres differ by a factor of two. Evenly-spaced
 * thresholds leave the payload visibly short of, or past, the node it is
 * supposed to be arriving at — which is the one thing the whole section is
 * asking the reader to believe. So each node registers its dock element and
 * the centres are measured, and re-measured on resize.
 */
export function ProcessDiagram({ steps }: ProcessDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const docksRef = useRef<(HTMLElement | null)[]>([]);
  const reduced = useReducedMotion() === true;

  const lastIndex = steps.length - 1;
  const [metrics, setMetrics] = useState<{ centers: number[]; height: number }>({
    centers: [],
    height: 0,
  });

  const registerDock = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      docksRef.current[index] = el;
    },
    [],
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const box = container.getBoundingClientRect();
      if (box.height === 0) return;
      const centers = docksRef.current.slice(0, steps.length).map((el) => {
        if (!el) return 0;
        const dock = el.getBoundingClientRect();
        return (dock.top + dock.height / 2 - box.top) / box.height;
      });
      setMetrics((prev) =>
        prev.height === box.height && prev.centers.join() === centers.join()
          ? prev
          : { centers, height: box.height },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [steps.length]);

  /**
   * Progress values at which the payload reaches each node, normalised so the
   * travel runs from the first dock to the last rather than edge to edge of
   * the container's padding box. Falls back to even spacing until the first
   * measurement lands.
   */
  const { arrivals, startFrac, endFrac } = useMemo(() => {
    const measured = metrics.centers.length === steps.length && metrics.centers.some((c) => c > 0);
    if (!measured || steps.length < 2) {
      return {
        arrivals: steps.map((_, i) => (steps.length < 2 ? 1 : i / (steps.length - 1))),
        startFrac: 0,
        endFrac: 1,
      };
    }
    const first = metrics.centers[0] ?? 0;
    const last = metrics.centers[lastIndex] ?? 1;
    const span = last - first || 1;
    return {
      arrivals: metrics.centers.map((c) => (c - first) / span),
      startFrac: first,
      endFrac: last,
    };
  }, [metrics, steps, lastIndex]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });
  const raw = useSpring(scrollYProgress, { stiffness: 50, damping: 20 });

  /**
   * Raw progress runs edge-to-edge of the container, which would put the ship
   * moment at the bottom of the container's padding — long after the Products
   * plate has left the middle of the screen. Remapped to the docks instead.
   *
   * With `offset: ["start center", "end center"]`, raw progress `p` puts the
   * container's top at `viewportCentre − p·height`, so a dock at fraction `f`
   * of the container sits dead centre exactly when `p === f`. Remapping
   * [startFrac, endFrac] → [0, 1] therefore makes every node arrive at the
   * instant it reaches the middle of the screen, which is the only moment the
   * reader is actually looking at it.
   */
  const progress = useTransform(raw, [startFrac, endFrac], [0, 1]);

  // Continuous node index. `arrivals` is monotonic by construction; the
  // identity output makes this "which node am I between, and how far".
  const stage = useTransform(
    progress,
    arrivals,
    arrivals.map((_, i) => i),
  );
  const travelY = useTransform(progress, [0, 1], [startFrac * metrics.height, endFrac * metrics.height]);
  // Relative to the rail, which now spans first dock → last dock rather than
  // the full container, so 0 → 1 is exactly "no phases reached" → "all of them".
  const spineScale = useTransform(progress, [0, 1], [0, 1]);

  // One piece of React state on the scroll path: which node the payload has
  // reached. Six nodes means at most twelve renders for the whole section.
  const [activeIndex, setActiveIndex] = useState(reduced ? lastIndex : 0);
  useMotionValueEvent(progress, "change", (value) => {
    if (reduced) return;
    let next = 0;
    for (let i = 0; i < arrivals.length; i += 1) {
      if (value >= (arrivals[i] ?? 0)) next = i;
    }
    setActiveIndex((prev) => (prev === next ? prev : next));
  });

  const statusOf = (index: number): NodeStatus => {
    if (reduced) return "shipped";
    if (index > activeIndex) return "queued";
    if (index < activeIndex) return "shipped";
    // A product does not un-ship: the last node latches on arrival.
    return index === lastIndex ? "shipped" : "running";
  };

  return (
    <Box ref={containerRef} sx={{ position: "relative", maxWidth: 900, mx: "auto", py: { xs: 8, md: 12 } }}>
      {/* Spine. The rail runs from the first dock to the last and stops there
          — running it to the container's padding edge leaves a hairline
          hanging below the shipped plate, pointing at nothing. The lit portion
          is scaled rather than grown by height, so the fill stays on the
          compositor with the payload it is chasing. */}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: `${startFrac * 100}%`,
          height: `${(endFrac - startFrac) * 100}%`,
          left: { xs: `${SPINE_X}px`, md: "50%" },
          width: "2px",
          ml: "-1px",
          bgcolor: `rgba(${NOIR.frostRgb}, 0.08)`,
        }}
      >
        <motion.div
          style={{
            width: "100%",
            height: "100%",
            transformOrigin: "top center",
            background: `linear-gradient(to bottom, transparent, ${NOIR.gold} 20%, ${NOIR.goldDark})`,
            boxShadow: `0 0 16px ${NOIR.gold}`,
            scaleY: reduced ? 1 : spineScale,
          }}
        />
      </Box>

      {/* The payload. Positioned once, moved only by translate. */}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: 0,
          left: { xs: `${SPINE_X}px`, md: "50%" },
          width: WELL,
          height: WELL,
          ml: { xs: `${-WELL.xs / 2}px`, md: `${-WELL.md / 2}px` },
          mt: { xs: `${-WELL.xs / 2}px`, md: `${-WELL.md / 2}px` },
          // Behind the list, not above it. The endpoint headings are centred
          // on the spine, so a payload painted on top of them lands squarely
          // in the middle of the word "Ideas" on its way out of phase 00 — it
          // reads as a collision. Sliding behind the display type reads as
          // travel. The ship plate is a frame with no fill precisely so the
          // payload is still fully visible once it docks inside it.
          zIndex: 4,
          pointerEvents: "none",
        }}
      >
        <motion.div
          style={{
            width: "100%",
            height: "100%",
            y: reduced ? endFrac * metrics.height : travelY,
          }}
        >
          <ProcessPayload stage={stage} lastIndex={lastIndex} reduced={reduced} />
        </motion.div>
      </Box>

      {/* An ordered process is an ordered list. It was a stack of divs.
          Spacing came down from 24 (192px) when the phase glyphs landed: the
          rows are roughly twice as tall now, and the old gap — set when a row
          was three lines of text — left a void between every phase. */}
      <Stack
        component="ol"
        spacing={{ xs: 10, md: 14 }}
        sx={{ position: "relative", zIndex: 5, listStyle: "none", m: 0, p: 0 }}
      >
        {steps.map((step, index) => (
          <ProcessNode
            key={step.label}
            step={step}
            index={index}
            lastIndex={lastIndex}
            progress={progress}
            arrival={arrivals[index] ?? 0}
            ramp={ACTIVATION_RAMP}
            status={statusOf(index)}
            reduced={reduced}
            dockRef={registerDock(index)}
          />
        ))}
      </Stack>
    </Box>
  );
}
