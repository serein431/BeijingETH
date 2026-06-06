import ELK from "elkjs/lib/elk.bundled.js";
import type { Edge, Node } from "@xyflow/react";
import type { CallGraphEntry } from "../types";

export interface CallGraphNodeData extends Record<string, unknown> {
  label: string;
  contract: string;
  fullSignature: string;
  isModifier: boolean;
}

export interface LayoutResult {
  nodes: Node<CallGraphNodeData>[];
  edges: Edge[];
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

const elk = new ELK();

export async function layoutCallGraph(
  callGraph: Record<string, CallGraphEntry>,
  direction: "TB" | "LR" = "TB"
): Promise<LayoutResult> {
  const entries = Object.values(callGraph);
  if (entries.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodeIds = new Set(entries.map((e) => e.signature));

  const elkNodes = entries.map((entry) => ({
    id: entry.signature,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  }));

  const edgeSet = new Map<string, { source: string; target: string }>();
  for (const entry of entries) {
    for (const callee of entry.calls) {
      if (!nodeIds.has(callee)) continue;
      const id = `${entry.signature}__${callee}`;
      if (!edgeSet.has(id)) {
        edgeSet.set(id, { source: entry.signature, target: callee });
      }
    }
  }

  const elkEdges = Array.from(edgeSet.entries()).map(([id, e]) => ({
    id,
    sources: [e.source],
    targets: [e.target],
  }));

  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction === "TB" ? "DOWN" : "RIGHT",
      "elk.layered.spacing.nodeNodeBetweenLayers": "100",
      "elk.spacing.nodeNode": "60",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.crossingMinimization.semiInteractive": "true",
      "elk.edgeRouting": "ORTHOGONAL",
    },
    children: elkNodes,
    edges: elkEdges,
  };

  const layout = await elk.layout(elkGraph);

  const positionedNodes: Node<CallGraphNodeData>[] = (layout.children ?? []).map(
    (n) => {
      const entry = callGraph[n.id!];
      return {
        id: n.id!,
        type: "callNode",
        position: { x: n.x ?? 0, y: n.y ?? 0 },
        data: {
          label: entry?.full_name ?? entry?.function ?? n.id!,
          contract: entry?.contract ?? "Unknown",
          fullSignature: entry?.signature ?? n.id!,
          isModifier: !!entry?.is_modifier,
        },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      } as Node<CallGraphNodeData>;
    }
  );

  const flowEdges: Edge[] = elkEdges.map((e) => ({
    id: e.id,
    source: e.sources[0],
    target: e.targets[0],
    animated: false,
    style: { stroke: "#6366f1", strokeWidth: 1.5, opacity: 0.55 },
  }));

  return { nodes: positionedNodes, edges: flowEdges };
}

// Deterministic contract-color mapping.
const CONTRACT_PALETTE = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // rose
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function colorForContract(contract: string): string {
  if (!contract) return CONTRACT_PALETTE[0];
  return CONTRACT_PALETTE[hashString(contract) % CONTRACT_PALETTE.length];
}

export const NODE_DIMENSIONS = {
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
};
