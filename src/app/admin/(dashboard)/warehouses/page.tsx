"use client";

import { useEffect, useMemo, useState } from "react";
import { Warehouse as WarehouseIcon, Plus, Pencil, Zap, MapPin, List, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTableToolbar } from "@/components/dashboard/DataTableToolbar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WarehouseFormDialog, type WarehouseManagerOption } from "@/components/admin/WarehouseFormDialog";
import { LocationDialog } from "@/components/dashboard/LocationDialog";
import { LocationsMap } from "@/components/dashboard/LocationsMap";
import { WarehouseService } from "@/server/services/warehouse.service";
import { AdminService } from "@/server/services/admin.service";
import { formatCoordinates } from "@/lib/format";
import type { Warehouse } from "@/lib/types";

type AdminWarehouse = Warehouse & { activeDroneCount?: number };

export default function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState<AdminWarehouse[]>([]);
  const [managers, setManagers] = useState<WarehouseManagerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [mapWarehouse, setMapWarehouse] = useState<AdminWarehouse | null>(null);

  useEffect(() => {
    Promise.all([WarehouseService.getAll(), AdminService.getAllUsers()])
      .then(([warehouseData, users]) => {
        setWarehouses(warehouseData as unknown as AdminWarehouse[]);
        setManagers(
          (users as { id: string; name: string; role: string }[])
            .filter((u) => u.role === "warehouse_manager")
            .map((u) => ({ id: u.id, name: u.name }))
        );
      })
      .catch((err) => {
        console.error("Failed to load warehouses", err);
        toast.error("Failed to load warehouses");
      })
      .finally(() => setLoading(false));
  }, []);

  const managerName = (id?: string) => managers.find((m) => m.id === id)?.name;

  const filtered = useMemo(
    () => warehouses.filter((w) => w.name.toLowerCase().includes(search.toLowerCase())),
    [warehouses, search]
  );

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (warehouse: Warehouse) => {
    setEditing(warehouse);
    setDialogOpen(true);
  };

  const handleSave = async (values: Omit<Warehouse, "id">) => {
    try {
      if (editing) {
        const updated = await WarehouseService.update(editing.id, values);
        setWarehouses((prev) =>
          prev.map((w) => (w.id === editing.id ? { ...w, ...updated } : w))
        );
      } else {
        const created = await WarehouseService.create(values);
        setWarehouses((prev) => [created as unknown as AdminWarehouse, ...prev]);
      }
    } catch (err) {
      console.error("Failed to save warehouse", err);
      toast.error("Failed to save warehouse");
    }
  };

  return (
    <div>
      <PageHeader
        title="Warehouse Management"
        description="Add and configure warehouses across the network."
        actions={
          <Button onClick={openAdd}>
            <Plus /> Add Warehouse
          </Button>
        }
      />

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search warehouses..."
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">
              <List /> List
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapIcon /> Map view
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {filtered.length === 0 ? (
              <EmptyState icon={WarehouseIcon} title="No warehouses found" />
            ) : (
              <div className="rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Drone Docks</TableHead>
                      <TableHead>Active Drones</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Charging</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((warehouse) => {
                      return (
                        <TableRow key={warehouse.id}>
                          <TableCell className="font-medium text-foreground">{warehouse.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            <button
                              type="button"
                              onClick={() => setMapWarehouse(warehouse)}
                              className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                            >
                              <MapPin className="h-3 w-3 shrink-0" />
                              {warehouse.city || (
                                <span className="text-xs">
                                  {formatCoordinates(warehouse.latitude, warehouse.longitude)}
                                </span>
                              )}
                            </button>
                          </TableCell>
                          <TableCell>{warehouse.capacity.toLocaleString()}</TableCell>
                          <TableCell>{warehouse.droneDockCount}</TableCell>
                          <TableCell>{warehouse.activeDroneCount ?? 0}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {managerName(warehouse.managerId) ?? (
                              <span className="text-xs">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {warehouse.chargingStation ? (
                              <Badge variant="secondary" className="border-0 bg-orange-50 text-orange-700">
                                <Zap className="h-3 w-3" /> Yes
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(warehouse)}>
                              <Pencil />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="map">
            {filtered.length === 0 ? (
              <EmptyState icon={WarehouseIcon} title="No warehouses found" />
            ) : (
              <LocationsMap
                locations={filtered.map((w) => ({
                  id: w.id,
                  name: w.name,
                  subtitle: `${w.city || formatCoordinates(w.latitude, w.longitude)} · Capacity ${w.capacity.toLocaleString()} · ${w.droneDockCount} drone docks`,
                  latitude: w.latitude,
                  longitude: w.longitude,
                }))}
                onSelect={(id) => {
                  const warehouse = filtered.find((w) => w.id === id);
                  if (warehouse) openEdit(warehouse);
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      )}

      <WarehouseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        warehouse={editing}
        managers={managers}
        onSave={handleSave}
      />

      <LocationDialog
        open={!!mapWarehouse}
        onOpenChange={(open) => !open && setMapWarehouse(null)}
        title={mapWarehouse?.name ?? ""}
        subtitle={mapWarehouse?.city}
        latitude={mapWarehouse?.latitude ?? 0}
        longitude={mapWarehouse?.longitude ?? 0}
      />
    </div>
  );
}
