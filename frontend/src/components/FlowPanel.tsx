import { useState } from "react";
import {
  createTranslator,
  getPhaseLabel,
  getStatusLabel,
  translatePipelineMessage,
} from "../i18n";
import type { AuditState, Language, PhaseState } from "../types";
import ToolsPopover from "./ToolsPopover";

interface Props {
  language: Language;
  state: AuditState;
}

type ExpandablePhase = "slither";
const EXPANDABLE_PHASES: ExpandablePhase[] = [
  "slither",
];

function isExpandablePhase(name: string): name is ExpandablePhase {
  return (EXPANDABLE_PHASES as string[]).includes(name);
}

const PHASE_ICONS: Record<string, React.ReactNode> = {
  parse: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
    />
  ),
  slither: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  ),
  llm_audit: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  ),
  poc_gen: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  ),
  forge_test: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
};

export default function FlowPanel({ language, state }: Props) {
  const t = createTranslator(language);
  const hasVerdict = state.verdict !== null;

  const [popoverPhase, setPopoverPhase] = useState<ExpandablePhase | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  const handlePhaseClick = (
    phaseName: string,
    event: React.MouseEvent<HTMLElement>,
  ) => {
    if (!isExpandablePhase(phaseName)) return;
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setPopoverPosition({ x: rect.left - 292, y: rect.top });
    setPopoverPhase((prev) => (prev === phaseName ? null : phaseName));
  };

  return (
    <aside className="w-[340px] shrink-0 border-l border-white/[0.06] bg-[#030303]/60 backdrop-blur-2xl flex flex-col z-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030303]/80 pointer-events-none z-10" />

      <div className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#030303]/50 relative z-20">
        <h2 className="text-xs font-semibold text-white flex items-center gap-2 tracking-widest uppercase">
          {state.isRunning && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
          )}
          {t("flow.pipeline")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 relative z-0">
        <div className="relative">
          {state.phases.map((phase, i) => (
            <div key={phase.name} className="relative">
              {i < state.phases.length - 1 && (
                <div className="absolute left-[19px] top-[44px] bottom-0 w-px z-0">
                  <svg
                    className="w-full h-full"
                    preserveAspectRatio="none"
                  >
                    <line
                      x1="0.5"
                      y1="0"
                      x2="0.5"
                      y2="100%"
                      className={
                        phase.status === "completed" || phase.status === "skipped"
                          ? "stroke-indigo-500/40"
                          : phase.status === "running"
                            ? "stroke-indigo-500/30 wire-animated"
                            : "stroke-white/[0.06]"
                      }
                      strokeWidth="1.5"
                      strokeDasharray={
                        phase.status === "running" ? "6 4" : "none"
                      }
                    />
                  </svg>
                </div>
              )}

              <div
                className={`flex items-start gap-4 pb-8 relative z-10 rounded-lg transition-all duration-200 ${
                  isExpandablePhase(phase.name)
                    ? `cursor-pointer -mx-2 px-2 hover:bg-white/[0.02] ${
                        popoverPhase === phase.name
                          ? "bg-indigo-500/[0.04] ring-1 ring-indigo-400/30"
                          : "hover:ring-1 hover:ring-indigo-500/20"
                      }`
                    : ""
                }`}
                onClick={
                  isExpandablePhase(phase.name)
                    ? (e) => handlePhaseClick(phase.name, e)
                    : undefined
                }
              >
                <PhaseNode
                  phase={phase}
                  isActive={state.currentPhase === phase.name}
                  expandable={isExpandablePhase(phase.name)}
                  expanded={popoverPhase === phase.name}
                />
                <div className="flex-1 min-w-0 pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-semibold flex items-center gap-1.5 ${
                        phase.status === "running"
                          ? "text-white"
                          : phase.status === "completed"
                            ? "text-zinc-100"
                            : phase.status === "error"
                              ? "text-red-300"
                              : "text-zinc-300"
                      }`}
                    >
                      {getPhaseLabel(language, phase.name, phase.label)}
                      {isExpandablePhase(phase.name) && (
                        <svg
                          className={`w-3 h-3 text-zinc-300 transition-all ${
                            popoverPhase === phase.name
                              ? "text-indigo-300 translate-x-0.5"
                              : "group-hover:text-indigo-200"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </span>
                    <StatusBadge language={language} status={phase.status} />
                  </div>
                  {phase.message && (
                    <p className="text-[11px] text-zinc-200 font-medium leading-relaxed mt-0.5 line-clamp-2">
                      {translatePipelineMessage(language, phase.message)}
                    </p>
                  )}
                  {phase.name === "forge_test" &&
                    phase.status === "completed" &&
                    state.testOutput && (
                      <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10.5px] font-mono">
                        <div className="text-emerald-200 font-bold uppercase tracking-[0.14em] text-[9.5px]">
                          {t("flow.testResult")}
                        </div>
                        <div className="text-zinc-100 mt-1 break-all leading-snug">
                          {extractTestSummary(state.testOutput)}
                        </div>
                      </div>
                    )}
                  {phase.name === "poc_gen" &&
                    phase.status === "completed" &&
                    state.pocCode && (
                      <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-[10.5px] font-mono">
                        <div className="text-indigo-200 font-bold uppercase tracking-[0.14em] text-[9.5px]">
                          {t("flow.pocGenerated")}
                        </div>
                        <div className="text-zinc-100 mt-1 leading-snug">
                          {state.pocCode.split("\n").length} {t("flow.linesOfFoundryTest")}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-start gap-4 relative z-10">
            <VerdictNode verdict={state.verdict} isActive={hasVerdict} />
            <div className="flex-1 min-w-0 pt-2">
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-semibold ${
                    hasVerdict ? "text-white" : "text-zinc-300"
                  }`}
                >
                  {t("flow.verdict")}
                </span>
                {hasVerdict && (
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      state.verdict === "exists"
                        ? "bg-red-500/25 text-red-200"
                        : state.verdict === "not_exists"
                          ? "bg-emerald-500/25 text-emerald-200"
                          : state.verdict === "unknown"
                            ? "bg-cyan-500/25 text-cyan-200"
                            : "bg-zinc-500/25 text-zinc-200"
                    }`}
                  >
                    {state.verdict === "exists"
                      ? t("badge.vulnerable")
                      : state.verdict === "not_exists"
                        ? t("badge.safe")
                        : state.verdict === "unknown"
                          ? t("stream.discoveryComplete")
                          : state.verdict?.toUpperCase()}
                  </span>
                )}
              </div>
              {state.verdictMessage && (
                <p className="text-[11px] text-zinc-200 font-medium leading-relaxed mt-0.5">
                  {translatePipelineMessage(language, state.verdictMessage)}
                </p>
              )}
            </div>
          </div>
        </div>

        {state.findings.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <h3 className="text-[10px] font-bold text-zinc-200 uppercase tracking-widest mb-3">
              {t("flow.findings")} ({state.findings.length})
            </h3>
            <div className="space-y-2">
              {state.findings.map((f, i) => (
                <div
                  key={i}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white truncate">
                      {f.title}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-2 ${
                        f.risk === "High" || f.risk === "Critical"
                          ? "bg-red-500/25 text-red-200"
                          : f.risk === "Medium"
                            ? "bg-amber-500/25 text-amber-200"
                            : "bg-blue-500/25 text-blue-200"
                      }`}
                    >
                      {translateRisk(language, f.risk)}
                    </span>
                  </div>
                  {f.contract && (
                    <span className="text-[10px] font-mono font-semibold text-zinc-300">
                      {f.contract}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {popoverPhase && (
        <ToolsPopover
          phase={popoverPhase}
          position={popoverPosition}
          onClose={() => setPopoverPhase(null)}
          testOutput={null}
        />
      )}
    </aside>
  );
}

function PhaseNode({
  phase,
  isActive,
  expandable = false,
  expanded = false,
}: {
  phase: PhaseState;
  isActive: boolean;
  expandable?: boolean;
  expanded?: boolean;
}) {
  const icon = PHASE_ICONS[phase.name];

  return (
    <div
      className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
        phase.status === "running"
          ? "bg-indigo-500/20 border-indigo-500/40 node-active"
          : phase.status === "completed"
            ? "bg-emerald-500/15 border-emerald-500/30"
            : phase.status === "skipped"
              ? "bg-zinc-500/10 border-zinc-500/20"
              : phase.status === "error"
                ? "bg-red-500/15 border-red-500/30"
                : "bg-white/[0.03] border-white/[0.06]"
      } ${expandable ? "hover:scale-105" : ""} ${
        expanded ? "ring-2 ring-indigo-400/40 ring-offset-2 ring-offset-[#030303]" : ""
      }`}
    >
      {phase.status === "running" ? (
        <svg
          className="w-4 h-4 animate-spin text-indigo-400"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : phase.status === "completed" ? (
        <svg
          className="w-4 h-4 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : phase.status === "error" ? (
        <svg
          className="w-4 h-4 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ) : phase.status === "skipped" ? (
        <svg
          className="w-4 h-4 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 5l7 7-7 7M5 5l7 7-7 7"
          />
        </svg>
      ) : (
        <svg
          className={`w-4 h-4 ${isActive ? "text-zinc-200" : "text-zinc-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {icon}
        </svg>
      )}
      {expandable && (
        <span
          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-[#030303] transition-all ${
            expanded
              ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"
              : "bg-indigo-500/60"
          }`}
          aria-hidden
        >
          <span className="absolute inset-[3px] rounded-full bg-[#030303] flex items-center justify-center">
            <span
              className={`block w-[3px] h-[3px] rounded-full ${
                expanded ? "bg-white" : "bg-indigo-300"
              }`}
            />
          </span>
        </span>
      )}
    </div>
  );
}

function VerdictNode({
  verdict,
  isActive,
}: {
  verdict: string | null;
  isActive: boolean;
}) {
  return (
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
        verdict === "exists"
          ? "bg-red-500/20 border-red-500/40"
          : verdict === "not_exists"
            ? "bg-emerald-500/20 border-emerald-500/40"
            : isActive
              ? "bg-zinc-500/15 border-zinc-500/30"
              : "bg-white/[0.03] border-white/[0.06]"
      }`}
    >
      {verdict === "exists" ? (
        <svg
          className="w-4 h-4 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ) : verdict === "not_exists" ? (
        <svg
          className="w-4 h-4 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
    </div>
  );
}

function extractTestSummary(output: string): string {
  if (!output) return "";
  const passMatch = output.match(/\[PASS\]\s+([\w$]+)\(\)\s*\(gas:\s*([\d,]+)\)/);
  const failMatch = output.match(/\[FAIL[^\]]*\]\s+([\w$]+)\(\)/);
  if (passMatch) {
    return `✓ ${passMatch[1]}() — gas: ${passMatch[2]}`;
  }
  if (failMatch) {
    return `✗ ${failMatch[1]}() — FAILED`;
  }
  const summary = output.match(/(\d+)\s+passed[^\n]*?(\d+)\s+failed/i);
  if (summary) {
    return `${summary[1]} passed · ${summary[2]} failed`;
  }
  const lines = output.trim().split("\n").filter((l) => l.trim().length > 0);
  const last = lines[lines.length - 1] || "";
  return last.length > 90 ? `${last.slice(0, 87)}…` : last || "Test completed";
}

function translateRisk(language: Language, risk: string) {
  if (language === "en") return risk;
  const zhRisk: Record<string, string> = {
    Critical: "严重",
    High: "高危",
    Medium: "中危",
    Low: "低危",
    Informational: "提示",
  };
  return zhRisk[risk] || risk;
}

function StatusBadge({
  language,
  status,
}: {
  language: Language;
  status: PhaseState["status"];
}) {
  const config: Record<
    string,
    { className: string }
  > = {
    pending: {
      className: "bg-white/10 text-zinc-200",
    },
    running: {
      className: "bg-indigo-500/25 text-indigo-200",
    },
    completed: {
      className: "bg-emerald-500/25 text-emerald-200",
    },
    skipped: {
      className: "bg-zinc-500/20 text-zinc-200",
    },
    retrying: {
      className: "bg-amber-500/25 text-amber-200",
    },
    error: {
      className: "bg-red-500/25 text-red-200",
    },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${c.className}`}>
      {getStatusLabel(language, status)}
    </span>
  );
}
