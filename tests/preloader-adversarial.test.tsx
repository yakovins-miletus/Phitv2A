import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { Preloader, PRELOADER_SESSION_KEY, type LoadSignal } from "@/shared/components/Preloader";
import * as motion from "@/shared/motion";
import { renderWithProviders } from "./test-utils";

describe("Challenger M1 Adversarial Suite — Preloader & Intro", () => {
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
      }, { timeout: 2500 });

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
  });

  describe("2. Failsafe & Stalled/Hanging Promises", () => {
    it("failsafe timer guarantees resolution within ~1500ms when warmup promise never resolves", async () => {
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
      }, { timeout: 3000 });

      const elapsed = Date.now() - startTime;
      // Should fire around 1500ms failsafe (or max settle + out ~ 1200ms)
      expect(elapsed).toBeGreaterThanOrEqual(1000);
      expect(elapsed).toBeLessThan(3000);
    });

    it("settle timeout (MAX_SETTLE_MS) triggers exit when assets stall past the cap", async () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(false);

      const slowPromise = new Promise<void>((resolve) => {
        setTimeout(resolve, 8000); // far longer than the settle cap
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

      // The cap moved 800ms -> 1800ms when the intro became a warm-up
      // preloader: at 800ms it routinely abandoned the route precompile it
      // exists to perform. What the cap guarantees is unchanged — a stalled
      // signal cannot hold the overlay — so this asserts the guarantee, with a
      // timeout sized to the new ceiling rather than the old one.
      await waitFor(() => {
        expect(onStartExit).toHaveBeenCalled();
        expect(onDone).toHaveBeenCalled();
      }, { timeout: 3500 });
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

      await waitFor(() => {
        expect(onStartExit).toHaveBeenCalled();
        expect(onDone).toHaveBeenCalled();
      }, { timeout: 1500 });
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
      }, { timeout: 2000 });
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

      await waitFor(() => {
        expect(onDone).toHaveBeenCalled();
      }, { timeout: 1500 });
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

      await waitFor(() => {
        expect(onStartExit).toHaveBeenCalled();
        expect(onDone).toHaveBeenCalled();
      }, { timeout: 1500 });
    });

    it("pressing Escape repeatedly does not cause errors or multiple onDone invocations", async () => {
      vi.spyOn(motion, "useReducedMotion").mockReturnValue(false);
      const user = userEvent.setup();

      const onDone = vi.fn();
      renderWithProviders(<Preloader onDone={onDone} />);

      await user.keyboard("{Escape}");
      await user.keyboard("{Escape}");
      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(onDone).toHaveBeenCalledTimes(1);
      }, { timeout: 1500 });
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

      await waitFor(() => {
        expect(newOnStartExit).toHaveBeenCalled();
        expect(newOnDone).toHaveBeenCalled();
      }, { timeout: 1500 });

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
      }, { timeout: 1500 });

      delete (document as { fonts?: unknown }).fonts;
    });
  });
});
