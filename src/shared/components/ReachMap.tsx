import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { WORLD_MAP, WORLD_DOTS_PATH, projectPoint } from "@/shared/components/worldMap";
import PhitopolisLogo from "@/shared/components/PhitopolisLogo";

// ASSET MANIFEST A1 — dotted world map with reach arcs, flat on plain white:
// land mass in brand navy, arcs in gold. Exactly ONE HQ marker (Manila);
// arcs denote clients/investors/leadership REACH, never offices.

interface City {
  label: string;
  lon: number;
  lat: number;
  labelDx: number;
  labelDy: number;
  anchor: "start" | "middle" | "end";
  hideArc?: boolean;
}

const HQ: City = { label: "MANILA · HQ", lon: 121.0, lat: 14.6, labelDx: 28, labelDy: -3, anchor: "start" };
const REACH: City[] = [
  { label: "NEW YORK", lon: -74.0, lat: 40.7, labelDx: 0, labelDy: -36, anchor: "middle" },
  { label: "NEW JERSEY", lon: -74.0, lat: 40.7, labelDx: -20, labelDy: 16, anchor: "end", hideArc: true },
  { label: "CONNECTICUT", lon: -74.0, lat: 40.7, labelDx: 20, labelDy: 16, anchor: "start", hideArc: true },
  { label: "MIAMI", lon: -80.2, lat: 25.7, labelDx: 0, labelDy: 24, anchor: "middle" },
  { label: "LONDON · UK", lon: -0.13, lat: 51.5, labelDx: -14, labelDy: 6, anchor: "end" },
  { label: "HONG KONG", lon: 114.17, lat: 22.32, labelDx: 20, labelDy: -22, anchor: "start" },
];

function arcPath(from: City, to: City): string {
  const a = projectPoint(from.lon, from.lat);
  const b = projectPoint(to.lon, to.lat);
  const midX = (a.x + b.x) / 2;
  const dist = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  // Lift based on total distance ensures a nice organic arc for all connections
  const lift = Math.min(200, Math.max(30, dist * 0.25));
  const midY = Math.min(a.y, b.y) - lift;
  return `M ${String(a.x)} ${String(a.y)} Q ${String(midX)} ${String(midY)} ${String(b.x)} ${String(b.y)}`;
}

export function ReachMap() {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  // Looping pulses/radar mount only while the map is actually on screen.
  const inView = useInView(rootRef, { amount: 0.2 });
  const land = theme.palette.primary.main;
  const arc = NOIR.gold; // Use brighter gold for better visibility on white

  // Lock animation once triggered — acts as `once: true` without relying on
  // per-element IntersectionObservers that may miss on fast scroll.
  const hasPlayed = useRef(false);
  if (inView) hasPlayed.current = true;
  const show = reduced === true || hasPlayed.current;

  const hq = projectPoint(HQ.lon, HQ.lat);

  return (
    <Box ref={rootRef} sx={{ position: "relative", width: 1, overflow: "hidden", borderRadius: { xs: 0, md: 4 } }}>
      <svg
        viewBox={`0 0 ${String(WORLD_MAP.width)} ${String(WORLD_MAP.height)}`}
        width="100%"
        role="img"
        aria-labelledby="reach-title reach-desc"
        style={{ display: "block" }}
      >
        <defs>
          <pattern id="sea-pattern" x="7" y="7" width="13" height="13" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="2" fill={theme.palette.primary.main} opacity={0.15} />
          </pattern>
        </defs>
        <title id="reach-title">Global reach from one Manila headquarters</title>
        <desc id="reach-desc">
          A dotted world map: the single Phitopolis headquarters in Manila
          connects by arcs to New York in the United States, London in the
          United Kingdom, and Hong Kong — representing clients, investors, and
          leadership experience, not offices.
        </desc>
        {/* Flat plain-white ground — no gradients, no tints. */}
        <rect width={WORLD_MAP.width} height={WORLD_MAP.height} fill={NOIR.panel} />
        {/* Sea dots backdrop */}
        <rect width={WORLD_MAP.width} height={WORLD_MAP.height} fill="url(#sea-pattern)" />

        {/* Land mass — one path of round-capped zero-length segments. */}
        <path
          d={WORLD_DOTS_PATH}
          fill="none"
          stroke={land}
          strokeWidth="4"
          strokeLinecap="round"
        />

        {REACH.filter(c => !c.hideArc).map((city, index) => (
          <motion.path
            key={city.label}
            d={arcPath(HQ, city)}
            fill="none"
            stroke={arc}
            strokeWidth="2"
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={show ? { pathLength: 1 } : false}
            transition={{ duration: 0.9, delay: index * 0.25, ease: "easeInOut" }}
          />
        ))}

        {reduced === true || !inView
          ? null
          : REACH.filter(c => !c.hideArc).map((city, index) => (
              // Traveling signal pulses along each arc — declarative SMIL,
              // zero JS cost, mounted only while visible under no-preference.
              <circle key={`pulse-${city.label}`} r="2.5" fill={NOIR.gold} opacity="0.9">
                <animateMotion
                  dur={`${String(2.6 + index * 0.5)}s`}
                  repeatCount="indefinite"
                  begin={`${String(1.4 + index * 0.3)}s`}
                  path={arcPath(HQ, city)}
                />
              </circle>
            ))}

        {reduced === true || !inView
          ? null
          : [0, 1].map((ring) => (
              <motion.circle
                key={`radar-${String(ring)}`}
                cx={hq.x}
                cy={hq.y}
                r="10"
                fill="none"
                stroke={NOIR.gold}
                strokeWidth="1"
                initial={{ scale: 1, opacity: 0 }}
                animate={show ? { scale: [1, 3.2], opacity: [0.5, 0] } : false}
                transition={{ duration: 2, repeat: 2, delay: 1.2 + ring * 1 }}
                style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              />
            ))}

        {REACH.map((city) => {
          const p = projectPoint(city.lon, city.lat);
          return (
            <g key={city.label}>
              <circle cx={p.x} cy={p.y} r="4.5" fill={NOIR.panel} stroke={arc} strokeWidth="2" />
            </g>
          );
        })}

        <motion.circle
          cx={hq.x}
          cy={hq.y}
          r="7"
          fill={NOIR.gold}
          initial={{ scale: 1 }}
          animate={show && !reduced ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.8, repeat: 2, delay: 1.2 }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />
      </svg>

      {/* HTML Labels overlay: avoids Safari foreignObject clipping/ghosting bugs */}
      {REACH.map((city) => {
        const p = projectPoint(city.lon, city.lat);
        return (
          <Box
            key={`label-${city.label}`}
            sx={{
              position: "absolute",
              left: `${((p.x + city.labelDx) / WORLD_MAP.width) * 100}%`,
              top: `${((p.y + city.labelDy - 12) / WORLD_MAP.height) * 100}%`,
              width: "max-content",
              bgcolor: "white",
              border: `1px solid ${theme.palette.primary.main}`,
              color: "var(--accent-fg)",
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontFamily: MONO,
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
              transform:
                city.anchor === "middle"
                  ? "translate(-50%, 0)"
                  : city.anchor === "end"
                  ? "translate(-100%, 0)"
                  : "none",
              pointerEvents: "none",
            }}
          >
            {city.label}
          </Box>
        );
      })}

      <Box
        sx={{
          position: "absolute",
          left: `${((hq.x + HQ.labelDx) / WORLD_MAP.width) * 100}%`,
          top: `${((hq.y + HQ.labelDy - 12) / WORLD_MAP.height) * 100}%`,
          width: "max-content",
          bgcolor: "white",
          border: `1px solid ${theme.palette.primary.main}`,
          color: "var(--accent-fg)",
          px: 1,
          py: 0.25,
          borderRadius: 1,
          fontFamily: MONO,
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.14em",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
          transform:
            HQ.anchor === "middle"
              ? "translate(-50%, 0)"
              : HQ.anchor === "end"
              ? "translate(-100%, 0)"
              : "none",
          pointerEvents: "none",
        }}
      >
        {HQ.label}
      </Box>

      <Box
        sx={{
          position: "absolute",
          left: `${(hq.x / WORLD_MAP.width) * 100}%`,
          top: `${(hq.y / WORLD_MAP.height) * 100}%`,
          transform: "translate(-50%, -50%)",
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          bgcolor: "white",
          border: `1.5px solid ${theme.palette.primary.main}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <PhitopolisLogo
          color={theme.palette.primary.main}
          accentColor={NOIR.gold}
          style={{ width: "20px", height: "20px" }}
        />
      </Box>
    </Box>
  );
}
