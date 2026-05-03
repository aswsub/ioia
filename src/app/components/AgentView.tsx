import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Paperclip, Loader2, Search, Mail, CheckCircle2, ArrowRight, Plus, Trash2, MessageSquare } from "lucide-react";
import { OutreachDraft } from "./mock-data";
import ioiaLogo from "figma:asset/ioia.png";
import {
  loadChatMessages, saveChatMessage, loadUserProfile,
  loadConversations, createConversation, updateConversationTitle, deleteConversation,
  type DbConversation,
} from "../../lib/db";
import { extractKeywordsFromPrompt, draftEmail } from "../../lib/claude";
import { searchProfessors } from "../../lib/openalex";
import { extractTextFromFile } from "../../lib/ocr";
import { useAuth } from "../../lib/auth";
import type { UserProfile } from "../../../cold_email_workflow/prompts/context";
import type { ToneProfile } from "../../../cold_email_workflow/prompts/tone";

type ToolStep = { icon: "search" | "mail" | "check"; label: string };
type Message = { id: string; role: "user" | "agent"; content: string; steps?: ToolStep[]; timestamp: string };

const SUGGESTIONS = [
  "Find ML professors at MIT and Stanford researching LLMs",
  "Draft outreach for NLP research at top-10 CS schools",
  "Who works on reinforcement learning at CMU or Berkeley?",
  "Find professors working on formal verification",
];

const PIPELINE_STEPS: ToolStep[] = [
  { icon: "search", label: "Parsing your request" },
  { icon: "search", label: "Searching OpenAlex for matching professors" },
  { icon: "mail", label: "Drafting personalized emails" },
  { icon: "check", label: "Done" },
];

function parseAtTags(raw: string): {
  cleaned: string;
  schools: string[];
  topics: string[];
  n: number | null;
} {
  const schools: string[] = [];
  const topics: string[] = [];
  let n: number | null = null;

  const cleanedLines: string[] = [];
  // Tag grammar:
  // - @school:UCLA (no spaces), or @school:"UC Berkeley"
  // - @topic:rl, or @topic:"Biomedical engineering"
  // - @n:10 / @count:10
  //
  // Values with spaces MUST be quoted; this avoids accidental capture like:
  // "@school:UCLA that are related to @topic:..."
  const tagRe = /@(school|topic|n|count)\s*:\s*(?:"([^"]+)"|([^\s@]+))/gi;
  const shorthandRe = /@(\d{1,2})(?:\b|$)/g;

  for (const line of raw.split("\n")) {
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(line)) !== null) {
      const kind = (m[1] ?? "").toLowerCase();
      const value = (m[2] ?? m[3] ?? "").trim();
      if (kind === "school" && value) schools.push(value);
      if (kind === "topic" && value) topics.push(value);
      if ((kind === "n" || kind === "count") && value) {
        const parsed = Number(value.replace(/[^\d]/g, ""));
        if (Number.isFinite(parsed) && parsed > 0) n = Math.min(parsed, 10);
      }
    }
    for (const sm of line.matchAll(shorthandRe)) {
      const shorthandNum = Number(sm[1]);
      if (Number.isFinite(shorthandNum) && shorthandNum > 0) n = Math.min(shorthandNum, 10);
    }
    const rest = line.replace(tagRe, "").replace(shorthandRe, "").replace(/\s{2,}/g, " ").trim();
    if (rest) cleanedLines.push(rest);
  }

  const uniq = (arr: string[]) => Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));

  return {
    cleaned: cleanedLines.join("\n").trim(),
    schools: uniq(schools),
    topics: uniq(topics),
    n,
  };
}

function ToolStepRow({ step, delay }: { step: ToolStep; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const Icon = step.icon === "search" ? Search : step.icon === "mail" ? Mail : CheckCircle2;
  if (!visible) return null;
  return (
    <div className="flex items-center gap-2" style={{ fontSize: 12, color: "#737373", fontWeight: 300, animation: "fadeSlideIn 0.25s ease" }}>
      <Icon size={12} style={{ color: step.icon === "check" ? "#16a34a" : "#a3a3a3", flexShrink: 0 }} />
      {step.label}
    </div>
  );
}

function AgentMessage({ msg, isNew }: { msg: Message; isNew?: boolean }) {
  const [showContent, setShowContent] = useState(false);
  const [thinkingDone, setThinkingDone] = useState(!isNew);
  useEffect(() => {
    if (!isNew) { setShowContent(true); setThinkingDone(true); return; }
    const stepsTotal = (msg.steps?.length ?? 0) * 600 + 400;
    const t1 = setTimeout(() => setThinkingDone(true), stepsTotal);
    const t2 = setTimeout(() => setShowContent(true), stepsTotal + 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isNew, msg.steps]);
  return (
    <div className="flex gap-3" style={{ animation: isNew ? "fadeSlideIn 0.3s ease" : "none" }}>
      <div className="flex-shrink-0 mt-0.5" style={{ width: 22, height: 22 }}>
        <img src={ioiaLogo} alt="ioia" style={{ width: 20, height: 20, borderRadius: 6, display: "block", objectFit: "contain", objectPosition: "center" }} />
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {isNew && msg.steps && (
          <div className="flex flex-col gap-1.5" style={{ paddingTop: 2 }}>
            {msg.steps.map((s, i) => <ToolStepRow key={i} step={s} delay={i * 600 + 200} />)}
          </div>
        )}
        {isNew && !thinkingDone && <Loader2 size={13} style={{ color: "#a3a3a3", animation: "spin 1s linear infinite" }} />}
        {showContent && (
          <p style={{ fontSize: 13.5, color: "#0a0a0a", lineHeight: 1.7, fontWeight: 300, animation: "fadeSlideIn 0.3s ease" }}>
            {msg.content}
          </p>
        )}
        <span style={{ fontSize: 11, color: "#d4d4d4", fontWeight: 300 }}>{msg.timestamp}</span>
      </div>
    </div>
  );
}

function renderUserTextWithTags(text: string) {
  // Basic inline highlighting for @school/@topic/@n tags in the chat bubble.
  const parts: Array<{ t: string; kind: "school" | "topic" | "n" | null }> = [];
  const re = /@(school|topic|n|count)\s*:\s*(?:"([^"]+)"|([^\s@]+))|@(\d{1,2})(?:\b|$)/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ t: text.slice(last, m.index), kind: null });
    if (m[1]) {
      const kind = (m[1] === "count" ? "n" : (m[1] as any)) as "school" | "topic" | "n";
      parts.push({ t: m[0], kind });
    } else if (m[4]) {
      parts.push({ t: `@${m[4]}`, kind: "n" });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ t: text.slice(last), kind: null });

  const styleFor = (kind: "school" | "topic" | "n") => {
    if (kind === "school") return { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" };
    if (kind === "topic") return { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" };
    return { background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" };
  };

  return parts.map((p, idx) => {
    if (!p.kind) return <span key={idx}>{p.t}</span>;
    const s = styleFor(p.kind);
    return (
      <span
        key={idx}
        className="rounded-md px-1"
        style={{ ...s, fontFamily: "var(--font-display)", fontSize: 12.5, paddingTop: 1, paddingBottom: 1 }}
      >
        {p.t.trim()}
      </span>
    );
  });
}

export function AgentView({
  onDraftsReady,
  onNavigateToOutreach,
}: {
  onDraftsReady?: (drafts: OutreachDraft[]) => void;
  onNavigateToOutreach?: () => void;
}) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<DbConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; text: string }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load conversation list on mount
  useEffect(() => {
    loadConversations().then((convs) => {
      setConversations(convs);
      if (convs.length > 0) setActiveConvId(convs[0].id);
    });
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    loadChatMessages(activeConvId).then((rows) => {
      // Avoid clobbering optimistic UI messages when the DB hasn't caught up yet.
      if (rows.length === 0 && messagesRef.current.length > 0) return;
      const fromDb = rows.map((r) => ({
        id: r.id,
        role: r.role as "user" | "agent",
        content: r.content,
        steps: r.steps ? (r.steps as ToolStep[]) : undefined,
        timestamp: new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }));
      const merged = (() => {
        const byId = new Map<string, Message>();
        for (const m of messagesRef.current) byId.set(m.id, m);
        for (const m of fromDb) byId.set(m.id, m);
        return Array.from(byId.values());
      })();
      setMessages(merged);
    });
  }, [activeConvId]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isThinking]);

  const startNewConversation = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
    setInput("");
  }, []);

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
  };

  const send = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || isThinking) return;

    // Create a new conversation if none is active
    let convId = activeConvId;
    if (!convId) {
      convId = `conv_${Date.now()}`;
      const title = value.slice(0, 60);
      // Fire and forget — don't let DB failure block the chat
      createConversation(convId, title).catch((e) => console.warn("createConversation failed:", e));
      const newConv: DbConversation = {
        id: convId, user_id: user?.id ?? "", title,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(convId);
    }

    const userMsg: Message = {
      id: Date.now().toString(), role: "user", content: value,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsThinking(true);
    saveChatMessage({ id: userMsg.id, role: "user", content: userMsg.content, steps: null }, convId).catch(console.warn);

    const thinkingId = (Date.now() + 1).toString();
    const thinkingMsg: Message = {
      id: thinkingId, role: "agent", content: "",
      steps: PIPELINE_STEPS,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, thinkingMsg]);

    try {
      const tags = parseAtTags(value);
      const llmInput = tags.cleaned || value;
      const { researchAreas, institutions, opportunityType } = await extractKeywordsFromPrompt(llmInput);
      // Heuristic fallback: if the LLM extractor misses an institution/count, infer from raw prompt.
      const inferredInstitutions = [...institutions];
      const hasBerkeley = /\b(uc\s*berkeley|u\.?\s*c\.?\s*berkeley|university of california[, ]+berkeley|berkeley)\b/i.test(value);
      const hasCMU = /\b(cmu|carnegie mellon)\b/i.test(value);
      const hasUCLA = /\b(ucla|uc\s*los\s*angeles|u\.?\s*c\.?\s*l\.?\s*a\.?)\b/i.test(value);
      const hasCalPoly = /\b(cal\s*poly(\s*slo)?|california\s*polytechnic\s*state\s*university)\b/i.test(value);
      if (tags.schools.length > 0) {
        inferredInstitutions.splice(0, inferredInstitutions.length, ...tags.schools);
      } else if (inferredInstitutions.length === 0) {
        if (hasCMU) inferredInstitutions.push("CMU");
        if (hasBerkeley) inferredInstitutions.push("UC Berkeley");
        if (hasUCLA) inferredInstitutions.push("UCLA");
        if (hasCalPoly) inferredInstitutions.push("Cal Poly");
      }
      const inferredCount = (() => {
        // Support "find me 10", "show us 5", etc.
        const m =
          value.match(/\b(find|give|show|list)\b(?:\s+\w+){0,3}\s+(\d{1,2})\b/i) ??
          value.match(/\b(\d{1,2})\s+(professors?|faculty)\b/i);
        const n = m ? Number(m[2] ?? m[1]) : NaN;
        const fromText = Number.isFinite(n) && n > 0 ? Math.min(n, 10) : 5;
        return typeof tags.n === "number" ? tags.n : fromText;
      })();

      console.log("Extracted:", { researchAreas, institutions: inferredInstitutions, opportunityType, inferredCount });
      const dbProfile = user ? await loadUserProfile(user.id) : null;

      const toneProfile: ToneProfile = {
        voice: (dbProfile?.tone_voice as ToneProfile["voice"]) ?? "conversational",
        length: (dbProfile?.tone_length as ToneProfile["length"]) ?? "moderate",
        traits: (dbProfile?.tone_traits ?? []) as ToneProfile["traits"],
        signaturePhrases: dbProfile?.tone_signature_phrases ?? [],
        avoidPhrases: dbProfile?.tone_avoid_phrases ?? [],
        confidence: (dbProfile?.tone_confidence as ToneProfile["confidence"]) ?? "low",
      };

      const userProfile: UserProfile = {
        fullName: dbProfile?.full_name ?? user?.user_metadata?.full_name ?? "Student",
        university: dbProfile?.university ?? "",
        major: dbProfile?.major ?? "",
        gpa: dbProfile?.gpa ?? null,
        researchInterests: dbProfile?.research_interests ?? researchAreas,
        shortBio: dbProfile?.short_bio ?? "",
        experience: (() => {
          const resume = dbProfile?.resume_text?.trim();
          if (!resume) return [];

          // Heuristic chunking: split into sections and treat each as an "experience" item so the
          // drafting prompt can choose the most relevant highlights instead of reusing one blob.
          const chunks = resume
            .split(/\n{2,}/g)
            .map((c) => c.trim())
            .filter(Boolean)
            .slice(0, 6);

          const items = chunks.map((chunk, idx) => {
            const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
            const title = (lines[0] ?? `Resume section ${idx + 1}`).slice(0, 80);
            const description = lines.slice(1).join("\n").slice(0, 900) || chunk.slice(0, 900);
            return { title, org: dbProfile.university ?? "", description };
          });

          // Always include a compact full-resume fallback at the end (capped).
          items.push({
            title: "Full resume (compressed)",
            org: dbProfile.university ?? "",
            description: resume.slice(0, 2000),
          });

          // Add current chat attachments as additional context for drafting.
          for (const a of attachments.slice(0, 3)) {
            items.push({
              title: `Attachment: ${a.name}`.slice(0, 80),
              org: dbProfile?.university ?? "",
              description: a.text.slice(0, 1200),
            });
          }

          return items;
        })(),
        tone: toneProfile,
      };

      const allKeywords = (() => {
        const base = [...researchAreas, ...(dbProfile?.research_interests ?? [])];
        const merged = [...new Set([...base, ...tags.topics])];
        if (tags.topics.length > 0) {
          const first = tags.topics;
          const rest = merged.filter((k) => !first.includes(k));
          return [...first, ...rest];
        }
        return merged;
      })();
      console.log("Searching OpenAlex with:", { allKeywords, institutions: inferredInstitutions, inferredCount });
      const matched = await searchProfessors(allKeywords, inferredInstitutions, inferredCount);

      if (matched.length === 0) {
        const noMatchMsg: Message = {
          id: (Date.now() + 2).toString(), role: "agent",
          content: "I searched OpenAlex but couldn't find professors matching your request. Try different keywords or a broader research area.",
          steps: PIPELINE_STEPS.map((s) => ({ ...s, icon: "check" })),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => prev.map((m) => m.id === thinkingId ? noMatchMsg : m));
        saveChatMessage({ id: noMatchMsg.id, role: "agent", content: noMatchMsg.content, steps: null }, convId).catch(console.warn);
        setIsThinking(false);
        return;
      }

      // Persist/merge latest professor matches so the Professors tab can show a running history.
      try {
        localStorage.setItem("ioia:last_professors_batch", JSON.stringify(matched));
        const raw = localStorage.getItem("ioia:last_professors");
        const existing = raw ? (JSON.parse(raw) as Professor[]) : [];
        const byId = new Map<string, Professor>();
        for (const p of existing ?? []) if (p?.id) byId.set(p.id, p);
        for (const p of matched) if (p?.id) byId.set(p.id, p);
        localStorage.setItem("ioia:last_professors", JSON.stringify(Array.from(byId.values())));
      } catch { /* ignore */ }

      const drafts: OutreachDraft[] = [];
      for (const prof of matched) {
        try {
          const emailDraft = await draftEmail({ user: userProfile, target: { kind: "research", professor: prof } });
          const colors = ["#f0f4ff", "#fff7ed", "#f0fdf4", "#fdf4ff", "#fff1f2"];
          drafts.push({
            id: `draft_${prof.id}_${Date.now()}`,
            professor: {
              name: prof.name, title: "Professor", university: prof.affiliation,
              department: prof.concepts[0]?.name ?? "CS",
              research: prof.concepts.slice(0, 3).map((c) => c.name),
              email: prof.email ?? "", color: colors[drafts.length % colors.length],
              openAlexId: prof.id,
              homepage: prof.homepage,
              recentPapers: prof.recentPapers?.map((p) => ({ title: p.title, year: p.year, url: p.url })) ?? [],
            },
            subject: emailDraft.subject, body: emailDraft.body, matchScore: prof.matchScore,
          });
        } catch (e) { console.error(`Failed to draft for ${prof.name}:`, e); }
      }

      // Persist draft batch metadata so Outreach can filter "latest chat" vs "all".
      try {
        const ids = drafts.map((d) => d.id);
        localStorage.setItem("ioia:last_draft_batch_ids", JSON.stringify(ids));
        localStorage.setItem("ioia:last_draft_batch_prompt", value.slice(0, 160));
        localStorage.setItem("ioia:last_draft_batch_at", new Date().toISOString());
      } catch { /* ignore */ }

      const summary = `Found ${matched.length} professor${matched.length !== 1 ? "s" : ""} matching your interests in ${allKeywords.slice(0, 3).join(", ")}${inferredInstitutions.length ? ` at ${inferredInstitutions.join(", ")}` : ""}. I've drafted personalized emails for each — review them in Outreach.`;
      const requested = inferredCount;
      
      // Check if any matches are low-confidence (< 0.35 score)
      const lowConfidenceMatches = matched.filter((p) => p.matchScore < 0.35);
      const hasLowConfidence = lowConfidenceMatches.length > 0;
      
      let note = "";
      if (matched.length < requested) {
        note = ` (you asked for ${requested}, but OpenAlex returned ${matched.length} strong matches for that school/topic)`;
      }
      if (hasLowConfidence && matched.length === 1) {
        note += ` ⚠️ Note: This is a low-confidence match (${(matched[0].matchScore * 100).toFixed(0)}% relevance). Try broadening your search or using different keywords.`;
      }
      
      const summaryWithNote = `Found ${matched.length} professor${matched.length !== 1 ? "s" : ""} matching your interests in ${allKeywords.slice(0, 3).join(", ")}${inferredInstitutions.length ? ` at ${inferredInstitutions.join(", ")}` : ""}${note}. I've drafted personalized emails for each — review them in Outreach.`;
      const agentMsg: Message = {
        id: (Date.now() + 2).toString(), role: "agent", content: summaryWithNote,
        steps: PIPELINE_STEPS.map((s) => ({ ...s, icon: "check" })),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => prev.map((m) => m.id === thinkingId ? agentMsg : m));
      saveChatMessage({ id: agentMsg.id, role: "agent", content: agentMsg.content, steps: null }, convId).catch(console.warn);
      if (drafts.length > 0) onDraftsReady?.(drafts);

      // Update title to first user message
      if (messages.length === 0) {
        updateConversationTitle(convId, value.slice(0, 60));
        setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, title: value.slice(0, 60) } : c));
      }

    } catch (err) {
      console.error("Agent pipeline error:", err);
      const errMsg: Message = {
        id: (Date.now() + 2).toString(), role: "agent",
        content: `Something went wrong: ${err instanceof Error ? err.message : String(err)}`,
        steps: PIPELINE_STEPS.map((s) => ({ ...s, icon: "check" })),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => prev.map((m) => m.id === thinkingId ? errMsg : m));
    } finally {
      setIsThinking(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-1 min-w-0 h-full overflow-hidden" style={{ fontFamily: "var(--font-sans)" }}>
      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Conversation sidebar ── */}
      <div className="flex flex-col border-r flex-shrink-0" style={{ width: 220, borderColor: "#e5e5e5", background: "#fff" }}>
        <div className="px-3 py-3 border-b flex items-center justify-between" style={{ borderColor: "#e5e5e5" }}>
          <span style={{ fontSize: 12, fontWeight: 400, color: "#0a0a0a" }}>Chats</span>
          <button onClick={startNewConversation}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{ width: 26, height: 26 }} title="New chat"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <Plus size={14} color="#525252" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-24 gap-1">
              <MessageSquare size={16} color="#d4d4d4" />
              <span style={{ fontSize: 11.5, color: "#d4d4d4", fontWeight: 300 }}>No chats yet</span>
            </div>
          )}
          {conversations.map((conv) => {
            const isActive = conv.id === activeConvId;
            return (
              <div key={conv.id} onClick={() => setActiveConvId(conv.id)}
                className="group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors mx-1 rounded-lg"
                style={{ background: isActive ? "#f5f5f5" : "transparent" }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <MessageSquare size={12} color={isActive ? "#0a0a0a" : "#a3a3a3"} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: isActive ? "#0a0a0a" : "#525252", fontWeight: isActive ? 400 : 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {conv.title}
                </span>
                <button onClick={(e) => handleDeleteConversation(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  style={{ color: "#a3a3a3" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#a3a3a3"; }}>
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative" style={{ background: "#fafafa" }}>
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center flex-1 px-6" style={{ paddingBottom: 120 }}>
            <h1 style={{ fontSize: 32, fontWeight: 300, color: "#0a0a0a", letterSpacing: "-0.03em", textAlign: "center", lineHeight: 1.2, maxWidth: 560, marginBottom: 10 }}>
              Find professors. Write emails.{" "}
              <span style={{ color: "#a3a3a3" }}>Get responses.</span>
            </h1>
            <p style={{ fontSize: 14, color: "#a3a3a3", fontWeight: 300, textAlign: "center", marginBottom: 32, maxWidth: 400, lineHeight: 1.6 }}>
              Describe your research interests and ioia handles discovery, personalization, and outreach.
            </p>
            <InputCard value={input} onChange={(v) => { setInput(v); autoResize(); }} onSend={() => send()}
              onKeyDown={handleKey} textareaRef={textareaRef} disabled={isThinking} maxWidth={600}
              attachments={attachments}
              onAddAttachment={(att) => setAttachments((prev) => [...prev, att].slice(-5))}
              onRemoveAttachment={(name) => setAttachments((prev) => prev.filter((a) => a.name !== name))}
            />
            <div className="flex flex-wrap gap-2 justify-center mt-5" style={{ maxWidth: 600 }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="rounded-full border px-3 py-1.5 transition-colors"
                  style={{ fontSize: 12, color: "#525252", borderColor: "#e5e5e5", background: "#fff", fontWeight: 300 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasMessages && (
          <div className="flex-1 overflow-y-auto px-6" style={{ paddingTop: 40, paddingBottom: 160 }}>
            <div className="mx-auto flex flex-col gap-6" style={{ maxWidth: 640 }}>
              {messages.map((msg, i) =>
                msg.role === "user" ? (
                  <div key={msg.id} className="flex justify-end">
                    <div className="rounded-2xl px-4 py-2.5"
                      style={{ background: "#fff", border: "1px solid #e5e5e5", fontSize: 13.5, color: "#0a0a0a", fontWeight: 300, maxWidth: "80%", lineHeight: 1.6, animation: "fadeSlideIn 0.25s ease" }}>
                      {renderUserTextWithTags(msg.content)}
                    </div>
                  </div>
                ) : (
                  <div key={msg.id}>
                    <AgentMessage msg={msg} isNew={i === messages.length - 1 && !isThinking} />
                    {i === messages.length - 1 && !isThinking && onNavigateToOutreach && msg.content && (
                      <button onClick={onNavigateToOutreach}
                        className="flex items-center gap-2 mt-3 ml-8 rounded-lg px-4 py-2 border transition-colors"
                        style={{ fontSize: 12.5, color: "#0a0a0a", borderColor: "#e5e5e5", background: "#fff", fontWeight: 400, animation: "fadeSlideIn 0.4s ease 0.3s both" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}>
                        Review drafts in Outreach <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                )
              )}
              {isThinking && (
                <div className="flex gap-3 items-center" style={{ animation: "fadeSlideIn 0.25s ease" }}>
                  <div className="flex-shrink-0" style={{ width: 22, height: 22 }}>
                    <img src={ioiaLogo} alt="ioia" style={{ width: 20, height: 20, borderRadius: 6, display: "block", objectFit: "contain", objectPosition: "center" }} />
                  </div>
                  <Loader2 size={13} style={{ color: "#a3a3a3", animation: "spin 1s linear infinite" }} />
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        {hasMessages && (
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-4"
            style={{ background: "linear-gradient(to top, #fafafa 70%, transparent)" }}>
            <div className="mx-auto" style={{ maxWidth: 640 }}>
              <InputCard value={input} onChange={(v) => { setInput(v); autoResize(); }} onSend={() => send()}
                onKeyDown={handleKey} textareaRef={textareaRef} disabled={isThinking}
                attachments={attachments}
                onAddAttachment={(att) => setAttachments((prev) => [...prev, att].slice(-5))}
                onRemoveAttachment={(name) => setAttachments((prev) => prev.filter((a) => a.name !== name))}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InputCard({ value, onChange, onSend, onKeyDown, textareaRef, disabled, maxWidth, attachments, onAddAttachment, onRemoveAttachment }: {
  value: string; onChange: (v: string) => void; onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void; textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean; maxWidth?: number;
  attachments: { name: string; text: string }[];
  onAddAttachment: (att: { name: string; text: string }) => void;
  onRemoveAttachment: (name: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [activeKind, setActiveKind] = useState<"school" | "topic" | "n">("school");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tags = parseAtTags(value);

  const SCHOOL_OPTIONS = ["UC Berkeley", "UCLA", "CMU", "Cal Poly SLO", "UC Irvine"];
  const TOPIC_OPTIONS = ["reinforcement learning", "machine learning", "AI infrastructure", "LLMs"];
  const N_OPTIONS = ["3", "5", "10"];

  const insertTag = (kind: "school" | "topic" | "n", val: string) => {
    const ta = textareaRef.current;
    const cur = value;
    const maybeQuote = (s: string) => (/\s/.test(s) ? `"${s.replaceAll("\"", "")}"` : s);
    const at = kind === "n"
      ? `@n:${val}`
      : kind === "school"
        ? `@school:${maybeQuote(val)}`
        : `@topic:${maybeQuote(val)}`;
    if (!ta) {
      onChange((cur + (cur.endsWith(" ") || cur.length === 0 ? "" : " ") + at + " ").trimStart());
      return;
    }
    const start = ta.selectionStart ?? cur.length;
    const end = ta.selectionEnd ?? cur.length;
    const before = cur.slice(0, start);
    const after = cur.slice(end);
    const prefix = before.endsWith(" ") || before.length === 0 ? "" : " ";
    const next = `${before}${prefix}${at} ${after}`.replace(/\s{2,}/g, " ");
    onChange(next);
    requestAnimationFrame(() => {
      const pos = (before + prefix + at + " ").length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
    setShowMenu(false);
  };

  return (
    <div className="w-full rounded-2xl border flex flex-col"
      style={{ maxWidth, background: "#fff", borderColor: "#e5e5e5", boxShadow: "0 2px 12px 0 rgba(0,0,0,0.05)" }}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v);
            setShowMenu(v.includes("@"));
          }}
          onKeyDown={onKeyDown}
          placeholder="Describe who you're looking for — research area, school, keywords…"
          rows={2}
          disabled={disabled}
          className="w-full resize-none outline-none bg-transparent px-4 pt-4 pb-2"
          style={{ fontSize: 14, color: "#0a0a0a", fontWeight: 300, lineHeight: 1.6, fontFamily: "var(--font-sans)", minHeight: 56, caretColor: "#0a0a0a" }}
        />

        {showMenu && !disabled && (
          <div
            className="absolute left-4 right-4 -top-3 translate-y-[-100%] rounded-xl border shadow-sm overflow-hidden"
            style={{ background: "#fff", borderColor: "#e5e5e5" }}
          >
            <div className="flex items-center gap-1 p-1" style={{ background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
              {(["school", "topic", "n"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setActiveKind(k)}
                  className="rounded-lg px-2.5 py-1 transition-all"
                  style={{
                    fontSize: 12,
                    fontWeight: activeKind === k ? 400 : 300,
                    color: activeKind === k ? "#0a0a0a" : "#737373",
                    background: activeKind === k ? "#fff" : "transparent",
                    boxShadow: activeKind === k ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  @{k}
                </button>
              ))}
              <button
                onClick={() => setShowMenu(false)}
                className="ml-auto rounded-lg px-2.5 py-1"
                style={{ fontSize: 12, color: "#a3a3a3", fontWeight: 300 }}
              >
                close
              </button>
            </div>
            <div className="p-2 flex flex-wrap gap-1.5">
              {(activeKind === "school" ? SCHOOL_OPTIONS : activeKind === "topic" ? TOPIC_OPTIONS : N_OPTIONS).map((opt) => (
                <button
                  key={opt}
                  onClick={() => insertTag(activeKind, opt)}
                  className="rounded-full px-2.5 py-1 border transition-colors"
                  style={{ fontSize: 12, borderColor: "#e5e5e5", background: "#fff", color: "#0a0a0a", fontWeight: 300 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                >
                  {activeKind === "n" ? `@n:${opt}` : activeKind === "school" ? `@school:${opt}` : `@topic:${opt}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {(tags.schools.length > 0 || tags.topics.length > 0 || typeof tags.n === "number") && (
        <div className="px-4 pb-1 flex flex-wrap gap-1.5">
          {tags.schools.map((s) => (
            <span key={`school:${s}`} className="rounded-full px-2 py-0.5"
              style={{ fontSize: 11, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontWeight: 300 }}>
              @school:{s}
            </span>
          ))}
          {tags.topics.map((t) => (
            <span key={`topic:${t}`} className="rounded-full px-2 py-0.5"
              style={{ fontSize: 11, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontWeight: 300 }}>
              @topic:{t}
            </span>
          ))}
          {typeof tags.n === "number" && (
            <span className="rounded-full px-2 py-0.5"
              style={{ fontSize: 11, background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", fontWeight: 300 }}>
              @n:{tags.n}
            </span>
          )}
        </div>
      )}
      {attachments.length > 0 && (
        <div className="px-4 pb-1 flex flex-wrap gap-1.5">
          {attachments.map((a) => (
            <button
              key={a.name}
              onClick={() => onRemoveAttachment(a.name)}
              className="rounded-full px-2 py-0.5 border"
              style={{ fontSize: 11, background: "#fff", color: "#525252", borderColor: "#e5e5e5", fontWeight: 300 }}
              title="Remove attachment"
            >
              {a.name} ×
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await extractTextFromFile(file);
                onAddAttachment({ name: file.name, text });
              } catch (err) {
                console.warn("attach extract failed:", err);
              } finally {
                // allow re-selecting same file
                e.target.value = "";
              }
            }}
          />
          <button
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors"
          style={{ fontSize: 12.5, color: "#a3a3a3", fontWeight: 300 }}
            onClick={() => fileInputRef.current?.click()}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#525252"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#a3a3a3"; }}>
          <Paperclip size={13} /> Attach
          </button>
        </div>
        <button onClick={onSend} disabled={!value.trim() || disabled}
          className="flex items-center justify-center rounded-lg"
          style={{ width: 32, height: 32, background: !value.trim() || disabled ? "#e5e5e5" : "#0a0a0a", cursor: !value.trim() || disabled ? "default" : "pointer", transition: "background 0.15s" }}>
          <ArrowUp size={15} color={!value.trim() || disabled ? "#a3a3a3" : "#fff"} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
