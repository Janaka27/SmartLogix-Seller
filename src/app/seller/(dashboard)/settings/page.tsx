"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Warehouse as WarehouseIcon, ImagePlus, Loader2, Store } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SellerService } from "@/server/services/seller.service";
import { WarehouseService } from "@/server/services/warehouse.service";

const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

const settingsSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number"),
  storeDescription: z.string().min(10, "Tell buyers a bit more about your store"),
});

type SettingsValues = z.infer<typeof settingsSchema>;

interface SellerWarehouseSummary {
  id: string;
  name: string;
  chargingStation: boolean;
}

function SettingsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Skeleton className="h-96 rounded-xl lg:col-span-2" />
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}

export default function SellerSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [payoutMethod, setPayoutMethod] = useState("Not configured");
  const [myWarehouses, setMyWarehouses] = useState<SellerWarehouseSummary[]>([]);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: "",
      ownerName: "",
      email: "",
      phone: "",
      storeDescription: "",
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const user = await SellerService.getUser();
        if (!user) {
          router.push("/seller/login");
          return;
        }
        setSellerId(user.id);

        const [settings, warehouse] = await Promise.all([
          SellerService.getMySettings(user.id),
          WarehouseService.getBySeller(user.id),
        ]);

        reset({
          businessName: settings.businessName,
          ownerName: settings.ownerName,
          email: settings.email,
          phone: settings.phone,
          storeDescription: settings.storeDescription,
        });
        setPayoutMethod(settings.payoutMethod);
        setLogoUrl(settings.logoUrl);
        setMyWarehouses(
          warehouse
            ? [{ id: warehouse.id, name: warehouse.name, chargingStation: warehouse.chargingStation }]
            : []
        );
      } catch (err) {
        console.error("Failed to load store settings", err);
        toast.error("Failed to load store settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router, reset]);

  // Revoke the local preview URL once it's no longer shown.
  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    };
  }, [logoPreviewUrl]);

  const handleLogoSelected = (file: File | null) => {
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoError("Unsupported image type.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Image exceeds the 5MB limit.");
      return;
    }
    setLogoError(null);
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const onSubmit = async (values: SettingsValues) => {
    if (!sellerId) return;
    try {
      let nextLogoUrl = logoUrl;
      if (logoFile) {
        setUploadingLogo(true);
        const formData = new FormData();
        formData.append("file", logoFile);
        const response = await fetch("/api/store/logo", { method: "POST", body: formData });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || "Failed to upload store image");
        }
        const body = await response.json();
        nextLogoUrl = body.url as string;
      }

      await SellerService.updateMySettings(sellerId, {
        businessName: values.businessName,
        ownerName: values.ownerName,
        phone: values.phone,
        storeDescription: values.storeDescription,
        logoUrl: nextLogoUrl,
      });

      setLogoUrl(nextLogoUrl);
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      setLogoFile(null);
      setLogoPreviewUrl(null);
      toast.success("Store settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save store settings");
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div>
      <PageHeader title="Store Settings" description="Manage your store profile and warehouse access." />

      {loading ? (
        <SettingsSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="shadow-none lg:col-span-2">
            <CardHeader>
              <CardTitle>Store Profile</CardTitle>
              <CardDescription>This information is shown to buyers on the marketplace.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                  <Label>Store logo</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={logoPreviewUrl ?? logoUrl ?? undefined} alt="Store logo" />
                      <AvatarFallback>
                        <Store className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <ImagePlus /> {logoUrl || logoPreviewUrl ? "Change image" : "Upload image"}
                      </Button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept={ALLOWED_LOGO_TYPES.join(",")}
                        className="hidden"
                        onChange={(e) => {
                          handleLogoSelected(e.target.files?.[0] ?? null);
                          e.target.value = "";
                        }}
                      />
                      <p className="text-xs text-muted-foreground">Shown to buyers next to your store name.</p>
                      {logoError && <p className="text-xs text-destructive">{logoError}</p>}
                    </div>
                  </div>
                </div>

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
                    <Input id="email" type="email" disabled {...register("email")} />
                    <p className="text-xs text-muted-foreground">Contact support to change your login email.</p>
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
                <Button type="submit" disabled={isSubmitting || uploadingLogo}>
                  {(isSubmitting || uploadingLogo) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {uploadingLogo ? "Uploading…" : isSubmitting ? "Saving…" : "Save changes"}
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
                <p className="text-sm text-foreground">{payoutMethod}</p>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Connected Warehouses</CardTitle>
                <CardDescription>Where you&apos;re allowed to store stock.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {myWarehouses.length === 0 ? (
                  <EmptyState
                    icon={WarehouseIcon}
                    title="No warehouse yet"
                    description="Set it up from the Inventory page."
                  />
                ) : (
                  myWarehouses.map((wh) => (
                    <div key={wh.id} className="flex items-center gap-2 text-sm">
                      <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-foreground">{wh.name}</span>
                      {wh.chargingStation && (
                        <Badge variant="secondary" className="border-0 bg-orange-50 text-orange-700">
                          Charging
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
