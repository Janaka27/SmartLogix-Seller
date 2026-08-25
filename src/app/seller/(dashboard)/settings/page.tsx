"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Warehouse as WarehouseIcon } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { sellers, warehouses } from "@/lib/mock-data";

const CURRENT_SELLER_ID = "sl-01";

const settingsSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number"),
  storeDescription: z.string().min(10, "Tell buyers a bit more about your store"),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function SellerSettingsPage() {
  const seller = sellers.find((s) => s.id === CURRENT_SELLER_ID)!;
  const myWarehouses = warehouses.filter((w) => seller.warehouseIds.includes(w.id));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: seller.businessName,
      ownerName: seller.ownerName,
      email: seller.email,
      phone: seller.phone,
      storeDescription: seller.storeDescription,
    },
  });

  const onSubmit = async (values: SettingsValues) => {
    void values;
    await new Promise((resolve) => setTimeout(resolve, 400));
    toast.success("Store settings saved");
  };

  return (
    <div>
      <PageHeader title="Store Settings" description="Manage your store profile and warehouse access." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Store Profile</CardTitle>
            <CardDescription>This information is shown to buyers on the marketplace.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="businessName">Business name</Label>
                  <Input id="businessName" {...register("businessName")} />
                  {errors.businessName && (
                    <p className="text-xs text-destructive">{errors.businessName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ownerName">Owner name</Label>
                  <Input id="ownerName" {...register("ownerName")} />
                  {errors.ownerName && (
                    <p className="text-xs text-destructive">{errors.ownerName.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...register("phone")} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="storeDescription">Store description</Label>
                <Textarea id="storeDescription" rows={3} {...register("storeDescription")} />
                {errors.storeDescription && (
                  <p className="text-xs text-destructive">{errors.storeDescription.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Payout Method</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{seller.payoutMethod}</p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Connected Warehouses</CardTitle>
              <CardDescription>Where you&apos;re allowed to store stock.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {myWarehouses.map((wh) => (
                <div key={wh.id} className="flex items-center gap-2 text-sm">
                  <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-foreground">{wh.name}</span>
                  {wh.chargingStation && (
                    <Badge variant="secondary" className="border-0 bg-orange-50 text-orange-700">
                      Charging
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
