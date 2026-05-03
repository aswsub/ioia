import sidecarConfig from "./generated-email-api.sidecar.json";

type GeneratedEmailApiConfig = {
  baseUrl: string;
  auth: {
    passwordKey: string;
  };
};

export type GeneratedEmailObject = Record<string, unknown>;

export type FetchGeneratedEmailOptions = {
  password: string;
  signal?: AbortSignal;
  fetcher?: typeof fetch;
};

export class GeneratedEmailApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "GeneratedEmailApiError";
  }
}

const apiConfig = sidecarConfig as GeneratedEmailApiConfig;

function getGeneratedEmailsUrl() {
  if (!apiConfig.baseUrl.trim()) {
    throw new GeneratedEmailApiError(
      "Missing baseUrl in src/lib/generated-email-api.sidecar.json",
    );
  }

  const baseUrl = apiConfig.baseUrl.replace(/\/+$/, "");
  return `${baseUrl}/emails/generated`;
}

function assertObjectResponse(value: unknown): asserts value is GeneratedEmailObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new GeneratedEmailApiError("Expected /emails/generated to return an object");
  }
}

export async function fetchGeneratedEmail({
  password,
  signal,
  fetcher = fetch,
}: FetchGeneratedEmailOptions): Promise<GeneratedEmailObject> {
  const passwordKey = apiConfig.auth.passwordKey.trim();

  if (!passwordKey) {
    throw new GeneratedEmailApiError(
      "Missing auth.passwordKey in src/lib/generated-email-api.sidecar.json",
    );
  }

  if (!password) {
    throw new GeneratedEmailApiError("A password is required to fetch generated email");
  }

  const response = await fetcher(getGeneratedEmailsUrl(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      [passwordKey]: password,
    },
    signal,
  });

  if (!response.ok) {
    throw new GeneratedEmailApiError(
      `Failed to fetch generated email: ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  const payload: unknown = await response.json();
  assertObjectResponse(payload);
  return payload;
}
