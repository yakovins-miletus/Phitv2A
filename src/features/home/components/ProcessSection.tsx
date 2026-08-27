import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { CONTENT } from "@/shared/content";
import { ProcessDiagram } from "@/shared/components/diagrams/ProcessDiagram";
import { NOIR } from "@/shared/theme/palette";
import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { useNavbarAnchor } from "@/shared/components/navbarHooks";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { homeSection } from "@/shared/sections";

export function ProcessSection() {
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.PROCESS_IMMERSIVE, { dark: true });

  return (
    /**
     * No `establishing` shot, unlike every other beat on this page.
     *
     * `establishScale: "mini"` still reserves 0.5 screens for a title card. The
     * section as a whole has a one-viewport budget (ADR-0002), so a half-screen
     * announcement would leave ~218px for the composition it announces — the
     * measured breakdown at 1440x757 was 80 + 379 (shot) + 695 + 80 = 1234px.
     * The shot's copy moves inline below, where it sits *in* the composition
     * rather than in front of it. That is also the better read: the growth
     * diagram is itself the establishing image, and two announcements for one
     * screen of content is one too many.
     *
     * `ProcessEstablishingShot.tsx` is kept — `/services` is the likely reuse —
     * but it now has no caller on the home page.
     */
    <SectionBeat section={homeSection("process")}>
      <Box
        ref={anchorRef}
        sx={{
          bgcolor: NOIR.navyDeep,
          color: NOIR.frost,
          zIndex: 1,
          overflow: "hidden",
          borderTop: "1px solid rgba(255, 199, 44, 0.2)",
          borderBottom: "1px solid rgba(255, 199, 44, 0.2)",
          py: { xs: 3, md: 7 },
          /**
           * Break out of SectionBeat's `Container maxWidth="xl"`.
           *
           * The old `width: 100vw; ml/mr: calc(50% - 50vw)` version left a visible
           * gutter down both sides instead of bleeding to the true viewport edge.
           * `margin-left/right` percentages resolve against the CONTAINING BLOCK's
           * width — here, the Container's own content-box width (maxWidth minus its
           * padding), not the viewport — so `50%` was 50% of ~1280px, not of the
           * 100vw the other half of the expression assumed. The residual offset was
           * exactly the Container's own gutter, which is why it read as "almost"
           * full-bleed rather than obviously broken.
           *
           * `left: 50%` + `transform: translateX(-50%)` is agnostic to that: `left`
           * still resolves against the Container's width, landing this box's left
           * edge on the CONTAINER's horizontal center — but `translateX(-50%)`
           * resolves against this box's OWN width (100vw), shifting it left by
           * exactly half the viewport. Since MUI's `Container` is itself centered
           * in the viewport by default, the container's center IS the viewport's
           * center, so the two offsets cancel to the true viewport edge regardless
           * of the Container's maxWidth or padding — no ancestor-width assumption
           * baked into the math this time.
           */
          position: "relative",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100vw",
          /**
           * Fill the beat, don't float inside it.
           *
           * `SectionBeat` sets `minHeight: 100svh` on the <section> and
           * `py: { xs: 6, md: 10 }` (48px / 80px) on it — see SectionBeat.tsx:475
           * and :486. This slab is content-height, so once the section stopped
           * being 4 viewports tall the navy ended well short of the section's
           * own box and the whole thing read as a floating panel with white
           * bands above and below it. Subtracting that padding makes the slab
           * exactly as tall as the beat and keeps the section at 1.00 screens.
           *
           * The two numbers are duplicated here; SectionBeat exports no token
           * for them. If its `py` changes, this changes with it.
           */
          minHeight: { xs: "calc(100svh - 96px)", md: "calc(100svh - 160px)" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* Industrial Grid Background & Scanlines */}
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />

        {/* Full-width growth canvas — see ADR-0002 for the still-binding
            one-viewport / reduced-motion / disqualified-shapes constraints;
            the containment metaphor it chose has been replaced. */}
        <Box sx={{ width: "100%", px: { xs: 2, md: 6, lg: 8 }, position: "relative", zIndex: 2 }}>
          <Box sx={{ maxWidth: 1320, mx: "auto", mb: { xs: 1.5, md: 3 } }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "1.4rem", md: "2.15rem" },
                fontWeight: 800,
                lineHeight: 1.15,
                color: NOIR.frost,
              }}
            >
              From our practices, our business gradually grew into a{" "}
              <Box component="span" sx={{ color: NOIR.gold }}>
                development powerhouse.
              </Box>
            </Typography>
          </Box>
          <ProcessDiagram model={CONTENT.process} />
        </Box>
      </Box>
    </SectionBeat>
  );
}
