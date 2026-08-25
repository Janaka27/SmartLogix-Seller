"use client";

import Link from "next/link";
import { DollarSign, Package, ClipboardList, AlertTriangle } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { orders, products, inventoryRecords, salesSummary } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/format";

const CURRENT_SELLER_ID = "sl-01";

const chartConfig = {
  sales: { label: "Sales", color: "var(--color-orange-500)" },
} satisfies ChartConfig;

export default function SellerDashboardPage() {
  const myOrders = orders.filter((o) => o.sellerId === CURRENT_SELLER_ID);
  const myProducts = products.filter((p) => p.sellerId === CURRENT_SELLER_ID);
  const myProductIds = new Set(myProducts.map((p) => p.id));

  const pendingOrders = myOrders.filter((o) => o.status === "pending" || o.status === "packed");
  const periodSales = myOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.subtotal, 0);
  const lowStock = inventoryRecords.filter(
    (r) => myProductIds.has(r.productId) && r.stockQty <= r.reorderThreshold
  );

  const recentOrders = [...myOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Here's how Torri Home Goods is doing."
        actions={
          <Button nativeButton={false} render={<Link href="/seller/inventory" />}>
            <Package /> Add Product
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Sales" value={formatCurrency(periodSales)} icon={DollarSign} />
        <StatCard label="Active Products" value={String(myProducts.length)} icon={Package} />
        <StatCard
          label="Pending Orders"
          value={String(pendingOrders.length)}
          icon={ClipboardList}
          accent="warning"
        />
        <StatCard
          label="Low Stock Alerts"
          value={String(lowStock.length)}
          icon={AlertTriangle}
          accent={lowStock.length > 0 ? "danger" : "default"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales, last 14 days</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <AreaChart data={salesSummary} margin={{ left: 0, right: 8 }}>
                <defs>
                  <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="sales"
                  type="monotone"
                  fill="url(#fillSales)"
                  stroke="var(--color-sales)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStock.length === 0 ? (
              <EmptyState icon={AlertTriangle} title="All stocked up" description="No products below their reorder threshold." />
            ) : (
              lowStock.slice(0, 5).map((record) => {
                const product = products.find((p) => p.id === record.productId);
                if (!product) return null;
                return (
                  <div key={record.id} className="flex items-center justify-between text-sm">
                    <span className="truncate pr-2 text-foreground">{product.name}</span>
                    <span className="shrink-0 font-medium text-red-600">{record.stockQty} left</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 shadow-none">
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
                    <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.buyerName} · {formatDate(order.createdAt)}
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
    </div>
  );
}
