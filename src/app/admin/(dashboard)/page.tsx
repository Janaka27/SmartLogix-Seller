"use client";

import { Store, PackageCheck, Plane, Warehouse as WarehouseIcon, Bell } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sellers, drones, orders, warehouses } from "@/lib/mock-data";
import { formatCurrency, formatDateTime } from "@/lib/format";

import { useCallback, useState } from "react";
import { useDroneRequests } from "@/hooks/useDroneRequests";

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

    const [notifications, setNotifications] = useState<any[]>([]);

    const handleNewRequest = useCallback((request: any) => {
        console.log("🚁 New request received!");
        
        // Show a visual toast notification
        // toast.info(`🚁 New Drone Request: ${request.requested_quantity} drones requested!`);

        setNotifications((current) => [
            request,
            ...current,
        ]);
    }, []);

    useDroneRequests(handleNewRequest);

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

        <div className="space-y-4">
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

          <Card className="shadow-none border-blue-100 bg-blue-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Bell className="h-4 w-4" /> Live Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center py-4 text-center">
                  <Bell className="mb-2 h-8 w-8 text-blue-200" />
                  <p className="text-sm font-medium text-blue-900">No new notifications</p>
                  <p className="text-xs text-blue-700/70">Listening for incoming requests...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {notifications.map((notif, i) => (
                    <div key={i} className="flex flex-col gap-1 rounded-md bg-white p-3 shadow-sm border border-blue-100">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-foreground">
                          New Drone Request
                        </p>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 rounded-full font-medium">Just now</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{notif.requested_quantity}</span> drones requested for: {notif.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
