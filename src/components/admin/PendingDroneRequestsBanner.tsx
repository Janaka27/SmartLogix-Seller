"use client";

import { useState } from "react";
import Link from "next/link";
import { TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAdminNotifications } from "@/components/admin/AdminNotificationsContext";

// Persistent — not a toast that disappears after a few seconds — so a
// pending request stays visible on every admin page until it's actually
// reviewed, whether or not an admin was online when it was submitted.
export function PendingDroneRequestsBanner() {
  const { pendingCount } = useAdminNotifications();
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  if (pendingCount === 0 || dismissedAt === pendingCount) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-orange-200 bg-orange-50 px-4 py-2">
      <div className="flex items-center gap-2 text-sm text-orange-900">
        <TriangleAlert className="h-4 w-4 shrink-0 text-orange-600" />
        <span>
          <span className="font-medium">{pendingCount}</span> drone request{pendingCount > 1 ? "s" : ""} awaiting
          review.
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 border-orange-300 bg-white text-orange-700 hover:bg-orange-100"
          render={<Link href="/admin/drones" />}
        >
          Review
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-orange-700 hover:bg-orange-100"
          onClick={() => setDismissedAt(pendingCount)}
          aria-label="Dismiss"
        >
          <X />
        </Button>
      </div>
    </div>
  );
}
