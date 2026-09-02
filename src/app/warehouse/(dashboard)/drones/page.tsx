"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plane,
  BatteryMedium,
  Gauge,
  Route as RouteIcon,
  Weight,
  Box,
  MoreHorizontal,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistance, formatWeight } from "@/lib/format";
import type { Drone, DroneStatus } from "@/lib/types";
import { WarehouseManagerService } from "@/server/services/warehouse-manager.service";
import { WarehouseService } from "@/server/services/warehouse.service";
import { DroneService } from "@/server/services/drone.service";

const STATUS_ACCENT: Record<Drone["status"], string> = {
  available: "text-emerald-600",
  in_flight: "text-amber-600",
  charging: "text-blue-600",
  maintenance: "text-red-600",
};

const STATUS_OPTIONS: { status: DroneStatus; label: string }[] = [
  { status: "available", label: "Available" },
  { status: "in_flight", label: "In-Flight" },
  { status: "charging", label: "Charging" },
  { status: "maintenance", label: "Maintenance" },
];

function FleetSkeleton() {
  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function WarehouseDronesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [warehouseName, setWarehouseName] = useState<string | null>(null);
  const [drones, setDrones] = useState<Drone[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await WarehouseManagerService.getUser();
        if (!user) {
          router.push("/warehouse/login");
          return;
        }

        const warehouse = await WarehouseService.getByManager(user.id);
        if (!warehouse) {
          setLoading(false);
          return;
        }
        setWarehouseId(warehouse.id);
        setWarehouseName(warehouse.name);

        const fleet = await DroneService.getByWarehouse(warehouse.id);
        setDrones(fleet);
      } catch (err) {
        console.error("Failed to load drone fleet", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const counts = useMemo(() => {
    return {
      total: drones.length,
      available: drones.filter((d) => d.status === "available").length,
      in_flight: drones.filter((d) => d.status === "in_flight").length,
      charging: drones.filter((d) => d.status === "charging").length,
      maintenance: drones.filter((d) => d.status === "maintenance").length,
    };
  }, [drones]);

  const handleSetStatus = async (drone: Drone, status: DroneStatus) => {
    const previous = drones;
    setDrones((prev) => prev.map((d) => (d.id === drone.id ? { ...d, status } : d)));
    try {
      await DroneService.updateStatus(drone.id, status);
      toast.success(`${drone.droneCode} set to ${status.replace(/_/g, " ")}`);
    } catch (err: any) {
      setDrones(previous);
      toast.error(err.message || "Failed to update drone status");
    }
  };

  return (
    <div>
      <PageHeader
        title="Drone Fleet"
        description={
          loading
            ? "Loading fleet…"
            : warehouseName
              ? `Drones docked at ${warehouseName} — update each one's status as it changes.`
              : "Waiting for an admin to assign you a warehouse."
        }
      />

      {loading ? (
        <FleetSkeleton />
      ) : !warehouseId ? (
        <EmptyState
          icon={WarehouseIcon}
          title="No warehouse assigned yet"
          description="Once an admin assigns you to a warehouse, its drone fleet will show up here."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Fleet size" value={String(counts.total)} icon={Plane} />
            <StatCard label="Available" value={String(counts.available)} icon={Gauge} />
            <StatCard label="In-Flight" value={String(counts.in_flight)} icon={RouteIcon} accent="warning" />
            <StatCard
              label="Charging / Maintenance"
              value={`${counts.charging} / ${counts.maintenance}`}
              icon={BatteryMedium}
              accent={counts.maintenance > 0 ? "danger" : "default"}
            />
          </div>

          {drones.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="No drones docked here"
              description="Drones assigned to this warehouse will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {drones.map((drone) => (
                <Card key={drone.id} className="shadow-none">
                  <div className="flex items-start justify-between px-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{drone.droneCode}</p>
                      <p className="text-xs text-muted-foreground">{drone.model}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusBadge status={drone.status} />
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-xs">
                              <MoreHorizontal />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          {STATUS_OPTIONS.filter((o) => o.status !== drone.status).map((o) => (
                            <DropdownMenuItem key={o.status} onClick={() => handleSetStatus(drone, o.status)}>
                              Set {o.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-3 px-4">
                    <div className="flex items-center gap-2">
                      <BatteryMedium className={`h-3.5 w-3.5 ${STATUS_ACCENT[drone.status]}`} />
                      <Progress value={drone.batteryCapacityPct} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{drone.batteryCapacityPct}%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Weight className="h-3.5 w-3.5" /> Max payload
                      </div>
                      <div className="text-right font-medium text-foreground">
                        {formatWeight(drone.maxPayloadKg)}
                      </div>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <RouteIcon className="h-3.5 w-3.5" /> Max range
                      </div>
                      <div className="text-right font-medium text-foreground">
                        {formatDistance(drone.maxRangeKm)}
                      </div>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Gauge className="h-3.5 w-3.5" /> Speed
                      </div>
                      <div className="text-right font-medium text-foreground">{drone.speedKmh} km/h</div>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Box className="h-3.5 w-3.5" /> Cargo bay
                      </div>
                      <div className="text-right font-medium text-foreground">
                        {drone.cargoBayLengthCm}×{drone.cargoBayWidthCm}×{drone.cargoBayHeightCm} cm
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
