/**
 * The gallery's tab strip.
 *
 * Bottom-centre, which is the only quadrant the hero leaves free — motto top-left,
 * the PoC toggle top-right, the directory links bottom-left, the scroll cue
 * bottom-right. It mounts only while the PoC is on and fades on `var(--hp-panel)`
 * with the rest of the hero chrome, so scrolling retires it along with everything
 * else rather than leaving it floating over the scene.
 *
 * Two levels of emphasis, not three: the active tab is gold with a gold rule under
 * it, every other tab is frost at 0.55. A third state would be one more thing to
 * read in a strip whose whole job is to be scannable in one glance.
 *
 * The tagline belongs to the active tab alone. Four taglines at once is a paragraph.
 */

import { useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { VARIANTS, type PlaygroundVariantId } from "./variants";

interface PlaygroundTabsProps {
  activeId: PlaygroundVariantId;
  onSelect: (id: PlaygroundVariantId) => void;
  /** The id whose chunk is still in flight, if any. */
  loadingId: PlaygroundVariantId | null;
}

export function PlaygroundTabs({ activeId, onSelect, loadingId }: PlaygroundTabsProps) {
  const stripRef = useRef<HTMLDivElement>(null);

  /**
   * Roving tabindex: only the active tab is in the tab order, and arrows move
   * between them. This is the ARIA tabs pattern — Tab should get you *past* a tab
   * strip in one press, not walk you through four of them.
   */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const i = VARIANTS.findIndex((v) => v.id === activeId);
      if (i < 0) return;
      let next = -1;
      if (e.key === "ArrowRight") next = (i + 1) % VARIANTS.length;
      else if (e.key === "ArrowLeft") next = (i - 1 + VARIANTS.length) % VARIANTS.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = VARIANTS.length - 1;
      if (next < 0) return;
      e.preventDefault();
      const target = VARIANTS[next]!;
      onSelect(target.id);
      stripRef.current?.querySelector<HTMLElement>(`[data-tab="${target.id}"]`)?.focus();
    },
    [activeId, onSelect],
  );

  const active = VARIANTS.find((v) => v.id === activeId);

  return (
    <Box
      sx={{
        position: "absolute",
        // Above the directory pills, not level with them. At 1280 the pill row
        // reaches x~890 and the strip is centred at 640, so sharing `bottom: 44`
        // put a tab literally on top of "EXPLORE COMMUNITY". The bottom-centre
        // quadrant is free; the bottom-centre *baseline* is not.
        bottom: { md: 116 },
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        opacity: "var(--hp-panel, 1)",
        pointerEvents: "auto",
      }}
    >
      <Box
        ref={stripRef}
        role="tablist"
        aria-label="3D proof-of-concept designs"
        onKeyDown={onKeyDown}
        sx={{ display: "flex", alignItems: "stretch", gap: 3 }}
      >
        {VARIANTS.map((v) => {
          const isActive = v.id === activeId;
          const isLoading = loadingId === v.id;
          return (
            <Box
              key={v.id}
              component="button"
              type="button"
              role="tab"
              data-tab={v.id}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelect(v.id)}
              sx={{
                position: "relative",
                appearance: "none",
                background: "none",
                border: "none",
                cursor: "pointer",
                px: 0.5,
                // Reserves the rule's height at every state, so activating a tab
                // and the loading hairline both cost zero layout shift.
                pt: 0.5,
                pb: 1,
                fontFamily: MONO,
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: isActive ? NOIR.gold : `rgba(${NOIR.frostRgb}, 0.55)`,
                transition: "color 0.2s ease",
                "@media (hover: hover)": {
                  "&:hover": { color: isActive ? NOIR.gold : `rgba(${NOIR.frostRgb}, 0.85)` },
                },
                // A designed focus ring, never the UA default: an inner dark ring so
                // it survives on a light scene and an outer gold one so it survives
                // on a dark one. The strip sits over a canvas whose brightness is
                // the scene's to decide, so it has to work on both.
                "&:focus-visible": {
                  outline: "none",
                  borderRadius: "4px",
                  boxShadow: `0 0 0 2px ${NOIR.navyInk}, 0 0 0 4px ${NOIR.gold}`,
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: isLoading ? "2px" : "1px",
                  backgroundColor: isActive || isLoading ? NOIR.gold : "transparent",
                  opacity: isLoading ? 0.65 : 1,
                  transition: "background-color 0.2s ease",
                  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                },
              }}
            >
              {v.label}
            </Box>
          );
        })}
      </Box>

      <Typography
        aria-live="polite"
        sx={{
          fontFamily: MONO,
          fontSize: "0.65rem",
          letterSpacing: "0.06em",
          color: `rgba(${NOIR.frostRgb}, 0.4)`,
          // Fixed height so swapping between a one-word and a four-word tagline
          // never nudges the strip above it.
          minHeight: "1.2em",
        }}
      >
        {active?.tagline ?? ""}
      </Typography>
    </Box>
  );
}
