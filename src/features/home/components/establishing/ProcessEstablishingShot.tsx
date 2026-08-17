import { MajorEstablishingShot } from "@/shared/components/establishing/MajorEstablishingShot";

/** `selfDriven` is forwarded so a parent `SectionBeat` can render this shot
 *  presentationally (markup only) and drive its steps on the beat's own
 *  timeline. Defaults to the shot's own default (`true`) when omitted. */
export function ProcessEstablishingShot({ selfDriven }: { selfDriven?: boolean }) {
  return (
    <MajorEstablishingShot
      id="shot-process"
      title="From Problem"
      titleAccent="To Production."
      // `process`'s ground is `deep` (navy) — see sections.ts. Without this,
      // the title renders in `MajorEstablishingShot`'s light-mode default
      // (navy text) on a navy backdrop.
      dark
      {...(selfDriven === undefined ? {} : { selfDriven })}
    />
  );
}
