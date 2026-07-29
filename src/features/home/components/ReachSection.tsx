import Box from "@mui/material/Box";

import { CONTENT } from "@/shared/content";
import { Reveal } from "@/shared/components/Reveal";
import { ReachMap } from "@/shared/components/ReachMap";
import { SectionLede } from "@/shared/components/SectionLede";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";

// Global Reach — the footprint map.
export function ReachSection() {
  return (
    <StageSection section={homeSection("reach")} muted>
      <Box sx={{ mb: 4 }}>
        <SectionLede
          gunshot={CONTENT.ledes.reach.gunshot}
          tracer={CONTENT.ledes.reach.tracer}
          eyebrow="Global Footprint"
        />
      </Box>
      <Reveal delay={0.1}>
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "background.paper",
          }}
        >
          <ReachMap />
        </Box>
      </Reveal>
    </StageSection>
  );
}
