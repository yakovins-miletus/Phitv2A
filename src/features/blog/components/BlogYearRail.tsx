import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";

import { MONO, TRACKING, TYPE_SCALE } from "@/shared/theme/theme";

import { blogYearsQuery } from "../api";

interface BlogYearRailProps {
  /** `null` means "All" — no year filter applied. */
  activeYear: number | null;
  onYearChange: (year: number | null) => void;
}

/**
 * Typographic year rail: a hairline-divided vertical list, not a box of
 * buttons (WS-01 de-containerization). Weight + colour carry selection state;
 * counts sit subordinate to the year in the mono meta-rail treatment.
 *
 * Degrades quietly when `/blog-posts/years` is unreachable — same fails-soft
 * posture as `FALLBACK_BLOG_PAGE`: render nothing (not an error) rather than
 * a rail with fabricated years.
 */
export function BlogYearRail({ activeYear, onYearChange }: BlogYearRailProps) {
  const years = useQuery(blogYearsQuery());
  const facets = years.data ?? [];

  // Nothing to filter by yet (API unreachable, or genuinely zero posts) —
  // disappear rather than show an empty/broken rail.
  if (years.isError || facets.length === 0) {
    return null;
  }

  return (
    <Stack
      component="nav"
      aria-label="Filter posts by year"
      spacing={0}
      sx={{ minWidth: 96 }}
    >
      <YearEntry
        label="All"
        count={null}
        isActive={activeYear === null}
        onSelect={() => {
          onYearChange(null);
        }}
      />
      {facets.map((facet) => (
        <YearEntry
          key={facet.year}
          label={String(facet.year)}
          count={facet.count}
          isActive={activeYear === facet.year}
          onSelect={() => {
            onYearChange(facet.year === activeYear ? null : facet.year);
          }}
        />
      ))}
    </Stack>
  );
}

interface YearEntryProps {
  label: string;
  count: number | null;
  isActive: boolean;
  onSelect: () => void;
}

function YearEntry({ label, count, isActive, onSelect }: YearEntryProps) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      aria-current={isActive ? "true" : undefined}
      sx={{
        appearance: "none",
        background: "none",
        border: "none",
        borderTop: "1px solid rgba(10, 42, 102, 0.12)",
        cursor: "pointer",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 1.5,
        width: "100%",
        textAlign: "left",
        py: 1.75,
        px: 0,
        color: isActive ? "var(--accent-ink)" : "text.secondary",
        transition: "color 0.2s",
        "&:hover": {
          color: isActive ? "var(--accent-ink)" : "text.primary",
        },
        "&:focus-visible": {
          outline: "2px solid var(--accent)",
          outlineOffset: 2,
        },
        "&:last-of-type": {
          borderBottom: "1px solid rgba(10, 42, 102, 0.12)",
        },
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: TYPE_SCALE.subtitle1,
          fontWeight: isActive ? 700 : 500,
          lineHeight: 1.6,
        }}
      >
        {label}
      </Typography>
      {count !== null ? (
        <Typography
          component="span"
          sx={{
            fontFamily: MONO,
            fontSize: TYPE_SCALE.micro,
            letterSpacing: TRACKING.meta,
            textTransform: "uppercase",
            color: isActive ? "var(--accent-ink)" : "text.disabled",
          }}
        >
          {count}
        </Typography>
      ) : null}
    </Box>
  );
}
