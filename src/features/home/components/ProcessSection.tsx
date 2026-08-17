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
          zIndex: 1,
          overflow: "hidden",
          borderTop: "1px solid rgba(255, 199, 44, 0.2)",
          borderBottom: "1px solid rgba(255, 199, 44, 0.2)",
          py: { xs: 8, md: 14 },
          /**
           * Break out of SectionBeat's `Container maxWidth="2xl"`.
           *
           * The old `width: 100vw; ml/mr: calc(50% - 50vw)` version left a visible
           * gutter down both sides instead of bleeding to the true viewport edge.
           * `margin-left/right` percentages resolve against the CONTAINING BLOCK's
           * width — here, the Container's own content-box width (maxWidth minus its
           * padding), not the viewport — so `50%` was 50% of ~1280px, not of the
           * 100vw the other half of the expression assumed. The residual offset was
           * exactly the Container's own gutter, which is why it read as "almost"
           * full-bleed rather than obviously broken.
           *
           * `left: 50%` + `transform: translateX(-50%)` is agnostic to that: `left`
           * still resolves against the Container's width, landing this box's left
           * edge on the CONTAINER's horizontal center — but `translateX(-50%)`
           * resolves against this box's OWN width (100vw), shifting it left by
           * exactly half the viewport. Since MUI's `Container` is itself centered
           * in the viewport by default, the container's center IS the viewport's
           * center, so the two offsets cancel to the true viewport edge regardless
           * of the Container's maxWidth or padding — no ancestor-width assumption
           * baked into the math this time.
           */
          position: "relative",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100vw",
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
