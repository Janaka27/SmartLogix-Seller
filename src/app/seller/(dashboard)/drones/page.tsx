"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plane,
  PlusCircle,
  BatteryMedium,
  Gauge,
  Route as RouteIcon,
  Weight,
  Box,
  X,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RequestDroneDialog,
  type DroneRequestFormValues,
} from "@/components/seller/RequestDroneDialog";
import { formatDateTime, formatDistance, formatWeight } from "@/lib/format";
import type { Drone, DroneRequest, DroneStatus } from "@/lib/types";
import { SellerService } from "@/server/services/seller.service";
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

const URGENCY_STYLES: Record<DroneRequest["urgency"], string> = {
  low: "bg-slate-100 text-slate-700",
  normal: "bg-blue-50 text-blue-700",
  high: "bg-red-50 text-red-700",
};

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

export default function SellerDronesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [requests, setRequests] = useState<DroneRequest[]>([]);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await SellerService.getUser();
        if (!user) {
          router.push("/seller/login");
          return;
        }
        setSellerId(user.id);

        const warehouse = await WarehouseService.getBySeller(user.id);
        if (!warehouse) {
          setLoading(false);
          return;
        }
        setWarehouseId(warehouse.id);

        const [fleet, myRequests] = await Promise.all([
          DroneService.getByWarehouse(warehouse.id),
          DroneService.getMyRequests(user.id),
        ]);
        setDrones(fleet);
        setRequests(myRequests);
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

  const handleRequestSave = async (values: DroneRequestFormValues) => {
    if (!sellerId) return;
    const created = await DroneService.createRequest({
      sellerId,
      warehouseId,
      requestedQuantity: values.requestedQuantity,
      reason: values.reason,
      urgency: values.urgency,
    });
    setRequests((prev) => [created, ...prev]);
  };

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

  const handleCancelRequest = async (id: string) => {
    try {
      const updated = await DroneService.cancelRequest(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success("Request cancelled");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel request");
    }
  };

  return (
    <div>
      <PageHeader
        title="Drone Fleet"
        description={
          loading
            ? "Loading your fleet…"
            : warehouseId
              ? "Your assigned delivery drones — update each one's status as it changes."
              : "Set up your warehouse to get your drone fleet assigned."
        }
        actions={
          warehouseId && (
            <Button onClick={() => setRequestDialogOpen(true)}>
              <PlusCircle /> Request More Drones
            </Button>
          )
        }
      />

      {loading ? (
        <FleetSkeleton />
      ) : !warehouseId ? (
        <EmptyState
          icon={Plane}
          title="No warehouse yet"
          description="Your 5-drone starter fleet is assigned automatically as soon as your warehouse is set up."
          action={
            <Button size="sm" onClick={() => router.push("/seller/inventory")}>
              Set up warehouse
            </Button>
          }
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
              title="No drones assigned yet"
              description="Your fleet is being provisioned. If this persists, reach out to support."
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

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Additional drone requests</h2>
            {requests.length === 0 ? (
              <EmptyState
                icon={PlusCircle}
                title="No requests yet"
                description="Need more than 5 drones? Submit a request and admin will review it."
                action={
                  <Button size="sm" onClick={() => setRequestDialogOpen(true)}>
                    <PlusCircle /> Request More Drones
                  </Button>
                }
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-muted-foreground"
                          onClick={() => handleCancelRequest(req.id)}
                        >
                          <X /> Cancel
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <RequestDroneDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        onSave={handleRequestSave}
      />
    </div>
  );
}
