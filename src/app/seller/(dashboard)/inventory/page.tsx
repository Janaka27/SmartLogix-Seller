"use client";

import { useMemo, useState, useEffect } from "react";
import { Package, Pencil, Plus, Boxes, Warehouse as WarehouseIcon } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTableToolbar } from "@/components/dashboard/DataTableToolbar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { products as seedProducts, inventoryRecords, warehouses } from "@/lib/mock-data";
import { formatCurrency, formatWeight } from "@/lib/format";
import type { Product, ProductStatus } from "@/lib/types";
import { ProductService } from "@/server/services/product.service";
import { SellerService } from "@/server/services/seller.service";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SellerInventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [sellerId, setSellerId] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndProducts = async () => {
      try {
        const user = await SellerService.getUser();
        if (!user) {
          router.push("/seller/login");
          return;
        }
        setSellerId(user.id);

        // Fetch a valid warehouse from the DB (using the first available for now)
        const supabase = createClient();
        const { data: whData } = await supabase.from('warehouses').select('id').limit(1).single();
        const resolvedWarehouseId = whData?.id;
        setWarehouseId(resolvedWarehouseId);

        console.log("Logged in Seller ID:", user.id);
        console.log("Selected Warehouse ID:", resolvedWarehouseId);

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

  const [productSearch, setProductSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");

  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");

  const myProductIds = useMemo(() => new Set(products.map((p) => p.id)), [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, productSearch, statusFilter]);

  const myWarehouseIds = useMemo(
    () =>
      Array.from(
        new Set(
          inventoryRecords.filter((r) => myProductIds.has(r.productId)).map((r) => r.warehouseId)
        )
      ),
    [myProductIds]
  );

  const warehouseRows = useMemo(() => {
    return inventoryRecords
      .filter((r) => myProductIds.has(r.productId))
      .filter((r) => warehouseFilter === "all" || r.warehouseId === warehouseFilter)
      .map((r) => {
        const product = products.find((p) => p.id === r.productId);
        const warehouse = warehouses.find((w) => w.id === r.warehouseId);
        return { record: r, product, warehouse };
      })
      .filter(({ product }) => product?.name.toLowerCase().includes(warehouseSearch.toLowerCase()));
  }, [myProductIds, warehouseFilter, warehouseSearch, products]);

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

  const warehouseName =
    warehouses.find((w) => w.id === (editing?.warehouseId ?? warehouseId))?.name ??
    "your warehouse";

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Manage your product catalog and see how stock is distributed across warehouses."
      />

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
          <DataTableToolbar
            searchValue={warehouseSearch}
            onSearchChange={setWarehouseSearch}
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

          {warehouseRows.length === 0 ? (
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
                  {warehouseRows.map(({ record, product, warehouse }) => {
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
        </TabsContent>
      </Tabs>

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
