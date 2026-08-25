import type { FeasibilityInput, FeasibilityResult, FeasibilityRule } from "./types";

// Fixed thresholds matching the fleet envelope used elsewhere in the app
// (Condor Heavy: 85kg / 157,500cm³ cargo bay / 35km range; Falcon X2: 28km
// standard range). This is a real, deterministic evaluation — not a mock —
// though it's a fixed rule set rather than a trained model (see the
// "Retrain Model" action on the console, which is explicitly theatrical).
export const MAX_FLEET_PAYLOAD_KG = 85;
export const MAX_FLEET_CARGO_VOLUME_CM3 = 70 * 50 * 45; // Condor Heavy cargo bay
export const MAX_FLEET_RANGE_KM = 35;
export const STANDARD_FLEET_RANGE_KM = 28;
export const MIN_BATTERY_MARGIN_PCT = 15;

export function classifyFeasibility(input: FeasibilityInput): FeasibilityResult {
  const rulePath: FeasibilityRule[] = [];

  const weightOk = input.weightKg <= MAX_FLEET_PAYLOAD_KG;
  rulePath.push({ rule: `Weight ≤ ${MAX_FLEET_PAYLOAD_KG}kg (max single-drone payload)`, passed: weightOk });
  if (!weightOk) {
    return { classification: "Reject", rulePath };
  }

  const volumeOk = input.volumeCm3 <= MAX_FLEET_CARGO_VOLUME_CM3;
  rulePath.push({
    rule: `Volume ≤ ${MAX_FLEET_CARGO_VOLUME_CM3.toLocaleString()}cm³ (largest cargo bay envelope)`,
    passed: volumeOk,
  });
  if (!volumeOk) {
    return { classification: "Reject", rulePath };
  }

  const rangeOk = input.distanceKm <= MAX_FLEET_RANGE_KM;
  rulePath.push({ rule: `Distance ≤ ${MAX_FLEET_RANGE_KM}km (max fleet range)`, passed: rangeOk });
  if (!rangeOk) {
    return { classification: "Reject", rulePath };
  }

  const standardRangeOk = input.distanceKm <= STANDARD_FLEET_RANGE_KM;
  rulePath.push({
    rule: `Distance ≤ ${STANDARD_FLEET_RANGE_KM}km (standard fleet range, no relay needed)`,
    passed: standardRangeOk,
  });

  const batteryOk = input.batteryMarginPct >= MIN_BATTERY_MARGIN_PCT;
  rulePath.push({
    rule: `Battery margin ≥ ${MIN_BATTERY_MARGIN_PCT}% for direct dispatch`,
    passed: batteryOk,
  });

  const weatherOk = !input.weatherFlag;
  rulePath.push({ rule: "Clear weather for direct flight", passed: weatherOk });

  const classification =
    standardRangeOk && batteryOk && weatherOk ? "Drone-Deliverable" : "Requires Split";

  return { classification, rulePath };
}
