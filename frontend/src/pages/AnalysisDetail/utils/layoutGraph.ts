import ELK from "elkjs/lib/elk.bundled.js";
import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { CallGraphEntry } from "../types";

export interface CallGraphNodeData extends Record<string, unknown> {
  label: string;
  contract: string;
  fullSignature: string;
  isModifier: boolean;
}

export interface CallGraphEdgeData extends Record<string, unknown> {
  sourceContract: string;
}

export interface LayoutResult {
  nodes: Node<CallGraphNodeData>[];
  edges: Edge<CallGraphEdgeData>[];
}

const NODE_WIDTH = 218;
const NODE_HEIGHT = 62;

const BASE_EDGE_INK = "#3d3833";

export const EDGE_INK = BASE_EDGE_INK;

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
      "elk.layered.spacing.nodeNodeBetweenLayers": "110",
      "elk.spacing.nodeNode": "54",
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

  const flowEdges: Edge<CallGraphEdgeData>[] = elkEdges.map((e) => {
    const source = e.sources[0];
    const sourceEntry = callGraph[source];
    const sourceContract = sourceEntry?.contract ?? "Unknown";
    return {
      id: e.id,
      source,
      target: e.targets[0],
      type: "default", // bezier
      animated: false,
      data: { sourceContract },
      style: { stroke: BASE_EDGE_INK, strokeWidth: 1.4, opacity: 0.32 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: BASE_EDGE_INK,
        width: 16,
        height: 16,
      },
    } as Edge<CallGraphEdgeData>;
  });

  return { nodes: positionedNodes, edges: flowEdges };
}

// Deterministic contract-color mapping — saturated mid-dark hues that
// sit beautifully on warm paper (#f7f3e8). Avoid pastels.
const CONTRACT_PALETTE = [
  "#1f4f8b", // deep azure
  "#0f7a55", // forest emerald
  "#a4541a", // burnt amber
  "#a52a3a", // rust crimson
  "#5a3aa8", // royal violet
  "#136d83", // teal ink
  "#a32d6f", // magenta plum
  "#5d6e1a", // olive moss
  "#7a4b15", // walnut
  "#2d5e6f", // slate ocean
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
