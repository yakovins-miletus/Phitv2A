import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { motion, useInView } from "motion/react";
import { useRef, useId, useState } from "react";

import { useReducedMotion } from "@/shared/motion";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { WORLD_MAP, WORLD_DOTS_PATH, projectPoint } from "@/shared/components/worldMap";
import PhitopolisLogo from "@/shared/components/PhitopolisLogo";

interface City {
  label: string;
  sub: string;
  lon: number;
  lat: number;
  labelDx: number;
  labelDy: number;
  anchor: "start" | "middle" | "end";
  hideArc?: boolean;
}

const HQ: City = {
  label: "MANILA",
  sub: "GLOBAL HQ · R&D HUB",
  lon: 121.0,
  lat: 14.6,
  labelDx: 30,
  labelDy: -2,
  anchor: "start",
};

const REACH: City[] = [
  { label: "NEW YORK", sub: "CLIENTS & INVESTORS · UTC-5", lon: -74.0, lat: 40.7, labelDx: 0, labelDy: -38, anchor: "middle" },
  { label: "NEW JERSEY", sub: "EXECUTION PRESENCE", lon: -74.0, lat: 40.7, labelDx: -20, labelDy: 16, anchor: "end", hideArc: true },
  { label: "CONNECTICUT", sub: "CAPITAL PARTNERS", lon: -74.0, lat: 40.7, labelDx: 20, labelDy: 16, anchor: "start", hideArc: true },
  { label: "MIAMI", sub: "LATAM GATEWAY", lon: -80.2, lat: 25.7, labelDx: 0, labelDy: 26, anchor: "middle" },
  { label: "LONDON", sub: "EUROPEAN DESK · UTC+0", lon: -0.13, lat: 51.5, labelDx: -16, labelDy: 8, anchor: "end" },
  { label: "HONG KONG", sub: "APAC NETWORK · UTC+8", lon: 114.17, lat: 22.32, labelDx: 22, labelDy: -24, anchor: "start" },
];

function arcPath(from: City, to: City): string {
  const a = projectPoint(from.lon, from.lat);
  const b = projectPoint(to.lon, to.lat);
  const midX = (a.x + b.x) / 2;
  const dist = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  const lift = Math.min(220, Math.max(35, dist * 0.26));
  const midY = Math.min(a.y, b.y) - lift;
  return `M ${String(a.x)} ${String(a.y)} Q ${String(midX)} ${String(midY)} ${String(b.x)} ${String(b.y)}`;
}

export function ReachMap() {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.2 });
  const uid = useId();
  const [activeCity, setActiveCity] = useState<string | null>(null);

  const land = theme.palette.primary.main;

  const show = reduced === true || inView;

  const hq = projectPoint(HQ.lon, HQ.lat);

  return (
    <Box
      ref={rootRef}
      sx={{
        position: "relative",
        width: 1,
        borderRadius: { xs: 3, md: 5 },
        overflow: "hidden",
        bgcolor: "rgba(255, 255, 255, 0.96)",
        border: "1px solid rgba(10, 42, 102, 0.1)",
        boxShadow: "0 24px 64px -16px rgba(10, 42, 102, 0.08)",
      }}
    >
      {/* Top Telemetry Strip */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: { xs: 2.5, md: 4 },
          py: 1.5,
          borderBottom: "1px solid rgba(10, 42, 102, 0.08)",
          bgcolor: "rgba(10, 42, 102, 0.02)",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: NOIR.live }} />
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: NOIR.navyField,
              textTransform: "uppercase",
            }}
          >
            GLOBAL CO-LOCATION TOPOLOGY // ACTIVE
          </Typography>
        </Stack>

        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: "0.6875rem",
            color: NOIR.mist,
            letterSpacing: "0.12em",
            display: { xs: "none", sm: "block" },
          }}
        >
          DIRECT OPTICAL BACKBONE · UTC ROTATION
        </Typography>
      </Box>

      {/* SVG World Map Viewport */}
      <Box sx={{ position: "relative", width: "100%" }}>
        <svg
          viewBox={`0 0 ${String(WORLD_MAP.width)} ${String(WORLD_MAP.height)}`}
          width="100%"
          role="img"
          aria-labelledby="reach-title reach-desc"
          style={{ display: "block" }}
        >
          <defs>
            <pattern id={`sea-pattern-${uid}`} x="7" y="7" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="1.5" fill={theme.palette.primary.main} opacity={0.12} />
            </pattern>

            <filter id={`arcGlow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id={`arcGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={NOIR.goldDark} stopOpacity="0.8" />
              <stop offset="50%" stopColor={NOIR.gold} stopOpacity="1" />
              <stop offset="100%" stopColor={NOIR.goldLight} stopOpacity="0.9" />
            </linearGradient>
          </defs>

          <title id="reach-title">Global reach from one Manila headquarters</title>
          <desc id="reach-desc">
            A dotted world map: the single Phitopolis headquarters in Manila
            connects by arcs to New York in the United States, London in the
            United Kingdom, and Hong Kong — representing clients, investors, and
            leadership experience, not offices.
          </desc>

          {/* Clean Map Base Ground */}
          <rect width={WORLD_MAP.width} height={WORLD_MAP.height} fill={NOIR.almostWhite} />
          {/* Subtle Ambient Ocean Grid */}
          <rect width={WORLD_MAP.width} height={WORLD_MAP.height} fill={`url(#sea-pattern-${uid})`} />

          {/* Land Mass Geometry */}
          <path
            d={WORLD_DOTS_PATH}
            fill="none"
            stroke={land}
            strokeWidth="3.8"
            strokeLinecap="round"
          />

          {/* Reach Arcs: navy structure at rest, gold only while examined */}
          {REACH.filter((c) => !c.hideArc).map((city, index) => {
            const isHovered = activeCity === city.label;
            return (
              <g key={`arc-group-${city.label}`}>
                {/* Background glow halo — only present on hover, when gold is meaningful */}
                <motion.path
                  d={arcPath(HQ, city)}
                  fill="none"
                  stroke={NOIR.gold}
                  strokeWidth={isHovered ? 4 : 0}
                  strokeOpacity={isHovered ? 0.4 : 0}
                  filter={`url(#arcGlow-${uid})`}
                  initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={show ? { pathLength: 1 } : false}
                  transition={{ duration: 1, delay: index * 0.2, ease: "easeInOut" }}
                />
                {/* Foreground line: navy structure at rest, gold gradient on hover */}
                <motion.path
                  d={arcPath(HQ, city)}
                  fill="none"
                  stroke={isHovered ? `url(#arcGrad-${uid})` : NOIR.navyField}
                  strokeOpacity={isHovered ? 1 : 0.45}
                  strokeWidth={isHovered ? 2.5 : 1.25}
                  strokeDasharray={isHovered ? "none" : "6 3"}
                  initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={show ? { pathLength: 1 } : false}
                  transition={{ duration: 1, delay: index * 0.2, ease: "easeInOut" }}
                />
              </g>
            );
          })}

          {/* Traveling Photon Pulses along Arcs */}
          {!reduced && inView && REACH.filter((c) => !c.hideArc).map((city, index) => (
            <g key={`pulse-${city.label}`}>
              <circle r="4" fill={NOIR.goldLight} filter={`url(#arcGlow-${uid})`}>
                <animateMotion
                  dur={`${String(2.6 + index * 0.4)}s`}
                  repeatCount="indefinite"
                  begin={`${String(1.2 + index * 0.3)}s`}
                  path={arcPath(HQ, city)}
                />
              </circle>
              <circle r="2" fill={NOIR.white}>
                <animateMotion
                  dur={`${String(2.6 + index * 0.4)}s`}
                  repeatCount="indefinite"
                  begin={`${String(1.2 + index * 0.3)}s`}
                  path={arcPath(HQ, city)}
                />
              </circle>
            </g>
          ))}

          {/* Manila HQ Concentric Radar Rings */}
          {!reduced && inView && [0, 1, 2].map((ring) => (
            <motion.circle
              key={`radar-${String(ring)}`}
              cx={hq.x}
              cy={hq.y}
              r="12"
              fill="none"
              stroke={NOIR.gold}
              strokeWidth="1.5"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={show ? { scale: [1, 3.8], opacity: [0.7, 0] } : false}
              transition={{ duration: 2.4, repeat: Infinity, delay: ring * 0.8, ease: "easeOut" }}
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
            />
          ))}

          {/* Destination City Pin Vertices: navy at rest, gold only while examined */}
          {REACH.map((city) => {
            const p = projectPoint(city.lon, city.lat);
            const isHovered = activeCity === city.label;
            return (
              <g key={`pin-${city.label}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6.5 : 5}
                  fill={NOIR.white}
                  stroke={isHovered ? NOIR.goldDark : NOIR.navyField}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  strokeOpacity={isHovered ? 1 : 0.6}
                  filter={isHovered ? `url(#arcGlow-${uid})` : undefined}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 3 : 2}
                  fill={isHovered ? NOIR.gold : NOIR.navyField}
                  fillOpacity={isHovered ? 1 : 0.6}
                />
              </g>
            );
          })}

          {/* Manila HQ Center Marker */}
          <circle cx={hq.x} cy={hq.y} r="9" fill={NOIR.navyPanel} stroke={NOIR.goldDark} strokeWidth="2.5" />
          <circle cx={hq.x} cy={hq.y} r="4" fill={NOIR.goldLight} />
        </svg>

        {/* HTML Tactical Labels Overlay */}
        {REACH.map((city) => {
          const p = projectPoint(city.lon, city.lat);
          const isHovered = activeCity === city.label;
          return (
            <Box
              key={`label-${city.label}`}
              onMouseEnter={() => setActiveCity(city.label)}
              onMouseLeave={() => setActiveCity(null)}
              sx={{
                position: "absolute",
                left: `${((p.x + city.labelDx) / WORLD_MAP.width) * 100}%`,
                top: `${((p.y + city.labelDy - 12) / WORLD_MAP.height) * 100}%`,
                width: "max-content",
                bgcolor: isHovered ? NOIR.navyField : "rgba(255, 255, 255, 0.95)",
                border: "1px solid",
                borderColor: isHovered ? NOIR.gold : "rgba(10, 42, 102, 0.18)",
                color: isHovered ? NOIR.frost : NOIR.navyDeep,
                px: 1.25,
                py: 0.5,
                borderRadius: 1.5,
                fontFamily: MONO,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                whiteSpace: "nowrap",
                boxShadow: isHovered
                  ? "0 8px 20px rgba(10, 42, 102, 0.2)"
                  : "0 2px 8px rgba(10, 42, 102, 0.06)",
                transform:
                  city.anchor === "middle"
                    ? "translate(-50%, 0)"
                    : city.anchor === "end"
                    ? "translate(-100%, 0)"
                    : "none",
                cursor: "default",
                zIndex: isHovered ? 5 : 2,
                transition: "all 0.25s ease",
              }}
            >
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    bgcolor: isHovered ? NOIR.goldLight : NOIR.navyField,
                  }}
                />
                <Box>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: MONO,
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      display: "block",
                    }}
                  >
                    {city.label}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          );
        })}

        {/* Manila HQ Badge */}
        <Box
          sx={{
            position: "absolute",
            left: `${((hq.x + HQ.labelDx) / WORLD_MAP.width) * 100}%`,
            top: `${((hq.y + HQ.labelDy - 12) / WORLD_MAP.height) * 100}%`,
            width: "max-content",
            bgcolor: NOIR.navyField,
            border: `1.5px solid ${NOIR.gold}`,
            color: NOIR.frost,
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            fontFamily: MONO,
            boxShadow: `0 4px 16px rgba(${NOIR.goldRgb}, 0.25)`,
            transform: "none",
            zIndex: 4,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: NOIR.live }} />
            <Box>
              <Typography
                component="span"
                sx={{
                  fontFamily: MONO,
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  color: NOIR.gold,
                  display: "block",
                  lineHeight: 1.1,
                }}
              >
                {HQ.label} · HQ
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontFamily: MONO,
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "rgba(244, 247, 252, 0.7)",
                  letterSpacing: "0.08em",
                  display: "block",
                }}
              >
                PRIMARY R&D FLOOR
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Manila HQ Center Monogram Badge */}
        <Box
          sx={{
            position: "absolute",
            left: `${(hq.x / WORLD_MAP.width) * 100}%`,
            top: `${(hq.y / WORLD_MAP.height) * 100}%`,
            transform: "translate(-50%, -50%)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            bgcolor: NOIR.navyDeep,
            border: `2px solid ${NOIR.gold}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 16px rgba(${NOIR.goldRgb}, 0.35)`,
            pointerEvents: "none",
            zIndex: 4,
          }}
        >
          <PhitopolisLogo
            color={NOIR.frost}
            accentColor={NOIR.gold}
            style={{ width: "22px", height: "22px" }}
          />
        </Box>
      </Box>

      {/* Bottom Telemetry Footer */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
          p: { xs: 2, md: 3 },
          borderTop: "1px solid rgba(10, 42, 102, 0.08)",
          bgcolor: "rgba(10, 42, 102, 0.02)",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.625rem",
              letterSpacing: "0.14em",
              color: NOIR.mist,
              textTransform: "uppercase",
            }}
          >
            EXECUTION PRESENCE
          </Typography>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.75rem",
              fontWeight: 700,
              color: NOIR.navyField,
              mt: 0.25,
            }}
          >
            US · UK · APAC HUBS
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.625rem",
              letterSpacing: "0.14em",
              color: NOIR.mist,
              textTransform: "uppercase",
            }}
          >
            SYNCHRONIZED CADENCE
          </Typography>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.75rem",
              fontWeight: 700,
              color: NOIR.navyField,
              mt: 0.25,
            }}
          >
            24/7 OVERNIGHT HANDOFF
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.625rem",
              letterSpacing: "0.14em",
              color: NOIR.mist,
              textTransform: "uppercase",
            }}
          >
            HEADQUARTERS
          </Typography>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.75rem",
              fontWeight: 700,
              color: NOIR.navyField,
              mt: 0.25,
            }}
          >
            BONIFACIO GLOBAL CITY, PH
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
