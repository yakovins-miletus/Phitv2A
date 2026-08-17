import { MajorEstablishingShot } from "@/shared/components/establishing/MajorEstablishingShot";

/** `selfDriven` is forwarded so a parent `SectionBeat` can render this shot
 *  presentationally (markup only) and drive its steps on the beat's own
 *  timeline. Defaults to the shot's own default (`true`) when omitted. */
export function SeamEstablishingShot({ selfDriven }: { selfDriven?: boolean }) {
  return (
    <MajorEstablishingShot
      id="shot-seam"
      title="That is the work."
      titleAccent="These are the people who do it."
      // `daily-life`'s ground is `deep` (navy) — see sections.ts. Without this,
      // the title renders in `MajorEstablishingShot`'s light-mode default
      // (navy text) on a navy backdrop.
      dark
      {...(selfDriven === undefined ? {} : { selfDriven })}
    />
  );
}
