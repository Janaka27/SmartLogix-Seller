"use client";

import { useMemo, useState, useEffect } from "react";
import { Package, Pencil, Plus, Boxes, Warehouse as WarehouseIcon } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductFormDialog, type ProductFormSubmitValues } from "@/components/seller/ProductFormDialog";
import { BulkStockDialog } from "@/components/seller/BulkStockDialog";
import {
  WarehouseFormDialog,
  type WarehouseFormValues,
  type SellerWarehouse,
} from "@/components/seller/WarehouseFormDialog";
import { WarehouseSetupCard } from "@/components/seller/WarehouseSetupCard";
import { formatCurrency, formatWeight } from "@/lib/format";
import type { Product, ProductStatus } from "@/lib/types";
import { ProductService } from "@/server/services/product.service";
import { SellerService } from "@/server/services/seller.service";
import { WarehouseService } from "@/server/services/warehouse.service";
import { useRouter } from "next/navigation";

function InventoryTableSkeleton() {
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full max-w-xs" />
        <div className="flex shrink-0 gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="rounded-xl border border-border">
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 p-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="ml-auto h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SellerInventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const [sellerId, setSellerId] = useState<string | null>(null);
  const [sellerWarehouses, setSellerWarehouses] = useState<SellerWarehouse[]>([]);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<SellerWarehouse | null>(null);
  const hasWarehouse = sellerWarehouses.length > 0;

  useEffect(() => {
    const fetchUserAndProducts = async () => {
      try {
        const user = await SellerService.getUser();
        if (!user) {
          router.push("/seller/login");
          return;
        }
        setSellerId(user.id);

        const warehouses = await WarehouseService.getAllBySeller(user.id);
        if (warehouses.length === 0) {
          // A seller must have a warehouse before they can add products —
          // the Inventory page shows an inline setup card for this instead
          // of routing away or popping a modal on load.
          setLoading(false);
          return;
        }
        setSellerWarehouses(warehouses);

        const data = await ProductService.getProducts(user.id);
        setProducts(data as unknown as Product[]);
      } catch (err) {
        console.error("Failed to load products or user", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndProducts();
  }, [router]);

  useEffect(() => {
    const stats = WarehouseService.getWarehouseStats(sellerId || "");
    console.log(stats);
  }, [sellerId]);

  const openAddWarehouse = () => {
    setEditingWarehouse(null);
    setWarehouseDialogOpen(true);
  };

  const openEditWarehouse = (warehouse: SellerWarehouse) => {
    setEditingWarehouse(warehouse);
    setWarehouseDialogOpen(true);
  };

  const handleWarehouseSave = async (values: WarehouseFormValues) => {
    if (!sellerId) return;

    if (editingWarehouse) {
      const updated = await WarehouseService.update(editingWarehouse.id, values);
      setSellerWarehouses((prev) =>
        prev.map((w) => (w.id === editingWarehouse.id ? updated : w))
      );
      return;
    }

    const created = await WarehouseService.create({ ...values, sellerId });
    setSellerWarehouses((prev) => [...prev, created]);

    if (products.length === 0) {
      const data = await ProductService.getProducts(sellerId);
      setProducts(data as unknown as Product[]);
    }
  };

  const [productSearch, setProductSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");

  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, productSearch, statusFilter]);

  const warehouseProducts = useMemo(
    () =>
      products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(warehouseSearch.toLowerCase());
        const matchesWarehouse = warehouseFilter === "all" || p.warehouseId === warehouseFilter;
        return matchesSearch && matchesWarehouse;
      }),
    [products, warehouseSearch, warehouseFilter]
  );

  const stockByWarehouse = useMemo(() => {
    const map = new Map<string, { productCount: number; totalStock: number }>();
    for (const p of products) {
      const entry = map.get(p.warehouseId) ?? { productCount: 0, totalStock: 0 };
      entry.productCount += 1;
      entry.totalStock += p.stockQty;
      map.set(p.warehouseId, entry);
    }
    return map;
  }, [products]);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setDialogOpen(true);
  };

  const handleSave = async (values: ProductFormSubmitValues) => {
    const volumeCm3 = values.lengthCm * values.widthCm * values.heightCm;

    try {
      if (editing) {
        const updated = await ProductService.updateProduct(editing.id, {
          ...values,
          volumeCm3,
        });
        setProducts((prev) =>
          prev.map((p) => (p.id === editing.id ? { ...p, ...updated } : p))
        );
      } else {
        const newProduct = await ProductService.createProduct({
          ...values,
          volumeCm3,
          sellerId: sellerId!,
        });
        setProducts((prev) => [newProduct as unknown as Product, ...prev]);
      }
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to save product", err);
      alert("Failed to save product. Check the console for details.");
    }
  };

  const handleBulkSave = (updates: Record<string, number>) => {
    setProducts((prev) =>
      prev.map((p) => (updates[p.id] !== undefined ? { ...p, stockQty: updates[p.id] } : p))
    );
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={
          loading
            ? "Loading your inventory…"
            : hasWarehouse
              ? "Manage your product catalog and see how stock is distributed across warehouses."
              : "Set up your warehouse to start listing products."
        }
        actions={
          hasWarehouse && (
            <Button onClick={openAddWarehouse}>
              <Plus /> Add Warehouse
            </Button>
          )
        }
      />

      {loading ? (
        <InventoryTableSkeleton />
      ) : !hasWarehouse ? (
        <WarehouseSetupCard onSave={handleWarehouseSave} />
      ) : (
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">
            <Package /> Products
          </TabsTrigger>
          <TabsTrigger value="warehouses">
            <WarehouseIcon /> By Warehouse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <DataTableToolbar
            searchValue={productSearch}
            onSearchChange={setProductSearch}
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

          {filteredProducts.length === 0 ? (
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
                    {sellerWarehouses.length > 1 && <TableHead>Warehouse</TableHead>}
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <button
                              type="button"
                              onClick={() => setPreviewProduct(product)}
                              className="shrink-0 cursor-zoom-in rounded-md ring-offset-1 transition hover:ring-2 hover:ring-primary"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-9 w-9 rounded-md border border-border object-cover"
                              />
                            </button>
                          ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                              <Package className="h-4 w-4" />
                            </span>
                          )}
                          <span>{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{product.category}</TableCell>
                      {sellerWarehouses.length > 1 && (
                        <TableCell className="text-muted-foreground">
                          {sellerWarehouses.find((w) => w.id === product.warehouseId)?.name ?? "—"}
                        </TableCell>
                      )}
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
        </TabsContent>

        <TabsContent value="warehouses">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sellerWarehouses.map((warehouse) => {
              const stats = stockByWarehouse.get(warehouse.id) ?? { productCount: 0, totalStock: 0 };
              return (
                <div
                  key={warehouse.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                      <WarehouseIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{warehouse.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {warehouse.latitude.toFixed(4)}, {warehouse.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        {stats.productCount} product{stats.productCount === 1 ? "" : "s"}
                      </p>
                      <p className="font-medium text-foreground">
                        {stats.totalStock} / {warehouse.capacity} units
                      </p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditWarehouse(warehouse)}>
                      <Pencil />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <DataTableToolbar
            searchValue={warehouseSearch}
            onSearchChange={setWarehouseSearch}
            searchPlaceholder="Search products..."
            filters={
              sellerWarehouses.length > 1 && (
                <Select value={warehouseFilter} onValueChange={(v) => setWarehouseFilter(v ?? "all")}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All warehouses</SelectItem>
                    {sellerWarehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }
          />

          {warehouseProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products in this warehouse yet"
              description="Add a product to see its stock listed here."
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
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouseProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.category}</TableCell>
                      <TableCell>{product.stockQty}</TableCell>
                      <TableCell>
                        <StatusBadge status={product.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
      )}

      <WarehouseFormDialog
        open={warehouseDialogOpen}
        onOpenChange={setWarehouseDialogOpen}
        warehouse={editingWarehouse}
        onSave={handleWarehouseSave}
      />
      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        warehouses={sellerWarehouses.map((w) => ({ id: w.id, name: w.name }))}
        onSave={handleSave}
      />
      <BulkStockDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        products={products}
        onSave={handleBulkSave}
      />

      <Dialog
        open={!!previewProduct}
        onOpenChange={(open) => !open && setPreviewProduct(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {previewProduct?.images.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={`${previewProduct.name} ${i + 1}`}
                className="aspect-square w-full rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
