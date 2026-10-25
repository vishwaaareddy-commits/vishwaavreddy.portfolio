import { networkEdges, networkNodes, networkOverview, networkStages } from "@/data/network";
import type { NetworkNode } from "@/types/content";

export const nodeById: Record<string, NetworkNode> = Object.fromEntries(
  networkNodes.map((node) => [node.id, node]),
);

const serviceIds = networkNodes
  .filter((n) => n.kind !== "input" && n.kind !== "hub" && n.kind !== "output")
  .map((n) => n.id);

/** Every request travels input → integration layer → one service → output. */
export const routes: string[][] = serviceIds.map((id) => ["request", "layer", id, "output"]);

const edgeKey = (a: string, b: string) => `${a}>${b}`;

/** Indices into `routes` that a selection lights up. Empty means idle. */
export function activeRoutes(nodeId: string | null): number[] {
  if (nodeId === null) return [];
  const node = nodeById[nodeId];
  if (!node) return [];
  if (node.kind === "input" || node.kind === "hub" || node.kind === "output") {
    return routes.map((_, i) => i);
  }
  return routes.flatMap((route, i) => (route.includes(nodeId) ? [i] : []));
}

/** Edge keys ("a>b") lit by a selection. */
export function activeEdges(nodeId: string | null): Set<string> {
  const set = new Set<string>();
  for (const r of activeRoutes(nodeId)) {
    const route = routes[r];
    for (let i = 0; i < route.length - 1; i += 1) set.add(edgeKey(route[i], route[i + 1]));
  }
  return set;
}

export { edgeKey, networkEdges, networkNodes, networkOverview, networkStages };
