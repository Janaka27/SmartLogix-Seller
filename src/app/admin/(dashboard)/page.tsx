"use client";

import { Store, PackageCheck, Plane, Warehouse as WarehouseIcon } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sellers, drones, orders, warehouses } from "@/lib/mock-data";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default function AdminDashboardPage() {
  const pendingSellers = sellers.filter((s) => s.status === "pending");
  const activeDrones = drones.filter((d) => d.status === "available" || d.status === "in_flight");
  const inFlight = drones.filter((d) => d.status === "in_flight");
  const ordersInFlight = orders.filter((o) => o.status === "in_flight" || o.status === "assigned");

  const totalGmv = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.subtotal, 0);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div>
      <PageHeader title="Admin Dashboard" description="System-wide overview of the SmartLogix network." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Platform GMV" value={formatCurrency(totalGmv)} icon={PackageCheck} />
        <StatCard
          label="Sellers Pending Review"
          value={String(pendingSellers.length)}
          icon={Store}
          accent={pendingSellers.length > 0 ? "warning" : "default"}
        />
        <StatCard label="Active Drones" value={`${activeDrones.length} / ${drones.length}`} icon={Plane} />
        <StatCard label="Orders In Flight" value={String(ordersInFlight.length)} icon={WarehouseIcon} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders Network-wide</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <EmptyState icon={PackageCheck} title="No orders yet" />
            ) : (
              <div className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.buyerName} · {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{formatCurrency(order.subtotal)}</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Drones In Flight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inFlight.length === 0 ? (
              <EmptyState icon={Plane} title="No active flights" />
            ) : (
              inFlight.map((drone) => {
                const home = warehouses.find((w) => w.id === drone.homeWarehouseId);
                return (
                  <div key={drone.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-foreground">{drone.droneCode}</p>
                      <p className="text-xs text-muted-foreground">from {home?.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{drone.batteryCapacityPct}% batt</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
