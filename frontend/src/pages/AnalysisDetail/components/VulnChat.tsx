import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import Markdown from "react-markdown";
import {
  type AuditContext,
  type ChatMessage,
  useChat,
} from "../../../hooks/useChat";
import type { SlitherVulnerability } from "../types";

interface VulnChatProps {
  vulnerabilities: SlitherVulnerability[];
}

function normalizeImpact(value: string): "High" | "Medium" | "Low" | "Informational" {
  const v = (value || "").trim().toLowerCase();
  if (v === "high") return "High";
  if (v === "medium") return "Medium";
  if (v === "low") return "Low";
  return "Informational";
}

function buildSummary(vulns: SlitherVulnerability[]): string {
  const total = vulns.length;
  if (total === 0) {
    return [
      "### AI Security Advisor",
      "",
      "No vulnerabilities surfaced from the static-analysis sweep.",
      "",
      "Ask me anything about the audit posture, defensive patterns, or how Slither evaluates this contract family.",
    ].join("\n");
  }

  const counts = { High: 0, Medium: 0, Low: 0, Informational: 0 } as Record<
    "High" | "Medium" | "Low" | "Informational",
    number
  >;
  const byCheck = new Map<string, number>();
  vulns.forEach((v) => {
    counts[normalizeImpact(v.impact)] += 1;
    byCheck.set(v.check, (byCheck.get(v.check) || 0) + 1);
  });

  const top = [...byCheck.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([check, n]) => `\`${check}\` (${n})`)
    .join(", ");

  const severityLine = (["High", "Medium", "Low", "Informational"] as const)
    .filter((s) => counts[s] > 0)
    .map((s) => `**${s}** ${counts[s]}`)
    .join(" · ");

  const verdict =
    counts.High > 0
      ? "Critical attention required — high-severity issues detected."
      : counts.Medium > 0
      ? "Moderate exposure — review medium-severity findings before deployment."
      : "Low-risk profile — only informational or low-severity items detected.";

  return [
    "### AI Security Advisor",
    "",
    `Found **${total}** vulnerabilit${total === 1 ? "y" : "ies"} from Slither's static pass.`,
    "",
    `**Severity:** ${severityLine}`,
    "",
    `**Most common:** ${top}`,
    "",
    verdict,
    "",
    "_Ask me to walk through any finding, propose a fix, or explain the underlying anti-pattern._",
  ].join("\n");
}

const WELCOME_ID = "vuln-welcome";

export default function VulnChat({ vulnerabilities }: VulnChatProps) {
  const context = useMemo<AuditContext>(
    () => ({
      findings: vulnerabilities.map((v) => ({
        title: v.check,
        risk: v.impact,
        confidence: v.confidence,
        description: v.description,
        locations: v.locations.map((loc) => ({
          file: loc.file,
          line_start: loc.line_start,
          line_end: loc.line_end,
          label: loc.label,
        })),
      })),
      projectName: "Slither static analysis",
    }),
    [vulnerabilities],
  );

  const chat = useChat(context);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastWelcomeKeyRef = useRef<string | null>(null);

  // Inject summary message whenever the underlying vulnerabilities change.
  useEffect(() => {
    const key = `${vulnerabilities.length}:${vulnerabilities
      .map((v) => v.check)
      .join("|")}`;
    if (lastWelcomeKeyRef.current === key) return;
    lastWelcomeKeyRef.current = key;
    chat.clearMessages();
    const summary: ChatMessage = {
      id: WELCOME_ID,
      role: "assistant",
      content: buildSummary(vulnerabilities),
      timestamp: Date.now(),
    };
    chat.appendAssistantMessage(summary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vulnerabilities]);

  // Auto-scroll on new content
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat.messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [draft]);

  const handleSend = () => {
    const value = draft.trim();
    if (!value || chat.isStreaming) return;
    chat.sendMessage(value);
    setDraft("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const findingsCount = vulnerabilities.length;

  return (
    <section className="vuln-chat" aria-label="AI Security Advisor">
      <header className="vuln-chat__header">
        <span className="vuln-chat__avatar" aria-hidden>
          <BotIcon />
        </span>
        <div className="vuln-chat__title">
          <span className="vuln-chat__title-main">AI Security Advisor</span>
          <span className="vuln-chat__title-sub">
            <span className="vuln-chat__pulse" />
            {chat.isStreaming
              ? "Composing reply…"
              : `${findingsCount} finding${findingsCount === 1 ? "" : "s"} in scope`}
          </span>
        </div>
      </header>

      <div ref={scrollRef} className="vuln-chat__messages">
        {chat.messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
      </div>

      <footer className="vuln-chat__composer">
        <textarea
          ref={textareaRef}
          className="vuln-chat__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about a finding, request a fix, dig deeper…"
          rows={1}
        />
        {chat.isStreaming ? (
          <button
            type="button"
            className="vuln-chat__send vuln-chat__send--stop"
            onClick={chat.stopStreaming}
            aria-label="Stop generating"
            title="Stop"
          >
            <StopIcon />
          </button>
        ) : (
          <button
            type="button"
            className="vuln-chat__send"
            onClick={handleSend}
            disabled={!draft.trim()}
            aria-label="Send message"
            title="Send"
          >
            <ArrowUpIcon />
          </button>
        )}
      </footer>
    </section>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`vuln-chat__msg ${isUser ? "vuln-chat__msg--user" : "vuln-chat__msg--ai"} ${
        message.error ? "vuln-chat__msg--error" : ""
      }`}
    >
      {!isUser && (
        <div className="vuln-chat__msg-avatar" aria-hidden>
          <BotIcon />
        </div>
      )}
      <div className="vuln-chat__msg-bubble">
        {isUser ? (
          <p className="vuln-chat__msg-plain">{message.content}</p>
        ) : (
          <div className="vuln-chat__msg-md">
            <Markdown>{message.content || "…"}</Markdown>
            {message.streaming && <span className="vuln-chat__cursor" aria-hidden />}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Icons ─────────────────────────────────────────────── */

function BotIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="14"
      height="14"
    >
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <path d="M12 3v4M9 12h.01M15 12h.01M9 16h6" />
      <path d="M2 13v3M22 13v3" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="14"
      height="14"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
