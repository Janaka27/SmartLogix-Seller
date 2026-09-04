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

/**
 * Calculates the geographical distance between two coordinates using the Haversine formula.
 * @returns distance in kilometers
 */
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

/**
 * Prim's Minimum Spanning Tree (MST) Algorithm.
 * Used to create a minimum-cost infrastructure network connecting all locations.
 * 
 * Logic:
 * 1. Start from an arbitrary node (the first one) and mark it as visited.
 * 2. Look at all edges connecting the visited nodes to unvisited nodes.
 * 3. Select the edge with the smallest cost (distance) and add it to the MST.
 * 4. Mark the newly connected node as visited.
 * 5. Repeat until all nodes are connected.
 */
export function calculateMST(nodes: NetworkNode[], edges: NetworkEdge[]) {
  if (nodes.length === 0) {
    return { nodes: [], connections: [], totalDistance: 0 };
  }

  const visited = new Set<string>();
  const connections: NetworkEdge[] = [];
  let totalDistance = 0;

  // Start from the first node
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
        }
      } else if (!fromVisited && toVisited) {
        if (edge.distance < minCost) {
          minCost = edge.distance;
          minEdge = edge;
          nextNodeId = edge.from;
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
    
    // Mark the newly connected node as visited
    visited.add(nextNodeId);
  }

  return {
    nodes,
    connections,
    totalDistance
  };
}
