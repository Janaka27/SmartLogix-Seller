"use client";

import { DollarSign, TrendingUp, Clock } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { payouts } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/format";

const CURRENT_SELLER_ID = "sl-01";

export default function SellerEarningsPage() {
  const myPayouts = [...payouts]
    .filter((p) => p.sellerId === CURRENT_SELLER_ID)
    .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());

  const totalPaid = myPayouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.netPayout, 0);
  const pendingAmount = myPayouts
    .filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + p.netPayout, 0);
  const totalGross = myPayouts.reduce((sum, p) => sum + p.grossSales, 0);

  return (
    <div>
      <PageHeader title="Earnings & Payouts" description="Track your revenue and payout history." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Paid Out" value={formatCurrency(totalPaid)} icon={DollarSign} />
        <StatCard label="Pending Payout" value={formatCurrency(pendingAmount)} icon={Clock} accent="warning" />
        <StatCard label="Lifetime Gross Sales" value={formatCurrency(totalGross)} icon={TrendingUp} />
      </div>

      <div className="mt-6">
        {myPayouts.length === 0 ? (
          <EmptyState icon={DollarSign} title="No payouts yet" />
        ) : (
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Gross Sales</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Net Payout</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium text-foreground">
                      {formatDate(payout.periodStart)} – {formatDate(payout.periodEnd)}
                    </TableCell>
                    <TableCell>{formatCurrency(payout.grossSales)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      -{formatCurrency(payout.commissionFee)}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(payout.netPayout)}</TableCell>
                    <TableCell>
                      <StatusBadge status={payout.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payout.paidAt ? formatDate(payout.paidAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
