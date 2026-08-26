// `StageSection` (the component) is gone — every call site migrated directly
// to `SectionBeat` in Phase 6 (see the plan's Phase 6 Step 3). This module
// stays alive purely as the stable import path for one re-export that many
// files still reach through it:
//
//   import { StageKicker } from "@/shared/components/StageSection";
//
// The implementation lives in `stage/StageKicker.tsx`, so this file does not
// import `SectionBeat` and cannot form an import cycle with it.
// (`useStagePresence` used to be re-exported here too — it now must be
// imported directly from `stage/stagePresence.ts`, a bare re-export tripped
// the `react-refresh/only-export-components` lint rule.)
export { StageKicker } from "@/shared/components/stage/StageKicker";
