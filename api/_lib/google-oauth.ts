import { randomBytes } from "node:crypto";
import { appendSetCookie, clearCookie, parseCookies, serializeCookie } from "./cookies";
import { decryptJson, encryptJson } from "./crypto";
import { googleRedirectUri, googleScopes, requiredEnv, safeReturnTo } from "./env";

const STATE_COOKIE = "ioia_google_oauth_state";

type OAuthState = {
  state: string;
  returnTo: string;
  createdAt: number;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export function createGoogleAuthRedirect(req: { url?: string }, res: { getHeader?: (name: string) => unknown; setHeader: (name: string, value: string | string[]) => void }) {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const state = randomBytes(24).toString("base64url");
  const returnTo = safeReturnTo(requestUrl.searchParams.get("returnTo") ?? undefined);

  appendSetCookie(res, serializeCookie(STATE_COOKIE, encryptJson({ state, returnTo, createdAt: Date.now() }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 60 * 10,
  }));

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", requiredEnv("GOOGLE_CLIENT_ID"));
  authUrl.searchParams.set("redirect_uri", googleRedirectUri());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", googleScopes());
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("state", state);
  return authUrl.toString();
}

export function readAndValidateOAuthState(req: { headers?: { cookie?: string } }, receivedState: string | null) {
  const encrypted = parseCookies(req)[STATE_COOKIE];
  if (!encrypted || !receivedState) return null;

  try {
    const stored = decryptJson<OAuthState>(encrypted);
    const isFresh = Date.now() - stored.createdAt < 10 * 60 * 1000;
    if (!isFresh || stored.state !== receivedState) return null;
    return stored;
  } catch {
    return null;
  }
}

export function clearOAuthState(res: { getHeader?: (name: string) => unknown; setHeader: (name: string, value: string | string[]) => void }) {
  appendSetCookie(res, clearCookie(STATE_COOKIE));
}

export async function exchangeCodeForTokens(code: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: requiredEnv("GOOGLE_CLIENT_ID"),
      client_secret: requiredEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: googleRedirectUri(),
    }),
  });

  const payload = await response.json() as TokenResponse;
  if (!response.ok || payload.error) {
    throw new Error(payload.error_description ?? payload.error ?? "Google token exchange failed");
  }
  if (!payload.access_token) throw new Error("Google did not return an access token");
  return payload;
}

export async function fetchGmailAddress(accessToken: string) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const profile = await response.json() as { emailAddress?: string };
  return profile.emailAddress ?? null;
}

export async function revokeGoogleToken(refreshToken: string) {
  await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: refreshToken }),
  }).catch(() => {});
}

export function redirectWithParams(base: string, params: Record<string, string>) {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}
