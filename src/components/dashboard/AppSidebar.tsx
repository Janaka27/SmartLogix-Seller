"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sellerNavGroups, adminNavGroups, warehouseNavGroups, roleBadge } from "@/lib/nav-config";

interface AppSidebarProps {
  role: "seller" | "admin" | "warehouse";
}

import { useEffect, useState } from "react";
import { SellerService } from "@/server/services/seller.service";
import { AdminService } from "@/server/services/admin.service";
import { WarehouseManagerService } from "@/server/services/warehouse-manager.service";
import { createClient } from "@/lib/supabase";

const ROLE_SERVICE = {
  seller: SellerService,
  admin: AdminService,
  warehouse: WarehouseManagerService,
};

const ROLE_HOME = {
  seller: "/seller",
  admin: "/admin",
  warehouse: "/warehouse",
};

const ROLE_LOGIN = {
  seller: "/seller/login",
  admin: "/admin/login",
  warehouse: "/warehouse/login",
};

const MOCK_USER = {
  seller: { name: "Jenna Torri", email: "jenna@torrihome.com", initials: "JT", avatarUrl: undefined as string | undefined },
  admin: { name: "Priya Shah", email: "priya.shah@smartlogix.com", initials: "PS", avatarUrl: undefined as string | undefined },
  warehouse: { name: "Warehouse Manager", email: "", initials: "WM", avatarUrl: undefined as string | undefined },
};

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const groups = role === "seller" ? sellerNavGroups : role === "admin" ? adminNavGroups : warehouseNavGroups;
  const badge = roleBadge[role];
  const [user, setUser] = useState(MOCK_USER[role]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const service = ROLE_SERVICE[role];
        const authUser = await service.getUser();
        if (authUser) {
          const supabase = createClient();
          const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', authUser.id).single();
          const defaultName = role === "seller" ? "Seller" : role === "admin" ? "Admin" : "Warehouse Manager";
          const name = data?.full_name || authUser.email?.split('@')[0] || defaultName;
          const initials = name.substring(0, 2).toUpperCase();
          setUser({ name, email: authUser.email || "", initials, avatarUrl: data?.avatar_url || undefined });
        }
      } catch (e) {
        console.error("Failed to fetch user profile", e);
      }
    };
    fetchUser();
  }, [role]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={ROLE_HOME[role]} />}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                <Image
                  src="/images/logo-mark.png"
                  alt=""
                  width={191}
                  height={259}
                  className="h-full w-auto"
                />
              </span>
              <div className="flex flex-1 flex-col leading-tight">
                <span className="text-sm font-semibold text-white">SmartLogix</span>
                <span className={`w-fit rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/seller" || item.href === "/admin" || item.href === "/warehouse"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
              <Avatar className="h-7 w-7">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="bg-sidebar-accent text-xs text-white">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-medium text-white">{user.name}</span>
                <span className="truncate text-xs text-white/60">{user.email}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                try {
                  await ROLE_SERVICE[role].logout();
                } catch (e) {
                  console.error("Failed to log out:", e);
                }
                router.push(ROLE_LOGIN[role]);
              }}
            >
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
