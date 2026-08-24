import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { MONO, TYPE_SCALE } from "@/shared/theme/theme";

interface ImagePlaceholderProps {
  /** Width/height ratio, e.g. 4 / 3 or "16 / 9". Reserves space up front so
   *  swapping in the real asset later causes no layout shift. */
  aspectRatio: number | string;
  /** Short caption shown inside the slot. */
  label: string;
  /** Name of the asset the client is expected to supply, for the data
   *  attribute and HTML comment below (e.g. "product-shot.webp"). */
  assetName?: string;
  /** Expected pixel dimensions of the final asset, e.g. "1200x900". */
  dimensions?: string;
  sx?: object;
}

/**
 * Empty, bordered slot for an image the client will supply later.
 *
 * Reserves its box via `aspectRatio` so no layout shift occurs when a real
 * `<img>`/`<picture>` replaces it. Never fetches a remote placeholder image
 * and never fakes a photo with CSS - it stays visibly empty, on a subtle
 * frost-tinted ground, so it reads as "asset pending" rather than as content.
 */
export function ImagePlaceholder({
  aspectRatio,
  label,
  assetName = "unspecified",
  dimensions = "unspecified",
  sx,
}: ImagePlaceholderProps) {
  return (
    <Box
      // Names the expected asset/dimensions for whoever wires in the real
      // image later - grep-able, and inert in production markup.
      data-placeholder-asset={assetName}
      data-placeholder-dimensions={dimensions}
      sx={{
        aspectRatio,
        width: "100%",
        border: "1px dashed rgba(244, 247, 252, 0.28)",
        bgcolor: "rgba(244, 247, 252, 0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 2,
        ...sx,
      }}
    >
      {/* Expected: {assetName} at {dimensions} */}
      <Typography
        sx={{
          fontFamily: MONO,
          fontSize: TYPE_SCALE.micro,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(244, 247, 252, 0.45)",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
