import type { RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { setActiveSection } from "@/shared/sections";
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";

gsap.registerPlugin(ScrollTrigger);

/** Shared stage building blocks used by BOTH `StageSection` and its successor
 *  `SectionBeat`. They live here, in a module neither of those imports from the
 *  other, purely to keep `StageSection` (now a thin alias over `SectionBeat`)
 *  from forming an import cycle with it. `StageSection.tsx` re-exports both, so
 *  every existing `import { useStagePresence } from ".../StageSection"` keeps
 *  working untouched. */

/** Reports a section as active while it occupies the viewport middle.
 *  Headless — used by StageSection/SectionBeat and by sections that keep their
 *  own layout (hero, pinned use-cases). Runs under reduced motion too: the dot
 *  rail is informational and must keep tracking. */
export function useStagePresence(
  ref: RefObject<HTMLElement | null>,
  id: string,
  /** Page-order index; refreshes with (and at the same priority as) the
   *  section's own reveal trigger. Omit to leave priority unset. */
  order?: number,
): void {
  useGSAP(
    () => {
      if (!ref.current) return;
      ScrollTrigger.create({
        trigger: ref.current,
        // NOT a reveal threshold — see beatThresholds.ts. This is a presence
        // tracker for the dot rail: "occupies the viewport middle", not "has
        // entered far enough to play". Deliberately exempt from BEAT_START.
        start: "top 50%",
        end: "bottom 50%",
        ...(order === undefined ? {} : { refreshPriority: refreshPriorityFor(order) }),
        onToggle: (self) => {
          if (self.isActive) setActiveSection(id);
        },
      });
    },
    { scope: ref, dependencies: [id, order] },
  );
}
