import { supabase } from "./supabase";
import type { DbProfessor, DbOutreachDraft, DbOutreachEmail, DbChatMessage } from "./supabase";
import type { OutreachDraft } from "../app/components/mock-data";

// ── Chat messages ─────────────────────────────────────────────────────────────

export async function loadChatMessages(): Promise<DbChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) { console.error("loadChatMessages:", error.message); return []; }
  return data ?? [];
}

export async function saveChatMessage(
  msg: Omit<DbChatMessage, "created_at">
): Promise<void> {
  const { error } = await supabase.from("chat_messages").upsert(msg);
  if (error) console.error("saveChatMessage:", error.message);
}

// ── Professors ────────────────────────────────────────────────────────────────

export async function loadProfessors(): Promise<DbProfessor[]> {
  const { data, error } = await supabase
    .from("professors")
    .select("*")
    .order("match_score", { ascending: false });
  if (error) { console.error("loadProfessors:", error.message); return []; }
  return data ?? [];
}

export async function upsertProfessor(
  prof: Omit<DbProfessor, "created_at">
): Promise<void> {
  const { error } = await supabase.from("professors").upsert(prof);
  if (error) console.error("upsertProfessor:", error.message);
}

// ── Outreach drafts ───────────────────────────────────────────────────────────

export async function loadOutreachDrafts(): Promise<(DbOutreachDraft & { professor: DbProfessor })[]> {
  const { data, error } = await supabase
    .from("outreach_drafts")
    .select("*, professor:professors(*)")
    .order("created_at", { ascending: false });
  if (error) { console.error("loadOutreachDrafts:", error.message); return []; }
  return (data ?? []) as (DbOutreachDraft & { professor: DbProfessor })[];
}

export async function saveDraft(
  draft: OutreachDraft,
  status: "draft" | "sent" = "draft"
): Promise<void> {
  // Upsert the professor first
  await upsertProfessor({
    id: `prof_${draft.professor.name.replace(/\s+/g, "_").toLowerCase()}`,
    name: draft.professor.name,
    title: draft.professor.title,
    institution: draft.professor.university,
    department: draft.professor.department,
    research: draft.professor.research,
    recent_paper: null,
    match_score: draft.matchScore,
    email: draft.professor.email,
    color: draft.professor.color,
  });

  const { error } = await supabase.from("outreach_drafts").upsert({
    id: draft.id,
    professor_id: `prof_${draft.professor.name.replace(/\s+/g, "_").toLowerCase()}`,
    subject: draft.subject,
    body: draft.body,
    match_score: draft.matchScore,
    status,
  });
  if (error) console.error("saveDraft:", error.message);
}

export async function updateDraftStatus(
  id: string,
  status: "draft" | "sent"
): Promise<void> {
  const { error } = await supabase
    .from("outreach_drafts")
    .update({ status })
    .eq("id", id);
  if (error) console.error("updateDraftStatus:", error.message);
}

export async function deleteDraft(id: string): Promise<void> {
  const { error } = await supabase
    .from("outreach_drafts")
    .delete()
    .eq("id", id);
  if (error) console.error("deleteDraft:", error.message);
}

// ── Outreach emails (sent log) ────────────────────────────────────────────────

export async function loadOutreachEmails(): Promise<DbOutreachEmail[]> {
  const { data, error } = await supabase
    .from("outreach_emails")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("loadOutreachEmails:", error.message); return []; }
  return data ?? [];
}

export async function saveOutreachEmail(
  email: Omit<DbOutreachEmail, "created_at">
): Promise<void> {
  const { error } = await supabase.from("outreach_emails").upsert(email);
  if (error) console.error("saveOutreachEmail:", error.message);
}
