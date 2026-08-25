"use client";

import { useState } from "react";
import { Plus, Pencil, MoreHorizontal, BatteryMedium } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DroneFormDialog } from "@/components/admin/DroneFormDialog";
import { drones as seedDrones, warehouses } from "@/lib/mock-data";
import type { Drone, DroneStatus } from "@/lib/types";

const COLUMNS: { status: DroneStatus; label: string; accent: string }[] = [
  { status: "available", label: "Available", accent: "text-emerald-600" },
  { status: "in_flight", label: "In-Flight", accent: "text-amber-600" },
  { status: "charging", label: "Charging", accent: "text-blue-600" },
  { status: "maintenance", label: "Maintenance", accent: "text-red-600" },
];

export default function AdminDronesPage() {
  const [drones, setDrones] = useState<Drone[]>(seedDrones);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Drone | null>(null);

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

      <DroneFormDialog open={dialogOpen} onOpenChange={setDialogOpen} drone={editing} onSave={handleSave} />
    </div>
  );
}
