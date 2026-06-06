import { useCallback, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import FlowPanel from "./components/FlowPanel";
import LandingPage from "./components/LandingPage";
import Sidebar from "./components/Sidebar";
import StreamPanel from "./components/StreamPanel";
import UploadArea from "./components/UploadArea";
import { useAuditStream } from "./hooks/useAuditStream";
import AnalysisDetail from "./pages/AnalysisDetail";
import type { AuditMode, Language } from "./types";

const DEFAULT_REPLAY_CASE = "binamon-dos";

function MainApp() {
  const { state, startExampleReplay, stop, reset } = useAuditStream();
  const [enteredApp, setEnteredApp] = useState(false);
  const [started, setStarted] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [auditMode, setAuditMode] = useState<AuditMode>("discover_only");

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

  if (!enteredApp) {
    return (
      <LandingPage
        language={language}
        onEnterApp={() => setEnteredApp(true)}
        onToggleLanguage={handleToggleLanguage}
      />
    );
  }

  return (
    <div className="audit-workbench flex h-screen w-screen overflow-hidden">
      <div className="audit-workbench-grid" />
      <div className="audit-workbench-orb audit-workbench-orb-a" />
      <div className="audit-workbench-orb audit-workbench-orb-b" />

      <Sidebar
        language={language}
        showAnalysis={started}
        onToggleLanguage={handleToggleLanguage}
      />

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
