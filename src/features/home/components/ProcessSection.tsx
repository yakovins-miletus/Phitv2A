import Box from "@mui/material/Box";

import { CONTENT } from "@/shared/content";
import { ProcessDiagram } from "@/shared/components/diagrams/ProcessDiagram";
import { NOIR } from "@/shared/theme/palette";
import { useNavbarAnchor, NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { ProcessEstablishingShot } from "@/features/home/components/establishing/ProcessEstablishingShot";
import { homeSection } from "@/shared/sections";

export function ProcessSection() {
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.PROCESS_IMMERSIVE, { dark: true });

  return (
    <SectionBeat
      section={homeSection("process")}
      order={6}
      // Was "Major Establishing Shot 2" as a separate sibling in
      // routes/index.tsx; see ProcessEstablishingShot.tsx.
      establishing={<ProcessEstablishingShot selfDriven={false} />}
      establishScale="major"
    >
      <Box
        ref={anchorRef}
        sx={{
          bgcolor: NOIR.navyDeep,
          color: NOIR.frost,
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
          borderTop: "1px solid rgba(255, 199, 44, 0.2)",
          borderBottom: "1px solid rgba(255, 199, 44, 0.2)",
          py: { xs: 8, md: 14 },
          // Break out of SectionBeat's Container maxWidth="2xl": before the
          // beat migration this band was its own full-width top-level Box, not
          // gutter-constrained. Same bleed technique used nowhere else yet in
          // this refactor, but it's the standard "escape the parent container"
          // pattern and doesn't fight the Container's own padding — it just
          // repositions this Box independent of the ancestor's width.
          width: "100vw",
          ml: "calc(50% - 50vw)",
          mr: "calc(50% - 50vw)",
        }}
      >
        {/* Industrial Grid Background & Scanlines */}
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />

        {/* Full-width Pipeline Canvas */}
        <Box sx={{ width: "100%", px: { xs: 2, md: 6, lg: 8 }, position: "relative", zIndex: 2 }}>
          <ProcessDiagram steps={CONTENT.process} />
        </Box>
      </Box>
    </SectionBeat>
  );
}
