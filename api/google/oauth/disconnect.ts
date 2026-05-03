import { clearStoredGoogleTokens, getStoredGoogleTokens } from "../../_lib/token-store";
import { revokeGoogleToken } from "../../_lib/google-oauth";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const tokens = getStoredGoogleTokens(req);
  if (tokens?.refreshToken) await revokeGoogleToken(tokens.refreshToken);
  clearStoredGoogleTokens(res);
  res.status(200).json({ connected: false });
}
