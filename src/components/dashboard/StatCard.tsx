import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: "default" | "warning" | "danger";
}

const accentStyles = {
  default: "bg-orange-50 text-orange-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
};

export function StatCard({ label, value, icon: Icon, trend, accent = "default" }: StatCardProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-1.5 text-xs font-medium",
                trend.positive ? "text-emerald-600" : "text-red-600"
              )}
            >
              {trend.positive ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", accentStyles[accent])}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}
