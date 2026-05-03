import { appBaseUrl } from "../../_lib/env";
import {
  clearOAuthState,
  exchangeCodeForTokens,
  fetchGmailAddress,
  readAndValidateOAuthState,
  redirectWithParams,
} from "../../_lib/google-oauth";
import { getStoredGoogleTokens, setStoredGoogleTokens } from "../../_lib/token-store";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const requestUrl = new URL(req.url ?? "/", appBaseUrl());
  const error = requestUrl.searchParams.get("error");
  const code = requestUrl.searchParams.get("code");
  const receivedState = requestUrl.searchParams.get("state");
  const state = readAndValidateOAuthState(req, receivedState);
  const returnTo = state?.returnTo ?? `${appBaseUrl()}/?view=Outreach`;
  clearOAuthState(res);

  if (!state) {
    res.statusCode = 302;
    res.setHeader("Location", redirectWithParams(`${appBaseUrl()}/?view=Outreach`, { gmail: "error", reason: "invalid_state" }));
    res.end();
    return;
  }

  if (error || !code) {
    res.statusCode = 302;
    res.setHeader("Location", redirectWithParams(returnTo, { gmail: "error", reason: error ?? "missing_code" }));
    res.end();
    return;
  }

  try {
    const tokenResponse = await exchangeCodeForTokens(code);
    const existing = getStoredGoogleTokens(req);
    const refreshToken = tokenResponse.refresh_token ?? existing?.refreshToken;

    if (!refreshToken) {
      res.statusCode = 302;
      res.setHeader("Location", redirectWithParams(returnTo, { gmail: "error", reason: "missing_refresh_token" }));
      res.end();
      return;
    }

    const googleEmail = await fetchGmailAddress(tokenResponse.access_token!);
    const now = new Date().toISOString();
    setStoredGoogleTokens(res, {
      refreshToken,
      googleEmail,
      scope: tokenResponse.scope ?? existing?.scope ?? "",
      connectedAt: existing?.connectedAt ?? now,
      updatedAt: now,
    });

    res.statusCode = 302;
    res.setHeader("Location", redirectWithParams(returnTo, { gmail: "connected" }));
    res.end();
  } catch {
    res.statusCode = 302;
    res.setHeader("Location", redirectWithParams(returnTo, { gmail: "error", reason: "token_exchange_failed" }));
    res.end();
  }
}
