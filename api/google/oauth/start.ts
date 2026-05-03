import { createGoogleAuthRedirect } from "../../_lib/google-oauth";

export default function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const authUrl = createGoogleAuthRedirect(req, res);
    res.statusCode = 302;
    res.setHeader("Location", authUrl);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Google OAuth is not configured" });
  }
}
