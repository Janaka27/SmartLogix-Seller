"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Warehouse as WarehouseIcon, Zap, MapPin } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCoordinates } from "@/lib/format";
import { WarehouseManagerService } from "@/server/services/warehouse-manager.service";
import { WarehouseService } from "@/server/services/warehouse.service";
import type { Warehouse } from "@/lib/types";

const settingsSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email(),
  phone: z.string().min(7, "Enter a valid phone number"),
});

type SettingsValues = z.infer<typeof settingsSchema>;

function SettingsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Skeleton className="h-64 rounded-xl lg:col-span-2" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}

export default function WarehouseSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { fullName: "", email: "", phone: "" },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const user = await WarehouseManagerService.getUser();
        if (!user) {
          router.push("/warehouse/login");
          return;
        }
        setUserId(user.id);

        const [profile, myWarehouse] = await Promise.all([
          WarehouseManagerService.getMyProfile(user.id),
          WarehouseService.getByManager(user.id),
        ]);

        reset({
          fullName: profile?.full_name ?? "",
          email: profile?.email ?? user.email ?? "",
          phone: profile?.phone ?? "",
        });
        setWarehouse(myWarehouse ?? null);
      } catch (err) {
        console.error("Failed to load settings", err);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router, reset]);

  const onSubmit = async (values: SettingsValues) => {
    if (!userId) return;
    try {
      await WarehouseManagerService.updateMyProfile(userId, {
        fullName: values.fullName,
        phone: values.phone,
      });
      toast.success("Profile saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile and see which warehouse you run." />

      {loading ? (
        <SettingsSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="shadow-none lg:col-span-2">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your contact details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" {...register("fullName")} />
                    {errors.fullName && (
                      <p className="text-xs text-destructive">{errors.fullName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...register("phone")} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" disabled {...register("email")} />
                  <p className="text-xs text-muted-foreground">Contact support to change your login email.</p>
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Saving…" : "Save changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Assigned Warehouse</CardTitle>
              <CardDescription>Where you&apos;re allowed to manage stock and drones.</CardDescription>
            </CardHeader>
            <CardContent>
              {!warehouse ? (
                <EmptyState
                  icon={WarehouseIcon}
                  title="Not assigned yet"
                  description="An admin needs to link you to a warehouse."
                />
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
                    {warehouse.name}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {warehouse.city || formatCoordinates(warehouse.latitude, warehouse.longitude)}
                  </div>
                  <p className="text-muted-foreground">Capacity {warehouse.capacity.toLocaleString()} units</p>
                  {warehouse.chargingStation && (
                    <Badge variant="secondary" className="border-0 bg-orange-50 text-orange-700">
                      <Zap className="h-3 w-3" /> Charging station
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
