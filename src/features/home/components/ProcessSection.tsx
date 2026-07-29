import Typography from "@mui/material/Typography";

import { CONTENT } from "@/shared/content";
import { Reveal } from "@/shared/components/Reveal";
import { ProcessDiagram } from "@/shared/components/diagrams/ProcessDiagram";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";

// How We Work — the process pipeline.
export function ProcessSection() {
  return (
    <StageSection section={homeSection("process")} muted>
      <Reveal>
        <Typography variant="h2" component="h2">
          From problem to production
        </Typography>
      </Reveal>
      <ProcessDiagram steps={CONTENT.process} />
    </StageSection>
  );
}
