"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";

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

export type ProductFormSubmitValues = ProductFormValues & { images: string[]; warehouseId: string };

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  // Every warehouse this seller can stock the product in. One entry keeps
  // the dialog exactly as before (no picker shown); 2+ shows a selector.
  warehouses: { id: string; name: string }[];
  onSave: (values: ProductFormSubmitValues) => void;
}

const MIN_IMAGES = 1;
const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

interface NewImageFile {
  file: File;
  previewUrl: string;
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
  warehouses,
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

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<NewImageFile[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [warehouseId, setWarehouseId] = useState<string>("");

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
      setExistingImages(product?.images ?? []);
      setNewImages((prev) => {
        prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
        return [];
      });
      setImageError(null);
      setWarehouseId(product?.warehouseId ?? warehouses[0]?.id ?? "");
    }
  }, [open, product, warehouses, reset]);

  // Revoke object URLs for previews when the dialog unmounts.
  useEffect(() => {
    return () => {
      newImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalImageCount = existingImages.length + newImages.length;

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList);
    const room = MAX_IMAGES - totalImageCount;

    if (room <= 0) {
      setImageError(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }

    const accepted: NewImageFile[] = [];
    for (const file of incoming.slice(0, room)) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setImageError(`${file.name} isn't a supported image type.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError(`${file.name} exceeds the 5MB limit.`);
        continue;
      }
      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    if (accepted.length > 0) {
      setImageError(null);
      setNewImages((prev) => [...prev, ...accepted]);
    }
  };

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
  };

  const removeNewImage = (previewUrl: string) => {
    setNewImages((prev) => {
      const target = prev.find((img) => img.previewUrl === previewUrl);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.previewUrl !== previewUrl);
    });
  };

  const [lengthCm, widthCm, heightCm] = watch(["lengthCm", "widthCm", "heightCm"]);
  const volumeCm3 = (lengthCm || 0) * (widthCm || 0) * (heightCm || 0);
  const volumeExceeded = volumeCm3 > MAX_FLEET_CARGO_VOLUME_CM3;

  const onSubmit = async (values: ProductFormValues) => {
    if (volumeExceeded) {
      toast.error("Product exceeds the largest drone's cargo bay envelope.");
      return;
    }

    if (totalImageCount < MIN_IMAGES) {
      setImageError(`Add at least ${MIN_IMAGES} product images.`);
      return;
    }

    if (!warehouseId) {
      toast.error("Select a warehouse to stock this product in.");
      return;
    }

    try {
      let uploadedUrls: string[] = [];
      if (newImages.length > 0) {
        setUploadingImages(true);
        const formData = new FormData();
        newImages.forEach((img) => formData.append("files", img.file));

        const response = await fetch("/api/products/images", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || "Failed to upload images");
        }

        const body = await response.json();
        uploadedUrls = body.urls as string[];
      }

      onSave({ ...values, images: [...existingImages, ...uploadedUrls], warehouseId });
      toast.success(product ? "Product updated" : "Product added");
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to upload product images", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            {warehouses.length <= 1 && warehouses[0]
              ? `Stored in ${warehouses[0].name}. `
              : ""}
            Weight and dimensions are validated against the SmartLogix drone fleet before this
            product can go live.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Product name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {warehouses.length > 1 && (
            <div className="space-y-1.5">
              <Label htmlFor="warehouseId">Warehouse</Label>
              <Select value={warehouseId} onValueChange={(v) => v && setWarehouseId(v)}>
                <SelectTrigger id="warehouseId" className="w-full">
                  <SelectValue placeholder="Select a warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Product images</Label>
              <span className="text-xs text-muted-foreground">
                {totalImageCount}/{MAX_IMAGES} · min {MIN_IMAGES}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {existingImages.map((url) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Product" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {newImages.map((img) => (
                <div
                  key={img.previewUrl}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.previewUrl} alt="Product" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(img.previewUrl)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {totalImageCount < MAX_IMAGES && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:bg-muted/50">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px]">Add</span>
                  <input
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleFilesSelected(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
            {imageError && <p className="text-xs text-destructive">{imageError}</p>}
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
              <Label htmlFor="price">Price (LKR)</Label>
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
            <Button
              type="submit"
              disabled={isSubmitting || uploadingImages || volumeExceeded || totalImageCount < MIN_IMAGES}
            >
              {uploadingImages && <Loader2 className="h-4 w-4 animate-spin" />}
              {product ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
