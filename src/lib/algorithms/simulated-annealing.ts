import { createSeededRandom } from "./seeded-random";
import type { TourResult } from "./types";

export interface TourStop {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface SimulatedAnnealingOptions {
  seed?: number;
  iterations?: number;
  startTemp?: number;
  coolingRate?: number;
}

function distance(a: TourStop, b: TourStop) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function tourLength(depot: TourStop, order: TourStop[]) {
  let total = 0;
  let prev = depot;
  for (const stop of order) {
    total += distance(prev, stop);
    prev = stop;
  }
  total += distance(prev, depot); // closed loop back to depot
  return total;
}

// Classic swap + geometric cooling schedule producing a closed-loop tour
// (depot -> stop1 -> stop2 -> ... -> depot). Seeded so results reproduce
// across runs/screenshots.
export function runSimulatedAnnealing(
  depot: TourStop,
  stops: TourStop[],
  options: SimulatedAnnealingOptions = {}
): TourResult {
  const start = performance.now();
  const { seed = 42, iterations = 2000, startTemp = 100, coolingRate = 0.995 } = options;
  const random = createSeededRandom(seed);

  let current = [...stops];
  let currentCost = tourLength(depot, current);
  let best = [...current];
  let bestCost = currentCost;
  let temperature = startTemp;
  const costHistory: number[] = [Number(bestCost.toFixed(3))];

  for (let iter = 0; iter < iterations; iter++) {
    if (current.length >= 2) {
      const i = Math.floor(random() * current.length);
      let j = Math.floor(random() * current.length);
      if (i === j) j = (j + 1) % current.length;

      const candidate = [...current];
      [candidate[i], candidate[j]] = [candidate[j], candidate[i]];
      const candidateCost = tourLength(depot, candidate);
      const delta = candidateCost - currentCost;

      if (delta < 0 || random() < Math.exp(-delta / Math.max(temperature, 0.01))) {
        current = candidate;
        currentCost = candidateCost;
        if (currentCost < bestCost) {
          best = [...current];
          bestCost = currentCost;
        }
      }
    }
    temperature *= coolingRate;
    if (iter % Math.max(1, Math.floor(iterations / 40)) === 0) {
      costHistory.push(Number(bestCost.toFixed(3)));
    }
  }
  costHistory.push(Number(bestCost.toFixed(3)));

  return {
    order: best.map((stop) => stop.id),
    totalDistanceKm: Number(bestCost.toFixed(2)),
    iterations,
    costHistory,
    executionTimeMs: Number((performance.now() - start).toFixed(3)),
  };
}
