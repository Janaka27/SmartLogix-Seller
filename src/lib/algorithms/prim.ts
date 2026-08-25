import type { GraphEdge, GraphNode, MstResult } from "./types";

export function runPrim(nodes: GraphNode[], edges: GraphEdge[]): MstResult {
  const start = performance.now();
  if (nodes.length === 0) {
    return { edges: [], totalCost: 0, executionTimeMs: 0 };
  }

  const inTree = new Set<string>([nodes[0].id]);
  const mstEdges: GraphEdge[] = [];
  let totalCost = 0;

  while (inTree.size < nodes.length) {
    let best: GraphEdge | null = null;
    for (const edge of edges) {
      const fromIn = inTree.has(edge.from);
      const toIn = inTree.has(edge.to);
      if (fromIn === toIn) continue; // both in or both out — not a frontier edge
      if (!best || edge.weight < best.weight) best = edge;
    }
    if (!best) break; // graph not fully connected
    mstEdges.push(best);
    totalCost += best.weight;
    inTree.add(best.from);
    inTree.add(best.to);
  }

  return {
    edges: mstEdges,
    totalCost: Number(totalCost.toFixed(2)),
    executionTimeMs: Number((performance.now() - start).toFixed(3)),
  };
}
