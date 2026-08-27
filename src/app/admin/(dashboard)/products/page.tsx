"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, Ban, RotateCcw, MoreHorizontal, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTableToolbar } from "@/components/dashboard/DataTableToolbar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductService } from "@/server/services/product.service";
import { SellerService } from "@/server/services/seller.service";
import { formatCurrency, formatDateTime, formatVolume, formatWeight } from "@/lib/format";
import type { Product, ProductStatus, Seller } from "@/lib/types";

type AdminProduct = Product & {
  warehouseName: string;
  warehouseCity: string;
  sellerName: string;
  sellerEmail: string;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");
  const [selected, setSelected] = useState<AdminProduct | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [rawProducts, sellers] = await Promise.all([
          ProductService.getAllProducts(),
          SellerService.getAllSellers(),
        ]);

        const sellerMap = new Map<string, Seller>(sellers.map((s) => [s.id, s]));
        const merged: AdminProduct[] = (rawProducts as Product[]).map((p) => {
          const seller = sellerMap.get(p.sellerId);
          const row = p as Product & { warehouseName?: string; warehouseCity?: string };
          return {
            ...p,
            warehouseName: row.warehouseName ?? "Unknown warehouse",
            warehouseCity: row.warehouseCity ?? "",
            sellerName: seller?.businessName ?? "Unknown seller",
            sellerEmail: seller?.email ?? "",
          };
        });
        setProducts(merged);
      } catch (err) {
        console.error("Failed to load products", err);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const counts = useMemo(
    () => ({
      total: products.length,
      active: products.filter((p) => p.status === "active").length,
      outOfStock: products.filter((p) => p.status === "out_of_stock").length,
      suspended: products.filter((p) => p.status === "suspended").length,
    }),
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.sellerName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const setStatus = async (product: AdminProduct, status: ProductStatus) => {
    try {
      await ProductService.updateProduct(product.id, { status });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, status } : p)));
      setSelected((prev) => (prev && prev.id === product.id ? { ...prev, status } : prev));
      toast.success(`${product.name} ${status === "suspended" ? "suspended" : "reinstated"}`);
    } catch (err) {
      console.error("Failed to update product status", err);
      toast.error("Failed to update product status");
    }
  };

  return (
    <div>
      <PageHeader
        title="Product Catalog"
        description="Every product listed across the marketplace, by seller and warehouse."
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total products" value={String(counts.total)} icon={Package} />
            <StatCard label="Active" value={String(counts.active)} icon={Package} />
            <StatCard label="Out of Stock" value={String(counts.outOfStock)} icon={AlertTriangle} accent="warning" />
            <StatCard
              label="Suspended"
              value={String(counts.suspended)}
              icon={Ban}
              accent={counts.suspended > 0 ? "danger" : "default"}
            />
          </div>

          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search product, category, or seller..."
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
            <EmptyState icon={Package} title="No products found" />
          ) : (
            <div className="rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(product)}
                    >
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-9 w-9 shrink-0 rounded-md border border-border object-cover"
                            />
                          ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                              <Package className="h-4 w-4" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate">{product.name}</p>
                            <p className="truncate text-xs font-normal text-muted-foreground">
                              {product.category}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{product.sellerName}</TableCell>
                      <TableCell className="text-muted-foreground">{product.warehouseName}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{product.stockQty}</TableCell>
                      <TableCell>{formatWeight(product.weightKg)}</TableCell>
                      <TableCell>
                        <StatusBadge status={product.status} />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelected(product)}>
                              View details
                            </DropdownMenuItem>
                            {product.status === "suspended" ? (
                              <DropdownMenuItem onClick={() => setStatus(product, "active")}>
                                <RotateCcw /> Reinstate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setStatus(product, "suspended")}
                              >
                                <Ban /> Suspend listing
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  {selected.sellerName} · {selected.warehouseName}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-4">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  {selected.fragile && (
                    <Badge variant="secondary" className="border-0 bg-amber-50 text-amber-700">
                      Fragile
                    </Badge>
                  )}
                </div>

                {selected.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {selected.images.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt={`${selected.name} ${i + 1}`}
                        className="aspect-square w-full rounded-lg border border-border object-cover"
                      />
                    ))}
                  </div>
                )}

                <div>
                  <p className="mb-1 text-sm font-medium text-foreground">Description</p>
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-sm">
                  <div className="text-muted-foreground">Category</div>
                  <div className="text-right text-foreground">{selected.category}</div>

                  <div className="text-muted-foreground">Price</div>
                  <div className="text-right text-foreground">{formatCurrency(selected.price)}</div>

                  <div className="text-muted-foreground">Stock</div>
                  <div className="text-right text-foreground">{selected.stockQty} units</div>

                  <div className="text-muted-foreground">Weight</div>
                  <div className="text-right text-foreground">{formatWeight(selected.weightKg)}</div>

                  <div className="text-muted-foreground">Dimensions</div>
                  <div className="text-right text-foreground">
                    {selected.lengthCm}×{selected.widthCm}×{selected.heightCm} cm
                  </div>

                  <div className="text-muted-foreground">Volume</div>
                  <div className="text-right text-foreground">{formatVolume(selected.volumeCm3)}</div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-sm">
                  <div className="text-muted-foreground">Seller</div>
                  <div className="text-right text-foreground">{selected.sellerName}</div>

                  <div className="text-muted-foreground">Seller email</div>
                  <div className="truncate text-right text-foreground">{selected.sellerEmail || "—"}</div>

                  <div className="text-muted-foreground">Warehouse</div>
                  <div className="text-right text-foreground">
                    {selected.warehouseName}
                    {selected.warehouseCity ? `, ${selected.warehouseCity}` : ""}
                  </div>

                  <div className="text-muted-foreground">Listed</div>
                  <div className="text-right text-foreground">{formatDateTime(selected.createdAt)}</div>
                </div>
              </div>
              <SheetFooter>
                {selected.status === "suspended" ? (
                  <Button onClick={() => setStatus(selected, "active")}>
                    <RotateCcw /> Reinstate listing
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={() => setStatus(selected, "suspended")}>
                    <Ban /> Suspend listing
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
