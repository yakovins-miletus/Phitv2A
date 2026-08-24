import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { CONTENT } from "@/shared/content";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { PillarsEstablishingShot } from "@/features/home/components/establishing/PillarsEstablishingShot";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { NOIR } from "@/shared/theme/palette";

const GROUND = GROUNDS[homeSection("hero-pillars").ground ?? "void"];

interface Pillar {
  id: string;
  name: string;
  detail: string;
  image: string;
  alt: string;
}

/**
 * Left-to-right scrim: clear over the photo (the "highlight" side), dark
 * toward the copy (the "text" side) — the same navy-scrim recipe as
 * `BlogSection.tsx`'s featured-card treatment, rotated 90°. Four stops rather
 * than two so the handoff from photo to legible-text reads as a gradient, not
 * a visible seam.
 */
const SCRIM = `linear-gradient(to right, rgba(${NOIR.navyInkRgb}, 0) 0%, rgba(${NOIR.navyInkRgb}, 0.25) 38%, rgba(${NOIR.navyInkRgb}, 0.88) 62%, rgba(${NOIR.navyInkRgb}, 0.95) 100%)`;

/** On mobile the row is too narrow for a side-lit photo to read as anything
 *  but noise behind the text — the scrim goes almost fully dark instead, top
 *  to bottom, so the copy stays the point and the photo is texture, not a
 *  competing highlight. */
const SCRIM_MOBILE = `linear-gradient(to bottom, rgba(${NOIR.navyInkRgb}, 0.55) 0%, rgba(${NOIR.navyInkRgb}, 0.93) 55%, rgba(${NOIR.navyInkRgb}, 0.97) 100%)`;

export function OperatingPillars() {
  const { pillars } = CONTENT.hero.salesPitch as { pillars: readonly Pillar[] };

  return (
    <SectionBeat
      section={homeSection("hero-pillars")}
      establishing={<PillarsEstablishingShot selfDriven={false} />}
      sx={{ minHeight: "auto", pt: 0, pb: { xs: 6, md: 10 } }}
    >
      <Box sx={{ position: "relative", zIndex: 2, mt: { xs: 2, md: 3 } }}>
        {pillars.map((pillar) => (
          <PillarRow key={pillar.id} pillar={pillar} />
        ))}
      </Box>
    </SectionBeat>
  );
}

function PillarRow({ pillar }: { pillar: Pillar }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showPlaceholder = !pillar.image || imageFailed;

  return (
    <Box
      sx={{
        position: "relative",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100vw",
        // Full-bleed photo band — was a contained 640px image beside text;
        // now the photo IS the row, with a scrim under the copy rather than
        // a separate boxed thumbnail. Fixed height (not sized to the copy)
        // so a short pillar description can't leave the photo looking
        // squashed or thin.
        height: { xs: "60vh", md: "70vh" },
        minHeight: { xs: 420, md: 520 },
        overflow: "hidden",
        borderTop: `1px solid rgba(${NOIR.whiteRgb}, 0.12)`,
        "&:last-of-type": {
          borderBottom: `1px solid rgba(${NOIR.whiteRgb}, 0.12)`,
        },
      }}
    >
      {/* Photograph, or the placeholder standing in for it. Absolutely
          positioned full-bleed — `pillar.image` will resolve to a real
          /images/pillars/{research,development,support}.webp once shot;
          until then the diagonal wash below marks the frame as
          intentionally empty rather than broken. */}
      {!showPlaceholder ? (
        <Box
          component="img"
          src={pillar.image}
          alt=""
          onError={() => setImageFailed(true)}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background: GROUND.dark
              ? `repeating-linear-gradient(-45deg, rgba(${NOIR.goldRgb}, 0.05) 0px, rgba(${NOIR.goldRgb}, 0.05) 2px, transparent 2px, transparent 18px), ${NOIR.navyDeep}`
              : `repeating-linear-gradient(-45deg, rgba(${NOIR.navyFieldRgb}, 0.05) 0px, rgba(${NOIR.navyFieldRgb}, 0.05) 2px, transparent 2px, transparent 18px), ${NOIR.void}`,
          }}
        />
      )}

      {/* Left-to-right (top-to-bottom on mobile) navy scrim — see SCRIM/
          SCRIM_MOBILE above for the reasoning. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: { xs: SCRIM_MOBILE, md: SCRIM },
        }}
      />

      {showPlaceholder && (
        <Typography
          role="img"
          aria-label={pillar.alt}
          sx={{
            position: "absolute",
            left: { xs: 24, md: 48 },
            bottom: { xs: 24, md: 48 },
            color: `rgba(${NOIR.goldRgb}, 0.55)`,
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Image pending — {pillar.alt}
        </Typography>
      )}

      {/* Copy, overlaid on the scrim's dark side. Always light text — this
          sits on a photographic scrim now, not the section's flat ground,
          so it no longer takes its color from `GROUND.fg`/`GROUND.muted`
          the way the contained layout's copy did. */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          maxWidth: 1320,
          mx: "auto",
          px: { xs: 3, sm: 4, md: 6 },
          display: "flex",
          flexDirection: "column",
          justifyContent: { xs: "flex-end", md: "center" },
          alignItems: "flex-end",
          pb: { xs: 5, md: 0 },
        }}
      >
        <Box sx={{ maxWidth: { xs: "100%", md: "48ch" }, textAlign: "left" }}>
          <Typography
            variant="h3"
            component="h3"
            sx={{
              fontWeight: 800,
              color: NOIR.frost,
              letterSpacing: "-0.02em",
              fontSize: { xs: "1.5rem", md: "1.75rem" },
              lineHeight: 1.25,
              position: "relative",
              display: "inline-block",
              "&::after": {
                content: '""',
                display: "block",
                width: "32px",
                height: "2px",
                backgroundColor: NOIR.gold,
                mt: 1.2,
                borderRadius: "1px",
              },
            }}
          >
            {pillar.name}
          </Typography>

          <Typography
            sx={{
              color: `rgba(${NOIR.frostRgb}, 0.82)`,
              lineHeight: 1.65,
              fontSize: "1.05rem",
              fontWeight: 400,
              mt: 1.5,
            }}
          >
            {pillar.detail}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
