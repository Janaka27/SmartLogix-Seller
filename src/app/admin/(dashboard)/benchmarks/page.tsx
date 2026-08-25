"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { benchmarkLogs } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/format";
import type { BenchmarkAlgorithm } from "@/lib/types";

const ALGO_LABELS: Record<BenchmarkAlgorithm, string> = {
  dijkstra: "Dijkstra",
  a_star: "A*",
  bellman_ford: "Bellman-Ford",
  prim: "Prim's MST",
  knapsack: "Knapsack",
  simulated_annealing: "Simulated Annealing",
  decision_tree: "Decision Tree",
};

const chartConfig = {
  avgMs: { label: "Avg execution time (ms)", color: "var(--color-orange-500)" },
} satisfies ChartConfig;

export default function AdminBenchmarksPage() {
  const byAlgorithm = (Object.keys(ALGO_LABELS) as BenchmarkAlgorithm[]).map((algorithm) => {
    const runs = benchmarkLogs.filter((l) => l.algorithm === algorithm);
    const avgMs = runs.reduce((sum, r) => sum + r.executionTimeMs, 0) / runs.length;
    const successRate = (runs.filter((r) => r.success).length / runs.length) * 100;
    return {
      algorithm,
      label: ALGO_LABELS[algorithm],
      avgMs: Number(avgMs.toFixed(2)),
      successRate: Math.round(successRate),
      runs: runs.length,
    };
  });

  const recentRuns = [...benchmarkLogs]
    .sort((a, b) => new Date(b.runAt).getTime() - new Date(a.runAt).getTime())
    .slice(0, 12);

  return (
    <div>
      <PageHeader
        title="Benchmark & Evaluation Dashboard"
        description="Execution time and success rate across every algorithm run, logged to benchmark_logs."
      />

      <Card className="mb-4 shadow-none">
        <CardHeader>
          <CardTitle>Average Execution Time by Algorithm</CardTitle>
          <CardDescription>{benchmarkLogs.length} total runs logged</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <BarChart data={byAlgorithm} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="avgMs" fill="var(--color-avgMs)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        {byAlgorithm.map((a) => (
          <Card key={a.algorithm} className="shadow-none">
            <CardContent>
              <p className="truncate text-xs text-muted-foreground">{a.label}</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{a.avgMs}ms</p>
              <p className="text-xs text-muted-foreground">{a.successRate}% success</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4 shadow-none">
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Algorithm</TableHead>
                <TableHead>Input Size</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Ran At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium text-foreground">{ALGO_LABELS[run.algorithm]}</TableCell>
                  <TableCell>{run.inputSizeN}</TableCell>
                  <TableCell>{run.executionTimeMs}ms</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{run.resultSummary}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(run.runAt)}</TableCell>
                  <TableCell>
                    {run.success ? (
                      <Badge variant="secondary" className="border-0 bg-emerald-50 text-emerald-700">
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="border-0 bg-red-50 text-red-700">
                        Did not converge
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
