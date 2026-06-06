import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { CallGraphEntry } from "../types";
import {
  colorForContract,
  layoutCallGraph,
  NODE_DIMENSIONS,
  type CallGraphNodeData,
} from "../utils/layoutGraph";

interface CfgGraphProps {
  callGraph: Record<string, CallGraphEntry>;
  selectedFunction: string | null;
  onNodeClick: (signature: string) => void;
}

interface CallNodeRenderData extends CallGraphNodeData {
  selected?: boolean;
  faded?: boolean;
  highlighted?: boolean;
}

function CallNode({ data }: NodeProps<Node<CallNodeRenderData>>) {
  const accent = colorForContract(data.contract);
  const isSelected = !!data.selected;
  const isFaded = !!data.faded;
  const isHighlighted = !!data.highlighted;

  return (
    <div
      title={data.fullSignature}
      style={{
        width: NODE_DIMENSIONS.width,
        height: NODE_DIMENSIONS.height,
        opacity: isFaded ? 0.28 : 1,
        transition: "opacity 200ms ease, transform 200ms ease",
      }}
      className={`relative ${isSelected ? "analysis-node-selected" : ""}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: accent,
          width: 6,
          height: 6,
          border: "none",
          opacity: 0.7,
        }}
      />
      <div
        className="relative h-full w-full rounded-lg overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accent}26 0%, rgba(13,17,23,0.92) 65%)`,
          border: `1px solid ${
            isSelected ? accent : isHighlighted ? `${accent}aa` : `${accent}55`
          }`,
          boxShadow: isSelected
            ? `0 0 0 2px ${accent}66, 0 12px 28px -10px ${accent}cc`
            : isHighlighted
            ? `0 6px 18px -10px ${accent}aa`
            : "0 2px 6px -3px rgba(0,0,0,0.6)",
        }}
      >
        {/* Left accent stripe */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ background: accent }}
        />

        <div className="h-full w-full pl-3 pr-2.5 py-2 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-[9px] uppercase tracking-[0.18em] font-mono truncate"
              style={{ color: `${accent}` }}
            >
              {data.contract}
            </span>
            {data.isModifier && (
              <span className="ml-auto text-[8.5px] uppercase tracking-[0.16em] bg-amber-500/25 text-amber-200 border border-amber-300/30 rounded-sm px-1 py-[1px] font-mono shrink-0">
                mod
              </span>
            )}
          </div>
          <div className="text-[12.5px] font-mono text-white truncate leading-tight mt-0.5">
            {data.label}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: accent,
          width: 6,
          height: 6,
          border: "none",
          opacity: 0.7,
        }}
      />
    </div>
  );
}

const nodeTypes: NodeTypes = { callNode: CallNode };

function CfgGraphInner({
  callGraph,
  selectedFunction,
  onNodeClick,
}: CfgGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CallNodeRenderData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [direction, setDirection] = useState<"TB" | "LR">("TB");
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  // Compute layout when call graph or direction changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    layoutCallGraph(callGraph, direction)
      .then((res) => {
        if (cancelled) return;
        setEmpty(res.nodes.length === 0);
        setNodes(res.nodes as Node<CallNodeRenderData>[]);
        setEdges(res.edges);
      })
      .catch((err) => {
        // Layout error: surface as empty state.
        // eslint-disable-next-line no-console
        console.error("[CfgGraph] layout failed", err);
        if (cancelled) return;
        setNodes([]);
        setEdges([]);
        setEmpty(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [callGraph, direction, setNodes, setEdges]);

  // Compute neighbor highlighting set.
  const neighborSet = useMemo(() => {
    if (!selectedFunction) return null;
    const set = new Set<string>([selectedFunction]);
    const entry = callGraph[selectedFunction];
    if (entry) {
      entry.calls.forEach((c) => set.add(c));
      entry.called_by.forEach((c) => set.add(c));
    }
    return set;
  }, [selectedFunction, callGraph]);

  // Apply selection + highlight states without reflowing.
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => {
        const isSelected = selectedFunction === n.id;
        const inNeighbor = neighborSet ? neighborSet.has(n.id) : true;
        const faded = !!neighborSet && !inNeighbor;
        const highlighted =
          !!neighborSet && inNeighbor && !isSelected;
        return {
          ...n,
          data: {
            ...n.data,
            selected: isSelected,
            faded,
            highlighted,
          },
        };
      })
    );

    setEdges((prev) =>
      prev.map((e) => {
        if (!selectedFunction) {
          return {
            ...e,
            style: { stroke: "#6366f1", strokeWidth: 1.5, opacity: 0.45 },
            animated: false,
          };
        }
        const touches =
          e.source === selectedFunction || e.target === selectedFunction;
        return {
          ...e,
          animated: touches,
          style: {
            stroke: touches ? "#a5b4fc" : "#6366f1",
            strokeWidth: touches ? 2 : 1,
            opacity: touches ? 0.95 : 0.18,
          },
        };
      })
    );
  }, [selectedFunction, neighborSet, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_evt: React.MouseEvent, node: Node) => {
      onNodeClick(node.id);
    },
    [onNodeClick]
  );

  const minimapColor = useCallback((n: Node) => {
    const data = n.data as CallNodeRenderData;
    return colorForContract(data?.contract ?? "");
  }, []);

  return (
    <div className="analysis-codeviewer-wrap relative h-full w-full bg-[#070709] rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/[0.06] rounded-lg p-1 shadow-lg">
        <button
          type="button"
          onClick={() => setDirection("TB")}
          data-active={direction === "TB"}
          className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] rounded-md transition-colors data-[active=true]:bg-indigo-500/20 data-[active=true]:text-indigo-200 data-[active=true]:border-indigo-400/40 border border-transparent text-zinc-400 hover:text-zinc-100"
        >
          ↓ TB
        </button>
        <button
          type="button"
          onClick={() => setDirection("LR")}
          data-active={direction === "LR"}
          className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] rounded-md transition-colors data-[active=true]:bg-indigo-500/20 data-[active=true]:text-indigo-200 data-[active=true]:border-indigo-400/40 border border-transparent text-zinc-400 hover:text-zinc-100"
        >
          → LR
        </button>
      </div>

      {/* Stat banner (top-right) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/[0.06] rounded-lg px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-mono">
        <span>
          <span className="text-zinc-300">{nodes.length}</span> nodes
        </span>
        <span className="text-zinc-700">·</span>
        <span>
          <span className="text-zinc-300">{edges.length}</span> edges
        </span>
      </div>

      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm pointer-events-none">
          <span className="analysis-loader" />
          <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 font-mono">
            Laying out graph…
          </span>
        </div>
      )}

      {!loading && empty && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <div className="analysis-empty-glyph">→</div>
          <div className="text-[12px] font-mono">No call relations to render.</div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.4 }}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="rgba(255,255,255,0.08)"
        />
        <Controls
          showInteractive={false}
          style={{
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "10px",
            backdropFilter: "blur(8px)",
            overflow: "hidden",
          }}
        />
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          nodeColor={minimapColor}
          nodeBorderRadius={6}
          maskColor="rgba(0,0,0,0.65)"
          style={{
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        />
      </ReactFlow>
    </div>
  );
}

export default function CfgGraph(props: CfgGraphProps) {
  return (
    <ReactFlowProvider>
      <CfgGraphInner {...props} />
    </ReactFlowProvider>
  );
}
