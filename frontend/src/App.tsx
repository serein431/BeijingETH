import { useCallback, useState } from "react";
import FlowPanel from "./components/FlowPanel";
import Sidebar from "./components/Sidebar";
import StreamPanel from "./components/StreamPanel";
import UploadArea from "./components/UploadArea";
import { useAuditStream } from "./hooks/useAuditStream";

export default function App() {
  const { state, startProjectAudit, startExampleReplay, stop, reset } =
    useAuditStream();
  const [started, setStarted] = useState(false);

  const handleProjectCreated = useCallback(
    (projectId: string) => {
      setStarted(true);
      startProjectAudit(projectId);
    },
    [startProjectAudit]
  );

  const handleExampleSelected = useCallback(
    (caseId: string) => {
      setStarted(true);
      startExampleReplay(caseId);
    },
    [startExampleReplay]
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

      <Sidebar />

      <main className="flex-1 flex relative z-10 min-w-0">
        {!started ? (
          <UploadArea
            onProjectCreated={handleProjectCreated}
            onExampleSelected={handleExampleSelected}
          />
        ) : (
          <>
            <StreamPanel state={state} onStop={stop} onReset={handleReset} />
            <FlowPanel state={state} />
          </>
        )}
      </main>
    </div>
  );
}
