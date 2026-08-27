"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { useDroneRequests } from "@/hooks/useDroneRequests";
import { AdminService, isUnauthorizedError } from "@/server/services/admin.service";
import { createClient } from "@/lib/supabase";
import type { DroneRequestUrgency } from "@/lib/types";

export interface DroneRequestNotification {
  id: string;
  requestedQuantity: number;
  reason: string;
  urgency: DroneRequestUrgency;
  createdAt: string;
}

// Raw shape of a `drone_requests` row as it arrives over Supabase Realtime
// (snake_case, straight from postgres_changes).
interface DroneRequestRow {
  id: string;
  requested_quantity: number;
  reason: string;
  urgency: DroneRequestUrgency;
  created_at: string;
}

interface AdminNotificationsContextValue {
  notifications: DroneRequestNotification[];
  unreadCount: number;
  // Every request currently sitting at status "pending" — unlike
  // `notifications`, this reflects real DB state, not just requests that
  // happened to arrive while an admin was online, so it's safe to show as a
  // persistent "N requests need review" banner on every admin page.
  pendingCount: number;
  markAllRead: () => void;
}

const AdminNotificationsContext = createContext<AdminNotificationsContextValue | null>(null);

const MAX_NOTIFICATIONS = 20;

// Subscribes once to live drone requests for the whole admin panel (mounted
// in the admin layout, so it keeps listening across every admin page) and
// surfaces new ones both as a themed top alert and via the topbar bell.
export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<DroneRequestNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // This provider mounts for any signed-in user on an admin page, not just
  // admins (nothing currently gates the admin panel by role) — a non-admin
  // session gets a 401 here, which just means "nothing to show them", not a
  // real failure, so it's swallowed quietly instead of logged as an error.
  const loadPendingCount = useCallback(async (): Promise<number | null> => {
    try {
      const all = (await AdminService.getAllDroneRequests()) as { status: string }[];
      return all.filter((r) => r.status === "pending").length;
    } catch (err) {
      if (!isUnauthorizedError(err)) {
        console.error("Failed to load pending drone requests", err);
      }
      return null;
    }
  }, []);

  const refreshPendingCount = useCallback(async () => {
    const count = await loadPendingCount();
    if (count !== null) setPendingCount(count);
  }, [loadPendingCount]);

  // Seed the persistent count on mount, then keep it in sync as requests are
  // approved/rejected/fulfilled/cancelled (a status change elsewhere doesn't
  // fire the INSERT listener below, so it needs its own subscription).
  useEffect(() => {
    let cancelled = false;
    loadPendingCount().then((count) => {
      if (!cancelled && count !== null) setPendingCount(count);
    });

    const supabase = createClient();
    const channel = supabase
      .channel("admin-drone-requests-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "drone_requests" },
        () => refreshPendingCount()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [loadPendingCount, refreshPendingCount]);

  const handleNewRequest = useCallback((row: DroneRequestRow) => {
    const notification: DroneRequestNotification = {
      id: row.id,
      requestedQuantity: row.requested_quantity,
      reason: row.reason,
      urgency: row.urgency,
      createdAt: row.created_at,
    };

    setNotifications((prev) => [notification, ...prev].slice(0, MAX_NOTIFICATIONS));
    setUnreadCount((prev) => prev + 1);
    setPendingCount((prev) => prev + 1);

    toast.warning("New drone request", {
      description: `${notification.requestedQuantity} drone${notification.requestedQuantity > 1 ? "s" : ""} requested — ${notification.reason}`,
      position: "top-center",
      duration: 6000,
    });
  }, []);

  useDroneRequests(handleNewRequest);

  const markAllRead = useCallback(() => setUnreadCount(0), []);

  return (
    <AdminNotificationsContext.Provider value={{ notifications, unreadCount, pendingCount, markAllRead }}>
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  const ctx = useContext(AdminNotificationsContext);
  if (!ctx) {
    throw new Error("useAdminNotifications must be used within AdminNotificationsProvider");
  }
  return ctx;
}
