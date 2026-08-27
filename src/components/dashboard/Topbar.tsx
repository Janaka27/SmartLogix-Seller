"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";

interface TopbarProps {
  role: "seller" | "admin";
}

import { useEffect, useState } from "react";
import { SellerService } from "@/server/services/seller.service";
import { AdminService } from "@/server/services/admin.service";
import { createClient } from "@/lib/supabase";

const SEGMENT_OVERRIDES: Record<string, string> = { cms: "CMS" };

function titleCase(segment: string) {
  return segment
    .split("-")
    .map((word) => SEGMENT_OVERRIDES[word] ?? word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function Topbar({ role }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const rootLabel = role === "seller" ? "Seller Portal" : "Admin Panel";
  const rootHref = role === "seller" ? "/seller" : "/admin";

  const [userInitials, setUserInitials] = useState(role === "seller" ? "JT" : "PS");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const service = role === "seller" ? SellerService : AdminService;
        const authUser = await service.getUser();
        if (authUser) {
          const supabase = createClient();
          const { data } = await supabase.from('profiles').select('full_name').eq('id', authUser.id).single();
          const defaultName = role === "seller" ? "Seller" : "Admin";
          const name = data?.full_name || authUser.email?.split('@')[0] || defaultName;
          setUserInitials(name.substring(0, 2).toUpperCase());
        }
      } catch (e) {
        console.error("Failed to fetch user profile", e);
      }
    };
    fetchUser();
  }, [role]);

  const segments = pathname
    .replace(rootHref, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => titleCase(segment));

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-5" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={rootHref} />}>{rootLabel}</BreadcrumbLink>
            </BreadcrumbItem>
            {segments.map((segment, i) => (
              <span key={segment} className="flex items-center gap-1.5">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {i === segments.length - 1 ? (
                    <BreadcrumbPage>{segment}</BreadcrumbPage>
                  ) : (
                    segment
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-block">
          Demo mode — changes aren&apos;t saved
        </span>
        {role === "admin" ? (
          <AdminNotificationBell />
        ) : (
          <Button variant="ghost" size="icon-sm" aria-label="Notifications">
            <Bell />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 outline-none hover:bg-muted">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-slate-900 text-xs text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                try {
                  const service = role === "seller" ? SellerService : AdminService;
                  await service.logout();
                } catch (e) {
                  console.error("Failed to log out:", e);
                }
                router.push(role === "seller" ? "/seller/login" : "/admin/login");
              }}
            >
              <LogOut /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
