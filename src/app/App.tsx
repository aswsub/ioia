import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { AgentView } from "./components/AgentView";
import { OutreachView } from "./components/OutreachView";
import { OutreachDetailView } from "./components/OutreachDetailView";
import { ProfessorsView } from "./components/ProfessorsView";
import { ProfileView } from "./components/ProfileView";
import { OutreachDraft } from "./components/mock-data";
import {
  loadOutreachDrafts,
  saveDraft,
  updateDraftStatus,
  deleteDraft,
  loadConversations,
  deleteConversation,
  type DbConversation,
} from "../lib/db";

type View = "Overview" | "Outreach" | "Professors" | "Profile";
type DraftWithStatus = OutreachDraft & { status: "draft" | "sent" };

function initialView(): View {
  if (typeof window === "undefined") return "Overview";
  const view = new URLSearchParams(window.location.search).get("view");
  return view === "Outreach" || view === "Professors" || view === "Profile" ? view : "Overview";
}

export default function App() {
  const [activeView, setActiveView] = useState<View>(initialView);
  const [outreachDrafts, setOutreachDrafts] = useState<OutreachDraft[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, "draft" | "sent">>({});
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  // Conversation state — lifted out of AgentView so the Sidebar can render the
  // chat list. AgentView still owns per-conversation messages.
  const [conversations, setConversations] = useState<DbConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  // Load persisted drafts on mount
  useEffect(() => {
    loadOutreachDrafts().then((rows) => {
      if (rows.length === 0) return;
      const drafts: OutreachDraft[] = rows.map((r) => ({
        id: r.id,
        professor: {
          name: r.professor.name,
          title: r.professor.title ?? "",
          university: r.professor.institution,
          department: r.professor.department,
          research: r.professor.research,
          email: r.professor.email ?? "",
          color: r.professor.color ?? "#f5f5f5",
          openAlexId: r.professor.id?.startsWith("https://openalex.org/A") ? r.professor.id : null,
          homepage: null,
          recentPapers: [],
        },
        subject: r.subject,
        body: r.body,
        matchScore: r.match_score,
      }));
      const statuses: Record<string, "draft" | "sent"> = {};
      rows.forEach((r) => { statuses[r.id] = r.status; });
      setOutreachDrafts(drafts);
      setDraftStatuses(statuses);
    });
  }, []);

  // Load conversation list on mount
  useEffect(() => {
    loadConversations().then((convs) => {
      setConversations(convs);
      if (convs.length > 0) setActiveConvId(convs[0].id);
    });
  }, []);

  const handleDraftsReady = (drafts: OutreachDraft[]) => {
    // Merge in new drafts instead of replacing (so older drafts don't "disappear" until refresh).
    setOutreachDrafts((prev) => {
      const byId = new Map<string, OutreachDraft>();
      prev.forEach((d) => byId.set(d.id, d));
      drafts.forEach((d) => byId.set(d.id, d));
      return Array.from(byId.values());
    });
    // Persist each new draft
    drafts.forEach((d) => saveDraft(d, "draft"));
  };

  const handleNavigateToOutreach = () => {
    setSelectedDraftId(null);
    setActiveView("Outreach");
  };

  const handleSend = (id: string) => {
    setDraftStatuses((prev) => ({ ...prev, [id]: "sent" }));
    updateDraftStatus(id, "sent");
  };

  const handleDiscard = (id: string) => {
    setOutreachDrafts((prev) => prev.filter((d) => d.id !== id));
    setDraftStatuses((prev) => { const next = { ...prev }; delete next[id]; return next; });
    deleteDraft(id);
  };

  // Conversation handlers — these are the ones the Sidebar invokes. AgentView
  // also needs to mutate `conversations` directly (when send() creates a new
  // conv on the fly), which is why we pass setConversations / setActiveConvId.
  const handleNewConv = () => {
    setActiveConvId(null);
    setSelectedDraftId(null);
    setActiveView("Overview");
  };

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
    setSelectedDraftId(null);
    setActiveView("Overview");
  };

  const handleDeleteConv = async (id: string) => {
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) setActiveConvId(null);
  };

  const draftsWithStatus: DraftWithStatus[] = outreachDrafts.map((d) => ({
    ...d,
    status: draftStatuses[d.id] ?? "draft",
  }));

  const selectedDraft = selectedDraftId
    ? draftsWithStatus.find((d) => d.id === selectedDraftId) ?? null
    : null;

  const renderView = () => {
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
            conversations={conversations}
            setConversations={setConversations}
            activeConvId={activeConvId}
            setActiveConvId={setActiveConvId}
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
            conversations={conversations}
            setConversations={setConversations}
            activeConvId={activeConvId}
            setActiveConvId={setActiveConvId}
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
      <Sidebar
        activeView={activeView}
        onNavigate={(v) => { setSelectedDraftId(null); setActiveView(v as View); }}
        conversations={conversations}
        activeConvId={activeConvId}
        onNewConv={handleNewConv}
        onSelectConv={handleSelectConv}
        onDeleteConv={handleDeleteConv}
      />
      {renderView()}
    </div>
  );
}
