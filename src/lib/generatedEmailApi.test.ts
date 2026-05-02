import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sidecarConfig from "./generated-email-api.sidecar.json";
import {
  fetchGeneratedEmail,
  GeneratedEmailApiError,
  type GeneratedEmailObject,
} from "./generatedEmailApi";

const TEST_API_BASE_URL = "https://generated-email-api.test";
const TEST_PASSWORD_HEADER = "x-test-password";
const TEST_PASSWORD = "local-test-password";

const generatedEmailBackendFixture: GeneratedEmailObject = {
  subject: "Question about retrieval augmented generation and faithfulness",
  body: `Dear Prof. Sharma,

I read your ACL paper on faithfulness in retrieval augmented generation and wanted to reach out. The way you separated grounded hallucination from confabulation gave me a much cleaner framework for thinking about evaluation.

Would you have 15-20 minutes sometime in the next few weeks?

Best,
Rahul`,
  citations: [
    {
      claim: "Faithfulness in retrieval augmented generation",
      source: "paper",
      ref: "Sharma et al., ACL 2024",
    },
    {
      claim: "RAG pipeline for academic paper Q&A",
      source: "profile",
      ref: "User profile",
    },
  ],
  confidence: "medium",
  warnings: ["Email address guessed from university pattern; verify before sending."],
};

type MutableGeneratedEmailApiConfig = {
  baseUrl: string;
  auth: {
    passwordKey: string;
  };
};

const mutableSidecarConfig = sidecarConfig as MutableGeneratedEmailApiConfig;
const originalSidecarConfig = {
  baseUrl: mutableSidecarConfig.baseUrl,
  passwordKey: mutableSidecarConfig.auth.passwordKey,
};

function mockFetchJson(payload: unknown, init: ResponseInit = {}) {
  return vi.fn(async () => {
    return new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
      status: init.status ?? 200,
      statusText: init.statusText ?? "OK",
    });
  });
}

async function expectGeneratedEmailApiError(
  promise: Promise<unknown>,
  expectedMessage: string,
  expectedStatus?: number,
) {
  let error: unknown;

  try {
    await promise;
  } catch (caught) {
    error = caught;
  }

  expect(error).toBeInstanceOf(GeneratedEmailApiError);
  expect((error as Error).message).toContain(expectedMessage);
  if (expectedStatus !== undefined) {
    expect(error).toHaveProperty("status", expectedStatus);
  }
}

describe("fetchGeneratedEmail", () => {
  beforeEach(() => {
    mutableSidecarConfig.baseUrl = `${TEST_API_BASE_URL}///`;
    mutableSidecarConfig.auth.passwordKey = TEST_PASSWORD_HEADER;
  });

  afterEach(() => {
    mutableSidecarConfig.baseUrl = originalSidecarConfig.baseUrl;
    mutableSidecarConfig.auth.passwordKey = originalSidecarConfig.passwordKey;
    vi.restoreAllMocks();
  });

  it("returns a backend-shaped generated email object from an injected fetcher", async () => {
    const fetcher = mockFetchJson(generatedEmailBackendFixture);

    await expect(
      fetchGeneratedEmail({ password: TEST_PASSWORD, fetcher }),
    ).resolves.toEqual(generatedEmailBackendFixture);

    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith(`${TEST_API_BASE_URL}/emails/generated`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        [TEST_PASSWORD_HEADER]: TEST_PASSWORD,
      },
      signal: undefined,
    });
  });

  it("rejects a missing password before calling the fetcher", async () => {
    const fetcher = mockFetchJson(generatedEmailBackendFixture);

    await expectGeneratedEmailApiError(
      fetchGeneratedEmail({ password: "", fetcher }),
      "A password is required",
    );

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects a payload that is not an object", async () => {
    const fetcher = mockFetchJson([generatedEmailBackendFixture]);

    await expectGeneratedEmailApiError(
      fetchGeneratedEmail({ password: TEST_PASSWORD, fetcher }),
      "Expected /emails/generated to return an object",
    );
  });

  it("rejects non-OK HTTP responses with status details", async () => {
    const fetcher = mockFetchJson(
      { error: "Forbidden" },
      { status: 403, statusText: "Forbidden" },
    );

    await expectGeneratedEmailApiError(
      fetchGeneratedEmail({ password: TEST_PASSWORD, fetcher }),
      "Failed to fetch generated email: 403 Forbidden",
      403,
    );
  });
});
