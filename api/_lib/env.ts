export function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function appBaseUrl() {
  return (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function googleRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI ?? `${appBaseUrl()}/api/google/oauth/callback`;
}

export function googleScopes() {
  return process.env.GOOGLE_OAUTH_SCOPES ?? "https://www.googleapis.com/auth/gmail.modify";
}

export function safeReturnTo(rawReturnTo: string | undefined) {
  const fallback = `${appBaseUrl()}/?view=Outreach`;
  if (!rawReturnTo) return fallback;

  try {
    const requested = new URL(rawReturnTo, appBaseUrl());
    const app = new URL(appBaseUrl());
    if (requested.origin !== app.origin) return fallback;
    return requested.toString();
  } catch {
    return fallback;
  }
}
