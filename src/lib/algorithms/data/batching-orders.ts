// Fixed "today's queue" for the Delivery Batching Console — kept separate
// from mock-data/orders.ts so the tour geometry stays clean and the
// knapsack `value` field (order subtotal) is unambiguous.
export interface BatchingOrder {
  id: string;
  label: string;
  x: number;
  y: number;
  weightKg: number;
  volumeCm3: number;
  value: number;
}

export const BATCHING_DEPOT = { id: "wh-01", label: "Northgate Distribution Center", x: 0, y: 0 };

export const BATCHING_ORDERS: BatchingOrder[] = [
  { id: "bo-01", label: "Riverside Loft", x: 3.2, y: 1.5, weightKg: 8, volumeCm3: 9000, value: 120 },
  { id: "bo-02", label: "Eastside Café", x: -2.1, y: 4.0, weightKg: 15, volumeCm3: 22000, value: 210 },
  { id: "bo-03", label: "Northgate Flats", x: 1.0, y: -3.5, weightKg: 22, volumeCm3: 31000, value: 340 },
  { id: "bo-04", label: "Southpark Homes", x: -4.5, y: -1.2, weightKg: 6, volumeCm3: 7000, value: 95 },
  { id: "bo-05", label: "Domain Towers", x: 5.0, y: 3.0, weightKg: 30, volumeCm3: 45000, value: 410 },
  { id: "bo-06", label: "Westlake Villas", x: -6.0, y: 2.5, weightKg: 12, volumeCm3: 18000, value: 180 },
  { id: "bo-07", label: "Mueller Row", x: 2.8, y: -4.0, weightKg: 18, volumeCm3: 26000, value: 260 },
  { id: "bo-08", label: "South Lamar Lofts", x: -3.0, y: -2.8, weightKg: 9, volumeCm3: 10000, value: 130 },
  { id: "bo-09", label: "Barton Creek Estates", x: 4.2, y: -1.0, weightKg: 25, volumeCm3: 36000, value: 350 },
];

// Target drone envelope for this queue (Falcon X2).
export const BATCHING_DRONE_CAPACITY = { maxWeightKg: 85, maxVolumeCm3: 60 * 45 * 40 };
