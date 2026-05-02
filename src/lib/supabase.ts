/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string)?.replace(/\/$/, ""); // strip trailing slash
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
}

export const supabase = createClient(url, key);

// ── Types matching the DB schema ──────────────────────────────────────────────

export type DbProfessor = {
  id: string;
  name: string;
  title: string | null;
  institution: string;
  department: string;
  research: string[];       // text[]
  recent_paper: string | null;
  match_score: number;
  email: string | null;
  color: string | null;
  created_at: string;
};

export type DbOutreachDraft = {
  id: string;
  professor_id: string;
  subject: string;
  body: string;
  match_score: number;
  status: "draft" | "sent";
  created_at: string;
};

export type DbOutreachEmail = {
  id: string;
  professor: string;
  institution: string;
  subject: string;
  status: "sent" | "replied" | "follow_up" | "draft";
  sent_at: string | null;
  confidence: "high" | "medium" | "low";
  match_score: number;
  created_at: string;
};

export type DbChatMessage = {
  id: string;
  role: "user" | "agent";
  content: string;
  steps: { icon: string; label: string }[] | null;  // jsonb
  created_at: string;
};
