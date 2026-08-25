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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { sellerNavGroups, adminNavGroups, roleBadge } from "@/lib/nav-config";

interface AppSidebarProps {
  role: "seller" | "admin";
}

import { useEffect, useState } from "react";
import { SellerService } from "@/server/services/seller.service";
import { createClient } from "@/lib/supabase";

const MOCK_USER = {
  seller: { name: "Jenna Torri", email: "jenna@torrihome.com", initials: "JT" },
  admin: { name: "Priya Shah", email: "priya.shah@smartlogix.com", initials: "PS" },
};

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const groups = role === "seller" ? sellerNavGroups : adminNavGroups;
  const badge = roleBadge[role];
  const [user, setUser] = useState(MOCK_USER[role]);

  useEffect(() => {
    if (role === "seller") {
      const fetchUser = async () => {
        try {
          const authUser = await SellerService.getUser();
          if (authUser) {
            const supabase = createClient();
            const { data } = await supabase.from('profiles').select('full_name').eq('id', authUser.id).single();
            const name = data?.full_name || authUser.email?.split('@')[0] || "Seller";
            const initials = name.substring(0, 2).toUpperCase();
            setUser({ name, email: authUser.email || "", initials });
          }
        } catch (e) {
          console.error("Failed to fetch user profile", e);
        }
      };
      fetchUser();
    }
  }, [role]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={role === "seller" ? "/seller" : "/admin"} />}>
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
                    item.href === "/seller" || item.href === "/admin"
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
              onClick={() => router.push(role === "seller" ? "/seller/login" : "/admin/login")}
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
