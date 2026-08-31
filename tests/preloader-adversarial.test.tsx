import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { Providers } from "@/app/providers";
import { Preloader, PRELOADER_SESSION_KEY, type LoadSignal } from "@/shared/components/Preloader";
import * as motion from "@/shared/motion";
import {
  CHOREO_END_S,
  POST_HOLD_S,
} from "@/shared/components/preloaderChoreo";
import { makeTestQueryClient, renderWithProviders } from "./test-utils";

/**
 * The intro is a ~8.5s showcase, not a ~1.6s beat. These are real-timer tests,
 * so every window is derived from the choreography table rather than retyped —
 * re-pacing the intro must not silently turn these into failsafe tests.
 *
 * Mirrors Preloader.tsx: OUT_DURATION_S 0.58, SIGNAL_CAP_AFTER_CHOREO_MS 1500,
 * BEAT_FAILSAFE_MS 13000.
 */
// EXIT_FADE_S (0.6) + OUT_DURATION_S (2.0): the exit now fades everything out
// FIRST, fully, then opens the aperture — sequential, not concurrent.
const OUT_MS = 2600;
/** Natural exit: choreography, then the post-100 buffer, then the reveal. */
const WARM_EXIT_MS = CHOREO_END_S * 1000 + POST_HOLD_S * 1000 + OUT_MS; // ~10560
/** Stalled-signal exit: choreography, then the signal cap, then the reveal. */
const STALL_EXIT_MS = CHOREO_END_S * 1000 + 1500 + OUT_MS; // ~10060
/** The absolute ceiling. Assertions stay under it so a pass proves the real
 *  exit path fired, not the failsafe. */
const FAILSAFE_MS = 13000;
/** Slack for scheduling jitter under a loaded CI box. */
const SLACK_MS = 1600;

describe("Challenger M1 Adversarial Suite — Preloader & Intro", () => {
  // Vitest's 5s default predates the showcase intro; a natural exit alone is
  // ~8.5s of real time.
  vi.setConfig({ testTimeout: 25000 });

  beforeEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. useReducedMotion() State Transitions", () => {
    it("resolves when useReducedMotion transitions from null -> false", async () => {
      let reducedVal: boolean | null = null;
      vi.spyOn(motion, "useReducedMotion").mockImplementation(() => reducedVal);

      const onDone = vi.fn();
      const onStartExit = vi.fn();

      const { rerender } = renderWithProviders(
        <Preloader onDone={onDone} onStartExit={onStartExit} />
      );

      expect(screen.getByTestId("preloader")).toBeInTheDocument();
      expect(onDone).not.toHaveBeenCalled();

      // Transition null -> false
      reducedVal = false;
      rerender(<Preloader onDone={onDone} onStartExit={onStartExit} />);

      await waitFor(() => {
        expect(onStartExit).toHaveBeenCalled();
        expect(onDone).toHaveBeenCalled();
      }, { timeout: WARM_EXIT_MS + SLACK_MS });

      expect(sessionStorage.getItem(PRELOADER_SESSION_KEY)).toBe("1");
    });

    it("resolves immediately when useReducedMotion transitions from null -> true mid-flight", async () => {
      let reducedVal: boolean | null = null;
      vi.spyOn(motion, "useReducedMotion").mockImplementation(() => reducedVal);

      const onDone = vi.fn();
      const onStartExit = vi.fn();

      const { rerender } = renderWithProviders(
        <Preloader onDone={onDone} onStartExit={onStartExit} />
      );

      expect(screen.getByTestId("preloader")).toBeInTheDocument();
      expect(onDone).not.toHaveBeenCalled();

      // Transition null -> true
      reducedVal = true;
      rerender(<Preloader onDone={onDone} onStartExit={onStartExit} />);

      await waitFor(() => {
        expect(onStartExit).toHaveBeenCalled();
        expect(onDone).toHaveBeenCalled();
      }, { timeout: 500 });
    });

    it("resolves synchronously on initial render when useReducedMotion is true", () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(true);

      const onDone = vi.fn();
      const onStartExit = vi.fn();

      renderWithProviders(<Preloader onDone={onDone} onStartExit={onStartExit} />);

      expect(onStartExit).toHaveBeenCalledTimes(1);
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem(PRELOADER_SESSION_KEY)).toBe("1");
    });

    it("reschedules the post-100 exit when `reduced` flips inside the POST_HOLD_MS (2000ms) buffer (post-100 timer race)", async () => {
      // Reproduces the bug fixed alongside this test: the SETTLE effect
      // (Preloader.tsx) sets `completedAt100Ref.current = true` when it
      // schedules the POST_HOLD_MS (2000ms) bufferTimeout, but pre-fix never
      // reset it. If `reduced` (or `triggerExit`, which itself depends on
      // `[reduced, finish]`) changes identity before that timer fires, the
      // effect re-runs: cleanup cancels the pending timer, and the re-entrant
      // run falls into the dead `if (completedAt100Ref.current) return;`
      // branch — triggerExit() never fires again on this path. Only the
      // independent BEAT_FAILSAFE_MS (13000ms) effect rescues it, which is why
      // this test asserts a window well under that failsafe: a pass here proves
      // the real exit path fired, not the failsafe.
      let reducedVal: boolean | null = null;
      vi.spyOn(motion, "useReducedMotion").mockImplementation(() => reducedVal);

      let resolveSig!: () => void;
      const sig = new Promise<void>((res) => {
        resolveSig = res;
      });

      const onDone = vi.fn();
      const onStartExit = vi.fn();

      // Rerender through the same `<Providers>` root the initial render
      // used. Calling `rerender(<Preloader .../>)` bare (as the "null ->
      // false" test above does) swaps the root element type from
      // `Providers` to `Preloader`, which makes React tear down and remount
      // the whole tree instead of re-running effects on the same instance —
      // that would reset every ref (including completedAt100Ref) and mask
      // the exact race this test exists to catch. Keeping `Providers` in
      // the tree on both renders keeps this an in-place update.
      const queryClient = makeTestQueryClient();
      const startTime = Date.now();
      const { rerender } = renderWithProviders(
        <Preloader
          onDone={onDone}
          onStartExit={onStartExit}
          warmup={[{ label: "RACE", promise: sig }]}
        />,
        queryClient
      );

      // Let the IN beat + pre-roll entrance timer elapse first, so
      // `entranceDone` is true before the warmup completes — the SETTLE
      // effect early-returns while `!entranceDone` and would never schedule
      // the post-100 timer we're about to race.
      await new Promise((r) => setTimeout(r, CHOREO_END_S * 1000 + 300));

      // Complete the warmup inside act(): isComplete flips true, and the
      // SETTLE effect schedules the 2000ms bufferTimeout + latches
      // completedAt100Ref.
      act(() => {
        resolveSig();
      });
      await screen.findByText("100%");

      // Still inside the 2000ms buffer: flip `reduced` (null -> false) and
      // rerender. This changes both `reduced` itself and `triggerExit`
      // (dependent on `[reduced, finish]`) in the SETTLE effect's deps,
      // forcing the exact re-run this test targets. Note `reduced` becomes
      // `false`, not `true` — so unlike the null->true test above,
      // `triggerExit` does NOT take the reduced-motion fast path and instead
      // runs the full exit (the EXIT_FADE_S fade, then the OUT_DURATION_S
      // rectangular reveal) before calling `finish()`, which is why the
      // assertion below budgets for that rather than a bare ~500ms window.
      reducedVal = false;
      rerender(
        <Providers queryClient={queryClient}>
          <Preloader
            onDone={onDone}
            onStartExit={onStartExit}
            warmup={[{ label: "RACE", promise: sig }]}
          />
        </Providers>
      );

      // Window: covers the real path (the choreography + the 2000ms buffer +
      // the ~2600ms exit — EXIT_FADE_S then OUT_DURATION_S — + scheduling
      // slack) while staying clear of BEAT_FAILSAFE_MS (13000ms measured from
      // mount) — a pass proves the rescheduled post-100 timer fired, not the
      // failsafe.
      await waitFor(
        () => {
          expect(onStartExit).toHaveBeenCalled();
          expect(onDone).toHaveBeenCalled();
        },
        { timeout: WARM_EXIT_MS + SLACK_MS }
      );

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(FAILSAFE_MS);
    });
  });

  describe("2. Failsafe & Stalled/Hanging Promises", () => {
    it("a warmup promise that never resolves still exits, via the post-choreography signal cap", async () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(false);

      const hangingPromise = new Promise(() => {}); // Never resolves
      const onDone = vi.fn();
      const onStartExit = vi.fn();

      const startTime = Date.now();
      renderWithProviders(
        <Preloader
          onDone={onDone}
          onStartExit={onStartExit}
          warmup={[{ label: "PERPETUAL_STALL", promise: hangingPromise }]}
        />
      );

      expect(screen.getByTestId("preloader")).toBeInTheDocument();
      expect(screen.getByText("00%")).toBeInTheDocument();

      await waitFor(() => {
        expect(onStartExit).toHaveBeenCalled();
        expect(onDone).toHaveBeenCalled();
      }, { timeout: STALL_EXIT_MS + SLACK_MS });

      const elapsed = Date.now() - startTime;
      // The cap fires at CHOREO_END + 1500 and the reveal runs on top of it —
      // and it must still land under the unconditional failsafe, so this is
      // the real exit path rather than the rescue.
      expect(elapsed).toBeGreaterThanOrEqual(CHOREO_END_S * 1000);
      expect(elapsed).toBeLessThan(FAILSAFE_MS);
    });

    it("the post-choreography signal cap triggers exit when assets stall past it", async () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(false);

      const slowPromise = new Promise<void>((resolve) => {
        setTimeout(resolve, 30000); // far longer than the signal cap
      });
      const onDone = vi.fn();
      const onStartExit = vi.fn();

      renderWithProviders(
        <Preloader
          onDone={onDone}
          onStartExit={onStartExit}
          warmup={[{ label: "SLOW_STALL", promise: slowPromise }]}
        />
      );

      // The cap's frame of reference moved: it is now measured from the end of
      // the choreography rather than from mount, because the choreography no
      // longer races the load. What the cap guarantees is unchanged — a stalled
      // signal cannot hold the overlay — so this asserts the guarantee, with a
      // timeout sized to the new ceiling rather than the old one.
      await waitFor(() => {
        expect(onStartExit).toHaveBeenCalled();
        expect(onDone).toHaveBeenCalled();
      }, { timeout: STALL_EXIT_MS + SLACK_MS });
    });
  });

  describe("3. Fast vs Slow Warmup Signals and Promise Rejections", () => {
    it("fast warmup (instant resolve) triggers early exit after IN beat", async () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(false);

      const fastSignal: LoadSignal = {
        label: "INSTANT",
        promise: Promise.resolve("ready"),
      };
      const onDone = vi.fn();
      const onStartExit = vi.fn();

      renderWithProviders(
        <Preloader onDone={onDone} onStartExit={onStartExit} warmup={[fastSignal]} />
      );

      expect(await screen.findByText("100%")).toBeInTheDocument();
      expect(screen.getByText("READY")).toBeInTheDocument();

      // The warm floor is now the whole choreography: even with signals already
      // resolved, the exit waits on CHOREO_END + the post-100 buffer. Resolving
      // early buys a faster site, not a shorter intro.
      await waitFor(() => {
        expect(onStartExit).toHaveBeenCalled();
        expect(onDone).toHaveBeenCalled();
      }, { timeout: WARM_EXIT_MS + SLACK_MS });
    });

    it("slow warmup (resolving mid-flight) dynamically progresses and exits as soon as complete", async () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(false);

      let resolveSig1!: () => void;
      let resolveSig2!: () => void;
      const sig1 = new Promise<void>((res) => { resolveSig1 = res; });
      const sig2 = new Promise<void>((res) => { resolveSig2 = res; });

      const onDone = vi.fn();
      renderWithProviders(
        <Preloader
          onDone={onDone}
          warmup={[
            { label: "HERO_TEX", promise: sig1 },
            { label: "AUDIO_SPRITE", promise: sig2 },
          ]}
        />
      );

      expect(screen.getByText("00%")).toBeInTheDocument();

      act(() => { resolveSig1(); });
      expect(await screen.findByText("50%")).toBeInTheDocument();
      expect(screen.getByText("WARMING — HERO_TEX")).toBeInTheDocument();

      act(() => { resolveSig2(); });
      expect(await screen.findByText("100%")).toBeInTheDocument();
      expect(screen.getByText("READY")).toBeInTheDocument();

      await waitFor(() => {
        expect(onDone).toHaveBeenCalled();
      }, { timeout: WARM_EXIT_MS + SLACK_MS });
    });

    it("rejected warmup promises do not lock the preloader and count toward completion", async () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(false);

      const failingSignal: LoadSignal = {
        label: "BROKEN_IMAGE",
        promise: Promise.reject(new Error("404 Not Found")),
      };
      const onDone = vi.fn();

      renderWithProviders(
        <Preloader onDone={onDone} warmup={[failingSignal]} />
      );

      // Even though the promise rejected, it counts as settled -> 100%
      expect(await screen.findByText("100%")).toBeInTheDocument();

      // Warm floor is now the whole choreography. Contract under test
      // (rejection still counts, overlay unlocks) is unchanged.
      await waitFor(() => {
        expect(onDone).toHaveBeenCalled();
      }, { timeout: WARM_EXIT_MS + SLACK_MS });
    });
  });

  describe("4. Escape Key Handlers", () => {
    it("pressing Escape before warmup completes forces 100% and triggers early exit", async () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(false);
      const user = userEvent.setup();

      const stalledSignal: LoadSignal = {
        label: "STALLED",
        promise: new Promise(() => {}),
      };
      const onDone = vi.fn();
      const onStartExit = vi.fn();

      renderWithProviders(
        <Preloader onDone={onDone} onStartExit={onStartExit} warmup={[stalledSignal]} />
      );

      expect(screen.getByText("00%")).toBeInTheDocument();

      // Press Escape
      await user.keyboard("{Escape}");

      expect(await screen.findByText("100%")).toBeInTheDocument();
      expect(screen.getByText("READY")).toBeInTheDocument();

      // Escape bypasses the choreography and every hold, but NOT the reveal
      // animation itself (reduced is false, so triggerExit runs the real
      // OUT_DURATION_S rectangular-reveal tween before calling finish()).
      await waitFor(() => {
        expect(onStartExit).toHaveBeenCalled();
        expect(onDone).toHaveBeenCalled();
      }, { timeout: OUT_MS + SLACK_MS });
    });

    it("pressing Escape repeatedly does not cause errors or multiple onDone invocations", async () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(false);
      const user = userEvent.setup();

      const onDone = vi.fn();
      renderWithProviders(<Preloader onDone={onDone} />);

      await user.keyboard("{Escape}");
      await user.keyboard("{Escape}");
      await user.keyboard("{Escape}");

      // Same OUT_DURATION_S wait as above — Escape still plays the reveal.
      await waitFor(() => {
        expect(onDone).toHaveBeenCalledTimes(1);
      }, { timeout: OUT_MS + SLACK_MS });
    });
  });

  describe("5. Unmount & Lifecycle Safety", () => {
    it("unmounting during warmup cleans up listeners and does not fire setState on unmounted component", async () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(false);

      let resolveSignal!: () => void;
      const signalPromise = new Promise<void>((res) => { resolveSignal = res; });

      const onDone = vi.fn();
      const { unmount } = renderWithProviders(
        <Preloader onDone={onDone} warmup={[{ label: "LATE", promise: signalPromise }]} />
      );

      // Unmount while signal is still pending
      unmount();

      // Now resolve signal after unmount
      act(() => {
        resolveSignal();
      });

      // Wait a bit to ensure no errors thrown or onDone called after unmount
      await new Promise((r) => setTimeout(r, 100));
      expect(onDone).not.toHaveBeenCalled();
    });

    it("handles sessionStorage SecurityError / QuotaExceededError gracefully without throwing", () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(true);
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      });

      const onDone = vi.fn();
      expect(() => {
        renderWithProviders(<Preloader onDone={onDone} />);
      }).not.toThrow();

      expect(onDone).toHaveBeenCalled();
    });

    it("always calls the latest onDone and onStartExit callback when parent re-renders with new inline handlers", async () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(false);

      const oldOnDone = vi.fn();
      const newOnDone = vi.fn();
      const oldOnStartExit = vi.fn();
      const newOnStartExit = vi.fn();

      const { rerender } = renderWithProviders(
        <Preloader onDone={oldOnDone} onStartExit={oldOnStartExit} />
      );

      // Parent re-renders with fresh function references
      rerender(<Preloader onDone={newOnDone} onStartExit={newOnStartExit} />);

      // Warm floor is now the whole choreography. The latest-callback contract
      // itself is unchanged — only the exit timing is slower.
      await waitFor(() => {
        expect(newOnStartExit).toHaveBeenCalled();
        expect(newOnDone).toHaveBeenCalled();
      }, { timeout: WARM_EXIT_MS + SLACK_MS });

      expect(oldOnDone).not.toHaveBeenCalled();
      expect(oldOnStartExit).not.toHaveBeenCalled();
    });

    it("releases pointerEvents immediately when exit sequence begins", async () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(false);
      const user = userEvent.setup();

      renderWithProviders(<Preloader onDone={() => {}} />);
      const preloaderEl = screen.getByTestId("preloader");
      expect(preloaderEl).toHaveStyle({ pointerEvents: "auto" });

      // Trigger escape to start exit
      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(preloaderEl).toHaveStyle({ pointerEvents: "none" });
      });
    });

    it("handles document.fonts being unavailable or rejecting without crashing", async () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(false);

      Object.defineProperty(document, "fonts", {
        configurable: true,
        value: {
          ready: Promise.reject(new Error("Font load failed")),
        },
      });

      const onDone = vi.fn();
      renderWithProviders(<Preloader onDone={onDone} />);

      await waitFor(() => {
        expect(onDone).toHaveBeenCalled();
      }, { timeout: WARM_EXIT_MS + SLACK_MS });

      delete (document as { fonts?: unknown }).fonts;
    });
  });
});
