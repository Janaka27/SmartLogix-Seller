import type { GraphEdge, GraphNode, PathResult } from "./types";

function buildAdjacency(nodes: GraphNode[], edges: GraphEdge[]) {
  const adjacency = new Map<string, { to: string; weight: number }[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const edge of edges) {
    const w = edge.weight + (edge.noFlyPenalty ?? 0);
    adjacency.get(edge.from)?.push({ to: edge.to, weight: w });
    adjacency.get(edge.to)?.push({ to: edge.from, weight: w });
  }
  return adjacency;
}

export function runDijkstra(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string,
  targetId: string
): PathResult {
  const start = performance.now();
  const adjacency = buildAdjacency(nodes, edges);

  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  const visited = new Set<string>();
  for (const node of nodes) distances.set(node.id, Infinity);
  distances.set(sourceId, 0);

  const unvisited = new Set(nodes.map((n) => n.id));
  let nodesExplored = 0;

  while (unvisited.size > 0) {
    let current: string | null = null;
    let currentDist = Infinity;
    for (const id of unvisited) {
      const d = distances.get(id) ?? Infinity;
      if (d < currentDist) {
        currentDist = d;
        current = id;
      }
    }
    if (current === null || currentDist === Infinity) break;

    unvisited.delete(current);
    visited.add(current);
    nodesExplored += 1;
    if (current === targetId) break;

    for (const { to, weight } of adjacency.get(current) ?? []) {
      if (visited.has(to)) continue;
      const alt = currentDist + weight;
      if (alt < (distances.get(to) ?? Infinity)) {
        distances.set(to, alt);
        previous.set(to, current);
      }
    }
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
    algorithm: "Dijkstra",
    path: found ? path : [],
    totalDistanceKm: found ? Number((distances.get(targetId) ?? 0).toFixed(2)) : 0,
    visitedOrder: Array.from(visited),
    executionTimeMs: Number((performance.now() - start).toFixed(3)),
    nodesExplored,
    found,
  };
}
