import { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { Link } from "react-router-dom";
import { createTranslator, getPhaseLabel, translateStreamText } from "../i18n";
import type { AuditState, Language } from "../types";

interface Props {
  language: Language;
  state: AuditState;
  onStop: () => void;
  onReset: () => void;
}

export default function StreamPanel({
  language,
  state,
  onStop,
  onReset,
}: Props) {
  const t = createTranslator(language);
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
            {t("stream.title")}
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
                  ? getPhaseLabel(
                      language,
                      state.currentPhase,
                      state.phases.find((p) => p.name === state.currentPhase)
                        ?.label || state.currentPhase
                    )
                  : t("stream.processing")}
              </span>
            </span>
          )}
          {state.verdict && !state.isRunning && (
            <VerdictBadge language={language} verdict={state.verdict} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/analysis"
            className="text-xs text-cyan-200 hover:text-white px-3 py-1.5 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.055] hover:border-cyan-300/40 hover:bg-cyan-300/[0.1] transition-all"
          >
            {t("analysis.open")}
          </Link>
          {state.isRunning && (
            <button
              onClick={onStop}
              className="text-xs text-zinc-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-white/[0.06] hover:border-red-500/30 transition-all"
            >
              {t("stream.stop")}
            </button>
          )}
          {!state.isRunning && state.streamText && (
            <button
              onClick={onReset}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.06] hover:border-white/20 transition-all"
            >
              {t("stream.newAudit")}
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
                  <RiskBadge language={language} risk={f.risk} />
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
            <Markdown>{translateStreamText(language, state.streamText)}</Markdown>
            {state.isRunning && (
              <span className="inline-block w-1.5 h-4 bg-white cursor-blink ml-0.5 align-middle shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
            )}
          </div>

          {!state.isRunning && !state.streamText && (
            <div className="text-center text-zinc-600 py-20">
              <p className="text-sm">{t("stream.waiting")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ language, risk }: { language: Language; risk: string }) {
  const colors: Record<string, string> = {
    High: "bg-red-500/15 text-red-400 border-red-500/20",
    Critical: "bg-red-500/15 text-red-400 border-red-500/20",
    Medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    Low: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    Informational: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  };
  const cls =
    colors[risk] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
  const zhRisk: Record<string, string> = {
    Critical: "严重",
    High: "高危",
    Medium: "中危",
    Low: "低危",
    Informational: "提示",
  };
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${cls}`}
    >
      {language === "zh" ? zhRisk[risk] || risk : risk.toUpperCase()}
    </span>
  );
}

function VerdictBadge({
  language,
  verdict,
}: {
  language: Language;
  verdict: string;
}) {
  const t = createTranslator(language);
  const isVulnerable = verdict === "exists";
  const isFailed = verdict === "failed";
  const isUnknown = verdict === "unknown";
  return (
    <span
      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
        isVulnerable
          ? "bg-red-500/15 text-red-400"
          : isFailed
            ? "bg-zinc-500/15 text-zinc-400"
            : isUnknown
              ? "bg-cyan-500/15 text-cyan-300"
              : "bg-emerald-500/15 text-emerald-400"
      }`}
    >
      {isVulnerable
        ? t("stream.verdictExists")
        : isFailed
          ? t("stream.verificationFailed")
          : isUnknown
            ? t("stream.discoveryComplete")
            : t("stream.notVulnerable")}
    </span>
  );
}
