"use client";

import { useState } from "react";
import { Play, Boxes, Plane, Route as RouteIcon, Layers } from "lucide-react";
import { Line, LineChart, CartesianGrid, XAxis } from "recharts";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { GraphCanvas } from "@/components/algorithms/GraphCanvas";
import {
  runKnapsack,
  runSimulatedAnnealing,
  runMultiDroneBatching,
  BATCHING_DEPOT,
  BATCHING_ORDERS,
  BATCHING_DRONE_CAPACITY,
  type KnapsackResult,
  type TourResult,
  type MultiDroneBatchingResult,
} from "@/lib/algorithms";
import { formatWeight, formatVolume, formatDistance } from "@/lib/format";
import type { GraphNode, GraphEdge } from "@/lib/algorithms/types";

const chartConfig = {
  cost: { label: "Best distance (km)", color: "var(--color-orange-500)" },
} satisfies ChartConfig;

// Cycled per drone index so an arbitrary fleet size always gets a distinct tour color.
const DRONE_COLORS = [
  "#f97316", // orange-500
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#a855f7", // purple-500
  "#ef4444", // red-500
  "#0ea5e9", // sky-500
];

function droneColor(index: number) {
  return DRONE_COLORS[index % DRONE_COLORS.length];
}

function MultiDroneBatchingConsole() {
  const [result, setResult] = useState<MultiDroneBatchingResult | null>(null);

  const runBatching = () => {
    setResult(runMultiDroneBatching(BATCHING_DEPOT, BATCHING_ORDERS, BATCHING_DRONE_CAPACITY));
  };

  const graphNodes: GraphNode[] = [
    { id: BATCHING_DEPOT.id, label: BATCHING_DEPOT.label, x: BATCHING_DEPOT.x * 20, y: BATCHING_DEPOT.y * 20, type: "warehouse" },
    ...BATCHING_ORDERS.map((o) => {
      const batchIdx = result?.batches.findIndex((b) => b.stops.some((s) => s.id === o.id)) ?? -1;
      return {
        id: o.id,
        label: o.label,
        x: o.x * 20,
        y: o.y * 20,
        type: "delivery_zone" as const,
        color: batchIdx >= 0 ? droneColor(batchIdx) : undefined,
      };
    }),
  ];
  const nodeById = new Map(graphNodes.map((n) => [n.id, n]));

  const graphEdges: GraphEdge[] = (result?.batches ?? []).flatMap((batch) => {
    const color = droneColor(batch.droneIndex);
    return batch.stopIds.slice(0, -1).map((from, i) => {
      const to = batch.stopIds[i + 1];
      const a = nodeById.get(from)!;
      const b = nodeById.get(to)!;
      return { from, to, weight: Number((Math.hypot(a.x - b.x, a.y - b.y) / 20).toFixed(1)), color };
    });
  });

  const activeNodeIds = (result?.batches ?? []).flatMap((b) => b.stopIds);

  const avgUtilization = result && result.batches.length > 0
    ? Number(
        (
          result.batches.reduce((s, b) => s + (b.weightUtilizationPct + b.volumeUtilizationPct) / 2, 0) /
          result.batches.length
        ).toFixed(1)
      )
    : 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Clusters today&apos;s full queue into 2-4 stop flights (sweep by bearing from the depot, capped by
          drone weight/volume), then sequences each flight&apos;s closed loop with Simulated Annealing.
        </p>
        <Button onClick={runBatching}>
          <Play /> Run Multi-Drone Batch
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Fleet Tours</CardTitle>
            <CardDescription>Each color is one drone&apos;s closed-loop flight, depot to depot.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full rounded-lg bg-muted/30">
              <GraphCanvas nodes={graphNodes} edges={graphEdges} activeNodeIds={activeNodeIds} />
            </div>
            {result && result.batches.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {result.batches.map((batch) => (
                  <div key={batch.droneIndex} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: droneColor(batch.droneIndex) }}
                    />
                    Drone {batch.droneIndex + 1}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Batch Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Drones dispatched</p>
                    <p className="text-lg font-semibold text-foreground">{result.totalDrones}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Orders batched</p>
                    <p className="text-lg font-semibold text-foreground">{result.totalOrders}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Combined distance</p>
                    <p className="text-lg font-semibold text-foreground">{formatDistance(result.totalDistanceKm)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Avg. capacity used</p>
                    <p className="text-lg font-semibold text-foreground">{avgUtilization}%</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Layers className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Run the batch to cluster today&apos;s queue across the fleet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {result?.batches.map((batch) => (
            <Card key={batch.droneIndex} className="shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: droneColor(batch.droneIndex) }}
                  >
                    <Plane className="h-3.5 w-3.5" />
                  </span>
                  <CardTitle className="text-sm">Drone {batch.droneIndex + 1}</CardTitle>
                </div>
                <CardDescription>
                  {batch.stops.length} stop{batch.stops.length !== 1 ? "s" : ""} · {batch.tour.totalDistanceKm} km closed loop
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {batch.stops.map((s) => (
                    <Badge key={s.id} variant="secondary" className="border-0 bg-orange-50 text-orange-700">
                      {s.label}
                    </Badge>
                  ))}
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Weight</span>
                    <span>
                      {formatWeight(batch.totalWeightKg)} / {formatWeight(BATCHING_DRONE_CAPACITY.maxWeightKg)}
                    </span>
                  </div>
                  <Progress value={batch.weightUtilizationPct} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Volume</span>
                    <span>
                      {formatVolume(batch.totalVolumeCm3)} / {formatVolume(BATCHING_DRONE_CAPACITY.maxVolumeCm3)}
                    </span>
                  </div>
                  <Progress value={batch.volumeUtilizationPct} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function SingleDroneBatchingConsole() {
  const [selection, setSelection] = useState<KnapsackResult | null>(null);
  const [tour, setTour] = useState<TourResult | null>(null);

  const runSelection = () => {
    const result = runKnapsack(
      BATCHING_ORDERS,
      BATCHING_DRONE_CAPACITY.maxWeightKg,
      BATCHING_DRONE_CAPACITY.maxVolumeCm3
    );
    setSelection(result);
    setTour(null);
  };

  const runSequencing = () => {
    if (!selection) return;
    const stops = BATCHING_ORDERS.filter((o) => selection.selectedIds.includes(o.id));
    setTour(runSimulatedAnnealing(BATCHING_DEPOT, stops));
  };

  const selectedOrders = selection
    ? BATCHING_ORDERS.filter((o) => selection.selectedIds.includes(o.id))
    : [];

  const graphNodes: GraphNode[] = [
    { id: BATCHING_DEPOT.id, label: BATCHING_DEPOT.label, x: BATCHING_DEPOT.x * 20, y: BATCHING_DEPOT.y * 20, type: "warehouse" },
    ...BATCHING_ORDERS.map((o) => ({
      id: o.id,
      label: o.label,
      x: o.x * 20,
      y: o.y * 20,
      type: "delivery_zone" as const,
    })),
  ];

  const tourPath = tour ? [BATCHING_DEPOT.id, ...tour.order, BATCHING_DEPOT.id] : undefined;
  const tourEdges = tourPath
    ? tourPath.slice(0, -1).map((from, i) => {
        const to = tourPath[i + 1];
        const a = graphNodes.find((n) => n.id === from)!;
        const b = graphNodes.find((n) => n.id === to)!;
        return { from, to, weight: Number((Math.hypot(a.x - b.x, a.y - b.y) / 20).toFixed(1)) };
      })
    : [];

  const chartData = tour?.costHistory.map((cost, i) => ({ step: i, cost })) ?? [];

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Step 1: select which of today&apos;s orders fit on one drone (constrained knapsack). Step 2: sequence the
        delivery tour (simulated annealing).
      </p>

      <div className="mb-4 flex flex-wrap gap-3">
        <Button onClick={runSelection}>
          <Play /> Run Order Selection
        </Button>
        <Button variant="outline" onClick={runSequencing} disabled={!selection || selection.selectedIds.length === 0}>
          <Play /> Sequence Tour
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s Queue</CardTitle>
            <CardDescription>Depot-relative delivery map — highlighted stops are loaded onto the drone.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full rounded-lg bg-muted/30">
              <GraphCanvas
                nodes={graphNodes}
                edges={tourEdges}
                highlightedPath={tourPath}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Capacity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selection ? (
                <>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Weight</span>
                      <span>
                        {selection.totalWeightKg} / {BATCHING_DRONE_CAPACITY.maxWeightKg} kg
                      </span>
                    </div>
                    <Progress value={(selection.totalWeightKg / BATCHING_DRONE_CAPACITY.maxWeightKg) * 100} />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Volume</span>
                      <span>
                        {selection.totalVolumeCm3.toLocaleString()} / {BATCHING_DRONE_CAPACITY.maxVolumeCm3.toLocaleString()} cm³
                      </span>
                    </div>
                    <Progress value={(selection.totalVolumeCm3 / BATCHING_DRONE_CAPACITY.maxVolumeCm3) * 100} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Order value loaded</p>
                    <p className="text-lg font-semibold text-foreground">${selection.totalValue.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOrders.map((o) => (
                      <Badge key={o.id} variant="secondary" className="border-0 bg-orange-50 text-orange-700">
                        {o.label}
                      </Badge>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Boxes className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Run order selection to see capacity usage.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {tour && (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Tour Result</CardTitle>
                <CardDescription>
                  {tour.totalDistanceKm} km closed loop · {tour.executionTimeMs}ms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-32 w-full">
                  <LineChart data={chartData} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="step" hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line dataKey="cost" type="monotone" stroke="var(--color-cost)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminBatchingPage() {
  return (
    <div>
      <PageHeader
        title="Delivery Batching Console"
        description="Batch today's queued orders onto drone flights and sequence each flight's delivery tour."
      />

      <Tabs defaultValue="multi-drone">
        <TabsList>
          <TabsTrigger value="multi-drone">
            <Layers /> Multi-Drone Batching
          </TabsTrigger>
          <TabsTrigger value="single-drone">
            <RouteIcon /> Single Drone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="multi-drone">
          <MultiDroneBatchingConsole />
        </TabsContent>
        <TabsContent value="single-drone">
          <SingleDroneBatchingConsole />
        </TabsContent>
      </Tabs>
    </div>
  );
}
