import { Link } from "react-router-dom";
import type { CfgData } from "../types";
import ExampleSelector from "./ExampleSelector";

interface ContractHeaderProps {
  cfgData: CfgData | null;
  caseId: string;
  onExampleChange: (caseId: string) => void;
}

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "indigo" | "emerald" | "amber";
}) {
  const palette: Record<string, string> = {
    indigo: "text-indigo-300 border-indigo-400/30 bg-indigo-500/[0.06]",
    emerald: "text-emerald-300 border-emerald-400/30 bg-emerald-500/[0.06]",
    amber: "text-amber-300 border-amber-400/30 bg-amber-500/[0.06]",
  };
  const cls = accent
    ? palette[accent]
    : "text-zinc-200 border-white/10 bg-white/[0.03]";
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur ${cls}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
        {label}
      </span>
      <span className="font-mono text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
}

export default function ContractHeader({
  cfgData,
  caseId,
  onExampleChange,
}: ContractHeaderProps) {
  const contractCount = cfgData?.contracts.length ?? 0;
  const functionCount = cfgData
    ? Object.keys(cfgData.call_graph).length
    : 0;
  const stateVarCount = cfgData?.public_state_variables.length ?? 0;
  const projectLabel = cfgData?.contracts[0]?.name
    ? `${cfgData.contracts[0].name}.sol`
    : "Uploaded Solidity Project";

  return (
    <header className="analysis-header relative flex items-center justify-between gap-6 px-6 py-4 border-b border-white/[0.06] bg-white/[0.015] backdrop-blur-xl">
      <div className="flex items-center gap-4 min-w-0">
        <Link
          to="/"
          className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-black/30 hover:border-indigo-400/40 hover:bg-indigo-500/[0.06] hover:text-indigo-200 text-zinc-300 transition-all duration-200"
        >
          <svg
            className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-xs font-semibold tracking-wide">Back</span>
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
            Project Structure
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <h1 className="font-mono text-lg font-bold text-zinc-100 truncate">
              {projectLabel}
            </h1>
            <span className="text-xs font-medium text-zinc-400 truncate">
              {cfgData ? `${cfgData.solc_constraint} · parsed workspace` : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <ExampleSelector currentCase={caseId} onChange={onExampleChange} />
        <div className="flex items-center gap-2">
          <StatChip
            label="Contracts"
            value={contractCount}
            accent="indigo"
          />
          <StatChip
            label="Functions"
            value={functionCount}
            accent="emerald"
          />
          <StatChip
            label="State"
            value={stateVarCount}
            accent="amber"
          />
          <StatChip
            label="solc"
            value={cfgData ? cfgData.solc_version : "—"}
          />
        </div>
      </div>
    </header>
  );
}
