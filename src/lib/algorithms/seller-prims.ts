export type NetworkNode = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "warehouse" | "charging_station";
};

export type NetworkEdge = {
  from: string;
  to: string;
  distance: number;
};


export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


export function calculateMST(nodes: NetworkNode[], edges: NetworkEdge[]) {
  console.log(`\n======================================================`);
  console.log(`[Prim's MST] INITIALIZING ALGORITHM`);
  console.log(`[Prim's MST] Total Nodes: ${nodes.length}`);
  console.log(`[Prim's MST] Total Edges: ${edges.length}`);
  console.log(`======================================================\n`);
  if (nodes.length === 0) {
    console.log(`[Prim's MST] No nodes provided. Returning empty graph.`);
    return { nodes: [], connections: [], totalDistance: 0 };
  }

  const visited = new Set<string>();
  const connections: NetworkEdge[] = [];
  let totalDistance = 0;

  // Start from the first node
  console.log(`[Prim's MST] Starting node selected: ${nodes[0].name} (${nodes[0].id})`);
  visited.add(nodes[0].id);

  while (visited.size < nodes.length) {
    let minEdge: NetworkEdge | null = null;
    let minCost = Infinity;
    let nextNodeId: string | null = null;

    // Look at all edges connecting visited nodes to unvisited nodes
    for (const edge of edges) {
      const fromVisited = visited.has(edge.from);
      const toVisited = visited.has(edge.to);

      // We only consider edges that cross the boundary between visited and unvisited
      if (fromVisited && !toVisited) {
        if (edge.distance < minCost) {
          minCost = edge.distance;
          minEdge = edge;
          nextNodeId = edge.to;
          console.log(`[Prim's MST - Searching] Found potential minimum edge: ${edge.from} -> ${edge.to} (Cost: ${minCost.toFixed(2)} km)`);
        }
      } else if (!fromVisited && toVisited) {
        if (edge.distance < minCost) {
          minCost = edge.distance;
          minEdge = edge;
          nextNodeId = edge.from;
          console.log(`[Prim's MST - Searching] Found potential minimum edge: ${edge.to} -> ${edge.from} (Cost: ${minCost.toFixed(2)} km)`);
        }
      }
    }

    // If we can't find a valid edge but not all nodes are visited, the graph is disconnected
    if (!minEdge || !nextNodeId) {
      throw new Error("Graph is disconnected. Cannot form a full Minimum Spanning Tree.");
    }

    // Add the smallest edge to our MST
    connections.push(minEdge);
    totalDistance += minCost;

    console.log(`[Prim's MST] => SELECTED BEST EDGE: from ${minEdge.from} to ${minEdge.to} (Distance: ${minCost.toFixed(2)} km)\n`);

    // Mark the newly connected node as visited
    visited.add(nextNodeId);
  }

  console.log(`\n======================================================`);
  console.log(`[Prim's MST] ALGORITHM COMPLETED`);
  console.log(`[Prim's MST] MST formed with ${connections.length} edges`);
  console.log(`[Prim's MST] Minimum Total Distance: ${totalDistance.toFixed(2)} km`);
  console.log(`======================================================\n`);

  return {
    nodes,
    connections,
    totalDistance
  };
}
