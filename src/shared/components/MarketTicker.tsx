import { Box } from "@mui/material";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";

export type TickerItem = {
  symbol: string;
  value: string;
  delta?: "up" | "down";
};

/** True facts only — sourced from site content; do not invent numbers. */
export const DEFAULT_TICKER_ITEMS: readonly TickerItem[] = [
  { symbol: "PHIT.DISCIPLINES", value: "4", delta: "up" },
  { symbol: "OFFICES", value: "BGC+CLARK" },
  { symbol: "CLIENTS", value: "US+UK" },
  { symbol: "STACK", value: "C++/PY/MERN" },
  { symbol: "LATENCY BUDGET", value: "µs", delta: "up" },
  { symbol: "R&D NOTES", value: "23/12M" },
  { symbol: "OPEN ROLES", value: "6", delta: "up" },
  { symbol: "GLOBAL-CONTINUITY", value: "24/7" },
];

type MarketTickerProps = {
  items?: readonly TickerItem[];
  dense?: boolean;
};

function TickerRow({
  items,
  wrap,
  hidden,
}: {
  items: readonly TickerItem[];
  wrap: boolean;
  hidden?: boolean;
}) {
  return (
    <Box
      component="span"
      {...(hidden ? { "aria-hidden": true } : {})}
      sx={{
        display: "inline-flex",
        alignItems: "baseline",
        flexWrap: wrap ? "wrap" : "nowrap",
        whiteSpace: "nowrap",
      }}
    >
      {items.map((item, i) => (
        <Box
          key={`${item.symbol}-${i}`}
          component="span"
          sx={{ display: "inline-flex", alignItems: "baseline" }}
        >
          <Box component="span" sx={{ color: NOIR.mist, px: 2 }}>
            {item.symbol}
          </Box>
          <Box component="span" sx={{ color: NOIR.ink }}>
            {item.value}
          </Box>
          {item.delta === "up" && (
            <Box component="span" sx={{ color: NOIR.gold, pl: 0.75 }}>
              ▲
            </Box>
          )}
          {item.delta === "down" && (
            <Box component="span" sx={{ color: NOIR.mist, pl: 0.75 }}>
              ▼
            </Box>
          )}
          <Box component="span" sx={{ color: NOIR.mist, pl: 2 }}>
            ·
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function MarketTicker({
  items = DEFAULT_TICKER_ITEMS,
  dense = false,
}: MarketTickerProps) {
  const reducedMotion = useReducedMotion();

  // Duration scales with tape length so pace stays constant across item sets.
  const chars = items.reduce(
    (n, it) => n + it.symbol.length + it.value.length + 6,
    0,
  );
  const durationS = Math.min(60, Math.max(40, Math.round(chars * 0.4)));

  const frame = {
    borderTop: `1px solid ${NOIR.hairline}`,
    borderBottom: `1px solid ${NOIR.hairline}`,
    bgcolor: NOIR.panel,
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    lineHeight: 1,
    py: dense ? 0.75 : 1.5,
    width: "100%",
  } as const;

  if (reducedMotion) {
    return (
      <Box sx={{ ...frame, display: "flex", justifyContent: "center" }}>
        <TickerRow items={items} wrap />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...frame,
        overflow: "hidden",
        "&:hover .market-ticker-track": { animationPlayState: "paused" },
      }}
    >
      <Box
        className="market-ticker-track"
        sx={{
          display: "inline-flex",
          width: "max-content",
          willChange: "transform",
          animation: `market-ticker-scroll ${durationS}s linear infinite`,
          "@keyframes market-ticker-scroll": {
            from: { transform: "translate3d(0, 0, 0)" },
            to: { transform: "translate3d(-50%, 0, 0)" },
          },
          // Belt+braces with useReducedMotion above.
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        <TickerRow items={items} wrap={false} />
        <TickerRow items={items} wrap={false} hidden />
      </Box>
    </Box>
  );
}
