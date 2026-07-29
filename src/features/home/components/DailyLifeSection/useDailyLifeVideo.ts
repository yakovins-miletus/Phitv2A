import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/** mm:ss, or "0:00" before metadata has loaded. */
export function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/** How far outside the viewport the film starts loading. */
const PRELOAD_MARGIN = "300px";
/** Volume restored when unmuting from a muted-at-zero state. */
const UNMUTE_FALLBACK_VOLUME = 0.5;

export interface DailyLifeVideo {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  isMuted: boolean;
  videoLoaded: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  showVolumeSlider: boolean;
  setShowVolumeSlider: (next: boolean) => void;
  togglePlay: () => void;
  toggleMute: () => void;
  handleTimeUpdate: () => void;
  handleLoadedMetadata: () => void;
  handleSeek: (event: Event, value: number | number[]) => void;
  handleVolumeChange: (event: Event, value: number | number[]) => void;
}

/**
 * All of the daily-life film's player state, separated from its layout.
 *
 * `sectionRef` is the element whose visibility gates loading and playback.
 *
 * On the effect's dependencies: this used to depend on [videoLoaded, isPlaying]
 * and also SET videoLoaded, so the IntersectionObserver was torn down and
 * rebuilt by its own state change — and again on every single play/pause the
 * user performed. It now depends on [videoLoaded] alone and reads isPlaying
 * through a ref.
 *
 * The remaining videoLoaded dependency is deliberate, not an oversight. The
 * first intersection only sets videoLoaded; mounting the <video src> is what
 * lets the second pass reach the play branch. Dropping to [] would collapse
 * that to one pass and lose the re-entry safeguard when scrolling back.
 */
export function useDailyLifeVideo(sectionRef: RefObject<HTMLElement | null>): DailyLifeVideo {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Read inside the observer callback without making it a dependency.
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;

        if (entry.isIntersecting) {
          if (!videoLoaded) {
            setVideoLoaded(true);
          } else if (videoRef.current && isPlayingRef.current) {
            void videoRef.current.play().catch(() => {});
          }
        } else {
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionRef, videoLoaded]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      void videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      setVolume(UNMUTE_FALLBACK_VOLUME);
      videoRef.current.volume = UNMUTE_FALLBACK_VOLUME;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // MUI Slider's onChange signature. These were typed `_event: any` inline.
  const handleSeek = (_event: Event, newValue: number | number[]) => {
    const time = newValue as number;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    const val = newValue as number;
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  return {
    videoRef,
    isPlaying,
    isMuted,
    videoLoaded,
    currentTime,
    duration,
    volume,
    showVolumeSlider,
    setShowVolumeSlider,
    togglePlay,
    toggleMute,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleSeek,
    handleVolumeChange,
  };
}
