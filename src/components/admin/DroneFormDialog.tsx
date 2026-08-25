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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { warehouses } from "@/lib/mock-data";
import type { Drone } from "@/lib/types";

const droneSchema = z.object({
  droneCode: z.string().min(2, "Drone code is required"),
  model: z.string().min(2, "Model is required"),
  maxPayloadKg: z.coerce.number().positive("Must be greater than 0"),
  cargoBayLengthCm: z.coerce.number().positive("Must be greater than 0"),
  cargoBayWidthCm: z.coerce.number().positive("Must be greater than 0"),
  cargoBayHeightCm: z.coerce.number().positive("Must be greater than 0"),
  maxRangeKm: z.coerce.number().positive("Must be greater than 0"),
  speedKmh: z.coerce.number().positive("Must be greater than 0"),
  homeWarehouseId: z.string().min(1, "Select a home warehouse"),
});

type DroneFormValues = z.infer<typeof droneSchema>;

interface DroneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drone?: Drone | null;
  onSave: (values: DroneFormValues) => void;
}

const EMPTY_VALUES: DroneFormValues = {
  droneCode: "",
  model: "Falcon X2",
  maxPayloadKg: 85,
  cargoBayLengthCm: 60,
  cargoBayWidthCm: 45,
  cargoBayHeightCm: 40,
  maxRangeKm: 28,
  speedKmh: 65,
  homeWarehouseId: warehouses[0]?.id ?? "",
};

export function DroneFormDialog({ open, onOpenChange, drone, onSave }: DroneFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DroneFormValues>({
    resolver: zodResolver(droneSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        drone
          ? {
              droneCode: drone.droneCode,
              model: drone.model,
              maxPayloadKg: drone.maxPayloadKg,
              cargoBayLengthCm: drone.cargoBayLengthCm,
              cargoBayWidthCm: drone.cargoBayWidthCm,
              cargoBayHeightCm: drone.cargoBayHeightCm,
              maxRangeKm: drone.maxRangeKm,
              speedKmh: drone.speedKmh,
              homeWarehouseId: drone.homeWarehouseId,
            }
          : EMPTY_VALUES
      );
    }
  }, [open, drone, reset]);

  const onSubmit = (values: DroneFormValues) => {
    onSave(values);
    toast.success(drone ? "Drone updated" : "Drone added to fleet");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{drone ? "Edit Drone" : "Add Drone"}</DialogTitle>
          <DialogDescription>Configure fleet specs and home base.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="droneCode">Drone code</Label>
              <Input id="droneCode" placeholder="DRN-011" {...register("droneCode")} />
              {errors.droneCode && (
                <p className="text-xs text-destructive">{errors.droneCode.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model">Model</Label>
              <Input id="model" {...register("model")} />
              {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="maxPayloadKg">Max payload (kg)</Label>
              <Input id="maxPayloadKg" type="number" {...register("maxPayloadKg")} />
              {errors.maxPayloadKg && (
                <p className="text-xs text-destructive">{errors.maxPayloadKg.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxRangeKm">Max range (km)</Label>
              <Input id="maxRangeKm" type="number" {...register("maxRangeKm")} />
              {errors.maxRangeKm && (
                <p className="text-xs text-destructive">{errors.maxRangeKm.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cargoBayLengthCm">Bay length (cm)</Label>
              <Input id="cargoBayLengthCm" type="number" {...register("cargoBayLengthCm")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cargoBayWidthCm">Bay width (cm)</Label>
              <Input id="cargoBayWidthCm" type="number" {...register("cargoBayWidthCm")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cargoBayHeightCm">Bay height (cm)</Label>
              <Input id="cargoBayHeightCm" type="number" {...register("cargoBayHeightCm")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="speedKmh">Speed (km/h)</Label>
              <Input id="speedKmh" type="number" {...register("speedKmh")} />
              {errors.speedKmh && (
                <p className="text-xs text-destructive">{errors.speedKmh.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="homeWarehouseId">Home warehouse</Label>
              <Controller
                name="homeWarehouseId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                    <SelectTrigger id="homeWarehouseId" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>
                          {wh.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {drone ? "Save changes" : "Add drone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
