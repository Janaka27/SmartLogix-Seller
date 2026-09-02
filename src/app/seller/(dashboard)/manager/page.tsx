"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Warehouse as WarehouseIcon, X } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InviteManagerDialog, type InviteManagerFormValues } from "@/components/seller/InviteManagerDialog";
import { SellerService } from "@/server/services/seller.service";
import { WarehouseService } from "@/server/services/warehouse.service";
import { ManagerInviteService, type WarehouseManagerStatus } from "@/server/services/manager-invite.service";

function ManagerPageSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function SellerManagerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<WarehouseManagerStatus[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteWarehouseId, setInviteWarehouseId] = useState<string | undefined>(undefined);
  const [removing, setRemoving] = useState<WarehouseManagerStatus | null>(null);

  const load = async () => {
    try {
      const user = await SellerService.getUser();
      if (!user) {
        router.push("/seller/login");
        return;
      }
      const data = await ManagerInviteService.list();
      setRows(data);
    } catch (err) {
      console.error("Failed to load warehouse managers", err);
      toast.error("Failed to load warehouse managers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasWarehouse = rows.length > 0;
  const warehouseOptions = useMemo(
    () => rows.map((r) => ({ id: r.warehouseId, name: r.warehouseName })),
    [rows]
  );

  const openInvite = (warehouseId?: string) => {
    setInviteWarehouseId(warehouseId);
    setInviteOpen(true);
  };

  const handleInvite = async (values: InviteManagerFormValues) => {
    await ManagerInviteService.invite(values);
    await load();
  };

  const handleRemove = async () => {
    if (!removing) return;
    try {
      await WarehouseService.update(removing.warehouseId, { managerId: "" });
      toast.success(`Removed ${removing.manager?.name ?? "manager"}'s access`);
      setRows((prev) =>
        prev.map((r) => (r.warehouseId === removing.warehouseId ? { ...r, manager: null } : r))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to remove access");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Warehouse Manager"
        description={
          loading
            ? "Loading…"
            : "Invite someone to run drones, orders, and inventory for your warehouse."
        }
        actions={
          hasWarehouse && (
            <Button onClick={() => openInvite(undefined)}>
              <UserPlus /> Invite Manager
            </Button>
          )
        }
      />

      {loading ? (
        <ManagerPageSkeleton />
      ) : !hasWarehouse ? (
        <EmptyState
          icon={WarehouseIcon}
          title="Set up a warehouse first"
          description="You'll need a warehouse before you can invite someone to manage it."
          action={
            <Button size="sm" onClick={() => router.push("/seller/inventory")}>
              Set up warehouse
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.warehouseId} className="shadow-none">
              <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <WarehouseIcon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{row.warehouseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.manager ? "Managed" : "No manager assigned"}
                    </p>
                  </div>
                </div>

                {row.manager ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-slate-900 text-xs text-white">
                          {initials(row.manager.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{row.manager.name}</p>
                        <p className="text-xs text-muted-foreground">{row.manager.email}</p>
                      </div>
                    </div>
                    <StatusBadge status={row.manager.status} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => setRemoving(row)}
                    >
                      <X /> Remove
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => openInvite(row.warehouseId)}>
                    <Mail /> Invite manager
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <InviteManagerDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        warehouses={warehouseOptions}
        defaultWarehouseId={inviteWarehouseId}
        onSave={handleInvite}
      />

      <AlertDialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove manager access?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.manager?.name} will no longer be able to manage drones, orders, or inventory
              for {removing?.warehouseName}. Their account isn&apos;t deleted — you can invite someone
              else, or re-invite them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep access</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleRemove}>
              <X /> Remove access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
