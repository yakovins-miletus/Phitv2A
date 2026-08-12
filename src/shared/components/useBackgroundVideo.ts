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

/** The decorative loop and its poster frame, shared by both hero backgrounds. */
export const BACKGROUND_LOOP = {
  webm: "/videos/daily-life-loop.webm",
  mp4: "/videos/daily-life-loop.mp4",
  poster: "/videos/daily-life-poster.jpg",
} as const;

/**
 * The Monolith hero's "video" background mode: an 8s night→dawn transition
 * baked into the footage itself (`public/_source/night-to-dawn-source.mp4`,
 * transcoded down from 1280x720/1.3MB to a 960-wide loop — mp4 ~300KB, webm
 * ~170KB, poster ~35KB — small enough that this hook's IntersectionObserver
 * gate is a courtesy here rather than the load-bearing fix `BACKGROUND_LOOP`
 * needed). Same shape as `BACKGROUND_LOOP` so both plug into
 * `useBackgroundVideo()` identically; kept separate rather than folded into
 * it because the two loops serve different sections and have no reason to
 * change together.
 */
export const HERO_BG_VIDEO = {
  webm: "/videos/hero-night-to-dawn.webm",
  mp4: "/videos/hero-night-to-dawn.mp4",
  poster: "/videos/hero-night-to-dawn-poster.jpg",
} as const;
