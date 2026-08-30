import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { useReducedMotion, useIsLowPowerDevice } from "@/shared/motion";

/**
 * Gating for a decorative, autoplaying background video.
 *
 * `BlogVideoHero` and `InnovationHero` both rendered `<video autoPlay>` with a
 * hard-coded `src` and no gate at all. Both pointed at `daily-life.mp4`: **62.8 MB,
 * 251 seconds, 720p**. Measured on `/blog`, the browser had issued 40 range requests
 * and pulled ~15.5 MB within 13 seconds of load, still climbing — for decoration behind
 * a `brightness(0.55)` filter (docs/perf-baseline.md).
 *
 * This hook makes the download conditional on the video actually being wanted:
 *  - nothing loads until the element is near the viewport,
 *  - playback pauses when it leaves,
 *  - reduced-motion users never load it at all — WCAG 2.2.2 covers auto-playing motion,
 *    and a looping background film is exactly that,
 *  - low-power devices never load it either; they get the poster.
 *
 * The poster still renders in every case, so the section never shows an empty box.
 *
 * `DailyLifeSection` deliberately does NOT use this: there the film is the content, has
 * real controls, and already has its own richer gate in `useDailyLifeVideo`.
 */

/** How far outside the viewport the film starts loading. */
const PRELOAD_MARGIN = "200px";

export interface BackgroundVideo {
  /** Attach to the section that gates visibility. */
  containerRef: RefObject<HTMLDivElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  /** True once the video may be fetched. Keep `src` off the element until then. */
  shouldLoad: boolean;
  /** True when this visitor should never get the video at all. */
  posterOnly: boolean;
}

export function useBackgroundVideo(): BackgroundVideo {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  const reduced = useReducedMotion();
  const lowPower = useIsLowPowerDevice();
  const posterOnly = reduced === true || lowPower;

  useEffect(() => {
    if (posterOnly) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setShouldLoad(true);
          void videoRef.current?.play().catch(() => {});
        } else {
          videoRef.current?.pause();
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [posterOnly]);

  // A backgrounded tab should not keep decoding frames.
  useEffect(() => {
    if (posterOnly) return;
    const onVisibility = () => {
      if (document.hidden) videoRef.current?.pause();
      else void videoRef.current?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [posterOnly]);

  return { containerRef, videoRef, shouldLoad, posterOnly };
}

/** The original 12s decorative loop, still used by the Innovation hero backgrounds. */
export const BACKGROUND_LOOP = {
  webm: "/videos/daily-life-loop.webm",
  mp4: "/videos/daily-life-loop.mp4",
  poster: "/videos/daily-life-poster.jpg",
} as const;

/**
 * Per-surface loops cut from the same `daily-life` master (1280x720 / 251s), each
 * a different ~7s moment, transcoded to a 880–900-wide loop (mp4 ~170–275KB,
 * webm ~200–355KB, poster ~30KB) — small enough that the `useBackgroundVideo()`
 * IntersectionObserver gate is a courtesy rather than the load-bearing fix.
 * Same shape as {@link BACKGROUND_LOOP}. Warmed per-landing-route by the
 * preloader manifest in `AppShell.tsx` (`resolveRouteManifest`).
 *
 *  - `BLOG_LOOP` — the film's opening: arrival through the World Plaza lobby.
 *  - `CAREERS_LOOP` — a graduate cohort gathered around a screen at the window.
 *  - `SERVICES_LOOP` — the world-clocks wall panning to engineers at their desks.
 */
export const BLOG_LOOP = {
  webm: "/videos/daily-life-blog-loop.webm",
  mp4: "/videos/daily-life-blog-loop.mp4",
  poster: "/videos/daily-life-blog-loop-poster.jpg",
} as const;

export const CAREERS_LOOP = {
  webm: "/videos/daily-life-careers-loop.webm",
  mp4: "/videos/daily-life-careers-loop.mp4",
  poster: "/videos/daily-life-careers-loop-poster.jpg",
} as const;

export const SERVICES_LOOP = {
  webm: "/videos/daily-life-services-loop.webm",
  mp4: "/videos/daily-life-services-loop.mp4",
  poster: "/videos/daily-life-services-loop-poster.jpg",
} as const;
