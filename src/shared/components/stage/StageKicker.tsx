import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { NOIR } from "@/shared/theme/palette";

/** Numbered kicker with a hairline that draws in as the stage reaches
 *  center stage (the `.stage-kicker-line` scaleX tween in StageSection). */
export function StageKicker({ index: _index, label }: { index?: string; label: string }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography variant="overline" color="primary">
        {label}
      </Typography>
      <Box
        className="stage-kicker-line"
        sx={{
          height: "1px",
          flexGrow: 1,
          maxWidth: 220,
          background: NOIR.hairline,
          transformOrigin: "left center",
        }}
      />
    </Stack>
  );
}
