export interface ContractMeta {
  name: string;
  functions: string[];
}

export interface CallGraphEntry {
  source_code: string;
  contract: string;
  function: string;
  full_name: string;
  signature: string;
  lines: number[];
  file: string;
  called_by: string[];
  calls: string[];
  is_modifier: boolean;
}

export interface CfgData {
  solc_constraint: string;
  solc_version: string;
  base_dir?: string;
  contracts: ContractMeta[];
  public_state_variables: string[];
  call_graph: Record<string, CallGraphEntry>;
}

export interface FunctionSource {
  contract: string;
  function: string;
  full_name: string;
  signature: string;
  file: string;
  lines: number[];
  source_code: string;
}

export type FunctionSources = Record<string, FunctionSource>;

export type AnalysisTab = "detail" | "graph";
