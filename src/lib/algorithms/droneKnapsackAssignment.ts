import { runKnapsack, type KnapsackItem } from './knapsack';
import type { PendingOrderRow } from './priorityQueue';

export interface FullOrderRow extends PendingOrderRow {
  total_volume_cm3: number;
  distance_km: number | null; // nullable in DB
}

export interface FullOrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  weight_kg: number;   // per-unit weight
  volume_cm3: number;  // per-unit volume
}

export interface FullDroneRow {
  id: string;
  max_payload_kg: number;
  cargo_bay_volume_cm3: number;
  max_range_km: number;
  status: string;           // only 'available' drones are used
  home_warehouse_id: string;
}

export type KnapsackDecisionOutcome = 'ASSIGN' | 'SPLIT' | 'HOLD';

export interface AllocatedItem {
  product_id: string;
  quantity: number;
  unitWeightKg: number;
  unitVolumeCm3: number;
  totalWeightKg: number;
  totalVolumeCm3: number;
}

export interface DroneAllocation {
  droneId: string;
  items: AllocatedItem[];
  totalWeightKg: number;
  totalVolumeCm3: number;
}

export interface KnapsackAssignmentResult {
  orderId: string;
  outcome: KnapsackDecisionOutcome;
  allocations: DroneAllocation[];
  holdReason?: string;
}

interface DroneSlot {
  droneId: string;
  remainingPayloadKg: number;
  remainingVolumeCm3: number;
  maxRangeKm: number;
}


/** Round to 4 decimal places to avoid float drift. */
const r4 = (n: number) => Math.round(n * 10_000) / 10_000;

/**
 * Use the Knapsack DP to pick the single best-fitting drone for an order.
 *
 * Each drone is treated as a knapsack "item":
 *   weightKg  = order's total weight  (all drones have the same "cost")
 *   volumeCm3 = order's total volume  (same)
 *   value     = tightness score — the drone that wastes the least payload
 *               after carrying the order scores highest. Drones that cannot
 *               fit the order at all get value 0 and are filtered out before
 *               the DP runs.
 *
 * Concretely we pass ONE item (the order itself) to the knapsack and let
 * the DP compare every eligible drone's "remaining capacity" value.
 * The selected drone(s) from the DP are the best fit.
 *
 * Returns the winning DroneSlot, or null if no drone can carry the order.
 */
function pickBestDrone(
  orderWeightKg: number,
  orderVolumeCm3: number,
  orderDistanceKm: number,
  eligibleSlots: DroneSlot[],
): DroneSlot | null {
  if (eligibleSlots.length === 0) return null;

  // Build one KnapsackItem per eligible drone.
  // "value" = how tight the fit is (higher = less wasted capacity after).
  const kItems: KnapsackItem[] = eligibleSlots
    .filter(
      (s) =>
        s.remainingPayloadKg >= orderWeightKg &&
        s.remainingVolumeCm3 >= orderVolumeCm3 &&
        s.maxRangeKm >= orderDistanceKm,
    )
    .map((s) => ({
      id: s.droneId,
      label: s.droneId,
      // Use the order weight/volume as the "cost" of the item — the knapsack
      // capacity is set to the drone's remaining capacity, so we pass the
      // largest feasible drone capacity as the knapsack capacity and let the
      // DP pick the one with the highest value.
      weightKg: orderWeightKg,
      volumeCm3: orderVolumeCm3,
      // Value = tightness: lower leftover payload = higher score.
      // Normalise 0–100 so all drones produce comparable scores.
      value: r4(
        100 * (1 - (s.remainingPayloadKg - orderWeightKg) / s.remainingPayloadKg),
      ),
    }));

  if (kItems.length === 0) return null;

  // Give the DP enough headroom to always select exactly one item.
  const maxCapacityKg = Math.max(...eligibleSlots.map((s) => s.remainingPayloadKg));
  const maxCapacityVol = Math.max(...eligibleSlots.map((s) => s.remainingVolumeCm3));

  const result = runKnapsack(kItems, maxCapacityKg, maxCapacityVol);

  if (result.selectedIds.length === 0) return null;

  // The DP may pick more than one drone if values are equal — take the first
  // (highest-scoring, which is the tightest fit).
  const bestId = result.selectedIds[0];
  return eligibleSlots.find((s) => s.droneId === bestId) ?? null;
}


/**
 * Run the Decision Tree → Knapsack → Assignment pipeline over a list of
 * already-prioritized pending orders.
 *
 * @param prioritizedOrders  Output of `prioritizePendingOrders()`.
 * @param allOrderItems      ALL order_items rows for the relevant orders.
 * @param allDrones          All drones for the warehouse.
 */
export function runDroneKnapsackAssignment(
  prioritizedOrders: FullOrderRow[],
  allOrderItems: FullOrderItemRow[],
  allDrones: FullDroneRow[],
): KnapsackAssignmentResult[] {

  // Build an immutable-to-caller but mutable-to-us drone pool.
  // Only `available` drones enter the pool.
  const dronePool: DroneSlot[] = allDrones
    .filter((d) => d.status === 'available')
    .map((d) => ({
      droneId: d.id,
      remainingPayloadKg: Number(d.max_payload_kg),
      remainingVolumeCm3: Number(d.cargo_bay_volume_cm3),
      maxRangeKm: Number(d.max_range_km),
    }));

  const results: KnapsackAssignmentResult[] = [];

  for (const order of prioritizedOrders) {
    const orderWeightKg = Number(order.total_weight_kg);
    const orderVolumeCm3 = Number(order.total_volume_cm3);
    const orderDistKm = Number(order.distance_km ?? 0);

    // ── Step 1: Decision Tree ─────────────────────────────────────────────
    // Are there any available drones whose range reaches the delivery point?
    const eligibleSlots = dronePool.filter(
      (s) => s.remainingPayloadKg > 0 && s.maxRangeKm >= orderDistKm,
    );

    if (eligibleSlots.length === 0) {
      results.push({
        orderId: order.id,
        outcome: 'HOLD',
        allocations: [],
        holdReason: dronePool.length === 0
          ? 'No available drones in warehouse'
          : `No drone has sufficient range for ${orderDistKm} km delivery`,
      });
      continue;
    }

    // ── Step 2: Knapsack — try to fit the whole order on one drone ────────
    const bestDrone = pickBestDrone(
      orderWeightKg,
      orderVolumeCm3,
      orderDistKm,
      eligibleSlots,
    );

    if (bestDrone) {
      // ASSIGN — consume capacity
      bestDrone.remainingPayloadKg = r4(bestDrone.remainingPayloadKg - orderWeightKg);
      bestDrone.remainingVolumeCm3 = r4(bestDrone.remainingVolumeCm3 - orderVolumeCm3);

      const items = allOrderItems
        .filter((i) => i.order_id === order.id)
        .map((i): AllocatedItem => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unitWeightKg: Number(i.weight_kg),
          unitVolumeCm3: Number(i.volume_cm3),
          totalWeightKg: r4(i.quantity * Number(i.weight_kg)),
          totalVolumeCm3: r4(i.quantity * Number(i.volume_cm3)),
        }));

      results.push({
        orderId: order.id,
        outcome: 'ASSIGN',
        allocations: [{
          droneId: bestDrone.droneId,
          items,
          totalWeightKg: orderWeightKg,
          totalVolumeCm3: orderVolumeCm3,
        }],
      });
      continue;
    }

    // ── Step 3: No single drone fits — try splitting across multiple drones
    const rawItems = allOrderItems.filter((i) => i.order_id === order.id);

    if (rawItems.length === 0) {
      results.push({
        orderId: order.id,
        outcome: 'HOLD',
        allocations: [],
        holdReason: 'No item data available to attempt splitting',
      });
      continue;
    }

    // Expand to individual units (never split a single unit).
    // Sort heaviest + largest-volume units first (First-Fit Decreasing).
    interface Unit {
      product_id: string;
      weightKg: number;
      volumeCm3: number;
    }
    const units: Unit[] = [];
    for (const item of rawItems) {
      const uw = Number(item.weight_kg);
      const uv = Number(item.volume_cm3);
      for (let q = 0; q < item.quantity; q++) {
        units.push({ product_id: item.product_id, weightKg: uw, volumeCm3: uv });
      }
    }
    units.sort((a, b) => b.weightKg - a.weightKg || b.volumeCm3 - a.volumeCm3);

    // Check if any unit is too large for every eligible drone
    const tooBig = units.find(
      (u) => !eligibleSlots.some(
        (s) => s.remainingPayloadKg >= u.weightKg && s.remainingVolumeCm3 >= u.volumeCm3,
      ),
    );
    if (tooBig) {
      results.push({
        orderId: order.id,
        outcome: 'HOLD',
        allocations: [],
        holdReason: `A single product unit (${tooBig.weightKg} kg / ${tooBig.volumeCm3} cm³) exceeds all drone capacities`,
      });
      continue;
    }

    // Work on LOCAL copies of eligible slots so we only commit on full success
    const localSlots: DroneSlot[] = eligibleSlots.map((s) => ({ ...s }));
    const packedUnits = new Map<string, Unit[]>(); // droneId → packed units

    let allPacked = true;
    for (const unit of units) {
      // Among local slots: pick the tightest-fitting one (least wasted payload)
      const target = localSlots
        .filter(
          (s) =>
            s.remainingPayloadKg >= unit.weightKg &&
            s.remainingVolumeCm3 >= unit.volumeCm3,
        )
        .sort(
          (a, b) =>
            (a.remainingPayloadKg - unit.weightKg) -
            (b.remainingPayloadKg - unit.weightKg),
        )[0];

      if (!target) {
        allPacked = false;
        break;
      }

      target.remainingPayloadKg = r4(target.remainingPayloadKg - unit.weightKg);
      target.remainingVolumeCm3 = r4(target.remainingVolumeCm3 - unit.volumeCm3);
      const list = packedUnits.get(target.droneId) ?? [];
      list.push(unit);
      packedUnits.set(target.droneId, list);
    }

    if (!allPacked) {
      results.push({
        orderId: order.id,
        outcome: 'HOLD',
        allocations: [],
        holdReason: 'Not enough combined drone capacity (weight + volume) to split the order',
      });
      continue;
    }

    // Commit local slot changes back to the real pool
    for (const local of localSlots) {
      const real = dronePool.find((s) => s.droneId === local.droneId);
      if (real) {
        real.remainingPayloadKg = local.remainingPayloadKg;
        real.remainingVolumeCm3 = local.remainingVolumeCm3;
      }
    }

    // Build structured DroneAllocation — collapse units back to item groups
    const allocations: DroneAllocation[] = [];
    for (const [droneId, unitList] of packedUnits.entries()) {
      const itemMap = new Map<string, { qty: number; unitW: number; unitV: number }>();
      for (const u of unitList) {
        const existing = itemMap.get(u.product_id);
        if (existing) {
          existing.qty += 1;
        } else {
          itemMap.set(u.product_id, { qty: 1, unitW: u.weightKg, unitV: u.volumeCm3 });
        }
      }
      const items: AllocatedItem[] = Array.from(itemMap.entries()).map(
        ([pid, v]) => ({
          product_id: pid,
          quantity: v.qty,
          unitWeightKg: v.unitW,
          unitVolumeCm3: v.unitV,
          totalWeightKg: r4(v.qty * v.unitW),
          totalVolumeCm3: r4(v.qty * v.unitV),
        }),
      );
      allocations.push({
        droneId,
        items,
        totalWeightKg: r4(items.reduce((s, i) => s + i.totalWeightKg, 0)),
        totalVolumeCm3: r4(items.reduce((s, i) => s + i.totalVolumeCm3, 0)),
      });
    }

    results.push({ orderId: order.id, outcome: 'SPLIT', allocations });
  }

  return results;
}

