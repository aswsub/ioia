import { createClient } from "@supabase/supabase-js";
import { requiredEnv } from "./env";

type SupabaseErrorLike = {
  message?: string;
};

type ProfessorEmailRow = {
  email?: string | null;
};

type OutreachDraftRecipientRow = {
  professor?: ProfessorEmailRow | ProfessorEmailRow[] | null;
};

type DraftRecipientQueryClient = {
  from: (table: "outreach_drafts") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: OutreachDraftRecipientRow | null;
          error: SupabaseErrorLike | null;
        }>;
      };
    };
  };
};

export type DraftRecipientLookupResult =
  | { ok: true; email: string | null }
  | { ok: false; statusCode: number; error: string };

export function bearerTokenFromAuthorizationHeader(header: unknown) {
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== "string") return null;

  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function createDraftRecipientClient(accessToken: string): DraftRecipientQueryClient {
  return createClient(
    requiredEnv("VITE_SUPABASE_URL").replace(/\/$/, ""),
    requiredEnv("VITE_SUPABASE_ANON_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  ) as DraftRecipientQueryClient;
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function professorEmail(row: OutreachDraftRecipientRow) {
  const professor = row.professor;
  if (Array.isArray(professor)) return normalizeEmail(professor[0]?.email);
  return normalizeEmail(professor?.email);
}

export async function resolveDraftRecipientEmail(
  draftId: string,
  accessToken: string | null,
  client: DraftRecipientQueryClient | null = null,
): Promise<DraftRecipientLookupResult> {
  if (!accessToken) {
    return {
      ok: false,
      statusCode: 401,
      error: "Supabase session is required to resolve the draft recipient.",
    };
  }

  const queryClient = client ?? createDraftRecipientClient(accessToken);
  const { data, error } = await queryClient
    .from("outreach_drafts")
    .select("professor:professors(email)")
    .eq("id", draftId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      statusCode: 502,
      error: error.message ?? "Unable to load draft recipient from Supabase.",
    };
  }

  if (!data) {
    return {
      ok: false,
      statusCode: 404,
      error: "Draft not found in Supabase.",
    };
  }

  return { ok: true, email: professorEmail(data) };
}
