"use client";

import { useMemo, useState, useEffect } from "react";
import { Package, Pencil, Plus, Boxes, Settings, Warehouse as WarehouseIcon } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductFormDialog } from "@/components/seller/ProductFormDialog";
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

  const [sellerId, setSellerId] = useState<string | null>(null);
  const [sellerWarehouse, setSellerWarehouse] = useState<SellerWarehouse | null>(null);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const warehouseId = sellerWarehouse?.id ?? null;

  useEffect(() => {
    const fetchUserAndProducts = async () => {
      try {
        const user = await SellerService.getUser();
        if (!user) {
          router.push("/seller/login");
          return;
        }
        setSellerId(user.id);

        const warehouse = await WarehouseService.getBySeller(user.id);
        if (!warehouse) {
          // A seller must have a warehouse before they can add products —
          // the Inventory page shows an inline setup card for this instead
          // of routing away or popping a modal on load.
          setLoading(false);
          return;
        }
        setSellerWarehouse(warehouse);

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

  const handleWarehouseSave = async (values: WarehouseFormValues) => {
    if (!sellerId) return;

    if (sellerWarehouse) {
      const updated = await WarehouseService.update(sellerWarehouse.id, values);
      setSellerWarehouse(updated);
      return;
    }

    const created = await WarehouseService.create({ ...values, sellerId });
    setSellerWarehouse(created);

    const data = await ProductService.getProducts(sellerId);
    setProducts(data as unknown as Product[]);
  };

  const [productSearch, setProductSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");

  const [warehouseSearch, setWarehouseSearch] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, productSearch, statusFilter]);

  // Sellers have a single warehouse today, so every product in `products`
  // already lives there — this tab is that warehouse's stock breakdown.
  const warehouseProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(warehouseSearch.toLowerCase())),
    [products, warehouseSearch]
  );

  const totalStock = useMemo(
    () => products.reduce((sum, p) => sum + p.stockQty, 0),
    [products]
  );

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setDialogOpen(true);
  };

  const handleSave = async (values: {
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
          warehouseId: warehouseId!,
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

  const warehouseName = sellerWarehouse?.name ?? "your warehouse";

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={
          loading
            ? "Loading your inventory…"
            : sellerWarehouse
              ? "Manage your product catalog and see how stock is distributed across warehouses."
              : "Set up your warehouse to start listing products."
        }
        actions={
          sellerWarehouse && (
            <Button variant="outline" onClick={() => setWarehouseDialogOpen(true)}>
              <Settings /> Warehouse settings
            </Button>
          )
        }
      />

      {loading ? (
        <InventoryTableSkeleton />
      ) : !sellerWarehouse ? (
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
        </TabsContent>

        <TabsContent value="warehouses">
          {sellerWarehouse && (
            <div className="mb-4 flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                  <WarehouseIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-foreground">{sellerWarehouse.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {sellerWarehouse.latitude.toFixed(4)}, {sellerWarehouse.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Products stored</p>
                  <p className="font-medium text-foreground">{products.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total stock</p>
                  <p className="font-medium text-foreground">
                    {totalStock} / {sellerWarehouse.capacity} units
                  </p>
                </div>
              </div>
            </div>
          )}

          <DataTableToolbar
            searchValue={warehouseSearch}
            onSearchChange={setWarehouseSearch}
            searchPlaceholder="Search products..."
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

      {sellerWarehouse && (
        <WarehouseFormDialog
          open={warehouseDialogOpen}
          onOpenChange={setWarehouseDialogOpen}
          warehouse={sellerWarehouse}
          onSave={handleWarehouseSave}
        />
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
