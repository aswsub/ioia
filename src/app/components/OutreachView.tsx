"use client";

import { useState } from "react";
import { Send, Check, Trash2, ArrowUpRight, LayoutGrid } from "lucide-react";
import { OutreachDraft } from "./mock-data";

type DraftState = {
  subject: string;
  body: string;
  status: "draft" | "sent";
  editing: boolean;
};

interface OutreachViewProps {
  drafts: OutreachDraft[];
  onNavigateToAgent?: () => void;
}

function initials(name: string) {
  return name
    .replace("Dr. ", "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function DraftCard({
  draft,
  onDiscard,
}: {
  draft: OutreachDraft;
  onDiscard: (id: string) => void;
}) {
  const [state, setState] = useState<DraftState>({
    subject: draft.subject,
    body: draft.body,
    status: "draft",
    editing: false,
  });
  const [justSent, setJustSent] = useState(false);

  const handleSend = () => {
    setJustSent(true);
    setTimeout(() => {
      setState((s) => ({ ...s, status: "sent", editing: false }));
      setJustSent(false);
    }, 600);
  };

  const isSent = state.status === "sent";

  return (
    <div
      className="rounded-xl border flex flex-col transition-all"
      style={{
        borderColor: isSent ? "#d1fae5" : "#e5e5e5",
        background: isSent ? "#f0fdf4" : "#fff",
        opacity: isSent ? 0.75 : 1,
        transition: "all 0.4s ease",
      }}
    >
      {/* Professor header */}
      <div className="flex items-start gap-3 px-5 pt-4 pb-3">
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            background: draft.professor.color,
            fontSize: 12,
            fontWeight: 500,
            color: "#0a0a0a",
            letterSpacing: "-0.01em",
          }}
        >
          {initials(draft.professor.name)}
        </div>

        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 13.5, fontWeight: 400, color: "#0a0a0a" }}>
              {draft.professor.name}
            </span>
            <span
              className="rounded-full px-2 py-0.5"
              style={{
                fontSize: 11,
                fontWeight: 400,
                background: isSent ? "#dcfce7" : "#f5f5f5",
                color: isSent ? "#15803d" : "#737373",
              }}
            >
              {isSent ? "Sent" : "Draft"}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#a3a3a3", fontWeight: 300 }}>
            {draft.professor.title} · {draft.professor.university} · {draft.professor.department}
          </span>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {draft.professor.research.map((r) => (
              <span
                key={r}
                className="rounded px-1.5 py-0.5"
                style={{
                  fontSize: 11,
                  color: "#525252",
                  background: "#f5f5f5",
                  fontWeight: 300,
                }}
              >
                {r}
              </span>
            ))}
            <span style={{ fontSize: 11, color: "#d4d4d4", marginLeft: 4 }}>
              {(draft.matchScore * 100).toFixed(0)}% match
            </span>
          </div>
        </div>

        <a
          href={`mailto:${draft.professor.email}`}
          style={{ fontSize: 11.5, color: "#a3a3a3", fontWeight: 300, flexShrink: 0, marginTop: 2 }}
          className="flex items-center gap-1 hover:text-gray-600 transition-colors"
        >
          {draft.professor.email}
          <ArrowUpRight size={10} />
        </a>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#f5f5f5", margin: "0 20px" }} />

      {/* Email content */}
      <div className="px-5 py-3 flex flex-col gap-2">
        {/* Subject */}
        <input
          type="text"
          value={state.subject}
          onChange={(e) => setState((s) => ({ ...s, subject: e.target.value }))}
          disabled={isSent}
          className="w-full outline-none bg-transparent"
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: "#0a0a0a",
            fontFamily: "var(--font-sans)",
            borderBottom: state.editing ? "1px solid #e5e5e5" : "1px solid transparent",
            paddingBottom: 4,
            transition: "border-color 0.15s",
          }}
          onFocus={() => setState((s) => ({ ...s, editing: true }))}
        />

        {/* Body */}
        <textarea
          value={state.body}
          onChange={(e) => setState((s) => ({ ...s, body: e.target.value }))}
          disabled={isSent}
          onFocus={() => setState((s) => ({ ...s, editing: true }))}
          onBlur={() => setState((s) => ({ ...s, editing: false }))}
          className="w-full outline-none bg-transparent resize-none"
          style={{
            fontSize: 13,
            color: "#525252",
            fontWeight: 300,
            lineHeight: 1.75,
            fontFamily: "var(--font-sans)",
            minHeight: 180,
            borderRadius: 6,
            padding: state.editing ? "8px 10px" : "0",
            background: state.editing ? "#fafafa" : "transparent",
            border: state.editing ? "1px solid #e5e5e5" : "1px solid transparent",
            transition: "all 0.15s",
          }}
        />
      </div>

      {/* Action bar */}
      {!isSent && (
        <div
          className="flex items-center justify-between px-5 pb-4 pt-1"
        >
          <span style={{ fontSize: 11.5, color: "#d4d4d4", fontWeight: 300 }}>
            ✦ Personalized to {draft.professor.research.length} research areas
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDiscard(draft.id)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 border transition-colors"
              style={{
                fontSize: 12,
                color: "#a3a3a3",
                borderColor: "#e5e5e5",
                fontWeight: 300,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#ef4444";
                (e.currentTarget as HTMLElement).style.borderColor = "#fecaca";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#a3a3a3";
                (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5";
              }}
            >
              <Trash2 size={11} />
              Discard
            </button>

            <button
              onClick={handleSend}
              disabled={justSent}
              className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 transition-all"
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: "#fff",
                background: justSent ? "#16a34a" : "#0a0a0a",
                transition: "background 0.3s",
                cursor: justSent ? "default" : "pointer",
              }}
            >
              {justSent ? <Check size={11} /> : <Send size={11} />}
              {justSent ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      )}

      {isSent && (
        <div className="flex items-center gap-1.5 px-5 pb-4 pt-1">
          <Check size={12} style={{ color: "#16a34a" }} />
          <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 300 }}>
            Sent to {draft.professor.email}
          </span>
        </div>
      )}
    </div>
  );
}

export function OutreachView({ drafts, onNavigateToAgent }: OutreachViewProps) {
  const [activeDrafts, setActiveDrafts] = useState<OutreachDraft[]>(drafts);

  // Sync if parent updates drafts (agent sends new ones)
  useState(() => {
    setActiveDrafts(drafts);
  });

  const discard = (id: string) => {
    setActiveDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const sentCount = activeDrafts.filter((d) => false).length; // tracked per-card

  return (
    <main
      className="flex-1 overflow-y-auto"
      style={{ background: "#fafafa", fontFamily: "var(--font-sans)" }}
    >
      {/* Header */}
      <div
        className="bg-white border-b px-8 py-3 flex items-center justify-between sticky top-0 z-10"
        style={{ borderColor: "#e5e5e5", minHeight: 48 }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 14, fontWeight: 400, color: "#0a0a0a" }}>Outreach</span>
          {activeDrafts.length > 0 && (
            <span
              className="rounded-full px-2 py-0.5"
              style={{ fontSize: 11, background: "#f5f5f5", color: "#737373", fontWeight: 400 }}
            >
              {activeDrafts.length} draft{activeDrafts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {activeDrafts.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center h-[calc(100vh-48px)] gap-4">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 44, height: 44, background: "#f5f5f5" }}
          >
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
              <LayoutGrid size={12} />
              Go to Overview
            </button>
          )}
        </div>
      ) : (
        <div className="px-8 py-6 mx-auto flex flex-col gap-4" style={{ maxWidth: 780 }}>
          <p style={{ fontSize: 12.5, color: "#a3a3a3", fontWeight: 300, marginBottom: 4 }}>
            Review each email below — click the body to edit, then send when ready.
          </p>
          {activeDrafts.map((draft) => (
            <DraftCard key={draft.id} draft={draft} onDiscard={discard} />
          ))}
        </div>
      )}
    </main>
  );
}
