import { describe, expect, it } from "vitest";
import {
  base64UrlEncode,
  buildGmailRawMessage,
  GMAIL_TEST_RECIPIENT,
  parseSendDraftEmailPayload,
} from "../../api/_lib/gmail-send";

describe("Gmail message helpers", () => {
  it("builds a plain-text message with the fixed test recipient and exact submitted body", () => {
    const body = "Dear professor,\n\nThis is the exact draft body.\nBest,";
    const raw = buildGmailRawMessage({
      to: GMAIL_TEST_RECIPIENT,
      from: "sender@example.com",
      subject: "Research question",
      body,
    });

    expect(raw).toContain(`From: sender@example.com\r\nTo: ${GMAIL_TEST_RECIPIENT}\r\n`);
    expect(raw).toContain("Subject: Research question\r\n");
    expect(raw.endsWith("Dear professor,\r\n\r\nThis is the exact draft body.\r\nBest,")).toBe(true);
  });

  it("base64url encodes without Gmail-invalid padding or alphabet characters", () => {
    expect(base64UrlEncode("???")).toBe("Pz8_");
    expect(base64UrlEncode("test")).toBe("dGVzdA");
  });

  it("rejects subject header injection", () => {
    expect(parseSendDraftEmailPayload({
      draftId: "draft_1",
      subject: "Hello\r\nBcc: someone@example.com",
      body: "Body",
    })).toEqual({
      ok: false,
      error: "subject cannot contain newlines",
    });
  });
});
