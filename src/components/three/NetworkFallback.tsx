import { activeEdges, activeRoutes, edgeKey, networkEdges, networkNodes, networkStages, nodeById, routes } from "./graph";

export const VIEW_W = 960;
export const VIEW_H = 600;

/** Maps graph coordinates onto the 2D view box (1 world unit = 100px). */
export function project2D([x, y]: [number, number, number]) {
  return { x: (x + 5.05) * 96, y: (2.6 - y) * 100 + 60 };
}

function edgePath(fromId: string, toId: string) {
  const a = project2D(nodeById[fromId].position);
  const b = project2D(nodeById[toId].position);
  const mx = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
}

function routePath(route: string[]) {
  return route
    .slice(0, -1)
    .map((id, i) => edgePath(id, route[i + 1]))
    .map((d, i) => (i === 0 ? d : d.replace(/^M [^C]+/, "")))
    .join(" ");
}

interface NetworkFallbackProps {
  activeId: string | null;
  animate: boolean;
}

/**
 * Dark 2D rendering of the inference network. Used on small screens, with
 * reduced motion, without WebGL, and as the underlay while the 3D scene loads.
 */
export function NetworkFallback({ activeId, animate }: NetworkFallbackProps) {
  const lit = activeEdges(activeId);
  const liveRoutes = new Set(activeRoutes(activeId));
  const related = new Set([...liveRoutes].flatMap((r) => routes[r]));

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="nf-glow">
          <stop offset="0%" stopColor="#3be3f5" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#3be3f5" stopOpacity="0" />
        </radialGradient>
      </defs>

      {networkStages.map((stage, i) => {
        const { x } = project2D([stage.x, 0, 0]);
        const anchor = i === 0 ? "start" : i === networkStages.length - 1 ? "end" : "middle";
        const tx = i === 0 ? x - 30 : i === networkStages.length - 1 ? x + 30 : x;
        return (
          <g key={stage.id}>
            <line x1={x} x2={x} y1={34} y2={VIEW_H - 24} stroke="#3be3f5" strokeOpacity="0.07" strokeDasharray="2 6" />
            <text
              x={tx}
              y={24}
              textAnchor={anchor}
              fill="#6b7686"
              fontSize="13"
              letterSpacing="2.5"
              fontFamily="var(--font-mono)"
            >
              {stage.label.toUpperCase()}
            </text>
          </g>
        );
      })}

      {networkEdges.map(([a, b]) => {
        const on = lit.has(edgeKey(a, b));
        const idle = activeId === null;
        return (
          <g key={edgeKey(a, b)}>
            <path
              d={edgePath(a, b)}
              fill="none"
              stroke={on ? "#3be3f5" : "#3d4b5c"}
              strokeOpacity={idle ? 0.6 : on ? 0.95 : 0.25}
              strokeWidth={on ? 2.2 : 1.3}
              style={{ transition: "stroke 400ms ease, stroke-opacity 400ms ease" }}
            />
            {animate && (idle || on) ? (
              <path
                d={edgePath(a, b)}
                fill="none"
                stroke="#3be3f5"
                strokeOpacity={0.6}
                strokeWidth={1.6}
                strokeDasharray="2 18"
                style={{ animation: "dash-flow 1.6s linear infinite" }}
              />
            ) : null}
          </g>
        );
      })}

      {animate
        ? routes.map((route, i) =>
            activeId === null || liveRoutes.has(i) ? (
              <circle key={route.join("-")} r={4.5} fill="#3be3f5">
                <animateMotion
                  dur={`${6.5 + i * 0.8}s`}
                  begin={`${i * 1.1}s`}
                  repeatCount="indefinite"
                  path={routePath(route)}
                />
              </circle>
            ) : null,
          )
        : null}

      {networkNodes.map((node) => {
        const { x, y } = project2D(node.position);
        const active = node.id === activeId;
        const dim = activeId !== null && !active && !related.has(node.id);
        const stroke = dim ? "#3d4b5c" : "#3be3f5";
        const width = active ? 2.6 : 1.5;
        const r = node.kind === "hub" ? 15 : 11;
        return (
          <g key={node.id} style={{ transition: "opacity 400ms ease" }} opacity={dim ? 0.55 : 1}>
            {active || node.kind === "hub" ? <circle cx={x} cy={y} r={active ? 48 : 40} fill="url(#nf-glow)" /> : null}
            {node.kind === "hub" ? (
              <>
                <circle cx={x} cy={y} r={27} fill="none" stroke="#3be3f5" strokeOpacity={0.5} />
                <ellipse cx={x} cy={y} rx={36} ry={12} fill="none" stroke="#8fb7ff" strokeOpacity={0.3} />
              </>
            ) : null}
            {node.kind === "output" ? (
              <rect
                x={x - r}
                y={y - r}
                width={r * 2}
                height={r * 2}
                transform={`rotate(45 ${x} ${y})`}
                fill="#0d1620"
                stroke={stroke}
                strokeWidth={width}
              />
            ) : node.kind === "data" ? (
              [-7, 0, 7].map((dy) => (
                <ellipse key={dy} cx={x} cy={y + dy} rx={r} ry={4.5} fill="#0d1620" stroke={stroke} strokeWidth={width} />
              ))
            ) : (
              <circle cx={x} cy={y} r={active ? r + 3 : r} fill="#0d1620" stroke={stroke} strokeWidth={width} />
            )}
          </g>
        );
      })}
    </svg>
  );
}
