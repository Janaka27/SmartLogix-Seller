"use client";

import { useState } from "react";
import { Play, Route as RouteIcon } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GraphCanvas } from "@/components/algorithms/GraphCanvas";
import {
  runDijkstra,
  runAStar,
  runBellmanFord,
  ROUTE_NODES,
  ROUTE_EDGES,
  type PathResult,
} from "@/lib/algorithms";

export default function AdminRoutesPage() {
  const [sourceId, setSourceId] = useState("wh-01");
  const [targetId, setTargetId] = useState("dz-06");
  const [results, setResults] = useState<PathResult[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const run = () => {
    const dijkstra = runDijkstra(ROUTE_NODES, ROUTE_EDGES, sourceId, targetId);
    const aStar = runAStar(ROUTE_NODES, ROUTE_EDGES, sourceId, targetId);
    const bellmanFord = runBellmanFord(ROUTE_NODES, ROUTE_EDGES, sourceId, targetId);
    setResults([dijkstra, aStar, bellmanFord]);
    setActiveIndex(0);
  };

  const active = results?.[activeIndex];

  return (
    <div>
      <PageHeader
        title="Route Optimization Console"
        description="Compare Dijkstra, A*, and Bellman-Ford between any two points in the flight network."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">From</p>
          <Select value={sourceId} onValueChange={(v) => v && setSourceId(v)}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROUTE_NODES.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">To</p>
          <Select value={targetId} onValueChange={(v) => v && setTargetId(v)}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROUTE_NODES.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={run} disabled={sourceId === targetId}>
          <Play /> Run Comparison
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Flight Network</CardTitle>
            <CardDescription>
              Dashed edges indicate a no-fly-zone penalty. Highlighted path: {active?.algorithm ?? "none yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full rounded-lg bg-muted/30">
              <GraphCanvas nodes={ROUTE_NODES} edges={ROUTE_EDGES} highlightedPath={active?.path} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {!results ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <RouteIcon className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Pick two points and run the comparison.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Algorithm</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => (
                    <TableRow
                      key={r.algorithm}
                      className="cursor-pointer"
                      data-active={i === activeIndex}
                      onClick={() => setActiveIndex(i)}
                    >
                      <TableCell
                        className={i === activeIndex ? "font-semibold text-orange-600" : "text-foreground"}
                      >
                        {r.algorithm}
                      </TableCell>
                      <TableCell>{r.found ? `${r.totalDistanceKm} km` : "No path"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.executionTimeMs}ms</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
