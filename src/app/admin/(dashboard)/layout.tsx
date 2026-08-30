import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { AdminNotificationsProvider } from "@/components/admin/AdminNotificationsContext";
import { PendingDroneRequestsBanner } from "@/components/admin/PendingDroneRequestsBanner";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminNotificationsProvider>
      <SidebarProvider>
        <AppSidebar role="admin" />
        <SidebarInset>
          <Topbar role="admin" />
          <PendingDroneRequestsBanner />
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AdminNotificationsProvider>
  );
}
