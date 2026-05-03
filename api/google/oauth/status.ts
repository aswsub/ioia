import { getStoredGoogleTokens } from "../../_lib/token-store";

export default function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const configured = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY,
  );
  const tokens = configured ? getStoredGoogleTokens(req) : null;

  res.status(200).json({
    configured,
    connected: Boolean(tokens?.refreshToken),
    email: tokens?.googleEmail ?? null,
    scopes: tokens?.scope ? tokens.scope.split(" ").filter(Boolean) : [],
    connectedAt: tokens?.connectedAt ?? null,
  });
}
