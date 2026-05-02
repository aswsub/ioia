import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { AgentView } from "./components/AgentView";
import { OutreachView } from "./components/OutreachView";
import { ProfessorsView } from "./components/ProfessorsView";
import { ComposeView } from "./components/ComposeView";
import { ProfileView } from "./components/ProfileView";
import { OutreachDraft } from "./components/mock-data";

type View = "Overview" | "Outreach" | "Professors" | "Compose" | "Profile";

export default function App() {
  const [activeView, setActiveView] = useState<View>("Overview");
  const [outreachDrafts, setOutreachDrafts] = useState<OutreachDraft[]>([]);

  const handleDraftsReady = (drafts: OutreachDraft[]) => {
    setOutreachDrafts(drafts);
  };

  const handleNavigateToOutreach = () => {
    setActiveView("Outreach");
  };

  const renderView = () => {
    switch (activeView) {
      case "Overview":
        return (
          <AgentView
            onDraftsReady={handleDraftsReady}
            onNavigateToOutreach={handleNavigateToOutreach}
          />
        );
      case "Outreach":
        return (
          <OutreachView
            drafts={outreachDrafts}
            onNavigateToAgent={() => setActiveView("Overview")}
          />
        );
      case "Professors":
        return <ProfessorsView />;
      case "Compose":
        return <ComposeView />;
      case "Profile":
        return <ProfileView onBack={() => setActiveView("Overview")} />;
      default:
        return (
          <AgentView
            onDraftsReady={handleDraftsReady}
            onNavigateToOutreach={handleNavigateToOutreach}
          />
        );
    }
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ fontFamily: "var(--font-sans)", background: "#fafafa" }}
    >
      <Sidebar activeView={activeView} onNavigate={(v) => setActiveView(v as View)} />
      {renderView()}
    </div>
  );
}