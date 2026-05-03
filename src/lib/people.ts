/// <reference types="vite/client" />

// Browser client for the people-discovery proxy at server/people.ts (Hunter-backed).
//
// The proxy hides the Hunter API key + handles CORS; from the browser we hit
// localhost endpoints with plain JSON. The proxy URL is overridable via
// VITE_PEOPLE_PROXY_URL for deploys that put the proxy elsewhere.

const PROXY_URL =
  (import.meta.env.VITE_PEOPLE_PROXY_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8787"

export type DiscoveredOrganization = {
  name: string
  domain: string
  description: string | null
  industry: string | null
  pattern: string | null
}

export type DiscoveredPerson = {
  name: string
  firstName: string | null
  lastName: string | null
  title: string
  email: string
  emailStatus: "verified" | "unverified"
  confidence: number | null
  department: string | null
  seniority: string | null
  linkedinUrl: string | null
}

export class PeopleProxyError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "PeopleProxyError"
  }
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${PROXY_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch (err) {
    // fetch throws on network failure (proxy not running, DNS, etc.). Convert
    // to PeopleProxyError so callers can show a friendly "is the proxy up?"
    // message instead of a raw TypeError.
    throw new PeopleProxyError(
      0,
      `People proxy unreachable at ${PROXY_URL}. Is \`npm run proxy:dev\` running? (${err instanceof Error ? err.message : String(err)})`,
    )
  }

  const text = await res.text()
  let json: unknown
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    throw new PeopleProxyError(res.status, `proxy returned non-JSON: ${text.slice(0, 200)}`)
  }
  if (!res.ok) {
    const message =
      (json && typeof json === "object" && "error" in json && String((json as { error: unknown }).error)) ||
      `proxy ${path} failed (${res.status})`
    throw new PeopleProxyError(res.status, message)
  }
  return json as T
}

export function lookupPeopleByCompany(args: {
  name?: string
  domain?: string
  titles?: string[]
  perPage?: number
}): Promise<{ organization: DiscoveredOrganization; people: DiscoveredPerson[] }> {
  return postJson("/people/by-company", args)
}

export function findEmail(args: {
  firstName: string
  lastName: string
  domain?: string
  company?: string
}): Promise<{
  email: string | null
  confidence: number | null
  emailStatus: "verified" | "unverified"
  domain: string
  linkedinUrl: string | null
  title: string
}> {
  return postJson("/people/find-email", args)
}
