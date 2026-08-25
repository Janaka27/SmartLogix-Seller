export interface KnapsackItem {
  id: string;
  label: string;
  weightKg: number;
  volumeCm3: number;
  value: number;
}

export interface KnapsackResult {
  selectedIds: string[];
  totalWeightKg: number;
  totalVolumeCm3: number;
  totalValue: number;
  executionTimeMs: number;
}

// Standard 0/1 knapsack DP over weight (discretized to 0.1kg steps), then
// volume is applied as a feasibility filter on the selected set — dropping
// the lowest value-per-volume items until it fits the cargo bay. This
// mirrors the two-step simplification the design doc suggests for the
// weight+volume constrained variant.
export function runKnapsack(
  items: KnapsackItem[],
  maxWeightKg: number,
  maxVolumeCm3: number
): KnapsackResult {
  const start = performance.now();
  const SCALE = 10; // 0.1kg resolution
  const capacity = Math.round(maxWeightKg * SCALE);
  const n = items.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    const w = Math.round(item.weightKg * SCALE);
    for (let c = 0; c <= capacity; c++) {
      dp[i][c] = dp[i - 1][c];
      if (w <= c) {
        dp[i][c] = Math.max(dp[i][c], dp[i - 1][c - w] + item.value);
      }
    }
  }

  let selected: KnapsackItem[] = [];
  let c = capacity;
  for (let i = n; i > 0; i--) {
    if (dp[i][c] !== dp[i - 1][c]) {
      const item = items[i - 1];
      selected.push(item);
      c -= Math.round(item.weightKg * SCALE);
    }
  }

  // Volume feasibility filter: drop lowest value/volume items until it fits.
  let totalVolume = selected.reduce((sum, item) => sum + item.volumeCm3, 0);
  if (totalVolume > maxVolumeCm3) {
    selected = [...selected].sort((a, b) => a.value / a.volumeCm3 - b.value / b.volumeCm3);
    while (totalVolume > maxVolumeCm3 && selected.length > 0) {
      const dropped = selected.shift()!;
      totalVolume -= dropped.volumeCm3;
    }
  }

  const totalWeightKg = Number(selected.reduce((sum, item) => sum + item.weightKg, 0).toFixed(2));
  const totalValue = Number(selected.reduce((sum, item) => sum + item.value, 0).toFixed(2));

  return {
    selectedIds: selected.map((item) => item.id),
    totalWeightKg,
    totalVolumeCm3: totalVolume,
    totalValue,
    executionTimeMs: Number((performance.now() - start).toFixed(3)),
  };
}
