import type { InventoryRecord } from "@/lib/types";

// Per-warehouse stock breakdown. Rows for the same productId sum to that
// product's Product.stockQty (see products.ts).
export const inventoryRecords: InventoryRecord[] = [
  { id: "inv-01", productId: "pd-001", warehouseId: "wh-01", stockQty: 80, reorderThreshold: 20 },
  { id: "inv-02", productId: "pd-001", warehouseId: "wh-02", stockQty: 40, reorderThreshold: 10 },
  { id: "inv-03", productId: "pd-002", warehouseId: "wh-02", stockQty: 80, reorderThreshold: 15 },
  { id: "inv-04", productId: "pd-003", warehouseId: "wh-01", stockQty: 300, reorderThreshold: 50 },
  { id: "inv-05", productId: "pd-004", warehouseId: "wh-01", stockQty: 150, reorderThreshold: 25 },
  { id: "inv-06", productId: "pd-005", warehouseId: "wh-02", stockQty: 30, reorderThreshold: 8 },
  { id: "inv-07", productId: "pd-005", warehouseId: "wh-05", stockQty: 15, reorderThreshold: 5 },
  { id: "inv-08", productId: "pd-006", warehouseId: "wh-05", stockQty: 30, reorderThreshold: 8 },
  { id: "inv-09", productId: "pd-007", warehouseId: "wh-03", stockQty: 200, reorderThreshold: 40 },
  { id: "inv-10", productId: "pd-008", warehouseId: "wh-03", stockQty: 60, reorderThreshold: 15 },
  { id: "inv-11", productId: "pd-009", warehouseId: "wh-05", stockQty: 90, reorderThreshold: 20 },
  { id: "inv-12", productId: "pd-010", warehouseId: "wh-05", stockQty: 70, reorderThreshold: 15 },
  { id: "inv-13", productId: "pd-011", warehouseId: "wh-01", stockQty: 8, reorderThreshold: 3 },
  { id: "inv-14", productId: "pd-011", warehouseId: "wh-05", stockQty: 4, reorderThreshold: 2 },
  { id: "inv-15", productId: "pd-012", warehouseId: "wh-05", stockQty: 8, reorderThreshold: 2 },
  { id: "inv-16", productId: "pd-013", warehouseId: "wh-02", stockQty: 250, reorderThreshold: 50 },
  { id: "inv-17", productId: "pd-014", warehouseId: "wh-02", stockQty: 0, reorderThreshold: 10 },
  { id: "inv-18", productId: "pd-015", warehouseId: "wh-03", stockQty: 500, reorderThreshold: 100 },
];
