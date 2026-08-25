"use client";

import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTableToolbar } from "@/components/dashboard/DataTableToolbar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { orders as seedOrders, products } from "@/lib/mock-data";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const CURRENT_SELLER_ID = "sl-01";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "packed",
  packed: "ready_for_pickup",
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Mark as Packed",
  packed: "Mark Ready for Pickup",
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(
    seedOrders.filter((o) => o.sellerId === CURRENT_SELLER_ID)
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((o) => {
        const matchesSearch =
          o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          o.buyerName.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || o.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
  }, [orders, search, statusFilter]);

  const advanceStatus = (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
    setSelected((prev) => (prev && prev.id === order.id ? { ...prev, status: next } : prev));
    toast.success(`${order.orderNumber} marked ${next.replace(/_/g, " ")}`);
  };

  return (
    <div>
      <PageHeader title="Orders Received" description="Track and fulfill orders from your buyers." />

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order # or buyer..."
        filters={
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v ?? "all") as typeof statusFilter)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="packed">Packed</SelectItem>
              <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_flight">In Flight</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders found" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelected(order)}>
                  <TableCell className="font-medium text-foreground">{order.orderNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{order.buyerName}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(order.createdAt)}</TableCell>
                  <TableCell>{formatCurrency(order.subtotal)}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {NEXT_STATUS[order.status] && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          advanceStatus(order);
                        }}
                      >
                        {NEXT_LABEL[order.status]}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.orderNumber}</SheetTitle>
                <SheetDescription>
                  {selected.buyerName} · {formatDateTime(selected.createdAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4">
                <div>
                  <StatusBadge status={selected.status} />
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-foreground">Delivery address</p>
                  <p className="text-sm text-muted-foreground">{selected.buyerAddress}</p>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Items</p>
                  <div className="space-y-2">
                    {selected.items.map((item) => {
                      const product = products.find((p) => p.id === item.productId);
                      return (
                        <div key={item.productId} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.qty}× {product?.name ?? item.productId}
                          </span>
                          <span className="text-foreground">
                            {formatCurrency(item.qty * item.priceEach)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selected.subtotal)}</span>
                </div>
              </div>
              <SheetFooter>
                {NEXT_STATUS[selected.status] && (
                  <Button onClick={() => advanceStatus(selected)}>{NEXT_LABEL[selected.status]}</Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
