# Data Model & Mock Data

There is no backend. Everything under `/seller` and `/admin` is powered by static, typed TypeScript data in `src/lib/mock-data/`, seeded into React `useState` on each page. All types live in `src/lib/types.ts`.

## Types (`src/lib/types.ts`)

| Type | Key fields | Notes |
|---|---|---|
| `Seller` | `status` (`pending\|approved\|rejected\|suspended`), `warehouseIds[]`, `payoutMethod` | |
| `Product` | `weightKg` (hard max **85kg**), `lengthCm/widthCm/heightCm`, `volumeCm3` (derived), `fragile`, `status` | The 85kg limit and cargo-bay volume cap are enforced live in the Add/Edit Product form — see below |
| `InventoryRecord` | `productId`, `warehouseId`, `stockQty`, `reorderThreshold` | **Not** a field in the original doc's schema — added so "Inventory by Warehouse" can show a per-warehouse breakdown; `Product.stockQty` stays as a denormalized total |
| `Warehouse` | `droneDockCount`, `chargingStation`, `sellerFacing` | |
| `Drone` | `maxPayloadKg`, `cargoBay{Length,Width,Height}Cm`, `maxRangeKm`, `batteryCapacityPct`, `status` (`available\|in_flight\|charging\|maintenance`) | |
| `DroneAssignment` | `orderIds[]`, `droneId`, `status` (`queued\|in_flight\|delivered\|cancelled`) | one flight can batch multiple orders |
| `Order` | `items[]`, `status` (`pending→packed→ready_for_pickup→assigned→in_flight→delivered`, or `cancelled`) | |
| `Payout` | `periodStart/End`, `grossSales`, `commissionFee`, `netPayout`, `status` (`pending\|processing\|paid`) | |
| `AdminUser` | `role` (`super_admin\|ops_manager\|support\|finance`), `status` (`active\|invited\|disabled`) | |
| `BenchmarkLog` | `algorithm`, `inputSizeN`, `executionTimeMs`, `success` | read by `/admin/benchmarks` only |

## Mock data (`src/lib/mock-data/`)

One file per entity, hand-authored with consistent cross-referencing IDs so joins actually resolve:

| File | Count | ID prefix |
|---|---|---|
| `warehouses.ts` | 6 | `wh-` |
| `sellers.ts` | 10 (7 approved, 2 pending, 1 suspended) | `sl-` |
| `products.ts` | 15 | `pd-` |
| `inventory.ts` | 18 | `inv-` |
| `drones.ts` | 10 (spread across all 4 statuses) | `dr-` |
| `orders.ts` | 14 (full status lifecycle) | `or-` |
| `drone-assignments.ts` | 7 | `da-` |
| `payouts.ts` | 12 | `py-` |
| `admin-users.ts` | 6 (all 4 roles) | `au-` |
| `benchmark-logs.ts` | 35 (5 runs × 7 algorithms, generated deterministically — see the file) | `bl-` |
| `sales-summary.ts` | 14-day hand-authored trend for the seller dashboard chart | — |

`src/lib/mock-data/index.ts` re-exports everything — import from there rather than individual files.

`products.ts` deliberately includes one item at **84.5kg** (just under the limit) and one at **90kg** (`status: "draft"`, since it can't actually ship) so the weight boundary is demoable from the seeded data as well as the Add Product form.

The current-user seller (`sl-01`, Torri Home Goods / Jenna Torri) is hardcoded as `CURRENT_SELLER_ID` at the top of every `/seller/*` page — there's no real session, so every page just filters mock data down to this one seller.

## Product management lives in `/seller/inventory`

`/seller/inventory` has two tabs:
- **Products** — the catalog table, "Add Product" (opens `ProductFormDialog`), "Bulk Stock Update" (opens `BulkStockDialog`). This is where sellers create/edit products; there's no separate `/seller/products` route.
- **By Warehouse** — the `InventoryRecord` breakdown per product/warehouse, with a "Reorder soon" / "Healthy" badge based on `reorderThreshold`.

`ProductFormDialog` (`src/components/seller/ProductFormDialog.tsx`) validates, live, against `MAX_FLEET_PAYLOAD_KG` (85) and `MAX_FLEET_CARGO_VOLUME_CM3` (the largest drone's cargo bay) — both exported from `src/lib/algorithms/decision-tree.ts` so the product form and the Decision Module console can't drift apart on what "deliverable" means.

## Writes are in-memory only

Every mutating action in the admin/seller portals — adding a product, approving a seller, moving a drone between status columns, inviting a user — calls `setState` on data that was seeded from the mock arrays above. Nothing is persisted; a page reload resets everything to the seed data. This is intentional (see "Demo mode" in [`design.md`](./design.md)), not a bug to fix quietly — if you're wiring up a real backend, this is the layer to replace, page by page, starting with whichever mock-data file that page currently imports from.
