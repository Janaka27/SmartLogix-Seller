"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, MoreHorizontal, BatteryMedium, MessageSquare, Check, X } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DroneFormDialog } from "@/components/admin/DroneFormDialog";
import { drones as seedDrones, warehouses } from "@/lib/mock-data";
import { AdminService } from "@/server/services/admin.service";
import { formatDateTime } from "@/lib/format";
import type { Drone, DroneRequest, DroneStatus } from "@/lib/types";

const COLUMNS: { status: DroneStatus; label: string; accent: string }[] = [
  { status: "available", label: "Available", accent: "text-emerald-600" },
  { status: "in_flight", label: "In-Flight", accent: "text-amber-600" },
  { status: "charging", label: "Charging", accent: "text-blue-600" },
  { status: "maintenance", label: "Maintenance", accent: "text-red-600" },
];

const URGENCY_STYLES: Record<DroneRequest["urgency"], string> = {
  low: "bg-slate-100 text-slate-700",
  normal: "bg-blue-50 text-blue-700",
  high: "bg-red-50 text-red-700",
};

export default function AdminDronesPage() {
  const [drones, setDrones] = useState<Drone[]>(seedDrones);
  const [requests, setRequests] = useState<DroneRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Drone | null>(null);

  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const reqs = await AdminService.getAllDroneRequests();
      const mappedReqs = reqs.map((r: any) => ({
        id: r.id,
        sellerId: r.seller_id || r.sellerId,
        warehouseId: r.warehouse_id || r.warehouseId,
        requestedQuantity: r.requested_quantity || r.requestedQuantity,
        reason: r.reason,
        urgency: r.urgency,
        status: r.status,
        adminNotes: r.admin_notes || r.adminNotes,
        createdAt: r.created_at || r.createdAt || new Date().toISOString(),
        updatedAt: r.updated_at || r.updatedAt,
      })) as DroneRequest[];
      setRequests(mappedReqs);
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleUpdateStatus = async (req: DroneRequest, status: string) => {
    setUpdatingId(req.id);
    try {
      await AdminService.updateDroneRequestStatus(req.id, status, draftNotes[req.id] || "");
      toast.success(`Request ${status}`);
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to update request");
    } finally {
      setUpdatingId(null);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (drone: Drone) => {
    setEditing(drone);
    setDialogOpen(true);
  };

  const setStatus = (drone: Drone, status: DroneStatus) => {
    setDrones((prev) => prev.map((d) => (d.id === drone.id ? { ...d, status } : d)));
    toast.success(`${drone.droneCode} set to ${status.replace(/_/g, " ")}`);
  };

  const handleSave = (values: Omit<Drone, "id" | "status" | "currentLat" | "currentLng" | "batteryCapacityPct">) => {
    if (editing) {
      setDrones((prev) => prev.map((d) => (d.id === editing.id ? { ...d, ...values } : d)));
    } else {
      const home = warehouses.find((w) => w.id === values.homeWarehouseId);
      setDrones((prev) => [
        {
          id: `dr-${Math.random().toString(36).slice(2, 8)}`,
          status: "available",
          batteryCapacityPct: 100,
          currentLat: home?.latitude ?? 30.2672,
          currentLng: home?.longitude ?? -97.7431,
          ...values,
        },
        ...prev,
      ]);
    }
  };

  return (
    <div>
      <PageHeader
        title="Drone Fleet Management"
        description="Live status board and manual overrides for the fleet."
        actions={
          <Button onClick={openAdd}>
            <Plus /> Add Drone
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((column) => {
          const columnDrones = drones.filter((d) => d.status === column.status);
          return (
            <div key={column.status}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className={`text-sm font-semibold ${column.accent}`}>{column.label}</h3>
                <span className="text-xs text-muted-foreground">{columnDrones.length}</span>
              </div>
              <div className="space-y-3">
                {columnDrones.map((drone) => {
                  const home = warehouses.find((w) => w.id === drone.homeWarehouseId);
                  return (
                    <Card key={drone.id} className="shadow-none">
                      <div className="flex items-start justify-between px-4">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{drone.droneCode}</p>
                          <p className="text-xs text-muted-foreground">{drone.model}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-xs">
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(drone)}>
                              <Pencil /> Edit specs
                            </DropdownMenuItem>
                            {COLUMNS.filter((c) => c.status !== drone.status).map((c) => (
                              <DropdownMenuItem key={c.status} onClick={() => setStatus(drone, c.status)}>
                                Set {c.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="px-4">
                        <p className="mb-1.5 text-xs text-muted-foreground">Home: {home?.name}</p>
                        <div className="flex items-center gap-2">
                          <BatteryMedium className="h-3.5 w-3.5 text-muted-foreground" />
                          <Progress value={drone.batteryCapacityPct} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground">{drone.batteryCapacityPct}%</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Drone Requests from Sellers</h2>
        {requests.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No drone requests"
            description="There are currently no drone requests from sellers."
          />
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id} className="shadow-none" size="sm">
                <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {req.requestedQuantity} drone{req.requestedQuantity > 1 ? "s" : ""} requested
                      </p>
                      <StatusBadge status={req.status} />
                      <Badge variant="secondary" className={`border-0 font-medium ${URGENCY_STYLES[req.urgency]}`}>
                        {req.urgency} urgency
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{req.reason}</p>
                    {req.adminNotes && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Admin note:</span> {req.adminNotes}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Submitted {formatDateTime(req.createdAt)}
                    </p>
                  </div>

                  {req.status === "pending" && (
                    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-64 sm:items-end">
                      <Input
                        placeholder="Add admin note..."
                        value={draftNotes[req.id] || ""}
                        onChange={(e) => setDraftNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                        className="h-8 text-xs"
                      />
                      <div className="flex w-full gap-2 sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-emerald-600 hover:text-emerald-700 sm:flex-none"
                          onClick={() => handleUpdateStatus(req, "approved")}
                          disabled={updatingId === req.id}
                        >
                          <Check className="mr-1.5 h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 hover:text-red-700 sm:flex-none"
                          onClick={() => handleUpdateStatus(req, "rejected")}
                          disabled={updatingId === req.id}
                        >
                          <X className="mr-1.5 h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DroneFormDialog open={dialogOpen} onOpenChange={setDialogOpen} drone={editing} onSave={handleSave} />
    </div>
  );
}
