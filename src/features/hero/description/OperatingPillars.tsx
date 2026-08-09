import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { motion } from "motion/react";

import { CONTENT } from "@/shared/content";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";
import { useDepthLayer, usePointerSpace, useReducedMotion, type PointerSpace } from "@/shared/motion";
import { DevelopmentSchematic, ResearchSchematic, SupportSchematic } from "./pillarSchematics";

const GROUND = GROUNDS[homeSection("hero-pillars").ground ?? "void"];
const SCHEMATICS = [ResearchSchematic, DevelopmentSchematic, SupportSchematic];

/**
 * Three integrated operating pillars — built as a structure you are standing
 * in front of, rather than as three cards in a row.
 *
 * ## Why this is not a grid
 *
 * The previous version was the genre default: three glass cards, one per
 * pillar, each with a giant watermark numeral, laid out left to right. Adding
 * perspective and depth to that arrangement improved it but did not change
 * what it was — the bones were still a card grid, so it still read as one.
 *
 * The content is two words: *pillars*, and *integrated*. A row of equal
 * rectangles communicates neither. So the section is now literally that: three
 * slabs standing on a ground plane at different distances, tied to each other
 * by beams. The pillars are pillars, the integration is a physical connection
 * between them, and the reader is positioned in the space rather than looking
 * at a list of features.
 *
 * ## The rules that keep it from being a gimmick
 *
 * - **Nothing is hidden behind the 3D.** Every name and detail is in the DOM
 *   and legible in the resting state. Turning a slab to face you is a
 *   refinement, never the only way to read it — the section must survive with
 *   no pointer, no keyboard, and no motion.
 * - **Below `md` there is no scene at all.** A perspective stage on a 375px
 *   screen is unreadable and untouchable; narrow viewports get a clean stack.
 * - **Reduced motion gets the scene, still.** The geometry is the design, not
 *   the animation, so it stays; only the camera drift and the turn stop.
 */

/**
 * Stage geometry. One place, because these numbers only make sense together.
 *
 * The three that matter and why:
 *
 * - `perspective` is short (900, not the 1500–2000 a card grid uses) because
 *   convergence *is* the effect. At 1500 the floor grid stayed near-parallel
 *   and read as a spreadsheet ruled across the page rather than as a plane
 *   receding under the structure.
 * - `horizon` sits low (0.62) so the slabs, which grow upward from their base,
 *   have room above them inside the stage. At 0.42 their tops landed at a
 *   negative offset and overlapped the section heading.
 * - `perspectiveOrigin` matches `horizon`, putting the viewer's eye level at
 *   the horizon line. Any other value and the floor and the slabs disagree
 *   about where the camera is.
 */
const STAGE = {
  perspective: 900,
  height: 660,
  /** Horizon as a fraction of stage height — where the floor recedes to. */
  horizon: 0.62,
  slabWidth: 276,
  slabHeight: 300,
  /** How far behind the stage plane the floor's far edge sits. Must clear the
   *  furthest pillar (STANDS[2].z) or that pillar floats off the back of it. */
  floorSetback: 620,
  floorDepth: 1500,
};

/**
 * Where each pillar stands, as a position on the floor.
 *
 * `x` is a percentage of the stage width, `z` is depth in px. They move
 * together on purpose: the further right a pillar stands, the further back it
 * is, so the three of them form one line receding into the page instead of a
 * row facing the camera. `lift` is how far its base sits above the horizon,
 * which is what actually sells "standing further away" — a distant object
 * meets the ground higher up the picture.
 */
const STANDS = [
  { x: 20, z: 130, lift: 0.0 },
  { x: 50, z: -20, lift: 0.05 },
  { x: 79, z: -170, lift: 0.1 },
];

interface Pillar {
  id: string;
  name: string;
  detail: string;
}

/**
 * The camera's resting angle on the structure. Every slab shares it, which is
 * what makes them read as objects in one space rather than as three sprites.
 *
 * 24°, not the 15° this started at: below about 20° the turn is too slight to
 * register as an object seen from an angle, and the slab just looks like a
 * card that has been nudged. The angle has to be committed to or it reads as
 * an accident.
 */
const RESTING_YAW = -24;

/** How thick a pillar is. The visible side face is the difference between a
 *  rectangle and a solid — without it, no amount of angle reads as depth. */
const THICKNESS = 22;

function Slab({
  pillar,
  index,
  space,
  reduced,
  focused,
  onFocusChange,
}: {
  pillar: Pillar;
  index: number;
  space: PointerSpace;
  reduced: boolean;
  focused: boolean;
  onFocusChange: (index: number | null) => void;
}) {
  const stand = STANDS[index] ?? STANDS[1]!;
  const Schematic = SCHEMATICS[index] ?? SCHEMATICS[0]!;
  // Nearer slabs swing more with the camera than distant ones. That difference
  // is the parallax; without it the structure reads as a flat painting of a
  // structure.
  const layer = useDepthLayer(space, 1 - index * 0.3);

  const depthFade = [1, 0.9, 0.78][index] ?? 0.85;

  return (
    <motion.div
      onHoverStart={() => onFocusChange(index)}
      onHoverEnd={() => onFocusChange(null)}
      animate={{
        // Turning to face the reader is the whole affordance: an object in a
        // room acknowledging you, rather than a card growing a shadow.
        rotateY: reduced ? RESTING_YAW : focused ? 0 : RESTING_YAW,
        z: reduced ? stand.z : stand.z + (focused ? 90 : 0),
      }}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
      style={{
        position: "absolute",
        left: `${stand.x}%`,
        top: `${(STAGE.horizon - stand.lift) * 100}%`,
        width: STAGE.slabWidth,
        height: STAGE.slabHeight,
        marginLeft: -STAGE.slabWidth / 2,
        // The slab stands *on* the floor: its base is the anchor, so it grows
        // upward from the horizon rather than being centred on it.
        marginTop: -STAGE.slabHeight,
        transformStyle: "preserve-3d",
        transformOrigin: "50% 100%",
        ...(reduced ? {} : layer),
      }}
    >
      {/* Footing and plinth, laid flat on the floor at the slab's base.
          They are children of the slab rather than of the floor, deliberately:
          that way they inherit its exact position in the scene and cannot
          drift out of register with it when a stand moves. The plinth is far
          wider than the slab, so the three of them overlap into one continuous
          rail — which is where "integrated" stops being a word in the heading
          and becomes something you can see. */}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          // `top: 100%` puts this element's own top edge exactly on the slab's
          // base, which is also the rotation origin — so it hinges down onto
          // the floor. Anchoring with `bottom: 0` instead hinges it about a
          // line partway up the slab and it lays out as a band across the
          // middle of the card.
          top: "100%",
          left: "50%",
          width: 760,
          height: 150,
          ml: "-380px",
          transform: "rotateX(90deg)",
          transformOrigin: "50% 0%",
          background: `linear-gradient(to right, transparent, rgba(${NOIR.navyFieldRgb}, 0.1) 22%, rgba(${NOIR.navyFieldRgb}, 0.1) 78%, transparent)`,
          pointerEvents: "none",
        }}
      />
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          // `top: 100%` puts this element's own top edge exactly on the slab's
          // base, which is also the rotation origin — so it hinges down onto
          // the floor. Anchoring with `bottom: 0` instead hinges it about a
          // line partway up the slab and it lays out as a band across the
          // middle of the card.
          top: "100%",
          left: "50%",
          width: STAGE.slabWidth + 40,
          height: 84,
          ml: `${-(STAGE.slabWidth + 40) / 2}px`,
          transform: "rotateX(90deg)",
          transformOrigin: "50% 0%",
          background: `radial-gradient(ellipse at 50% 0%, rgba(${NOIR.navyFieldRgb}, 0.22), transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* The pillar's schematic, floating behind its own slab. */}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: "-24%",
          left: "-18%",
          width: "86%",
          aspectRatio: "1",
          opacity: 0.55,
          transform: "translateZ(-90px)",
          pointerEvents: "none",
        }}
      >
        <Schematic />
      </Box>

      {/* The pillar's side face. Hinged off the left edge and turned into the
          page, so at the camera's resting yaw you see the solid's flank. This
          single element is what stops the slab reading as a card: a rectangle
          at an angle is still a rectangle, but a rectangle with a visible
          thickness is an object. */}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: THICKNESS,
          height: "100%",
          transform: `rotateY(-90deg) translateZ(${THICKNESS / 2}px)`,
          transformOrigin: "0% 50%",
          bgcolor: `rgba(${NOIR.navyFieldRgb}, 0.1)`,
          borderTop: `1px solid rgba(${NOIR.navyFieldRgb}, 0.12)`,
          borderBottom: `2px solid rgba(${NOIR.goldRgb}, 0.45)`,
        }}
      />

      <Box
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          p: 3,
          // Near-square corners: a 28px radius is a card, a 2px radius is a
          // building element.
          borderRadius: "2px",
          // Lighter than a card would be: the floor grid reading faintly
          // through a pillar is what places it *in* the scene rather than on
          // top of a picture of one.
          bgcolor: `rgba(255, 255, 255, ${0.3 * depthFade + 0.16})`,
          backdropFilter: "blur(14px)",
          border: `1px solid rgba(${NOIR.navyFieldRgb}, ${0.16 * depthFade})`,
          borderBottomColor: `rgba(${NOIR.goldRgb}, 0.6)`,
          borderBottomWidth: "2px",
          boxShadow: `0 ${40 * depthFade}px ${90 * depthFade}px rgba(${NOIR.navyFieldRgb}, ${0.14 * depthFade})`,
          transition: "border-color 400ms ease",
        }}
      >
        <Typography
          component="span"
          sx={{
            fontFamily: MONO,
            fontVariantNumeric: "tabular-nums",
            fontSize: "0.8125rem",
            letterSpacing: "0.24em",
            color: NOIR.goldDark,
          }}
        >
          {pillar.id}
        </Typography>

        <Box sx={{ height: "1px", bgcolor: GROUND.rule, my: 2.5 }} />

        <Typography
          variant="h4"
          component="h3"
          sx={{ fontWeight: 600, color: GROUND.fg, letterSpacing: "-0.01em", mb: 2 }}
        >
          {pillar.name}
        </Typography>

        <Typography sx={{ color: GROUND.muted, lineHeight: 1.65, fontSize: "1rem" }}>
          {pillar.detail}
        </Typography>

        {/* The slab's footing, where it meets the floor. */}
        <Box
          aria-hidden="true"
          sx={{
            mt: "auto",
            pt: 3,
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontFamily: MONO,
            fontSize: "0.625rem",
            letterSpacing: "0.28em",
            color: `rgba(${NOIR.navyFieldRgb}, 0.45)`,
          }}
        >
          PILLAR
        </Box>
      </Box>
    </motion.div>
  );
}

/** The floor the structure stands on, and the beams that tie it together. */
function Stage({
  space,
  reduced,
  children,
}: {
  space: PointerSpace;
  reduced: boolean;
  children: React.ReactNode;
}) {
  const floorLayer = useDepthLayer(space, 1.6);

  return (
    // The clip lives on a *wrapper*, never on the element that carries
    // `perspective`. Per spec any `overflow` other than `visible` forces
    // `transform-style: flat`, which silently collapses the entire scene —
    // the floor rendered as a plain rectangular grid ruled across the page,
    // with the rotateX applied and the perspective simply ignored.
    <Box sx={{ position: "relative", overflow: "hidden", borderRadius: "12px" }}>
      <Box
        {...space.bind}
        sx={{
          position: "relative",
          height: STAGE.height,
          perspective: `${STAGE.perspective}px`,
          perspectiveOrigin: `50% ${STAGE.horizon * 100}%`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Ground plane: a grid laid flat under the structure, and the single
            strongest cue that there is a floor at all. Pushed back so its far
            edge is well beyond the furthest pillar, then rotated about that
            far edge so it sweeps toward the viewer. Masked to an ellipse so it
            dissolves into the page instead of ending on a hard line. */}
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            left: "-60%",
            right: "-60%",
            top: `${STAGE.horizon * 100}%`,
            height: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(${-STAGE.floorSetback}px)`,
            pointerEvents: "none",
          }}
        >
          <motion.div
            style={{
              position: "absolute",
              inset: "0 0 auto 0",
              height: STAGE.floorDepth,
              transform: "rotateX(78deg)",
              transformOrigin: "50% 0%",
              backgroundImage: `
                repeating-linear-gradient(to right, rgba(${NOIR.navyFieldRgb}, 0.12) 0 1px, transparent 1px 112px),
                repeating-linear-gradient(to bottom, rgba(${NOIR.navyFieldRgb}, 0.12) 0 1px, transparent 1px 112px)
              `,
              maskImage:
                "radial-gradient(ellipse 46% 52% at 50% 34%, black 0%, black 40%, transparent 88%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 46% 52% at 50% 34%, black 0%, black 40%, transparent 88%)",
              ...(reduced ? {} : floorLayer),
            }}
          />
        </Box>
        {children}
      </Box>
    </Box>
  );
}

export function OperatingPillars() {
  const { pillars } = CONTENT.hero.salesPitch as { pillars: readonly Pillar[] };
  const space = usePointerSpace();
  const reduced = useReducedMotion() === true;
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up("md"), { noSsr: true });
  const [focused, setFocused] = useState<number | null>(null);

  return (
    <StageSection section={homeSection("hero-pillars")}>
      <Box sx={{ width: "100%", position: "relative" }}>
        <Box sx={{ mb: { xs: 6, md: 4 }, textAlign: { xs: "left", md: "center" } }}>
          <Typography
            component="p"
            variant="overline"
            sx={{ fontFamily: MONO, color: NOIR.goldDark, display: "block", mb: 2 }}
          >
            Organizational structure
          </Typography>
          <Typography variant="h2" component="h2" sx={{ maxWidth: "20ch", mx: { md: "auto" } }}>
            Three integrated operating pillars
          </Typography>
        </Box>

        {wide ? (
          <Stage space={space} reduced={reduced}>
            {pillars.map((pillar, i) => (
              <Slab
                key={pillar.id}
                pillar={pillar}
                index={i}
                space={space}
                reduced={reduced}
                focused={focused === i}
                onFocusChange={setFocused}
              />
            ))}
          </Stage>
        ) : (
          // No scene below md. A perspective stage at 375px is unreadable and
          // there is no cursor to drive it, so narrow viewports get the
          // content plainly rather than a broken diorama.
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {pillars.map((pillar) => (
              <Box
                key={pillar.id}
                sx={{
                  p: 3,
                  borderRadius: "6px",
                  bgcolor: "rgba(255, 255, 255, 0.55)",
                  border: `1px solid rgba(${NOIR.navyFieldRgb}, 0.12)`,
                  borderBottom: `2px solid rgba(${NOIR.goldRgb}, 0.6)`,
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.75rem",
                    letterSpacing: "0.24em",
                    color: NOIR.goldDark,
                  }}
                >
                  {pillar.id}
                </Typography>
                <Typography
                  variant="h4"
                  component="h3"
                  sx={{ fontWeight: 600, color: GROUND.fg, mt: 1.5, mb: 1 }}
                >
                  {pillar.name}
                </Typography>
                <Typography sx={{ color: GROUND.muted, lineHeight: 1.65 }}>
                  {pillar.detail}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </StageSection>
  );
}
