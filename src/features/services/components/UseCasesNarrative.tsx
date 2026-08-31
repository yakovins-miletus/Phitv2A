import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

import { useReducedMotion } from "@/shared/motion";
import { CONTENT } from "@/shared/content";
import { NOIR } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";
import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { useNavbarAnchor } from "@/shared/components/navbarHooks";
import { UseCaseBackdrop } from "./UseCaseBackdrop";

/**
 * Light entrance rise for a block's copy — purely decorative. Scroll-driven (not
 * IntersectionObserver) with an unconditional failsafe, so the copy is *never*
 * stranded hidden: worst case it reveals after 1.2s regardless. Disabled
 * entirely under reduced motion — DOM default is the lit state.
 */
function BlockReveal({ children, disabled }: { children: ReactNode; disabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(disabled);

  useEffect(() => {
    if (disabled) return;
    let raf = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (raf) window.cancelAnimationFrame(raf);
      window.clearTimeout(failsafe);
      setShown(true);
    };
    const loop = () => {
      const el = ref.current;
      if (el && el.getBoundingClientRect().top < window.innerHeight * 0.85) {
        finish();
        return;
      }
      raf = window.requestAnimationFrame(loop);
    };
    // Unconditional failsafe: the copy is never left stranded hidden.
    const failsafe = window.setTimeout(finish, 1200);
    raf = window.requestAnimationFrame(loop);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.clearTimeout(failsafe);
    };
  }, [disabled]);

  return (
    <div
      ref={ref}
      style={
        disabled
          ? undefined
          : {
              opacity: shown ? 1 : 0,
              transform: shown ? "none" : "translateY(28px)",
              transition: `opacity 0.55s ${EASE_OUT_EXPO_CSS}, transform 0.55s ${EASE_OUT_EXPO_CSS}`,
              willChange: shown ? undefined : "transform, opacity",
            }
      }
    >
      {children}
    </div>
  );
}

export function UseCasesNarrative() {
  const reduce = useReducedMotion();
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.HOME_USE_CASES, { dark: false });
  const blockRefs = useRef<(HTMLElement | null)[]>([]);

  const cases = CONTENT.useCases;
  const disabled = reduce === true;

  return (
    <Box
      ref={anchorRef}
      component="section"
      sx={{
        /**
         * Full-bleed breakout — the `use-cases` beat is no longer `bare`, so its
         * children now render inside SectionBeat's `<Container maxWidth="xl">`.
         * Same idiom as `ProcessSection.tsx`: `left: 50%` resolves against the
         * Container's width (whose centre is the viewport centre), and
         * `translateX(-50%)` resolves against this box's own 100vw, so the two
         * offsets cancel to the true viewport edge regardless of the Container's
         * maxWidth or padding. The transform makes this a containing block —
         * harmless for `position: sticky` (only `fixed` descendants care).
         */
        position: "relative",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100vw",
        // NEVER `overflow: hidden` here — it would clip `position: sticky` on the
        // backdrop. The backdrop clips itself.
        isolation: "isolate",
        color: NOIR.ink,
      }}
    >
      <UseCaseBackdrop items={cases} blockRefs={blockRefs} />

      <Box sx={{ position: "relative", zIndex: 2 }}>
        {cases.map((uc, i) => {
          const first = i === 0;
          const last = i === cases.length - 1;
          return (
            <Box
              key={uc.id}
              component="article"
              className="uc-block"
              data-uc={uc.id}
              ref={(el: HTMLElement | null) => {
                blockRefs.current[i] = el;
              }}
              sx={{
                minHeight: { xs: "auto", md: "90svh" },
                display: "flex",
                alignItems: "center",
                justifyContent: uc.side === "left" ? "flex-start" : "flex-end",
                px: { xs: 3, sm: 5, md: 10 },
                pt: first ? { xs: 6, md: 12 } : { xs: 8, md: 0 },
                pb: last ? { xs: 10, md: 16 } : { xs: 8, md: 0 },
              }}
            >
              <BlockReveal disabled={disabled}>
                <Box sx={{ maxWidth: 640, textAlign: "left" }}>
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: "0.7rem",
                      letterSpacing: "0.15em",
                      color: NOIR.navyField,
                      fontWeight: 700,
                      mb: 2,
                    }}
                  >
                    {uc.caseTag}
                  </Typography>

                  <Typography
                    component="h3"
                    sx={{
                      fontFamily: DISPLAY_FONT,
                      fontSize: { xs: "1.9rem", sm: "2.3rem", md: "2.9rem" },
                      fontWeight: 800,
                      lineHeight: 1.08,
                      letterSpacing: "-0.025em",
                      color: NOIR.navyField,
                    }}
                  >
                    {uc.title}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 2,
                      color: "rgba(10, 42, 102, 0.82)",
                      fontSize: { xs: "1rem", md: "1.12rem" },
                      lineHeight: 1.6,
                    }}
                  >
                    {uc.line}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1.25}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ mt: 2.5 }}
                  >
                    {uc.stats.map((stat) => (
                      <Box
                        key={stat}
                        sx={{
                          px: 1.25,
                          py: 0.35,
                          borderRadius: "6px",
                          bgcolor: "rgba(255, 199, 44, 0.14)",
                          border: "1px solid rgba(229, 178, 40, 0.3)",
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

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      mt: 3,
                      pt: 2.5,
                      borderTop: "1px solid rgba(10, 42, 102, 0.14)",
                    }}
                  >
                    {uc.specs.map((spec) => (
                      <Box key={spec.num} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
                          sx={{ fontSize: "0.95rem", fontWeight: 600, color: NOIR.navyField }}
                        >
                          {spec.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </BlockReveal>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
