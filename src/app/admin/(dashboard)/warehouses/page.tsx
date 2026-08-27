"use client";

import { useEffect, useMemo, useState } from "react";
import { Warehouse as WarehouseIcon, Plus, Pencil, Zap } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTableToolbar } from "@/components/dashboard/DataTableToolbar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WarehouseFormDialog } from "@/components/admin/WarehouseFormDialog";
import { WarehouseService } from "@/server/services/warehouse.service";
import type { Warehouse } from "@/lib/types";

type AdminWarehouse = Warehouse & { activeDroneCount?: number };

export default function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState<AdminWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);

  useEffect(() => {
    WarehouseService.getAll()
      .then((data) => setWarehouses(data as unknown as AdminWarehouse[]))
      .catch((err) => {
        console.error("Failed to load warehouses", err);
        toast.error("Failed to load warehouses");
      })
      .finally(() => setLoading(false));
  }, []);

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
      ) : filtered.length === 0 ? (
        <EmptyState icon={WarehouseIcon} title="No warehouses found" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Drone Docks</TableHead>
                <TableHead>Active Drones</TableHead>
                <TableHead>Charging</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((warehouse) => {
                return (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-medium text-foreground">{warehouse.name}</TableCell>
                    <TableCell className="text-muted-foreground">{warehouse.city}</TableCell>
                    <TableCell>{warehouse.capacity.toLocaleString()}</TableCell>
                    <TableCell>{warehouse.droneDockCount}</TableCell>
                    <TableCell>{warehouse.activeDroneCount ?? 0}</TableCell>
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

      <WarehouseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        warehouse={editing}
        onSave={handleSave}
      />
    </div>
  );
}
