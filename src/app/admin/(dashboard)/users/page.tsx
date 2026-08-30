"use client";

import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTableToolbar } from "@/components/dashboard/DataTableToolbar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { AdminService, isUnauthorizedError } from "@/server/services/admin.service";
import { formatDate } from "@/lib/format";

type PlatformRole = "buyer" | "seller" | "admin";

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: PlatformRole;
  avatarUrl?: string;
  joinedAt: string;
}

const ROLE_LABELS: Record<PlatformRole, string> = {
  admin: "Admin",
  seller: "Seller",
  buyer: "Buyer",
};

const ROLE_BADGE_CLASSES: Record<PlatformRole, string> = {
  admin: "bg-blue-50 text-blue-700",
  seller: "bg-orange-50 text-orange-700",
  buyer: "bg-slate-100 text-slate-700",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<PlatformRole | "all">("all");

  useEffect(() => {
    AdminService.getAllUsers()
      .then((data) => setUsers(data as PlatformUser[]))
      .catch((err) => {
        // Nothing gates this page by role yet, so a non-admin session lands
        // here too and gets a 401 — expected, not worth logging or toasting.
        if (!isUnauthorizedError(err)) {
          console.error("Failed to load users", err);
          toast.error("Failed to load users");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  return (
    <div>
      <PageHeader title="Users" description="Everyone registered on the SmartLogix platform." />

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users..."
        filters={
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter((v ?? "all") as typeof roleFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="seller">Seller</SelectItem>
              <SelectItem value="buyer">Buyer</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                        <AvatarFallback className="bg-slate-900 text-xs text-white">
                          {initials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`border-0 ${ROLE_BADGE_CLASSES[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.joinedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
