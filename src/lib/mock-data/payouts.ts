import type { Payout } from "@/lib/types";

export const payouts: Payout[] = [
  { id: "py-01", sellerId: "sl-01", periodStart: "2026-07-01", periodEnd: "2026-07-15", grossSales: 1240.5, commissionFee: 148.86, netPayout: 1091.64, status: "paid", paidAt: "2026-07-18T09:00:00Z" },
  { id: "py-02", sellerId: "sl-02", periodStart: "2026-07-01", periodEnd: "2026-07-15", grossSales: 890.0, commissionFee: 106.8, netPayout: 783.2, status: "paid", paidAt: "2026-07-18T09:00:00Z" },
  { id: "py-03", sellerId: "sl-03", periodStart: "2026-07-01", periodEnd: "2026-07-15", grossSales: 1560.0, commissionFee: 187.2, netPayout: 1372.8, status: "paid", paidAt: "2026-07-18T09:00:00Z" },
  { id: "py-04", sellerId: "sl-04", periodStart: "2026-07-01", periodEnd: "2026-07-15", grossSales: 420.0, commissionFee: 50.4, netPayout: 369.6, status: "paid", paidAt: "2026-07-18T09:00:00Z" },
  { id: "py-05", sellerId: "sl-05", periodStart: "2026-07-01", periodEnd: "2026-07-15", grossSales: 675.0, commissionFee: 81.0, netPayout: 594.0, status: "paid", paidAt: "2026-07-18T09:00:00Z" },
  { id: "py-06", sellerId: "sl-06", periodStart: "2026-07-01", periodEnd: "2026-07-15", grossSales: 2100.0, commissionFee: 252.0, netPayout: 1848.0, status: "paid", paidAt: "2026-07-18T09:00:00Z" },
  { id: "py-07", sellerId: "sl-01", periodStart: "2026-07-16", periodEnd: "2026-07-31", grossSales: 1380.25, commissionFee: 165.63, netPayout: 1214.62, status: "paid", paidAt: "2026-08-03T09:00:00Z" },
  { id: "py-08", sellerId: "sl-02", periodStart: "2026-07-16", periodEnd: "2026-07-31", grossSales: 950.0, commissionFee: 114.0, netPayout: 836.0, status: "paid", paidAt: "2026-08-03T09:00:00Z" },
  { id: "py-09", sellerId: "sl-03", periodStart: "2026-07-16", periodEnd: "2026-07-31", grossSales: 1720.0, commissionFee: 206.4, netPayout: 1513.6, status: "paid", paidAt: "2026-08-03T09:00:00Z" },
  { id: "py-10", sellerId: "sl-07", periodStart: "2026-07-16", periodEnd: "2026-07-31", grossSales: 540.0, commissionFee: 64.8, netPayout: 475.2, status: "paid", paidAt: "2026-08-03T09:00:00Z" },
  { id: "py-11", sellerId: "sl-01", periodStart: "2026-08-01", periodEnd: "2026-08-15", grossSales: 990.0, commissionFee: 118.8, netPayout: 871.2, status: "processing" },
  { id: "py-12", sellerId: "sl-02", periodStart: "2026-08-01", periodEnd: "2026-08-15", grossSales: 610.0, commissionFee: 73.2, netPayout: 536.8, status: "processing" },
];
