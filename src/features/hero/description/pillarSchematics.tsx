import { NOIR } from "@/shared/theme/palette";

/**
 * One schematic per pillar, sitting behind its own card.
 *
 * What was here before was three unrelated systems — a neural network, a field
 * of floating isometric blocks, and a radar sweep — scattered across the whole
 * section at positions unrelated to the cards they supposedly illustrated. On
 * the page they overlapped into a single grey mass that reads as an image that
 * failed to load. Three drawings for three pillars is the right instinct; they
 * just have to be *behind the pillar they describe*, which is also what gives
 * the parallax something to separate.
 *
 * Same language as the pipeline glyphs on this page: hairline strokes, one
 * gold accent, no fills except the points that carry meaning. A second visual
 * vocabulary here would cost the page more than these drawings are worth.
 */

/**
 * Stroke strengths are set for what these look like *through the glass*.
 *
 * Drawn at the ground's hairline value (0.18 alpha) they vanished: the card
 * sits over them at ~50% white, which halves them again to about 0.09 — below
 * the threshold where anything is visible at all. A schematic that only exists
 * where it overhangs the card is not a schematic, it is a smudge. These are
 * cut roughly twice as strong so the covered portion reads as *softened by*
 * the glass rather than erased by it, which is the whole depth cue.
 */
const LINE = `rgba(${NOIR.navyFieldRgb}, 0.38)`;
const ACCENT = `rgba(${NOIR.goldRgb}, 0.8)`;

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** 01 · Research — a high-dimensional cloud with its principal axes found. */
export function ResearchSchematic() {
  const cloud = [
    [62, 138],
    [78, 120],
    [92, 126],
    [88, 104],
    [104, 96],
    [112, 108],
    [120, 82],
    [134, 74],
    [96, 142],
    [70, 108],
    [126, 96],
    [142, 88],
    [82, 148],
    [110, 128],
    [148, 66],
  ] as const;

  return (
    <Frame>
      {/* The two components that explain the variance. */}
      <path d="M46 156 L162 54" stroke={ACCENT} strokeWidth={1.25} fill="none" />
      <path d="M74 42 L118 170" stroke={LINE} strokeWidth={1} fill="none" />
      <ellipse
        cx={104}
        cy={110}
        rx={62}
        ry={30}
        transform="rotate(-41 104 110)"
        stroke={LINE}
        strokeWidth={1}
        fill="none"
        strokeDasharray="3 4"
      />
      {cloud.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.5} fill={LINE} />
      ))}
    </Frame>
  );
}

/** 02 · Development — services stacked across public and private cloud. */
export function DevelopmentSchematic() {
  // Three planes in plan view, offset to read as a stack seen from above.
  const planes = [
    { x: 30, y: 116, accent: false },
    { x: 46, y: 92, accent: true },
    { x: 62, y: 68, accent: false },
  ];

  return (
    <Frame>
      {planes.map((plane) => (
        <g key={plane.y}>
          <path
            d={`M${plane.x} ${plane.y} L${plane.x + 54} ${plane.y - 26} L${plane.x + 108} ${plane.y} L${plane.x + 54} ${plane.y + 26} Z`}
            stroke={plane.accent ? ACCENT : LINE}
            strokeWidth={plane.accent ? 1.25 : 1}
            fill="none"
          />
        </g>
      ))}
      {/* The calls that bind the planes into one system. */}
      <path d="M84 116 L84 92" stroke={LINE} strokeWidth={1} strokeDasharray="2 3" />
      <path d="M100 92 L100 68" stroke={LINE} strokeWidth={1} strokeDasharray="2 3" />
      <circle cx={100} cy={92} r={3} fill={ACCENT} />
    </Frame>
  );
}

/** 03 · Support & Delivery — a shift handed across the world, unbroken. */
export function SupportSchematic() {
  return (
    <Frame>
      <circle cx={100} cy={100} r={66} stroke={LINE} strokeWidth={1} fill="none" />
      <ellipse cx={100} cy={100} rx={26} ry={66} stroke={LINE} strokeWidth={1} fill="none" />
      <path d="M34 100 H166" stroke={LINE} strokeWidth={1} />
      <path d="M44 74 H156" stroke={LINE} strokeWidth={0.75} />
      <path d="M44 126 H156" stroke={LINE} strokeWidth={0.75} />
      {/* Three desks, one running shift. */}
      <path
        d="M52 118 A66 66 0 0 1 100 34"
        stroke={ACCENT}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={52} cy={118} r={4} fill={ACCENT} />
      <circle cx={100} cy={34} r={4} fill={ACCENT} />
      <circle cx={158} cy={112} r={4} fill={LINE} />
    </Frame>
  );
}
