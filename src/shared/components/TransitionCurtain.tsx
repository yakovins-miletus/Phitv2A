import { createContext, useContext, useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";
import { refreshScrollTriggers } from "@/shared/motion/scrollTriggerBridge";

// gsap and SmoothScroll (which owns Lenis) are loaded on demand rather than
// imported at module scope. This component is rendered by AppShell, the root
// layout present on every route, so a static `import gsap from "gsap"` here —
// or a static import of SmoothScroll, which itself imports "lenis" and
// registers ScrollTrigger at module scope — would drag both libraries into
// the entry chunk for every visitor, including on routes that never
// scroll-animate or navigate in-app. Dynamic `import()` keeps them in their
// own async chunk, fetched only the first time a curtain transition actually
// runs. Native ESM dynamic import caches per specifier, so repeat
// navigations resolve instantly from the module cache; see the idle-prefetch
// effect below for warming that cache before the first click.

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

const ROUTE_LABELS: Record<string, string> = {
  "/": "HOME CORE",
  "/about": "ABOUT PHITOPOLIS",
  "/services": "CAPABILITIES",
  "/careers": "CAREERS",
  "/blog": "INSIGHTS",
  "/contact": "GET IN TOUCH",
};

// Route changes never move focus on their own — TanStack Router swaps DOM
// content in place, it doesn't reset the caret the way a full page load
// would. Without this, a keyboard user who triggers a curtain navigation is
// left focused on whatever they clicked in the OLD page's tab order (often a
// footer/drawer link that's no longer relevant, or has even unmounted out
// from under them). AppShell already exposes `#main-content` as the skip-link
// target (tabIndex={-1}, focusable but not in normal tab order) — reuse that
// same landmark rather than inventing a second focus convention.
function focusMainLandmark() {
  document.getElementById("main-content")?.focus();
}

export function TransitionCurtainProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [destinationLabel, setDestinationLabel] = useState("");
  // Guards re-entrancy on BOTH paths. `isTransitioning` alone used to do this,
  // but it only turns true on the full curtain-sweep path below — the
  // reduced-motion fast path never plays the sweep, so it needs its own
  // ref-based lock instead of piggybacking on sweep-only state.
  const navigatingRef = useRef(false);

  const goldRef = useRef<HTMLDivElement>(null);
  const slateRef = useRef<HTMLDivElement>(null);
  const navyRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  const contentLayerRef = useRef<HTMLDivElement>(null);
  const wordmarkBoxRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const outerRingRef = useRef<SVGSVGElement>(null);
  const innerRingRef = useRef<SVGSVGElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const hudFrameRef = useRef<HTMLDivElement>(null);

  // Warm the gsap/Lenis chunk in the background shortly after mount, so the
  // first real navigation doesn't pay its fetch+parse cost synchronously.
  // This is a runtime import() inside an effect, not a static import — Vite
  // only emits <link rel="modulepreload"> for the static import graph
  // reachable from the entry chunk, so this never rejoins the eager bundle.
  // Skipped for reduced-motion visitors, who take the fast path below and
  // never need gsap at all.
  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      void import("gsap");
      void import("@/shared/components/SmoothScroll");
    };
    // Feature-detect at runtime rather than relying on the declared type:
    // lib.dom types requestIdleCallback/cancelIdleCallback as always present,
    // but real browsers (Safari) don't implement them, so a bare truthiness
    // check on the (always-defined-per-types) function reference is both
    // meaningless to TS and wrong at runtime — typeof is the correct guard.
    const hasIdleCallback = typeof window.requestIdleCallback === "function";
    const handle = hasIdleCallback
      ? window.requestIdleCallback(warm, { timeout: 2000 })
      : window.setTimeout(warm, 1200);
    return () => {
      cancelled = true;
      if (hasIdleCallback && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(handle);
      } else {
        window.clearTimeout(handle as number);
      }
    };
  }, [reduced]);

  const navigateWithCurtain = (to: string) => {
    if (navigatingRef.current) return;

    // Strip hash or search params for route label matching
    const noQuery = to.split('?')[0] || to;
    const pathname = noQuery.split('#')[0] || noQuery;
    if (window.location.pathname === pathname) return;

    navigatingRef.current = true;

    if (reduced) {
      // WCAG 2.3.3 fast path: the full sequence below is a ~4s full-viewport
      // sweep with staggered panels, counter-rotating rings and a scale/rotate
      // watermark pulse — exactly the large-area motion and rotation 2.3.3
      // flags. Reduced-motion visitors get an immediate route change instead,
      // with no curtain at all. What's preserved is the sequencing the curtain
      // otherwise owns: scroll is paused for the (near-instant) duration of
      // the navigation and ScrollTrigger positions are recomputed after, so
      // scroll state comes back correct on this path exactly as it does on
      // the full one.
      void (async () => {
        // The dynamic import itself used to sit OUTSIDE any try/finally: if
        // the chunk fetch rejected (stale index.html after a redeploy
        // pointing at content-hashed chunks a since-replaced build no longer
        // ships, or any transient network failure) the whole IIFE rejected
        // unhandled, `navigatingRef.current` never got reset, and the guard
        // at the top of this function turned every later navigation into a
        // silent no-op — the site was dead until a hard reload. Everything
        // that can throw now lives inside this try, and `startLenis` is only
        // ever called if the import actually resolved, so cleanup can't call
        // an unbound function from a half-loaded module.
        let startLenis: (() => void) | undefined;
        try {
          const mod = await import("@/shared/components/SmoothScroll");
          startLenis = mod.startLenis;
          mod.stopLenis();
          await router.navigate({ to });
          refreshScrollTriggers();
        } catch (err) {
          // Keep this visible — a future debugging session staring at a
          // "navigation just does nothing" report needs this in the console.
          console.error("[TransitionCurtain] reduced-motion navigation failed", err);
        } finally {
          startLenis?.();
          navigatingRef.current = false;
        }
        focusMainLandmark();
      })();
      return;
    }

    setIsTransitioning(true);
    const label = ROUTE_LABELS[pathname] || pathname.toUpperCase().replace(/\//g, "") || "LOADING";
    setDestinationLabel(label);

    void (async () => {
      // Mirrors the reduced-motion path's fix, but the stakes are higher
      // here: `setIsTransitioning(true)` above has already mounted the
      // full-viewport, z-index 9999 opaque overlay. If either import
      // rejects (same redeploy/stale-chunk or network scenario as the
      // reduced path) there is no gsap available to run the exit sweep that
      // normally calls `setIsTransitioning(false)` — without this try/catch
      // the curtain used to stay on screen covering the entire site forever,
      // with navigatingRef stuck too. `importsLoaded` distinguishes "never
      // got gsap/Lenis" (fall back to a plain, unanimated router.navigate —
      // it doesn't need gsap, and a working navigation beats a black screen)
      // from "something failed after the curtain animation had already
      // started" (just tear the overlay down and restore scroll).
      let importsLoaded = false;
      let startLenis: (() => void) | undefined;
      try {
        const [{ gsap }, mod] = await Promise.all([
          import("gsap"),
          import("@/shared/components/SmoothScroll"),
        ]);
        importsLoaded = true;
        startLenis = mod.startLenis;
        mod.stopLenis(); // Pause scroll during transition

        const tl = gsap.timeline();
        const goldPanels = goldRef.current?.children ? Array.from(goldRef.current.children) : [];
        const slatePanels = slateRef.current?.children ? Array.from(slateRef.current.children) : [];
        const navyPanels = navyRef.current?.children ? Array.from(navyRef.current.children) : [];

        // Ensure content layer & wordmark are STRICTLY HIDDEN initially so there is zero early flash
        tl.set(contentLayerRef.current, { opacity: 0, visibility: "hidden" });
        tl.set(wordmarkBoxRef.current, { y: 60, opacity: 0, scale: 0.95 });
        tl.set(watermarkRef.current, { scale: 0.85, opacity: 0, rotate: -3 });

        // Set 3-layer panel origins
        tl.set(goldPanels, { transformOrigin: "bottom", scaleY: 0 });
        tl.set(slatePanels, { transformOrigin: "top", scaleY: 0 });
        tl.set(navyPanels, { transformOrigin: "bottom", scaleY: 0 });
        tl.set([topBarRef.current, bottomBarRef.current], { scaleX: 0 });
        tl.set(outerRingRef.current, { scale: 0.3, opacity: 0, rotation: 0 });
        tl.set(innerRingRef.current, { scale: 0.3, opacity: 0, rotation: 0 });
        tl.set(hudFrameRef.current, { opacity: 0 });

        const counterObj = { val: 0 };
        if (counterRef.current) counterRef.current.innerText = "000%";

        // PHASE 1: Tri-Layer Sweep (Gold -> Slate -> Navy)
        // 1. Gold Accent Layer (Bottom -> Up)
        tl.to(goldPanels, {
          scaleY: 1,
          duration: 0.5,
          ease: "power4.inOut",
          stagger: { each: 0.03, from: "center" },
        });

        // 2. Slate Layer (Top -> Down)
        tl.to(slatePanels, {
          scaleY: 1,
          duration: 0.5,
          ease: "power4.inOut",
          stagger: { each: 0.03, from: "start" },
        }, "-=0.4");

        // 3. Deep Navy Core Layer (Bottom -> Up)
        tl.to(navyPanels, {
          scaleY: 1,
          duration: 0.55,
          ease: "power4.inOut",
          stagger: { each: 0.03, from: "center" },
        }, "-=0.4");

        // 4. Horizontal Cyber Sweeper Bars
        tl.to(topBarRef.current, { scaleX: 1, duration: 0.5, ease: "expo.out" }, "-=0.2");
        tl.to(bottomBarRef.current, { scaleX: 1, duration: 0.5, ease: "expo.out" }, "<");

        // PHASE 2: Reveal Wordmark & Telemetry NOW (Screen is 100% covered by Navy)
        tl.to(contentLayerRef.current, { opacity: 1, visibility: "visible", duration: 0.01 });

        // Background Watermark Pulse
        tl.to(watermarkRef.current, {
          scale: 1,
          opacity: 0.05,
          rotate: 0,
          duration: 0.8,
          ease: "power2.out",
        }, "<");

        // HUD Frame & Rings
        tl.to(hudFrameRef.current, { opacity: 1, duration: 0.3 }, "-=0.1");
        tl.to(outerRingRef.current, {
          scale: 1,
          opacity: 0.25,
          rotation: 180,
          duration: 0.8,
          ease: "power3.out",
        }, "<");
        tl.to(innerRingRef.current, {
          scale: 1,
          opacity: 0.35,
          rotation: -360,
          duration: 0.8,
          ease: "power3.out",
        }, "<");

        // Wordmark Box Rise & Scale
        tl.to(wordmarkBoxRef.current, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.65,
          ease: "expo.out",
        }, "-=0.5");

        // Percentage Counter 000% -> 100%
        tl.to(counterObj, {
          val: 100,
          duration: 0.6,
          ease: "power3.inOut",
          onUpdate: () => {
            if (counterRef.current) {
              counterRef.current.innerText = `${Math.floor(counterObj.val).toString().padStart(3, "0")}%`;
            }
          },
        }, "-=0.5");

        // PHASE 3: Route Push
        tl.add(() => {
          // `.catch` before `.then` (rather than a second argument to `.then`,
          // or leaving the rejection to propagate) so a failed navigate() —
          // e.g. the destination loader throwing — still falls through to the
          // exit sweep below. Without it, a rejection here skipped `onComplete`
          // entirely and left the curtain covering the screen with no route
          // change underneath it, same dead-end as the missing-import case
          // this whole rewrite is fixing.
          void router.navigate({ to })
            .catch((err) => {
              console.error("[TransitionCurtain] navigation during curtain failed", err);
            })
            .then(() => {
              setTimeout(() => {
                refreshScrollTriggers();

                // PHASE 4: Exit Sequence (Everything hides BEFORE curtain uncovers)
                const outTl = gsap.timeline({
                  onComplete: () => {
                    setIsTransitioning(false);
                    startLenis?.(); // Restore scroll
                    navigatingRef.current = false;
                    focusMainLandmark();
                  }
                });

                // 1. Hide Wordmark & Telemetry FIRST while screen is still covered
                outTl.to(wordmarkBoxRef.current, {
                  y: -60,
                  opacity: 0,
                  scale: 0.95,
                  duration: 0.35,
                  ease: "expo.in",
                });
                outTl.to(hudFrameRef.current, { opacity: 0, duration: 0.25 }, "<");
                outTl.to(watermarkRef.current, { scale: 1.1, opacity: 0, duration: 0.3 }, "<");
                outTl.to([outerRingRef.current, innerRingRef.current], { scale: 0.3, opacity: 0, duration: 0.3 }, "<");
                outTl.to(contentLayerRef.current, { opacity: 0, visibility: "hidden", duration: 0.01 });

                // 2. Retract Horizontal Bars
                outTl.to([topBarRef.current, bottomBarRef.current], { scaleX: 0, duration: 0.4, ease: "expo.in" }, "-=0.1");

                // 3. Switch Panel Origins to Top & Sweep Out (Navy -> Slate -> Gold)
                outTl.set(navyPanels, { transformOrigin: "top" });
                outTl.set(slatePanels, { transformOrigin: "bottom" });
                outTl.set(goldPanels, { transformOrigin: "top" });

                outTl.to(navyPanels, {
                  scaleY: 0,
                  duration: 0.55,
                  ease: "power4.inOut",
                  stagger: { each: 0.03, from: "center" },
                }, "-=0.2");

                outTl.to(slatePanels, {
                  scaleY: 0,
                  duration: 0.5,
                  ease: "power4.inOut",
                  stagger: { each: 0.03, from: "start" },
                }, "-=0.4");

                outTl.to(goldPanels, {
                  scaleY: 0,
                  duration: 0.5,
                  ease: "power4.inOut",
                  stagger: { each: 0.03, from: "center" },
                }, "-=0.4");

              }, 100);
            });
          });
      } catch (err) {
        console.error("[TransitionCurtain] curtain transition failed", err);
        if (!importsLoaded) {
          // gsap/Lenis chunk never arrived — there is no animated way out.
          // Fall back to a plain router navigation rather than leaving the
          // opaque overlay on screen forever; the router doesn't need gsap.
          try {
            await router.navigate({ to });
            refreshScrollTriggers();
          } catch (navErr) {
            // Even the fallback failed (e.g. offline). Nothing left to do
            // but restore state below and leave the user on the page they
            // started from — better than a permanently black screen.
            console.error("[TransitionCurtain] fallback navigation failed", navErr);
          }
        }
        setIsTransitioning(false);
        startLenis?.();
        navigatingRef.current = false;
        focusMainLandmark();
      }
    })();
  };

  return (
    <TransitionCurtainContext.Provider value={{ navigateWithCurtain }}>
      {children}
      {/* Screen-reader-only status line for the curtain below. The panels,
          rings, wordmark and percentage counter are a purely decorative
          sweep — see `aria-hidden` on the Box beneath — so without this a
          screen reader either announces nothing while the sighted UI claims
          a page change is happening, or (worse, since the overlay isn't
          aria-hidden by default) reads the entire covered page underneath
          it as if it were still the focus of attention. `aria-live="polite"`
          only announces on content change, so it stays silent until
          `destinationLabel` actually updates. */}
      <Box
        aria-live="polite"
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {isTransitioning ? `Navigating to ${destinationLabel}` : ""}
      </Box>
      <Box
        aria-hidden="true"
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          pointerEvents: isTransitioning ? "auto" : "none",
          display: "flex",
          visibility: isTransitioning ? "visible" : "hidden",
          overflow: "hidden",
        }}
      >
        {/* Layer 1: Gold Accent (9 Columns, Bottom Origin) */}
        <Box ref={goldRef} sx={{ position: "absolute", inset: 0, display: "flex" }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Box key={`gold-${i}`} sx={{ flex: 1, height: "100%", bgcolor: NOIR.gold, transform: "scaleY(0)" }} />
          ))}
        </Box>

        {/* Layer 2: Cyber Slate (9 Columns, Top Origin) */}
        <Box ref={slateRef} sx={{ position: "absolute", inset: 0, display: "flex" }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Box key={`slate-${i}`} sx={{ flex: 1, height: "100%", bgcolor: "#0b1526", transform: "scaleY(0)" }} />
          ))}
        </Box>
        
        {/* Layer 3: Deep Navy Core (9 Columns, Center-Out Stagger) */}
        <Box ref={navyRef} sx={{ position: "absolute", inset: 0, display: "flex" }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Box
              key={`navy-${i}`}
              sx={{
                flex: 1,
                height: "100%",
                bgcolor: NOIR.navyInk,
                transform: "scaleY(0)",
                borderRight: i < 8 ? "1px solid rgba(255, 199, 44, 0.08)" : "none",
              }}
            />
          ))}
        </Box>

        {/* Layer 4: Horizontal Cyber Sweeper Bars */}
        <Box
          ref={topBarRef}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            bgcolor: NOIR.gold,
            transform: "scaleX(0)",
            transformOrigin: "left",
            zIndex: 2,
          }}
        />
        <Box
          ref={bottomBarRef}
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            bgcolor: NOIR.gold,
            transform: "scaleX(0)",
            transformOrigin: "right",
            zIndex: 2,
          }}
        />

        {/* Layer 5: Background Watermark Marquee Pulse */}
        <Box
          ref={watermarkRef}
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            opacity: 0,
            zIndex: 1,
          }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: { xs: "12vw", md: "16vw" },
              letterSpacing: "0.15em",
              color: NOIR.gold,
              fontFamily: "Inter, sans-serif",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            PHITOPOLIS
          </Typography>
        </Box>

        {/* Content Layer (Wordmark & Telemetry) - STRICTLY HIDDEN UNTIL SCREEN IS COVERED */}
        <Box
          ref={contentLayerRef}
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            opacity: 0,
            visibility: "hidden",
            zIndex: 3,
          }}
        >
          {/* Cybernetic HUD Counter-Rotating SVG Rings */}
          <Box sx={{ position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Outer Ring */}
            <svg ref={outerRingRef} width="520" height="520" viewBox="0 0 100 100" style={{ position: "absolute", opacity: 0 }}>
              <circle cx="50" cy="50" r="46" fill="none" stroke={NOIR.gold} strokeWidth="0.5" strokeDasharray="3 6" />
              <polygon points="50,2 98,50 50,98 2,50" fill="none" stroke={NOIR.gold} strokeWidth="0.5" opacity="0.4" />
            </svg>
            
            {/* Inner Ring */}
            <svg ref={innerRingRef} width="380" height="380" viewBox="0 0 100 100" style={{ position: "absolute", opacity: 0 }}>
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.75" strokeDasharray="1 4" />
              <polygon points="50,12 88,50 50,88 12,50" fill="none" stroke={NOIR.gold} strokeWidth="0.75" />
              <line x1="50" y1="0" x2="50" y2="100" stroke={NOIR.gold} strokeWidth="0.5" opacity="0.3" />
              <line x1="0" y1="50" x2="100" y2="50" stroke={NOIR.gold} strokeWidth="0.5" opacity="0.3" />
            </svg>
          </Box>

          {/* Mechanical Telemetry HUD Frame */}
          <Box
            ref={hudFrameRef}
            sx={{
              position: "absolute",
              inset: { xs: 24, md: 48 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              pointerEvents: "none",
              opacity: 0,
            }}
          >
            {/* Top Bar */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontFamily: MONO, fontSize: { xs: 9, md: 11 }, letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)" }}>
                ┌ SYS.LOC // BGC MANILA [14.5995° N]
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: { xs: 9, md: 11 }, letterSpacing: "0.2em", color: NOIR.gold }}>
                ● ROUTE_PUSH_SYNC ┐
              </Typography>
            </Box>

            {/* Bottom Bar */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontFamily: MONO, fontSize: { xs: 9, md: 11 }, letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)" }}>
                └ BUFFER // 100% OK
              </Typography>
              <Typography
                ref={counterRef}
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: 14, md: 22 },
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: NOIR.gold,
                }}
              >
                000%
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: { xs: 9, md: 11 }, letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)" }}>
                LATENCY // 0.04MS ┘
              </Typography>
            </Box>
          </Box>

          {/* Main Wordmark Box */}
          <Box
            ref={wordmarkBoxRef}
            sx={{
              px: 3,
              py: 1,
              zIndex: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: { xs: 10, md: 13 },
                letterSpacing: "0.3em",
                color: NOIR.gold,
                textTransform: "uppercase",
                mb: 1,
              }}
            >
              // NAVIGATING TO
            </Typography>
            
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                fontSize: { xs: "2.5rem", sm: "4.5rem", md: "7rem" },
                WebkitTextStroke: { xs: `1px ${NOIR.gold}`, md: `2px ${NOIR.gold}` },
                WebkitTextFillColor: "transparent",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontFamily: "Inter, sans-serif",
                textAlign: "center",
                lineHeight: 1,
              }}
            >
              {destinationLabel}
            </Typography>
          </Box>
        </Box>
      </Box>
    </TransitionCurtainContext.Provider>
  );
}
