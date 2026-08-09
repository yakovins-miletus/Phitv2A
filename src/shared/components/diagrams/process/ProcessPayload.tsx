import Box from "@mui/material/Box";
import { motion, useTransform, type MotionValue } from "motion/react";

import PhitopolisLogo from "../../PhitopolisLogo";
import { NOIR } from "@/shared/theme/palette";

/**
 * The thing that travels down the pipeline.
 *
 * One object, six states. It is the section's single primary emphasis (taste
 * commitment 4: one obvious first stop), so nothing else in the diagram moves
 * on its own — the nodes only respond to it arriving.
 *
 * All six layers are mounted at once and crossfaded off a single `stage`
 * MotionValue. That is deliberate: mounting/unmounting per stage would put six
 * React renders on the scroll path and drop the whole thing off the
 * compositor. Every layer animates opacity and transform only.
 */

/** All layers draw into this box so a stage change never shifts geometry. */
const VIEW = 64;

/** Dot positions, in viewBox units. `raw` is deliberately irregular — an idea
 *  is not a tidy hexagon — and `framed` is the same seven dots pulled onto the
 *  ring, so the crossfade between them reads as convergence rather than a
 *  swap. Keep the two arrays the same length or that read breaks. */
const RAW_DOTS = [
  [18, 20],
  [40, 15],
  [47, 30],
  [26, 34],
  [15, 42],
  [38, 46],
  [30, 25],
] as const;

const RING_RADIUS = 22;
const FRAMED_DOTS = Array.from({ length: RAW_DOTS.length }, (_, i) => {
  const angle = (i / RAW_DOTS.length) * Math.PI * 2 - Math.PI / 2;
  return [32 + Math.cos(angle) * RING_RADIUS, 32 + Math.sin(angle) * RING_RADIUS] as const;
});

interface LayerProps {
  stage: MotionValue<number>;
  index: number;
  children: React.ReactNode;
  /** Reduced motion: only the mark layer renders, at rest, and nothing fades. */
  frozen: boolean;
  /** Index of the final node, where the branded mark lives. */
  frozenIndex: number;
}

/** Crossfades a layer in as `stage` passes its index and out as it leaves. */
function Layer({ stage, index, children, frozen, frozenIndex }: LayerProps) {
  const opacity = useTransform(stage, [index - 1, index, index + 1], [0, 1, 0]);
  const scale = useTransform(stage, [index - 1, index, index + 1], [0.86, 1, 1.14]);

  // Hooks run first so the hook order is identical in every branch.
  // Intermediate stages past the final node are unreachable on a shortened
  // pipeline; under reduced motion only the mark is drawn at all.
  if (index > frozenIndex) return null;
  if (frozen && index !== frozenIndex) return null;

  return (
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        ...(frozen ? {} : { opacity, scale }),
      }}
    >
      {children}
    </motion.div>
  );
}

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} width="100%" height="100%" aria-hidden="true">
      {children}
    </svg>
  );
}

interface ProcessPayloadProps {
  /** Continuous node index — 0 at the first phase, `lastIndex` at the last. */
  stage: MotionValue<number>;
  /** Index of the final node. The mark is pinned here, not to a fixed 5, so a
   *  shortened pipeline still reaches the branded end state. */
  lastIndex: number;
  /** Reduced motion: render the shipped mark and nothing else. */
  reduced: boolean;
}

export function ProcessPayload({ stage, lastIndex, reduced }: ProcessPayloadProps) {
  // The gold chrome belongs to the branded end state, so it arrives with it
  // rather than being on the object the whole way down.
  const markIndex = lastIndex;
  const goldRim = useTransform(stage, [markIndex - 1, markIndex], [0, 1]);
  const scanY = useTransform(stage, [1.5, 2.5], [-20, 20]);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        bgcolor: NOIR.navyDeep,
        border: `1px solid rgba(${NOIR.frostRgb}, 0.18)`,
      }}
    >
      {/* Gold rim + glow — the Phitopolis chrome, earned at the last stage. */}
      <motion.div
        style={{
          position: "absolute",
          inset: -1,
          borderRadius: "50%",
          border: `2px solid ${NOIR.gold}`,
          boxShadow: `0 0 32px rgba(${NOIR.goldRgb}, 0.4)`,
          ...(reduced ? {} : { opacity: goldRim }),
        }}
      />

      {/* 00 · raw */}
      <Layer stage={stage} index={0} frozen={reduced} frozenIndex={markIndex}>
        <Svg>
          {RAW_DOTS.map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2} fill={NOIR.frost} opacity={0.55} />
          ))}
        </Svg>
      </Layer>

      {/* 01 · framed */}
      <Layer stage={stage} index={1} frozen={reduced} frozenIndex={markIndex}>
        <Svg>
          <circle
            cx={32}
            cy={32}
            r={RING_RADIUS}
            fill="none"
            stroke={NOIR.frost}
            strokeOpacity={0.4}
            strokeWidth={1}
          />
          {FRAMED_DOTS.map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2} fill={NOIR.frost} opacity={0.8} />
          ))}
        </Svg>
      </Layer>

      {/* 02 · lattice — structure plus one scan pass across it. */}
      <Layer stage={stage} index={2} frozen={reduced} frozenIndex={markIndex}>
        <Svg>
          <circle
            cx={32}
            cy={32}
            r={RING_RADIUS}
            fill="none"
            stroke={NOIR.gold}
            strokeOpacity={0.5}
            strokeWidth={1}
          />
          <g stroke={NOIR.gold} strokeOpacity={0.28} strokeWidth={0.75}>
            <line x1={13} y1={24} x2={51} y2={24} />
            <line x1={10} y1={32} x2={54} y2={32} />
            <line x1={13} y1={40} x2={51} y2={40} />
            <line x1={24} y1={13} x2={24} y2={51} />
            <line x1={32} y1={10} x2={32} y2={54} />
            <line x1={40} y1={13} x2={40} y2={51} />
          </g>
        </Svg>
        <motion.div
          style={{
            position: "absolute",
            left: "12%",
            right: "12%",
            top: "50%",
            height: 1,
            background: NOIR.goldLight,
            boxShadow: `0 0 8px ${NOIR.gold}`,
            ...(reduced ? {} : { y: scanY }),
          }}
        />
      </Layer>

      {/* 03 · solid — the lattice has become one mass. */}
      <Layer stage={stage} index={3} frozen={reduced} frozenIndex={markIndex}>
        <Svg>
          <circle cx={32} cy={32} r={RING_RADIUS} fill={NOIR.gold} fillOpacity={0.2} />
          <circle cx={32} cy={32} r={13} fill={NOIR.gold} fillOpacity={0.9} />
        </Svg>
      </Layer>

      {/* 04 · live — the mass has a heartbeat, because it has to stay up. */}
      <Layer stage={stage} index={4} frozen={reduced} frozenIndex={markIndex}>
        <Svg>
          <circle cx={32} cy={32} r={RING_RADIUS} fill={NOIR.gold} fillOpacity={0.2} />
          <circle cx={32} cy={32} r={13} fill={NOIR.gold} fillOpacity={0.9} />
          <circle
            cx={32}
            cy={32}
            r={RING_RADIUS}
            fill="none"
            stroke={NOIR.live}
            strokeOpacity={0.9}
            strokeWidth={1.5}
          />
        </Svg>
        {/* CSS keyframes, not a Motion loop: a permanently-repeating tween on
            the scroll path is the one thing worth keeping off the main thread
            entirely. Suppressed under reduced motion by not rendering it. */}
        {!reduced && (
          <Box
            sx={{
              position: "absolute",
              inset: "12%",
              borderRadius: "50%",
              border: `1px solid ${NOIR.live}`,
              animation: "processHeartbeat 2.4s ease-out infinite",
              "@keyframes processHeartbeat": {
                "0%": { transform: "scale(1)", opacity: 0.7 },
                "70%": { transform: "scale(1.5)", opacity: 0 },
                "100%": { transform: "scale(1.5)", opacity: 0 },
              },
            }}
          />
        )}
      </Layer>

      {/* 05 · mark — it is a Phitopolis product now. */}
      <Layer stage={stage} index={markIndex} frozen={reduced} frozenIndex={markIndex}>
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // Optical balance: the P's counter sits left of the glyph's centre.
            "& svg": { width: "50%", height: "50%", ml: "3%" },
          }}
        >
          <PhitopolisLogo color={NOIR.frost} accentColor={NOIR.gold} />
        </Box>
      </Layer>
    </Box>
  );
}
