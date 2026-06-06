interface FunctionMetaProps {
  signature: string;
  contractName: string;
  functionName: string;
  fullName: string;
  file: string;
  lines: number[];
  calledBy: string[];
  calls: string[];
  isModifier: boolean;
  onJump?: (signature: string) => void;
}

function lineRangeLabel(lines: number[]): string {
  if (!lines || lines.length === 0) return "—";
  const first = lines[0];
  const last = lines[lines.length - 1];
  if (first === last) return `L${first}`;
  return `L${first}–${last}`;
}

function shortName(sig: string): string {
  // Render "Contract.func(args)" → "Contract.func"
  const parenIdx = sig.indexOf("(");
  if (parenIdx === -1) return sig;
  return sig.slice(0, parenIdx);
}

function IconFile() {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function IconLines() {
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
      <path d="M3 6h18M3 12h12M3 18h18" />
    </svg>
  );
}

function IconContract() {
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
      <path d="M3 21V7l9-4 9 4v14" />
      <path d="M9 21V11h6v10" />
    </svg>
  );
}

function IconArrowOut() {
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
      aria-hidden
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function IconArrowIn() {
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
      aria-hidden
    >
      <path d="M17 7 7 17" />
      <path d="M17 17H7V7" />
    </svg>
  );
}

function MetaField({
  icon,
  label,
  value,
  mono = false,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  title?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-1.5 text-zinc-500">
        <span className="text-zinc-600">{icon}</span>
        <span className="text-[10px] uppercase tracking-[0.22em]">{label}</span>
      </div>
      <div
        className={`text-[12.5px] text-zinc-200 truncate ${
          mono ? "font-mono" : ""
        }`}
        title={title ?? value}
      >
        {value}
      </div>
    </div>
  );
}

function CallPill({
  signature,
  onClick,
}: {
  signature: string;
  onClick?: (sig: string) => void;
}) {
  const interactive = !!onClick;
  return (
    <button
      type="button"
      onClick={() => onClick?.(signature)}
      disabled={!interactive}
      title={signature}
      className={`group inline-flex items-center gap-1 max-w-full px-2 py-1 rounded-md text-[11px] font-mono border transition-all duration-150 ${
        interactive
          ? "bg-zinc-800/60 border-white/[0.06] text-zinc-300 hover:bg-zinc-700/70 hover:border-indigo-400/40 hover:text-indigo-200 cursor-pointer"
          : "bg-zinc-800/40 border-white/[0.04] text-zinc-400 cursor-default"
      }`}
    >
      <span className="truncate">{shortName(signature)}</span>
      {interactive && (
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-300">
          <IconArrowOut />
        </span>
      )}
    </button>
  );
}

function CallSection({
  title,
  count,
  icon,
  items,
  empty,
  onClick,
  accent,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  items: string[];
  empty: string;
  onClick?: (sig: string) => void;
  accent: "indigo" | "emerald";
}) {
  const accentDot =
    accent === "indigo" ? "bg-indigo-400/80" : "bg-emerald-400/80";
  const accentText =
    accent === "indigo" ? "text-indigo-300/80" : "text-emerald-300/80";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${accentDot}`} />
          <span className={`text-zinc-500 ${accentText}`}>{icon}</span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
            {title}
          </span>
        </div>
        <span className="font-mono text-[10px] text-zinc-500">
          {count.toString().padStart(2, "0")}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="text-[11px] font-mono text-zinc-600 italic pl-3.5">
          {empty}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 pl-3.5">
          {items.map((sig) => (
            <CallPill key={sig} signature={sig} onClick={onClick} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FunctionMeta({
  signature,
  contractName,
  functionName,
  fullName,
  file,
  lines,
  calledBy,
  calls,
  isModifier,
  onJump,
}: FunctionMetaProps) {
  const fileShort = file?.split("/").pop() ?? file ?? "—";

  return (
    <div className="relative bg-white/[0.02] rounded-xl border border-white/[0.06] backdrop-blur-sm overflow-hidden">
      {/* Subtle decorative gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(99,102,241,0.10), transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative p-5 space-y-5">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            <span className="font-mono text-indigo-300/70">▸</span>
            <span>Function</span>
            <span className="font-mono text-zinc-700">·</span>
            <span className="font-mono text-zinc-500 normal-case tracking-normal">
              {contractName}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white font-mono leading-tight break-all">
              <span className="text-zinc-500">{contractName}</span>
              <span className="text-zinc-600">.</span>
              <span>{functionName}</span>
            </h2>
            {isModifier && (
              <span className="text-[10px] uppercase tracking-[0.18em] bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full px-2 py-0.5 font-mono">
                modifier
              </span>
            )}
            <span className="text-[10px] uppercase tracking-[0.18em] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full px-2 py-0.5 font-mono">
              {fullName}
            </span>
          </div>

          <div
            className="text-[11.5px] font-mono text-zinc-400 break-all bg-black/30 border border-white/[0.04] rounded-md px-3 py-2"
            title={signature}
          >
            <span className="text-zinc-600 select-none">sig » </span>
            {signature}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetaField
            icon={<IconFile />}
            label="File"
            value={fileShort}
            title={file}
            mono
          />
          <MetaField
            icon={<IconLines />}
            label="Lines"
            value={lineRangeLabel(lines)}
            mono
          />
          <MetaField
            icon={<IconContract />}
            label="Contract"
            value={contractName}
            mono
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Call relations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CallSection
            title="Calls"
            count={calls.length}
            icon={<IconArrowOut />}
            items={calls}
            empty="None"
            onClick={onJump}
            accent="indigo"
          />
          <CallSection
            title="Called By"
            count={calledBy.length}
            icon={<IconArrowIn />}
            items={calledBy}
            empty="None"
            onClick={onJump}
            accent="emerald"
          />
        </div>
      </div>
    </div>
  );
}
