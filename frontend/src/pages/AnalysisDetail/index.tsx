import { useEffect, useMemo, useState } from "react";
import ContractHeader from "./components/ContractHeader";
import FunctionSidebar from "./components/FunctionSidebar";
import CodeViewer from "./components/CodeViewer";
import FunctionMeta from "./components/FunctionMeta";
import CfgGraph from "./components/CfgGraph";
import SlitherResults from "./components/SlitherResults";
import ForgeOutput from "./components/ForgeOutput";
import { useAnalysisData } from "./hooks/useAnalysisData";
import "./styles.css";
import type {
  AnalysisTab,
  CallGraphEntry,
  SlitherVulnerability,
} from "./types";

function TabButton({
  active,
  onClick,
  children,
  badge,
  badgeAccent,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number | null;
  badgeAccent?: "red" | "amber" | "emerald" | "zinc";
}) {
  const accentMap: Record<string, string> = {
    red: "bg-red-500/25 text-red-200 border-red-400/50",
    amber: "bg-amber-500/25 text-amber-200 border-amber-400/50",
    emerald: "bg-emerald-500/25 text-emerald-200 border-emerald-400/50",
    zinc: "bg-white/[0.08] text-zinc-100 border-white/20",
  };
  const cls = badgeAccent ? accentMap[badgeAccent] : accentMap.zinc;
  return (
    <button
      type="button"
      data-active={active}
      onClick={onClick}
      className="analysis-tab inline-flex items-center gap-1.5"
    >
      <span>{children}</span>
      {typeof badge === "number" && badge > 0 && (
        <span
          className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full border text-[10px] font-mono tabular-nums ${cls}`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function FunctionDetailView({
  entry,
  onJump,
}: {
  entry: CallGraphEntry | null;
  onJump: (sig: string) => void;
}) {
  if (!entry) {
    return (
      <div className="analysis-empty">
        <div className="analysis-empty-glyph">{"{ }"}</div>
        <div>Select a function from the sidebar.</div>
      </div>
    );
  }

  const startLine = entry.lines && entry.lines.length ? entry.lines[0] : 1;
  const fileLabel = `${entry.file}${
    entry.lines.length ? `:${entry.lines[0]}` : ""
  }`;

  return (
    <div
      key={entry.signature}
      className="analysis-detail-split flex flex-1 min-h-0 gap-4"
    >
      <div className="analysis-codeviewer-wrap flex-1 min-w-0 min-h-0">
        <CodeViewer
          code={entry.source_code ?? ""}
          language="typescript"
          startLine={startLine}
          fileLabel={fileLabel}
        />
      </div>
      <div className="analysis-detail-meta w-[360px] shrink-0 min-h-0 overflow-y-auto pr-1 analysis-meta-scroll">
        <FunctionMeta
          signature={entry.signature}
          contractName={entry.contract}
          functionName={entry.function}
          fullName={entry.full_name}
          file={entry.file}
          lines={entry.lines}
          calledBy={entry.called_by}
          calls={entry.calls}
          isModifier={entry.is_modifier}
          onJump={onJump}
        />
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function getHighestSeverityAccent(
  vulns: SlitherVulnerability[] | null | undefined
): "red" | "amber" | "emerald" | "zinc" {
  if (!vulns || vulns.length === 0) return "zinc";
  const impacts = vulns.map((v) => (v.impact || "").toLowerCase());
  if (impacts.some((i) => i === "high")) return "red";
  if (impacts.some((i) => i === "medium")) return "amber";
  if (impacts.some((i) => i === "low")) return "emerald";
  return "zinc";
}

export default function AnalysisDetail() {
  const [caseId, setCaseId] = useState<string>("binamon-dos");
  const {
    cfgData,
    functionSources,
    slitherResults,
    forgeOutput,
    loading,
    error,
  } = useAnalysisData(caseId);
  const [activeTab, setActiveTab] = useState<AnalysisTab>("detail");
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Reset selected function when example changes; new example has different
  // call graph / function list and the previous signature won't match.
  useEffect(() => {
    setSelectedFunction(null);
  }, [caseId]);

  // Auto-select the first non-interface function once data is loaded.
  useEffect(() => {
    if (!cfgData || selectedFunction) return;
    const entries = Object.values(cfgData.call_graph);
    const first =
      entries.find((e) => e.source_code && e.source_code.includes("{"))
        ?.signature ?? entries[0]?.signature ?? null;
    setSelectedFunction(first);
  }, [cfgData, selectedFunction]);

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [drawerOpen]);

  const selectedEntry = useMemo(() => {
    if (!cfgData || !selectedFunction) return null;
    return cfgData.call_graph[selectedFunction] ?? null;
  }, [cfgData, selectedFunction]);

  const handleJump = (sig: string) => {
    if (!cfgData) return;
    if (cfgData.call_graph[sig]) {
      setSelectedFunction(sig);
    }
  };

  const handleSelect = (sig: string) => {
    setSelectedFunction(sig);
    if (drawerOpen) setDrawerOpen(false);
  };

  const handleExampleChange = (next: string) => {
    if (next === caseId) return;
    setCaseId(next);
    setSelectedFunction(null);
    setDrawerOpen(false);
  };

  const vulnCount = slitherResults?.length ?? 0;
  const vulnAccent = getHighestSeverityAccent(slitherResults);
  const showSidebar = activeTab === "detail" || activeTab === "graph";

  return (
    <div className="analysis-shell">
      <ContractHeader
        cfgData={cfgData}
        caseId={caseId}
        onExampleChange={handleExampleChange}
      />

      <div className="analysis-body">
        {drawerOpen && showSidebar && (
          <div
            className="analysis-sidebar-backdrop"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
        )}

        {showSidebar && (
          <FunctionSidebar
            cfgData={cfgData}
            functionSources={functionSources}
            selectedSignature={selectedFunction}
            onSelect={handleSelect}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            drawerOpen={drawerOpen}
          />
        )}

        <div className="analysis-main">
          <div className="px-6 py-3 border-b border-white/[0.05] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {showSidebar && (
                <button
                  type="button"
                  className="analysis-drawer-trigger"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open function list"
                >
                  <MenuIcon />
                  <span>Functions</span>
                </button>
              )}
              <div className="analysis-tabs">
                <TabButton
                  active={activeTab === "detail"}
                  onClick={() => setActiveTab("detail")}
                >
                  Function Detail
                </TabButton>
                <TabButton
                  active={activeTab === "graph"}
                  onClick={() => setActiveTab("graph")}
                >
                  Call Graph
                </TabButton>
                <TabButton
                  active={activeTab === "vulnerabilities"}
                  onClick={() => setActiveTab("vulnerabilities")}
                  badge={vulnCount}
                  badgeAccent={vulnAccent}
                >
                  Vulnerabilities
                </TabButton>
                <TabButton
                  active={activeTab === "execution"}
                  onClick={() => setActiveTab("execution")}
                >
                  Execution
                </TabButton>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-semibold text-zinc-200 min-w-0">
              {loading && (
                <>
                  <span className="analysis-loader" />
                  <span className="font-bold">Loading analysis…</span>
                </>
              )}
              {error && (
                <span className="text-rose-300 font-mono font-bold truncate" title={error}>
                  ! {error}
                </span>
              )}
              {!loading && !error && selectedEntry && showSidebar && (
                <span className="font-mono font-bold text-zinc-100 truncate max-w-[360px]">
                  {selectedEntry.contract}.{selectedEntry.full_name}
                </span>
              )}
              {!loading && !error && activeTab === "vulnerabilities" && (
                <span className="font-mono font-bold text-zinc-100 truncate max-w-[360px]">
                  {vulnCount} finding{vulnCount === 1 ? "" : "s"}
                </span>
              )}
              {!loading && !error && activeTab === "execution" && (
                <span className="font-mono font-bold text-zinc-100 truncate max-w-[360px]">
                  forge run output
                </span>
              )}
            </div>
          </div>

          <div className="analysis-content">
            {activeTab === "detail" && (
              <FunctionDetailView entry={selectedEntry} onJump={handleJump} />
            )}

            {activeTab === "graph" &&
              (cfgData ? (
                <CfgGraph
                  callGraph={cfgData.call_graph}
                  selectedFunction={selectedFunction}
                  onNodeClick={(sig) => {
                    setSelectedFunction(sig);
                  }}
                />
              ) : (
                <div className="analysis-empty">
                  <div className="analysis-empty-glyph">→</div>
                  <div>
                    {loading ? "Loading call graph…" : "No call graph data."}
                  </div>
                </div>
              ))}

            {activeTab === "vulnerabilities" && (
              <SlitherResults vulnerabilities={slitherResults || []} />
            )}

            {activeTab === "execution" && (
              <ForgeOutput output={forgeOutput || ""} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
