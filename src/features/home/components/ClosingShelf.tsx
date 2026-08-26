import Box from "@mui/material/Box";

import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { useNavbarAnchor } from "@/shared/components/navbarHooks";
import { homeSection } from "@/shared/sections";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { MiniEstablishingShot } from "@/shared/components/establishing/MiniEstablishingShot";
import { ClosingLatticeSection } from "./closing-scene/ClosingLattice";
import { NOIR } from "@/shared/theme/palette";

/**
 * ClosingShelf – replaced with isometric tech-stack lattice
 *
 * WS-04: The old shelf of four polaroid frames is replaced with an isometric
 * tech-stack lattice that zooms out to reveal supporting infrastructure as the
 * user scrolls. Built in SVG with CSS transforms, not R3F, to avoid the
 * three.js bundle (908 KB) entirely.
 *
 * The lattice is lazy-loaded behind useInView + Suspense to keep it off the
 * critical path, matching ServiceGlobe's pattern in MissionStatement.tsx.
 *
 * CTAs to /contact and /careers are preserved in ClosingLatticeSection.
 */
export function ClosingShelf() {
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.HOME_CLOSING, { dark: true });

  return (
    <SectionBeat
      section={homeSection("closing")}
      establishing={
        <MiniEstablishingShot
          selfDriven={false}
          title="In"
          titleAccent="closing"
          tracer="Direct line to our technical leadership and quantitative engineering directors."
          dark
        />
      }
      sx={{
        position: "relative",
        zIndex: 1,
        bgcolor: NOIR.navyField,
        color: NOIR.frost,
        overflow: "hidden",
        p: 0,
      }}
    >
      <Box
        ref={anchorRef}
        aria-labelledby="closing-heading"
        sx={{
          position: "relative",
          zIndex: 2,
          width: "100%",
        }}
      >
        <ClosingLatticeSection />
      </Box>
    </SectionBeat>
  );
}
