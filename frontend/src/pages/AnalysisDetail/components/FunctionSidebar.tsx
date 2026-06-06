import { useMemo, useState } from "react";
import type { CallGraphEntry, CfgData, FunctionSources } from "../types";

interface FunctionSidebarProps {
  cfgData: CfgData | null;
  functionSources: FunctionSources | null;
  selectedSignature: string | null;
  onSelect: (signature: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  drawerOpen?: boolean;
}

interface ContractGroup {
  contract: string;
  entries: CallGraphEntry[];
}

function buildGroups(
  cfgData: CfgData | null,
  query: string
): ContractGroup[] {
  if (!cfgData) return [];
  const q = query.trim().toLowerCase();
  const groups = new Map<string, CallGraphEntry[]>();

  for (const entry of Object.values(cfgData.call_graph)) {
    // Filter strictly by function name (case-insensitive). When the query is
    // empty, all functions pass through.
    const fnName = (entry.function ?? "").toLowerCase();
    const fullName = (entry.full_name ?? "").toLowerCase();
    const matches = !q || fnName.includes(q) || fullName.includes(q);
    if (!matches) continue;
    const list = groups.get(entry.contract) ?? [];
    list.push(entry);
    groups.set(entry.contract, list);
  }

  const ordered: ContractGroup[] = [];
  // Preserve declaration order from cfg.contracts where possible.
  for (const c of cfgData.contracts) {
    const list = groups.get(c.name);
    if (list && list.length) {
      ordered.push({
        contract: c.name,
        entries: [...list].sort((a, b) =>
          a.full_name.localeCompare(b.full_name)
        ),
      });
      groups.delete(c.name);
    }
  }
  for (const [contract, entries] of groups) {
    ordered.push({
      contract,
      entries: entries.sort((a, b) => a.full_name.localeCompare(b.full_name)),
    });
  }
  return ordered;
}

function ChevronIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 6 9 12l6 6" />
    </svg>
  );
}

export default function FunctionSidebar({
  cfgData,
  selectedSignature,
  onSelect,
  collapsed = false,
  onToggleCollapse,
  drawerOpen = false,
}: FunctionSidebarProps) {
  const [query, setQuery] = useState("");
  const [groupCollapsed, setGroupCollapsed] = useState<Record<string, boolean>>(
    {}
  );

  const groups = useMemo(() => buildGroups(cfgData, query), [cfgData, query]);

  const totalShown = groups.reduce((acc, g) => acc + g.entries.length, 0);

  const toggle = (name: string) =>
    setGroupCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <aside
      className="analysis-sidebar flex flex-col w-[300px] shrink-0 h-full border-r border-white/[0.06] bg-zinc-900/60 backdrop-blur-xl"
      data-collapsed={collapsed ? "true" : "false"}
      data-drawer-open={drawerOpen ? "true" : "false"}
    >
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="analysis-sidebar-toggle"
          aria-label={collapsed ? "Expand function list" : "Collapse function list"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronIcon />
        </button>
      )}

      <div className="analysis-sidebar-content">
        <div className="p-4 border-b border-white/[0.05]">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M11 18a7 7 0 110-14 7 7 0 010 14z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search function…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-black/40 border border-white/[0.1] text-zinc-100 placeholder:text-zinc-300 focus:outline-none focus:border-indigo-400/70 focus:bg-black/60 transition-all duration-200"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200">
            <span>Functions</span>
            <span className="font-mono font-bold text-zinc-100">{totalShown}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 analysis-sidebar-scroll">
          {groups.length === 0 && (
            <div className="px-4 py-10 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 rounded-xl border border-dashed border-white/[0.18] flex items-center justify-center text-zinc-300 font-mono text-xs">
                ∅
              </div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-200">
                {query ? "No matches" : "No functions"}
              </div>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-[10px] font-mono font-bold text-indigo-200 hover:text-indigo-100 underline-offset-2 hover:underline"
                >
                  clear filter
                </button>
              )}
            </div>
          )}
          {groups.map((group) => {
            const isCollapsed = groupCollapsed[group.contract];
            return (
              <div key={group.contract} className="mb-1">
                <button
                  onClick={() => toggle(group.contract)}
                  className="analysis-fn-group-header w-full flex items-center justify-between px-4 py-2 group hover:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <svg
                      className={`w-3 h-3 text-zinc-300 transition-transform duration-200 ${
                        isCollapsed ? "-rotate-90" : ""
                      }`}
                      fill="currentColor"
                      viewBox="0 0 12 12"
                    >
                      <path d="M3 4l3 4 3-4z" />
                    </svg>
                    <span className="font-bold text-[11px] uppercase tracking-[0.16em] text-white truncate">
                      {group.contract}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[10px] text-zinc-200 group-hover:text-white">
                    {group.entries.length}
                  </span>
                </button>
                {!isCollapsed && (
                  <ul className="pb-1">
                    {group.entries.map((entry, idx) => {
                      const active = entry.signature === selectedSignature;
                      return (
                        <li
                          key={entry.signature}
                          className="analysis-fn-list-item"
                          style={{ animationDelay: `${Math.min(idx, 8) * 18}ms` }}
                        >
                          <button
                            onClick={() => onSelect(entry.signature)}
                            data-active={active ? "true" : "false"}
                            className={`analysis-fn-row w-full text-left pl-7 pr-3 py-1.5 font-mono text-[12px] truncate border-l-2 ${
                              active
                                ? "border-indigo-400 bg-indigo-500/[0.12] font-bold text-indigo-100"
                                : "border-transparent font-medium text-zinc-200 hover:border-white/30 hover:bg-white/[0.04] hover:text-white"
                            }`}
                            title={entry.signature}
                          >
                            {entry.is_modifier && (
                              <span className="mr-1 text-amber-300">~</span>
                            )}
                            {entry.full_name}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
