import Box from "@mui/material/Box";
import type { ReactNode, Ref } from "react";

import { STAGE_ATTR } from "@/shared/sections";

/**
 * The bare full-viewport stage shell: 100vh, clipped, centred, hairline top and
 * bottom, and marked with STAGE_ATTR so it registers as a stage element.
 *
 * DELIBERATELY NOT StageSection. StageSection layers on useStagePresence, the
 * spotlight scrub, the stage-kicker-line tween, Container/Stack wrappers and an
 * optional muted band. Swapping it in here would change the DOM *and* register
 * two additional ScrollTriggers, which would write new active-section values
 * and change what the EyeFlow rail highlights. The two sections that use this
 * shell need to own their internals — a pinned video player and a two-panel
 * scrub — so they take the shell and nothing else, and call useStagePresence
 * themselves.
 *
 * Keep the sx key order as written. Emotion serialises the object in insertion
 * order, so reordering changes the generated class name for identical CSS.
 */
export function RawStage({
  id,
  bgcolor,
  ref,
  children,
}: {
  id: string;
  bgcolor: string;
  ref?: Ref<HTMLElement>;
  children: ReactNode;
}) {
  return (
    <Box
      component="section"
      ref={ref}
      id={id}
      {...{ [STAGE_ATTR]: "" }}
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        bgcolor,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderTop: 1,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      {children}
    </Box>
  );
}
