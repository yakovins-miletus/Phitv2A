import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { AnimatePresence, motion } from "motion/react";

import { CONTENT } from "@/shared/content";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";
import { useDepthLayer, usePointerSpace, useReducedMotion, type PointerSpace } from "@/shared/motion";

const GROUND = GROUNDS[homeSection("hero-position").ground ?? "panel"];

/**
 * Market position, as an orbital system you are looking into.
 *
 * ## What this replaces
 *
 * Three empty dashed rings beside a list. Nothing was in orbit, so the rings
 * read as a loading spinner, and the two halves of the section shared a grid
 * and nothing else.
 *
 * It also replaces a genuine defect. The list opened on `onHoverStart` and
 * nothing else — no click handler, no `tabIndex`, no key handler, despite
 * `cursor: pointer`. It was **unreachable by keyboard**, and on touch, where
 * hover never fires, differentiators 02 and 03 could not be opened at all: two
 * thirds of the section was unreadable on a phone.
 *
 * ## The idea
 *
 * The three differentiators *are* the bodies. Each rides its own orbit around
 * the leadership core, on rings genuinely tilted in 3D rather than drawn to
 * look tilted. Selecting one swings its orbit round until that body reaches
 * the near point of its path, closest to the viewer — the system physically
 * presents the thing you asked for.
 *
 * The reading matter stays flat and still. Text that rotates with a scene is
 * text nobody reads, so the space carries the structure and a plain column
 * carries the words.
 *
 * ## Non-negotiables
 *
 * - The control rail is real `<button>`s: Tab reaches them, Enter and Space
 *   operate them, a tap works, and all three headings stay on screen so the
 *   set is scannable rather than a mystery box.
 * - Under `md` the orbit is not rendered. It is decoration that costs layout,
 *   and a tilted ring system on a 375px screen is neither legible nor useful.
 * - Under reduced motion the geometry stays and the swinging stops.
 */

const STAGE = { perspective: 1100, tilt: 66 };

/** Each orbit's radius as an inset from the stage box, and where its body
 *  rests when the orbit is not the selected one. Spread so the three rings
 *  read as separate paths rather than as a target. */
const ORBITS = [
  { inset: 28, rest: -50 },
  { inset: 14, rest: 22 },
  { inset: 0, rest: 132 },
];

/** Ring-local angle at which a body sits closest to the viewer. The ring is
 *  tilted about X, so its near point is the bottom of the ellipse. */
const NEAR_POINT = 90;

interface Differentiator {
  heading: string;
  body: string;
}

function Orbit({
  index,
  active,
  space,
  reduced,
}: {
  index: number;
  active: boolean;
  space: PointerSpace;
  reduced: boolean;
}) {
  const orbit = ORBITS[index] ?? ORBITS[0]!;
  const spin = active ? NEAR_POINT : orbit.rest;
  // Outer orbits are further from the core, so they swing more with the camera.
  const layer = useDepthLayer(space, 0.5 + (2 - index) * 0.35);

  return (
    <motion.div
      aria-hidden="true"
      animate={{ rotateZ: reduced ? orbit.rest : spin }}
      transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
      style={{
        position: "absolute",
        inset: `${orbit.inset}%`,
        transformStyle: "preserve-3d",
        // The ring's own tilt is applied by the wrapper below so that this
        // element is free to spin about the ring's axis without fighting it.
        ...(reduced ? {} : layer),
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "1px solid",
          borderColor: active ? NOIR.goldDark : `rgba(${NOIR.navyFieldRgb}, 0.18)`,
          borderStyle: active ? "solid" : "dashed",
          transition: "border-color 500ms ease",
        }}
      />

      {/* The body. Positioned at the ring's 3 o'clock and carried round by the
          ring's spin, then counter-rotated so it always faces the reader —
          inverse transforms in reverse order, or it ends up edge-on. */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "100%",
          width: active ? 22 : 12,
          height: active ? 22 : 12,
          ml: active ? "-11px" : "-6px",
          mt: active ? "-11px" : "-6px",
          borderRadius: "50%",
          bgcolor: active ? NOIR.gold : `rgba(${NOIR.navyFieldRgb}, 0.35)`,
          boxShadow: active ? `0 0 24px rgba(${NOIR.goldRgb}, 0.7)` : "none",
          transform: `rotateZ(${String(-spin)}deg) rotateX(${String(-STAGE.tilt)}deg)`,
          transition: "width 500ms ease, height 500ms ease, background-color 500ms ease",
        }}
      />
    </motion.div>
  );
}

function OrbitStage({
  activeIndex,
  space,
  reduced,
}: {
  activeIndex: number;
  space: PointerSpace;
  reduced: boolean;
}) {
  const coreLayer = useDepthLayer(space, 0.2);

  return (
    <Box
      {...space.bind}
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 460,
        mx: "auto",
        aspectRatio: "1",
        perspective: `${STAGE.perspective}px`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* One wrapper carries the tilt for all three orbits, so they share a
          plane and read as a system rather than as three separate ellipses. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transform: `rotateX(${String(STAGE.tilt)}deg)`,
        }}
      >
        {ORBITS.map((orbit, i) => (
          <Orbit
            key={orbit.inset}
            index={i}
            active={activeIndex === i}
            space={space}
            reduced={reduced}
          />
        ))}
      </Box>

      {/* The core sits upright at the centre of the tilted system, facing the
          reader — it is the one thing here that is not in orbit.

          It carries the claim and nothing else. The supporting line used to be
          in here too and it pushed the block wider than the innermost orbit,
          so the ring cut through the text and the selected body landed on top
          of it. A nucleus has to be smaller than the smallest orbit around it;
          that line now sits beneath the whole stage where it has room. */}
      <motion.div
        style={{
          position: "absolute",
          inset: "38%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          ...(reduced ? {} : coreLayer),
        }}
      >
        <Box>
          <Typography
            variant="h3"
            component="h2"
            sx={{ lineHeight: 1.1, fontWeight: 700, color: GROUND.fg, fontSize: "1.5rem" }}
          >
            Professional
          </Typography>
          <Typography
            component="span"
            sx={{
              display: "block",
              color: NOIR.goldDark,
              fontWeight: 600,
              fontSize: "1.25rem",
              letterSpacing: "-0.02em",
            }}
          >
            Leadership
          </Typography>
        </Box>
      </motion.div>
    </Box>
  );
}

export function MarketPosition() {
  const { differentiators } = CONTENT.hero.salesPitch as {
    differentiators: readonly Differentiator[];
  };
  const [activeIndex, setActiveIndex] = useState(0);
  const space = usePointerSpace();
  const reduced = useReducedMotion() === true;
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up("md"), { noSsr: true });
  const railRef = useRef<HTMLDivElement>(null);
  const active = differentiators[activeIndex] ?? differentiators[0];

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const last = differentiators.length - 1;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? last
          : event.key === "ArrowDown"
            ? Math.min(activeIndex + 1, last)
            : Math.max(activeIndex - 1, 0);
    setActiveIndex(next);
    railRef.current?.querySelectorAll("button")[next]?.focus();
  };

  return (
    <StageSection section={homeSection("hero-position")}>
      <Box sx={{ width: "100%", position: "relative" }}>
        <Box sx={{ mb: { xs: 5, md: 8 }, textAlign: "center" }}>
          <Typography
            component="p"
            variant="overline"
            sx={{ fontFamily: MONO, color: NOIR.goldDark, display: "block" }}
          >
            Market position
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 6, md: 10 },
            alignItems: "center",
          }}
        >
          {wide ? (
            <Box>
              <OrbitStage activeIndex={activeIndex} space={space} reduced={reduced} />
              <Typography
                variant="body2"
                sx={{
                  mt: 2,
                  textAlign: "center",
                  color: GROUND.muted,
                  fontWeight: 500,
                  maxWidth: "28ch",
                  mx: "auto",
                }}
              >
                Decades of Wall St. &amp; Tier-1 Banking tenure
              </Typography>
            </Box>
          ) : (
            // No orbit below md — it would be 340px of decoration above the
            // content on the screens with the least room for it. The core's
            // claim is the part that matters, so that is what stays.
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h3" component="h2" sx={{ fontWeight: 700, color: GROUND.fg }}>
                Professional
              </Typography>
              <Typography
                component="span"
                variant="h4"
                sx={{ display: "block", color: NOIR.goldDark, fontWeight: 600 }}
              >
                Leadership
              </Typography>
              <Typography variant="body2" sx={{ mt: 1.5, color: GROUND.muted, fontWeight: 500 }}>
                Decades of Wall St. &amp; Tier-1 Banking tenure
              </Typography>
            </Box>
          )}

          <Box>
            {/* The control surface. Real buttons, always all three visible, so
                the set stays scannable and every route in — pointer, keyboard,
                touch — reaches the same state. */}
            <Box
              ref={railRef}
              onKeyDown={onKeyDown}
              sx={{ display: "flex", flexDirection: "column", gap: 1 }}
            >
              {differentiators.map((diff, i) => {
                const isActive = activeIndex === i;
                return (
                  <Box
                    key={diff.heading}
                    component="button"
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveIndex(i)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      width: "100%",
                      px: 2,
                      py: 1.75,
                      appearance: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      font: "inherit",
                      bgcolor: "transparent",
                      border: "none",
                      borderLeft: "2px solid",
                      borderLeftColor: isActive ? NOIR.goldDark : `rgba(${NOIR.navyFieldRgb}, 0.12)`,
                      transition: "border-color 350ms ease, background-color 350ms ease",
                      "&:hover": { bgcolor: `rgba(${NOIR.navyFieldRgb}, 0.03)` },
                      // Designed focus ring — inner light, outer brand — so it
                      // survives on this pale ground.
                      "&:focus-visible": {
                        outline: "none",
                        boxShadow: `0 0 0 2px ${NOIR.white}, 0 0 0 4px ${NOIR.goldDark}`,
                      },
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: MONO,
                        fontVariantNumeric: "tabular-nums",
                        fontSize: "0.8125rem",
                        color: isActive ? NOIR.goldDark : GROUND.muted,
                        transition: "color 350ms ease",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: isActive ? 600 : 500,
                        fontSize: "1.15rem",
                        color: GROUND.fg,
                        opacity: isActive ? 1 : 0.75,
                        transition: "opacity 350ms ease",
                      }}
                    >
                      {diff.heading}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* The selected body, read flat and still. A fixed min-height so
                swapping between a short and a long entry does not shift the
                orbit beside it. */}
            <Box sx={{ mt: 4, pl: 2, minHeight: { md: 120 } }} aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active?.heading ?? ""}
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduced ? 0 : -8 }}
                  transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                >
                  <Typography
                    sx={{
                      color: GROUND.muted,
                      lineHeight: 1.65,
                      fontSize: "1.0625rem",
                      maxWidth: "52ch",
                    }}
                  >
                    {active?.body}
                  </Typography>
                </motion.div>
              </AnimatePresence>
            </Box>
          </Box>
        </Box>
      </Box>
    </StageSection>
  );
}
