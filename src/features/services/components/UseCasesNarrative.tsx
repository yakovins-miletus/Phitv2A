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
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";
import { CONTENT } from "@/shared/content";
import { NOIR } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { SignalDiagram } from "@/shared/components/diagrams/SignalDiagram";
import { PipelineDiagram } from "@/shared/components/diagrams/PipelineDiagram";
import { FollowTheSunDiagram } from "@/shared/components/diagrams/FollowTheSunDiagram";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";
import { useNavbarAnchor, NAV_ANCHORS } from "@/shared/components/NavbarContext";

gsap.registerPlugin(ScrollTrigger);

const DIAGRAMS: Record<string, ComponentType> = {
  "uc-1": SignalDiagram,
  "uc-2": PipelineDiagram,
  "uc-3": FollowTheSunDiagram,
};



/** Card emerge & center focus wrapper: emerges from bottom and scales up when centered */
function CardEmerge({ children, disabled }: { children: ReactNode; disabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });

  return (
    <motion.div
      ref={ref}
      initial={disabled ? false : { opacity: 0.35, y: 60, scale: 0.88 }}
      animate={{
        opacity: disabled || inView ? 1 : 0.35,
        y: disabled || inView ? 0 : 60,
        scale: disabled || inView ? 1.02 : 0.88,
      }}
      transition={{ duration: 0.75, ease: EASE_OUT_EXPO }}
      style={{
        display: "flex",
        flexGrow: 1,
        width: "100%",
        flexDirection: "column",
        justifyContent: "center",
        transformOrigin: "center center",
        willChange: disabled ? undefined : "transform, opacity",
      }}
    >
      {children}
    </motion.div>
  );
}

/** End-of-track dwell as a fraction of the main scrub */
const PAUSE = 0.1;

export function UseCasesNarrative() {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.HOME_USE_CASES, { dark: false });

  useGSAP(
    () => {
      if (reduce === true || !track.current || !wrap.current) return;

      /**
       * The two `x` values that put the FIRST card's centre on the viewport's
       * centre at the start of the pin, and the LAST card's centre there at the
       * end — measured from the DOM rather than assumed from vw math.
       *
       * The travel used to be `scrollWidth - innerWidth`, which moves the track
       * until its own right edge (including the `pr` trailing pad) is flush with
       * the viewport's right edge. That only centres the last card if `pr`
       * happens to equal exactly half the viewport width minus half the card
       * width, which silently drifted true whenever the cards' width, count, or
       * the `Stack` gap changed. Measuring `.snap-slide` positions directly
       * makes both ends self-correct for any future width/gap/count change, and
       * removes the need for `px`/`pr` to be load-bearing — they now only have
       * to be "wide enough," not exact.
       *
       * Deliberately expressed as a tween on `x`, NOT as leading padding: a
       * measured `paddingLeft` changes the track's own layout, so the very
       * measurement that produced it shifts on the next read and the correction
       * compounds — that inflated the pin's `end` (and with it the pin-spacer)
       * by ~2000px, leaving a long blank stretch after the cards had scrolled
       * past. `x` moves the track without touching layout, so every measurement
       * below is taken against a geometry that never moves.
       *
       * `getBoundingClientRect`, not `offsetLeft`: MUI's `Stack` and `Box` don't
       * reliably share an `offsetParent` with `track.current` (that depends on
       * which ancestor has `position` set). Taking BOTH rects in the same call
       * and subtracting also cancels whatever `x` is currently applied, so these
       * stay correct when ScrollTrigger re-measures mid-scroll on refresh —
       * which a viewport-relative read would not.
       */
      const centres = () => {
        const trackEl = track.current;
        if (!trackEl) return { start: 0, end: 0, travel: 0 };
        const slides = trackEl.querySelectorAll<HTMLElement>(".snap-slide");
        const first = slides[0];
        const last = slides[slides.length - 1];
        if (!first || !last) return { start: 0, end: 0, travel: 0 };
        const trackRect = trackEl.getBoundingClientRect();
        const centreFromTrackLeft = (el: HTMLElement) => {
          const r = el.getBoundingClientRect();
          return r.left - trackRect.left + r.width / 2;
        };
        const half = window.innerWidth / 2;
        const start = half - centreFromTrackLeft(first);
        const end = half - centreFromTrackLeft(last);
        // Travel reduces to `lastCentre - firstCentre` — the distance between
        // the outer two cards, independent of viewport width and of both pads.
        return { start, end, travel: start - end };
      };
      if (centres().travel <= 0) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${String(centres().travel * (1 + PAUSE))}`,
          pin: true,
          scrub: SCROLL_SPEED,
          invalidateOnRefresh: true,
          // Page-order refresh priority. ScrollTrigger refreshes the HIGHEST
          // `refreshPriority` first (see beatThresholds.ts for the sort math),
          // and `refreshPriorityFor` maps page order onto a descending positive
          // scale — so a smaller `order` refreshes earlier. This pin sits at
          // page position 5 (Capabilities=4, Process=6 — this is the gap
          // between them) and its spacer shifts everything below it, so it
          // must resolve before those sections measure. Matches the `order`
          // passed to the `SectionBeat` that now wraps this component in
          // `bare` mode — see routes/index.tsx.
          refreshPriority: refreshPriorityFor(5),
        },
      });

      tl.fromTo(
        track.current,
        { x: () => centres().start },
        {
          x: () => centres().end,
          ease: "none",
          duration: 1,
        },
      );

      // Add a slight pause at the end
      tl.to({}, { duration: PAUSE });
    },
    { scope: wrap, dependencies: [reduce] },
  );

  const vertical = reduce === true;

  return (
    <Box
      ref={(el: HTMLDivElement | null) => {
        wrap.current = el;
        if (anchorRef) anchorRef.current = el;
      }}
      component="section"
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: "transparent",
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
          width: vertical ? "auto" : "max-content",
          // Purely cosmetic breathing room on both ends now — `centres()` above
          // measures the first and last cards directly and drives the track
          // with `x`, so neither pad is load-bearing for centring and neither
          // has to be tuned to any card-width/gap arithmetic. Do NOT reintroduce
          // a measured leading pad here: changing layout to centre a card makes
          // the next measurement of that same card move (see `centres()`).
          px: { xs: 3, md: 10 },
          pr: vertical ? undefined : { xs: 3, md: 10 },
          py: vertical ? { xs: 6, md: 10 } : 0,
          willChange: vertical ? undefined : "transform",
        }}
      >
        <Stack
          direction={vertical ? "column" : "row"}
          spacing={vertical ? 8 : { md: 12, lg: 16 }}
          alignItems="stretch"
          sx={{ position: "relative", maxWidth: vertical ? 760 : "none", mx: vertical ? "auto" : 0 }}
        >


          {/* Use Case Slides */}
          {CONTENT.useCases.map((uc, index) => {
            const Diagram = DIAGRAMS[uc.id];
            return (
              <Box
                key={uc.id}
                className="snap-slide"
                sx={{ width: vertical ? 1 : { xs: "85vw", md: "54vw" }, display: "flex" }}
              >
                <CardEmerge disabled={vertical}>
                  {/* Outer Bezel */}
                  <Box
                    sx={{
                      p: "1px",
                      borderRadius: { xs: "24px", md: "32px" },
                      background:
                        "linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(10, 42, 102, 0.12) 45%, rgba(255, 199, 44, 0.2) 100%)",
                      boxShadow:
                        "0 24px 48px -12px rgba(10, 42, 102, 0.08), 0 8px 24px -4px rgba(10, 42, 102, 0.04)",
                      width: "100%",
                      overflow: "hidden",
                    }}
                  >
                    {/* Inner Surface */}
                    <Box
                      sx={{
                        p: { xs: 3.5, md: 5 },
                        borderRadius: { xs: "23px", md: "31px" },
                        background:
                          "linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(244, 247, 252, 0.85) 100%)",
                        backdropFilter: "var(--glass-filter)",
                        WebkitBackdropFilter: "var(--glass-filter)",
                        boxShadow:
                          "inset 0 1px 1px rgba(255, 255, 255, 0.9), inset 0 -1px 2px rgba(10, 42, 102, 0.03)",
                        height: { xs: "auto", md: 700 },
                        minHeight: { xs: 500, md: 660 },
                        maxHeight: { md: "85vh" },
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        width: "100%",
                      }}
                    >
                      {/* Overline Tag Badge */}
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          px: 1.75,
                          py: 0.5,
                          borderRadius: "100px",
                          bgcolor: "rgba(10, 42, 102, 0.05)",
                          border: "1px solid rgba(10, 42, 102, 0.08)",
                          mb: 1.5,
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: MONO,
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: NOIR.navyField,
                            textTransform: "uppercase",
                          }}
                        >
                          0{index + 1} — {uc.tag}
                        </Typography>
                      </Box>

                      {/* Title */}
                      <Typography
                        variant="h3"
                        sx={{
                          fontFamily: DISPLAY_FONT,
                          fontSize: { xs: "1.5rem", md: "2.1rem" },
                          fontWeight: 800,
                          lineHeight: 1.15,
                          letterSpacing: "-0.025em",
                          color: NOIR.navyField,
                        }}
                      >
                        {uc.title}
                      </Typography>

                      {/* Evidence Stats Rail */}
                      <Stack
                        direction="row"
                        spacing={1.25}
                        justifyContent="center"
                        useFlexGap
                        flexWrap="wrap"
                        sx={{ mt: 1.5 }}
                      >
                        {uc.stats.map((stat) => (
                          <Box
                            key={stat}
                            sx={{
                              px: 1.25,
                              py: 0.35,
                              borderRadius: "6px",
                              bgcolor: "rgba(255, 199, 44, 0.12)",
                              border: "1px solid rgba(229, 178, 40, 0.25)",
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: MONO,
                                fontSize: "0.68rem",
                                letterSpacing: "0.12em",
                                color: NOIR.goldDark,
                                fontWeight: 700,
                              }}
                            >
                              {stat}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>

                      {/* Subtitle / Description */}
                      <Typography
                        variant="body1"
                        sx={{
                          mt: 1.5,
                          maxWidth: "56ch",
                          mx: "auto",
                          color: "rgba(10, 42, 102, 0.76)",
                          fontSize: { xs: "0.95rem", md: "1.05rem" },
                          lineHeight: 1.55,
                        }}
                      >
                        {uc.line}
                      </Typography>

                      {/* Large, Borderless Diagram */}
                      {Diagram ? (
                        <Box
                          sx={{
                            mt: 2,
                            flexGrow: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%",
                            minHeight: 0,
                          }}
                        >
                          <Diagram />
                        </Box>
                      ) : (
                        <Box sx={{ flexGrow: 1 }} />
                      )}
                    </Box>
                  </Box>
                </CardEmerge>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
