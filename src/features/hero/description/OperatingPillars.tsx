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

/** One corner-radius value shared by every photo/placeholder in this section. */
const RADIUS = "16px";

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
              overflow: "hidden",
              background: GROUND.dark ? "rgba(255, 255, 255, 0.04)" : "#FFFFFF",
              borderTop: `1px solid ${GROUND.dark ? "rgba(255, 255, 255, 0.12)" : "rgba(10, 42, 102, 0.12)"}`,
              "&:last-of-type": {
                borderBottom: `1px solid ${GROUND.dark ? "rgba(255, 255, 255, 0.12)" : "rgba(10, 42, 102, 0.12)"}`,
              },
            }}
          >
            <Box
              sx={{
                maxWidth: 1320,
                mx: "auto",
                px: { xs: 3, sm: 4, md: 6 },
                py: { xs: 4, md: 6 },
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: "center",
                gap: { xs: 3, md: 6 },
              }}
            >
              {/* Photograph, contained (not edge to edge) at roughly 600-700px */}
              <Box
                sx={{
                  width: "100%",
                  maxWidth: { xs: "100%", md: 640 },
                  // `0 1 640px`, not `0 0 640px`. The md breakpoint starts at
                  // 900px, where a non-shrinking 640px image plus the 48px gap
                  // and the container padding leaves barely 100px for the copy.
                  // Allowing the image to shrink keeps the row readable through
                  // the whole 900-1320px band; it stops growing at 640 either way.
                  flex: { md: "0 1 640px" },
                  minWidth: 0,
                }}
              >
                {!showPlaceholder ? (
                  <Box
                    component="img"
                    src={pillar.image}
                    alt={pillar.alt}
                    width={640}
                    height={360}
                    onError={() => setImageFailed(true)}
                    sx={{
                      display: "block",
                      width: "100%",
                      height: "auto",
                      aspectRatio: "16 / 9",
                      borderRadius: RADIUS,
                      objectFit: "cover",
                      border: `1px solid ${GROUND.dark ? "rgba(255, 255, 255, 0.12)" : "rgba(10, 42, 102, 0.12)"}`,
                    }}
                  />
                ) : (
                  // Placeholder: intended shot is `pillar.alt` above, sourced from
                  // /images/pillars/{research,development,support}.webp once shot.
                  <Box
                    role="img"
                    aria-label={pillar.alt}
                    sx={{
                      width: "100%",
                      aspectRatio: "16 / 9",
                      borderRadius: RADIUS,
                      background: GROUND.dark
                        ? "rgba(229, 178, 40, 0.08)"
                        : "rgba(10, 42, 102, 0.04)",
                      border: `1px solid rgba(229, 178, 40, 0.3)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: NOIR.goldDark,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textAlign: "center",
                      px: 3,
                    }}
                  >
                    Image pending
                  </Box>
                )}
              </Box>

              {/* Copy */}
              <Box sx={{ maxWidth: "60ch", width: "100%", minWidth: 0, flex: { md: "1 1 0" } }}>
                <Typography
                  variant="h3"
                  component="h3"
                  sx={{
                    fontWeight: 800,
                    color: GROUND.fg,
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
                      backgroundColor: NOIR.goldDark,
                      mt: 1.2,
                      borderRadius: "1px",
                    },
                  }}
                >
                  {pillar.name}
                </Typography>

                <Typography
                  sx={{
                    color: GROUND.muted,
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
