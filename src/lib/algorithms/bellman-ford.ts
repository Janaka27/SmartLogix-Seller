import type { GraphEdge, GraphNode, PathResult } from "./types";

export function runBellmanFord(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string,
  targetId: string
): PathResult {
  const start = performance.now();

  // Undirected graph modeled as two directed edges each.
  const directed: { from: string; to: string; weight: number }[] = [];
  for (const edge of edges) {
    const w = edge.weight + (edge.noFlyPenalty ?? 0);
    directed.push({ from: edge.from, to: edge.to, weight: w });
    directed.push({ from: edge.to, to: edge.from, weight: w });
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  for (const node of nodes) distances.set(node.id, Infinity);
  distances.set(sourceId, 0);

  let relaxations = 0;
  for (let i = 0; i < nodes.length - 1; i++) {
    let changed = false;
    for (const { from, to, weight } of directed) {
      const du = distances.get(from) ?? Infinity;
      if (du === Infinity) continue;
      relaxations += 1;
      if (du + weight < (distances.get(to) ?? Infinity)) {
        distances.set(to, du + weight);
        previous.set(to, from);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const path: string[] = [];
  let cursor: string | undefined = targetId;
  while (cursor) {
    path.unshift(cursor);
    if (cursor === sourceId) break;
    cursor = previous.get(cursor);
  }
  const found = path[0] === sourceId && (distances.get(targetId) ?? Infinity) < Infinity;

  return {
    algorithm: "Bellman-Ford",
    path: found ? path : [],
    totalDistanceKm: found ? Number((distances.get(targetId) ?? 0).toFixed(2)) : 0,
    visitedOrder: nodes.map((n) => n.id),
    executionTimeMs: Number((performance.now() - start).toFixed(3)),
    nodesExplored: relaxations,
    found,
  };
}
