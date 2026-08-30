"use client";

import { MapPin } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocationPreviewMap } from "@/components/dashboard/LocationPreviewMap";
import { formatCoordinates } from "@/lib/format";

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  latitude: number;
  longitude: number;
}

// Read-only "where is this" popup — used anywhere a warehouse/drone/order
// location is shown as text and should be clickable to see it on a map.
export function LocationDialog({ open, onOpenChange, title, subtitle, latitude, longitude }: LocationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {subtitle ? `${subtitle} · ` : ""}
            {formatCoordinates(latitude, longitude)}
          </DialogDescription>
        </DialogHeader>
        {open && <LocationPreviewMap latitude={latitude} longitude={longitude} />}
      </DialogContent>
    </Dialog>
  );
}
