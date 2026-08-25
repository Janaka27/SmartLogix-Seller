"use client";

import { useMemo, useState } from "react";
import { Warehouse as WarehouseIcon } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
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
import { Badge } from "@/components/ui/badge";
import { products, inventoryRecords, warehouses } from "@/lib/mock-data";

const CURRENT_SELLER_ID = "sl-01";

export default function SellerInventoryPage() {
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");

  const myProductIds = useMemo(
    () => new Set(products.filter((p) => p.sellerId === CURRENT_SELLER_ID).map((p) => p.id)),
    []
  );
  const myWarehouseIds = useMemo(
    () =>
      Array.from(
        new Set(
          inventoryRecords.filter((r) => myProductIds.has(r.productId)).map((r) => r.warehouseId)
        )
      ),
    [myProductIds]
  );

  const rows = useMemo(() => {
    return inventoryRecords
      .filter((r) => myProductIds.has(r.productId))
      .filter((r) => warehouseFilter === "all" || r.warehouseId === warehouseFilter)
      .map((r) => {
        const product = products.find((p) => p.id === r.productId);
        const warehouse = warehouses.find((w) => w.id === r.warehouseId);
        return { record: r, product, warehouse };
      })
      .filter(({ product }) => product?.name.toLowerCase().includes(search.toLowerCase()));
  }, [myProductIds, warehouseFilter, search]);

  return (
    <div>
      <PageHeader
        title="Inventory by Warehouse"
        description="See how your stock is distributed across SmartLogix warehouses."
      />

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products..."
        filters={
          <Select value={warehouseFilter} onValueChange={(v) => setWarehouseFilter(v ?? "all")}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All warehouses</SelectItem>
              {myWarehouseIds.map((id) => {
                const wh = warehouses.find((w) => w.id === id);
                return (
                  <SelectItem key={id} value={id}>
                    {wh?.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        }
      />

      {rows.length === 0 ? (
        <EmptyState icon={WarehouseIcon} title="No inventory records found" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Reorder Threshold</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ record, product, warehouse }) => {
                const low = record.stockQty <= record.reorderThreshold;
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium text-foreground">{product?.name}</TableCell>
                    <TableCell className="text-muted-foreground">{warehouse?.name}</TableCell>
                    <TableCell>{record.stockQty}</TableCell>
                    <TableCell className="text-muted-foreground">{record.reorderThreshold}</TableCell>
                    <TableCell>
                      {low ? (
                        <Badge variant="secondary" className="border-0 bg-amber-50 text-amber-700">
                          Reorder soon
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="border-0 bg-emerald-50 text-emerald-700">
                          Healthy
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
