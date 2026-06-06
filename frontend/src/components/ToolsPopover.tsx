import { useEffect, useRef } from "react";

interface ToolsPopoverProps {
  phase: "parse" | "slither";
  position: { x: number; y: number };
  onClose: () => void;
}

type ToolStatus = "active" | "soon";

interface ToolEntry {
  name: string;
  desc: string;
  status: ToolStatus;
  glyph: string;
}

interface ToolsBundle {
  title: string;
  subtitle: string;
  tag: string;
  tools: ToolEntry[];
}

const TOOLS_CONFIG: Record<"parse" | "slither", ToolsBundle> = {
  parse: {
    title: "Structure Analysis",
    subtitle: "Parsing & Code Structure",
    tag: "STAGE / 01",
    tools: [
      {
        name: "Solc AST Parser",
        desc: "Solidity Abstract Syntax Tree parsing",
        status: "active",
        glyph: "AST",
      },
      {
        name: "CFG Generator",
        desc: "Control Flow Graph generation",
        status: "active",
        glyph: "CFG",
      },
      {
        name: "Vyper Parser",
        desc: "Vyper contract support",
        status: "soon",
        glyph: "VYP",
      },
      {
        name: "Custom Plugin",
        desc: "User-defined parsing plugins",
        status: "soon",
        glyph: "EXT",
      },
    ],
  },
  slither: {
    title: "Vulnerability Detection",
    subtitle: "Security Analysis Methods",
    tag: "STAGE / 02",
    tools: [
      {
        name: "Slither",
        desc: "Industry-grade static analysis",
        status: "active",
        glyph: "SLI",
      },
      {
        name: "LLM Detector",
        desc: "AI-powered vulnerability detection",
        status: "active",
        glyph: "LLM",
      },
      {
        name: "Mythril",
        desc: "Symbolic execution analysis",
        status: "soon",
        glyph: "MYT",
      },
      {
        name: "Securify v2",
        desc: "Formal verification",
        status: "soon",
        glyph: "SCF",
      },
      {
        name: "Echidna",
        desc: "Property-based fuzzing",
        status: "soon",
        glyph: "ECH",
      },
    ],
  },
};

export default function ToolsPopover({
  phase,
  position,
  onClose,
}: ToolsPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const bundle = TOOLS_CONFIG[phase];

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    // Defer to avoid immediate close on the same click that opened the popover
    const id = window.setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKey);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Clamp vertical position so the panel never overflows the viewport
  const maxTop = Math.max(
    16,
    typeof window !== "undefined" ? window.innerHeight - 460 : position.y,
  );
  const clampedTop = Math.min(position.y, maxTop);

  const activeCount = bundle.tools.filter((t) => t.status === "active").length;
  const soonCount = bundle.tools.length - activeCount;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={bundle.title}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${clampedTop}px`,
        width: "280px",
      }}
      className="z-[120] tools-popover"
    >
      {/* Connector tick that ties the popover back to the originating PhaseNode */}
      <div className="absolute -left-3 top-6 flex items-center pointer-events-none">
        <div className="h-px w-3 bg-gradient-to-r from-transparent via-indigo-400/50 to-indigo-400/80" />
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
      </div>

      <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0e1a]/95 backdrop-blur-xl shadow-2xl shadow-black/50">
        {/* Diagonal stripe accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(129,140,248,0.4) 0 1px, transparent 1px 9px)",
          }}
        />
        {/* Top glow */}
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-indigo-500/20 blur-3xl rounded-full" />

        {/* Header */}
        <div className="relative px-4 pt-3.5 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono tracking-[0.22em] text-indigo-300/80">
              {bundle.tag}
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-mono tracking-wider text-zinc-500">
              <span className="text-emerald-400">{activeCount}</span>
              <span className="text-zinc-600">/</span>
              <span>{bundle.tools.length}</span>
              <span className="text-zinc-600">ONLINE</span>
            </span>
          </div>
          <h3 className="text-[13px] font-semibold text-white leading-tight tracking-tight">
            {bundle.title}
          </h3>
          <p className="text-[10.5px] text-zinc-500 mt-0.5 font-mono">
            {bundle.subtitle}
          </p>
        </div>

        {/* Tool list */}
        <div className="relative py-2">
          {bundle.tools.map((tool, idx) => (
            <ToolRow key={tool.name} tool={tool} index={idx} />
          ))}
        </div>

        {/* Footer */}
        <div className="relative border-t border-white/[0.06] px-4 py-2.5 flex items-center justify-between bg-black/20">
          <span className="text-[10px] text-zinc-600 italic font-light tracking-wide">
            More tools coming…
          </span>
          <span className="text-[9px] font-mono text-zinc-600 tracking-widest">
            +{soonCount} QUEUED
          </span>
        </div>
      </div>

      <style>{`
        .tools-popover {
          animation: toolsPopIn 200ms cubic-bezier(0.16, 1, 0.3, 1) both;
          transform-origin: left top;
        }
        @keyframes toolsPopIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateX(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateX(0);
          }
        }
        .tools-popover .tool-row {
          animation: toolRowIn 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes toolRowIn {
          from {
            opacity: 0;
            transform: translateX(-6px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .tools-popover .pulse-dot::after {
          content: "";
          position: absolute;
          inset: -3px;
          border-radius: 999px;
          background: rgba(52, 211, 153, 0.4);
          animation: dotPulse 1.8s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.6); }
        }
      `}</style>
    </div>
  );
}

function ToolRow({ tool, index }: { tool: ToolEntry; index: number }) {
  const isActive = tool.status === "active";
  return (
    <div
      className={`tool-row group relative flex items-center gap-3 px-4 py-2 transition-colors ${
        isActive
          ? "hover:bg-white/[0.03] cursor-default"
          : "cursor-not-allowed"
      }`}
      style={{ animationDelay: `${60 + index * 35}ms` }}
    >
      {/* Left rail indicator */}
      <span
        className={`absolute left-0 top-2 bottom-2 w-px ${
          isActive ? "bg-emerald-400/40" : "bg-zinc-700/40"
        }`}
      />

      {/* Status dot */}
      <span className="relative flex items-center justify-center w-2 h-2 shrink-0">
        {isActive ? (
          <span className="pulse-dot relative w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
        )}
      </span>

      {/* Glyph badge */}
      <span
        className={`shrink-0 px-1.5 py-0.5 rounded text-[8.5px] font-mono tracking-wider border ${
          isActive
            ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-300/90"
            : "border-zinc-700/40 bg-zinc-800/40 text-zinc-600"
        }`}
      >
        {tool.glyph}
      </span>

      {/* Name + description */}
      <div className="min-w-0 flex-1">
        <div
          className={`text-[12px] font-medium leading-tight truncate ${
            isActive ? "text-white" : "text-zinc-500"
          }`}
        >
          {tool.name}
        </div>
        <div
          className={`text-[10px] leading-snug truncate mt-0.5 ${
            isActive ? "text-zinc-400" : "text-zinc-600"
          }`}
        >
          {tool.desc}
        </div>
      </div>

      {/* Right side affordance */}
      {isActive ? (
        <svg
          className="w-3 h-3 shrink-0 text-zinc-600 group-hover:text-indigo-300 transition-colors"
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
      ) : (
        <span className="shrink-0 text-[8.5px] font-mono tracking-wider bg-zinc-800/70 text-zinc-500 rounded px-1.5 py-0.5 border border-zinc-700/40">
          SOON
        </span>
      )}
    </div>
  );
}
