"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Boxes, Warehouse as WarehouseIcon } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTableToolbar } from "@/components/dashboard/DataTableToolbar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { BulkStockDialog } from "@/components/seller/BulkStockDialog";
import { formatCurrency, formatWeight } from "@/lib/format";
import type { Product, ProductStatus } from "@/lib/types";
import { WarehouseManagerService } from "@/server/services/warehouse-manager.service";
import { WarehouseService } from "@/server/services/warehouse.service";
import { ProductService } from "@/server/services/product.service";
import { toast } from "sonner";

function InventoryTableSkeleton() {
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full max-w-xs" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="rounded-xl border border-border">
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 p-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="ml-auto h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WarehouseInventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [warehouseName, setWarehouseName] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");

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
        setWarehouseId(warehouse.id);
        setWarehouseName(warehouse.name);

        const data = await ProductService.getProductsByWarehouse(warehouse.id);
        setProducts(data as unknown as Product[]);
      } catch (err) {
        console.error("Failed to load warehouse inventory", err);
        toast.error("Failed to load inventory");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const handleBulkSave = async (updates: Record<string, number>) => {
    const changed = Object.entries(updates).filter(
      ([id, qty]) => products.find((p) => p.id === id)?.stockQty !== qty
    );
    try {
      await Promise.all(
        changed.map(([id, stockQty]) => ProductService.updateProduct(id, { stockQty }))
      );
      setProducts((prev) =>
        prev.map((p) => (updates[p.id] !== undefined ? { ...p, stockQty: updates[p.id] } : p))
      );
    } catch (err) {
      console.error("Failed to update stock", err);
      toast.error("Some stock updates failed to save");
    }
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={
          loading
            ? "Loading inventory…"
            : warehouseName
              ? `Products physically stored at ${warehouseName}, across every seller.`
              : "Waiting for an admin to assign you a warehouse."
        }
        actions={
          warehouseId && (
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Boxes /> Bulk Stock Update
            </Button>
          )
        }
      />

      {loading ? (
        <InventoryTableSkeleton />
      ) : !warehouseId ? (
        <EmptyState
          icon={WarehouseIcon}
          title="No warehouse assigned yet"
          description="Once an admin assigns you to a warehouse, its inventory will show up here."
        />
      ) : (
        <>
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search products..."
            filters={
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter((v ?? "all") as typeof statusFilter)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            }
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products found"
              description="Try a different search or filter."
            />
          ) : (
            <div className="rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-9 w-9 rounded-md border border-border object-cover"
                            />
                          ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                              <Package className="h-4 w-4" />
                            </span>
                          )}
                          <span>{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{product.category}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{product.stockQty}</TableCell>
                      <TableCell>{formatWeight(product.weightKg)}</TableCell>
                      <TableCell>
                        <StatusBadge status={product.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <BulkStockDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        products={products}
        onSave={handleBulkSave}
      />
    </div>
  );
}
