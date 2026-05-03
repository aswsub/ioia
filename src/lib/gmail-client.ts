export type GmailConnectionStatus = {
  configured: boolean;
  connected: boolean;
  email: string | null;
  scopes: string[];
  connectedAt: string | null;
};

export const GMAIL_TEST_RECIPIENT = "Z1npsI6zOgqvhrHXNLRnwG9r@gmail.com";

export type SendDraftEmailInput = {
  draftId: string;
  subject: string;
  body: string;
};

export type SendDraftEmailResult = {
  id: string | null;
  threadId: string | null;
  labelIds: string[];
  to: string;
  testRecipient: boolean;
};

export async function getGmailConnectionStatus(): Promise<GmailConnectionStatus> {
  const response = await fetch("/api/google/oauth/status", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Unable to load Gmail connection status");
  return response.json() as Promise<GmailConnectionStatus>;
}

export function startGoogleOAuth() {
  const returnTo = `${window.location.origin}/?view=Outreach`;
  window.location.href = `/api/google/oauth/start?returnTo=${encodeURIComponent(returnTo)}`;
}

export async function disconnectGoogleOAuth() {
  const response = await fetch("/api/google/oauth/disconnect", {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Unable to disconnect Gmail");
}

export async function sendDraftEmail(
  input: SendDraftEmailInput,
): Promise<SendDraftEmailResult> {
  const response = await fetch("/api/google/messages/send", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => null)) as
    | (Partial<SendDraftEmailResult> & { error?: string })
    | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Unable to send email through Gmail");
  }

  return payload as SendDraftEmailResult;
}
