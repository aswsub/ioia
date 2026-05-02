import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { AgentView } from "./components/AgentView";
import { OutreachView } from "./components/OutreachView";
import { OutreachDetailView } from "./components/OutreachDetailView";
import { ProfessorsView } from "./components/ProfessorsView";
import { ProfileView } from "./components/ProfileView";
import { OutreachDraft } from "./components/mock-data";

type View = "Overview" | "Outreach" | "Professors" | "Profile";
type DraftWithStatus = OutreachDraft & { status: "draft" | "sent" };

export default function App() {
  const [activeView, setActiveView] = useState<View>("Overview");
  const [outreachDrafts, setOutreachDrafts] = useState<OutreachDraft[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, "draft" | "sent">>({});
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  const handleDraftsReady = (drafts: OutreachDraft[]) => {
    setOutreachDrafts(drafts);
  };

  const handleNavigateToOutreach = () => {
    setSelectedDraftId(null);
    setActiveView("Outreach");
  };

  const handleSend = (id: string) => {
    setDraftStatuses((prev) => ({ ...prev, [id]: "sent" }));
  };

  const handleDiscard = (id: string) => {
    setOutreachDrafts((prev) => prev.filter((d) => d.id !== id));
    setDraftStatuses((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  const draftsWithStatus: DraftWithStatus[] = outreachDrafts.map((d) => ({
    ...d,
    status: draftStatuses[d.id] ?? "draft",
  }));

  const selectedDraft = selectedDraftId ? draftsWithStatus.find((d) => d.id === selectedDraftId) ?? null : null;

  const renderView = () => {
    // Detail page — full screen, replaces outreach list
    if (activeView === "Outreach" && selectedDraft) {
      return (
        <OutreachDetailView
          draft={selectedDraft}
          onBack={() => setSelectedDraftId(null)}
          onSend={handleSend}
          onDiscard={handleDiscard}
        />
      );
    }

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
            drafts={draftsWithStatus}
            onSelectDraft={(id) => setSelectedDraftId(id)}
            onNavigateToAgent={() => setActiveView("Overview")}
            onSend={handleSend}
            onDiscard={handleDiscard}
          />
        );
      case "Professors":
        return <ProfessorsView />;
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
      <Sidebar activeView={activeView} onNavigate={(v) => { setSelectedDraftId(null); setActiveView(v as View); }} />
      {renderView()}
    </div>
  );
}