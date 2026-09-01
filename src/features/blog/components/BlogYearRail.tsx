import { useState } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CaretDown } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { MONO, TRACKING, TYPE_SCALE } from "@/shared/theme/theme";

import { blogMonthsQuery, blogYearsQuery } from "../api";
import type { BlogMonthFacet } from "../api";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface BlogYearRailProps {
  /** `null` means "All" — no year filter applied. */
  activeYear: number | null;
  /** `null` means no month filter applied (whole-year or "All"). */
  activeMonth: number | null;
  /**
   * Fires with the new (year, month) pair. `(null, null)` is "All". A whole
   * year with no month narrowing is `(year, null)`.
   */
  onSelectionChange: (year: number | null, month: number | null) => void;
}

/**
 * Typographic year rail: a hairline-divided vertical list, not a box of
 * buttons (WS-01 de-containerization). Weight + colour carry selection state;
 * counts sit subordinate to the year in the mono meta-rail treatment.
 *
 * Each year now discloses (WS-09 month facet) into the months underneath it
 * — a plain button + `Collapse`, deliberately not MUI `Accordion`/`Paper`,
 * which bring their own rounded-corner elevation styling that reads as a
 * boxed card and fights the flat, hairline-only rail this component exists
 * to be. Expansion is a separate concern from filtering — opening a year to
 * browse its months doesn't commit to a filter by itself; a row inside must
 * be clicked (either "All in {year}" or a specific month) the same way the
 * top-level "All" row works today.
 *
 * Degrades quietly when there are genuinely zero years to filter by — same
 * fails-soft posture as `FALLBACK_BLOG_PAGE`: render nothing (not an error)
 * rather than a rail with fabricated years. A genuine fetch failure is
 * distinct from that "zero results" case: it's logged and surfaced as a
 * small muted note rather than disappearing entirely, so a real outage
 * isn't silently invisible. The months facet degrades the same quiet way,
 * independently — a months fetch failure doesn't take down the year list.
 */
export function BlogYearRail({ activeYear, activeMonth, onSelectionChange }: BlogYearRailProps) {
  const years = useQuery(blogYearsQuery());
  const months = useQuery(blogMonthsQuery());
  const facets = years.data ?? [];

  // Which year's accordion is open. Defaults to whatever year is currently
  // selected (deep-linked or just clicked) so the active state is visible.
  const [expandedYear, setExpandedYear] = useState<number | null>(activeYear);

  if (years.isError) {
    console.error("BlogYearRail: failed to fetch year facets", years.error);
    return (
      <Typography
        component="p"
        sx={{
          fontFamily: MONO,
          fontSize: TYPE_SCALE.micro,
          letterSpacing: TRACKING.meta,
          textTransform: "uppercase",
          color: "text.disabled",
        }}
      >
        Years unavailable
      </Typography>
    );
  }

  if (months.isError) {
    console.error("BlogYearRail: failed to fetch month facets", months.error);
  }

  // Genuinely zero posts — disappear rather than show an empty rail.
  if (facets.length === 0) {
    return null;
  }

  const monthFacets = months.data ?? [];
  const monthsByYear = (year: number): BlogMonthFacet[] =>
    monthFacets.filter((facet) => facet.year === year && facet.count > 0);

  return (
    <Stack
      component="nav"
      aria-label="Filter posts by year and month"
      spacing={0}
      sx={{ minWidth: 96 }}
    >
      <RailRow
        label="All"
        count={null}
        isActive={activeYear === null && activeMonth === null}
        onSelect={() => {
          onSelectionChange(null, null);
        }}
      />
      {facets.map((facet) => {
        const isExpanded = expandedYear === facet.year;
        const isYearActive = activeYear === facet.year;
        const yearMonths = monthsByYear(facet.year);

        return (
          <Box
            key={facet.year}
            sx={{
              borderTop: "1px solid rgba(10, 42, 102, 0.12)",
              "&:last-of-type": {
                borderBottom: "1px solid rgba(10, 42, 102, 0.12)",
              },
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={() => {
                setExpandedYear(isExpanded ? null : facet.year);
              }}
              aria-expanded={isExpanded}
              aria-label={`Toggle ${String(facet.year)} months`}
              sx={{
                appearance: "none",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 1,
                width: "100%",
                textAlign: "left",
                py: 1.75,
                px: 0,
                "&:focus-visible": {
                  outline: "2px solid var(--accent)",
                  outlineOffset: 2,
                },
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontSize: TYPE_SCALE.subtitle1,
                  fontWeight: isYearActive ? 700 : 500,
                  lineHeight: 1.6,
                  color: isYearActive ? "var(--accent-ink)" : "text.secondary",
                }}
              >
                {facet.year}
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: MONO,
                    fontSize: TYPE_SCALE.micro,
                    letterSpacing: TRACKING.meta,
                    textTransform: "uppercase",
                    color: isYearActive ? "var(--accent-ink)" : "text.disabled",
                  }}
                >
                  {facet.count}
                </Typography>
                <Box
                  component={CaretDown}
                  sx={{
                    fontSize: "0.75rem",
                    color: "text.disabled",
                    transform: isExpanded ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </Stack>
            </Box>
            <Collapse in={isExpanded} timeout={150}>
              <Stack spacing={0} sx={{ pl: 1.5, pb: 1 }}>
                <RailRow
                  label={`All ${String(facet.year)}`}
                  count={null}
                  isActive={isYearActive && activeMonth === null}
                  onSelect={() => {
                    onSelectionChange(facet.year, null);
                  }}
                  dense
                />
                {months.isError ? (
                  <Typography
                    component="p"
                    sx={{
                      fontFamily: MONO,
                      fontSize: TYPE_SCALE.micro,
                      letterSpacing: TRACKING.meta,
                      textTransform: "uppercase",
                      color: "text.disabled",
                      py: 1,
                    }}
                  >
                    Months unavailable
                  </Typography>
                ) : (
                  yearMonths.map((monthFacet) => (
                    <RailRow
                      key={monthFacet.month}
                      label={MONTH_NAMES[monthFacet.month - 1] ?? String(monthFacet.month)}
                      count={monthFacet.count}
                      isActive={isYearActive && activeMonth === monthFacet.month}
                      onSelect={() => {
                        onSelectionChange(facet.year, monthFacet.month);
                      }}
                      dense
                    />
                  ))
                )}
              </Stack>
            </Collapse>
          </Box>
        );
      })}
    </Stack>
  );
}

interface RailRowProps {
  label: string;
  count: number | null;
  isActive: boolean;
  onSelect: () => void;
  /** Slightly tighter vertical rhythm for nested month rows. */
  dense?: boolean;
}

function RailRow({ label, count, isActive, onSelect, dense = false }: RailRowProps) {
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
        borderTop: dense ? "none" : "1px solid rgba(10, 42, 102, 0.12)",
        cursor: "pointer",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 1.5,
        width: "100%",
        textAlign: "left",
        py: dense ? 1 : 1.75,
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
        "&:last-of-type": dense
          ? {}
          : {
              borderBottom: "1px solid rgba(10, 42, 102, 0.12)",
            },
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: dense ? TYPE_SCALE.micro : TYPE_SCALE.subtitle1,
          fontWeight: isActive ? 700 : 500,
          lineHeight: 1.6,
          ...(dense
            ? {
                fontFamily: MONO,
                letterSpacing: TRACKING.meta,
                textTransform: "uppercase",
              }
            : {}),
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
