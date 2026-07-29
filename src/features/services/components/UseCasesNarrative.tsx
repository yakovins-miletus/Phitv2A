import { useRef } from "react";
import type { ComponentType, ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { motion, useInView } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/shared/motion";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import { CONTENT } from "@/shared/content";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { SignalDiagram } from "@/shared/components/diagrams/SignalDiagram";
import { PipelineDiagram } from "@/shared/components/diagrams/PipelineDiagram";
import { FollowTheSunDiagram } from "@/shared/components/diagrams/FollowTheSunDiagram";

gsap.registerPlugin(ScrollTrigger);

const DIAGRAMS: Record<string, ComponentType> = {
  "uc-1": SignalDiagram,
  "uc-2": PipelineDiagram,
  "uc-3": FollowTheSunDiagram,
};

/** Fades a slide in only while it is actually on screen — off-screen slides
 *  sit at near-zero opacity so the pinned scrub composites less per frame. */
function SlideFade({ children, disabled, scaleOnFocus = false }: { children: ReactNode; disabled: boolean; scaleOnFocus?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });

  return (
    <motion.div
      ref={ref}
      initial={disabled ? false : { opacity: 0.2, scale: scaleOnFocus ? 0.85 : 1 }}
      animate={{
        opacity: disabled || inView ? 1 : 0.2,
        scale: disabled || inView ? 1 : (scaleOnFocus ? 0.85 : 1)
      }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", flexGrow: 1, width: "100%", flexDirection: "column", justifyContent: "center" }}
    >
      {children}
    </motion.div>
  );
}


/** End-of-track dwell as a fraction of the main scrub: the timeline is a 1s
    translation tween + a PAUSE-long empty tween, so translation occupies
    1/(1+PAUSE) of total progress and the pin lasts distance*(1+PAUSE) px —
    scroll pixels map 1:1 to translated pixels at every viewport size. */
const PAUSE = 0.1;
const TRANSLATION_RATIO = 1 / (1 + PAUSE);

export function UseCasesNarrative() {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const orb = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useGSAP(
    () => {
      if (reduce === true || !track.current || !wrap.current) return;

      // Function-based so invalidateOnRefresh re-measures after resizes and
      // late layout shifts (font swap, SVG load) instead of pinning stale.
      const distance = () => (track.current?.scrollWidth ?? 0) - window.innerWidth;
      if (distance() <= 0) return;

      // Recomputed on every ScrollTrigger refresh (initial + window resize +
      // the "load" autoRefreshEvent) so slide positions measured before late
      // layout shifts (font swap, SVG diagram sizing) settle don't stick
      // around as stale/collapsed progress values.
      const computeSnapPoints = () => {
        if (!track.current) return;
        const slides = Array.from(track.current.querySelectorAll('.snap-slide')) as HTMLElement[];
        const currentX = Number(gsap.getProperty(track.current, "x")) || 0;
        const snapPoints = slides.map(slide => {
          const rect = slide.getBoundingClientRect();
          const leftAtZero = rect.left - currentX;
          const targetX = leftAtZero - (window.innerWidth - rect.width) / 2;
          const clamped = Math.min(Math.max(targetX, 0), distance());
          return (clamped / distance()) * TRANSLATION_RATIO;
        });
        snapPoints.push(0);
        // Deliberately no push(1): progress 1 is the end-of-dwell pin
        // boundary (the PAUSE tween above), not a visible slide — treating
        // it as its own paging stop meant one gesture landed on the
        // invisible dwell (no visual change) and a second was needed to
        // actually reach the next section. Leaving it out lets the last
        // real slide's stop page straight through the dwell to whatever
        // comes next.
        // SectionPaging reads this off the ancestor Box with id="use-cases"
        // (routes/index.tsx), not this component's own root.
        const ucRoot = wrap.current?.closest("#use-cases") ?? wrap.current;
        (ucRoot as any)._ucProgressPoints = [...new Set(snapPoints)].sort((a, b) => a - b);
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${String(distance() * (1 + PAUSE))}`,
          pin: true,
          scrub: SCROLL_SPEED,
          id: "uc-pin",
          invalidateOnRefresh: true,
          onRefresh: computeSnapPoints,
        },
      });

      tl.to(track.current, {
        x: () => -distance(),
        ease: "none",
        duration: 1
      });

      if (orb.current) {
        tl.to(orb.current, {
          x: () => (track.current?.scrollWidth ?? 0) - 100,
          ease: "none",
          duration: 1
        }, 0); // start at the same time
      }

      // Add a slight pause at the end
      tl.to({}, { duration: PAUSE });

      computeSnapPoints();
    },
    { scope: wrap, dependencies: [reduce] },
  );

  // Under reduced motion the pinned horizontal scrub never runs, so the
  // slides stack vertically instead of hiding beyond the overflow edge.
  const vertical = reduce === true;

  return (
    <Box
      ref={wrap}
      component="section"
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: NOIR.void,
        color: NOIR.ink,
      }}
    >
      <Box
        ref={track}
        sx={{
          display: "flex",
          flexDirection: vertical ? "column" : "row",
          height: vertical ? "auto" : "100dvh",
          alignItems: vertical ? "stretch" : "center",
          width: vertical ? "auto" : "max-content", // horizontal scrolling track
          px: { xs: 3, md: 12 },
          // Trailing room so the LAST slide can translate to viewport center
          // (slides are 85vw/50vw wide → half the remaining width).
          pr: vertical ? undefined : { xs: "7.5vw", md: "25vw" },
          py: vertical ? { xs: 6, md: 10 } : 0,
          // Promote the scrubbed track to its own compositor layer.
          willChange: vertical ? undefined : "transform",
        }}
      >
        <Stack
          direction={vertical ? "column" : "row"}
          spacing={vertical ? 6 : 12}
          alignItems="stretch"
          sx={{ position: "relative", maxWidth: vertical ? 760 : "none", mx: vertical ? "auto" : 0 }}
        >
          {/* Horizontal Eye Guide (momentum transfer) */}
          {vertical ? null : (
            <Box
              sx={{
                position: "absolute",
                left: 0,
                // Extends past the Stack's own right edge by the same
                // trailing amount as the track's `pr`, so the line reaches
                // all the way to where the last slide centers instead of
                // stopping at the last slide's un-centered right edge.
                width: { xs: "calc(100% + 7.5vw)", md: "calc(100% + 25vw)" },
                bottom: -40,
                height: 2,
                bgcolor: NOIR.hairline,
                pointerEvents: "none",
              }}
            >
              <Box
                ref={orb}
                sx={{
                  position: "absolute",
                  top: -4,
                  left: 0,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: NOIR.gold,
                }}
              />
            </Box>
          )}

          {/* Intro Slide */}
          <Box className="snap-slide" sx={{ width: vertical ? 1 : { xs: "80vw", md: "36vw" }, display: 'flex' }}>
            <SlideFade disabled={vertical}>
              <Typography variant="overline" color="primary">
                In Practice
              </Typography>
              <Typography variant="h2" sx={{ mt: 2 }}>
                Real-World
                <br />
                Applications
              </Typography>
              <Typography variant="body1" sx={{ mt: 3, opacity: 0.8 }}>
                R&D, translated to impact across global markets.
              </Typography>
            </SlideFade>
          </Box>

          {/* Use Case Slides */}
          {CONTENT.useCases.map((uc, index) => {
            const Diagram = DIAGRAMS[uc.id];
            return (
              <Box key={uc.id} className="snap-slide" sx={{ width: vertical ? 1 : { xs: "85vw", md: "50vw" }, display: 'flex' }}>
                <SlideFade disabled={vertical} scaleOnFocus>
                  <Box
                    sx={{
                      p: { xs: 4, md: 5 },
                      border: 1,
                      borderColor: NOIR.hairline,
                      borderRadius: 3,
                      bgcolor: `rgba(${NOIR.navyFieldRgb}, 0.04)`,
                      height: { xs: 500, md: 720 },
                      maxHeight: "90vh",
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      width: '100%',
                      boxShadow: '0 24px 48px -12px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Typography variant="overline" color="primary" sx={{ display: "block" }}>
                      0{index + 1} — {uc.tag}
                    </Typography>
                    {/* L0: the title carries the slide, so it reads at display
                        weight rather than sharing the stage with the body. */}
                    <Typography
                      variant="h3"
                      sx={{
                        mt: 1.5,
                        fontSize: { xs: "1.5rem", md: "2.1rem" },
                        fontWeight: 800,
                        lineHeight: 1.12,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {uc.title}
                    </Typography>
                    {/* L1: the `stats` rail was already in content.ts and had
                        never been rendered — it is the evidence line. */}
                    <Stack
                      direction="row"
                      spacing={1.5}
                      justifyContent="center"
                      useFlexGap
                      flexWrap="wrap"
                      sx={{ mt: 1.5 }}
                    >
                      {uc.stats.map((stat) => (
                        <Typography
                          key={stat}
                          sx={{
                            fontFamily: MONO,
                            fontSize: "0.65rem",
                            letterSpacing: "0.14em",
                            color: NOIR.goldDark,
                            fontWeight: 600,
                          }}
                        >
                          {stat}
                        </Typography>
                      ))}
                    </Stack>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, maxWidth: "58ch", mx: 'auto' }}>
                      {uc.line}
                    </Typography>
                    {Diagram ? (
                      <Box sx={{ mt: 2, flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        <Box sx={{ width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'center' }}>
                          <Diagram />
                        </Box>
                      </Box>
                    ) : <Box sx={{ flexGrow: 1 }} />}
                  </Box>
                </SlideFade>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
