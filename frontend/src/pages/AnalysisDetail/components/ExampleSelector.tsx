import { AVAILABLE_EXAMPLES } from "../hooks/useAnalysisData";

interface ExampleSelectorProps {
  currentCase: string;
  onChange: (caseId: string) => void;
}

export default function ExampleSelector({
  currentCase,
  onChange,
}: ExampleSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Select audit example"
      className="inline-flex items-center gap-1 p-1 rounded-lg border border-white/[0.06] bg-white/[0.015] backdrop-blur"
    >
      <span className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
        Example
      </span>
      {AVAILABLE_EXAMPLES.map((ex) => {
        const active = ex.id === currentCase;
        return (
          <button
            key={ex.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (!active) onChange(ex.id);
            }}
            title={ex.description}
            className={[
              "px-3 py-1.5 rounded-lg border text-xs transition-all duration-200",
              active
                ? "bg-indigo-500/20 border-indigo-500/50 font-bold text-white shadow-[0_0_24px_-12px_rgba(99,102,241,0.5)]"
                : "bg-white/[0.02] border-white/[0.06] font-semibold text-zinc-300 hover:text-white hover:border-white/[0.18] hover:bg-white/[0.05]",
            ].join(" ")}
          >
            {ex.name}
          </button>
        );
      })}
    </div>
  );
}
