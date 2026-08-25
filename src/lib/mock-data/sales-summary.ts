export interface SalesSummaryPoint {
  date: string; // "Aug 12" style label
  sales: number;
}

// Hand-authored 14-day trend for the seller dashboard home chart.
export const salesSummary: SalesSummaryPoint[] = [
  { date: "Aug 12", sales: 420 },
  { date: "Aug 13", sales: 510 },
  { date: "Aug 14", sales: 380 },
  { date: "Aug 15", sales: 690 },
  { date: "Aug 16", sales: 610 },
  { date: "Aug 17", sales: 340 },
  { date: "Aug 18", sales: 290 },
  { date: "Aug 19", sales: 560 },
  { date: "Aug 20", sales: 720 },
  { date: "Aug 21", sales: 640 },
  { date: "Aug 22", sales: 810 },
  { date: "Aug 23", sales: 730 },
  { date: "Aug 24", sales: 890 },
  { date: "Aug 25", sales: 640 },
];
