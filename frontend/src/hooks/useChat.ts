import { useCallback, useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  streaming?: boolean;
  error?: boolean;
}

export interface AuditContext {
  findings?: unknown[];
  phases?: unknown[];
  streamText?: string;
  projectName?: string;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (content: string) => void;
  stopStreaming: () => void;
  clearMessages: () => void;
  appendAssistantMessage: (message: ChatMessage) => void;
}

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export function useChat(context: AuditContext): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const contextRef = useRef(context);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)),
    );
  }, []);

  const appendAssistantMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      // Snapshot current history + append new user message synchronously
      const userMsg: ChatMessage = {
        id: newId(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      const assistantId = newId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        streaming: true,
      };

      const historyForRequest: ChatMessage[] = [
        ...messagesRef.current.filter((m) => !m.streaming),
        userMsg,
      ];
      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;
      setIsStreaming(true);

      const updateAssistant = (
        updater: (msg: ChatMessage) => Partial<ChatMessage>,
      ) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, ...updater(m) } : m,
          ),
        );
      };

      const run = async () => {
        try {
          const requestBody = {
            messages: historyForRequest.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            context: contextRef.current,
          };

          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            throw new Error(`HTTP ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let done = false;

          while (!done) {
            const chunk = await reader.read();
            if (chunk.done) {
              done = true;
              break;
            }

            buffer += decoder.decode(chunk.value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const rawLine of lines) {
              const line = rawLine.trimEnd();
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6);
              if (data === "[DONE]") {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (typeof parsed.token === "string") {
                  updateAssistant((msg) => ({
                    content: msg.content + parsed.token,
                  }));
                }
                if (parsed.error) {
                  updateAssistant(() => ({
                    content: `⚠️ ${parsed.error}`,
                    streaming: false,
                    error: true,
                  }));
                  done = true;
                }
              } catch {
                // ignore malformed json line
              }
            }
          }

          updateAssistant(() => ({ streaming: false }));
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            updateAssistant(() => ({ streaming: false }));
            return;
          }
          updateAssistant((msg) => ({
            content:
              msg.content ||
              `⚠️ ${err instanceof Error ? err.message : "Request failed"}`,
            streaming: false,
            error: true,
          }));
        } finally {
          if (abortRef.current === controller) {
            abortRef.current = null;
          }
          setIsStreaming(false);
        }
      };

      void run();
    },
    [],
  );

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    clearMessages,
    appendAssistantMessage,
  };
}
