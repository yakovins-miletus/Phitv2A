import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

import { CONTENT } from "@/shared/content";
import { ProcessDiagram } from "@/shared/components/diagrams/ProcessDiagram";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { useNavbarAnchor, NAV_ANCHORS } from "@/shared/components/NavbarContext";

// Immersive pipeline sequence
export function ProcessSection() {
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.PROCESS_IMMERSIVE, { dark: true });

  return (
    <Box id="process" ref={anchorRef} sx={{ bgcolor: NOIR.navyField, color: NOIR.frost, position: "relative", zIndex: 1, overflow: "hidden" }}>
      {/* Background Ambience */}
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3, pointerEvents: "none" }}>
        <Box sx={{ position: "absolute", top: "10%", left: "20%", width: "60vw", height: "60vw", borderRadius: "50%", background: `radial-gradient(circle, rgba(${NOIR.goldRgb},0.08) 0%, rgba(${NOIR.navyFieldRgb},0) 70%)`, filter: "blur(60px)" }} />
        <Box sx={{ position: "absolute", bottom: "10%", right: "10%", width: "40vw", height: "40vw", borderRadius: "50%", background: `radial-gradient(circle, rgba(${NOIR.frostRgb},0.05) 0%, rgba(${NOIR.navyFieldRgb},0) 70%)`, filter: "blur(60px)" }} />
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 12, md: 24 }, position: "relative", zIndex: 2 }}>
        <Typography
          component="p"
          sx={{
            textAlign: "center",
            fontFamily: MONO,
            fontSize: "0.75rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            // 0.72 alpha on navyField clears AA for 12px type; the kicker in
            // the diagram below uses the same floor.
            color: `rgba(${NOIR.frostRgb}, 0.72)`,
            mb: 3,
          }}
        >
          The pipeline
        </Typography>

        <Typography
          variant="h2"
          component="h2"
          sx={{
            textAlign: "center",
            mb: { xs: 8, md: 12 },
            fontWeight: 800,
            fontSize: { xs: "2.5rem", md: "4.5rem" },
            lineHeight: 1.05,
            letterSpacing: "-0.03em"
          }}
        >
          From problem to production
        </Typography>

        <ProcessDiagram steps={CONTENT.process} />
      </Container>
    </Box>
  );
}
