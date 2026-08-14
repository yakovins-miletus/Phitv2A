import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";

import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";
import { ProcessNode } from "./process/ProcessNode";
import { ProcessPayload } from "./process/ProcessPayload";
import { ACTIVATION_RAMP, WELL, type NodeStatus } from "./process/processStages";

export interface ProcessStep {
  number: string;
  label: string;
  caption: string;
}

interface ProcessDiagramProps {
  steps: readonly ProcessStep[];
}

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

  const { centersFrac, centersPx, arrivals } = useMemo(() => {
    const measured = metrics.centers.length === steps.length && metrics.centers.some((c) => c > 0);
    const validCenters = measured
      ? metrics.centers
      : steps.map((_, i) => (steps.length < 2 ? 0 : i / (steps.length - 1)));

    const first = validCenters[0] ?? 0;
    const last = validCenters[lastIndex] ?? 1;
    const span = last - first || 1;

    return {
      centersFrac: validCenters,
      centersPx: validCenters.map((c) => c * metrics.height),
      arrivals: validCenters.map((c) => (c - first) / span),
    };
  }, [metrics, steps, lastIndex]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });
  const raw = useSpring(scrollYProgress, { stiffness: 60, damping: 22 });

  const firstFrac = centersFrac[0] ?? 0;
  const lastFrac = centersFrac[lastIndex] ?? 1;

  // Direct precision mapping: at scroll position centersFrac[i], the payload is exactly at centersPx[i]
  const stageIndices = useMemo(() => steps.map((_, i) => i), [steps]);
  const progress = useTransform(raw, [firstFrac, lastFrac], [0, 1], { clamp: true });
  const stage = useTransform(raw, centersFrac, stageIndices, { clamp: true });
  const travelY = useTransform(raw, centersFrac, centersPx, { clamp: true });
  const spineScale = useTransform(raw, [firstFrac, lastFrac], [0, 1], { clamp: true });

  const [activeIndex, setActiveIndex] = useState(reduced ? lastIndex : 0);
  useMotionValueEvent(stage, "change", (value) => {
    if (reduced) return;
    const next = Math.min(lastIndex, Math.max(0, Math.round(value)));
    setActiveIndex((prev) => (prev === next ? prev : next));
  });

  const statusOf = (index: number): NodeStatus => {
    if (reduced) return "shipped";
    if (index > activeIndex) return "queued";
    if (index < activeIndex) return "shipped";
    return index === lastIndex ? "shipped" : "running";
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        py: { xs: 4, md: 8 },
      }}
    >
      {/* Industrial Spine Rail */}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: `${firstFrac * 100}%`,
          height: `${(lastFrac - firstFrac) * 100}%`,
          left: { xs: "32px", md: "50%" },
          width: "2px",
          ml: "-1px",
          bgcolor: "rgba(244, 247, 252, 0.1)",
          zIndex: 3,
        }}
      >
        <motion.div
          style={{
            width: "100%",
            height: "100%",
            transformOrigin: "top center",
            background: `linear-gradient(to bottom, transparent, ${NOIR.gold} 20%, ${NOIR.goldDark})`,
            boxShadow: `0 0 18px ${NOIR.gold}`,
            scaleY: reduced ? 1 : spineScale,
          }}
        />
      </Box>

      {/* Travelling Payload */}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: 0,
          left: { xs: "32px", md: "50%" },
          width: WELL,
          height: WELL,
          ml: { xs: `${-WELL.xs / 2}px`, md: `${-WELL.md / 2}px` },
          mt: { xs: `${-WELL.xs / 2}px`, md: `${-WELL.md / 2}px` },
          zIndex: 6,
          pointerEvents: "none",
        }}
      >
        <motion.div
          style={{
            width: "100%",
            height: "100%",
            y: reduced ? (centersPx[lastIndex] ?? 0) : travelY,
          }}
        >
          <ProcessPayload stage={stage} lastIndex={lastIndex} reduced={reduced} />
        </motion.div>
      </Box>

      {/* Ordered Process Stages */}
      <Stack
        component="ol"
        spacing={{ xs: 6, md: 8 }}
        sx={{
          position: "relative",
          zIndex: 5,
          listStyle: "none",
          m: 0,
          p: 0,
          width: "100%",
        }}
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
