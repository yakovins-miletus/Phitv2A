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
 * - Mobile: simplified composition (fewer nodes, stacked layers)
 *
 * Scroll behavior:
 * - Initial: zoomed in, scale ~100%, centered on upper layer
 * - Scrolls: zoom out to ~40%, reveals supporting layers below
 * - Off-screen: unsubscribed from animation, no continuous ref updates
 */

import { useRef, useImperativeHandle, forwardRef } from "react";

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
  const svgRef = useRef<SVGSVGElement>(null);
  const latticeGroupRef = useRef<SVGGElement>(null);
  const scaleRef = useRef(1);

  // SVG viewBox dimensions — wide enough for the widest row (6 core nodes at
  // NODE_GAP=130 spans 650px) plus the ISO_SHEAR lean on the bottom row.
  // Tall enough that the bottom (infra) row's node + its name label, which
  // renders `size` (48px) below the node centre, doesn't clip the bottom edge:
  // infra row sits at 2*LAYER_GAP below centerY, so vbHeight must clear
  // centerY + 2*LAYER_GAP + 48 with margin to spare.
  const vbWidth = 900;
  const vbHeight = 660;
  const centerX = vbWidth / 2;
  // Centered on the middle (core) row, which is the widest, so the layout
  // reads as balanced rather than top- or bottom-heavy.
  const centerY = vbHeight / 2 - LAYER_GAP / 2;

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
            const midY = (LAYER_ROW_Y[LAYERS[i]!.key]! + LAYER_ROW_Y[layer.key]!) / 2;
            return (
              <line
                key={`sep-${layer.key}`}
                x1={-380}
                y1={midY}
                x2={380}
                y2={midY}
                stroke={NOIR.frost}
                strokeWidth={1}
                opacity={0.12}
              />
            );
          })}

        {/* Connection lines from each non-apps-layer node up to the nearest
            apps-layer node — a light suggestion of "supports", not a claim
            about real architecture. Drawn before the nodes so nodes sit on top. */}
        {!reduced &&
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
        {PLACED_NODES.map((node) => {
          const size = 48;
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
              x={-380}
              y={LAYER_ROW_Y[layer.key]! + 4}
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
