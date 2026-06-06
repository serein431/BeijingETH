import { useCallback, useRef, useState } from "react";
import {
  type AuditState,
  PIPELINE_PHASES,
  type PhaseState,
  type Vulnerability,
} from "../types";

const initialPhases: PhaseState[] = PIPELINE_PHASES.map((p) => ({
  name: p.name,
  label: p.label,
  status: "pending",
  message: "",
}));

const initialState: AuditState = {
  isRunning: false,
  phases: initialPhases,
  streamText: "",
  currentPhase: "",
  findings: [],
  verdict: null,
  verdictMessage: null,
  pocCode: null,
  testOutput: null,
};

export function useAuditStream() {
  const [state, setState] = useState<AuditState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const updatePhase = (name: string, updates: Partial<PhaseState>) => {
    setState((prev) => ({
      ...prev,
      phases: prev.phases.map((p) =>
        p.name === name ? { ...p, ...updates } : p
      ),
    }));
  };

  const startStream = useCallback(async (url: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      ...initialState,
      isRunning: true,
      phases: initialPhases.map((p) => ({ ...p })),
    });

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            dataStr = line.slice(6);
          } else if (line === "" && eventType && dataStr) {
            try {
              const data = JSON.parse(dataStr);
              handleEvent(eventType, data);
            } catch {
              // skip malformed JSON
            }
            eventType = "";
            dataStr = "";
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        streamText:
          prev.streamText +
          `\n\n**Error:** ${err instanceof Error ? err.message : String(err)}`,
      }));
    } finally {
      setState((prev) => ({ ...prev, isRunning: false }));
    }
  }, []);

  function handleEvent(type: string, data: Record<string, unknown>) {
    switch (type) {
      case "phase": {
        const phase = data.phase as string;
        const status = data.status as PhaseState["status"];
        const message = (data.message as string) || "";
        updatePhase(phase, { status, message });
        setState((prev) => ({ ...prev, currentPhase: phase }));
        if (message && status !== "running") {
          setState((prev) => ({
            ...prev,
            streamText: prev.streamText + `\n\n> ${message}\n`,
          }));
        }
        break;
      }
      case "stream": {
        const token = data.token as string;
        setState((prev) => ({
          ...prev,
          streamText: prev.streamText + token,
        }));
        break;
      }
      case "finding": {
        const vuln = data.vulnerability as Vulnerability;
        setState((prev) => ({
          ...prev,
          findings: [...prev.findings, vuln],
        }));
        break;
      }
      case "poc": {
        const code = data.code as string;
        setState((prev) => ({ ...prev, pocCode: code }));
        break;
      }
      case "test": {
        const output = data.output as string;
        setState((prev) => ({ ...prev, testOutput: output }));
        break;
      }
      case "verdict": {
        const verdict = data.verdict as string;
        const message = (data.message as string) || "";
        setState((prev) => ({
          ...prev,
          verdict,
          verdictMessage: message,
          streamText:
            prev.streamText + `\n\n---\n\n**Verdict: ${message}**\n`,
        }));
        break;
      }
      case "error": {
        const phase = data.phase as string;
        const message = (data.message as string) || "";
        updatePhase(phase, { status: "error", message });
        setState((prev) => ({
          ...prev,
          streamText:
            prev.streamText + `\n\n**Error [${phase}]:** ${message}\n`,
        }));
        break;
      }
    }
  }

  const startProjectAudit = useCallback(
    (projectId: string) => {
      startStream(`/api/projects/${projectId}/audit/stream`);
    },
    [startStream]
  );

  const startExampleReplay = useCallback(
    (caseId: string) => {
      startStream(`/api/examples/${caseId}/stream`);
    },
    [startStream]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      ...initialState,
      phases: initialPhases.map((p) => ({ ...p })),
    });
  }, []);

  return { state, startProjectAudit, startExampleReplay, stop, reset };
}
