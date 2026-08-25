"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAX_FLEET_CARGO_VOLUME_CM3, MAX_FLEET_PAYLOAD_KG } from "@/lib/algorithms";
import type { Product, ProductStatus } from "@/lib/types";

const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  stockQty: z.coerce.number().int().min(0, "Stock can't be negative"),
  weightKg: z.coerce
    .number()
    .positive("Weight must be greater than 0")
    .max(MAX_FLEET_PAYLOAD_KG, `Exceeds the ${MAX_FLEET_PAYLOAD_KG}kg max single-drone payload`),
  lengthCm: z.coerce.number().positive("Required"),
  widthCm: z.coerce.number().positive("Required"),
  heightCm: z.coerce.number().positive("Required"),
  fragile: z.boolean(),
  status: z.enum(["draft", "active", "out_of_stock", "suspended"]),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  warehouseName: string;
  onSave: (values: ProductFormValues) => void;
}

const EMPTY_VALUES: ProductFormValues = {
  name: "",
  description: "",
  category: "",
  price: 0,
  stockQty: 0,
  weightKg: 0,
  lengthCm: 0,
  widthCm: 0,
  heightCm: 0,
  fragile: false,
  status: "draft",
};

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  warehouseName,
  onSave,
}: ProductFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        product
          ? {
              name: product.name,
              description: product.description,
              category: product.category,
              price: product.price,
              stockQty: product.stockQty,
              weightKg: product.weightKg,
              lengthCm: product.lengthCm,
              widthCm: product.widthCm,
              heightCm: product.heightCm,
              fragile: product.fragile,
              status: product.status,
            }
          : EMPTY_VALUES
      );
    }
  }, [open, product, reset]);

  const [lengthCm, widthCm, heightCm] = watch(["lengthCm", "widthCm", "heightCm"]);
  const volumeCm3 = (lengthCm || 0) * (widthCm || 0) * (heightCm || 0);
  const volumeExceeded = volumeCm3 > MAX_FLEET_CARGO_VOLUME_CM3;

  const onSubmit = (values: ProductFormValues) => {
    if (volumeExceeded) {
      toast.error("Product exceeds the largest drone's cargo bay envelope.");
      return;
    }
    onSave(values);
    toast.success(product ? "Product updated" : "Product added");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            Stored in {warehouseName}. Weight and dimensions are validated against the SmartLogix
            drone fleet before this product can go live.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Product name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input id="category" {...register("category")} />
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (USD)</Label>
              <Input id="price" type="number" step="0.01" {...register("price")} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="stockQty">Stock quantity</Label>
              <Input id="stockQty" type="number" {...register("stockQty")} />
              {errors.stockQty && (
                <p className="text-xs text-destructive">{errors.stockQty.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weightKg">Weight (kg)</Label>
              <Input id="weightKg" type="number" step="0.1" {...register("weightKg")} />
              {errors.weightKg && (
                <p className="text-xs text-destructive">{errors.weightKg.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lengthCm">Length (cm)</Label>
              <Input id="lengthCm" type="number" {...register("lengthCm")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="widthCm">Width (cm)</Label>
              <Input id="widthCm" type="number" {...register("widthCm")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="heightCm">Height (cm)</Label>
              <Input id="heightCm" type="number" {...register("heightCm")} />
            </div>
          </div>

          <p className={`text-xs ${volumeExceeded ? "font-medium text-destructive" : "text-muted-foreground"}`}>
            Volume: {volumeCm3.toLocaleString()} cm³ — max {MAX_FLEET_CARGO_VOLUME_CM3.toLocaleString()} cm³
            (largest drone cargo bay){volumeExceeded ? ". Reduce dimensions to continue." : ""}
          </p>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="fragile">Fragile</Label>
              <p className="text-xs text-muted-foreground">Flies slower and steadier.</p>
            </div>
            <Controller
              name="fragile"
              control={control}
              render={({ field }) => (
                <Switch id="fragile" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => value && field.onChange(value as ProductStatus)}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || volumeExceeded}>
              {product ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
