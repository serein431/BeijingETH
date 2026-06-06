import { useEffect, useState } from "react";
import type { CfgData, FunctionSources } from "../types";

const MOCK_CASE = "binamon-dos";

interface AnalysisDataState {
  cfgData: CfgData | null;
  functionSources: FunctionSources | null;
  loading: boolean;
  error: string | null;
  caseId: string;
}

/**
 * Loads CFG and per-function source data for the analysis detail page.
 * For now this is wired to a static mock case shipped under public/mock.
 * Swap the fetch URLs once the backend exposes a dedicated endpoint.
 */
export function useAnalysisData(caseId: string = MOCK_CASE): AnalysisDataState {
  const [cfgData, setCfgData] = useState<CfgData | null>(null);
  const [functionSources, setFunctionSources] = useState<FunctionSources | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const base = `/mock/${caseId}`;

    Promise.all([
      fetch(`${base}/cfg.json`).then((r) => {
        if (!r.ok) throw new Error(`cfg.json ${r.status}`);
        return r.json() as Promise<CfgData>;
      }),
      fetch(`${base}/function_sources.json`).then((r) => {
        if (!r.ok) throw new Error(`function_sources.json ${r.status}`);
        return r.json() as Promise<FunctionSources>;
      }),
    ])
      .then(([cfg, sources]) => {
        if (cancelled) return;
        setCfgData(cfg);
        setFunctionSources(sources);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  return { cfgData, functionSources, loading, error, caseId };
}
