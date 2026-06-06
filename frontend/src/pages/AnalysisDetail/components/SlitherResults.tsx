import { useMemo, useState } from "react";
import type { SlitherVulnerability, VulnLocation } from "../types";

interface SlitherResultsProps {
  vulnerabilities: SlitherVulnerability[];
}

type Severity = "High" | "Medium" | "Low" | "Informational";

interface SeverityTokens {
  bar: string;
  pill: string;
  pillSoft: string;
  glow: string;
  dot: string;
  text: string;
  ring: string;
  letter: string;
}

const SEVERITY_TOKENS: Record<Severity, SeverityTokens> = {
  High: {
    bar: "bg-red-500",
    pill: "bg-red-500/20 text-red-400 border-red-500/30",
    pillSoft: "bg-red-500/10 text-red-300/80 border-red-500/20",
    glow: "shadow-[0_0_40px_-12px_rgba(239,68,68,0.45)]",
    dot: "bg-red-500",
    text: "text-red-400",
    ring: "ring-red-500/30",
    letter: "H",
  },
  Medium: {
    bar: "bg-amber-500",
    pill: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    pillSoft: "bg-amber-500/10 text-amber-300/80 border-amber-500/20",
    glow: "shadow-[0_0_40px_-12px_rgba(245,158,11,0.4)]",
    dot: "bg-amber-500",
    text: "text-amber-400",
    ring: "ring-amber-500/30",
    letter: "M",
  },
  Low: {
    bar: "bg-blue-500",
    pill: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    pillSoft: "bg-blue-500/10 text-blue-300/80 border-blue-500/20",
    glow: "shadow-[0_0_40px_-12px_rgba(59,130,246,0.4)]",
    dot: "bg-blue-500",
    text: "text-blue-400",
    ring: "ring-blue-500/30",
    letter: "L",
  },
  Informational: {
    bar: "bg-zinc-500",
    pill: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    pillSoft: "bg-zinc-500/10 text-zinc-400/80 border-zinc-500/20",
    glow: "shadow-[0_0_40px_-12px_rgba(113,113,122,0.35)]",
    dot: "bg-zinc-500",
    text: "text-zinc-400",
    ring: "ring-zinc-500/30",
    letter: "I",
  },
};

const SEVERITY_ORDER: Severity[] = ["High", "Medium", "Low", "Informational"];

function normalizeSeverity(value: string): Severity {
  const v = (value || "").trim().toLowerCase();
  if (v === "high") return "High";
  if (v === "medium") return "Medium";
  if (v === "low") return "Low";
  return "Informational";
}

function basename(path: string): string {
  if (!path) return "";
  const trimmed = path.replace(/[\\/]+$/, "");
  const idx = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  return idx >= 0 ? trimmed.slice(idx + 1) : trimmed;
}

const SCOPED_STYLES = `
@keyframes slither-fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes slither-pulse-dot {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.2); }
}
.slither-card { animation: slither-fade-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.slither-stat { animation: slither-fade-up 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.slither-pulse { animation: slither-pulse-dot 2.4s ease-in-out infinite; }
.slither-collapse {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}
.slither-collapse[data-open="true"] { grid-template-rows: 1fr; }
.slither-collapse > .slither-collapse-inner {
  overflow: hidden;
  min-height: 0;
}
.slither-grid-bg {
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 28px 28px;
}
`;

function ChevronIcon({ open }: { open: boolean }) {
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
      style={{
        transition: "transform 220ms cubic-bezier(0.4, 0, 0.2, 1)",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ShieldCheckIcon({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function VulnerabilityCard({
  vuln,
  index,
}: {
  vuln: SlitherVulnerability;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const severity = normalizeSeverity(vuln.impact);
  const tokens = SEVERITY_TOKENS[severity];
  const confidence = (vuln.confidence || "").trim();

  return (
    <article
      className="slither-card group relative flex overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.035]"
      style={{ animationDelay: `${Math.min(index * 70, 600)}ms` }}
    >
      {/* Severity color bar */}
      <div
        aria-hidden="true"
        className={`w-1 shrink-0 rounded-l ${tokens.bar} ${tokens.glow}`}
      />

      <div className="flex-1 min-w-0 p-5">
        {/* Header row */}
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              aria-hidden="true"
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold tabular-nums ${tokens.pill}`}
            >
              {tokens.letter}
            </span>
            <h3 className="font-mono text-sm font-semibold text-zinc-100 truncate tracking-tight">
              {vuln.check}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${tokens.pill}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${tokens.dot} slither-pulse`}
              />
              {severity}
            </span>
            {confidence && (
              <span
                className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] ${tokens.pillSoft}`}
              >
                conf · {confidence}
              </span>
            )}
          </div>
        </header>

        {/* Description */}
        <p className="mt-3 text-[13px] font-medium leading-relaxed text-zinc-200 whitespace-pre-wrap break-words">
          {vuln.description}
        </p>

        {/* Locations toggle */}
        {vuln.locations.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] font-semibold text-zinc-300 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-zinc-100"
            >
              <ChevronIcon open={open} />
              {open
                ? "Hide locations"
                : `Show locations (${vuln.locations.length})`}
            </button>

            <div className="slither-collapse" data-open={open}>
              <div className="slither-collapse-inner">
                <div className="mt-3 flex flex-col gap-3">
                  {vuln.locations.map((loc, i) => (
                    <LocationBlock key={i} location={loc} />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function LocationBlock({ location }: { location: VulnLocation }) {
  const fileLabel = basename(location.file) || location.file;
  const lineLabel =
    location.line_start === location.line_end
      ? `L${location.line_start}`
      : `L${location.line_start}-${location.line_end}`;

  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.06] bg-black/40">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.04] bg-white/[0.015] px-3 py-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-zinc-300">
          <FileIcon />
          <span className="font-semibold text-zinc-100">{fileLabel}</span>
          <span className="text-zinc-500">·</span>
          <span className="text-indigo-300 font-semibold tabular-nums">{lineLabel}</span>
        </span>
        {location.label && (
          <span className="ml-auto truncate text-[11px] font-medium italic text-zinc-400">
            {location.label}
          </span>
        )}
      </div>
      <pre className="m-0 max-h-72 overflow-auto bg-[#0a0e14] px-4 py-3 font-mono text-[12px] leading-relaxed text-zinc-200">
        <code>{location.contract_content}</code>
      </pre>
    </div>
  );
}

export default function SlitherResults({
  vulnerabilities,
}: SlitherResultsProps) {
  const counts = useMemo(() => {
    const c: Record<Severity, number> = {
      High: 0,
      Medium: 0,
      Low: 0,
      Informational: 0,
    };
    vulnerabilities.forEach((v) => {
      c[normalizeSeverity(v.impact)] += 1;
    });
    return c;
  }, [vulnerabilities]);

  const total = vulnerabilities.length;

  if (total === 0) {
    return (
      <>
        <style>{SCOPED_STYLES}</style>
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-400">
              <ShieldCheckIcon size={32} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-300">
              No vulnerabilities detected
            </p>
            <p className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              static analysis · clean
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{SCOPED_STYLES}</style>

      {/* Top statistics bar — glass card */}
      <section
        className="slither-stat relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm"
        style={{ animationDelay: "0ms" }}
      >
        <div className="slither-grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          {/* Total count */}
          <div className="flex items-end gap-3">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                slither · static analysis
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums text-white leading-none">
                  {total}
                </span>
                <span className="text-xs font-semibold text-zinc-300">
                  vulnerabilities found
                </span>
              </div>
            </div>
          </div>

          {/* Severity pills */}
          <div className="flex flex-wrap items-center gap-2">
            {SEVERITY_ORDER.map((sev) => {
              const tokens = SEVERITY_TOKENS[sev];
              const count = counts[sev];
              const dim = count === 0;
              return (
                <div
                  key={sev}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-all duration-200 ${tokens.pill} ${
                    dim ? "opacity-40" : "opacity-100"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${tokens.dot} ${
                      count > 0 ? "slither-pulse" : ""
                    }`}
                  />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
                    {sev}
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vulnerability cards */}
      <div className="mt-4 flex flex-col gap-3">
        {vulnerabilities.map((vuln, i) => (
          <VulnerabilityCard key={`${vuln.check}-${i}`} vuln={vuln} index={i} />
        ))}
      </div>
    </>
  );
}
