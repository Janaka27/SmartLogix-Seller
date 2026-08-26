"use client";

import { useEffect, useState } from "react";
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
import type { DroneRequest } from "@/lib/types";
import { AdminService } from "@/server/services/admin.service";

interface UpdateDroneRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: DroneRequest | null;
  onSave: () => void;
}

export function UpdateDroneRequestDialog({ open, onOpenChange, request, onSave }: UpdateDroneRequestDialogProps) {
  const [status, setStatus] = useState<string>("pending");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && request) {
      setStatus(request.status);
      setAdminNotes(request.adminNotes || "");
    }
  }, [open, request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;

    setIsSubmitting(true);
    try {
      await AdminService.updateDroneRequestStatus(request.id, status, adminNotes);
      toast.success("Drone request updated");
      onSave();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update drone request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Drone Request</DialogTitle>
          <DialogDescription>
            Approve or reject this request and leave a note for the seller.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
            <Input
              id="adminNotes"
              placeholder="E.g., Approved, dispatching soon..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
