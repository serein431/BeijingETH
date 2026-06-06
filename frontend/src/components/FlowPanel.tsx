import {
  createTranslator,
  getPhaseLabel,
  getStatusLabel,
  translatePipelineMessage,
} from "../i18n";
import type { AuditState, Language, PhaseState } from "../types";

interface Props {
  language: Language;
  state: AuditState;
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

              <div className="flex items-start gap-4 pb-8 relative z-10">
                <PhaseNode phase={phase} isActive={state.currentPhase === phase.name} />
                <div className="flex-1 min-w-0 pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${
                        phase.status === "running"
                          ? "text-white"
                          : phase.status === "completed"
                            ? "text-zinc-200"
                            : phase.status === "error"
                              ? "text-red-400"
                              : "text-zinc-500"
                      }`}
                    >
                      {getPhaseLabel(language, phase.name, phase.label)}
                    </span>
                    <StatusBadge language={language} status={phase.status} />
                  </div>
                  {phase.message && (
                    <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5 line-clamp-2">
                      {translatePipelineMessage(language, phase.message)}
                    </p>
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
                  className={`text-sm font-medium ${
                    hasVerdict ? "text-white" : "text-zinc-500"
                  }`}
                >
                  {t("flow.verdict")}
                </span>
                {hasVerdict && (
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      state.verdict === "exists"
                        ? "bg-red-500/15 text-red-400"
                        : state.verdict === "not_exists"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-zinc-500/15 text-zinc-400"
                    }`}
                  >
                    {state.verdict === "exists"
                      ? t("badge.vulnerable")
                      : state.verdict === "not_exists"
                        ? t("badge.safe")
                        : state.verdict?.toUpperCase()}
                  </span>
                )}
              </div>
              {state.verdictMessage && (
                <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                  {translatePipelineMessage(language, state.verdictMessage)}
                </p>
              )}
            </div>
          </div>
        </div>

        {state.findings.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
              {t("flow.findings")} ({state.findings.length})
            </h3>
            <div className="space-y-2">
              {state.findings.map((f, i) => (
                <div
                  key={i}
                  className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-zinc-200 truncate">
                      {f.title}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-2 ${
                        f.risk === "High" || f.risk === "Critical"
                          ? "bg-red-500/15 text-red-400"
                          : f.risk === "Medium"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-blue-500/15 text-blue-400"
                      }`}
                    >
                      {translateRisk(language, f.risk)}
                    </span>
                  </div>
                  {f.contract && (
                    <span className="text-[10px] font-mono text-zinc-600">
                      {f.contract}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function PhaseNode({
  phase,
  isActive,
}: {
  phase: PhaseState;
  isActive: boolean;
}) {
  const icon = PHASE_ICONS[phase.name];

  return (
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
        phase.status === "running"
          ? "bg-indigo-500/20 border-indigo-500/40 node-active"
          : phase.status === "completed"
            ? "bg-emerald-500/15 border-emerald-500/30"
            : phase.status === "skipped"
              ? "bg-zinc-500/10 border-zinc-500/20"
              : phase.status === "error"
                ? "bg-red-500/15 border-red-500/30"
                : "bg-white/[0.03] border-white/[0.06]"
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
          className={`w-4 h-4 ${isActive ? "text-zinc-300" : "text-zinc-600"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {icon}
        </svg>
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
          className="w-4 h-4 text-zinc-600"
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
      className: "bg-white/5 text-zinc-500",
    },
    running: {
      className: "bg-indigo-500/15 text-indigo-400",
    },
    completed: {
      className: "bg-emerald-500/15 text-emerald-400",
    },
    skipped: {
      className: "bg-zinc-500/10 text-zinc-500",
    },
    retrying: {
      className: "bg-amber-500/15 text-amber-400",
    },
    error: {
      className: "bg-red-500/15 text-red-400",
    },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${c.className}`}>
      {getStatusLabel(language, status)}
    </span>
  );
}
