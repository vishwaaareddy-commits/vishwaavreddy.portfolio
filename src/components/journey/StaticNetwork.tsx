/** Layer sizes of the SVG fallback (a smaller drawing of the 3D field). */
const SIZES = [6, 10, 14, 14, 10, 6];
const W = 1200;
const H = 700;

function layout() {
  const nodes = SIZES.map((n, l) =>
    Array.from({ length: n }, (_, i) => ({
      x: 120 + (l * (W - 240)) / (SIZES.length - 1),
      y: H / 2 + (i - (n - 1) / 2) * 38,
      // Deterministic "activation" so server and client render the same drawing.
      a: Math.abs(Math.sin(l * 12.9898 + i * 78.233)) % 1,
    })),
  );
  const edges: { x1: number; y1: number; x2: number; y2: number; w: number }[] = [];
  for (let l = 0; l < nodes.length - 1; l += 1) {
    nodes[l].forEach((a, i) =>
      nodes[l + 1].forEach((b, j) => {
        const w = Math.sin(i * 3.1 + j * 1.7 + l);
        if (Math.abs(w) > 0.55) edges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, w });
      }),
    );
  }
  return { nodes: nodes.flat(), edges };
}

const { nodes, edges } = layout();

/**
 * The background network as a static SVG, for browsers without WebGL2.
 * Same palette as the 3D field: cyan positive, violet negative weights.
 */
export function StaticNetwork() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full opacity-40">
      <g strokeLinecap="round">
        {edges.map((e, i) => (
          <line
            key={i}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke={e.w > 0 ? "#3be3f5" : "#8b6cff"}
            strokeOpacity={0.08 + 0.18 * Math.abs(e.w)}
            strokeWidth={0.6 + Math.abs(e.w)}
          />
        ))}
      </g>
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={4 + 3 * n.a} fill="#3be3f5" fillOpacity={0.15 + 0.6 * n.a} />
      ))}
    </svg>
  );
}
