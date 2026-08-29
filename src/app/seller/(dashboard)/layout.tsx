import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { SellerDroneRequestNotifier } from "@/components/seller/SellerDroneRequestNotifier";

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SellerDroneRequestNotifier />
      <AppSidebar role="seller" />
      <SidebarInset>
        <Topbar role="seller" />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
