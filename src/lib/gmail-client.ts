export type GmailConnectionStatus = {
  configured: boolean;
  connected: boolean;
  email: string | null;
  scopes: string[];
  connectedAt: string | null;
};

export async function getGmailConnectionStatus(): Promise<GmailConnectionStatus> {
  const response = await fetch("/api/google/oauth/status", { credentials: "include" });
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
