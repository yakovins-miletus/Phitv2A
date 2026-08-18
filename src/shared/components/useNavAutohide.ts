import { useEffect, useRef, useState } from "react";

/**
 * Nav autohide, as a pure reducer plus the effect that feeds it scroll events.
 *
 * The reducer is exported separately so its thresholds are testable in jsdom,
 * which has no layout and therefore cannot exercise real scrolling. Every
 * number that decides whether the nav is showing lives in NAV_AUTOHIDE.
 *
 * PARITY-LOCKED: reads window.scrollY, NOT Lenis. Lenis' virtual position leads
 * and lags the native one while smoothing, so switching would move all four
 * thresholds — and Lenis is only mounted on "/" anyway, so the nav would behave
 * differently per route.
 */

export const NAV_AUTOHIDE = {
  /** Above this offset the nav is always shown — you are effectively at the top. */
  ALWAYS_SHOW_ABOVE: 80,
  /** A downward jump larger than this hides the nav immediately. */
  HIDE_ON_DOWN_DELTA: 8,
  /** Upward movement smaller than this is ignored as jitter. */
  UP_DELTA_FLOOR: -10,
  /** Accumulated upward travel that reveals the nav again. */
  REVEAL_ACCUMULATOR: -25,
  /** Any upward movement below this offset reveals the nav. */
  REVEAL_NEAR_TOP: 120,
} as const;

export interface NavAutohideState {
  hidden: boolean;
  lastY: number;
  accumulator: number;
}

export function initialNavAutohideState(y = 0): NavAutohideState {
  return { hidden: false, lastY: y, accumulator: 0 };
}

/**
 * One scroll event. Transcribed literally from the inline handler in AppShell;
 * the branch order is significant, since the near-top case wins over direction.
 */
export function navAutohideReducer(state: NavAutohideState, currentY: number): NavAutohideState {
  const diff = currentY - state.lastY;
  let { hidden, accumulator } = state;

  if (currentY < NAV_AUTOHIDE.ALWAYS_SHOW_ABOVE) {
    hidden = false;
    accumulator = 0;
  } else if (diff > NAV_AUTOHIDE.HIDE_ON_DOWN_DELTA) {
    hidden = true;
    accumulator = 0;
  } else if (diff < NAV_AUTOHIDE.UP_DELTA_FLOOR) {
    accumulator += diff;
    if (accumulator < NAV_AUTOHIDE.REVEAL_ACCUMULATOR || currentY < NAV_AUTOHIDE.REVEAL_NEAR_TOP) {
      hidden = false;
    }
  }

  return { hidden, accumulator, lastY: currentY };
}

/**
 * @param enabled  from useNavbar().autohideEnabled
 * @param pathname re-baselines on change, so the first scroll after navigating
 *                 is not diffed against the previous page's offset
 */
export function useNavAutohide(enabled: boolean, pathname: string): boolean {
  const [hidden, setHidden] = useState(false);
  const stateRef = useRef<NavAutohideState>(initialNavAutohideState());

  useEffect(() => {
    stateRef.current = initialNavAutohideState(typeof window !== "undefined" ? window.scrollY : 0);

    if (!enabled) {
      return;
    }

    const handleScroll = () => {
      const next = navAutohideReducer(stateRef.current, window.scrollY);
      stateRef.current = next;
      setHidden(next.hidden);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [enabled, pathname]);

  return enabled ? hidden : false;
}
