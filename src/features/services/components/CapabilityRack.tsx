import { useCallback, useId, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { AnimatePresence, motion } from "motion/react";
import MemoryIcon from "@mui/icons-material/Memory";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import StorageIcon from "@mui/icons-material/Storage";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { CONTENT } from "@/shared/content";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";
import { SectionLede } from "@/shared/components/SectionLede";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { startLenis, stopLenis } from "@/shared/components/SmoothScroll";
import { ServiceDrawer, ServiceVector } from "./ServiceDrawer";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";

const SERVICE_ICONS = [MemoryIcon, QueryStatsIcon, StorageIcon, SettingsSuggestIcon];


/** The four capabilities as one stage instead of four near-identical ones.
 *
 *  Each row shows only its L0 gunshot at rest. Opening a row reveals the L1
 *  tracer and that service's vector; the "Read the full brief" control opens
 *  ServiceDrawer with the L2 `details` copy. Under reduced motion every row
 *  renders expanded with no tween, so the same content is reachable without
 *  interaction. */
export function CapabilityRack() {
  const reduced = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [drawerServiceId, setDrawerServiceId] = useState<string | null>(null);
  const baseId = useId();

  const openDrawer = useCallback((serviceId: string) => {
    stopLenis();
    setDrawerServiceId(serviceId);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerServiceId(null);
    startLenis();
  }, []);

  return (
    <StageSection section={homeSection("services")}>
      <SectionLede
        gunshot={CONTENT.ledes.services.gunshot}
        tracer={CONTENT.ledes.services.tracer}
        eyebrow="Capabilities"
      />

      <Stack sx={{ mt: { xs: 2, md: 4 }, borderTop: 1, borderColor: "divider" }}>
        {CONTENT.services.map((service, index) => {
          const Icon = SERVICE_ICONS[index] ?? MemoryIcon;
          // Reduced motion has no expand affordance, so every row reads as open.
          const expanded = reduced === true || openIndex === index;
          const panelId = `${baseId}-panel-${service.id}`;

          return (
            <Box key={service.id} sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Box
                component="button"
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => {
                  setOpenIndex((current) => (current === index ? null : index));
                }}
                sx={{
                  all: "unset",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 2, md: 3 },
                  width: "100%",
                  cursor: "pointer",
                  py: { xs: 2.5, md: 3 },
                  transition: "background-color 0.3s ease",
                  "&:hover": { bgcolor: alpha(NOIR.navyField, 0.03) },
                  "&:focus-visible": {
                    outline: `2px solid ${NOIR.gold}`,
                    outlineOffset: "-2px",
                  },
                }}
              >
                <Typography
                  aria-hidden
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.72rem",
                    letterSpacing: "0.16em",
                    color: "text.secondary",
                    flexShrink: 0,
                  }}
                >
                  0{index + 1}
                </Typography>

                <Icon
                  aria-hidden
                  sx={{
                    fontSize: 26,
                    flexShrink: 0,
                    color: expanded ? NOIR.gold : "text.secondary",
                    transition: "color 0.3s ease",
                    display: { xs: "none", sm: "block" },
                  }}
                />

                <Typography
                  component="span"
                  sx={{
                    flexGrow: 1,
                    fontSize: { xs: "1.05rem", sm: "1.35rem", md: "1.6rem" },
                    fontWeight: 700,
                    lineHeight: 1.25,
                    letterSpacing: "-0.015em",
                    color: "text.primary",
                  }}
                >
                  {service.gunshot}
                </Typography>

                <Typography
                  component="span"
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.7rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    display: { xs: "none", md: "block" },
                  }}
                >
                  {service.title}
                </Typography>

                {/* The rotation lives on the inner glyph, not on this box:
                    rotating a 24px box widens its bounding rect to ~34px and
                    pushed the row a few pixels past the container. */}
                <Box
                  aria-hidden
                  sx={{
                    flexShrink: 0,
                    width: 24,
                    height: 24,
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                    fontSize: "1.2rem",
                    lineHeight: 1,
                    color: expanded ? NOIR.gold : "text.secondary",
                    transition: "color 0.3s ease",
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      display: "block",
                      transform: expanded ? "rotate(45deg)" : "none",
                      transition: reduced === true ? "none" : "transform 0.35s ease",
                    }}
                  >
                    +
                  </Box>
                </Box>
              </Box>

              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.div
                    id={panelId}
                    initial={reduced === true ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                    style={{ overflow: "hidden" }}
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={{ xs: 3, md: 6 }}
                      alignItems={{ xs: "flex-start", md: "center" }}
                      sx={{ pb: { xs: 3, md: 4 }, pl: { xs: 0, sm: 7 } }}
                    >
                      <Stack spacing={2.5} sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: { xs: "0.95rem", md: "1.05rem" },
                            lineHeight: 1.7,
                            color: "text.secondary",
                            maxWidth: "58ch",
                          }}
                        >
                          {service.tracer}
                        </Typography>

                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                          {service.techStack.map((tech) => (
                            <Typography
                              key={tech}
                              sx={{
                                fontFamily: MONO,
                                fontSize: "0.68rem",
                                letterSpacing: "0.08em",
                                color: "text.secondary",
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 1,
                                px: 1,
                                py: 0.25,
                              }}
                            >
                              {tech}
                            </Typography>
                          ))}
                        </Stack>

                        <Box
                          component="button"
                          type="button"
                          onClick={() => {
                            openDrawer(service.id);
                          }}
                          sx={{
                            all: "unset",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1,
                            cursor: "pointer",
                            fontFamily: MONO,
                            fontSize: "0.76rem",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            color: "primary.main",
                            "&:hover": { color: NOIR.goldDark },
                            "&:focus-visible": {
                              outline: `2px solid ${NOIR.gold}`,
                              outlineOffset: "3px",
                            },
                          }}
                        >
                          Read the full brief
                          <ArrowForwardIcon sx={{ fontSize: 16 }} />
                        </Box>
                      </Stack>

                      <Box
                        aria-hidden
                        sx={{
                          width: { xs: "100%", md: 340 },
                          height: { xs: 200, md: 240 },
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ServiceVector id={service.id} />
                      </Box>
                    </Stack>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </Box>
          );
        })}
      </Stack>

      <ServiceDrawer
        open={drawerServiceId !== null}
        serviceId={drawerServiceId}
        onClose={closeDrawer}
      />
    </StageSection>
  );
}
