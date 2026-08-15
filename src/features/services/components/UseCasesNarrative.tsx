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
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { SignalDiagram } from "@/shared/components/diagrams/SignalDiagram";
import { PipelineDiagram } from "@/shared/components/diagrams/PipelineDiagram";
import { FollowTheSunDiagram } from "@/shared/components/diagrams/FollowTheSunDiagram";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";

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

  useGSAP(
    () => {
      if (reduce === true || !track.current || !wrap.current) return;

      const distance = () => (track.current?.scrollWidth ?? 0) - window.innerWidth;
      if (distance() <= 0) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${String(distance() * (1 + PAUSE))}`,
          pin: true,
          scrub: SCROLL_SPEED,
          invalidateOnRefresh: true,
        },
      });

      tl.to(track.current, {
        x: () => -distance(),
        ease: "none",
        duration: 1,
      });

      // Add a slight pause at the end
      tl.to({}, { duration: PAUSE });
    },
    { scope: wrap, dependencies: [reduce] },
  );

  const vertical = reduce === true;

  return (
    <Box
      ref={wrap}
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
          px: { xs: 3, md: 10 },
          pr: vertical ? undefined : { xs: "7.5vw", md: "20vw" },
          py: vertical ? { xs: 6, md: 10 } : 0,
          willChange: vertical ? undefined : "transform",
        }}
      >
        <Stack
          direction={vertical ? "column" : "row"}
          spacing={vertical ? 6 : 10}
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
