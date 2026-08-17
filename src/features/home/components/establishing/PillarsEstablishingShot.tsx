import { MajorEstablishingShot } from "@/shared/components/establishing/MajorEstablishingShot";

/** `selfDriven` is forwarded so a parent `SectionBeat` can render this shot
 *  presentationally (markup only) and drive its steps on the beat's own
 *  timeline. Defaults to the shot's own default (`true`) when omitted. */
export function PillarsEstablishingShot({ selfDriven }: { selfDriven?: boolean }) {
  return (
    <MajorEstablishingShot
      id="shot-pillars"
      title="Our Three Operating Pillars"
      {...(selfDriven === undefined ? {} : { selfDriven })}
    />
  );
}
