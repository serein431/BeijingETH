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
  EDGE_INK,
  layoutCallGraph,
  NODE_DIMENSIONS,
  type CallGraphEdgeData,
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

/* ============================================================
 * Custom node — "manuscript card" suited to warm paper theme.
 * Paper white surface, contract-color top stripe + left rail,
 * mono SMALL CAPS contract label above the function signature.
 * ============================================================ */
function CallNode({ data }: NodeProps<Node<CallNodeRenderData>>) {
  const accent = colorForContract(data.contract);
  const isSelected = !!data.selected;
  const isFaded = !!data.faded;
  const isHighlighted = !!data.highlighted;

  const stateAttr = isSelected
    ? "selected"
    : isHighlighted
    ? "highlighted"
    : isFaded
    ? "faded"
    : "idle";

  return (
    <div
      title={data.fullSignature}
      className="analysis-cgnode"
      data-state={stateAttr}
      data-modifier={data.isModifier ? "true" : "false"}
      style={
        {
          width: NODE_DIMENSIONS.width,
          height: NODE_DIMENSIONS.height,
          ["--accent" as string]: accent,
        } as React.CSSProperties
      }
    >
      <Handle
        type="target"
        position={Position.Top}
        className="analysis-cgnode__handle"
      />
      <div className="analysis-cgnode__card">
        <span className="analysis-cgnode__stripe" aria-hidden />
        <span className="analysis-cgnode__rail" aria-hidden />
        <div className="analysis-cgnode__body">
          <div className="analysis-cgnode__meta">
            <span className="analysis-cgnode__contract" title={data.contract}>
              {data.contract}
            </span>
            {data.isModifier && (
              <span className="analysis-cgnode__badge" title="modifier">
                <span className="analysis-cgnode__badge-glyph">◆</span>
                mod
              </span>
            )}
          </div>
          <div className="analysis-cgnode__name" title={data.fullSignature}>
            {data.label}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="analysis-cgnode__handle"
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
  const [edges, setEdges, onEdgesChange] =
    useEdgesState<Edge<CallGraphEdgeData>>([]);
  const [direction, setDirection] = useState<"TB" | "LR">("TB");
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [legendOpen, setLegendOpen] = useState(true);

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

  // Compute neighbor highlighting set (one-degree).
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

  // Apply selection + highlight state to nodes & edges.
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => {
        const isSelected = selectedFunction === n.id;
        const inNeighbor = neighborSet ? neighborSet.has(n.id) : true;
        const faded = !!neighborSet && !inNeighbor;
        const highlighted = !!neighborSet && inNeighbor && !isSelected;
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
        const sourceContract =
          (e.data as CallGraphEdgeData | undefined)?.sourceContract ?? "";
        const accent = colorForContract(sourceContract);
        if (!selectedFunction) {
          return {
            ...e,
            animated: false,
            style: {
              stroke: EDGE_INK,
              strokeWidth: 1.4,
              opacity: 0.3,
            },
            markerEnd: {
              type: "arrowclosed" as const,
              color: EDGE_INK,
              width: 16,
              height: 16,
            },
          };
        }
        const touches =
          e.source === selectedFunction || e.target === selectedFunction;
        return {
          ...e,
          animated: touches,
          style: {
            stroke: touches ? accent : EDGE_INK,
            strokeWidth: touches ? 2.2 : 1,
            opacity: touches ? 0.95 : 0.1,
          },
          markerEnd: {
            type: "arrowclosed" as const,
            color: touches ? accent : EDGE_INK,
            width: touches ? 18 : 14,
            height: touches ? 18 : 14,
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

  // Unique contract list for legend.
  const contractStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of Object.values(callGraph)) {
      counts.set(v.contract, (counts.get(v.contract) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        color: colorForContract(name),
      }));
  }, [callGraph]);

  return (
    <div className="analysis-codeviewer-wrap analysis-callgraph relative h-full w-full overflow-hidden">
      {/* Toolbar — direction toggle */}
      <div className="analysis-cgtoolbar">
        <span className="analysis-cgtoolbar__label">Layout</span>
        <button
          type="button"
          onClick={() => setDirection("TB")}
          data-active={direction === "TB"}
          className="analysis-cgtoolbar__btn"
          title="Top → Bottom"
        >
          <span className="analysis-cgtoolbar__icon">↓</span>
          TB
        </button>
        <button
          type="button"
          onClick={() => setDirection("LR")}
          data-active={direction === "LR"}
          className="analysis-cgtoolbar__btn"
          title="Left → Right"
        >
          <span className="analysis-cgtoolbar__icon">→</span>
          LR
        </button>
      </div>

      {/* Stats banner */}
      <div className="analysis-cgstats">
        <div className="analysis-cgstats__row">
          <span className="analysis-cgstats__num">{nodes.length}</span>
          <span className="analysis-cgstats__lbl">nodes</span>
        </div>
        <span className="analysis-cgstats__sep" />
        <div className="analysis-cgstats__row">
          <span className="analysis-cgstats__num">{edges.length}</span>
          <span className="analysis-cgstats__lbl">edges</span>
        </div>
        <span className="analysis-cgstats__sep" />
        <div className="analysis-cgstats__row">
          <span className="analysis-cgstats__num">{contractStats.length}</span>
          <span className="analysis-cgstats__lbl">contracts</span>
        </div>
      </div>

      {/* Loading veil */}
      {loading && (
        <div className="analysis-cgveil">
          <span className="analysis-loader" />
          <span className="analysis-cgveil__txt">Laying out call graph…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && empty && (
        <div className="analysis-cgempty">
          <div className="analysis-empty-glyph">→</div>
          <div className="analysis-cgempty__txt">No call relations to render.</div>
        </div>
      )}

      {/* Legend (bottom-left) */}
      {!loading && !empty && contractStats.length > 0 && (
        <div className="analysis-cglegend" data-open={legendOpen}>
          <button
            type="button"
            className="analysis-cglegend__head"
            onClick={() => setLegendOpen((v) => !v)}
            title={legendOpen ? "Collapse legend" : "Expand legend"}
          >
            <span className="analysis-cglegend__title">Contracts</span>
            <span className="analysis-cglegend__count">
              {contractStats.length}
            </span>
            <span className="analysis-cglegend__caret">
              {legendOpen ? "▾" : "▸"}
            </span>
          </button>
          {legendOpen && (
            <ul className="analysis-cglegend__list">
              {contractStats.slice(0, 8).map((c) => (
                <li key={c.name} className="analysis-cglegend__row">
                  <span
                    className="analysis-cglegend__swatch"
                    style={{ background: c.color }}
                  />
                  <span className="analysis-cglegend__name" title={c.name}>
                    {c.name}
                  </span>
                  <span className="analysis-cglegend__num">{c.count}</span>
                </li>
              ))}
              {contractStats.length > 8 && (
                <li className="analysis-cglegend__more">
                  +{contractStats.length - 8} more
                </li>
              )}
            </ul>
          )}
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
        fitViewOptions={{ padding: 0.22, maxZoom: 1.4 }}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        defaultEdgeOptions={{ type: "default" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={26}
          size={1.1}
          color="rgba(23, 22, 19, 0.16)"
        />
        <Controls
          showInteractive={false}
          className="analysis-cgcontrols"
        />
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          nodeColor={minimapColor}
          nodeBorderRadius={4}
          maskColor="rgba(247, 243, 232, 0.55)"
          className="analysis-cgminimap"
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
