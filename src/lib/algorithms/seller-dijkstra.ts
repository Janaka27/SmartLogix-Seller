export type Node = {
  id: string;
  lat: number;
  lng: number;
  name?: string;
};

export type Edge = {
  from: string;
  to: string;
  distance: number;
};

// Calculate distance between two locations
export function distance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
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

// Dijkstra algorithm
export function dijkstra(
  nodes: Node[],
  edges: Edge[],
  start: string,
  end: string
) {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};

  for (const node of nodes) {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  }

  distances[start] = 0;

  const unvisited = new Set(nodes.map(node => node.id));

  while (unvisited.size > 0) {

    let current = "";
    let smallestDistance = Infinity;

    for (const id of unvisited) {
      if (distances[id] < smallestDistance) {
        smallestDistance = distances[id];
        current = id;
      }
    }
    if (!current) break;
    if (current === end) break;

    unvisited.delete(current);
    const connectedEdges = edges.filter(
      edge => edge.from === current || edge.to === current
    );
    for (const edge of connectedEdges) {

      const neighbor =
        edge.from === current
          ? edge.to
          : edge.from;

      const newDistance =
        distances[current] + edge.distance;

      if (newDistance < distances[neighbor]) {
        distances[neighbor] = newDistance;
        previous[neighbor] = current;
      }
    }
  }


  if (distances[end] === Infinity) {
    return null;
  }

  const route: Node[] = [];

  let current: string | null = end;

  while (current) {

    const node = nodes.find(n => n.id === current);

    if (node) {
      route.unshift(node);
    }

    current = previous[current];
  }

  return {
    route,
    distance: distances[end]
  };
}

// Build graph by adding all warehouses
export function buildGraph(warehouses: any[], maxCorridorDistance: number = 50): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = warehouses.map(w => ({
    id: w.id,
    lat: w.latitude,
    lng: w.longitude,
    name: w.name,
  }));

  const edges: Edge[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const distances: { to: string; dist: number; }[] = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i !== j) {
        distances.push({  
          to: nodes[j].id,
          dist: distance(nodes[i].lat, nodes[i].lng, nodes[j].lat, nodes[j].lng)
        });
      }
    }
    distances.sort((a, b) => a.dist - b.dist);
    for (let k = 0; k < Math.min(3, distances.length); k++) {
      const exists = edges.some(e => (e.from === nodes[i].id && e.to === distances[k].to) || (e.to === nodes[i].id && e.from === distances[k].to));
      if (!exists) {
        edges.push({
          from: nodes[i].id,
          to: distances[k].to,
          distance: distances[k].dist
        });
      }
    }
  }

  return { nodes, edges };
}

// Get route from source to drop point
export function getRoute(warehouses: any[], sourceId: string, dropPoint: { lat: number, lng: number }) {
  const { nodes, edges } = buildGraph(warehouses);

  const dropNodeId = "user-drop-point";
  nodes.push({ id: dropNodeId, lat: dropPoint.lat, lng: dropPoint.lng, name: "Delivery point" });

  let nearestDist = Infinity;
  let nearestWarehouseId = "";
  for (const w of warehouses) {
    const dist = distance(dropPoint.lat, dropPoint.lng, w.latitude, w.longitude);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestWarehouseId = w.id;
    }
  }

  edges.push({
    from: nearestWarehouseId,
    to: dropNodeId,
    distance: nearestDist
  });

  const result = dijkstra(nodes, edges, sourceId, dropNodeId);
  if (!result) return null;

  let lastLegDistance = 0;
  if (result.route.length >= 2) {
    const lastNode = result.route[result.route.length - 1];
    const prevNode = result.route[result.route.length - 2];
    lastLegDistance = distance(prevNode.lat, prevNode.lng, lastNode.lat, lastNode.lng);
  }

  return {
    path: result.route,
    distance: result.distance,
    corridorDistance: result.distance - lastLegDistance,
    lastLegDistance
  };
}
