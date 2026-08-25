"use client";

import { useState } from "react";
import { Users, Plus, MoreHorizontal, Ban, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteUserDialog } from "@/components/admin/InviteUserDialog";
import { adminUsers as seedUsers } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/format";
import type { AdminRole, AdminUser } from "@/lib/types";

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  ops_manager: "Ops Manager",
  support: "Support",
  finance: "Finance",
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
  const [users, setUsers] = useState<AdminUser[]>(seedUsers);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleInvite = (values: { name: string; email: string; role: AdminRole }) => {
    setUsers((prev) => [
      {
        id: `au-${Math.random().toString(36).slice(2, 8)}`,
        status: "invited",
        lastActiveAt: new Date().toISOString(),
        ...values,
      },
      ...prev,
    ]);
  };

  const toggleStatus = (user: AdminUser) => {
    const next = user.status === "disabled" ? "active" : "disabled";
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: next } : u)));
    toast.success(`${user.name} ${next}`);
  };

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        description="Manage admin and operations staff access."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus /> Invite User
          </Button>
        }
      />

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users yet" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
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
                    <Badge variant="secondary" className="border-0 bg-slate-100 text-slate-700">
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(user.lastActiveAt)}
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
                        {user.status === "disabled" ? (
                          <DropdownMenuItem onClick={() => toggleStatus(user)}>
                            <RotateCcw /> Reactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem variant="destructive" onClick={() => toggleStatus(user)}>
                            <Ban /> Disable
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

      <InviteUserDialog open={dialogOpen} onOpenChange={setDialogOpen} onInvite={handleInvite} />
    </div>
  );
}
