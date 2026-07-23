import Typography from "@mui/material/Typography";

import { MONO } from "@/shared/theme/theme";

interface WordmarkProps {
  /** Preloader renders before fonts.ready — its variant deliberately uses the
      mono fallback stack so there is no swap flash (ASSET MANIFEST A3). */
  mono?: boolean;
  gold?: boolean;
}

export function Wordmark({ mono = false, gold = false }: WordmarkProps) {
  return (
    <Typography
      component="span"
      sx={{
        fontFamily: mono ? MONO : undefined,
        fontWeight: 700,
        fontSize: mono ? "1rem" : "1.375rem",
        letterSpacing: mono ? "0.28em" : "-0.01em",
        textTransform: mono ? "uppercase" : "none",
        color: gold ? "primary.main" : "text.primary",
      }}
    >
      Phitopolis
    </Typography>
  );
}
