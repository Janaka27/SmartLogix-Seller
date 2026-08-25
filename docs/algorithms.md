# Algorithm Consoles

The admin portal has four pages under the "Algorithms" nav group that correspond to the 5 algorithm modules described in the original coursework design doc ([`SmartLogix_IDSS_Detailed_Design_Document.pdf`](./SmartLogix_IDSS_Detailed_Design_Document.pdf) and [`SmartLogix_Two_Site_Structure_Guide.md`](./SmartLogix_Two_Site_Structure_Guide.md)). Unlike the rest of the app, **these run real algorithms client-side** over small hardcoded datasets — they are not mocked output, even though there's no backend. All the implementations live in `src/lib/algorithms/`.

| Console | Route | Algorithm(s) | Source |
|---|---|---|---|
| Network Analysis | `/admin/network` | Prim's MST | `prim.ts` |
| Route Optimization | `/admin/routes` | Dijkstra, A*, Bellman-Ford | `dijkstra.ts`, `a-star.ts`, `bellman-ford.ts` |
| Delivery Batching | `/admin/batching` | Constrained 0/1 Knapsack + Simulated Annealing | `knapsack.ts`, `simulated-annealing.ts` |
| Decision Module | `/admin/decision` | Rule-based feasibility classifier | `decision-tree.ts` |

## Network Analysis — Prim's MST

`runPrim(nodes, edges)` over `NETWORK_NODES`/`NETWORK_EDGE_COSTS` (`src/lib/algorithms/data/network-graph.ts`): 8 nodes (6 real warehouses + 2 candidate charging sites), 22 candidate build-cost edges in $k. Standard O(V²) Prim's — fine at this scale. Returns the MST edge set, total cost, and a real `performance.now()` timing. The console highlights the kept edges on `GraphCanvas` and shows savings vs. connecting every candidate link.

## Route Optimization — Dijkstra / A* / Bellman-Ford

All three run over the same graph, `ROUTE_NODES`/`ROUTE_EDGES` (`src/lib/algorithms/data/route-graph.ts`): 12 nodes (4 warehouses, a relay, a charging station, 6 delivery zones), 18 edges, one carrying a `noFlyPenalty`. Pick any source/target and "Run Comparison" computes all three:

- `dijkstra.ts` — classic non-negative-weight shortest path
- `a-star.ts` — same, with a Euclidean-distance heuristic from each node's `(x, y)`
- `bellman-ford.ts` — relaxation-based, tolerant of negative edges (none exist here, it's included for the comparison itself)

They should always agree on distance (no negative edges) — what differs is `nodesExplored`/`executionTimeMs`, which is the point of the comparison.

## Delivery Batching — Knapsack then Simulated Annealing

Two-step console over `BATCHING_ORDERS`/`BATCHING_DEPOT`/`BATCHING_DRONE_CAPACITY` (`src/lib/algorithms/data/batching-orders.ts`): 9 candidate orders around one depot, more total weight/volume than one drone can carry.

1. **"Run Order Selection"** → `knapsack.ts`: 0/1 DP over weight (discretized to 0.1kg steps), then volume is applied as a *feasibility filter* on the DP-optimal set — dropping the lowest value-per-volume items until it fits. This intentionally mirrors the simplification suggested in the original design doc for the 2-constraint (weight + volume) variant, and can produce a lower total value than a true 2D DP would — that gap is a deliberate discussion point, not a bug.
2. **"Sequence Tour"** → `simulated-annealing.ts`: swap + geometric cooling schedule over the selected stops, producing a closed loop (depot → stops → depot). Seeded with a fixed PRNG (`seeded-random.ts`) so the result is reproducible run to run. Returns `costHistory` (charted as the convergence line) and the final tour order, drawn as a real polyline on `GraphCanvas`.

There's no standalone "Resource Allocation" nav page — the knapsack step is folded into this console as its first step, since the admin nav list in the original doc doesn't list one separately.

## Decision Module — feasibility classifier

`classifyFeasibility(input)` in `decision-tree.ts` evaluates a fixed, ordered set of threshold rules against `{ weightKg, volumeCm3, distanceKm, batteryMarginPct, weatherFlag }`:

1. weight ≤ 85kg (hard reject if not — short-circuits, doesn't evaluate further rules)
2. volume ≤ largest cargo bay (hard reject if not)
3. distance ≤ 35km max fleet range (hard reject if not)
4. distance ≤ 28km standard range
5. battery margin ≥ 15%
6. no adverse weather flag

Passing 1–3 but failing any of 4–6 → `"Requires Split"`. Passing all six → `"Drone-Deliverable"`. The console shows the full rule path (which rules passed/failed) as a live audit trail as you edit the inputs — this is a real, deterministic evaluation, not mocked.

The five threshold constants (`MAX_FLEET_PAYLOAD_KG`, `MAX_FLEET_CARGO_VOLUME_CM3`, `MAX_FLEET_RANGE_KM`, `STANDARD_FLEET_RANGE_KM`, `MIN_BATTERY_MARGIN_PCT`) are exported from this file and reused by `ProductFormDialog` (see [`data-model.md`](./data-model.md)) so the seller-facing 85kg validation and this console can't silently drift apart.

**"Retrain Model" is explicitly theatrical** — real retraining needs a labeled dataset and a backend that don't exist here. Clicking it runs a progress animation and shows a toast that says as much ("rules unchanged in this demo") rather than pretending to do something it can't.

## Visualization

`GraphCanvas` (`src/components/algorithms/GraphCanvas.tsx`) is the one shared inline-SVG renderer used by Network Analysis, Route Optimization, and Delivery Batching — it takes `nodes`/`edges` plus an optional `highlightedPath` or `highlightedEdges` and draws accordingly. No mapping or graph-layout library is used; node positions are hand-placed `(x, y)` coordinates in the data files. `recharts` (via shadcn's `ChartContainer`) is reserved for the two actual statistical charts in this section: the SA convergence line and the Benchmarks bar chart.

## Benchmarks

`/admin/benchmarks` reads only the static `benchmark-logs.ts` seed data — it does **not** write live console runs back into shared state, to avoid cross-page mutable coupling in an app with no backend. If you want a console's live run to show up there, that's the change to make (append to a shared in-memory store rather than reading the static file directly).
