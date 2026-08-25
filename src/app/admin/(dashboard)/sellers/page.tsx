"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Store, Check, X, Ban, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTableToolbar } from "@/components/dashboard/DataTableToolbar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sellers as seedSellers } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import type { Seller, SellerStatus } from "@/lib/types";

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>(seedSellers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SellerStatus | "all">("all");

  const filtered = useMemo(() => {
    return sellers.filter((s) => {
      const matchesSearch =
        s.businessName.toLowerCase().includes(search.toLowerCase()) ||
        s.ownerName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sellers, search, statusFilter]);

  const setStatus = (seller: Seller, status: SellerStatus) => {
    setSellers((prev) => prev.map((s) => (s.id === seller.id ? { ...s, status } : s)));
    toast.success(`${seller.businessName} ${status}`);
  };

  return (
    <div>
      <PageHeader title="Seller Management" description="Approve, reject, or suspend seller accounts." />

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search sellers..."
        filters={
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v ?? "all") as typeof statusFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Store} title="No sellers found" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Warehouses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell className="font-medium text-foreground">{seller.businessName}</TableCell>
                  <TableCell className="text-muted-foreground">{seller.ownerName}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(seller.appliedAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{seller.warehouseIds.length}</TableCell>
                  <TableCell>
                    <StatusBadge status={seller.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        {seller.status === "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => setStatus(seller, "approved")}>
                              <Check /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatus(seller, "rejected")}>
                              <X /> Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {seller.status === "approved" && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setStatus(seller, "suspended")}
                          >
                            <Ban /> Suspend
                          </DropdownMenuItem>
                        )}
                        {(seller.status === "suspended" || seller.status === "rejected") && (
                          <DropdownMenuItem onClick={() => setStatus(seller, "approved")}>
                            <RotateCcw /> Reinstate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
