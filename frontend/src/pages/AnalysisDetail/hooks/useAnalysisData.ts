import { useEffect, useState } from "react";
import type {
  CfgData,
  FunctionSources,
  SlitherVulnerability,
} from "../types";

export const AVAILABLE_EXAMPLES = [
  {
    id: "binamon-dos",
    name: "Binamon DoS",
    description: "Denial of Service vulnerability",
  },
  {
    id: "cleverminu-approve-race",
    name: "CleverMinu Approve Race",
    description: "Approve race condition",
  },
] as const;

interface AnalysisDataState {
  cfgData: CfgData | null;
  functionSources: FunctionSources | null;
  slitherResults: SlitherVulnerability[] | null;
  forgeOutput: string | null;
  loading: boolean;
  error: string | null;
  caseId: string;
}

/**
 * Loads CFG, function sources, slither vulnerability results, and forge run
 * output for a given example case. Each fetch is independent so a single
 * failure doesn't block the others.
 */
export function useAnalysisData(caseId: string): AnalysisDataState {
  const [cfgData, setCfgData] = useState<CfgData | null>(null);
  const [functionSources, setFunctionSources] =
    useState<FunctionSources | null>(null);
  const [slitherResults, setSlitherResults] =
    useState<SlitherVulnerability[] | null>(null);
  const [forgeOutput, setForgeOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCfgData(null);
    setFunctionSources(null);
    setSlitherResults(null);
    setForgeOutput(null);

    const base = `/mock/${caseId}`;

    const cfgPromise = fetch(`${base}/cfg.json`).then((r) => {
      if (!r.ok) throw new Error(`cfg.json ${r.status}`);
      return r.json() as Promise<CfgData>;
    });

    const sourcesPromise = fetch(`${base}/function_sources.json`).then((r) => {
      if (!r.ok) throw new Error(`function_sources.json ${r.status}`);
      return r.json() as Promise<FunctionSources>;
    });

    const slitherPromise = fetch(
      `${base}/slither_vul_analysis_result.json`
    ).then((r) => {
      if (!r.ok) throw new Error(`slither_vul_analysis_result.json ${r.status}`);
      return r.json() as Promise<SlitherVulnerability[]>;
    });

    const forgePromise = fetch(`${base}/forge_run_output.txt`).then((r) => {
      if (!r.ok) throw new Error(`forge_run_output.txt ${r.status}`);
      return r.text();
    });

    Promise.allSettled([
      cfgPromise,
      sourcesPromise,
      slitherPromise,
      forgePromise,
    ]).then((results) => {
      if (cancelled) return;

      const [cfgRes, sourcesRes, slitherRes, forgeRes] = results;
      const failures: string[] = [];

      if (cfgRes.status === "fulfilled") setCfgData(cfgRes.value);
      else failures.push(String(cfgRes.reason));

      if (sourcesRes.status === "fulfilled")
        setFunctionSources(sourcesRes.value);
      else failures.push(String(sourcesRes.reason));

      if (slitherRes.status === "fulfilled")
        setSlitherResults(slitherRes.value);
      else failures.push(String(slitherRes.reason));

      if (forgeRes.status === "fulfilled") setForgeOutput(forgeRes.value);
      else failures.push(String(forgeRes.reason));

      if (failures.length === results.length) {
        setError(failures.join("; "));
      } else if (failures.length > 0) {
        // Partial failure: surface a non-blocking message but keep usable data.
        setError(failures.join("; "));
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  return {
    cfgData,
    functionSources,
    slitherResults,
    forgeOutput,
    loading,
    error,
    caseId,
  };
}
