import { useCallback, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import FlowPanel from "./components/FlowPanel";
import Sidebar from "./components/Sidebar";
import StreamPanel from "./components/StreamPanel";
import UploadArea from "./components/UploadArea";
import { useAuditStream } from "./hooks/useAuditStream";
import AnalysisDetail from "./pages/AnalysisDetail";
import type { AuditMode, Language } from "./types";

const DEFAULT_REPLAY_CASE = "binamon-dos";

function MainApp() {
  const { state, startExampleReplay, stop, reset } = useAuditStream();
  const [started, setStarted] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [auditMode, setAuditMode] = useState<AuditMode>("full_audit");

  const handleToggleLanguage = useCallback(() => {
    setLanguage((current) => (current === "en" ? "zh" : "en"));
  }, []);

  const handleProjectCreated = useCallback(
    (replayCase: string | null) => {
      setStarted(true);
      startExampleReplay(replayCase || DEFAULT_REPLAY_CASE, auditMode);
    },
    [auditMode, startExampleReplay]
  );

  const handleReset = useCallback(() => {
    reset();
    setStarted(false);
  }, [reset]);

  return (
    <div className="flex h-screen w-screen bg-[#030303] overflow-hidden">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[60%] bg-indigo-900/20 rounded-full blur-[160px] pointer-events-none mix-blend-screen z-0" />
      <div className="fixed bottom-[-20%] right-[10%] w-[40%] h-[50%] bg-emerald-900/10 rounded-full blur-[140px] pointer-events-none mix-blend-screen z-0" />
      <div className="fixed top-[20%] right-[-10%] w-[30%] h-[40%] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none mix-blend-screen z-0" />

      <Sidebar language={language} onToggleLanguage={handleToggleLanguage} />

      <main className="flex-1 flex relative z-10 min-w-0">
        {!started ? (
          <UploadArea
            auditMode={auditMode}
            language={language}
            onAuditModeChange={setAuditMode}
            onProjectCreated={handleProjectCreated}
          />
        ) : (
          <>
            <StreamPanel
              language={language}
              state={state}
              onStop={stop}
              onReset={handleReset}
            />
            <FlowPanel language={language} state={state} />
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/analysis" element={<AnalysisDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
