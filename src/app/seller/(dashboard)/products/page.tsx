"use client";

import { useMemo, useState } from "react";
import { Package, Pencil, Plus, Boxes } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTableToolbar } from "@/components/dashboard/DataTableToolbar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
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
import { ProductFormDialog } from "@/components/seller/ProductFormDialog";
import { BulkStockDialog } from "@/components/seller/BulkStockDialog";
import { products as seedProducts, warehouses } from "@/lib/mock-data";
import { formatCurrency, formatWeight } from "@/lib/format";
import type { Product, ProductStatus } from "@/lib/types";

const CURRENT_SELLER_ID = "sl-01";
const DEFAULT_WAREHOUSE_ID = "wh-01";

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>(
    seedProducts.filter((p) => p.sellerId === CURRENT_SELLER_ID)
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setDialogOpen(true);
  };

  const handleSave = (values: {
    name: string;
    description: string;
    category: string;
    price: number;
    stockQty: number;
    weightKg: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    fragile: boolean;
    status: ProductStatus;
  }) => {
    const volumeCm3 = values.lengthCm * values.widthCm * values.heightCm;

    if (editing) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editing.id ? { ...p, ...values, volumeCm3 } : p))
      );
    } else {
      const newProduct: Product = {
        id: `pd-${Math.random().toString(36).slice(2, 8)}`,
        sellerId: CURRENT_SELLER_ID,
        warehouseId: DEFAULT_WAREHOUSE_ID,
        images: [],
        createdAt: new Date().toISOString(),
        volumeCm3,
        ...values,
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
  };

  const handleBulkSave = (updates: Record<string, number>) => {
    setProducts((prev) =>
      prev.map((p) => (updates[p.id] !== undefined ? { ...p, stockQty: updates[p.id] } : p))
    );
  };

  const warehouseName =
    warehouses.find((w) => w.id === (editing?.warehouseId ?? DEFAULT_WAREHOUSE_ID))?.name ??
    "your warehouse";

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your product catalog and stock levels."
        actions={
          <>
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Boxes /> Bulk Stock Update
            </Button>
            <Button onClick={openAdd}>
              <Plus /> Add Product
            </Button>
          </>
        }
      />

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products..."
        filters={
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v ?? "all") as typeof statusFilter)}>
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
          description="Try a different search or filter, or add a new product."
          action={
            <Button size="sm" onClick={openAdd}>
              <Plus /> Add Product
            </Button>
          }
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.category}</TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>{product.stockQty}</TableCell>
                  <TableCell>{formatWeight(product.weightKg)}</TableCell>
                  <TableCell>
                    <StatusBadge status={product.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(product)}>
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        warehouseName={warehouseName}
        onSave={handleSave}
      />
      <BulkStockDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        products={products}
        onSave={handleBulkSave}
      />
    </div>
  );
}
