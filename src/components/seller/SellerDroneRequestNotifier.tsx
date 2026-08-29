"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase";
import { SellerService } from "@/server/services/seller.service";
import type { DroneRequestStatus } from "@/lib/types";

interface DroneRequestRow {
  id: string;
  requested_quantity: number;
  reason: string;
  status: DroneRequestStatus;
  admin_notes: string | null;
}

const DECISION_COPY: Partial<Record<DroneRequestStatus, { title: string; kind: "success" | "error" }>> = {
  approved: { title: "Drone request approved", kind: "success" },
  fulfilled: { title: "Drone request fulfilled", kind: "success" },
  rejected: { title: "Drone request declined", kind: "error" },
};

// Mounted once in the seller layout so a seller gets notified the moment
// admin decides on their drone request, wherever they are in the panel —
// not just if they happen to be sitting on the Drone Fleet page.
export function SellerDroneRequestNotifier() {
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    const supabase = createClient();

    SellerService.getUser().then((user) => {
      if (cancelled || !user) return;

      channel = supabase
        .channel(`seller-drone-requests-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "drone_requests",
            filter: `seller_id=eq.${user.id}`,
          },
          (payload) => {
            const row = payload.new as DroneRequestRow;
            const copy = DECISION_COPY[row.status];
            if (!copy) return;

            const description = [
              `${row.requested_quantity} drone${row.requested_quantity > 1 ? "s" : ""} requested — ${row.reason}`,
              row.admin_notes ? `Admin note: ${row.admin_notes}` : null,
            ]
              .filter(Boolean)
              .join(". ");

            toast[copy.kind](copy.title, {
              description,
              position: "top-center",
              duration: 8000,
            });
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
