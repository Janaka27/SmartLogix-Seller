import type { BenchmarkAlgorithm, BenchmarkLog } from "@/lib/types";

interface AlgoProfile {
  algorithm: BenchmarkAlgorithm;
  baseMs: number;
  msPerN: number;
  summary: (n: number) => string;
}

const PROFILES: AlgoProfile[] = [
  { algorithm: "dijkstra", baseMs: 0.4, msPerN: 0.08, summary: (n) => `Shortest path resolved over ${n} nodes` },
  { algorithm: "a_star", baseMs: 0.3, msPerN: 0.05, summary: (n) => `Heuristic path resolved over ${n} nodes` },
  { algorithm: "bellman_ford", baseMs: 0.6, msPerN: 0.22, summary: (n) => `Path relaxed over ${n} nodes, negative-edge safe` },
  { algorithm: "prim", baseMs: 0.5, msPerN: 0.14, summary: (n) => `MST built over ${n} warehouse/charging nodes` },
  { algorithm: "knapsack", baseMs: 0.9, msPerN: 0.35, summary: (n) => `Selected optimal order set from ${n} candidates` },
  { algorithm: "simulated_annealing", baseMs: 4.2, msPerN: 0.9, summary: (n) => `Converged tour over ${n} stops` },
  { algorithm: "decision_tree", baseMs: 0.05, msPerN: 0.01, summary: (n) => `Classified feasibility for ${n} orders` },
];

// 5 deterministic runs per algorithm, spread over the last 15 days.
const N_SEQUENCE = [8, 10, 12, 15, 20];

function buildLogs(): BenchmarkLog[] {
  const logs: BenchmarkLog[] = [];
  let dayOffset = 0;

  for (const profile of PROFILES) {
    N_SEQUENCE.forEach((n, i) => {
      dayOffset += 1;
      const runAt = new Date(Date.UTC(2026, 7, 25 - dayOffset, 6 + i, 15, 0)).toISOString();
      const jitter = ((i * 37 + profile.baseMs * 100) % 11) / 10; // deterministic 0-1.1 jitter
      const executionTimeMs = Number((profile.baseMs + profile.msPerN * n + jitter).toFixed(2));
      const success = !(profile.algorithm === "simulated_annealing" && i === 3); // one deterministic near-miss

      logs.push({
        id: `bl-${String(logs.length + 1).padStart(4, "0")}`,
        algorithm: profile.algorithm,
        runAt,
        inputSizeN: n,
        executionTimeMs,
        resultSummary: success
          ? profile.summary(n)
          : `Did not converge within iteration budget for ${n} stops`,
        success,
      });
    });
  }

  return logs;
}

export const benchmarkLogs: BenchmarkLog[] = buildLogs();
