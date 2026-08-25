import type { GraphEdge, GraphNode, PathResult } from "./types";

function heuristic(a: GraphNode, b: GraphNode) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

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

export function runAStar(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string,
  targetId: string
): PathResult {
  const start = performance.now();
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const target = byId.get(targetId)!;
  const adjacency = buildAdjacency(nodes, edges);

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const previous = new Map<string, string>();
  for (const node of nodes) {
    gScore.set(node.id, Infinity);
    fScore.set(node.id, Infinity);
  }
  gScore.set(sourceId, 0);
  fScore.set(sourceId, heuristic(byId.get(sourceId)!, target));

  const open = new Set([sourceId]);
  const closed = new Set<string>();
  let nodesExplored = 0;

  while (open.size > 0) {
    let current: string | null = null;
    let currentF = Infinity;
    for (const id of open) {
      const f = fScore.get(id) ?? Infinity;
      if (f < currentF) {
        currentF = f;
        current = id;
      }
    }
    if (current === null) break;

    if (current === targetId) break;

    open.delete(current);
    closed.add(current);
    nodesExplored += 1;

    for (const { to, weight } of adjacency.get(current) ?? []) {
      if (closed.has(to)) continue;
      const tentativeG = (gScore.get(current) ?? Infinity) + weight;
      if (tentativeG < (gScore.get(to) ?? Infinity)) {
        previous.set(to, current);
        gScore.set(to, tentativeG);
        fScore.set(to, tentativeG + heuristic(byId.get(to)!, target));
        open.add(to);
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
  const found = path[0] === sourceId && (gScore.get(targetId) ?? Infinity) < Infinity;

  return {
    algorithm: "A*",
    path: found ? path : [],
    totalDistanceKm: found ? Number((gScore.get(targetId) ?? 0).toFixed(2)) : 0,
    visitedOrder: Array.from(closed),
    executionTimeMs: Number((performance.now() - start).toFixed(3)),
    nodesExplored,
    found,
  };
}
