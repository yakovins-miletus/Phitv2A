import Box from "@mui/material/Box";

import { CONTENT } from "@/shared/content";
import { ProcessDiagram } from "@/shared/components/diagrams/ProcessDiagram";
import { NOIR } from "@/shared/theme/palette";
import { useNavbarAnchor, NAV_ANCHORS } from "@/shared/components/NavbarContext";

export function ProcessSection() {
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.PROCESS_IMMERSIVE, { dark: true });

  return (
    <Box
      id="process"
      ref={anchorRef}
      component="section"
      sx={{
        bgcolor: NOIR.navyDeep,
        color: NOIR.frost,
        position: "relative",
        zIndex: 1,
        width: "100%",
        overflow: "hidden",
        borderTop: "1px solid rgba(255, 199, 44, 0.2)",
        borderBottom: "1px solid rgba(255, 199, 44, 0.2)",
        py: { xs: 8, md: 14 },
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
  );
}
