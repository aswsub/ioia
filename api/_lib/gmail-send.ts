import { requiredEnv } from "./env";

export const GMAIL_FALLBACK_RECIPIENT = "Z1npsI6zOgqvhrHXNLRnwG9r@gmail.com";

export type SendDraftEmailPayload = {
  draftId: string;
  subject: string;
  body: string;
  recipientEmail?: string;
};

type GoogleRefreshTokenResponse = {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GmailSendResponse = {
  id?: string;
  threadId?: string;
  labelIds?: string[];
  error?: {
    message?: string;
    status?: string;
  };
};

export class GmailSendError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "GmailSendError";
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRequestBody(body: unknown) {
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

function hasHeaderInjection(value: string) {
  return /[\r\n]/.test(value);
}

export function parseSendDraftEmailPayload(
  body: unknown,
): { ok: true; payload: SendDraftEmailPayload } | { ok: false; error: string } {
  const parsed = parseRequestBody(body);

  if (!isObject(parsed)) {
    return { ok: false, error: "Expected a JSON object payload" };
  }

  const { draftId, subject, body: emailBody, recipientEmail } = parsed;

  if (typeof draftId !== "string" || draftId.length === 0) {
    return { ok: false, error: "draftId is required" };
  }

  if (typeof subject !== "string" || subject.length === 0) {
    return { ok: false, error: "subject is required" };
  }

  if (hasHeaderInjection(subject)) {
    return { ok: false, error: "subject cannot contain newlines" };
  }

  if (typeof emailBody !== "string" || emailBody.length === 0) {
    return { ok: false, error: "body is required" };
  }

  return {
    ok: true,
    payload: {
      draftId,
      subject,
      body: emailBody,
      recipientEmail: typeof recipientEmail === "string" ? recipientEmail.trim() : undefined,
    },
  };
}

function encodeHeaderValue(value: string) {
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function normalizeBodyLineEndings(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\r\n");
}

export function buildGmailRawMessage({
  to,
  from,
  subject,
  body,
}: {
  to: string;
  from?: string | null;
  subject: string;
  body: string;
}) {
  const headers = [
    from ? `From: ${from}` : null,
    `To: ${to}`,
    `Subject: ${encodeHeaderValue(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
  ].filter((header): header is string => Boolean(header));

  return `${headers.join("\r\n")}\r\n\r\n${normalizeBodyLineEndings(body)}`;
}

export function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: requiredEnv("GOOGLE_CLIENT_ID"),
      client_secret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    }),
  });

  const payload = (await response.json()) as GoogleRefreshTokenResponse;
  if (!response.ok || payload.error) {
    const message =
      payload.error_description ??
      payload.error ??
      "Google token refresh failed";
    const statusCode =
      response.status === 400 || response.status === 401 ? 401 : 502;
    throw new GmailSendError(message, statusCode);
  }

  if (!payload.access_token) {
    throw new GmailSendError("Google did not return an access token", 502);
  }

  return payload.access_token;
}

export async function sendGmailRawMessage(
  accessToken: string,
  rawMessage: string,
) {
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: base64UrlEncode(rawMessage),
      }),
    },
  );

  const payload = (await response.json()) as GmailSendResponse;
  if (!response.ok || payload.error) {
    throw new GmailSendError(
      payload.error?.message ?? "Gmail send failed",
      response.status || 502,
    );
  }

  return payload;
}
