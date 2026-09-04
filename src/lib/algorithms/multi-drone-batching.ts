import { runSimulatedAnnealing, type TourStop } from "./simulated-annealing";
import type { BatchingOrder } from "./data/batching-orders";
import type { TourResult } from "./types";

export interface DroneCapacity {
  maxWeightKg: number;
  maxVolumeCm3: number;
}

export interface MultiDroneBatchingOptions {
  /** Hard cap on stops per flight — one drone does 2-4 lightweight stops before returning to base. */
  maxStopsPerDrone?: number;
  seed?: number;
}

export interface DroneBatch {
  droneIndex: number;
  stops: BatchingOrder[];
  /** Depot -> stops (SA-sequenced) -> depot. */
  stopIds: string[];
  tour: TourResult;
  totalWeightKg: number;
  totalVolumeCm3: number;
  totalValue: number;
  weightUtilizationPct: number;
  volumeUtilizationPct: number;
}

export interface MultiDroneBatchingResult {
  batches: DroneBatch[];
  totalDrones: number;
  totalOrders: number;
  totalDistanceKm: number;
  executionTimeMs: number;
}

function polarAngle(depot: { x: number; y: number }, order: { x: number; y: number }) {
  return Math.atan2(order.y - depot.y, order.x - depot.x);
}

function partitionEvenly<T>(items: T[], parts: number): T[][] {
  const result: T[][] = [];
  const base = Math.floor(items.length / parts);
  let remainder = items.length % parts;
  let idx = 0;
  for (let p = 0; p < parts; p++) {
    const size = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    result.push(items.slice(idx, idx + size));
    idx += size;
  }
  return result;
}

function minDronesNeeded(orders: BatchingOrder[], capacity: DroneCapacity, maxStopsPerDrone: number) {
  const totalWeight = orders.reduce((s, o) => s + o.weightKg, 0);
  const totalVolume = orders.reduce((s, o) => s + o.volumeCm3, 0);
  return Math.max(
    1,
    Math.ceil(orders.length / maxStopsPerDrone),
    Math.ceil(totalWeight / capacity.maxWeightKg),
    Math.ceil(totalVolume / capacity.maxVolumeCm3)
  );
}

/**
 * Multi-vehicle extension of the single-drone batching console: a sweep
 * (polar-angle) clustering pass groups today's orders into geographically
 * coherent flights of 2-4 stops each, respecting per-drone weight/volume
 * capacity, then Simulated Annealing sequences each flight's closed loop
 * independently (depot -> stops -> depot). Cluster-first-route-second is the
 * standard heuristic for turning a single-vehicle TSP solver into a
 * multi-vehicle routing solution without a combinatorial blow-up.
 */
export function runMultiDroneBatching(
  depot: { id: string; label: string; x: number; y: number },
  orders: BatchingOrder[],
  capacity: DroneCapacity,
  options: MultiDroneBatchingOptions = {}
): MultiDroneBatchingResult {
  const start = performance.now();
  const { maxStopsPerDrone = 4, seed = 42 } = options;

  console.log(`\n======================================================`);
  console.log(`[Multi-Drone Batching] INITIALIZING ALGORITHM`);
  console.log(`[Multi-Drone Batching] Depot: ${depot.label} (${depot.id})`);
  console.log(`[Multi-Drone Batching] Total Orders: ${orders.length}`);
  console.log(`[Multi-Drone Batching] Drone Capacity: ${capacity.maxWeightKg} kg / ${capacity.maxVolumeCm3} cm³`);
  console.log(`[Multi-Drone Batching] Max Stops Per Drone: ${maxStopsPerDrone}`);
  console.log(`======================================================\n`);

  if (orders.length === 0) {
    console.log(`[Multi-Drone Batching] No orders in queue. Returning empty fleet.\n`);
    return { batches: [], totalDrones: 0, totalOrders: 0, totalDistanceKm: 0, executionTimeMs: 0 };
  }

  console.log(`[Multi-Drone Batching - Sweep] Sorting orders by bearing from depot...`);
  const sorted = [...orders].sort((a, b) => polarAngle(depot, a) - polarAngle(depot, b));
  console.log(`[Multi-Drone Batching - Sweep] Angular order: ${sorted.map((o) => o.label).join(" -> ")}`);

  const totalWeight = sorted.reduce((s, o) => s + o.weightKg, 0);
  const totalVolume = sorted.reduce((s, o) => s + o.volumeCm3, 0);
  console.log(
    `[Multi-Drone Batching - Fleet Sizing] Lower bound (stops): ceil(${sorted.length} / ${maxStopsPerDrone}) = ${Math.ceil(
      sorted.length / maxStopsPerDrone
    )}`
  );
  console.log(
    `[Multi-Drone Batching - Fleet Sizing] Lower bound (weight): ceil(${totalWeight} / ${capacity.maxWeightKg}) = ${Math.ceil(
      totalWeight / capacity.maxWeightKg
    )}`
  );
  console.log(
    `[Multi-Drone Batching - Fleet Sizing] Lower bound (volume): ceil(${totalVolume} / ${capacity.maxVolumeCm3}) = ${Math.ceil(
      totalVolume / capacity.maxVolumeCm3
    )}`
  );

  let numDrones = minDronesNeeded(sorted, capacity, maxStopsPerDrone);
  let clusters: BatchingOrder[][] = [];

  // Grow the fleet size until an even angular split respects both the
  // stop-count cap and every drone's weight/volume envelope.
  while (numDrones <= sorted.length) {
    console.log(`\n[Multi-Drone Batching - Partitioning] Trying ${numDrones} drone(s)...`);
    clusters = partitionEvenly(sorted, numDrones);
    let feasible = true;
    clusters.forEach((cluster, idx) => {
      const weight = cluster.reduce((s, o) => s + o.weightKg, 0);
      const volume = cluster.reduce((s, o) => s + o.volumeCm3, 0);
      const ok = cluster.length <= maxStopsPerDrone && weight <= capacity.maxWeightKg && volume <= capacity.maxVolumeCm3;
      if (!ok) feasible = false;
      console.log(
        `[Multi-Drone Batching - Partitioning] Drone ${idx + 1}: ${cluster.length} stops, ${weight}kg, ${volume}cm³ -> ${
          ok ? "within capacity" : "EXCEEDS capacity"
        }`
      );
    });
    if (feasible) {
      console.log(`[Multi-Drone Batching] => FEASIBLE with ${numDrones} drone(s). Fleet locked.\n`);
      break;
    }
    console.log(`[Multi-Drone Batching] => INFEASIBLE with ${numDrones} drone(s). Growing fleet.`);
    numDrones++;
  }

  const batches: DroneBatch[] = clusters.map((cluster, idx) => {
    console.log(`------------------------------------------------------`);
    console.log(`[Multi-Drone Batching] Sequencing Drone ${idx + 1} (${cluster.length} stops) with Simulated Annealing...`);
    const stops: TourStop[] = cluster.map((o) => ({ id: o.id, label: o.label, x: o.x, y: o.y }));
    const tour = runSimulatedAnnealing(depot, stops, { seed: seed + idx });
    const totalWeightKg = Number(cluster.reduce((s, o) => s + o.weightKg, 0).toFixed(2));
    const totalVolumeCm3 = cluster.reduce((s, o) => s + o.volumeCm3, 0);
    const totalValue = Number(cluster.reduce((s, o) => s + o.value, 0).toFixed(2));
    const stopLabels = tour.order.map((id) => cluster.find((o) => o.id === id)?.label ?? id);

    console.log(
      `[Simulated Annealing] Seed: ${seed + idx} | Iterations: ${tour.iterations} | Runtime: ${tour.executionTimeMs}ms`
    );
    console.log(`[Simulated Annealing] Best distance found: ${tour.totalDistanceKm} km`);
    console.log(
      `[Multi-Drone Batching] => Drone ${idx + 1} tour locked: ${depot.label} -> ${stopLabels.join(" -> ")} -> ${depot.label} (${
        tour.totalDistanceKm
      } km)\n`
    );

    return {
      droneIndex: idx,
      stops: cluster,
      stopIds: [depot.id, ...tour.order, depot.id],
      tour,
      totalWeightKg,
      totalVolumeCm3,
      totalValue,
      weightUtilizationPct: Number(((totalWeightKg / capacity.maxWeightKg) * 100).toFixed(1)),
      volumeUtilizationPct: Number(((totalVolumeCm3 / capacity.maxVolumeCm3) * 100).toFixed(1)),
    };
  });

  const totalDistanceKm = Number(batches.reduce((s, b) => s + b.tour.totalDistanceKm, 0).toFixed(2));
  const avgUtilization = Number(
    (
      batches.reduce((s, b) => s + (b.weightUtilizationPct + b.volumeUtilizationPct) / 2, 0) / batches.length
    ).toFixed(1)
  );
  const executionTimeMs = Number((performance.now() - start).toFixed(3));

  console.log(`======================================================`);
  console.log(`[Multi-Drone Batching] ALGORITHM COMPLETED`);
  console.log(`[Multi-Drone Batching] Drones Dispatched: ${batches.length}`);
  console.log(`[Multi-Drone Batching] Orders Batched: ${orders.length}`);
  console.log(`[Multi-Drone Batching] Combined Distance: ${totalDistanceKm} km`);
  console.log(`[Multi-Drone Batching] Average Capacity Utilization: ${avgUtilization}%`);
  console.log(`[Multi-Drone Batching] Total Execution Time: ${executionTimeMs}ms`);
  console.log(`======================================================\n`);

  return {
    batches,
    totalDrones: batches.length,
    totalOrders: orders.length,
    totalDistanceKm,
    executionTimeMs,
  };
}
