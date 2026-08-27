"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LocateFixed } from "lucide-react";

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
import { LocationPickerMap } from "@/components/seller/LocationPickerMap";

export const warehouseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  capacity: z.coerce.number().int().positive("Capacity must be greater than 0"),
});

export type WarehouseFormValues = z.infer<typeof warehouseSchema>;

export interface SellerWarehouse extends WarehouseFormValues {
  id: string;
}

export const EMPTY_WAREHOUSE_VALUES: WarehouseFormValues = {
  name: "",
  latitude: 30.2672,
  longitude: -97.7431,
  capacity: 1000,
};

interface WarehouseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Omit (or pass null) to open the dialog in "add another warehouse" mode.
  warehouse?: SellerWarehouse | null;
  onSave: (values: WarehouseFormValues) => Promise<void> | void;
}

export function WarehouseFormDialog({
  open,
  onOpenChange,
  warehouse,
  onSave,
}: WarehouseFormDialogProps) {
  const isEditing = !!warehouse;
  const [locating, setLocating] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: EMPTY_WAREHOUSE_VALUES,
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");

  useEffect(() => {
    if (open) {
      reset(warehouse ? { ...warehouse } : EMPTY_WAREHOUSE_VALUES);
    }
  }, [open, warehouse, reset]);

  const setLocation = (lat: number, lng: number) => {
    setValue("latitude", lat, { shouldValidate: true });
    setValue("longitude", lng, { shouldValidate: true });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser doesn't support location lookup.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(
          Number(position.coords.latitude.toFixed(4)),
          Number(position.coords.longitude.toFixed(4))
        );
        setLocating(false);
        toast.success("Location filled in");
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location. Pick it on the map instead.");
      }
    );
  };

  const onSubmit = async (values: WarehouseFormValues) => {
    try {
      await onSave(values);
      toast.success(isEditing ? "Warehouse updated" : "Warehouse added");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save warehouse. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Warehouse settings" : "Add another warehouse"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this warehouse's location and capacity."
              : "Sellers can stock products across more than one warehouse."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Warehouse name</Label>
            <Input id="name" placeholder="e.g. East Coast Warehouse" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="mb-0">Location</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto gap-1.5 px-2 py-1 text-xs text-orange-600 hover:text-orange-700"
                onClick={useCurrentLocation}
                disabled={locating}
              >
                <LocateFixed className="h-3.5 w-3.5" />
                {locating ? "Locating…" : "Use current location"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click the map to drop a pin, or drag it to fine-tune the spot.
            </p>
            <LocationPickerMap latitude={latitude} longitude={longitude} onChange={setLocation} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="latitude" className="text-xs text-muted-foreground">
                  Latitude
                </Label>
                <Input id="latitude" type="number" step="0.0001" {...register("latitude")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="longitude" className="text-xs text-muted-foreground">
                  Longitude
                </Label>
                <Input id="longitude" type="number" step="0.0001" {...register("longitude")} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="capacity">Capacity (units)</Label>
            <Input id="capacity" type="number" {...register("capacity")} />
            {errors.capacity && (
              <p className="text-xs text-destructive">{errors.capacity.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditing ? "Save changes" : "Add warehouse"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
