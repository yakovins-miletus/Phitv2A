import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

import { CONTENT } from "@/shared/content";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { MiniEstablishingShot } from "@/shared/components/establishing/MiniEstablishingShot";
import { homeSection } from "@/shared/sections";
import { Reveal } from "@/shared/components/Reveal";
import { ServiceVector } from "./ServiceDrawer";
import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { useNavbarAnchor } from "@/shared/components/navbarHooks";

export function CapabilityRack() {
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.HOME_SERVICES, { dark: false });
  return (
    <SectionBeat
      section={homeSection("services")}
      // Was "Mini Establishing Shot 2" in routes/index.tsx, inside an ad-hoc
      // <Container sx={{ pt: … }}>. Both the shot and its padding moved here:
      // the beat now owns the pair's spacing and its single timeline.
      establishing={
        <MiniEstablishingShot
          selfDriven={false}
          category="CORE DISCIPLINES"
          title="Four disciplines."
          titleAccent="One delivery contract."
          tracer="High-performance computing, systematic execution engines, and mathematical research frameworks."
        />
      }
    >
      <Stack ref={anchorRef} spacing={0} sx={{ mt: 0 }}>
        {CONTENT.services.map((service) => {
          return (
            <Box
              key={service.id}
              sx={{
                py: { xs: 8, md: 12 },
                borderTop: 1,
                borderColor: "divider",
                position: "relative",
              }}
            >
              <Reveal>
                <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={4}>
                      <Typography
                        variant="overline"
                        sx={{
                          fontFamily: MONO,
                          color: NOIR.goldDark,
                          letterSpacing: "0.15em",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          display: "block",
                          textTransform: "uppercase",
                        }}
                      >
                        {service.title}
                      </Typography>
                      
                      <Typography
                        variant="h2"
                        component="h3"
                        sx={{
                          fontWeight: 800,
                          fontSize: { xs: "2rem", sm: "2.8rem", md: "3.5rem", lg: "4rem" },
                          lineHeight: 1.1,
                          letterSpacing: "-0.03em",
                          color: "text.primary",
                        }}
                      >
                        {service.gunshot}
                      </Typography>

                      <Box
                        sx={{
                          borderLeft: 4,
                          borderColor: NOIR.gold,
                          pl: 3,
                          py: 1,
                        }}
                      >
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 400,
                            color: "text.secondary",
                            lineHeight: 1.6,
                            fontSize: { xs: "1.2rem", md: "1.4rem" }
                          }}
                        >
                          {service.tracer}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: { xs: 520, md: 640 },
                        aspectRatio: "1/1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: { xs: "auto", md: 0 },
                        ml: { md: "auto" },
                      }}
                    >
                      <ServiceVector id={service.id} />
                    </Box>
                  </Grid>
                </Grid>
              </Reveal>
            </Box>
          );
        })}
      </Stack>
    </SectionBeat>
  );
}
