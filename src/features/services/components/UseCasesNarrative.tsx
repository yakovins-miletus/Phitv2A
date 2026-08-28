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
import { sectionOrder } from "@/shared/sections";
import { CONTENT } from "@/shared/content";
import { NOIR } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { SignalDiagram } from "@/shared/components/diagrams/SignalDiagram";
import { PipelineDiagram } from "@/shared/components/diagrams/PipelineDiagram";
import { FollowTheSunDiagram } from "@/shared/components/diagrams/FollowTheSunDiagram";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";
import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { useNavbarAnchor } from "@/shared/components/navbarHooks";

gsap.registerPlugin(ScrollTrigger);

const DIAGRAMS: Record<string, ComponentType> = {
  "uc-1": SignalDiagram,
  "uc-2": PipelineDiagram,
  "uc-3": FollowTheSunDiagram,
};



/** Card emerge & center focus wrapper: emerges from bottom and smoothly settles */
function CardEmerge({ children, disabled }: { children: ReactNode; disabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });

  return (
    <motion.div
      ref={ref}
      initial={disabled ? false : { opacity: 0.4, y: 40, scale: 0.94 }}
      animate={{
        opacity: disabled || inView ? 1 : 0.4,
        y: disabled || inView ? 0 : 40,
        scale: disabled || inView ? 1 : 0.94,
      }}
      transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
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
const PAUSE = 0.25;

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
       * end — computed via pure offsetLeft to remain completely unaffected by transforms.
       */
      const centres = () => {
        const trackEl = track.current;
        if (!trackEl) return { start: 0, end: 0, travel: 0 };
        const slides = trackEl.querySelectorAll<HTMLElement>(".snap-slide");
        const first = slides[0];
        const last = slides[slides.length - 1];
        if (!first || !last) return { start: 0, end: 0, travel: 0 };
        
        const half = window.innerWidth / 2;
        const firstCentre = first.offsetLeft + first.offsetWidth / 2;
        const lastCentre = last.offsetLeft + last.offsetWidth / 2;
        
        const start = half - firstCentre;
        const end = half - lastCentre;
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
          refreshPriority: refreshPriorityFor(sectionOrder("use-cases")),
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

      // Dwell at the final centered card before unpinning
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
          px: { xs: 3, md: 8 },
          pr: vertical ? undefined : { xs: 6, md: 16 },
          py: vertical ? { xs: 6, md: 10 } : 0,
          willChange: vertical ? undefined : "transform",
        }}
      >
        <Stack
          direction={vertical ? "column" : "row"}
          spacing={vertical ? 8 : { md: 10, lg: 14 }}
          alignItems="stretch"
          sx={{ position: "relative", maxWidth: vertical ? 760 : "none", mx: vertical ? "auto" : 0 }}
        >
          {/* Use Case Slides */}
          {CONTENT.useCases.map((uc) => {
            const Diagram = DIAGRAMS[uc.id];

            // Bespoke luxury Swiss editorial layout for Use Cases 01, 02, and 03
            const BESPOKE_SPECS: Record<
              string,
              {
                caseTag: string;
                specs: Array<{ num: string; name: string }>;
                consoleTag: string;
                busTag: string;
              }
            > = {
              "uc-1": {
                caseTag: "CASE 01 // QUANTITATIVE R&D",
                specs: [
                  { num: "01", name: "High-Frequency Market Sampling" },
                  { num: "02", name: "Multi-Factor Noise Filtering" },
                  { num: "03", name: "Out-of-Sample Alpha Validation" },
                ],
                consoleTag: "SIGNAL EXTRACTION",
                busTag: "L2 FEED",
              },
              "uc-2": {
                caseTag: "CASE 02 // DISTRIBUTED SYSTEMS",
                specs: [
                  { num: "01", name: "Multi-Region Ingestion Mesh" },
                  { num: "02", name: "Zero-Loss Event Stream Normalization" },
                  { num: "03", name: "Sub-Millisecond Dissemination" },
                ],
                consoleTag: "EVENT STREAM PIPELINE",
                busTag: "LIVE BUS",
              },
              "uc-3": {
                caseTag: "CASE 03 // TECHNICAL OPERATIONS",
                specs: [
                  { num: "01", name: "24/7 Live Monitoring" },
                  { num: "02", name: "Daily Shift Handover" },
                  { num: "03", name: "Automated System Recovery" },
                ],
                consoleTag: "GLOBAL OPERATIONS",
                busTag: "24/7 LIVE",
              },
            };

            const bespoke = BESPOKE_SPECS[uc.id];

            if (bespoke) {
              return (
                <Box
                  key={uc.id}
                  className="snap-slide"
                  sx={{
                    width: vertical ? 1 : { xs: "90vw", sm: "85vw", md: "76vw", lg: "70vw" },
                    maxWidth: vertical ? "none" : 1100,
                    display: "flex",
                  }}
                >
                  <CardEmerge disabled={vertical}>
                    {/* Outer Bezel */}
                    <Box
                      sx={{
                        p: "1px",
                        borderRadius: { xs: "24px", md: "32px" },
                        background:
                          "linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(10, 42, 102, 0.14) 45%, rgba(255, 199, 44, 0.25) 100%)",
                        boxShadow:
                          "0 24px 48px -12px rgba(10, 42, 102, 0.12), 0 8px 24px -4px rgba(10, 42, 102, 0.06)",
                        width: "100%",
                        overflow: "hidden",
                      }}
                    >
                      {/* Inner Surface */}
                      <Box
                        sx={{
                          p: { xs: 3.5, sm: 4.5, md: 6 },
                          borderRadius: { xs: "23px", md: "31px" },
                          background:
                            "linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(244, 247, 252, 0.9) 100%)",
                          backdropFilter: "var(--glass-filter)",
                          WebkitBackdropFilter: "var(--glass-filter)",
                          boxShadow:
                            "inset 0 1px 1px rgba(255, 255, 255, 0.9), inset 0 -1px 2px rgba(10, 42, 102, 0.03)",
                          minHeight: { xs: 560, md: 660 },
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          width: "100%",
                        }}
                      >
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", lg: "0.85fr 1.15fr" },
                            gap: { xs: 5, md: 7 },
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          {/* Left Column: Thesis & Architectural Specs */}
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              textAlign: "left",
                              gap: 2.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 1,
                                px: 1.5,
                                py: 0.4,
                                borderRadius: "9999px",
                                border: "1px solid rgba(10, 42, 102, 0.15)",
                                bgcolor: "rgba(10, 42, 102, 0.04)",
                                width: "fit-content",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontFamily: MONO,
                                  fontSize: "0.7rem",
                                  letterSpacing: "0.15em",
                                  color: NOIR.navyField,
                                  fontWeight: 700,
                                }}
                              >
                                {bespoke.caseTag}
                              </Typography>
                            </Box>

                            <Typography
                              component="h3"
                              sx={{
                                fontFamily: DISPLAY_FONT,
                                fontSize: { xs: "1.75rem", sm: "2.1rem", md: "2.6rem" },
                                fontWeight: 800,
                                lineHeight: 1.1,
                                letterSpacing: "-0.025em",
                                color: NOIR.navyField,
                              }}
                            >
                              {uc.title}
                            </Typography>

                            <Typography
                              sx={{
                                color: "rgba(10, 42, 102, 0.78)",
                                fontSize: { xs: "0.95rem", md: "1.08rem" },
                                lineHeight: 1.6,
                                pr: { md: 2 },
                              }}
                            >
                              {uc.line}
                            </Typography>

                            {/* System Capabilities List */}
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                pt: 2,
                                borderTop: "1px solid rgba(10, 42, 102, 0.1)",
                                gap: 1.5,
                              }}
                            >
                              {bespoke.specs.map((spec) => (
                                <Box
                                  key={spec.num}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontFamily: MONO,
                                      fontSize: "0.72rem",
                                      color: NOIR.gold,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {spec.num}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontSize: "0.92rem",
                                      fontWeight: 600,
                                      color: NOIR.navyField,
                                    }}
                                  >
                                    {spec.name}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>

                          {/* Right Column: High-Contrast Quantitative Telemetry Console (Enlarged) */}
                          <Box
                            sx={{
                              p: { xs: 3, sm: 3.5, md: 4.5 },
                              borderRadius: "1.75rem",
                              bgcolor: NOIR.navyDeep,
                              border: "1px solid rgba(255, 199, 44, 0.28)",
                              boxShadow:
                                "0 24px 50px -10px rgba(6, 24, 59, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.12)",
                              display: "flex",
                              flexDirection: "column",
                              gap: 2.5,
                              overflow: "hidden",
                              width: "100%",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                pb: 1.5,
                                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    bgcolor: NOIR.gold,
                                    boxShadow: `0 0 8px ${NOIR.gold}`,
                                  }}
                                />
                                <Typography
                                  sx={{
                                    fontFamily: MONO,
                                    fontSize: "0.75rem",
                                    letterSpacing: "0.18em",
                                    color: "rgba(255, 255, 255, 0.75)",
                                    textTransform: "uppercase",
                                    fontWeight: 600,
                                  }}
                                >
                                  {bespoke.consoleTag}
                                </Typography>
                              </Box>
                              <Typography
                                sx={{
                                  fontFamily: MONO,
                                  fontSize: "0.72rem",
                                  letterSpacing: "0.14em",
                                  color: NOIR.gold,
                                  fontWeight: 700,
                                }}
                              >
                                {bespoke.busTag}
                              </Typography>
                            </Box>

                            {/* Diagram */}
                            {Diagram && <Diagram />}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </CardEmerge>
                </Box>
              );
            }

            // Default rendering for Use Case 03 (untouched)
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
                                color: NOIR.gold,
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
