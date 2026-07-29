import { useEffect } from "react";
import type { RefObject } from "react";

import { usePreloaderReady, useReducedMotion } from "@/shared/motion";
import { SCROLL_SPEED, scrollEase } from "@/shared/motion/scrollSpeed";
import { STAGE_ATTR, SNAP_STOP_SECTION_ID, measureHeaderOffset } from "@/shared/sections";
import { getLenis } from "@/shared/components/SmoothScroll";

/** Accumulated wheel delta that counts as a page gesture — one mouse-wheel
 *  notch (~100) or a short trackpad swipe. */
const WHEEL_THRESHOLD = 80;
/** Wheel silence that resets the accumulator (separates distinct gestures). */
const GESTURE_GAP_MS = 200;
/** Swallow trailing momentum events after a page transition lands. */
const COOLDOWN_MS = 300;

/** Direct section paging: one wheel gesture past the threshold scrolls
 *  straight to the next (down) or previous (up) checkpoint via Lenis.
 *  Covers the hero (down pages into the pinned use-cases narrative) and the
 *  stage sections inside `containerRef` up to the last snap checkpoint —
 *  the stage just above `SNAP_STOP_SECTION_ID` (Global Reach, section 6).
 *  From that section down, the wheel passes through so the page scrolls
 *  freely. Inside the pin itself the wheel also passes through so the
 *  horizontal scrub (with its own slide snapping) owns the gesture. Must be
 *  called from the component that renders the container (its effects run
 *  after the whole subtree commits, so the ref is attached — a child
 *  component's effect would fire before a later sibling's ref exists).
 *
 *  Escape hatches, so scrolling is never trapped:
 *  - only wheel is intercepted — touch, keyboard, and scrollbar drags scroll
 *    freely (and reduced motion disables paging entirely);
 *  - from the stop section (Global Reach) down, the footer and every section
 *    below stay freely reachable — no paging;
 *  - at the edges, scrolling outward releases to free scroll.
 *
 *  Perf: the per-event path does at most two rect reads; the 13 stage
 *  positions are only measured once a gesture actually crosses the
 *  threshold. */
export function useSectionPaging(containerRef: RefObject<HTMLElement | null>): void {
  const reduced = useReducedMotion();
  const ready = usePreloaderReady();

  useEffect(() => {
    const container = containerRef.current;
    if (reduced === true || !ready || !container) return;

    let animating = false;
    let cooldownUntil = 0;
    let accumulated = 0;
    let lastWheelAt = 0;

    const page = (target: number) => {
      const lenis = getLenis();
      if (!lenis) return;
      animating = true;
      lenis.scrollTo(target, {
        duration: SCROLL_SPEED,
        easing: scrollEase,
        lock: true,
        onComplete: () => {
          animating = false;
          cooldownUntil = performance.now() + COOLDOWN_MS;
        },
      });
    };

    const onWheel = (event: WheelEvent) => {
      if (!getLenis()) return;
      // Horizontal pans (blog carousel) are not page gestures.
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      const useCases = document.getElementById("use-cases");
      if (!useCases) return;
      const y = window.scrollY;
      const vh = window.innerHeight;

      const cRect = container.getBoundingClientRect();
      const containerBottom = cRect.bottom + y;

      // Last snap checkpoint = the stage just above the stop section (Global
      // Reach). From that section down the wheel is released to free scroll.
      const stopEl = document.getElementById(SNAP_STOP_SECTION_ID);
      const lastSnapEl = stopEl?.previousElementSibling as HTMLElement | null;
      const lastSnapTop = lastSnapEl
        ? lastSnapEl.getBoundingClientRect().top + y - measureHeaderOffset()
        : containerBottom - vh; // fallback: prior "snap all the way" behaviour

      const down = event.deltaY > 0;
      const isTop = y <= 4;

      // ── Free-scroll zone: hero + hero-desc ────────────────────────
      // Paging only activates once the user reaches the services.
      const firstService = document.getElementById("services");
      if (firstService) {
        const serviceStart =
          firstService.getBoundingClientRect().top + y - measureHeaderOffset();
        // Scrolling down but haven't reached the first service yet → free scroll
        if (down && y < serviceStart - vh * 0.5) return;
        // Scrolling up and above the first service → free scroll back through hero zone
        if (!down && y < serviceStart - 4) return;
      }

      // Free-scroll zones and edge releases (wheel passes through):
      if (isTop && !down) return; // top of page → free scroll up
      if (down && y >= lastSnapTop - 4) return; // at/below last snap → free scroll down (Global Reach onward)
      if (!down && y > lastSnapTop + 4) return; // below last snap → free scroll up

      event.preventDefault();
      // Capture-phase stop so Lenis's own wheel handler never sees it.
      event.stopPropagation();

      const now = performance.now();
      if (animating || now < cooldownUntil) return;
      if (now - lastWheelAt > GESTURE_GAP_MS) accumulated = 0;
      lastWheelAt = now;
      accumulated += event.deltaY;
      if (Math.abs(accumulated) < WHEEL_THRESHOLD) return;

      const dir = accumulated > 0 ? 1 : -1;
      accumulated = 0;

      // Stage positions are measured only here — once per gesture. Only the
      // stages up to the last snap checkpoint page; Global Reach onward is
      // free scroll, so it never becomes a target.
      const targets = Array.from(
        container.querySelectorAll<HTMLElement>(`[${STAGE_ATTR}]`),
      )
        // Skip the hero-desc section so scrolling past the hero is smooth,
        // not a hard snap to the "At Phitopolis" description block.
        .filter((el) => el.id !== "hero-desc")
        .map((el) => el.getBoundingClientRect().top + window.scrollY - measureHeaderOffset())
        .filter((t) => t <= lastSnapTop + 4);

      // Inject the UseCases internal slides as first-class paging targets.
      const ucProgress = (useCases as any)._ucProgressPoints as number[] | undefined;
      // We import ScrollTrigger dynamically or use window.ScrollTrigger. We can't import ScrollTrigger
      // at the top of SectionPaging without adding it to the eager bundle, but SmoothScroll brings it in.
      // We can grab it globally if needed.
      const globalScrollTrigger = (window as any).ScrollTrigger;
      if (ucProgress && globalScrollTrigger) {
        const trigger = globalScrollTrigger.getById("uc-pin");
        if (trigger) {
          const pinStart = trigger.start;
          const pinDistance = trigger.end - trigger.start;
          const ucTargets = ucProgress.map((p) => Math.round(pinStart + p * pinDistance));
          targets.push(...ucTargets);
          // Re-sort the targets to interleave them correctly
          targets.sort((a, b) => a - b);
        }
      }

      if (!targets.length) return;

      let nearest = 0;
      targets.forEach((t, i) => {
        if (Math.abs(t - y) < Math.abs((targets[nearest] ?? 0) - y)) nearest = i;
      });
      // When misaligned (entered the zone mid-scroll), the first gesture
      // completes toward the nearest stage in that direction, not past it.
      const nearestTop = targets[nearest] ?? y;
      let targetIndex: number;
      if (dir > 0) targetIndex = y < nearestTop - 2 ? nearest : nearest + 1;
      else targetIndex = y > nearestTop + 2 ? nearest : nearest - 1;
      targetIndex = Math.max(0, Math.min(targets.length - 1, targetIndex));
      const target = targets[targetIndex];
      if (target === undefined || Math.abs(target - y) < 2) return;
      page(target);
    };

    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
    };
  }, [reduced, ready, containerRef]);
}
