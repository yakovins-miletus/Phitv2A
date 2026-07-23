import { useGSAP } from "@gsap/react";
import Typography from "@mui/material/Typography";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import { NOIR } from "@/shared/theme/palette";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Premium display type that fills from light navy to solid navy as it scrubs
    through the viewport (declared paint exception: background-size on a bounded
    text element). Solid navy under reduced motion. */
export function FillText({ text, onComplete }: { text: string; onComplete?: (completed: boolean) => void }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(".fill-text", { backgroundSize: "0% 100%, 100% 100%" });
        gsap.to(".fill-text", {
          backgroundSize: "100% 100%, 100% 100%",
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: "top 85%",
            end: "top 55%",
            scrub: SCROLL_SPEED,
            onUpdate: (self) => {
              if (onComplete) {
                onComplete(self.progress === 1);
              }
            },
          },
        });
      });
    },
    { scope },
  );

  return (
    <div ref={scope}>
      <Typography
        variant="h1"
        component="p"
        className="fill-text"
        sx={{
          textTransform: "uppercase",
          color: "transparent",
          backgroundImage: (theme) =>
            `linear-gradient(${theme.palette.primary.main}, ${theme.palette.primary.main}),
             linear-gradient(rgba(${NOIR.navyFieldRgb}, 0.12), rgba(${NOIR.navyFieldRgb}, 0.12))`,
          backgroundRepeat: "no-repeat, no-repeat",
          backgroundPosition: "left center, left center",
          backgroundSize: "100% 100%, 100% 100%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        {text === "Core Competencies" ? (
          <>
            Core Compe
            <span style={{ marginLeft: "0.04em" }}>t</span>
            encies
          </>
        ) : (
          text
        )}
      </Typography>
    </div>
  );
}
