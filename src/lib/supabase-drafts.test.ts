import { describe, expect, it } from "vitest";
import {
  bearerTokenFromAuthorizationHeader,
  resolveDraftRecipientEmail,
} from "../../api/_lib/supabase-drafts";

function draftRecipientClient(
  result: { data: unknown; error: { message?: string } | null },
) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => result,
        }),
      }),
    }),
  };
}

describe("Supabase draft recipient helpers", () => {
  it("extracts bearer tokens from authorization headers", () => {
    expect(bearerTokenFromAuthorizationHeader("Bearer abc123")).toBe("abc123");
    expect(bearerTokenFromAuthorizationHeader(["Bearer token-from-array"])).toBe("token-from-array");
    expect(bearerTokenFromAuthorizationHeader("Basic abc123")).toBeNull();
  });

  it("resolves the linked professor email for a draft", async () => {
    const result = await resolveDraftRecipientEmail(
      "draft_1",
      "supabase-token",
      draftRecipientClient({
        data: { professor: { email: " professor@example.edu " } },
        error: null,
      }) as never,
    );

    expect(result).toEqual({ ok: true, email: "professor@example.edu" });
  });

  it("returns a null email when the linked person has no email", async () => {
    const result = await resolveDraftRecipientEmail(
      "draft_1",
      "supabase-token",
      draftRecipientClient({
        data: { professor: { email: " " } },
        error: null,
      }) as never,
    );

    expect(result).toEqual({ ok: true, email: null });
  });

  it("requires a Supabase access token", async () => {
    const result = await resolveDraftRecipientEmail(
      "draft_1",
      null,
      draftRecipientClient({ data: null, error: null }) as never,
    );

    expect(result).toEqual({
      ok: false,
      statusCode: 401,
      error: "Supabase session is required to resolve the draft recipient.",
    });
  });

  it("returns 404 when the draft is not visible in Supabase", async () => {
    const result = await resolveDraftRecipientEmail(
      "draft_missing",
      "supabase-token",
      draftRecipientClient({ data: null, error: null }) as never,
    );

    expect(result).toEqual({
      ok: false,
      statusCode: 404,
      error: "Draft not found in Supabase.",
    });
  });
});
