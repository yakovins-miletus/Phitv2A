import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import Box from "@mui/material/Box";

import { useReducedMotion } from "@/shared/motion";
import { refreshScrollTriggers } from "@/shared/motion/scrollTriggerBridge";

/**
 * Route transitions.
 *
 * There is no curtain here any more, and the file keeps its name only because
 * `useTransitionCurtain()` is imported in a dozen places; the hook's contract is
 * unchanged.
 *
 * WHAT WAS HERE. A full-viewport opaque overlay: tri-layer panel sweep, HUD
 * telemetry, counter-rotating rings, a destination wordmark. It sealed the
 * viewport, swapped the route behind itself, then retracted — about 0.7s, of
 * which ~0.4s was a blank screen. That is precisely what reads as lag. A blank
 * screen carries no information, so the reader has nothing to do but wait, and
 * the wait feels longer than the stopwatch says it is.
 *
 * WHAT REPLACES IT. `document.startViewTransition()`, driven by the router. The
 * browser snapshots the outgoing page, mounts the new tree, and composites both
 * snapshots as GPU layers, styled in `shared/theme/viewTransitions.css`. The
 * reader can see real content for every frame of the transition — there is no
 * blank, at any point, by construction rather than by tuning.
 *
 * Three consequences worth stating, because they are why this is *less* code
 * rather than differently-arranged code:
 *
 *  1. No gsap import. The curtain was the only reason this module — rendered by
 *     `AppShell` on every route — reached for gsap at all, and it needed a
 *     dynamic `import()` plus an idle prefetch plus a fallback for when that
 *     import rejects, purely to keep gsap out of the eager bundle. Deleting the
 *     animation deletes that whole apparatus. Lenis is still imported lazily,
 *     for scroll suspension only.
 *  2. No overlay state. `isTransitioning` gated a z-index 9999 opaque box, so
 *     every failure path had to guarantee it came down or the visitor got a
 *     black screen. With nothing mounted, there is nothing to strand.
 *  3. Timing is the browser's. The old three-beat budget (IN / dynamic SETTLE /
 *     OUT, hard-capped at 1.5s) existed to stop a hand-rolled timeline from
 *     outliving a slow route resolve. `startViewTransition` already sequences
 *     "snapshot → swap → animate" against the actual commit, so the cap has
 *     nothing left to protect against. Durations live in CSS now: 0.55s for
 *     interior routes, 0.9s for home.
 *
 * WHERE VIEW TRANSITIONS ARE MISSING (Firefox, at time of writing) the router
 * performs a plain synchronous swap. No animation, no error, and — importantly
 * — still no blank frame. Correct degradation for a decorative layer, and the
 * reason this needs no capability check of its own.
 */

interface TransitionCurtainContextType {
  navigateWithCurtain: (to: string) => void;
}

const TransitionCurtainContext = createContext<TransitionCurtainContextType | null>(null);

export function useTransitionCurtain() {
  const context = useContext(TransitionCurtainContext);
  if (!context) {
    throw new Error("useTransitionCurtain must be used within a TransitionCurtainProvider");
  }
  return context;
}

/**
 * Route changes never move focus on their own — the router swaps DOM content in
 * place, it doesn't reset the caret the way a document load would. Without this
 * a keyboard user is left focused on whatever they clicked in the OLD page's tab
 * order, often a footer link that has since unmounted. `#main-content` is
 * already the skip-link target (`tabIndex={-1}`), so reuse it rather than
 * inventing a second focus convention.
 */
function focusMainLandmark() {
  document.getElementById("main-content")?.focus();
}

/** Human names for the announcer. A screen reader saying "SERVICES" is useful;
 *  saying "/services" is not. */
const ROUTE_LABELS: Record<string, string> = {
  "/": "Home",
  "/about": "About Phitopolis",
  "/services": "Capabilities",
  "/careers": "Careers",
  "/blog": "Insights",
  "/contact": "Contact",
};

/**
 * Home is an arrival, interior routes are steps sideways, and they get different
 * gestures. The flag is an attribute on <html> rather than a class because the
 * CSS selector has to sit *outside* the view-transition pseudo-element tree —
 * those pseudos are children of the document root, so only the root can
 * parameterise them.
 */
function markTransitionKind(pathname: string) {
  document.documentElement.dataset.routeTransition = pathname === "/" ? "home" : "page";
}

function clearTransitionKind() {
  delete document.documentElement.dataset.routeTransition;
}

export function TransitionCurtainProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const reduced = useReducedMotion();

  /**
   * Re-entrancy lock. A second click while a navigation is in flight would start
   * a second view transition, and the browser resolves that by aborting the
   * first — visually a snap. A ref, not state: this must be readable and
   * writable synchronously inside the click handler, before any render.
   */
  const navigatingRef = useRef(false);

  /** Announcer copy. State, not a ref — the announcement only happens because
   *  React commits a text change into the live region. */
  const [destinationLabel, setDestinationLabel] = useState("");

  const navigateWithCurtain = useCallback(
    (to: string) => {
      if (navigatingRef.current) return;

      const noQuery = to.split("?")[0] || to;
      const pathname = noQuery.split("#")[0] || noQuery;
      if (window.location.pathname === pathname) return;

      navigatingRef.current = true;
      setDestinationLabel(
        ROUTE_LABELS[pathname] ?? pathname.replace(/^\//, "").replace(/-/g, " ") ?? "New page",
      );

      void (async () => {
        let startLenis: (() => void) | undefined;
        try {
          /**
           * Lenis is suspended across the swap on both paths. It owns
           * `scrollTop` via its own rAF loop, and letting it keep running while
           * the document's scroll height changes underneath it produces a lurch
           * on arrival. Imported lazily — this module is eager on every route
           * and Lenis must not be.
           */
          const mod = await import("@/shared/components/SmoothScroll");
          startLenis = mod.startLenis;
          mod.stopLenis();

          /**
           * `viewTransition` is opted out of entirely under reduced motion
           * rather than being animated-then-suppressed in CSS. The CSS
           * `animation: none` fallback is a second line of defence for anything
           * that starts a transition another way; not starting one at all is
           * cheaper and has no snapshot cost.
           */
          if (reduced === true) {
            await router.navigate({ to });
          } else {
            markTransitionKind(pathname);
            await router.navigate({ to, viewTransition: true });
          }
        } catch (err) {
          console.error("[RouteTransition] navigation failed", err);
        } finally {
          clearTransitionKind();
          startLenis?.();
          navigatingRef.current = false;

          /**
           * Deferred deliberately. `ScrollTrigger.refresh()` is a synchronous
           * layout pass over every trigger on the page — on the ~18-screen home
           * route that is a 50–200ms block. Running it inside the transition put
           * that block squarely between two animated beats, which is a large
           * part of what the stutter actually was. Two frames out, the
           * compositor has finished and the block lands on an idle main thread
           * where nobody sees it.
           */
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              refreshScrollTriggers();
              focusMainLandmark();
              /**
               * Empty the live region once the announcement has been made. A
               * region left holding stale text re-announces if the visitor
               * later navigates back to the same route — the text would be
               * identical, React would not commit a change, and the second
               * navigation would be announced as silence.
               */
              setDestinationLabel("");
            });
          });
        }
      })();
    },
    [reduced, router],
  );

  return (
    <TransitionCurtainContext.Provider value={{ navigateWithCurtain }}>
      {children}
      {/* A router that swaps its tree in place announces nothing. Sighted
          visitors get the page visibly changing under them; without this a
          screen reader user gets silence, then finds themselves somewhere else.
          This mattered when a decorative curtain was covering the page and it
          matters at least as much now that the change is purely visual.
          `aria-live="polite"` only fires on content change, so it stays silent
          until `destinationLabel` actually updates. */}
      <Box
        aria-live="polite"
        sx={{
          position: "absolute",
          // "1px", NOT `1`. In MUI's system a unitless number is a *ratio*, so
          // `width: 1` compiles to `width: 100%` — and because `#root` is
          // `position: static`, this absolutely-positioned box resolved against
          // the initial containing block (the viewport) and rendered a full
          // 100vh tall, parked at `top: <body height>` — i.e. one entire
          // viewport of empty scrollable space below the footer, on every
          // route. `clip` hides it visually but contributes nothing to layout
          // or scroll extent, which is why it was invisible yet scrollable.
          // Guarded by tests/motion/no-dead-scroll.test.ts.
          width: "1px",
          height: "1px",
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
          p: 0,
          m: -1,
        }}
      >
        {destinationLabel ? `Navigating to ${destinationLabel}` : ""}
      </Box>
    </TransitionCurtainContext.Provider>
  );
}
