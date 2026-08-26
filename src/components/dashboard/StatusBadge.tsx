import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Single source of truth for every status enum in the app (order/drone/
// seller/product/payout/assignment/admin-user) so the same status string
// always renders identically wherever it appears.
const STATUS_STYLES: Record<string, string> = {
  // orders
  pending: "bg-slate-100 text-slate-700",
  packed: "bg-blue-50 text-blue-700",
  ready_for_pickup: "bg-indigo-50 text-indigo-700",
  assigned: "bg-purple-50 text-purple-700",
  in_flight: "bg-amber-50 text-amber-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  // products
  draft: "bg-slate-100 text-slate-700",
  active: "bg-emerald-50 text-emerald-700",
  out_of_stock: "bg-amber-50 text-amber-700",
  suspended: "bg-red-50 text-red-700",
  // sellers / admin users
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  invited: "bg-blue-50 text-blue-700",
  disabled: "bg-slate-100 text-slate-700",
  // drones
  available: "bg-emerald-50 text-emerald-700",
  charging: "bg-blue-50 text-blue-700",
  maintenance: "bg-red-50 text-red-700",
  // assignments
  queued: "bg-slate-100 text-slate-700",
  // payouts
  processing: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  // drone requests
  fulfilled: "bg-emerald-100 text-emerald-800",
};

function toLabel(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-0 font-medium", STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700", className)}
    >
      {toLabel(status)}
    </Badge>
  );
}
