"use client";

import { useState } from "react";
import { Warehouse as WarehouseIcon, LocateFixed } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationPickerMap } from "@/components/seller/LocationPickerMap";
import {
  warehouseSchema,
  EMPTY_WAREHOUSE_VALUES,
  type WarehouseFormValues,
} from "@/components/seller/WarehouseFormDialog";

interface WarehouseSetupCardProps {
  onSave: (values: WarehouseFormValues) => Promise<void> | void;
}

// Sits inline on the Inventory page in place of the product list until the
// seller has a warehouse — an onboarding step, not an interruption, so no
// modal/popup: it's just the next thing on the page.
export function WarehouseSetupCard({ onSave }: WarehouseSetupCardProps) {
  const [locating, setLocating] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: EMPTY_WAREHOUSE_VALUES,
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");

  const setLocation = (lat: number, lng: number) => {
    setValue("latitude", lat, { shouldValidate: true });
    setValue("longitude", lng, { shouldValidate: true });
  };

  const onSubmit = async (values: WarehouseFormValues) => {
    try {
      await onSave(values);
      toast.success("Warehouse created");
    } catch (err: any) {
      toast.error(err.message || "Failed to save warehouse. Please try again.");
    }
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

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader className="items-center text-center">
        <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-orange-600">
          <WarehouseIcon className="h-5 w-5" />
        </span>
        <CardTitle>One quick step before you start selling</CardTitle>
        <CardDescription className="max-w-sm">
          Add your warehouse so we know where your products ship from. It only takes a minute,
          and you can update these details anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Warehouse name</Label>
            <Input id="name" placeholder="Main Warehouse" {...register("name")} />
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating warehouse…" : "Create warehouse & continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
