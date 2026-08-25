export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: "warehouse" | "charging_station" | "relay" | "delivery_zone";
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
  noFlyPenalty?: number;
}

export interface PathResult {
  algorithm: string;
  path: string[];
  totalDistanceKm: number;
  visitedOrder: string[];
  executionTimeMs: number;
  nodesExplored: number;
  found: boolean;
}

export interface MstResult {
  edges: GraphEdge[];
  totalCost: number;
  executionTimeMs: number;
}

export interface TourResult {
  order: string[];
  totalDistanceKm: number;
  iterations: number;
  costHistory: number[];
  executionTimeMs: number;
}

export interface FeasibilityInput {
  weightKg: number;
  volumeCm3: number;
  distanceKm: number;
  batteryMarginPct: number;
  weatherFlag: boolean;
}

export type FeasibilityClassification =
  | "Drone-Deliverable"
  | "Requires Split"
  | "Reject";

export interface FeasibilityRule {
  rule: string;
  passed: boolean;
}

export interface FeasibilityResult {
  classification: FeasibilityClassification;
  rulePath: FeasibilityRule[];
}
