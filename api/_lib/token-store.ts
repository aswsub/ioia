import { appendSetCookie, clearCookie, parseCookies, serializeCookie } from "./cookies";
import { decryptJson, encryptJson } from "./crypto";

export const GOOGLE_TOKEN_COOKIE = "ioia_google_tokens";

export type StoredGoogleTokens = {
  refreshToken: string;
  googleEmail: string | null;
  scope: string;
  connectedAt: string;
  updatedAt: string;
};

export function getStoredGoogleTokens(req: { headers?: { cookie?: string } }) {
  const encrypted = parseCookies(req)[GOOGLE_TOKEN_COOKIE];
  if (!encrypted) return null;

  try {
    return decryptJson<StoredGoogleTokens>(encrypted);
  } catch {
    return null;
  }
}

export function setStoredGoogleTokens(
  res: { getHeader?: (name: string) => unknown; setHeader: (name: string, value: string | string[]) => void },
  tokens: StoredGoogleTokens,
) {
  appendSetCookie(res, serializeCookie(GOOGLE_TOKEN_COOKIE, encryptJson(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 180,
  }));
}

export function clearStoredGoogleTokens(res: { getHeader?: (name: string) => unknown; setHeader: (name: string, value: string | string[]) => void }) {
  appendSetCookie(res, clearCookie(GOOGLE_TOKEN_COOKIE));
}
