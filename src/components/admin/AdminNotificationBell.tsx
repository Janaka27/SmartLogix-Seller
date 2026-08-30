"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminNotifications } from "@/components/admin/AdminNotificationsContext";
import { formatDateTime } from "@/lib/format";
import type { DroneRequestUrgency } from "@/lib/types";

const URGENCY_STYLES: Record<DroneRequestUrgency, string> = {
  low: "bg-slate-100 text-slate-700",
  normal: "bg-orange-50 text-orange-700",
  high: "bg-red-50 text-red-700",
};

export function AdminNotificationBell() {
  const { notifications, unreadCount, markAllRead } = useAdminNotifications();

  return (
    <DropdownMenu onOpenChange={(open) => open && markAllRead()}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative">
            <Bell />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-medium text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Drone requests</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No new requests. Listening for updates…
          </p>
        ) : (
          <div className="flex max-h-80 flex-col gap-1 overflow-y-auto p-1">
            {notifications.map((n) => (
              <div key={n.id} className="rounded-md p-2 hover:bg-muted">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {n.requestedQuantity} drone{n.requestedQuantity > 1 ? "s" : ""} requested
                  </p>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 border-0 text-[10px] font-medium ${URGENCY_STYLES[n.urgency]}`}
                  >
                    {n.urgency}
                  </Badge>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.reason}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{formatDateTime(n.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/admin/drones" />}>Review all requests</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
