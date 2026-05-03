"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Send, Check, Trash2, LayoutGrid,
  ChevronUp, ChevronDown, ArrowUpDown, ArrowRight,
} from "lucide-react";
import { OutreachDraft } from "./mock-data";

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
  const [scope, setScope] = useState<"latest" | "all">("latest");
  const [latestBatchIds, setLatestBatchIds] = useState<Set<string> | null>(null);
  const [latestLabel, setLatestLabel] = useState<string | null>(null);
  const [latestAt, setLatestAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const rawIds = localStorage.getItem("ioia:last_draft_batch_ids");
      const rawPrompt = localStorage.getItem("ioia:last_draft_batch_prompt");
      const rawAt = localStorage.getItem("ioia:last_draft_batch_at");
      const ids = rawIds ? (JSON.parse(rawIds) as string[]) : [];
      setLatestBatchIds(new Set(ids));
      setLatestLabel(rawPrompt ?? null);
      setLatestAt(rawAt ?? null);
      // Only reset scope to "all" on initial mount if there's no batch info.
      // Don't reset it every time drafts change, as that would prevent viewing the latest batch.
    } catch {
      setLatestBatchIds(null);
      setLatestLabel(null);
      setLatestAt(null);
    }
  }, []);

  // Refresh latest batch info when drafts change (new drafts from agent)
  useEffect(() => {
    try {
      const rawIds = localStorage.getItem("ioia:last_draft_batch_ids");
      const rawPrompt = localStorage.getItem("ioia:last_draft_batch_prompt");
      const rawAt = localStorage.getItem("ioia:last_draft_batch_at");
      const ids = rawIds ? (JSON.parse(rawIds) as string[]) : [];
      // Only update if there are new IDs (agent just generated drafts)
      if (ids.length > 0) {
        setLatestBatchIds(new Set(ids));
        setLatestLabel(rawPrompt ?? null);
        setLatestAt(rawAt ?? null);
        // Auto-switch to "latest" scope when new drafts arrive
        setScope("latest");
      }
    } catch {
      // ignore
    }
  }, [drafts]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const scopedDrafts = useMemo(() => {
    if (scope === "latest" && latestBatchIds && latestBatchIds.size > 0) {
      return drafts.filter((d) => latestBatchIds.has(d.id));
    }
    return drafts;
  }, [drafts, scope, latestBatchIds]);

  const filtered = useMemo(() => {
    const base = statusFilter === "all" ? scopedDrafts : scopedDrafts.filter((d) => d.status === statusFilter);
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
  }, [scopedDrafts, sortKey, sortDir, statusFilter]);

  const draftCount = scopedDrafts.filter((d) => d.status === "draft").length;
  const sentCount  = scopedDrafts.filter((d) => d.status === "sent").length;

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

        <div className="flex items-center gap-2">
          {/* Batch scope */}
          <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "#f5f5f5" }}>
            <button
              onClick={() => setScope("latest")}
              className="rounded-md px-3 py-1 transition-all"
              style={{
                fontSize: 12,
                fontWeight: scope === "latest" ? 400 : 300,
                color: scope === "latest" ? "#0a0a0a" : "#737373",
                background: scope === "latest" ? "#fff" : "transparent",
                boxShadow: scope === "latest" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
              title={latestLabel ? `Latest: ${latestLabel}` : "Latest chat results"}
            >
              Latest chat
            </button>
            <button
              onClick={() => setScope("all")}
              className="rounded-md px-3 py-1 transition-all"
              style={{
                fontSize: 12,
                fontWeight: scope === "all" ? 400 : 300,
                color: scope === "all" ? "#0a0a0a" : "#737373",
                background: scope === "all" ? "#fff" : "transparent",
                boxShadow: scope === "all" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              All
            </button>
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
                    <div className="flex flex-col min-w-0">
                      <span style={{ fontSize: 12.5, fontWeight: 400, color: "#0a0a0a" }}>{draft.professor.name}</span>
                      <span style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 300 }}>{draft.professor.title}</span>
                      {(draft.professor.homepage || (draft.professor.recentPapers?.length ?? 0) > 0) && (
                        <div className="flex items-center gap-2 mt-1" style={{ fontSize: 11, fontWeight: 300 }}>
                          {draft.professor.homepage && (
                            <a
                              href={draft.professor.homepage}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#a3a3a3" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              homepage ↗
                            </a>
                          )}
                          {(draft.professor.recentPapers ?? []).slice(0, 1).map((p) => (
                            <a
                              key={p.url}
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#a3a3a3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}
                              onClick={(e) => e.stopPropagation()}
                              title={p.title}
                            >
                              {p.title} ({p.year})
                            </a>
                          ))}
                        </div>
                      )}
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
                          background: draft.matchScore >= 0.9 ? "#16a34a" : "#0a0a0a",
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
