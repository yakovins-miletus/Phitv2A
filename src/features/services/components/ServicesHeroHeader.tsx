import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { VideoPageHero } from "@/shared/components/VideoPageHero";
import { SERVICES_LOOP } from "@/shared/components/useBackgroundVideo";

/**
 * The /services cinematic video header — unified with /blog and /careers via
 * `VideoPageHero`. Full-bleed dark stage; the category filter now lives on the
 * light ground with the service list (see `ServicesCategoryFilter`), not in the
 * hero.
 */
export function ServicesHeroHeader() {
  return (
    <VideoPageHero
      anchor={NAV_ANCHORS.SERVICES_HERO}
      loop={SERVICES_LOOP}
      eyebrow="Engineering Capabilities & R&D"
      headline="High-performance engines for global markets."
      lead="Low-latency C++ trading systems, quantitative signal extraction, cloud-native platforms, and 24/7 site reliability — mission-critical financial technology, designed, built, and operated."
    />
  );
}
