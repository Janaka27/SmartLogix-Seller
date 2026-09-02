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

const inviteSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  warehouseId: z.string().min(1, "Choose a warehouse"),
});

export type InviteManagerFormValues = z.infer<typeof inviteSchema>;

export interface InviteWarehouseOption {
  id: string;
  name: string;
}

interface InviteManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouses: InviteWarehouseOption[];
  defaultWarehouseId?: string;
  onSave: (values: InviteManagerFormValues) => Promise<void> | void;
}

export function InviteManagerDialog({
  open,
  onOpenChange,
  warehouses,
  defaultWarehouseId,
  onSave,
}: InviteManagerDialogProps) {
  const emptyValues: InviteManagerFormValues = {
    fullName: "",
    email: "",
    warehouseId: defaultWarehouseId ?? warehouses[0]?.id ?? "",
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteManagerFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) reset(emptyValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset, warehouses, defaultWarehouseId]);

  const onSubmit = async (values: InviteManagerFormValues) => {
    try {
      await onSave(values);
      toast.success(`Invite sent to ${values.email}`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a warehouse manager</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email to set a password. Once they accept, they can manage drones,
            orders, and inventory for the warehouse you pick below.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" placeholder="Alex Rivera" {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="alex@example.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          {warehouses.length > 1 && (
            <div className="space-y-1.5">
              <Label htmlFor="warehouseId">Warehouse</Label>
              <Controller
                name="warehouseId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                    <SelectTrigger id="warehouseId" className="w-full">
                      <SelectValue placeholder="Choose a warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.warehouseId && (
                <p className="text-xs text-destructive">{errors.warehouseId.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
