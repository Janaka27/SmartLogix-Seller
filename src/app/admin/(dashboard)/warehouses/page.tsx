"use client";

import { useMemo, useState } from "react";
import { Warehouse as WarehouseIcon, Plus, Pencil, Zap } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTableToolbar } from "@/components/dashboard/DataTableToolbar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WarehouseFormDialog } from "@/components/admin/WarehouseFormDialog";
import { warehouses as seedWarehouses, drones } from "@/lib/mock-data";
import type { Warehouse } from "@/lib/types";

export default function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(seedWarehouses);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);

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

  const handleSave = (values: Omit<Warehouse, "id">) => {
    if (editing) {
      setWarehouses((prev) => prev.map((w) => (w.id === editing.id ? { ...w, ...values } : w)));
    } else {
      setWarehouses((prev) => [
        { id: `wh-${Math.random().toString(36).slice(2, 8)}`, ...values },
        ...prev,
      ]);
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

      {filtered.length === 0 ? (
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
                const droneCount = drones.filter((d) => d.homeWarehouseId === warehouse.id).length;
                return (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-medium text-foreground">{warehouse.name}</TableCell>
                    <TableCell className="text-muted-foreground">{warehouse.city}</TableCell>
                    <TableCell>{warehouse.capacity.toLocaleString()}</TableCell>
                    <TableCell>{warehouse.droneDockCount}</TableCell>
                    <TableCell>{droneCount}</TableCell>
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
