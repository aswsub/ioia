"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Send, Check, Trash2, ArrowUpRight,
  User, Building2, BookOpen, Mail, Loader2,
} from "lucide-react";
import { OutreachDraft } from "./mock-data";
import { findAuthorIdByNameAndInstitution, getRecentWorksByAuthor } from "../../lib/openalex";
import fileLogo from "../../assets/file.png";
import linkedinLogo from "../../assets/linkedin.png";
import googleLogo from "../../assets/google.png";
import openalexLogo from "../../assets/openalex.svg.png";
import { GMAIL_FALLBACK_RECIPIENT, sendDraftEmail } from "../../lib/gmail-client";

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
  const [papers, setPapers] = useState(draft.professor.recentPapers ?? []);
  const [resolvedOpenAlexId, setResolvedOpenAlexId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentRecipient, setSentRecipient] = useState<string | null>(null);
  const isSent = draft.status === "sent";
  const citations = CITATIONS[draft.id] ?? [];
  const draftRecipientEmail = draft.professor.email.trim();
  const displayedSentRecipient =
    sentRecipient ?? (draftRecipientEmail || GMAIL_FALLBACK_RECIPIENT);
  const bodyWordCount = useMemo(() => body.trim().split(/\s+/).filter(Boolean).length, [body]);
  const openAlexProfileUrl = useMemo(() => {
    const id = (resolvedOpenAlexId ?? draft.professor.openAlexId)?.trim();
    if (!id) return null;
    if (id.startsWith("https://openalex.org/")) return id;
    const withoutHost = id.startsWith("openalex.org/") ? id.slice("openalex.org/".length) : id;
    return `https://openalex.org/${withoutHost}`;
  }, [draft.professor.openAlexId, resolvedOpenAlexId]);

  const peopleSearchLinks = useMemo(() => {
    const name = draft.professor.name.trim();
    const inst = (draft.professor.university || draft.professor.affiliation || "").trim();
    const q = encodeURIComponent(`${name} ${inst}`);
    const qName = encodeURIComponent(name);
    return {
      google: `https://www.google.com/search?q=${q}`,
      linkedin: `https://www.linkedin.com/search/results/people/?keywords=${qName}`,
      scholar: `https://scholar.google.com/scholar?q=${q}`,
    };
  }, [draft.professor.name, draft.professor.university || draft.professor.affiliation]);

  useEffect(() => {
    setPapers(draft.professor.recentPapers ?? []);
    setResolvedOpenAlexId(null);
    setSentRecipient(null);
    if ((draft.professor.recentPapers?.length ?? 0) > 0) return;
    const run = async () => {
      const directId = draft.professor.openAlexId?.trim();
      const inst = draft.professor.university || draft.professor.affiliation || "Unknown";
      const id = directId
        ? directId
        : await findAuthorIdByNameAndInstitution(draft.professor.name, inst);
      if (!id) return;
      if (!directId) setResolvedOpenAlexId(id);
      const ws = await getRecentWorksByAuthor(id, 8);
      if (ws.length === 0) return;
      setPapers(ws.map((w) => ({ title: w.title, year: w.year, url: w.url })));
    };
    run().catch(() => {});
  }, [draft.id]);

  const handleSend = async () => {
    if (sending) return;
    setSendError(null);

    if (!subject) {
      setSendError("Add a subject before sending.");
      return;
    }

    if (!body) {
      setSendError("Add an email body before sending.");
      return;
    }

    setSending(true);
    try {
      const result = await sendDraftEmail({
        draftId: draft.id,
        subject,
        body,
        recipientEmail: draftRecipientEmail || undefined,
      });
      setSentRecipient(result.to);
      onSend(draft.id);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Unable to send email through Gmail.");
    } finally {
      setSending(false);
    }
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
              disabled={sending}
              className="flex items-center gap-1.5 rounded-lg px-4 py-1.5"
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: "#fff",
                background: sending ? "#525252" : "#0a0a0a",
                transition: "background 0.3s",
                opacity: sending ? 0.82 : 1,
              }}
            >
              {sending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
              {sending ? "Sending..." : "Send email"}
            </button>
          </div>
        )}

        {isSent && (
          <div className="flex items-center gap-1.5">
            <Check size={12} style={{ color: "#16a34a" }} />
            <span
              title={displayedSentRecipient}
              style={{
                fontSize: 12,
                color: "#16a34a",
                fontWeight: 300,
                maxWidth: 420,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Sent to: {displayedSentRecipient}
            </span>
          </div>
        )}
      </div>

      {/* Page body */}
      <div className="px-8 py-6 mx-auto" style={{ maxWidth: 1100 }}>
        <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>

          {/* ── Left column: email ── */}
          <div className="flex flex-col gap-5">
            {sendError && (
              <div
                className="rounded-lg border px-4 py-3"
                style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c", fontSize: 12.5, fontWeight: 300 }}
              >
                {sendError}
              </div>
            )}

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
                <div className="flex items-center gap-3 min-w-0">
                  <span style={{ fontSize: 11.5, color: "#a3a3a3", fontWeight: 300 }}>
                    {bodyWordCount} words
                  </span>
                  <span style={{ fontSize: 11.5, color: "#d4d4d4", fontWeight: 300 }}>
                    {draft.professor.university}
                  </span>
                  {draft.professor.homepage && (
                    <a
                      href={draft.professor.homepage}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5"
                      style={{ fontSize: 11.5, color: "#0a0a0a", fontWeight: 300 }}
                    >
                      <ArrowUpRight size={12} /> homepage
                    </a>
                  )}
                  {papers?.[0]?.url && (
                    <a
                      href={papers[0].url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 min-w-0"
                      style={{ fontSize: 11.5, color: "#0a0a0a", fontWeight: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={papers[0].title}
                    >
                      <img src={fileLogo} alt="" style={{ width: 12, height: 12, display: "block", objectFit: "contain" }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {papers[0].title}
                      </span>
                    </a>
                  )}
                  {openAlexProfileUrl && (
                    <a
                      href={openAlexProfileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5"
                      style={{ fontSize: 11.5, color: "#0a0a0a", fontWeight: 300 }}
                    >
                      <ArrowUpRight size={12} /> OpenAlex
                    </a>
                  )}
                </div>
                <span style={{ fontSize: 11.5, color: "#a3a3a3", fontWeight: 300 }}>
                  {(draft.matchScore * 100).toFixed(0)}% match score
                </span>
              </div>
            </div>

            {/* Papers card (kept under the draft; avoids duplicating in the right column) */}
            {(openAlexProfileUrl || (papers?.length ?? 0) > 0) && (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#e5e5e5", background: "#fff" }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: "#f0f0f0" }}>
                  <p style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 400, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Published work
                  </p>
                </div>
                <div className="px-6 py-4 flex flex-col gap-2">
                  {openAlexProfileUrl && (
                    <a href={openAlexProfileUrl} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2"
                      style={{ fontSize: 12.5, color: "#0a0a0a", fontWeight: 300 }}>
                      <ArrowUpRight size={12} /> OpenAlex profile
                    </a>
                  )}
                  {(papers ?? []).slice(0, 8).map((p) => (
                    <a key={p.url} href={p.url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2"
                      style={{ fontSize: 12.5, color: "#0a0a0a", fontWeight: 300 }}>
                      <img src={fileLogo} alt="" style={{ width: 12, height: 12, display: "block", objectFit: "contain" }} />
                      <span style={{ color: "#525252" }}>{p.year}</span>
                      <span>{p.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

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
                {(draft.professor.title) && (
                  <span style={{ fontSize: 12.5, color: "#737373", fontWeight: 300 }}>
                    {draft.professor.title}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="px-5 py-4 flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <Building2 size={13} style={{ color: "#a3a3a3", flexShrink: 0 }} />
                  <div className="flex flex-col">
                    <span style={{ fontSize: 12.5, color: "#0a0a0a", fontWeight: 400 }}>
                      {draft.professor.university || draft.professor.affiliation || "Unknown"}
                    </span>
                    {(draft.professor.department) && (
                      <span style={{ fontSize: 11.5, color: "#a3a3a3", fontWeight: 300 }}>
                        {draft.professor.department}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Mail size={13} style={{ color: "#a3a3a3", flexShrink: 0 }} />
                  {draft.professor.email ? (
                    <a
                      href={`mailto:${draft.professor.email}`}
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      style={{ fontSize: 12.5, color: "#525252", fontWeight: 300 }}
                    >
                      {draft.professor.email}
                      <ArrowUpRight size={11} />
                    </a>
                  ) : (
                    <span style={{ fontSize: 12.5, color: "#d1d5db", fontWeight: 300 }}>
                      Email not found — search manually
                    </span>
                  )}
                </div>

                {/* Online presence */}
                <div className="flex items-start gap-2.5">
                  <User size={13} style={{ color: "#a3a3a3", flexShrink: 0, marginTop: 2 }} />
                  <div className="flex flex-wrap gap-2">
                    {draft.professor.homepage && (
                      <a href={draft.professor.homepage} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border"
                        style={{ fontSize: 11.5, borderColor: "#e5e5e5", color: "#0a0a0a", fontWeight: 300, background: "#fff" }}>
                        <ArrowUpRight size={11} /> homepage
                      </a>
                    )}
                    {openAlexProfileUrl && (
                      <a href={openAlexProfileUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border"
                        style={{ fontSize: 11.5, borderColor: "#e5e5e5", color: "#0a0a0a", fontWeight: 300, background: "#fff" }}>
                        <img src={openalexLogo} alt="" style={{ width: 12, height: 12, display: "block", objectFit: "contain" }} />
                        OpenAlex
                      </a>
                    )}
                    <a href={peopleSearchLinks.linkedin} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border"
                      style={{ fontSize: 11.5, borderColor: "#e5e5e5", color: "#0a0a0a", fontWeight: 300, background: "#fff" }}>
                      <img src={linkedinLogo} alt="" style={{ width: 12, height: 12, display: "block", objectFit: "contain" }} />
                      LinkedIn
                    </a>
                    <a href={peopleSearchLinks.scholar} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border"
                      style={{ fontSize: 11.5, borderColor: "#e5e5e5", color: "#0a0a0a", fontWeight: 300, background: "#fff" }}>
                      <ArrowUpRight size={11} /> Scholar search
                    </a>
                    <a href={peopleSearchLinks.google} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border"
                      style={{ fontSize: 11.5, borderColor: "#e5e5e5", color: "#0a0a0a", fontWeight: 300, background: "#fff" }}>
                      <img src={googleLogo} alt="" style={{ width: 12, height: 12, display: "block", objectFit: "contain" }} />
                      Google
                    </a>
                  </div>
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
                <span style={{ fontSize: 36, fontWeight: 300, color: "#0a0a0a", letterSpacing: "-0.03em", lineHeight: 1, fontFamily: "var(--font-display)" }}>
                  {(draft.matchScore * 100).toFixed(0)}
                </span>
                <span style={{ fontSize: 14, color: "#a3a3a3", fontWeight: 300, marginBottom: 4 }}>/ 100</span>
              </div>
              <div className="rounded-full overflow-hidden mb-2" style={{ height: 6, background: "#f0f0f0" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${draft.matchScore * 100}%`,
                    background: draft.matchScore >= 0.9 ? "#16a34a" : "#0a0a0a",
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
              <p style={{ fontSize: 12.5, color: "#525252", fontWeight: 300, lineHeight: 1.7, marginBottom: 10 }}>
                Picked for overlap on{" "}
                <span style={{ color: "#0a0a0a", fontWeight: 400 }}>
                  {draft.professor.research.slice(0, 2).join(" and ") || "your keywords"}
                </span>
                {papers?.[0]?.title ? (
                  <>
                    {" "}and a recent paper:{" "}
                    <span style={{ color: "#0a0a0a", fontWeight: 400 }}>
                      {papers[0].title}
                    </span>.
                  </>
                ) : (
                  "."
                )}
              </p>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
