import Box from "@mui/material/Box";

// Static SVG feTurbulence tile (ASSET MANIFEST A2) — no rAF, no JS cost.
const GRAIN_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='128' height='128' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function GrainOverlay() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: (theme) => theme.zIndex.tooltip + 1,
        pointerEvents: "none",
        backgroundImage: GRAIN_TILE,
        backgroundRepeat: "repeat",
        opacity: 0.05,
      }}
    />
  );
}
