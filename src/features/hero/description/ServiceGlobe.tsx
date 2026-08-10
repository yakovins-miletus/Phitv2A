import Box from "@mui/material/Box";
import { keyframes } from "@mui/system";

import { CONTENT } from "@/shared/content";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { GROUNDS } from "@/shared/theme/grounds";
import { homeSection } from "@/shared/sections";

const GROUND = GROUNDS[homeSection("hero-mission").ground ?? "panel"];

/**
 * A rotating wireframe globe with the four service disciplines in orbit around
 * it, oversized and cut by the right edge of the viewport.
 *
 * ## Why CSS 3D and not R3F
 *
 * `three`, `@react-three/fiber` and `drei` are all already dependencies — the
 * hero sequence above this section uses them — so an R3F globe was available. It
 * is not used, for one reason: `SuperHeroSequence` is GSAP-pinned and its canvas
 * is still mounted when this section reaches the viewport, so a globe canvas here
 * would mean a second live WebGL context on the same screen. A wireframe sphere
 * is exactly the shape CSS 3D transforms are good at, so this renders as ~30 DOM
 * elements driven by transform animations that never leave the compositor. No
 * canvas, no context, no per-frame JS.
 *
 * ## How the sphere is built
 *
 *  - **Meridians** are full-size circles rotated about Y. A circle seen edge-on
 *    projects as an ellipse, which is what a meridian is — no ellipse maths, the
 *    browser's projection does it.
 *  - **Parallels** are `rotateX(90deg) translateZ(d)` rings, sized `2R·cos φ` and
 *    lifted `d = R·sin φ`, so they sit at true latitudes rather than at evenly
 *    spaced screen heights.
 *  - **Nodes** are tangent dots at `rotateY(lon) rotateX(lat) translateZ(R)` with
 *    `backface-visibility: hidden`. A dot on the far side faces away from the
 *    camera and so hides itself — the sphere reads as solid with no depth sorting
 *    anywhere.
 *
 * `translateZ` takes no percentages, so the radius is a real length: `--globe-r`
 * derives from the same width expression the container uses, and every 3D offset
 * is a multiple of it. Resizing the globe means editing one declaration.
 *
 * ## How the orbit avoids the furniture
 *
 * The right edge of the page is not free: `EyeFlow` pins the chapter rail there
 * (measured at 91% of the viewport width), and the globe has to overhang the
 * viewport for the clip to read. A full circular orbit puts labels straight
 * through that rail — the first build did exactly that, and "FULL-STACK
 * DEVELOPMENT" landed on top of "QUANTITATIVE R&D".
 *
 * Two things fix it, and both are things a real orbit does anyway:
 *
 *  1. **The orbit is an ellipse, squashed horizontally.** `scaleX` on a static
 *     wrapper outside the rotating ring, cancelled by `scaleX` on the chip
 *     inside it. That composition is exactly identity for the chip and a scaled
 *     translation for its position — the labels ride an ellipse and stay
 *     undistorted, with no per-frame maths. (Proof: `S(k)·R(ψ)·T(0,−r)·R(−ψ)·S(1/k)`
 *     collapses to `T(k·r·sin ψ, −r·cos ψ)`, because a translation conjugated by
 *     a rotation is still a translation.)
 *  2. **Chips fade out across the far half.** Each chip's opacity runs on the
 *     same period with a negative delay equal to its own phase, so it is only
 *     painted while it is on the near-left side of the sphere. A satellite going
 *     round the back of a globe should disappear, so the constraint and the
 *     physics agree.
 *
 * ## Motion
 *
 * The ring and each chip counter-rotate at the same period, so labels orbit
 * while staying upright — a chip that rotates with its ring is upside-down for
 * half of every revolution. 48s and 72s are deliberately slow: this sits beside
 * body copy someone is reading, and anything faster pulls the eye off the
 * sentence.
 *
 * `prefers-reduced-motion` stops all of it. Because the fade stops too, the
 * static layout cannot use the evenly-spaced angles — four chips at 0/90/180/270
 * would strand one on the rail — so the reduced-motion branch re-lays the chips
 * across the near-left arc. Same information, no motion, no collision.
 */

const spinY = keyframes`
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(360deg); }
`;

const orbitCW = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const orbitCCW = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
`;

/** Visible only across the near-left arc — see the docblock. Percentages are
 *  positions on the orbit: 0% is the top of the ellipse, 50% the bottom. */
const chipFade = keyframes`
  0%, 44%  { opacity: 0; }
  52%, 92% { opacity: 1; }
  100%     { opacity: 0; }
`;

/** Meridian count. 12 reads as a globe; 8 reads as a beach ball and 20 as moiré. */
const MERIDIANS = 12;

/** Latitudes in degrees. Equator plus three symmetric pairs. The poles are
 *  excluded, where a parallel degenerates to a point. */
const PARALLELS = [-60, -40, -20, 0, 20, 40, 60];

/**
 * Surface nodes, as [longitude, latitude] in degrees.
 *
 * These are the three markets `content.ts` already names — the USA, Europe and
 * Hong Kong of `trust.backing` — plus Manila, where the firm is built
 * (`about.heading`). Real coordinates rather than decorative dots, so what the
 * globe shows is what the copy beside it claims.
 */
const NODES: readonly (readonly [number, number])[] = [
  [-74, 40], // New York
  [0, 51], // London
  [114, 22], // Hong Kong
  [121, 15], // Manila
];

/**
 * Orbit shorthand, keyed by `CONTENT.services[].id`.
 *
 * The full titles ("Full-Stack Development") are three times the width of the
 * shortest, so as chips they force an orbit wide enough to reach the chapter
 * rail. These are the same four disciplines under the names the section below
 * (`CapabilityRack`) spells out in full — a label on a moving chip is a pointer,
 * not the copy.
 *
 * Keyed by id rather than index so a reordering of `services` cannot silently
 * relabel them.
 */
const ORBIT_LABEL: Record<string, string> = {
  development: "Development",
  "quant-research": "Research",
  "data-science": "Data Science",
  support: "Ops Support",
};

/** Sphere radius as a fraction of the container's width: the wrapper is inset
 *  12% a side, so the sphere is 76% of the box and its radius is 38% of it. */
const R_FACTOR = 0.38;

/** Container width. Scales with the viewport so the sphere still overhangs at
 *  1920, where a fixed 700px one would sit entirely inside the page. */
const GLOBE_W = "min(64vw, 1000px)";

/** How far past the right edge of the *viewport* (not the container — the
 *  container stops at 1536) the box is pushed. Checked at both 1440 and 1920:
 *  the sphere clips at both, and the widest chip still clears the chapter rail. */
const OVERHANG = "150px";

/** Orbit radii as multiples of the sphere radius: tall enough to clear the
 *  silhouette, narrow enough to keep the labels off the right rail. */
const ORBIT_RY = 1.05;
const ORBIT_SQUASH = 0.62;

const WIRE = GROUND.rule;
/** The equator, one step up from the rest of the cage so the sphere has a waist.
 *  Decorative only, so it is not held to a text contrast ratio. */
const WIRE_EQUATOR = "rgba(10, 42, 102, 0.30)";

export function ServiceGlobe() {
  const { services } = CONTENT;

  return (
    <Box
      sx={(theme) => ({
        position: "absolute",
        top: "50%",
        // At xs the sphere is a wash behind the copy rather than an object beside
        // it — there is no column to sit next to.
        right: "-38%",
        width: "104vw",
        "--globe-r": `calc(104vw * ${R_FACTOR})`,
        transform: "translateY(-50%)",
        aspectRatio: "1 / 1",
        zIndex: 0,
        opacity: 0.3,
        pointerEvents: "none",
        // 3D needs a camera. Long enough that the sphere reads as a sphere and
        // not as a fisheye.
        perspective: "1400px",
        [theme.breakpoints.up("md")]: {
          // `50% - 50vw` puts the box's right edge on the viewport's right edge
          // regardless of how wide the centred container is; the overhang then
          // pushes it past. Full-bleed without a viewport-width hack, and
          // `#home-main` carries `overflow-x: clip` so it can never scroll.
          right: `calc(50% - 50vw - ${OVERHANG})`,
          width: GLOBE_W,
          "--globe-r": `calc(${GLOBE_W} * ${R_FACTOR})`,
          opacity: 1,
        },
      })}
    >
      {/* Atmosphere. One radial, lit from the upper left so it agrees with the
       *  −14° tilt: a bare wireframe reads as a flat cage of ellipses, and this
       *  is the cheapest thing that gives it volume. Gold at 9% is the only
       *  colour in it — enough to warm the near side, not enough to become a
       *  second accent. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: "10%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 36% 30%, rgba(${NOIR.goldRgb}, 0.09) 0%, rgba(10, 42, 102, 0.06) 46%, rgba(10, 42, 102, 0) 72%)`,
        }}
      />

      {/* ── The wireframe ──────────────────────────────────────────────── */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: "12%",
          transformStyle: "preserve-3d",
          // Seen slightly from above: a globe viewed dead-on has its parallels
          // collapse to straight lines and stops reading as a sphere.
          transform: "rotateX(-14deg)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            willChange: "transform",
            animation: `${spinY} 48s linear infinite`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          {Array.from({ length: MERIDIANS }, (_, i) => (
            <Box
              key={`m-${i}`}
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                // One meridian in gold. Gold is the brand's only accent, so it
                // marks a single line rather than tinting the whole cage.
                border: `1px solid ${i === 0 ? `rgba(${NOIR.goldRgb}, 0.9)` : WIRE}`,
                transform: `rotateY(${(i * 180) / MERIDIANS}deg)`,
              }}
            />
          ))}

          {PARALLELS.map((lat) => {
            const rad = (lat * Math.PI) / 180;
            const size = Math.cos(rad) * 100;
            // rotateX(90deg) maps local +Z to screen-up, so a positive latitude
            // is a positive translateZ. No sign flip.
            const lift = Math.sin(rad).toFixed(4);
            return (
              <Box
                key={`p-${lat}`}
                sx={{
                  position: "absolute",
                  width: `${size}%`,
                  height: `${size}%`,
                  left: `${(100 - size) / 2}%`,
                  top: `${(100 - size) / 2}%`,
                  borderRadius: "50%",
                  border: `1px solid ${lat === 0 ? WIRE_EQUATOR : WIRE}`,
                  transform: `rotateX(90deg) translateZ(calc(var(--globe-r) * ${lift}))`,
                }}
              />
            );
          })}

          {NODES.map(([lon, lat]) => (
            <Box
              key={`n-${lon}-${lat}`}
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 9,
                height: 9,
                ml: "-4.5px",
                mt: "-4.5px",
                borderRadius: "50%",
                bgcolor: NOIR.gold,
                boxShadow: `0 0 0 4px rgba(${NOIR.goldRgb}, 0.20)`,
                // Tangent to the surface, so its own backface culls it while it
                // is round the far side.
                backfaceVisibility: "hidden",
                transform: `rotateY(${lon}deg) rotateX(${lat}deg) translateZ(var(--globe-r))`,
              }}
            />
          ))}
        </Box>
      </Box>

      {/* ── The disciplines in orbit ───────────────────────────────────────
       *  Four nested transforms, one job each, so the composition in the
       *  docblock stays checkable:
       *    squash → ring rotation → chip angle → counter-rotation → unsquash.
       *  At xs the ring is not rendered at all: the chips would cross the body
       *  copy at any radius that also clears the sphere, and all four
       *  disciplines are set in full in the Capabilities section below. */}
      <Box
        sx={(theme) => ({
          display: "none",
          [theme.breakpoints.up("md")]: {
            display: "block",
            position: "absolute",
            inset: 0,
            transform: `scaleX(${ORBIT_SQUASH})`,
          },
        })}
      >
        <Box
          component="ul"
          aria-label="Service disciplines"
          sx={{
            position: "absolute",
            inset: 0,
            m: 0,
            p: 0,
            listStyle: "none",
            willChange: "transform",
            animation: `${orbitCW} 72s linear infinite`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          {services.map((service, i) => {
            const angle = (i * 360) / services.length;
            // Static fallback angles, all on the near-left arc — see the
            // docblock's note on why even spacing cannot survive a stopped fade.
            const restAngle = 200 + i * 45;
            const orbit = (deg: number) =>
              `rotate(${deg}deg) translateY(calc(var(--globe-r) * ${-ORBIT_RY})) rotate(${-deg}deg)`;

            return (
              <Box
                component="li"
                key={service.id}
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  // A length, not a percentage: a percentage here would resolve
                  // against the chip's own box rather than the orbit.
                  transform: orbit(angle),
                  animation: `${chipFade} 72s linear infinite`,
                  animationDelay: `${(-72 * angle) / 360}s`,
                  "@media (prefers-reduced-motion: reduce)": {
                    animation: "none",
                    transform: orbit(restAngle),
                  },
                }}
              >
                <Box
                  sx={{
                    // Cancels the ring's rotation at the same period and phase,
                    // keeping the label upright through every revolution.
                    animation: `${orbitCCW} 72s linear infinite`,
                    "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                  }}
                >
                  <Box sx={{ transform: `scaleX(${1 / ORBIT_SQUASH})` }}>
                    <Box
                      sx={{
                        transform: "translate(-50%, -50%)",
                        whiteSpace: "nowrap",
                        px: 2,
                        py: 1,
                        bgcolor: NOIR.white,
                        border: `1px solid ${GROUND.rule}`,
                        // The one gold mark on the chip, echoing the gold meridian.
                        borderLeft: `2px solid ${NOIR.gold}`,
                        fontFamily: MONO,
                        fontSize: "0.75rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: GROUND.fg,
                      }}
                    >
                      {ORBIT_LABEL[service.id] ?? service.title}
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
