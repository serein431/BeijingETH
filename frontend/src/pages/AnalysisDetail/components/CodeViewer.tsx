import { useEffect, useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export interface CodeViewerProps {
  code: string;
  language?: string;
  startLine?: number;
  highlightLines?: number[];
  fileLabel?: string;
}

const MONO_STACK =
  "'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', Menlo, Monaco, Consolas, monospace";

export default function CodeViewer({
  code,
  language = "typescript",
  startLine = 1,
  highlightLines = [],
  fileLabel,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const highlightSet = useMemo(() => new Set(highlightLines), [highlightLines]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        // Fallback for non-secure contexts.
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const lineCount = code ? code.split("\n").length : 0;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0d1117] rounded-xl border border-white/[0.06] overflow-hidden shadow-[0_20px_60px_-30px_rgba(99,102,241,0.35)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white/[0.03] border-b border-white/[0.05] px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* traffic-light decoration */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-mono shrink-0">
            {language}
          </span>
          {fileLabel && (
            <span
              className="text-[11px] text-zinc-500 font-mono truncate hidden sm:inline-block"
              title={fileLabel}
            >
              {fileLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 font-mono hidden md:inline">
            {lineCount} ln
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all duration-200 border ${
              copied
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/30"
                : "bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:bg-white/[0.06] hover:text-zinc-100 hover:border-white/[0.12]"
            }`}
          >
            {copied ? (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>Copied</span>
              </>
            ) : (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="flex-1 min-h-0 overflow-auto bg-[#0d1117] codeviewer-scroll">
        {code ? (
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            showLineNumbers
            startingLineNumber={startLine}
            wrapLines
            lineProps={(lineNumber: number) => {
              const isHL = highlightSet.has(lineNumber);
              return {
                style: {
                  display: "block",
                  width: "100%",
                  backgroundColor: isHL
                    ? "rgba(99, 102, 241, 0.10)"
                    : "transparent",
                  borderLeft: isHL
                    ? "2px solid rgba(99, 102, 241, 0.7)"
                    : "2px solid transparent",
                  paddingLeft: "6px",
                  marginLeft: "-6px",
                },
              };
            }}
            lineNumberStyle={{
              color: "#3f3f46",
              minWidth: "2.75em",
              paddingRight: "1em",
              borderRight: "1px solid rgba(255,255,255,0.04)",
              marginRight: "1em",
              userSelect: "none",
              fontVariantNumeric: "tabular-nums",
            }}
            customStyle={{
              margin: 0,
              padding: "16px 20px",
              background: "transparent",
              fontSize: "12.5px",
              lineHeight: "1.65",
              fontFamily: MONO_STACK,
            }}
            codeTagProps={{
              style: {
                fontFamily: MONO_STACK,
              },
            }}
          >
            {code}
          </SyntaxHighlighter>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-zinc-600 font-mono">
            // no source available
          </div>
        )}
      </div>
    </div>
  );
}
