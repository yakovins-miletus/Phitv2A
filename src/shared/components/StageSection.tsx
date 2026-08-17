// `StageSection` (the component) is gone — every call site migrated directly
// to `SectionBeat` in Phase 6 (see the plan's Phase 6 Step 3). This module
// stays alive purely as the stable import path for two re-exports that many
// files still reach through it:
//
//   import { useStagePresence } from "@/shared/components/StageSection";
//   import { StageKicker } from "@/shared/components/StageSection";
//
// Both implementations live in `stage/stagePresence.ts` and
// `stage/StageKicker.tsx` respectively, so this file does not import
// `SectionBeat` and cannot form an import cycle with it.
export { useStagePresence } from "@/shared/components/stage/stagePresence";
export { StageKicker } from "@/shared/components/stage/StageKicker";
