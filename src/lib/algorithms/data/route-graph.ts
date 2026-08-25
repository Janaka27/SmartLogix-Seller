import type { GraphEdge, GraphNode } from "../types";

// Local (x,y) layout for SVG rendering, not real lat/lng — roughly echoes
// the relative positions of the mock warehouses in src/lib/mock-data.
export const ROUTE_NODES: GraphNode[] = [
  { id: "wh-01", label: "Northgate DC", x: 250, y: 280, type: "warehouse" },
  { id: "wh-02", label: "Riverside Hub", x: 310, y: 180, type: "warehouse" },
  { id: "wh-03", label: "Eastside Micro-WH", x: 380, y: 340, type: "warehouse" },
  { id: "wh-05", label: "Westlake FC", x: 80, y: 140, type: "warehouse" },
  { id: "wh-04", label: "Southpark Relay", x: 180, y: 420, type: "relay" },
  { id: "wh-06", label: "Domain Charging", x: 270, y: 40, type: "charging_station" },
  { id: "dz-01", label: "Downtown", x: 150, y: 250, type: "delivery_zone" },
  { id: "dz-02", label: "East Riverside", x: 350, y: 250, type: "delivery_zone" },
  { id: "dz-03", label: "Mueller", x: 420, y: 150, type: "delivery_zone" },
  { id: "dz-04", label: "South Lamar", x: 60, y: 300, type: "delivery_zone" },
  { id: "dz-05", label: "North Loop", x: 200, y: 100, type: "delivery_zone" },
  { id: "dz-06", label: "Southeast", x: 440, y: 380, type: "delivery_zone" },
];

export const ROUTE_EDGES: GraphEdge[] = [
  { from: "wh-01", to: "dz-01", weight: 4.2 },
  { from: "wh-01", to: "wh-04", weight: 6.5 },
  { from: "wh-01", to: "dz-04", weight: 5.8 },
  { from: "wh-02", to: "dz-01", weight: 5.0 },
  { from: "wh-02", to: "dz-02", weight: 3.6 },
  { from: "wh-02", to: "dz-03", weight: 7.2 },
  { from: "wh-02", to: "wh-06", weight: 8.1 },
  { from: "wh-03", to: "dz-02", weight: 4.4 },
  { from: "wh-03", to: "dz-06", weight: 6.0 },
  { from: "wh-03", to: "dz-03", weight: 8.5 },
  { from: "wh-05", to: "dz-04", weight: 6.3 },
  { from: "wh-05", to: "dz-05", weight: 5.1 },
  { from: "wh-05", to: "wh-06", weight: 9.0 },
  { from: "wh-04", to: "dz-04", weight: 3.9 },
  { from: "wh-04", to: "dz-01", weight: 5.5, noFlyPenalty: 3 },
  { from: "wh-06", to: "dz-05", weight: 4.0 },
  { from: "dz-01", to: "dz-02", weight: 6.8 },
  { from: "dz-02", to: "dz-06", weight: 5.2 },
  { from: "dz-05", to: "wh-02", weight: 7.4 },
];
