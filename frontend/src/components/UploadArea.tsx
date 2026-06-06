import { useCallback, useEffect, useState } from "react";
import type { ExampleCase } from "../types";

interface Props {
  onProjectCreated: (projectId: string) => void;
  onExampleSelected: (caseId: string) => void;
}

export default function UploadArea({
  onProjectCreated,
  onExampleSelected,
}: Props) {
  const [examples, setExamples] = useState<ExampleCase[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/examples")
      .then((r) => r.json())
      .then(setExamples)
      .catch(() => {});
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".zip")) return;
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/projects", { method: "POST", body: form });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        onProjectCreated(data.project_id);
      } finally {
        setUploading(false);
      }
    },
    [onProjectCreated]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 gap-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
          Smart Contract Audit
        </h1>
        <p className="text-zinc-400 text-sm max-w-md">
          Upload a Solidity project or try an example. AI-powered vulnerability
          detection with automated PoC generation.
        </p>
      </div>

      <div
        className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          dragging
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-white/10 hover:border-white/20 bg-white/[0.02]"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".zip";
          input.onchange = () => {
            if (input.files?.[0]) handleUpload(input.files[0]);
          };
          input.click();
        }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-8 h-8 animate-spin text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-zinc-300 text-sm">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-10 h-10 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div>
              <p className="text-zinc-200 font-medium text-sm">
                Drop a .zip Solidity project here
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                or click to browse files
              </p>
            </div>
          </div>
        )}
      </div>

      {examples.length > 0 && (
        <div className="w-full max-w-lg">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3 text-center">
            Or try an example
          </p>
          <div className="grid grid-cols-2 gap-3">
            {examples.map((ex) => (
              <button
                key={ex.case_id}
                onClick={() => onExampleSelected(ex.case_id)}
                className="glass-panel rounded-xl p-4 text-left hover:bg-white/[0.06] transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
                  <span className="text-xs font-mono text-zinc-500">
                    {ex.case_id}
                  </span>
                </div>
                <p className="text-sm text-zinc-200 font-medium group-hover:text-white transition-colors">
                  {ex.title}
                </p>
                {ex.final_verdict && (
                  <span
                    className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded ${
                      ex.final_verdict.includes("Exists")
                        ? "bg-red-500/15 text-red-400"
                        : "bg-emerald-500/15 text-emerald-400"
                    }`}
                  >
                    {ex.final_verdict.includes("Exists")
                      ? "VULNERABLE"
                      : "SAFE"}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
