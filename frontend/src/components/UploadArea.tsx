import { useCallback, useRef, useState } from "react";
import { createTranslator } from "../i18n";
import type { AuditMode, Language, ProjectSummary } from "../types";

interface Props {
  auditMode: AuditMode;
  language: Language;
  onAuditModeChange: (mode: AuditMode) => void;
  onProjectCreated: (replayCase: string | null) => void;
}

export default function UploadArea({
  auditMode,
  language,
  onAuditModeChange,
  onProjectCreated,
}: Props) {
  const t = createTranslator(language);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [findingText, setFindingText] = useState("");

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".zip")) return;
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/projects", { method: "POST", body: form });
        if (!res.ok) throw new Error("Upload failed");
        const project = (await res.json()) as ProjectSummary;
        onProjectCreated(project.replay_case);
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

  const metrics = [
    [t("home.metric.modeLabel"), t("home.metric.modeValue")],
    [t("home.metric.stackLabel"), t("home.metric.stackValue")],
    [t("home.metric.outputLabel"), t("home.metric.outputValue")],
  ];

  const workflow =
    auditMode === "verify_finding"
      ? [
          {
            title: t("home.verifyWorkflow.projectTitle"),
            text: t("home.verifyWorkflow.projectText"),
            accent: "from-cyan-300 to-sky-500",
          },
          {
            title: t("home.verifyWorkflow.reportTitle"),
            text: t("home.verifyWorkflow.reportText"),
            accent: "from-amber-300 to-orange-500",
          },
          {
            title: t("home.verifyWorkflow.proofTitle"),
            text: t("home.verifyWorkflow.proofText"),
            accent: "from-emerald-300 to-lime-500",
          },
        ]
      : [
          {
            title: t("home.workflow.parseTitle"),
            text: t("home.workflow.parseText"),
            accent: "from-cyan-300 to-sky-500",
          },
          {
            title: t("home.workflow.detectTitle"),
            text: t("home.workflow.detectText"),
            accent: "from-violet-300 to-indigo-500",
          },
          {
            title: t("home.workflow.reportTitle"),
            text: t("home.workflow.reportText"),
            accent: "from-emerald-300 to-lime-500",
          },
        ];

  const valuePoints = [
    t("home.value.scan"),
    t("home.value.llm"),
    auditMode === "verify_finding"
      ? t("home.value.foundry")
      : t("home.value.report"),
  ];

  const modes: Array<{
    id: AuditMode;
    title: string;
    kicker: string;
    text: string;
  }> = [
    {
      id: "discover_only",
      title: t("mode.discovery.title"),
      kicker: t("mode.discovery.kicker"),
      text: t("mode.discovery.text"),
    },
    {
      id: "verify_finding",
      title: t("mode.verify.title"),
      kicker: t("mode.verify.kicker"),
      text: t("mode.verify.text"),
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 lg:px-12">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col justify-center gap-6">
        <section className="relative max-w-5xl">
          <div className="relative">
            <div className="absolute -left-10 top-4 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
              {t("upload.eyebrow")}
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white md:text-6xl">
              {t("upload.title")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
              {t("upload.subtitle")}
            </p>

            <div className="mt-6 grid max-w-2xl grid-cols-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
              {metrics.map(([label, value]) => (
                <div
                  key={label}
                  className="flex min-h-[92px] flex-col justify-between border-r border-white/[0.06] px-4 py-3.5 last:border-r-0"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
                    {label}
                  </p>
                  <p className="mt-3 text-sm font-semibold leading-snug text-zinc-100">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-white/[0.07] bg-white/[0.025] p-4 lg:p-5">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                {language === "zh" ? "操作台" : "Operation Desk"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {language === "zh"
                  ? "先选择审计入口，再上传项目"
                  : "Choose an audit path, then upload the project"}
              </h2>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                {t("upload.live")}
              </span>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                {language === "zh" ? "1. 选择模式" : "1. Select mode"}
              </p>
              <div className="grid gap-3">
                {modes.map((mode) => {
                  const selected = auditMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => onAuditModeChange(mode.id)}
                      className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                        selected
                          ? "border-cyan-300/45 bg-cyan-300/[0.07] shadow-[0_0_35px_rgba(103,232,249,0.08)]"
                          : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.16] hover:bg-white/[0.045]"
                      }`}
                    >
                      <div
                        className={`mb-3 h-1 w-14 rounded-full bg-gradient-to-r ${
                          mode.id === "discover_only"
                            ? "from-cyan-300 to-indigo-400"
                            : "from-emerald-300 to-cyan-400"
                        }`}
                      />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                        {mode.kicker}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {mode.title}
                      </h3>
                      <p className="mt-2 text-xs leading-5 text-zinc-500">
                        {mode.text}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  {language === "zh" ? "2. 上传项目" : "2. Upload project"}
                </p>
                <p className="text-[11px] font-semibold text-zinc-500">
                  {t("upload.cardSub")}
                </p>
              </div>

              <input
                ref={inputRef}
                data-testid="project-zip-input"
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(event) => {
                  if (event.target.files?.[0]) handleUpload(event.target.files[0]);
                  event.target.value = "";
                }}
              />

              <div
                className={`group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed p-8 text-center transition-all ${
                  dragging
                    ? "border-cyan-300 bg-cyan-300/10"
                    : "border-white/15 bg-white/[0.025] hover:border-cyan-300/45 hover:bg-cyan-300/[0.04]"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_0_35px_rgba(103,232,249,0.08)]">
                  <svg
                    className={`h-8 w-8 text-cyan-200 ${
                      uploading ? "animate-spin" : ""
                    }`}
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
                </div>
                <p className="text-base font-semibold text-zinc-100">
                  {uploading ? t("upload.uploading") : t("upload.drop")}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {t("upload.browse")}
                </p>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  {t("upload.hint")}
                </p>
              </div>

              {auditMode === "verify_finding" && (
                <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                  <label
                    htmlFor="finding-description"
                    className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500"
                  >
                    {language === "zh" ? "3. " : "3. "}
                    {t("report.label")}
                  </label>
                  <textarea
                    id="finding-description"
                    value={findingText}
                    onChange={(event) => setFindingText(event.target.value)}
                    placeholder={t("report.placeholder")}
                    className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-3 text-sm leading-6 text-zinc-200 outline-none transition-all placeholder:text-zinc-700 focus:border-cyan-300/35 focus:bg-cyan-300/[0.035]"
                  />
                  <p className="mt-2 text-[11px] leading-5 text-zinc-600">
                    {t("report.helper")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-400">
              {t("home.workflow.title")}
            </h2>
            <div className="hidden h-px flex-1 bg-gradient-to-r from-white/[0.12] to-transparent sm:block" />
          </div>

          <div className="grid items-stretch gap-3 md:grid-cols-3">
            {workflow.map((step) => (
              <div
                key={step.title}
                className="relative flex min-h-[170px] flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-black/20 p-4"
              >
                <div
                  className={`mb-4 h-1 w-16 rounded-full bg-gradient-to-r ${step.accent}`}
                />
                <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {valuePoints.map((point) => (
              <span
                key={point}
                className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400"
              >
                {point}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
