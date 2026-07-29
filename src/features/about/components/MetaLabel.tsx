import Typography from "@mui/material/Typography";

import { MONO } from "@/shared/theme/theme";

// A hairline meta label, used to head sub-blocks.
export function MetaLabel({ children }: { children: string }) {
  return (
    <Typography
      sx={{
        fontFamily: MONO,
        fontSize: "0.72rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "text.secondary",
      }}
    >
      {children}
    </Typography>
  );
}
