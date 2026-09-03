"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Plane,
  Weight,
  Box,
  Route,
  Zap,
  AlertCircle,
  CheckCircle2,
  Scissors,
  Clock,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Ruler,
  DollarSign,
  ShieldAlert,
  Package,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { SellerService } from "@/server/services/seller.service";
import { WarehouseService } from "@/server/services/warehouse.service";
import { prioritizePendingOrders, type PendingOrderRow } from "@/lib/algorithms/priorityQueue";
import {
  runDroneKnapsackAssignment,
  type FullOrderRow,
  type FullOrderItemRow,
  type FullDroneRow,
  type KnapsackAssignmentResult,
  type AllocatedItem,
} from "@/lib/algorithms/droneKnapsackAssignment";
import {
  formatDateTime,
  formatWeight,
  formatDistance,
  formatVolume,
  formatCurrency,
} from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ProductRow {
  id: string;
  name: string;
  category: string | null;
  price: number;
  weight_kg: number;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  volume_cm3: number | null;
  fragile: boolean;
  images: string[] | null;
}

interface DroneDisplayRow {
  id: string;
  drone_code: string;
  model: string | null;
  max_payload_kg: number;
  cargo_bay_volume_cm3: number;
  max_range_km: number;
  battery_capacity_pct: number;
  speed_kmh: number;
  status: string;
}

interface EnrichedResult extends KnapsackAssignmentResult {
  order: FullOrderRow;
  productsById: Record<string, ProductRow>;
  dronesById: Record<string, DroneDisplayRow>;
  /** raw order_items rows for this order (with product_id for lookup) */
  rawItems: Array<{ product_id: string; quantity: number; weight_kg: number; volume_cm3: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable atoms
// ─────────────────────────────────────────────────────────────────────────────

function DecisionBadge({ outcome }: { outcome: KnapsackAssignmentResult["outcome"] }) {
  if (outcome === "ASSIGN")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3 w-3" /> ASSIGNED
      </span>
    );
  if (outcome === "SPLIT")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
        <Scissors className="h-3 w-3" /> SPLIT
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
      <Clock className="h-3 w-3" /> HOLD
    </span>
  );
}

function MetaChip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="font-medium text-foreground">{value}</span>
      <span>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductCard — shown inside each order's expanded drone allocation
// ─────────────────────────────────────────────────────────────────────────────

function ProductCard({
  product,
  quantity,
  unitWeightKg,
}: {
  product: ProductRow | undefined;
  quantity: number;
  unitWeightKg: number;
}) {
  const imageUrl = product?.images?.[0] ?? null;
  const dims =
    product?.length_cm && product?.width_cm && product?.height_cm
      ? `${product.length_cm} × ${product.width_cm} × ${product.height_cm} cm`
      : null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      {/* Thumbnail */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt={product?.name ?? "Product"} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {product?.name ?? <span className="font-mono text-xs text-muted-foreground">Unknown product</span>}
            </p>
            {product?.category && (
              <p className="text-xs text-muted-foreground">{product.category}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <span className="text-sm font-semibold text-foreground">
              {quantity}×
            </span>
            {product?.price != null && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(product.price)} ea
              </p>
            )}
          </div>
        </div>

        {/* Spec row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Weight className="h-3 w-3" />
            {formatWeight(unitWeightKg)}/unit
          </span>
          {product?.volume_cm3 != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Box className="h-3 w-3" />
              {formatVolume(product.volume_cm3)}/unit
            </span>
          )}
          {dims && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Ruler className="h-3 w-3" />
              {dims}
            </span>
          )}
          {product?.fragile && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-orange-200">
              <ShieldAlert className="h-2.5 w-2.5" /> Fragile
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DroneDetailCard — shown as the header of each drone allocation block
// ─────────────────────────────────────────────────────────────────────────────

function DroneDetailCard({
  drone,
  allocationIdx,
  allocationCount,
  totalWeightKg,
  totalVolumeCm3,
}: {
  drone: DroneDisplayRow | undefined;
  allocationIdx: number;
  allocationCount: number;
  totalWeightKg: number;
  totalVolumeCm3: number;
}) {
  return (
    <div className="mb-3 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
      {/* Top row: code + split label + status */}
      <div className="flex items-center gap-2">
        <Plane className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="font-mono text-sm font-semibold text-foreground">
          {drone?.drone_code ?? "—"}
        </span>
        {drone?.model && (
          <span className="text-xs text-muted-foreground">{drone.model}</span>
        )}
        {allocationCount > 1 && (
          <span className="text-xs text-muted-foreground">
            · Drone {allocationIdx + 1} of {allocationCount}
          </span>
        )}
        <span className="ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
          bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
          {drone?.status ?? "—"}
        </span>
      </div>

      {/* Spec chips row */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
        <MetaChip icon={Weight} label="max payload" value={formatWeight(drone?.max_payload_kg ?? 0)} />
        <MetaChip icon={Box} label="cargo vol" value={formatVolume(drone?.cargo_bay_volume_cm3 ?? 0)} />
        <MetaChip icon={Route} label="max range" value={formatDistance(drone?.max_range_km ?? 0)} />
        <MetaChip icon={Zap} label="battery" value={`${drone?.battery_capacity_pct ?? 0}%`} />
        <MetaChip icon={Route} label="speed" value={`${drone?.speed_kmh ?? 0} km/h`} />
      </div>

      {/* Allocation totals */}
      <div className="mt-2 border-t border-border pt-2 flex gap-4">
        <MetaChip icon={Weight} label="this load" value={formatWeight(totalWeightKg)} />
        <MetaChip icon={Box} label="this load" value={formatVolume(totalVolumeCm3)} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Order card
// ─────────────────────────────────────────────────────────────────────────────

function OrderCard({
  result,
  confirming,
  onConfirm,
}: {
  result: EnrichedResult;
  confirming: boolean;
  onConfirm: (orderId: string, droneId: string) => void;
}) {
  const { order, outcome, allocations, holdReason, productsById, dronesById, rawItems } = result;
  const [expanded, setExpanded] = useState(false);
  const shortId = order.id.slice(0, 8).toUpperCase();

  // Build a lookup: product_id → rawItem (for quantity + unit weight per product)
  const rawItemByProductId = useMemo(() => {
    const map = new Map<string, { quantity: number; weight_kg: number; volume_cm3: number }>();
    for (const ri of rawItems) map.set(ri.product_id, ri);
    return map;
  }, [rawItems]);

  return (
    <Card className="overflow-hidden shadow-none transition-all duration-200 hover:shadow-sm">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">#{shortId}</span>
            <DecisionBadge outcome={outcome} />
            {order.is_urgent && (
              <Badge variant="secondary" className="border-0 bg-red-50 text-xs font-semibold text-red-700">
                <Zap className="mr-0.5 h-3 w-3" /> Urgent
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
        </div>

        {/* Confirm — only for single-drone ASSIGN */}
        {outcome === "ASSIGN" && allocations.length > 0 && (
          <Button
            size="sm"
            disabled={confirming}
            onClick={() => onConfirm(order.id, allocations[0].droneId)}
            className="shrink-0"
          >
            {confirming ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Confirming…</>
            ) : (
              <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Confirm Assignment</>
            )}
          </Button>
        )}
      </div>

      {/* ── Order metrics ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border px-5 py-3">
        <MetaChip icon={Weight} label="weight" value={formatWeight(Number(order.total_weight_kg))} />
        <MetaChip icon={Box} label="volume" value={formatVolume(Number(order.total_volume_cm3))} />
        {order.distance_km != null && (
          <MetaChip icon={Route} label="distance" value={formatDistance(Number(order.distance_km))} />
        )}
      </div>

      {/* ── HOLD banner ──────────────────────────────────────────── */}
      {outcome === "HOLD" ? (
        <div className="flex items-start gap-2 border-t border-border bg-amber-50/50 px-5 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>{holdReason ?? "No suitable drones available"}</span>
        </div>
      ) : (
        <>
          {/* ── Expand toggle ────────────────────────────────────── */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center gap-1.5 border-t border-border px-5 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {outcome === "ASSIGN"
              ? `Drone assignment · ${rawItems.length} item type${rawItems.length !== 1 ? "s" : ""}`
              : `Split across ${allocations.length} drones · ${rawItems.length} item type${rawItems.length !== 1 ? "s" : ""}`}
          </button>

          {expanded && (
            <div className="divide-y divide-border border-t border-border">
              {allocations.map((alloc, idx) => (
                <div key={alloc.droneId} className="px-5 py-4">
                  {/* Drone detail card */}
                  <DroneDetailCard
                    drone={dronesById[alloc.droneId]}
                    allocationIdx={idx}
                    allocationCount={allocations.length}
                    totalWeightKg={alloc.totalWeightKg}
                    totalVolumeCm3={alloc.totalVolumeCm3}
                  />

                  {/* Product cards */}
                  <div className="space-y-2">
                    {alloc.items.map((item: AllocatedItem) => {
                      const raw = rawItemByProductId.get(item.product_id);
                      return (
                        <ProductCard
                          key={item.product_id}
                          product={productsById[item.product_id]}
                          quantity={item.quantity}
                          unitWeightKg={raw?.weight_kg ?? item.unitWeightKg}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Allocated Order Card
// ─────────────────────────────────────────────────────────────────────────────

function AllocatedOrderCard({ order, items }: { order: any; items: any[] }) {
  const [expanded, setExpanded] = useState(false);
  const shortId = order.id.slice(0, 8).toUpperCase();
  const assignment = order.drone_assignment;
  const drone = assignment?.drone;

  return (
    <Card className="overflow-hidden bg-card transition-all hover:shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Order {shortId}</h3>
            {order.is_urgent && (
              <Badge variant="secondary" className="border-0 bg-red-50 text-xs font-semibold text-red-700">
                <Zap className="mr-0.5 h-3 w-3" /> Urgent
              </Badge>
            )}
            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
              Allocated
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Hide Details" : "View Details"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border px-5 py-3">
        <MetaChip icon={DollarSign} label="amount" value={formatCurrency(Number(order.total_amount || 0))} />
        <MetaChip icon={Weight} label="weight" value={formatWeight(Number(order.total_weight_kg))} />
        <MetaChip icon={Box} label="volume" value={formatVolume(Number(order.total_volume_cm3))} />
        {order.distance_km != null && (
          <MetaChip icon={Route} label="distance" value={formatDistance(Number(order.distance_km))} />
        )}
        {order.delivery_address && (
          <MetaChip icon={MapPin} label="address" value={order.delivery_address} />
        )}
      </div>

      {expanded && (
        <>
          <div className="border-t border-border bg-muted/20 px-5 py-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assignment Details
            </h4>
            {assignment ? (
              <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Assignment ID</p>
                  <p className="font-mono text-sm font-medium">{assignment.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assignment Status</p>
                  <p className="text-sm font-medium capitalize">{assignment.status}</p>
                </div>
                {drone && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Drone</p>
                      <p className="text-sm font-medium">{drone.drone_code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Drone Status</p>
                      <p className="text-sm font-medium capitalize">{drone.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Max Payload</p>
                      <p className="text-sm font-medium">{drone.max_payload_kg} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Max Range</p>
                      <p className="text-sm font-medium">{drone.max_range_km} km</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No assignment details found.</p>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-border px-5 py-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Products ({items.length})
              </h4>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 rounded-lg border border-border p-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0].startsWith('http') ? item.product.images[0] : `https://res.cloudinary.com/dgvisun5u/image/upload/${item.product.images[0]}`}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium">{item.product?.name ?? "Unknown Product"}</p>
                        <p className="text-sm font-medium">{formatCurrency(item.product?.price ?? 0)}</p>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                        <span>{item.weight_kg} kg/unit</span>
                        <span>{item.volume_cm3} cm³/unit</span>
                        <span>
                          {item.product?.length_cm}×{item.product?.width_cm}×{item.product?.height_cm} cm
                        </span>
                        {item.product?.fragile && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <ShieldAlert className="h-3 w-3" /> Fragile
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SellerOrdersPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<EnrichedResult[]>([]);
  const [allocatedData, setAllocatedData] = useState<{ orders: any[], orderItems: any[] } | null>(null);
  const [confirming, setConfirming] = useState<Record<string, boolean>>({});
  const [outcomeFilter, setOutcomeFilter] = useState<"ALL" | "ASSIGN" | "SPLIT" | "HOLD">("ALL");

  // ── Pipeline ────────────────────────────────────────────────────────────────
  const runPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await SellerService.getUser();
      if (!user) { router.push("/seller/login"); return; }

      const warehouse = await WarehouseService.getBySeller(user.id);
      if (!warehouse) { setError("No warehouse found. Set up your warehouse first."); return; }

      const { orders, orderItems, drones, productsById, dronesById } =
        await SellerService.getOrderDashboardData(warehouse.id);

      const allocatedDataResult = await SellerService.getAllocatedOrdersDashboardData(warehouse.id);
      setAllocatedData(allocatedDataResult);

      // 1. Priority Queue (unchanged)
      const pendingOrders = (orders as PendingOrderRow[]).filter((o) => o.status === "pending");
      const prioritized = prioritizePendingOrders(pendingOrders);

      // 2. Decision Tree → Knapsack (unchanged)
      const rawResults = runDroneKnapsackAssignment(
        prioritized as FullOrderRow[],
        orderItems as FullOrderItemRow[],
        drones as FullDroneRow[],
      );

      // 3. Enrich for display — attach order row, product map, drone map, and raw items
      const ordersById = new Map((orders as FullOrderRow[]).map((o) => [o.id, o]));
      // Group raw items by order_id for quick lookup
      const rawItemsByOrderId = new Map<string, typeof orderItems>();
      for (const item of orderItems as any[]) {
        const list = rawItemsByOrderId.get(item.order_id) ?? [];
        list.push(item);
        rawItemsByOrderId.set(item.order_id, list);
      }

      const enriched: EnrichedResult[] = rawResults
        .map((r) => {
          const order = ordersById.get(r.orderId);
          if (!order) return null;
          return {
            ...r,
            order,
            productsById: productsById as Record<string, ProductRow>,
            dronesById: dronesById as Record<string, DroneDisplayRow>,
            rawItems: (rawItemsByOrderId.get(r.orderId) ?? []) as EnrichedResult["rawItems"],
          };
        })
        .filter((r): r is EnrichedResult => r !== null);

      setResults(enriched);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load orders");
      console.error("[Orders] Pipeline error:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { runPipeline(); }, [runPipeline]);

  // ── Confirm assignment ───────────────────────────────────────────────────────
  const handleConfirm = async (orderId: string, droneId: string) => {
    if (confirming[orderId]) return;
    setConfirming((prev) => ({ ...prev, [orderId]: true }));
    try {
      await SellerService.confirmAssignment(orderId, droneId);
      toast.success("Order allocated — drone dispatched!");
      setResults((prev) => prev.filter((r) => r.orderId !== orderId));
      await runPipeline();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to confirm assignment");
    } finally {
      setConfirming((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const filtered = useMemo(
    () => outcomeFilter === "ALL" ? results : results.filter((r) => r.outcome === outcomeFilter),
    [results, outcomeFilter],
  );

  const counts = useMemo(() => ({
    ALL: results.length,
    ASSIGN: results.filter((r) => r.outcome === "ASSIGN").length,
    SPLIT: results.filter((r) => r.outcome === "SPLIT").length,
    HOLD: results.filter((r) => r.outcome === "HOLD").length,
  }), [results]);

  const allocatedOrders = allocatedData?.orders ?? [];
  const allocatedItemsByOrderId = useMemo(() => {
    if (!allocatedData) return new Map<string, any[]>();
    const map = new Map<string, any[]>();
    for (const item of allocatedData.orderItems) {
      const list = map.get(item.order_id) ?? [];
      list.push(item);
      map.set(item.order_id, list);
    }
    return map;
  }, [allocatedData]);

  return (
    <div>
      <PageHeader
        title="Order Assignment Queue"
        description="Priority-sorted pending orders with drone assignments from the knapsack algorithm."
        actions={
          <Button variant="outline" size="sm" onClick={runPipeline} disabled={loading}>
            {loading
              ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
            Refresh
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {(["ALL", "ASSIGN", "SPLIT", "HOLD"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setOutcomeFilter(f)}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${outcomeFilter === f
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
          >
            {f === "ASSIGN" ? "Assigned" : f === "HOLD" ? "On Hold" : f === "SPLIT" ? "Split" : "All"}
            <span className="ml-1.5 tabular-nums opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <OrdersSkeleton />
      ) : error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={outcomeFilter === "ALL" ? "No pending orders" : `No ${outcomeFilter.toLowerCase()} orders`}
          description={outcomeFilter === "ALL" ? "All pending orders have been processed or there are none yet." : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((result) => (
            <OrderCard
              key={result.orderId}
              result={result}
              confirming={!!confirming[result.orderId]}
              onConfirm={handleConfirm}
            />
          ))}
        </div>
      )}

      {/* ── Allocated Orders Section ─────────────────────────────────────────── */}
      <div className="mt-12">
        <PageHeader
          title="Allocated Orders"
          description="Orders that have been successfully assigned to drones and are ready for dispatch."
        />
        <div className="mt-5">
          {loading ? (
            <OrdersSkeleton />
          ) : error ? (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          ) : allocatedOrders.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No allocated orders"
              description="Confirmed assignments will appear here."
            />
          ) : (
            <div className="space-y-3">
              {allocatedOrders.map((order) => (
                <AllocatedOrderCard
                  key={order.id}
                  order={order}
                  items={allocatedItemsByOrderId.get(order.id) ?? []}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
