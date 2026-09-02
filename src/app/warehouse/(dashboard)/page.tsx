"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, ClipboardList, AlertTriangle, Plane, Warehouse as WarehouseIcon } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WarehouseManagerService } from "@/server/services/warehouse-manager.service";
import { WarehouseService } from "@/server/services/warehouse.service";
import { ProductService } from "@/server/services/product.service";
import { DroneService } from "@/server/services/drone.service";
import { SellerService } from "@/server/services/seller.service";
import { formatDateTime } from "@/lib/format";
import type { Product, Drone } from "@/lib/types";

interface OrderSummaryRow {
  id: string;
  status: string;
  created_at: string;
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function WarehouseDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [warehouseName, setWarehouseName] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderSummaryRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await WarehouseManagerService.getUser();
        if (!user) {
          router.push("/warehouse/login");
          return;
        }

        const warehouse = await WarehouseService.getByManager(user.id);
        if (!warehouse) {
          setLoading(false);
          return;
        }
        setWarehouseName(warehouse.name);

        const [productData, droneData, dashboardData] = await Promise.all([
          ProductService.getProductsByWarehouse(warehouse.id),
          DroneService.getByWarehouse(warehouse.id),
          SellerService.getOrderDashboardData(warehouse.id),
        ]);

        setProducts(productData as unknown as Product[]);
        setDrones(droneData);

        const orders = (dashboardData.orders as OrderSummaryRow[]) ?? [];
        setPendingCount(orders.filter((o) => o.status === "pending").length);
        setRecentOrders(
          [...orders]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
        );
      } catch (err) {
        console.error("Failed to load warehouse dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const lowStock = useMemo(
    () => products.filter((p) => p.stockQty <= 10),
    [products]
  );

  const availableDrones = drones.filter((d) => d.status === "available").length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          loading
            ? "Loading your warehouse…"
            : warehouseName
              ? `Here's how ${warehouseName} is running.`
              : "Waiting for an admin to assign you a warehouse."
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : !warehouseName ? (
        <EmptyState
          icon={WarehouseIcon}
          title="No warehouse assigned yet"
          description="Once an admin assigns you to a warehouse, its drones, orders, and inventory will show up here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Products Stored" value={String(products.length)} icon={Package} />
            <StatCard label="Pending Orders" value={String(pendingCount)} icon={ClipboardList} accent="warning" />
            <StatCard
              label="Low Stock Alerts"
              value={String(lowStock.length)}
              icon={AlertTriangle}
              accent={lowStock.length > 0 ? "danger" : "default"}
            />
            <StatCard
              label="Drones Available"
              value={`${availableDrones} / ${drones.length}`}
              icon={Plane}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lowStock.length === 0 ? (
                  <EmptyState icon={AlertTriangle} title="All stocked up" description="No products are running low." />
                ) : (
                  lowStock.slice(0, 6).map((product) => (
                    <div key={product.id} className="flex items-center justify-between text-sm">
                      <span className="truncate pr-2 text-foreground">{product.name}</span>
                      <span className="shrink-0 font-medium text-red-600">{product.stockQty} left</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <EmptyState icon={ClipboardList} title="No orders yet" />
                ) : (
                  <div className="divide-y divide-border">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between gap-4 py-3">
                        <div>
                          <p className="font-mono text-sm font-medium text-foreground">
                            #{String(order.id).slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
