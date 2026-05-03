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
import { findCompanyForQuery } from "../../lib/find_company";
import { useAuth } from "../../lib/auth";
import type { UserProfile } from "../../../cold_email_workflow/prompts/context";
import type { ToneProfile } from "../../../cold_email_workflow/prompts/tone";
import type { Company, CompanyContact } from "../../../cold_email_workflow/schemas";

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
  const tagRe =
    /@(?:(school|topic|n|count)\s*:\s*([^\s@]+(?:\s+[^\s@]+)*?)|(\d{1,2}))(?:\b|$)/gi;

  for (const line of raw.split("\n")) {
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(line)) !== null) {
      const kind = (m[1] ?? "").toLowerCase();
      const value = (m[2] ?? "").trim();
      const shorthandNum = m[3] ? Number(m[3]) : NaN;
      if (kind === "school" && value) schools.push(value);
      if (kind === "topic" && value) topics.push(value);
      if ((kind === "n" || kind === "count") && value) {
        const parsed = Number(value.replace(/[^\d]/g, ""));
        if (Number.isFinite(parsed) && parsed > 0) n = Math.min(parsed, 10);
      }
      if (!kind && Number.isFinite(shorthandNum) && shorthandNum > 0) n = Math.min(shorthandNum, 10);
    }
    const rest = line.replace(tagRe, "").replace(/\s{2,}/g, " ").trim();
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

// Coerce a Company + CompanyContact + draft into the existing OutreachDraft
// shape so the dashboard's persistence and detail UI keep working unchanged.
// Department/research chips become the team list; recentPapers becomes the
// company's notableWork. The current year is a placeholder — notableWork has
// no publish date in the seed.
function companyDraftToOutreachDraft(args: {
  company: Company;
  contact: CompanyContact;
  emailDraft: { subject: string; body: string };
  matchScore: number;
  color: string;
}): OutreachDraft {
  const { company, contact, emailDraft, matchScore, color } = args;
  const year = new Date().getFullYear();
  return {
    id: `draft_${company.id}_${contact.id}_${Date.now()}`,
    professor: {
      name: contact.name,
      title: contact.role,
      university: company.name,
      department: company.teams[0] ?? "Engineering",
      research: company.teams.slice(0, 4),
      email: contact.email,
      color,
      openAlexId: null,
      homepage: `https://${company.domain}`,
      recentPapers: company.notableWork.map((w) => ({
        title: w.title,
        year,
        url: w.url,
      })),
    },
    subject: emailDraft.subject,
    body: emailDraft.body,
    matchScore,
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
        <img src={ioiaLogo} alt="ioia" style={{ width: 22, height: 22, borderRadius: 6, display: "block" }} />
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
      const { researchAreas, institutions, opportunityType } = await extractKeywordsFromPrompt(value);
      // Heuristic fallback: if the LLM extractor misses an institution/count, infer from raw prompt.
      const inferredInstitutions = [...institutions];
      const hasBerkeley = /\b(uc\s*berkeley|u\.?\s*c\.?\s*berkeley|university of california[, ]+berkeley|berkeley)\b/i.test(value);
      const hasCMU = /\b(cmu|carnegie mellon)\b/i.test(value);
      const hasUCLA = /\b(ucla|uc\s*los\s*angeles|u\.?\s*c\.?\s*l\.?\s*a\.?)\b/i.test(value);
      const hasCalPoly = /\b(cal\s*poly(\s*slo)?|california\s*polytechnic\s*state\s*university)\b/i.test(value);
      if (inferredInstitutions.length === 0) {
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
        return Number.isFinite(n) && n > 0 ? Math.min(n, 10) : 5;
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

          return items;
        })(),
        tone: toneProfile,
      };

      const allKeywords = [...new Set([...researchAreas, ...(dbProfile?.research_interests ?? [])])];

      const drafts: OutreachDraft[] = [];
      const colors = ["#f0f4ff", "#fff7ed", "#f0fdf4", "#fdf4ff", "#fff1f2"];
      let summaryWithNote = "";

      if (opportunityType === "internship") {
        // Internship path: hit the seeded companies.json (no live network call)
        // and pick a recruiter or IC per match. The email writer's internship
        // branch consumes Company + CompanyContact.
        console.log("Searching companies with:", { value, inferredCount });
        const result = findCompanyForQuery(value, inferredCount);

        if (result.matches.length === 0) {
          const noMatchMsg: Message = {
            id: (Date.now() + 2).toString(), role: "agent",
            content: "I searched the company seed list but couldn't find a match. Try naming a company directly (e.g. \"intern at Linear\") or describing the team you want to work on.",
            steps: PIPELINE_STEPS.map((s) => ({ ...s, icon: "check" })),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => prev.map((m) => m.id === thinkingId ? noMatchMsg : m));
          saveChatMessage({ id: noMatchMsg.id, role: "agent", content: noMatchMsg.content, steps: null }, convId).catch(console.warn);
          setIsThinking(false);
          return;
        }

        for (const match of result.matches) {
          const company = match.company as Company;
          const contact = (company.contacts.find((c) => c.id === match.suggestedContactId) ?? company.contacts[0]) as CompanyContact;
          const teamFocus = company.teams.find((t) => value.toLowerCase().includes(t.toLowerCase()));
          try {
            const emailDraft = await draftEmail({
              user: userProfile,
              target: { kind: "internship", company, contact, teamFocus },
            });
            drafts.push(companyDraftToOutreachDraft({
              company, contact, emailDraft,
              matchScore: 1 - drafts.length * 0.04,
              color: colors[drafts.length % colors.length],
            }));
          } catch (e) { console.error(`Failed to draft for ${company.name}:`, e); }
        }

        const matchedCount = result.matches.length;
        const companyNames = result.matches.map((m) => m.company.name).slice(0, 3).join(", ");
        summaryWithNote = `Found ${matchedCount} compan${matchedCount !== 1 ? "ies" : "y"} matching your internship search (${companyNames}). I've drafted personalized emails for each, review them in Outreach.`;
      } else {
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

        for (const prof of matched) {
          try {
            const emailDraft = await draftEmail({
              user: userProfile,
              target: { kind: "research", professor: prof },
            });
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

        const requested = inferredCount;
        const note = matched.length < requested
          ? ` (you asked for ${requested}, but OpenAlex returned ${matched.length} strong matches for that school/topic)`
          : "";
        summaryWithNote = `Found ${matched.length} professor${matched.length !== 1 ? "s" : ""} matching your interests in ${allKeywords.slice(0, 3).join(", ")}${inferredInstitutions.length ? ` at ${inferredInstitutions.join(", ")}` : ""}${note}. I've drafted personalized emails for each — review them in Outreach.`;
      }
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
              onKeyDown={handleKey} textareaRef={textareaRef} disabled={isThinking} maxWidth={600} />
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
                      {msg.content}
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
                    <img src={ioiaLogo} alt="ioia" style={{ width: 22, height: 22, borderRadius: 6, display: "block" }} />
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
                onKeyDown={handleKey} textareaRef={textareaRef} disabled={isThinking} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InputCard({ value, onChange, onSend, onKeyDown, textareaRef, disabled, maxWidth }: {
  value: string; onChange: (v: string) => void; onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void; textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean; maxWidth?: number;
}) {
  return (
    <div className="w-full rounded-2xl border flex flex-col"
      style={{ maxWidth, background: "#fff", borderColor: "#e5e5e5", boxShadow: "0 2px 12px 0 rgba(0,0,0,0.05)" }}>
      <textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown} placeholder="Describe who you're looking for — research area, school, keywords…"
        rows={2} disabled={disabled} className="w-full resize-none outline-none bg-transparent px-4 pt-4 pb-2"
        style={{ fontSize: 14, color: "#0a0a0a", fontWeight: 300, lineHeight: 1.6, fontFamily: "var(--font-sans)", minHeight: 56, caretColor: "#0a0a0a" }} />
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors"
          style={{ fontSize: 12.5, color: "#a3a3a3", fontWeight: 300 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#525252"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#a3a3a3"; }}>
          <Paperclip size={13} /> Attach
        </button>
        <button onClick={onSend} disabled={!value.trim() || disabled}
          className="flex items-center justify-center rounded-lg"
          style={{ width: 32, height: 32, background: !value.trim() || disabled ? "#e5e5e5" : "#0a0a0a", cursor: !value.trim() || disabled ? "default" : "pointer", transition: "background 0.15s" }}>
          <ArrowUp size={15} color={!value.trim() || disabled ? "#a3a3a3" : "#fff"} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
