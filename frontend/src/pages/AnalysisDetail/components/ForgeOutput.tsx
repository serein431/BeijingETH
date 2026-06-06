import { useEffect, useMemo, useState } from "react";

interface ForgeOutputProps {
  output: string;
}

type TokenKind =
  | "pass"
  | "fail"
  | "compile"
  | "error"
  | "vuln"
  | "separator"
  | "filepath"
  | "number"
  | "default";

interface Token {
  kind: TokenKind;
  text: string;
}

const TOKEN_CLASS: Record<TokenKind, string> = {
  pass: "text-green-300 font-bold",
  fail: "text-red-300 font-bold",
  compile: "text-blue-300",
  error: "text-red-300",
  vuln: "text-red-300 font-bold",
  separator: "text-yellow-300",
  filepath: "text-indigo-200",
  number: "text-cyan-300",
  default: "text-green-200",
};

const SCOPED_STYLES = `
@keyframes forge-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes forge-blink {
  0%, 49%   { opacity: 1; }
  50%, 100% { opacity: 0; }
}
@keyframes forge-scan {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
.forge-shell { animation: forge-fade-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.forge-cursor { animation: forge-blink 1.05s step-end infinite; }
.forge-scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(74, 222, 128, 0.06) 48%,
    rgba(74, 222, 128, 0.12) 50%,
    rgba(74, 222, 128, 0.06) 52%,
    transparent 100%
  );
  height: 16%;
  animation: forge-scan 6.5s linear infinite;
  mix-blend-mode: screen;
}
.forge-terminal {
  background-color: #0a0e14;
  background-image:
    radial-gradient(circle at 50% 0%, rgba(74, 222, 128, 0.06), transparent 60%),
    repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0) 0,
      rgba(0, 0, 0, 0) 2px,
      rgba(255, 255, 255, 0.012) 3px,
      rgba(255, 255, 255, 0.012) 3px
    );
}
.forge-line {
  display: grid;
  grid-template-columns: 3.25rem 1fr;
  column-gap: 1rem;
}
.forge-line:hover {
  background-color: rgba(255, 255, 255, 0.02);
}
.forge-gutter {
  user-select: none;
  text-align: right;
  color: rgba(161, 161, 170, 0.95);
  font-variant-numeric: tabular-nums;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  padding-right: 0.75rem;
}
`;

/**
 * Tokenize a single line into colored segments.
 * Order matters: bracketed status > vulnerability flag > compile/error
 * keywords > separators > filepaths > numbers.
 */
function tokenizeLine(line: string): Token[] {
  if (line.length === 0) return [{ kind: "default", text: "" }];

  // Whole-line patterns first.
  if (/^[\s]*-{3,}/.test(line)) {
    return [{ kind: "separator", text: line }];
  }

  // Build a list of [start, end, kind] matches and merge with default text.
  type Match = { start: number; end: number; kind: TokenKind };
  const matches: Match[] = [];

  const patterns: Array<{ regex: RegExp; kind: TokenKind }> = [
    { regex: /\[PASS\]/g, kind: "pass" },
    { regex: /\[FAIL\][^\s]*/g, kind: "fail" },
    { regex: /Vulnerability Exists[^\n]*/g, kind: "vuln" },
    {
      regex:
        /\b(?:Compiler run successful!?|Compiling\s+\d+\s+files?(?:\s+with[^\n]*)?|Solc\s+\d+(?:\.\d+)+\s+finished[^\n]*)/g,
      kind: "compile",
    },
    { regex: /\b(?:error|Error|ERROR|panicked)\b[^\n]*/g, kind: "error" },
    {
      regex: /[A-Za-z0-9_./\\-]+\.t?\.?sol\b(?::[A-Za-z0-9_]+)?/g,
      kind: "filepath",
    },
    // Numbers (incl. very long balances), but not those embedded in filepaths
    { regex: /\b\d[\d_]*\b/g, kind: "number" },
  ];

  for (const { regex, kind } of patterns) {
    let m: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((m = regex.exec(line)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      // Skip if this range overlaps an already-claimed range.
      const overlaps = matches.some(
        (x) => !(end <= x.start || start >= x.end),
      );
      if (!overlaps) {
        matches.push({ start, end, kind });
      }
      // Avoid zero-length infinite loops.
      if (m.index === regex.lastIndex) regex.lastIndex += 1;
    }
  }

  matches.sort((a, b) => a.start - b.start);

  const tokens: Token[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) {
      tokens.push({ kind: "default", text: line.slice(cursor, m.start) });
    }
    tokens.push({ kind: m.kind, text: line.slice(m.start, m.end) });
    cursor = m.end;
  }
  if (cursor < line.length) {
    tokens.push({ kind: "default", text: line.slice(cursor) });
  }
  return tokens.length > 0 ? tokens : [{ kind: "default", text: line }];
}

function TerminalIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 17 6-6-6-6" />
      <path d="M12 19h8" />
    </svg>
  );
}

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  return (
    <svg
      width="13"
      height="13"
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
  );
}

function GasIcon() {
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
    >
      <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M3 14h12" />
      <path d="M18 5v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V8.5a2.5 2.5 0 0 0-.732-1.768L18 3" />
    </svg>
  );
}

export default function ForgeOutput({ output }: ForgeOutputProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  const text = output ?? "";
  const isEmpty = text.trim().length === 0;

  const status = useMemo<"PASSED" | "FAILED" | null>(() => {
    if (isEmpty) return null;
    if (/\[FAIL\]/.test(text)) return "FAILED";
    if (/\[PASS\]/.test(text)) return "PASSED";
    return null;
  }, [text, isEmpty]);

  const gas = useMemo<string | null>(() => {
    const m = text.match(/\(gas:\s*(\d[\d_]*)\)/);
    return m ? m[1] : null;
  }, [text]);

  const lines = useMemo(() => (isEmpty ? [] : text.split("\n")), [
    text,
    isEmpty,
  ]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
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

  if (isEmpty) {
    return (
      <>
        <style>{SCOPED_STYLES}</style>
        <div className="forge-shell flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/[0.1] bg-black/40 text-zinc-300">
            <TerminalIcon />
          </div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-200">
            No execution output available
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{SCOPED_STYLES}</style>
      <div className="forge-shell overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
        {/* Header bar */}
        <header className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] bg-white/[0.025] px-4 py-2.5">
          {/* Left: traffic lights + title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <div className="flex items-center gap-2 text-white">
              <TerminalIcon />
              <span className="text-[12px] font-bold tracking-tight">
                Forge Test Output
              </span>
            </div>
          </div>

          {/* Center: status badge */}
          {status && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${
                status === "PASSED"
                  ? "border-green-400/50 bg-green-500/20 text-green-200"
                  : "border-red-400/50 bg-red-500/20 text-red-200"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status === "PASSED" ? "bg-green-400" : "bg-red-400"
                }`}
              />
              {status}
            </span>
          )}

          {/* Right: gas + copy */}
          <div className="ml-auto flex items-center gap-2">
            {gas && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-cyan-400/40 bg-cyan-500/15 px-2 py-0.5 font-mono text-[10.5px] text-cyan-200">
                <GasIcon />
                <span className="opacity-90 font-semibold">gas</span>
                <span className="font-bold tabular-nums">{gas}</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] font-semibold transition-all duration-200 ${
                copied
                  ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200"
                  : "border-white/[0.12] bg-white/[0.04] text-zinc-200 hover:border-white/[0.2] hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <CopyIcon copied={copied} />
              <span>{copied ? "Copied" : "Copy All"}</span>
            </button>
          </div>
        </header>

        {/* Terminal body */}
        <div className="relative">
          <div className="forge-scanline" aria-hidden="true" />
          <pre
            className="forge-terminal m-0 max-h-[560px] overflow-auto px-0 py-3 font-mono text-[12.5px] leading-relaxed"
            style={{
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', Menlo, Monaco, Consolas, monospace",
            }}
          >
            {lines.map((line, idx) => {
              const tokens = tokenizeLine(line);
              const isLast = idx === lines.length - 1;
              return (
                <div key={idx} className="forge-line px-3">
                  <span className="forge-gutter text-[11px]">{idx + 1}</span>
                  <code className="block whitespace-pre-wrap break-words">
                    {tokens.length === 0 || (tokens.length === 1 && tokens[0].text === "") ? (
                      <span>&nbsp;</span>
                    ) : (
                      tokens.map((tok, i) => (
                        <span key={i} className={TOKEN_CLASS[tok.kind]}>
                          {tok.text}
                        </span>
                      ))
                    )}
                    {isLast && (
                      <span
                        aria-hidden="true"
                        className="forge-cursor ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-green-400/80 align-middle"
                      />
                    )}
                  </code>
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    </>
  );
}
