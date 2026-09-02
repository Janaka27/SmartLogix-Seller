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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Warehouse } from "@/lib/types";

const NO_MANAGER = "__none__";

const warehouseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  city: z.string().min(2, "City is required"),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  capacity: z.coerce.number().int().positive("Capacity must be greater than 0"),
  droneDockCount: z.coerce.number().int().min(0, "Can't be negative"),
  chargingStation: z.boolean(),
  sellerFacing: z.boolean(),
  managerId: z.string(),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

export interface WarehouseManagerOption {
  id: string;
  name: string;
}

interface WarehouseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse | null;
  managers?: WarehouseManagerOption[];
  onSave: (values: WarehouseFormValues) => void;
}

const EMPTY_VALUES: WarehouseFormValues = {
  name: "",
  city: "Austin, TX",
  latitude: 30.2672,
  longitude: -97.7431,
  capacity: 1000,
  droneDockCount: 2,
  chargingStation: false,
  sellerFacing: true,
  managerId: "",
};

export function WarehouseFormDialog({ open, onOpenChange, warehouse, managers = [], onSave }: WarehouseFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        warehouse
          ? { ...EMPTY_VALUES, ...warehouse, managerId: warehouse.managerId ?? "" }
          : EMPTY_VALUES
      );
    }
  }, [open, warehouse, reset]);

  const onSubmit = (values: WarehouseFormValues) => {
    onSave(values);
    toast.success(warehouse ? "Warehouse updated" : "Warehouse added");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{warehouse ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle>
          <DialogDescription>Configure location, capacity, and drone infrastructure.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Warehouse name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} />
            {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
          </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacity (units)</Label>
              <Input id="capacity" type="number" {...register("capacity")} />
              {errors.capacity && (
                <p className="text-xs text-destructive">{errors.capacity.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="droneDockCount">Drone docks</Label>
              <Input id="droneDockCount" type="number" {...register("droneDockCount")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="managerId">Warehouse manager</Label>
            <Controller
              name="managerId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || NO_MANAGER}
                  onValueChange={(v) => field.onChange(v === NO_MANAGER ? "" : v)}
                >
                  <SelectTrigger id="managerId" className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_MANAGER}>Unassigned</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">Who can manage drones, orders, and inventory here.</p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="sellerFacing">Seller-facing</Label>
              <p className="text-xs text-muted-foreground">Sellers can store stock here.</p>
            </div>
            <Controller
              name="sellerFacing"
              control={control}
              render={({ field }) => (
                <Switch id="sellerFacing" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="chargingStation">Charging station</Label>
              <p className="text-xs text-muted-foreground">Drones can recharge on site.</p>
            </div>
            <Controller
              name="chargingStation"
              control={control}
              render={({ field }) => (
                <Switch id="chargingStation" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {warehouse ? "Save changes" : "Add warehouse"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
