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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DroneRequestUrgency } from "@/lib/types";

const requestSchema = z.object({
  requestedQuantity: z.coerce.number().int().min(1, "At least 1 drone").max(10, "Max 10 per request"),
  urgency: z.enum(["low", "normal", "high"]),
  reason: z.string().min(10, "Give a few more details (min 10 characters)"),
});

export type DroneRequestFormValues = z.infer<typeof requestSchema>;

const EMPTY_VALUES: DroneRequestFormValues = {
  requestedQuantity: 1,
  urgency: "normal",
  reason: "",
};

interface RequestDroneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: DroneRequestFormValues) => Promise<void> | void;
}

export function RequestDroneDialog({ open, onOpenChange, onSave }: RequestDroneDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DroneRequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const onSubmit = async (values: DroneRequestFormValues) => {
    try {
      await onSave(values);
      toast.success("Request sent to the ops team");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request additional drones</DialogTitle>
          <DialogDescription>
            Every seller starts with a 5-drone fleet. Need more capacity? Tell us how many and why —
            admin reviews every request before adding drones to your warehouse.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="requestedQuantity">Drones needed</Label>
              <Input
                id="requestedQuantity"
                type="number"
                min={1}
                max={10}
                {...register("requestedQuantity")}
              />
              {errors.requestedQuantity && (
                <p className="text-xs text-destructive">{errors.requestedQuantity.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="urgency">Urgency</Label>
              <Controller
                name="urgency"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v as DroneRequestUrgency)}
                  >
                    <SelectTrigger id="urgency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              rows={4}
              placeholder="e.g. Order volume has outgrown our current fleet during peak hours, and deliveries are queuing up."
              {...register("reason")}
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Submit request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
