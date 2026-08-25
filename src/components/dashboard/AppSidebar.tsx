"use client";

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

const MOCK_USER = {
  seller: { name: "Jenna Torri", email: "jenna@torrihome.com", initials: "JT" },
  admin: { name: "Priya Shah", email: "priya.shah@smartlogix.com", initials: "PS" },
};

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const groups = role === "seller" ? sellerNavGroups : adminNavGroups;
  const badge = roleBadge[role];
  const user = MOCK_USER[role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={role === "seller" ? "/seller" : "/admin"} />}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/20">
                <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
                  <path
                    d="M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7l-9-5Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 12.2 11 14.7l4.5-5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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
