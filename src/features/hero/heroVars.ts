/**
 * The bridge between scroll progress and the DOM, without React in the middle.
 *
 * The hero used to call `setScrollProgress` on every ScrollTrigger tick. Every styled
 * node below it interpolated that value inside an `sx` object, so Emotion re-serialized
 * and re-injected a rule per node per frame. Measured: one scroll pass through the pin
 * added **1,335 rules** to the stylesheet and dropped **32% of frames**
 * (docs/perf-baseline.md).
 *
 * Here the same numbers are written straight onto one element as CSS custom properties.
 * Every `sx` below becomes a *static* object referencing `var(--hp-*)`, so Emotion
 * serializes it once, at mount, and never again. Scroll then costs one
 * `style.setProperty` batch per frame and zero React renders.
 *
 * The phase math itself is not duplicated here — it is read from heroPhases.ts, which is
 * parity-locked and covered by tests/motion/hero-phases.test.ts.
 */

import {
  atTightenProgress,
  borderAnimProgress,
  containerScale,
  flankOpacity,
  gunshotProgress,
  leftFlankY,
  panelOpacity,
  rightFlankY,
  wordLiftPercent,
  wordRevealProgress,
} from "./heroPhases";

/** Extra width the split-pane images carry so they can pan without exposing an edge. */
const EXTRA_WIDTH_PCT = 40;
/** Maximum pan travel, as a percentage of the image's own width. */
export const MAX_TRAVEL_PCT = EXTRA_WIDTH_PCT / 1.4; // 28.5714%

/** P logo exit, 0.86 → 0.89. Transcribed from the old inline `pExitProgressVal`. */
function pExitProgress(p: number): number {
  if (p <= 0.86) return 0;
  if (p >= 0.89) return 1;
  return (p - 0.86) / 0.03;
}

/** AT entrance, 0.89 → 0.92. Transcribed from the old inline `atEnterProgressVal`. */
function atEnterProgress(p: number): number {
  if (p <= 0.89) return 0;
  if (p >= 0.92) return 1;
  return (p - 0.89) / 0.03;
}

/**
 * The continuous values the hero's CSS reads. All unitless numbers — the stylesheet
 * multiplies them by the unit it needs (`calc(var(--hp-topx) * 1%)`), which keeps the
 * custom properties usable in any context.
 */
export interface HeroVars {
  hp: number;
  scale: number;
  g: number;
  topx: number;
  botx: number;
  lefty: number;
  righty: number;
  flank: number;
  pexit: number;
  atenter: number;
  tight: number;
  border: number;
  panel: number;
  word: number;
  wordlift: number;
}

/** Derive every continuous value for a given pin progress. */
export function heroVars(progress: number, reduced: boolean): HeroVars {
  if (reduced) {
    // The settled, motionless layout. Values transcribed from the old `reduced ? … : …`
    // branches in SuperHeroSequence so the reduced-motion rendering does not move.
    return {
      hp: 0,
      scale: 1,
      g: 0,
      topx: -MAX_TRAVEL_PCT,
      botx: 0,
      lefty: -240,
      righty: 240,
      flank: 1,
      pexit: 1,
      atenter: 1,
      tight: 0,
      border: 1,
      panel: 1,
      word: 1,
      wordlift: 0,
    };
  }

  const g = gunshotProgress(progress);
  return {
    hp: progress,
    scale: containerScale(progress),
    g,
    topx: -100 + g * (100 - MAX_TRAVEL_PCT),
    botx: 100 - g * 100,
    lefty: leftFlankY(progress),
    righty: rightFlankY(progress),
    flank: flankOpacity(progress),
    pexit: pExitProgress(progress),
    atenter: atEnterProgress(progress),
    tight: atTightenProgress(progress),
    border: borderAnimProgress(progress),
    panel: panelOpacity(progress),
    word: wordRevealProgress(progress),
    wordlift: wordLiftPercent(progress),
  };
}

/** Round to 4dp — enough for sub-pixel fidelity, short enough to keep the writes cheap. */
function n(v: number): string {
  return v.toFixed(4);
}

/** Write the values onto an element as custom properties. Causes no React render. */
export function writeHeroVars(el: HTMLElement, v: HeroVars): void {
  const s = el.style;
  s.setProperty("--hp", n(v.hp));
  s.setProperty("--hp-scale", n(v.scale));
  s.setProperty("--hp-g", n(v.g));
  s.setProperty("--hp-topx", n(v.topx));
  s.setProperty("--hp-botx", n(v.botx));
  s.setProperty("--hp-lefty", n(v.lefty));
  s.setProperty("--hp-righty", n(v.righty));
  s.setProperty("--hp-flank", n(v.flank));
  s.setProperty("--hp-pexit", n(v.pexit));
  s.setProperty("--hp-atenter", n(v.atenter));
  s.setProperty("--hp-tight", n(v.tight));
  s.setProperty("--hp-border", n(v.border));
  s.setProperty("--hp-panel", n(v.panel));
  s.setProperty("--hp-word", n(v.word));
  s.setProperty("--hp-wordlift", n(v.wordlift));
}

/**
 * The discrete part of the hero's state — things CSS cannot express as a number:
 * conditional mounts, and the one colour that flips at the end of the border draw.
 *
 * These change ~4 times across the whole 30-viewport pin, so they can safely live in
 * React state; the per-frame values above cannot.
 */
export interface HeroStage {
  /** Split-pane images and the navy wash are mounted. */
  gunshot: boolean;
  /** The scaled container takes on its card chrome (white bg, radius, shadow). */
  chrome: boolean;
  /** The 20s idle pan on the split images is running. */
  autoPan: boolean;
  /** Flanking texts are mounted. */
  flank: boolean;
  /** The grouped P→AT crossfade has taken over the logo. */
  container: boolean;
  /** The gold border has finished drawing; flanking text switches to gold. */
  borderDone: boolean;
  /** Hero owns the navbar anchor. */
  navActive: boolean;
  /** Navbar should render dark over the navy wash. */
  navDark: boolean;
  /** Side panels still accept pointer events. */
  panelInteractive: boolean;
}

const DWELL_END = 0.6;
const GUNSHOT_END = 0.7;
const SMOKING_START = 0.74;
const CONTAINER_START = 0.86;
const PANEL_POINTER_CUTOFF = 0.2;

/** Derive the discrete stage. Pure, so it can be compared cheaply for equality. */
export function heroStage(progress: number, reduced: boolean): HeroStage {
  if (reduced) {
    return {
      gunshot: false,
      chrome: false,
      autoPan: false,
      // flankOpacity is 1 under reduced motion, so the texts mount — but heroVars parks
      // them at ±240vh, exactly as the original did.
      flank: true,
      container: false,
      borderDone: true,
      navActive: false,
      navDark: false,
      panelInteractive: true,
    };
  }

  const g = gunshotProgress(progress);
  return {
    gunshot: g > 0.01,
    chrome: g > 0.05,
    autoPan: g > 0.99 && progress < 0.98,
    flank: flankOpacity(progress) > 0.01,
    container: progress >= CONTAINER_START,
    borderDone: borderAnimProgress(progress) >= 0.99,
    navActive: progress >= DWELL_END && progress < 0.98,
    navDark: progress >= GUNSHOT_END && progress < 0.98,
    panelInteractive: progress <= PANEL_POINTER_CUTOFF,
  };
}

/** True when two stages are identical, so the driver can skip the setState. */
export function sameStage(a: HeroStage, b: HeroStage): boolean {
  return (
    a.gunshot === b.gunshot &&
    a.chrome === b.chrome &&
    a.autoPan === b.autoPan &&
    a.flank === b.flank &&
    a.container === b.container &&
    a.borderDone === b.borderDone &&
    a.navActive === b.navActive &&
    a.navDark === b.navDark &&
    a.panelInteractive === b.panelInteractive
  );
}

export { SMOKING_START };
