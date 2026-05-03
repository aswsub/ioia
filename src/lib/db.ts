import { supabase } from "./supabase";
import type { DbProfessor, DbOutreachDraft, DbOutreachEmail, DbChatMessage } from "./supabase";
import type { OutreachDraft } from "../app/components/mock-data";

// Helper — get the current user's id without throwing
async function uid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ── Chat messages ─────────────────────────────────────────────────────────────

export async function loadChatMessages(conversationId: string): Promise<DbChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) { console.error("loadChatMessages:", error.message); return []; }
  return data ?? [];
}

export async function saveChatMessage(
  msg: Omit<DbChatMessage, "created_at">,
  conversationId: string
): Promise<void> {
  const userId = await uid();
  const { error } = await supabase.from("chat_messages").upsert({
    ...msg,
    user_id: userId,
    conversation_id: conversationId,
  });
  if (error) console.error("saveChatMessage:", error.message);
}

// ── Conversations ─────────────────────────────────────────────────────────────

export type DbConversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export async function loadConversations(): Promise<DbConversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) { console.error("loadConversations:", error.message); return []; }
  return data ?? [];
}

export async function createConversation(id: string, title: string): Promise<void> {
  const userId = await uid();
  const { error } = await supabase.from("conversations").insert({
    id,
    user_id: userId,
    title,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("createConversation:", error.message);
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("updateConversationTitle:", error.message);
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  if (error) console.error("deleteConversation:", error.message);
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
  const userId = await uid();
  const { error } = await supabase.from("professors").upsert({ ...prof, user_id: userId });
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
  const profId =
    draft.professor.openAlexId?.trim()
      ? draft.professor.openAlexId.trim()
      : `prof_${draft.professor.name.replace(/\s+/g, "_").toLowerCase()}`;

  // Upsert the professor first
  await upsertProfessor({
    id: profId,
    name: draft.professor.name,
    title: draft.professor.title,
    institution: draft.professor.university,
    department: draft.professor.department,
    research: draft.professor.research,
    recent_paper: draft.professor.recentPapers?.[0]?.title ?? null,
    match_score: draft.matchScore,
    email: draft.professor.email,
    color: draft.professor.color,
  });

  const { error } = await supabase.from("outreach_drafts").upsert({
    id: draft.id,
    professor_id: profId,
    subject: draft.subject,
    body: draft.body,
    match_score: draft.matchScore,
    status,
    user_id: await uid(),
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
  const userId = await uid();
  const { error } = await supabase.from("outreach_emails").upsert({ ...email, user_id: userId });
  if (error) console.error("saveOutreachEmail:", error.message);
}

// ── User profile ──────────────────────────────────────────────────────────────

export type DbUserProfile = {
  id: string;                        // auth user id
  full_name: string;
  university: string;
  major: string;
  year: string;
  gpa: number | null;
  research_interests: string[];
  short_bio: string;
  resume_text: string | null;        // OCR extracted text
  writing_sample_text: string | null; // OCR extracted text
  tone_voice: string;
  tone_length: string;
  tone_traits: string[];
  tone_signature_phrases: string[];
  tone_avoid_phrases: string[];
  tone_confidence: string;
  updated_at: string;
};

export async function loadUserProfile(userId: string): Promise<DbUserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) { return null; }
  return data as DbUserProfile;
}

export async function saveUserProfile(
  profile: Omit<DbUserProfile, "updated_at">
): Promise<void> {
  const { error } = await supabase.from("user_profiles").upsert({
    ...profile,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("saveUserProfile:", error.message);
}
