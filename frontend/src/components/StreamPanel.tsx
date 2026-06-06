import { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import type { AuditState } from "../types";

interface Props {
  state: AuditState;
  onStop: () => void;
  onReset: () => void;
}

export default function StreamPanel({ state, onStop, onReset }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [state.streamText]);

  return (
    <div className="flex-1 flex flex-col min-w-0 relative">
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Audit Analysis
          </h2>
          {state.isRunning && (
            <span className="flex items-center gap-2 text-xs text-zinc-400">
              <svg
                className="w-3.5 h-3.5 animate-spin text-indigo-400"
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
              <span className="bg-gradient-to-r from-zinc-300 to-zinc-500 bg-clip-text text-transparent animate-pulse">
                {state.currentPhase
                  ? state.phases.find((p) => p.name === state.currentPhase)
                      ?.label || state.currentPhase
                  : "Processing..."}
              </span>
            </span>
          )}
          {state.verdict && !state.isRunning && (
            <VerdictBadge verdict={state.verdict} />
          )}
        </div>
        <div className="flex items-center gap-2">
          {state.isRunning && (
            <button
              onClick={onStop}
              className="text-xs text-zinc-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-white/[0.06] hover:border-red-500/30 transition-all"
            >
              Stop
            </button>
          )}
          {!state.isRunning && state.streamText && (
            <button
              onClick={onReset}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.06] hover:border-white/20 transition-all"
            >
              New Audit
            </button>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-3xl mx-auto">
          {state.findings.length > 0 && (
            <div className="mb-5 space-y-2">
              {state.findings.map((f, i) => (
                <div
                  key={i}
                  className="glass-panel rounded-lg p-3 flex items-start gap-3"
                >
                  <RiskBadge risk={f.risk} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-100">
                      {f.title}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                      {f.description}
                    </p>
                    {f.contract && (
                      <span className="text-[10px] font-mono text-zinc-500 mt-1 inline-block">
                        {f.contract}
                        {f.function ? `.${f.function}` : ""}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="stream-text text-sm text-zinc-300 font-light leading-relaxed">
            <Markdown>{state.streamText}</Markdown>
            {state.isRunning && (
              <span className="inline-block w-1.5 h-4 bg-white cursor-blink ml-0.5 align-middle shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
            )}
          </div>

          {!state.isRunning && !state.streamText && (
            <div className="text-center text-zinc-600 py-20">
              <p className="text-sm">Waiting for audit to start...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    High: "bg-red-500/15 text-red-400 border-red-500/20",
    Critical: "bg-red-500/15 text-red-400 border-red-500/20",
    Medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    Low: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    Informational: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  };
  const cls =
    colors[risk] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${cls}`}
    >
      {risk.toUpperCase()}
    </span>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const isVulnerable = verdict === "exists";
  const isFailed = verdict === "failed";
  return (
    <span
      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
        isVulnerable
          ? "bg-red-500/15 text-red-400"
          : isFailed
            ? "bg-zinc-500/15 text-zinc-400"
            : "bg-emerald-500/15 text-emerald-400"
      }`}
    >
      {isVulnerable
        ? "VULNERABILITY EXISTS"
        : isFailed
          ? "VERIFICATION FAILED"
          : "NOT VULNERABLE"}
    </span>
  );
}
