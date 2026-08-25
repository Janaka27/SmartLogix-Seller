"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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

export const warehouseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  capacity: z.coerce.number().int().positive("Capacity must be greater than 0"),
  // branchName: z.string().min(1, "Branch name is required"),
  // Commented out for now — sellers can only have a single warehouse today,
  // so there's nothing for a branch name to disambiguate yet.
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
  warehouse: SellerWarehouse;
  onSave: (values: WarehouseFormValues) => Promise<void> | void;
}

// Editing an existing warehouse only — the initial, mandatory creation step
// lives inline on the Inventory page (WarehouseSetupCard), not in a dialog.
export function WarehouseFormDialog({
  open,
  onOpenChange,
  warehouse,
  onSave,
}: WarehouseFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: EMPTY_WAREHOUSE_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset({ ...warehouse });
    }
  }, [open, warehouse, reset]);

  const onSubmit = async (values: WarehouseFormValues) => {
    try {
      await onSave(values);
      toast.success("Warehouse updated");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save warehouse. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Warehouse settings</DialogTitle>
          <DialogDescription>Update your warehouse location and capacity.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Warehouse name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/*
          <div className="space-y-1.5">
            <Label htmlFor="branchName">Branch name</Label>
            <Input id="branchName" {...register("branchName")} />
            {errors.branchName && (
              <p className="text-xs text-destructive">{errors.branchName.message}</p>
            )}
          </div>
          */}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="latitude">Latitude</Label>
              <Input id="latitude" type="number" step="0.0001" {...register("latitude")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="longitude">Longitude</Label>
              <Input id="longitude" type="number" step="0.0001" {...register("longitude")} />
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
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
