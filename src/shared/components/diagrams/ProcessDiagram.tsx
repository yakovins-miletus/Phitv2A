import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { StaggerGroup, StaggerItem } from "@/shared/components/Reveal";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

// Stepper diagram — numbered nodes on a hairline. HTML (not SVG) so the
// step labels stay crisp and readable at every viewport width.

export interface ProcessStep {
  number: string;
  label: string;
  caption: string;
}

interface ProcessDiagramProps {
  steps: readonly ProcessStep[];
}

function NodeMarker() {
  return (
    <Box
      sx={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        border: 2,
        borderColor: NOIR.ink,
        bgcolor: NOIR.panel,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: NOIR.gold }} />
    </Box>
  );
}

export function ProcessDiagram({ steps }: ProcessDiagramProps) {
  return (
    <StaggerGroup>
      <Stack direction={{ xs: "column", md: "row" }}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <Box key={step.label} sx={{ flex: 1 }}>
              <StaggerItem>
                <Stack direction={{ xs: "row", md: "column" }} spacing={2.5} sx={{ height: 1 }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    alignItems="center"
                    sx={{ flexShrink: 0, alignSelf: { xs: "stretch", md: "auto" } }}
                  >
                    <NodeMarker />
                    {isLast ? null : (
                      <Box
                        sx={{
                          flexGrow: 1,
                          width: { xs: "2px", md: "auto" },
                          minHeight: { xs: 40, md: 0 },
                          height: { xs: "auto", md: "2px" },
                          bgcolor: "divider",
                        }}
                      />
                    )}
                  </Stack>
                  <Box sx={{ pb: { xs: isLast ? 0 : 4, md: 0 }, pr: { md: 4 } }}>
                    <Typography
                      sx={{
                        fontFamily: MONO,
                        fontSize: "0.75rem",
                        letterSpacing: "0.2em",
                        color: "text.secondary",
                        mb: 1,
                      }}
                    >
                      {step.number}
                    </Typography>
                    <Typography variant="h4" color="primary" gutterBottom>
                      {step.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.caption}
                    </Typography>
                  </Box>
                </Stack>
              </StaggerItem>
            </Box>
          );
        })}
      </Stack>
    </StaggerGroup>
  );
}
