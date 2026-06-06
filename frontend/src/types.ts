export type PhaseStatus =
  | "pending"
  | "running"
  | "completed"
  | "skipped"
  | "retrying"
  | "error";

export type Language = "en" | "zh";
export type AuditMode = "discover_only" | "verify_finding";

export interface PhaseState {
  name: string;
  label: string;
  status: PhaseStatus;
  message: string;
}

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  risk: string;
  contract?: string;
  function?: string;
  location?: string;
}

export interface AuditState {
  isRunning: boolean;
  phases: PhaseState[];
  streamText: string;
  currentPhase: string;
  findings: Vulnerability[];
  verdict: string | null;
  verdictMessage: string | null;
  pocCode: string | null;
  testOutput: string | null;
}

export const PIPELINE_PHASES = [
  { name: "parse", label: "Parse Structure" },
  { name: "slither", label: "Slither Analysis" },
  { name: "llm_audit", label: "LLM Audit" },
  { name: "poc_gen", label: "PoC Generation" },
  { name: "forge_test", label: "Forge Test" },
] as const;

export interface ExampleCase {
  case_id: string;
  title: string;
  description: string;
  final_verdict: string | null;
}

export interface ProjectSummary {
  project_id: string;
  name: string;
  status: string;
  root: string;
  files: string[];
  replay_case: string | null;
}
