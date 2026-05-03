"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Send, Check, Trash2, LayoutGrid,
  ChevronUp, ChevronDown, ArrowUpDown, ArrowRight, Mail, Loader2,
} from "lucide-react";
import { OutreachDraft } from "./mock-data";
import {
  disconnectGoogleOAuth,
  getGmailConnectionStatus,
  startGoogleOAuth,
  type GmailConnectionStatus,
} from "../../lib/gmail-client";

type DraftWithStatus = OutreachDraft & { status: "draft" | "sent" };

interface OutreachViewProps {
  drafts: DraftWithStatus[];
  onSelectDraft: (id: string) => void;
  onNavigateToAgent?: () => void;
  onSend: (id: string) => void;
  onDiscard: (id: string) => void;
}

type SortKey = "professor" | "university" | "matchScore" | "status";
type SortDir = "asc" | "desc";

function initials(name: string) {
  return name.replace("Dr. ", "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function StatusPill({ status }: { status: "draft" | "sent" }) {
  const cfg = {
    draft: { bg: "#f5f5f5", color: "#737373", label: "Draft" },
    sent:  { bg: "#dcfce7", color: "#15803d", label: "Sent" },
  }[status];
  return (
    <span className="rounded-full px-2 py-0.5" style={{ fontSize: 11, fontWeight: 400, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function SortHeader({
  label, sortKey, active, dir, onClick,
}: {
  label: string; sortKey: SortKey; active: boolean; dir: SortDir; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 group"
      style={{ fontSize: 11, fontWeight: 400, color: active ? "#0a0a0a" : "#a3a3a3", letterSpacing: "0.03em", textTransform: "uppercase" }}
    >
      {label}
      {active
        ? dir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />
        : <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
    </button>
  );
}

export function OutreachView({ drafts, onSelectDraft, onNavigateToAgent, onSend, onDiscard }: OutreachViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("matchScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "sent">("all");
  const [gmailStatus, setGmailStatus] = useState<GmailConnectionStatus | null>(null);
  const [gmailLoading, setGmailLoading] = useState(true);
  const [gmailError, setGmailError] = useState<string | null>(null);

  const refreshGmailStatus = async () => {
    setGmailLoading(true);
    setGmailError(null);
    try {
      setGmailStatus(await getGmailConnectionStatus());
    } catch {
      setGmailError("Google auth backend is not available yet.");
      setGmailStatus(null);
    } finally {
      setGmailLoading(false);
    }
  };

  useEffect(() => {
    refreshGmailStatus();
  }, []);

  const handleDisconnectGmail = async () => {
    setGmailLoading(true);
    setGmailError(null);
    try {
      await disconnectGoogleOAuth();
      await refreshGmailStatus();
    } catch {
      setGmailError("Could not disconnect Gmail.");
      setGmailLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    const base = statusFilter === "all" ? drafts : drafts.filter((d) => d.status === statusFilter);
    return [...base].sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortKey === "professor")    { av = a.professor.name;       bv = b.professor.name; }
      else if (sortKey === "university") { av = a.professor.university; bv = b.professor.university; }
      else if (sortKey === "matchScore") { av = a.matchScore;           bv = b.matchScore; }
      else                            { av = a.status;               bv = b.status; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [drafts, sortKey, sortDir, statusFilter]);

  const draftCount = drafts.filter((d) => d.status === "draft").length;
  const sentCount  = drafts.filter((d) => d.status === "sent").length;

  if (drafts.length === 0) {
    return (
      <main className="flex-1 overflow-y-auto" style={{ background: "#fafafa", fontFamily: "var(--font-sans)" }}>
        <div className="bg-white border-b px-8 py-3 flex items-center" style={{ borderColor: "#e5e5e5", minHeight: 48 }}>
          <span style={{ fontSize: 14, fontWeight: 400, color: "#0a0a0a" }}>Outreach</span>
        </div>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-48px)] gap-4">
          <div className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: "#f5f5f5" }}>
            <Send size={18} style={{ color: "#d4d4d4" }} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span style={{ fontSize: 14, fontWeight: 400, color: "#0a0a0a" }}>No drafts yet</span>
            <span style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 300, textAlign: "center", maxWidth: 280 }}>
              Run a search in Overview and the agent will draft personalized emails here.
            </span>
          </div>
          {onNavigateToAgent && (
            <button
              onClick={onNavigateToAgent}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 border transition-colors mt-1"
              style={{ fontSize: 12.5, color: "#0a0a0a", borderColor: "#e5e5e5", background: "#fff", fontWeight: 400 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
            >
              <LayoutGrid size={12} /> Go to Overview
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 overflow-hidden" style={{ background: "#fafafa", fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div
        className="bg-white border-b px-6 py-3 flex items-center justify-between"
        style={{ borderColor: "#e5e5e5", minHeight: 48 }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 14, fontWeight: 400, color: "#0a0a0a" }}>Outreach</span>
          <span className="rounded-full px-2 py-0.5" style={{ fontSize: 11, background: "#f5f5f5", color: "#737373", fontWeight: 400 }}>
            {draftCount} draft{draftCount !== 1 ? "s" : ""}
          </span>
          {sentCount > 0 && (
            <span className="rounded-full px-2 py-0.5" style={{ fontSize: 11, background: "#dcfce7", color: "#15803d", fontWeight: 400 }}>
              {sentCount} sent
            </span>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "#f5f5f5" }}>
          {(["all", "draft", "sent"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className="rounded-md px-3 py-1 transition-all capitalize"
              style={{
                fontSize: 12,
                fontWeight: statusFilter === f ? 400 : 300,
                color: statusFilter === f ? "#0a0a0a" : "#737373",
                background: statusFilter === f ? "#fff" : "transparent",
                boxShadow: statusFilter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-3 border-b" style={{ borderColor: "#e5e5e5", background: "#fff" }}>
        <div
          className="flex items-center justify-between rounded-xl border px-4 py-3"
          style={{ borderColor: "#e5e5e5", background: gmailStatus?.connected ? "#f0fdf4" : "#fafafa" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 32, height: 32, background: gmailStatus?.connected ? "#dcfce7" : "#fff", border: "1px solid #e5e5e5" }}
            >
              {gmailLoading ? <Loader2 size={14} className="animate-spin" color="#737373" /> : gmailStatus?.connected ? <Check size={14} color="#16a34a" /> : <Mail size={14} color="#737373" />}
            </div>
            <div className="flex flex-col gap-0.5">
              <span style={{ fontSize: 12.5, fontWeight: 400, color: "#0a0a0a" }}>
                {gmailStatus?.connected ? `Gmail connected!${gmailStatus.email ? ` as ${gmailStatus.email}` : ""}` : "Connect Gmail to send emails"}
              </span>
              <span style={{ fontSize: 11.5, color: gmailError ? "#ef4444" : "#737373", fontWeight: 300 }}>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {gmailStatus?.connected ? (
              <button
                onClick={handleDisconnectGmail}
                disabled={gmailLoading}
                className="rounded-lg border px-3 py-1.5 transition-colors"
                style={{ fontSize: 12, color: "#525252", borderColor: "#e5e5e5", background: "#fff", fontWeight: 300, opacity: gmailLoading ? 0.6 : 1 }}
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={startGoogleOAuth}
                disabled={gmailLoading || gmailStatus?.configured === false}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-opacity"
                style={{ fontSize: 12, color: "#fff", background: "#0a0a0a", fontWeight: 400, opacity: gmailLoading || gmailStatus?.configured === false ? 0.55 : 1 }}
              >
                <Mail size={12} /> Connect Gmail
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #e5e5e5" }}>
              <th className="px-6 py-2.5 text-left">
                <SortHeader label="Professor" sortKey="professor" active={sortKey === "professor"} dir={sortDir} onClick={() => handleSort("professor")} />
              </th>
              <th className="px-4 py-2.5 text-left">
                <SortHeader label="University" sortKey="university" active={sortKey === "university"} dir={sortDir} onClick={() => handleSort("university")} />
              </th>
              <th className="px-4 py-2.5 text-left" style={{ fontSize: 11, fontWeight: 400, color: "#a3a3a3", letterSpacing: "0.03em", textTransform: "uppercase" }}>
                Research areas
              </th>
              <th className="px-4 py-2.5 text-left" style={{ fontSize: 11, fontWeight: 400, color: "#a3a3a3", letterSpacing: "0.03em", textTransform: "uppercase" }}>
                Subject
              </th>
              <th className="px-4 py-2.5 text-left">
                <SortHeader label="Match" sortKey="matchScore" active={sortKey === "matchScore"} dir={sortDir} onClick={() => handleSort("matchScore")} />
              </th>
              <th className="px-4 py-2.5 text-left">
                <SortHeader label="Status" sortKey="status" active={sortKey === "status"} dir={sortDir} onClick={() => handleSort("status")} />
              </th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((draft) => (
              <tr
                key={draft.id}
                onClick={() => onSelectDraft(draft.id)}
                className="group cursor-pointer transition-colors"
                style={{ borderBottom: "1px solid #f0f0f0" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {/* Professor */}
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex items-center justify-center rounded-md flex-shrink-0"
                      style={{ width: 28, height: 28, background: draft.professor.color, fontSize: 10, fontWeight: 500, color: "#0a0a0a" }}
                    >
                      {initials(draft.professor.name)}
                    </div>
                    <div className="flex flex-col">
                      <span style={{ fontSize: 12.5, fontWeight: 400, color: "#0a0a0a" }}>{draft.professor.name}</span>
                      <span style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 300 }}>{draft.professor.title}</span>
                    </div>
                  </div>
                </td>
                {/* University */}
                <td className="px-4 py-3">
                  <span style={{ fontSize: 12, color: "#525252", fontWeight: 300 }}>{draft.professor.university}</span>
                  <div style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 300 }}>{draft.professor.department}</div>
                </td>
                {/* Research */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {draft.professor.research.slice(0, 2).map((r) => (
                      <span key={r} className="rounded px-1.5 py-0.5" style={{ fontSize: 10.5, background: "#f5f5f5", color: "#525252", fontWeight: 300 }}>
                        {r}
                      </span>
                    ))}
                    {draft.professor.research.length > 2 && (
                      <span style={{ fontSize: 10.5, color: "#a3a3a3" }}>+{draft.professor.research.length - 2}</span>
                    )}
                  </div>
                </td>
                {/* Subject */}
                <td className="px-4 py-3" style={{ maxWidth: 220 }}>
                  <span style={{ fontSize: 12, color: "#525252", fontWeight: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                    {draft.subject}
                  </span>
                </td>
                {/* Match */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full overflow-hidden" style={{ width: 36, height: 4, background: "#f0f0f0" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${draft.matchScore * 100}%`,
                          background: draft.matchScore >= 0.9 ? "#16a34a" : draft.matchScore >= 0.8 ? "#0a0a0a" : "#f59e0b",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: "#0a0a0a", fontWeight: 400, fontFamily: "var(--font-display)" }}>{(draft.matchScore * 100).toFixed(0)}%</span>
                  </div>
                </td>
                {/* Status */}
                <td className="px-4 py-3">
                  <StatusPill status={draft.status} />
                </td>
                {/* Arrow */}
                <td className="px-4 py-3">
                  <ArrowRight size={13} color="#d4d4d4" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
