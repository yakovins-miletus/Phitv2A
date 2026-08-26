/**
 * Isometric Tech Stack Lattice — Closing Section
 *
 * An isometric structure showing the tech stacks that power applications,
 * revealed by a scroll-driven zoom-out. Built in SVG with CSS transforms,
 * not React Three Fiber — this avoids the three.js bundle entirely.
 *
 * Architecture:
 * - Three semantic layers: Applications (top), Core Technologies (middle),
 *   Infrastructure (bottom)
 * - Isometric perspective via SVG transform
 * - Scroll-driven zoom-out via imperative DOM mutation (no React state)
 * - Reduced-motion: static composed frame showing the full lattice
 * - Mobile (<600px, `theme.breakpoints.down("sm")`): all 12 nodes are kept —
 *   nothing is dropped — but relaid out as a vertical stack (apps -> core ->
 *   infra, top to bottom) with no isometric shear. Connector lines are
 *   dropped entirely (see the comment at that JSX block for why); separators
 *   and layer labels are kept, recomputed for the vertical geometry.
 *
 * Scroll behavior:
 * - Initial: zoomed in, scale ~100%, centered on upper layer
 * - Scrolls: zoom out to ~40%, reveals supporting layers below
 * - Off-screen: unsubscribed from animation, no continuous ref updates
 */

import { useRef, useImperativeHandle, forwardRef } from "react";

import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

/** Tech stacks grouped by layer, in render order within each row. */
const LAYERS: readonly {
  readonly key: "apps" | "core" | "infra";
  readonly label: string;
  readonly stacks: readonly { readonly name: string; readonly category: string }[];
}[] = [
  {
    key: "apps",
    label: "APPLICATIONS",
    stacks: [
      { name: "React", category: "frontend" },
      { name: "Claude", category: "ai" },
      { name: "TypeScript", category: "frontend" },
    ],
  },
  {
    key: "core",
    label: "TECHNOLOGIES",
    stacks: [
      { name: "Python", category: "backend" },
      { name: "FastAPI", category: "backend" },
      { name: "Node.js", category: "backend" },
      { name: "PostgreSQL", category: "data" },
      { name: "Kafka", category: "data" },
      { name: "Redis", category: "data" },
    ],
  },
  {
    key: "infra",
    label: "INFRASTRUCTURE",
    stacks: [
      { name: "Docker", category: "infra" },
      { name: "Kubernetes", category: "infra" },
      { name: "GCP", category: "cloud" },
    ],
  },
];

/** Row-based layout: nodes within a layer are evenly spaced along one row,
 *  so within-layer spacing is a pure function of node count and can never
 *  collide regardless of how many techs a layer holds. `ISO_SHEAR` gives the
 *  isometric lean (each row shifts sideways in proportion to its depth)
 *  without needing a hand-tuned x/y grid per node — the previous freehand
 *  grid packed several nodes within 40-80px of each other (nodes render at
 *  48px) and positioned the three layer labels in a *different* coordinate
 *  space than the nodes entirely, which is why "APPLICATIONS" rendered with
 *  nothing under it. Labels below derive their y from the same `rowY` as
 *  their row's nodes, so the two can't drift apart again. */
const NODE_GAP = 130;
const LAYER_GAP = 170;
const ISO_SHEAR = 0.35;

interface PlacedNode {
  name: string;
  category: string;
  layer: "apps" | "core" | "infra";
  x: number;
  y: number;
}

const PLACED_NODES: readonly PlacedNode[] = LAYERS.flatMap((layer, layerIndex) => {
  const rowY = layerIndex * LAYER_GAP;
  const n = layer.stacks.length;
  return layer.stacks.map((tech, i) => {
    const rowX = (i - (n - 1) / 2) * NODE_GAP;
    return {
      name: tech.name,
      category: tech.category,
      layer: layer.key,
      x: rowX + rowY * ISO_SHEAR,
      y: rowY,
    };
  });
});

/** Each layer's node-row y, keyed the same way `PLACED_NODES` derives it —
 *  the label row for a layer is always exactly where that layer's nodes are. */
const LAYER_ROW_Y: Record<string, number> = Object.fromEntries(
  LAYERS.map((layer, i) => [layer.key, i * LAYER_GAP]),
);

/** Mobile (<600px) layout: no isometric shear, pure vertical stack. Rows are
 *  capped at 3 nodes so node sizing can stay uniform across the whole
 *  diagram — apps (3) and infra (3) stay one row each, core (6) wraps into 2
 *  rows of 3. All 12 stacks from `LAYERS` are still placed; only the
 *  coordinates differ from the desktop derivation above. */
const MOBILE_NODE_GAP = 110;
const MOBILE_ROW_GAP = 90;
const MOBILE_BAND_GAP = 160;
const MOBILE_NODE_SIZE = 64;
const MOBILE_ROW_SIZE = 3;
/** Space reserved above the apps band for its label (see label offset below). */
const MOBILE_TOP_CLEARANCE = 40;
/** How far above a band's first row its label sits. */
const MOBILE_LABEL_OFFSET = 28;

interface MobileLayout {
  nodes: readonly PlacedNode[];
  /** y of each layer's *first* row — mirrors `LAYER_ROW_Y`, used for label positioning. */
  bandY: Record<string, number>;
  /** y of each layer's *last* row — used to compute separator midpoints between bands. */
  lastRowY: Record<string, number>;
}

/** Chunks a layer's stacks into rows of <= MOBILE_ROW_SIZE, centers each row
 *  horizontally at x=0 with the same centering math as the desktop
 *  derivation, and stacks rows/bands vertically with a running `y` cursor. */
function buildMobileLayout(): MobileLayout {
  const nodes: PlacedNode[] = [];
  const bandY: Record<string, number> = {};
  const lastRowY: Record<string, number> = {};
  let y = 0;

  LAYERS.forEach((layer, layerIndex) => {
    bandY[layer.key] = y;

    const rows: (typeof layer.stacks)[number][][] = [];
    for (let i = 0; i < layer.stacks.length; i += MOBILE_ROW_SIZE) {
      rows.push(layer.stacks.slice(i, i + MOBILE_ROW_SIZE));
    }

    rows.forEach((row, rowIndex) => {
      const rowY = y + rowIndex * MOBILE_ROW_GAP;
      const n = row.length;
      row.forEach((tech, i) => {
        nodes.push({
          name: tech.name,
          category: tech.category,
          layer: layer.key,
          x: (i - (n - 1) / 2) * MOBILE_NODE_GAP,
          y: rowY,
        });
      });
    });

    const lastRowOfLayerY = y + (rows.length - 1) * MOBILE_ROW_GAP;
    lastRowY[layer.key] = lastRowOfLayerY;

    // Advance the cursor past this layer's own rows, then past the band gap
    // before the next layer (no trailing gap after the last layer).
    y = lastRowOfLayerY;
    if (layerIndex < LAYERS.length - 1) {
      y += MOBILE_BAND_GAP;
    }
  });

  return { nodes, bandY, lastRowY };
}

const { nodes: PLACED_NODES_MOBILE, bandY: MOBILE_LAYER_BAND_Y, lastRowY: MOBILE_LAYER_LAST_ROW_Y } =
  buildMobileLayout();

// Mobile viewBox width: the widest possible row holds MOBILE_ROW_SIZE=3 nodes
// at MOBILE_NODE_GAP=110 apart, spanning (3-1)*110 = 220px, i.e. ±110 from
// center. Add the node radius (MOBILE_NODE_SIZE/2 = 32) and clearance for a
// name label that can render a little wider than the node badge (~40px) on
// each side: half-width = 110 + 32 + 40 = 182, so width = 364.
const MOBILE_HALF_WIDTH = MOBILE_NODE_GAP + MOBILE_NODE_SIZE / 2 + 40;
const MOBILE_VB_WIDTH = MOBILE_HALF_WIDTH * 2;

// Mobile viewBox height: MOBILE_TOP_CLEARANCE (room above the apps label)
// + the y of the last layer's last row (today: infra at 410 = apps 1 row +
// MOBILE_BAND_GAP 160 + core's extra row at MOBILE_ROW_GAP 90 + MOBILE_BAND_GAP
// 160) + that row's own extra-row offset (0 for a single-row infra band)
// + clearance below the bottom row for its name label (MOBILE_NODE_SIZE,
// which is where the label renders, per the node JSX below) plus a 20px margin.
const MOBILE_LAST_LAYER_KEY = LAYERS[LAYERS.length - 1]!.key;
const MOBILE_BOTTOM_CLEARANCE = MOBILE_NODE_SIZE + 20;
const MOBILE_VB_HEIGHT =
  MOBILE_TOP_CLEARANCE + MOBILE_LAYER_LAST_ROW_Y[MOBILE_LAST_LAYER_KEY]! + MOBILE_BOTTOM_CLEARANCE;

export interface IsometricLatticeHandle {
  /** Update the zoom scale (0..1). Cheap, synchronous, causes no React render. */
  setScale: (scale: number) => void;
}

/**
 * Main isometric lattice SVG.
 *
 * Imperative handle allows scroll drivers to update scale via setScale()
 * without triggering React renders. The SVG directly modifies the transform
 * on the lattice group.
 */
export const IsometricLattice = forwardRef<
  IsometricLatticeHandle,
  { reduced?: boolean }
>(({ reduced = false }, ref) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const svgRef = useRef<SVGSVGElement>(null);
  const latticeGroupRef = useRef<SVGGElement>(null);
  const scaleRef = useRef(1);

  const nodes = isMobile ? PLACED_NODES_MOBILE : PLACED_NODES;
  const nodeSize = isMobile ? MOBILE_NODE_SIZE : 48;

  // SVG viewBox dimensions — wide enough for the widest row (6 core nodes at
  // NODE_GAP=130 spans 650px) plus the ISO_SHEAR lean on the bottom row.
  // Tall enough that the bottom (infra) row's node + its name label, which
  // renders `size` (48px) below the node centre, doesn't clip the bottom edge:
  // infra row sits at 2*LAYER_GAP below centerY, so vbHeight must clear
  // centerY + 2*LAYER_GAP + 48 with margin to spare.
  const vbWidth = isMobile ? MOBILE_VB_WIDTH : 900;
  const vbHeight = isMobile ? MOBILE_VB_HEIGHT : 660;
  const centerX = vbWidth / 2;
  // Desktop: centered on the middle (core) row, which is the widest, so the
  // layout reads as balanced rather than top- or bottom-heavy. Mobile: fixed
  // top clearance (see MOBILE_VB_HEIGHT comment) rather than a midpoint,
  // since the vertical stack isn't symmetric top-to-bottom.
  const centerY = isMobile ? MOBILE_TOP_CLEARANCE : vbHeight / 2 - LAYER_GAP / 2;

  useImperativeHandle(
    ref,
    () => ({
      setScale: (targetScale: number) => {
        // Clamp scale to 0.4..1
        scaleRef.current = Math.max(0.4, Math.min(1, targetScale));

        // Update SVG transform directly (no React render)
        if (latticeGroupRef.current) {
          const displayScale = reduced ? 0.6 : scaleRef.current;
          latticeGroupRef.current.setAttribute(
            "transform",
            `translate(${centerX} ${centerY}) scale(${displayScale})`,
          );
        }
      },
    }),
    [reduced, centerX, centerY],
  );

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
      width="100%"
      style={{
        maxWidth: "100%",
        height: "auto",
        display: "block",
      } as React.CSSProperties}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background */}
      <rect width={vbWidth} height={vbHeight} fill={NOIR.navyField} />

      {/* Main lattice group: centered and scaled */}
      <g
        ref={latticeGroupRef}
        transform={`translate(${centerX} ${centerY}) scale(${reduced ? 0.6 : 1})`}
      >
        {/* Layer separator lines, one between each pair of adjacent rows —
            derived from LAYER_ROW_Y so they always sit exactly between the
            rows they separate, regardless of LAYER_GAP tuning. */}
        {!reduced &&
          LAYERS.slice(1).map((layer, i) => {
            const midY = isMobile
              ? (MOBILE_LAYER_LAST_ROW_Y[LAYERS[i]!.key]! + MOBILE_LAYER_BAND_Y[layer.key]!) / 2
              : (LAYER_ROW_Y[LAYERS[i]!.key]! + LAYER_ROW_Y[layer.key]!) / 2;
            const halfSpan = isMobile ? MOBILE_HALF_WIDTH - 20 : 380;
            return (
              <line
                key={`sep-${layer.key}`}
                x1={-halfSpan}
                y1={midY}
                x2={halfSpan}
                y2={midY}
                stroke={NOIR.frost}
                strokeWidth={1}
                opacity={0.12}
              />
            );
          })}

        {/* Connection lines from each non-apps-layer node up to the nearest
            apps-layer node — a light suggestion of "supports", not a claim
            about real architecture. Drawn before the nodes so nodes sit on top.
            Dropped entirely on mobile: the "nearest apps node by x-distance"
            heuristic only makes sense across a wide shear-offset row where
            x actually varies meaningfully between rows. In the mobile vertical
            stack every row is independently centered at x=0, so "nearest by
            x" degenerates to arbitrary/near-random pairings — it would be
            visual clutter with no informational value, not a missing feature. */}
        {!reduced &&
          !isMobile &&
          PLACED_NODES.filter((n) => n.layer !== "apps").map((n) => {
            const apps = PLACED_NODES.filter((p) => p.layer === "apps");
            const nearest = apps.reduce((best, p) =>
              Math.abs(p.x - n.x) < Math.abs(best.x - n.x) ? p : best,
            );
            return (
              <line
                key={`conn-${n.name}`}
                x1={n.x}
                y1={n.y}
                x2={nearest.x}
                y2={nearest.y}
                stroke={NOIR.frost}
                strokeWidth={1}
                opacity={0.15}
              />
            );
          })}

        {/* Render all tech nodes */}
        {nodes.map((node) => {
          const size = nodeSize;
          const isHighlighted = node.category === "ai";

          return (
            <g key={node.name} transform={`translate(${node.x} ${node.y})`}>
              {/* Node background circle */}
              <circle
                cx={0}
                cy={0}
                r={size / 2}
                fill={
                  isHighlighted ? NOIR.gold : node.layer === "apps" ? NOIR.frost : NOIR.white
                }
                opacity={isHighlighted ? 0.3 : 0.15}
              />

              {/* Node icon / label container */}
              <g transform={`translate(${-size / 4} ${-size / 4})`}>
                <rect
                  x={0}
                  y={0}
                  width={size / 2}
                  height={size / 2}
                  fill={NOIR.navyField}
                  stroke={isHighlighted ? NOIR.gold : NOIR.frost}
                  strokeWidth={2}
                  rx={4}
                />
                <text
                  x={size / 4}
                  y={size / 4}
                  textAnchor="middle"
                  dy="0.3em"
                  fontSize={8}
                  fontFamily={MONO}
                  fill={isHighlighted ? NOIR.gold : NOIR.frost}
                  fontWeight="600"
                >
                  {node.name.substring(0, 3).toUpperCase()}
                </text>
              </g>

              {/* Tech name label below node */}
              <text
                x={0}
                y={size}
                textAnchor="middle"
                fontSize={10}
                fontFamily={MONO}
                fill={NOIR.frost}
                opacity={0.7}
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </g>

      {/* Layer labels, positioned inside the SAME transformed group's
          coordinate space as the nodes (translated once, not re-derived) so
          a label can never drift from the row it names — the previous
          version placed these in raw viewBox coordinates while the nodes
          lived inside a translated <g>, which is why "APPLICATIONS" rendered
          with nothing under it: the two were never in the same space. */}
      {!reduced && (
        <g transform={`translate(${centerX} ${centerY})`}>
          {LAYERS.map((layer) => (
            <text
              key={`label-${layer.key}`}
              x={isMobile ? 0 : -380}
              y={isMobile ? MOBILE_LAYER_BAND_Y[layer.key]! - MOBILE_LABEL_OFFSET : LAYER_ROW_Y[layer.key]! + 4}
              textAnchor={isMobile ? "middle" : undefined}
              fontSize={12}
              fontFamily={MONO}
              fill={NOIR.frost}
              opacity={0.4}
              letterSpacing="0.1em"
            >
              {layer.label}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
});
