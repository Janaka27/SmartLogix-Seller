import type { GraphEdge, GraphNode } from "@/lib/algorithms/types";
import { cn } from "@/lib/utils";

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightedPath?: string[];
  highlightedEdges?: GraphEdge[];
  /** Extra node ids to render at "on path" size — for multi-tour views where each tour supplies its own edge colors instead of a single highlightedPath. */
  activeNodeIds?: string[];
  className?: string;
}

const NODE_COLORS: Record<GraphNode["type"], string> = {
  warehouse: "fill-slate-700 stroke-slate-900",
  charging_station: "fill-orange-500 stroke-orange-700",
  relay: "fill-blue-500 stroke-blue-700",
  delivery_zone: "fill-slate-300 stroke-slate-500",
};

function edgeKey(a: string, b: string) {
  return [a, b].sort().join("::");
}

export function GraphCanvas({
  nodes,
  edges,
  highlightedPath,
  highlightedEdges,
  activeNodeIds,
  className,
}: GraphCanvasProps) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const pathEdgeKeys = new Set<string>();
  if (highlightedPath) {
    for (let i = 0; i < highlightedPath.length - 1; i++) {
      pathEdgeKeys.add(edgeKey(highlightedPath[i], highlightedPath[i + 1]));
    }
  }
  const highlightKeys = new Set(
    (highlightedEdges ?? []).map((e) => edgeKey(e.from, e.to))
  );

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs) - 30;
  const maxX = Math.max(...xs) + 30;
  const minY = Math.min(...ys) - 30;
  const maxY = Math.max(...ys) + 30;

  return (
    <svg
      viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      className={cn("h-full w-full", className)}
    >
      {edges.map((edge) => {
        const from = byId.get(edge.from);
        const to = byId.get(edge.to);
        if (!from || !to) return null;
        const key = edgeKey(edge.from, edge.to);
        const isHighlighted = pathEdgeKeys.has(key) || highlightKeys.has(key);
        return (
          <g key={key}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className={edge.color ? undefined : isHighlighted ? "stroke-orange-500" : "stroke-slate-200"}
              style={edge.color ? { stroke: edge.color } : undefined}
              strokeWidth={edge.color || isHighlighted ? 3 : 1.5}
              strokeDasharray={edge.noFlyPenalty ? "4 3" : undefined}
            />
            <text
              x={(from.x + to.x) / 2}
              y={(from.y + to.y) / 2 - 4}
              textAnchor="middle"
              className={cn(
                "text-[9px]",
                !edge.color && (isHighlighted ? "fill-orange-700 font-semibold" : "fill-slate-400")
              )}
              style={edge.color ? { fill: edge.color, fontWeight: 600 } : undefined}
            >
              {edge.weight}
            </text>
          </g>
        );
      })}

      {nodes.map((node) => {
        const isOnPath = highlightedPath?.includes(node.id) || activeNodeIds?.includes(node.id);
        return (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={isOnPath ? 9 : 7}
              strokeWidth={2}
              className={cn(!node.color && NODE_COLORS[node.type], !node.color && isOnPath && "stroke-orange-600")}
              style={node.color ? { fill: node.color, stroke: node.color } : undefined}
            />
            <text
              x={node.x}
              y={node.y - 12}
              textAnchor="middle"
              className="fill-foreground text-[10px] font-medium"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
