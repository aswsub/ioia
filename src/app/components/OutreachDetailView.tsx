"use client";

import { useState } from "react";
import {
  ArrowLeft, Send, Check, Trash2, ArrowUpRight,
  FileText, User, Building2, BookOpen, Mail,
} from "lucide-react";
import { OutreachDraft } from "./mock-data";

type DraftWithStatus = OutreachDraft & { status: "draft" | "sent" };

const CITATIONS: Record<string, { claim: string; source: "paper" | "profile"; ref: string }[]> = {
  draft_1: [
    { claim: "Scalable oversight and reward hacking problem", source: "paper", ref: "Zhang et al., 2024" },
    { claim: "Human feedback bottlenecks alignment at scale", source: "paper", ref: "Zhang et al., 2024" },
    { claim: "RLHF data quality project", source: "profile", ref: "User profile" },
  ],
  draft_2: [
    { claim: "Emergent abilities in large language models", source: "paper", ref: "Chen et al., 2024" },
    { claim: "Metric-induced vs genuine phase transitions", source: "paper", ref: "Chen et al., 2024" },
    { claim: "LoRA fine-tune experiments", source: "profile", ref: "User profile" },
  ],
  draft_3: [
    { claim: "Faithfulness in retrieval-augmented generation", source: "paper", ref: "Sharma et al., ACL 2024" },
    { claim: "Grounded hallucination vs confabulation", source: "paper", ref: "Sharma et al., ACL 2024" },
    { claim: "RAG pipeline for academic paper Q&A", source: "profile", ref: "User profile" },
  ],
  draft_4: [
    { claim: "Planning as a latent variable in LLM agents", source: "paper", ref: "Okonkwo et al., 2024" },
    { claim: "Sub-goal decomposition under ambiguous instructions", source: "paper", ref: "Okonkwo et al., 2024" },
    { claim: "Agentic system for API scheduling", source: "profile", ref: "User profile" },
  ],
  draft_5: [
    { claim: "Compositional concept binding in VLMs", source: "paper", ref: "Petrov et al., NeurIPS 2024" },
    { claim: "VLM failures on spatial reasoning", source: "paper", ref: "Petrov et al., NeurIPS 2024" },
    { claim: "Language grounding and embodied reasoning interest", source: "profile", ref: "User profile" },
  ],
};

function initials(name: string) {
  return name.replace("Dr. ", "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

interface OutreachDetailViewProps {
  draft: DraftWithStatus;
  onBack: () => void;
  onSend: (id: string) => void;
  onDiscard: (id: string) => void;
}

export function OutreachDetailView({ draft, onBack, onSend, onDiscard }: OutreachDetailViewProps) {
  const [body, setBody] = useState(draft.body);
  const [subject, setSubject] = useState(draft.subject);
  const [editing, setEditing] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const isSent = draft.status === "sent";
  const citations = CITATIONS[draft.id] ?? [];

  const handleSend = () => {
    setJustSent(true);
    setTimeout(() => {
      onSend(draft.id);
      setJustSent(false);
    }, 600);
  };

  const handleDiscard = () => {
    onDiscard(draft.id);
    onBack();
  };

  return (
    <main
      className="flex-1 overflow-y-auto"
      style={{ background: "#fafafa", fontFamily: "var(--font-sans)" }}
    >
      {/* Top bar */}
      <div
        className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10"
        style={{ borderColor: "#e5e5e5", minHeight: 48 }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors"
            style={{ fontSize: 12.5, color: "#737373", fontWeight: 300 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <ArrowLeft size={13} />
            Outreach
          </button>
          <div style={{ width: 1, height: 16, background: "#e5e5e5" }} />
          <span style={{ fontSize: 13.5, fontWeight: 400, color: "#0a0a0a" }}>{draft.professor.name}</span>
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

        {!isSent && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDiscard}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 border transition-colors"
              style={{ fontSize: 12, color: "#a3a3a3", borderColor: "#e5e5e5", fontWeight: 300 }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#ef4444";
                (e.currentTarget as HTMLElement).style.borderColor = "#fecaca";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#a3a3a3";
                (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5";
              }}
            >
              <Trash2 size={11} /> Discard
            </button>
            <button
              onClick={handleSend}
              disabled={justSent}
              className="flex items-center gap-1.5 rounded-lg px-4 py-1.5"
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: "#fff",
                background: justSent ? "#16a34a" : "#0a0a0a",
                transition: "background 0.3s",
              }}
            >
              {justSent ? <Check size={11} /> : <Send size={11} />}
              {justSent ? "Sending…" : "Send email"}
            </button>
          </div>
        )}

        {isSent && (
          <div className="flex items-center gap-1.5">
            <Check size={12} style={{ color: "#16a34a" }} />
            <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 300 }}>Sent to {draft.professor.email}</span>
          </div>
        )}
      </div>

      {/* Page body */}
      <div className="px-8 py-6 mx-auto" style={{ maxWidth: 1100 }}>
        <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>

          {/* ── Left column: email ── */}
          <div className="flex flex-col gap-5">

            {/* Email card */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{
                borderColor: isSent ? "#d1fae5" : "#e5e5e5",
                background: isSent ? "#f0fdf4" : "#fff",
              }}
            >
              <div className="px-6 py-4 border-b" style={{ borderColor: isSent ? "#d1fae5" : "#f0f0f0" }}>
                <p style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 400, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>
                  Email draft
                </p>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isSent}
                  className="w-full outline-none bg-transparent"
                  style={{
                    fontSize: 15,
                    fontWeight: 400,
                    color: "#0a0a0a",
                    fontFamily: "var(--font-sans)",
                    borderBottom: editing ? "1px solid #e5e5e5" : "1px solid transparent",
                    paddingBottom: 4,
                    transition: "border-color 0.15s",
                  }}
                  onFocus={() => setEditing(true)}
                />
              </div>
              <div className="px-6 py-5">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={isSent}
                  onFocus={() => setEditing(true)}
                  onBlur={() => setEditing(false)}
                  className="w-full outline-none bg-transparent resize-none"
                  style={{
                    fontSize: 13.5,
                    color: "#525252",
                    fontWeight: 300,
                    lineHeight: 1.85,
                    fontFamily: "var(--font-sans)",
                    minHeight: 280,
                    borderRadius: 6,
                    padding: editing ? "10px 12px" : "0",
                    background: editing ? "#fafafa" : "transparent",
                    border: editing ? "1px solid #e5e5e5" : "1px solid transparent",
                    transition: "all 0.15s",
                  }}
                />
              </div>
              <div
                className="px-6 py-3 border-t flex items-center justify-between"
                style={{ borderColor: isSent ? "#d1fae5" : "#f0f0f0", background: isSent ? "#f0fdf4" : "#fafafa" }}
              >
                <span style={{ fontSize: 11.5, color: "#d4d4d4", fontWeight: 300 }}>
                  ✦ Personalized to {draft.professor.research.length} research areas
                </span>
                <span style={{ fontSize: 11.5, color: "#a3a3a3", fontWeight: 300 }}>
                  {(draft.matchScore * 100).toFixed(0)}% match score
                </span>
              </div>
            </div>

            {/* Citations card */}
            {citations.length > 0 && (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#e5e5e5", background: "#fff" }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: "#f0f0f0" }}>
                  <p style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 400, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Citations used in this email
                  </p>
                </div>
                <div className="px-6 py-4 flex flex-col gap-2.5">
                  {citations.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border px-4 py-3"
                      style={{ borderColor: "#f0f0f0", background: "#fafafa" }}
                    >
                      <span
                        className="rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5"
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          background: c.source === "paper" ? "#dbeafe" : "#f0fdf4",
                          color: c.source === "paper" ? "#1d4ed8" : "#15803d",
                        }}
                      >
                        {c.source}
                      </span>
                      <div className="flex flex-col gap-0.5 flex-1">
                        <span style={{ fontSize: 12.5, color: "#0a0a0a", fontWeight: 300 }}>{c.claim}</span>
                        <span style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 300 }}>{c.ref}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column: professor profile ── */}
          <div className="flex flex-col gap-4">

            {/* Professor card */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#e5e5e5", background: "#fff" }}>
              {/* Avatar + name */}
              <div className="px-5 py-5 flex flex-col items-center text-center border-b" style={{ borderColor: "#f0f0f0" }}>
                <div
                  className="flex items-center justify-center rounded-2xl mb-3"
                  style={{
                    width: 56,
                    height: 56,
                    background: draft.professor.color,
                    fontSize: 18,
                    fontWeight: 500,
                    color: "#0a0a0a",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {initials(draft.professor.name)}
                </div>
                <span style={{ fontSize: 15, fontWeight: 400, color: "#0a0a0a", marginBottom: 2 }}>
                  {draft.professor.name}
                </span>
                <span style={{ fontSize: 12.5, color: "#737373", fontWeight: 300 }}>
                  {draft.professor.title}
                </span>
              </div>

              {/* Details */}
              <div className="px-5 py-4 flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <Building2 size={13} style={{ color: "#a3a3a3", flexShrink: 0 }} />
                  <div className="flex flex-col">
                    <span style={{ fontSize: 12.5, color: "#0a0a0a", fontWeight: 400 }}>{draft.professor.university}</span>
                    <span style={{ fontSize: 11.5, color: "#a3a3a3", fontWeight: 300 }}>{draft.professor.department}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Mail size={13} style={{ color: "#a3a3a3", flexShrink: 0 }} />
                  <a
                    href={`mailto:${draft.professor.email}`}
                    className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                    style={{ fontSize: 12.5, color: "#525252", fontWeight: 300 }}
                  >
                    {draft.professor.email}
                    <ArrowUpRight size={11} />
                  </a>
                </div>

                <div className="flex items-start gap-2.5">
                  <BookOpen size={13} style={{ color: "#a3a3a3", flexShrink: 0, marginTop: 2 }} />
                  <div className="flex flex-wrap gap-1.5">
                    {draft.professor.research.map((r) => (
                      <span
                        key={r}
                        className="rounded-full px-2.5 py-1"
                        style={{ fontSize: 11.5, background: "#f5f5f5", color: "#525252", fontWeight: 300 }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Match score card */}
            <div className="rounded-xl border px-5 py-4" style={{ borderColor: "#e5e5e5", background: "#fff" }}>
              <p style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 400, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }}>
                Match score
              </p>
              <div className="flex items-end gap-3 mb-3">
                <span style={{ fontSize: 36, fontWeight: 300, color: "#0a0a0a", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {(draft.matchScore * 100).toFixed(0)}
                </span>
                <span style={{ fontSize: 14, color: "#a3a3a3", fontWeight: 300, marginBottom: 4 }}>/ 100</span>
              </div>
              <div className="rounded-full overflow-hidden mb-2" style={{ height: 6, background: "#f0f0f0" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${draft.matchScore * 100}%`,
                    background: draft.matchScore >= 0.9 ? "#16a34a" : draft.matchScore >= 0.8 ? "#0a0a0a" : "#f59e0b",
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: 11.5, color: "#a3a3a3", fontWeight: 300 }}>
                {draft.matchScore >= 0.9
                  ? "Excellent fit — strong overlap with your research interests."
                  : draft.matchScore >= 0.8
                  ? "Good fit — solid alignment on key topics."
                  : "Moderate fit — some overlap, worth reaching out."}
              </p>
            </div>

            {/* AI notes card */}
            <div className="rounded-xl border px-5 py-4" style={{ borderColor: "#e5e5e5", background: "#fff" }}>
              <p style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 400, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>
                Why this professor
              </p>
              <p style={{ fontSize: 12.5, color: "#525252", fontWeight: 300, lineHeight: 1.7 }}>
                Their work on{" "}
                <span style={{ color: "#0a0a0a", fontWeight: 400 }}>
                  {draft.professor.research.slice(0, 2).join(" and ")}
                </span>{" "}
                directly overlaps with your stated research interests. The email references their most recent published work and connects it to a specific project from your profile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
