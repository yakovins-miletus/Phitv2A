import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

/** The three-layer content contract, layers 0 and 1.
 *
 *  L0 `gunshot` is the only line a scrolling reader is guaranteed to consume:
 *  one claim at display size, read in about two seconds. L1 `tracer` is the
 *  single sentence that makes it survivable, read by second five. L2 — the
 *  `details` copy — lives behind a drawer or an expanded row and is never
 *  rendered here.
 *
 *  No motion of its own: inside a StageSection this rides the `.stage-inner`
 *  spotlight scrub, which is already reduced-motion guarded, so both layers
 *  render at rest with no JS. The rule carries `.stage-kicker-line` so
 *  StageSection's existing scaleX tween draws it as the section reaches
 *  center stage. */
export interface SectionLedeProps {
  gunshot: string;
  /** Omit on sections whose L1 is already rendered by the section itself. */
  tracer?: string;
  /** Mono kicker above the gunshot. */
  eyebrow?: string;
  /** Heading level — the gunshot is the section's real heading. */
  component?: "h1" | "h2" | "h3";
  /** `dark` inverts for the navy/video stages. */
  tone?: "light" | "dark";
  align?: "left" | "center";
  /** Set false where StageKicker already draws a rule for this section. */
  rule?: boolean;
}

export function SectionLede({
  gunshot,
  tracer,
  eyebrow,
  component = "h2",
  tone = "light",
  align = "left",
  rule = true,
}: SectionLedeProps) {
  const dark = tone === "dark";

  return (
    <Stack
      spacing={2}
      alignItems={align === "center" ? "center" : "flex-start"}
      sx={{ textAlign: align, width: "100%" }}
    >
      {eyebrow === undefined ? null : (
        <Typography
          variant="overline"
          sx={{ color: dark ? NOIR.gold : "primary.main", fontWeight: 700 }}
        >
          {eyebrow}
        </Typography>
      )}

      <Typography
        variant="h2"
        component={component}
        sx={{
          fontSize: { xs: "1.75rem", sm: "2.4rem", md: "3.1rem" },
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          color: dark ? "common.white" : "text.primary",
          // Keeps the gunshot to one or two even lines instead of leaving a
          // single orphaned word on its own row at desktop widths.
          textWrap: "balance",
          maxWidth: "24ch",
          ...(align === "center" ? { mx: "auto" } : {}),
        }}
      >
        {gunshot}
      </Typography>

      {rule ? (
        <Box
          className="stage-kicker-line"
          aria-hidden
          sx={{
            height: "1px",
            width: { xs: 72, md: 140 },
            bgcolor: dark ? "rgba(255,255,255,0.32)" : NOIR.hairline,
            transformOrigin: align === "center" ? "center" : "left center",
          }}
        />
      ) : null}

      {tracer === undefined ? null : (
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: { xs: "0.82rem", md: "0.9rem" },
            lineHeight: 1.7,
            letterSpacing: "0.01em",
            color: dark ? "rgba(255,255,255,0.78)" : "text.secondary",
            maxWidth: "58ch",
            ...(align === "center" ? { mx: "auto" } : {}),
          }}
        >
          {tracer}
        </Typography>
      )}
    </Stack>
  );
}
