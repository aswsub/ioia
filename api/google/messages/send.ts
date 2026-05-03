import {
  buildGmailRawMessage,
  GmailSendError,
  GMAIL_TEST_RECIPIENT,
  parseSendDraftEmailPayload,
  refreshGoogleAccessToken,
  sendGmailRawMessage,
} from "../../_lib/gmail-send";
import { getStoredGoogleTokens } from "../../_lib/token-store";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const parsed = parseSendDraftEmailPayload(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const tokens = getStoredGoogleTokens(req);
  if (!tokens?.refreshToken) {
    res.status(401).json({ error: "Gmail is not connected. Reconnect Gmail before sending." });
    return;
  }

  try {
    const accessToken = await refreshGoogleAccessToken(tokens.refreshToken);
    const rawMessage = buildGmailRawMessage({
      to: GMAIL_TEST_RECIPIENT,
      from: tokens.googleEmail,
      subject: parsed.payload.subject,
      body: parsed.payload.body,
    });
    const message = await sendGmailRawMessage(accessToken, rawMessage);

    res.status(200).json({
      id: message.id ?? null,
      threadId: message.threadId ?? null,
      labelIds: message.labelIds ?? [],
      to: GMAIL_TEST_RECIPIENT,
      testRecipient: true,
    });
  } catch (error) {
    if (error instanceof GmailSendError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Unable to send Gmail message" });
  }
}
