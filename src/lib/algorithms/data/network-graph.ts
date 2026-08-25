import type { GraphEdge, GraphNode } from "../types";

// Same coordinate space as route-graph.ts, but this dataset is about
// infrastructure build cost ($k), not flight distance — deliberately kept
// separate so Prim's MST (build cost) doesn't get confused with the Route
// Optimization Console (flight distance).
export const NETWORK_NODES: GraphNode[] = [
  { id: "wh-01", label: "Northgate DC", x: 250, y: 280, type: "warehouse" },
  { id: "wh-02", label: "Riverside Hub", x: 310, y: 180, type: "warehouse" },
  { id: "wh-03", label: "Eastside Micro-WH", x: 380, y: 340, type: "warehouse" },
  { id: "wh-04", label: "Southpark Relay", x: 180, y: 420, type: "relay" },
  { id: "wh-05", label: "Westlake FC", x: 80, y: 140, type: "warehouse" },
  { id: "wh-06", label: "Domain Charging", x: 270, y: 40, type: "charging_station" },
  { id: "cs-01", label: "Mueller Charging Site (candidate)", x: 440, y: 90, type: "charging_station" },
  { id: "cs-02", label: "South Charging Site (candidate)", x: 30, y: 380, type: "charging_station" },
];

export const NETWORK_EDGE_COSTS: GraphEdge[] = [
  { from: "wh-01", to: "wh-02", weight: 42 },
  { from: "wh-01", to: "wh-03", weight: 58 },
  { from: "wh-01", to: "wh-04", weight: 31 },
  { from: "wh-01", to: "wh-05", weight: 65 },
  { from: "wh-01", to: "wh-06", weight: 70 },
  { from: "wh-01", to: "cs-01", weight: 88 },
  { from: "wh-01", to: "cs-02", weight: 47 },
  { from: "wh-02", to: "wh-03", weight: 39 },
  { from: "wh-02", to: "wh-04", weight: 60 },
  { from: "wh-02", to: "wh-05", weight: 71 },
  { from: "wh-02", to: "wh-06", weight: 45 },
  { from: "wh-02", to: "cs-01", weight: 52 },
  { from: "wh-02", to: "cs-02", weight: 82 },
  { from: "wh-03", to: "wh-04", weight: 66 },
  { from: "wh-03", to: "wh-06", weight: 61 },
  { from: "wh-03", to: "cs-01", weight: 34 },
  { from: "wh-03", to: "cs-02", weight: 95 },
  { from: "wh-04", to: "wh-05", weight: 58 },
  { from: "wh-04", to: "cs-02", weight: 40 },
  { from: "wh-05", to: "wh-06", weight: 77 },
  { from: "wh-05", to: "cs-02", weight: 36 },
  { from: "wh-06", to: "cs-01", weight: 48 },
];
