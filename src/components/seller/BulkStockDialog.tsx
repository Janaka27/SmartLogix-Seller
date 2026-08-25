"use client";

import { useState } from "react";
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
import type { Product } from "@/lib/types";

interface BulkStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onSave: (updates: Record<string, number>) => void;
}

export function BulkStockDialog({ open, onOpenChange, products, onSave }: BulkStockDialogProps) {
  const [values, setValues] = useState<Record<string, number>>({});
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setValues(Object.fromEntries(products.map((p) => [p.id, p.stockQty])));
    }
  }

  const handleSave = () => {
    onSave(values);
    toast.success(`Updated stock for ${products.length} product${products.length === 1 ? "" : "s"}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Stock Update</DialogTitle>
          <DialogDescription>Update stock quantities for all of your products at once.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between gap-3">
              <Label htmlFor={`bulk-${product.id}`} className="flex-1 truncate font-normal">
                {product.name}
              </Label>
              <Input
                id={`bulk-${product.id}`}
                type="number"
                min={0}
                className="w-24"
                value={values[product.id] ?? 0}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [product.id]: Number(e.target.value) }))
                }
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save all
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
