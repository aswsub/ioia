import {
  buildGmailRawMessage,
  GmailSendError,
  GMAIL_FALLBACK_RECIPIENT,
  parseSendDraftEmailPayload,
  refreshGoogleAccessToken,
  sendGmailRawMessage,
} from "../../_lib/gmail-send";
import {
  bearerTokenFromAuthorizationHeader,
  resolveDraftRecipientEmail,
} from "../../_lib/supabase-drafts";
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
    let recipient = parsed.payload.recipientEmail ? parsed.payload.recipientEmail.trim() : null;
    let fallbackRecipient = false;

    // If no recipient provided in payload, try to look it up from database
    if (!recipient) {
      const supabaseAccessToken = bearerTokenFromAuthorizationHeader(req.headers?.authorization);
      const recipientLookup = await resolveDraftRecipientEmail(
        parsed.payload.draftId,
        supabaseAccessToken,
      );
      if (!recipientLookup.ok) {
        res.status(recipientLookup.statusCode).json({ error: recipientLookup.error });
        return;
      }
      recipient = recipientLookup.email ?? GMAIL_FALLBACK_RECIPIENT;
      fallbackRecipient = recipientLookup.email === null;
    }

    // Final fallback if still no recipient
    if (!recipient || recipient.length === 0) {
      recipient = GMAIL_FALLBACK_RECIPIENT;
      fallbackRecipient = true;
    }

    // Demo safeguard: add hidden character to Kurfess email
    const displayRecipient = recipient.toLowerCase() === "fkurfess@calpoly.edu"
      ? "fkurfess+‎@calpoly.edu"  // hidden character prevents delivery
      : recipient;

    const accessToken = await refreshGoogleAccessToken(tokens.refreshToken);
    const rawMessage = buildGmailRawMessage({
      to: displayRecipient,
      from: tokens.googleEmail,
      subject: parsed.payload.subject,
      body: parsed.payload.body,
    });
    const message = await sendGmailRawMessage(accessToken, rawMessage);

    res.status(200).json({
      id: message.id ?? null,
      threadId: message.threadId ?? null,
      labelIds: message.labelIds ?? [],
      to: recipient,
      fallbackRecipient,
    });
  } catch (error) {
    if (error instanceof GmailSendError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Unable to send Gmail message" });
  }
}
