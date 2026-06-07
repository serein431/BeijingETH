import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Markdown from "react-markdown";
import {
  type AuditContext,
  type ChatMessage,
  useChat,
} from "../hooks/useChat";

interface ChatDrawerProps {
  context: AuditContext;
  isAuditComplete: boolean;
}

const WELCOME_ID = "welcome";

function buildWelcomeMessage(context: AuditContext): ChatMessage {
  const findingsCount = context.findings?.length ?? 0;
  const project = context.projectName || "this project";
  const findingsLine =
    findingsCount > 0
      ? `I traced **${findingsCount}** potential vulnerabilit${findingsCount === 1 ? "y" : "ies"} across the audit pipeline.`
      : `The discovery pass has wrapped up — no high-confidence findings surfaced for **${project}**.`;
  return {
    id: WELCOME_ID,
    role: "assistant",
    content: [
      `### Audit assistant online`,
      ``,
      findingsLine,
      ``,
      `Ask me anything about:`,
      `- Attack paths & exploit traces`,
      `- Remediation patterns and code-level fixes`,
      `- Risk severity rationales and best practices`,
      ``,
      `_Where shall we start?_`,
    ].join("\n"),
    timestamp: Date.now(),
  };
}

export default function ChatDrawer({
  context,
  isAuditComplete,
}: ChatDrawerProps) {
  const chat = useChat(context);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInjectedWelcomeRef = useRef(false);

  // Inject welcome message once when audit completes & no messages yet
  useEffect(() => {
    if (
      isAuditComplete &&
      !hasInjectedWelcomeRef.current &&
      chat.messages.length === 0
    ) {
      chat.appendAssistantMessage(buildWelcomeMessage(context));
      hasInjectedWelcomeRef.current = true;
    }
  }, [isAuditComplete, chat, context]);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !open) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat.messages, open]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [draft]);

  // Focus textarea when opening
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => textareaRef.current?.focus(), 320);
      return () => window.clearTimeout(t);
    }
  }, [open]);

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

  const findingsCount = context.findings?.length ?? 0;
  const subtitle = useMemo(() => {
    if (chat.isStreaming) return "Composing reply…";
    if (chat.messages.length > 0) return `${chat.messages.length} messages`;
    return findingsCount > 0
      ? `${findingsCount} finding${findingsCount === 1 ? "" : "s"} loaded`
      : "Standing by";
  }, [chat.isStreaming, chat.messages.length, findingsCount]);

  return (
    <>
      {/* Backdrop fade when open (purely visual, doesn't block clicks) */}
      <div
        className={`chat-drawer__backdrop ${open ? "is-open" : ""}`}
        aria-hidden
      />

      {/* Drawer shell */}
      <section
        className={`chat-drawer ${open ? "is-open" : "is-closed"}`}
        role="dialog"
        aria-label="AI Audit Assistant"
        aria-expanded={open}
      >
        {!open ? (
          <button
            type="button"
            className="chat-drawer__trigger"
            onClick={() => setOpen(true)}
          >
            <span className="chat-drawer__trigger-glyph">
              <SparkIcon />
            </span>
            <span className="chat-drawer__trigger-label">
              <span className="chat-drawer__trigger-eyebrow">
                AI · Audit Assistant
              </span>
              <span className="chat-drawer__trigger-text">
                {isAuditComplete
                  ? "Ask anything about the findings"
                  : "Available once the pipeline completes"}
              </span>
            </span>
            <span className="chat-drawer__trigger-cta">
              <span>Ask AI</span>
              <ArrowUpIcon />
            </span>
          </button>
        ) : (
          <div className="chat-drawer__panel">
            <header className="chat-drawer__header">
              <div className="chat-drawer__handle" aria-hidden />
              <div className="chat-drawer__title-row">
                <div className="chat-drawer__title-left">
                  <span className="chat-drawer__avatar">
                    <SparkIcon />
                  </span>
                  <div className="chat-drawer__title-text">
                    <span className="chat-drawer__title-main">
                      AI Audit Assistant
                    </span>
                    <span className="chat-drawer__title-sub">
                      <span className="chat-drawer__pulse" />
                      Hunyuan · {subtitle}
                    </span>
                  </div>
                </div>
                <div className="chat-drawer__actions">
                  <button
                    type="button"
                    className="chat-drawer__icon-btn"
                    onClick={() => {
                      hasInjectedWelcomeRef.current = false;
                      chat.clearMessages();
                    }}
                    title="Clear conversation"
                  >
                    <TrashIcon />
                    <span>Clear</span>
                  </button>
                  <button
                    type="button"
                    className="chat-drawer__icon-btn chat-drawer__icon-btn--close"
                    onClick={() => setOpen(false)}
                    title="Minimize"
                    aria-label="Minimize chat"
                  >
                    <ChevronDownIcon />
                  </button>
                </div>
              </div>
            </header>

            <div ref={scrollRef} className="chat-drawer__messages">
              {chat.messages.length === 0 ? (
                <EmptyState isAuditComplete={isAuditComplete} />
              ) : (
                chat.messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))
              )}
            </div>

            <footer className="chat-drawer__composer">
              <div className="chat-drawer__composer-inner">
                <textarea
                  ref={textareaRef}
                  className="chat-drawer__input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isAuditComplete
                      ? "Ask about this audit…  (Enter to send · Shift+Enter for newline)"
                      : "Audit still running. Chat opens for follow-up questions."
                  }
                  rows={1}
                />
                {chat.isStreaming ? (
                  <button
                    type="button"
                    className="chat-drawer__send chat-drawer__send--stop"
                    onClick={chat.stopStreaming}
                    title="Stop"
                    aria-label="Stop generating"
                  >
                    <StopIcon />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="chat-drawer__send"
                    onClick={handleSend}
                    disabled={!draft.trim()}
                    title="Send"
                    aria-label="Send message"
                  >
                    <ArrowUpIcon />
                  </button>
                )}
              </div>
              <div className="chat-drawer__composer-meta">
                <span>
                  Context bound · {findingsCount} finding
                  {findingsCount === 1 ? "" : "s"}
                  {context.projectName ? ` · ${context.projectName}` : ""}
                </span>
                <span className="chat-drawer__hint">⌘ ENTER to send</span>
              </div>
            </footer>
          </div>
        )}
      </section>
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`chat-msg ${isUser ? "chat-msg--user" : "chat-msg--ai"} ${message.error ? "chat-msg--error" : ""}`}
    >
      {!isUser && (
        <div className="chat-msg__avatar">
          <SparkIcon />
        </div>
      )}
      <div className="chat-msg__bubble">
        {isUser ? (
          <p className="chat-msg__plain">{message.content}</p>
        ) : (
          <div className="chat-msg__markdown">
            <Markdown>{message.content || "…"}</Markdown>
            {message.streaming && (
              <span className="chat-msg__cursor" aria-hidden />
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="chat-msg__avatar chat-msg__avatar--user">
          <UserIcon />
        </div>
      )}
    </div>
  );
}

function EmptyState({ isAuditComplete }: { isAuditComplete: boolean }) {
  const suggestions = isAuditComplete
    ? [
        "Walk me through the highest-severity finding",
        "Suggest a remediation patch",
        "Explain the attack path step by step",
      ]
    : [
        "What does the parser do first?",
        "Summarize the pipeline stages",
        "How is severity assigned?",
      ];
  return (
    <div className="chat-drawer__empty">
      <div className="chat-drawer__empty-glyph">
        <SparkIcon />
      </div>
      <h3>Smart Audit Co-pilot</h3>
      <p>
        Wired into the live audit context — findings, phases, and the running
        narrative. Ask anything.
      </p>
      <div className="chat-drawer__suggestions">
        {suggestions.map((s) => (
          <span key={s} className="chat-drawer__suggestion">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Inline icons ─────────────────────────────────────────────── */

function SparkIcon() {
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
      <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M5.6 5.6l2.4 2.4M16 16l2.4 2.4M5.6 18.4 8 16M16 8l2.4-2.4" />
      <circle cx="12" cy="12" r="3" />
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

function ChevronDownIcon() {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="13"
      height="13"
    >
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
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

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="13"
      height="13"
    >
      <path d="M20 21a8 8 0 1 0-16 0" />
      <circle cx="12" cy="8" r="5" />
    </svg>
  );
}
