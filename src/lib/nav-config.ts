import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Warehouse,
  Package,
  ClipboardList,
  Wallet,
  Store,
  Users,
  Drone as DroneIcon,
  Network,
  Route,
  Boxes,
  GitBranch,
  BarChart3,
  FileEdit,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const sellerNavGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { title: "Dashboard", href: "/seller", icon: LayoutDashboard },
      { title: "Inventory", href: "/seller/inventory", icon: Package },
      { title: "Orders", href: "/seller/orders", icon: ClipboardList },
      { title: "Drone Fleet", href: "/seller/drones", icon: DroneIcon },
      { title: "Earnings", href: "/seller/earnings", icon: Wallet },
      { title: "Store Settings", href: "/seller/settings", icon: Store },
    ],
  },
];

export const adminNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Management",
    items: [
      { title: "Sellers", href: "/admin/sellers", icon: Store },
      { title: "Products", href: "/admin/products", icon: Package },
      { title: "Warehouses", href: "/admin/warehouses", icon: Warehouse },
      { title: "Drone Fleet", href: "/admin/drones", icon: DroneIcon },
      { title: "Users & Roles", href: "/admin/users", icon: Users },
    ],
  },
  {
    label: "Algorithms",
    items: [
      { title: "Network Analysis", href: "/admin/network", icon: Network },
      { title: "Route Optimization", href: "/admin/routes", icon: Route },
      { title: "Delivery Batching", href: "/admin/batching", icon: Boxes },
      { title: "Decision Module", href: "/admin/decision", icon: GitBranch },
    ],
  },
  {
    label: "Insights",
    items: [{ title: "Benchmarks", href: "/admin/benchmarks", icon: BarChart3 }],
  },
  {
    label: "Content",
    items: [{ title: "Landing Page CMS", href: "/admin/cms", icon: FileEdit }],
  },
];

export const roleBadge = {
  seller: { label: "Seller", className: "bg-slate-800 text-white" },
  admin: { label: "Admin", className: "bg-orange-500 text-white" },
};
