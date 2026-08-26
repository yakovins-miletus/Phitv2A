import Box from "@mui/material/Box";
import { DEFAULT_BAND } from "./groundStops";

/**
 * A buffer section meant for the pixel-by-pixel ground transitions.
 * Gives the WebGL tile wipe enough room to complete its transition
 * in empty space, rather than lingering over section content.
 */
export function GroundTransitionBuffer() {
  return (
    <Box
      className="ground-transition-buffer"
      aria-hidden
      sx={{
        width: "100%",
        // Provide exactly the band height so the transition finishes in this empty space.
        height: DEFAULT_BAND,
      }}
    />
  );
}
