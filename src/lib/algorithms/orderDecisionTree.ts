import type { PendingOrderRow } from './priorityQueue';

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  weight_kg: number; // per-unit weight
}

export interface DroneRow {
  id: string;
  max_payload_kg: number;
  home_warehouse_id: string;
  status: string; // only 'available' drones are used
}

export type DecisionOutcome = 'ASSIGN' | 'SPLIT' | 'HOLD';

export interface DroneAssignment {
  droneId: string;
  /** Items packed into this drone for this order. */
  items: {
    product_id: string;
    quantity: number;
    unitWeightKg: number;
    totalWeightKg: number;
  }[];
  totalWeightKg: number;
}

export interface OrderDecisionResult {
  orderId: string;
  outcome: DecisionOutcome;
  /** Populated for ASSIGN and SPLIT. */
  assignments: DroneAssignment[];
  /** Human-readable reason for HOLD. */
  holdReason?: string;
}

interface DroneSlot {
  droneId: string;
  remainingKg: number;
}

export function runOrderDecisionTree(
  prioritizedOrders: PendingOrderRow[],
  allOrderItems: OrderItemRow[],
  availableDrones: DroneRow[],
): OrderDecisionResult[] {

  // Build a mutable pool of available-drone slots.
  // Higher max_payload first so ASSIGN checks find the best-fit drone quickly.
  const dronePool: DroneSlot[] = availableDrones
    .filter((d) => d.status === 'available')
    .sort((a, b) => b.max_payload_kg - a.max_payload_kg)
    .map((d) => ({ droneId: d.id, remainingKg: d.max_payload_kg }));

  const results: OrderDecisionResult[] = [];

  for (const order of prioritizedOrders) {
    const orderWeight = Number(order.total_weight_kg);

    // ── Step 1: are there any available drones at all? ─────────────────────
    const freeDrones = dronePool.filter((s) => s.remainingKg > 0);
    if (freeDrones.length === 0) {
      results.push({
        orderId: order.id,
        outcome: 'HOLD',
        assignments: [],
        holdReason: 'No available drones in warehouse',
      });
      continue;
    }

    // ── Step 2: can a single drone carry the whole order? ──────────────────
    const singleDrone = freeDrones.find((s) => s.remainingKg >= orderWeight);
    if (singleDrone) {
      // ASSIGN — consume the capacity
      singleDrone.remainingKg -= orderWeight;

      // Build a flat assignment from the order items (for display purposes)
      const items = allOrderItems
        .filter((i) => i.order_id === order.id)
        .map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unitWeightKg: Number(i.weight_kg),
          totalWeightKg: i.quantity * Number(i.weight_kg),
        }));

      results.push({
        orderId: order.id,
        outcome: 'ASSIGN',
        assignments: [
          {
            droneId: singleDrone.droneId,
            items,
            totalWeightKg: orderWeight,
          },
        ],
      });
      continue;
    }

    // ── Step 3: try to split across multiple drones ────────────────────────
    const rawItems = allOrderItems.filter((i) => i.order_id === order.id);

    if (rawItems.length === 0) {
      // No item data — cannot split
      results.push({
        orderId: order.id,
        outcome: 'HOLD',
        assignments: [],
        holdReason: 'No item data available for splitting',
      });
      continue;
    }

    // Expand items by unit so we can pack whole units (never split a unit).
    // Sort heaviest unit first (First-Fit Decreasing heuristic).
    interface Unit {
      product_id: string;
      weightKg: number;
    }
    const units: Unit[] = [];
    for (const item of rawItems) {
      const unitW = Number(item.weight_kg);
      for (let q = 0; q < item.quantity; q++) {
        units.push({ product_id: item.product_id, weightKg: unitW });
      }
    }
    units.sort((a, b) => b.weightKg - a.weightKg);

    // Check if any single unit exceeds every drone's capacity (impossible to pack)
    const maxDroneCapacity = Math.max(...freeDrones.map((s) => s.remainingKg));
    const tooBigUnit = units.find((u) => u.weightKg > maxDroneCapacity);
    if (tooBigUnit) {
      results.push({
        orderId: order.id,
        outcome: 'HOLD',
        assignments: [],
        holdReason: `Item weighs ${tooBigUnit.weightKg} kg — exceeds every available drone's remaining capacity (max ${maxDroneCapacity} kg)`,
      });
      continue;
    }

    // Work on a LOCAL COPY of freeDrones so we don't commit capacity until we
    // know the full order can be packed.
    const localSlots: DroneSlot[] = freeDrones.map((s) => ({ ...s }));
    // Map: droneId → list of packed units (for building assignments)
    const packed = new Map<string, Unit[]>();

    let allPacked = true;
    for (const unit of units) {
      // First-fit: pick the drone with most remaining capacity that still fits
      const target = localSlots
        .filter((s) => s.remainingKg >= unit.weightKg)
        .sort((a, b) => b.remainingKg - a.remainingKg)[0];

      if (!target) {
        allPacked = false;
        break;
      }
      target.remainingKg -= unit.weightKg;
      const list = packed.get(target.droneId) ?? [];
      list.push(unit);
      packed.set(target.droneId, list);
    }

    if (!allPacked) {
      results.push({
        orderId: order.id,
        outcome: 'HOLD',
        assignments: [],
        holdReason: 'Not enough combined drone capacity for all items',
      });
      continue;
    }

    // Commit the local capacity changes back to the real dronePool
    for (const local of localSlots) {
      const real = dronePool.find((s) => s.droneId === local.droneId);
      if (real) real.remainingKg = local.remainingKg;
    }

    // Build structured assignments — collapse individual units back to items
    const assignments: DroneAssignment[] = [];
    for (const [droneId, packedUnits] of packed.entries()) {
      // Group by product_id
      const itemMap = new Map<string, { quantity: number; unitWeightKg: number }>();
      for (const u of packedUnits) {
        const existing = itemMap.get(u.product_id);
        if (existing) {
          existing.quantity += 1;
        } else {
          itemMap.set(u.product_id, { quantity: 1, unitWeightKg: u.weightKg });
        }
      }
      const items = Array.from(itemMap.entries()).map(([product_id, v]) => ({
        product_id,
        quantity: v.quantity,
        unitWeightKg: v.unitWeightKg,
        totalWeightKg: v.quantity * v.unitWeightKg,
      }));
      const totalWeightKg = items.reduce((s, i) => s + i.totalWeightKg, 0);
      assignments.push({ droneId, items, totalWeightKg });
    }

    results.push({ orderId: order.id, outcome: 'SPLIT', assignments });
  }

  return results;
}

