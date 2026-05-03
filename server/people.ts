import { createServer, type IncomingMessage, type ServerResponse } from "node:http"

// ============================================================================
// People-discovery proxy, backed by Hunter.io.
//
// Why this exists: the browser can't talk to api.hunter.io directly because
// (1) the API key is a secret with credit balance attached, (2) Hunter blocks
// browser-origin requests via CORS. This Node http server runs alongside
// `vite dev` on :8787 and hides the key.
//
// Two routes:
//   POST /people/by-company  body { name | domain, titles?, perPage? }
//                                                     -> { organization, people[] }
//   POST /people/find-email  body { firstName, lastName, domain }
//                                                     -> { email | null, confidence }
//
// Hunter free tier: ~25 domain searches/month + ~50 email verifications/month.
// Verify on hunter.io/pricing — limits drift over time.
//
// Caching: in-memory Map, 1-hour TTL. Persists for the proxy process lifetime.
// Plenty for a demo session; replace with Supabase if you want persistence
// across restarts.
//
// History: this file replaced the Apollo-backed server/apollo.ts after we
// found Apollo gates Search + Match endpoints behind paid tiers. Hunter's
// domain-search returns people + real emails in one call on the free tier,
// which is a strictly better fit. Apollo can be re-introduced as an upgrade
// path later if anyone wants verified-email volume.
// ============================================================================

const PORT = Number(process.env.PEOPLE_PROXY_PORT ?? 8787)
const HUNTER_BASE = "https://api.hunter.io/v2"
const HUNTER_API_KEY = process.env.HUNTER_API_KEY
const ALLOWED_ORIGIN = process.env.PEOPLE_PROXY_ORIGIN ?? "http://localhost:5173"
const CACHE_TTL_MS = 60 * 60 * 1000

if (!HUNTER_API_KEY) {
  console.error(
    "[people-proxy] HUNTER_API_KEY is not set. Add it to .env (no VITE_ prefix) and restart.",
  )
  process.exit(1)
}

type CacheEntry = { value: unknown; expiresAt: number }
const cache = new Map<string, CacheEntry>()

function cacheGet(key: string): unknown | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    cache.delete(key)
    return null
  }
  return hit.value
}

function cacheSet(key: string, value: unknown): void {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ----------------------------------------------------------------------------
// Hunter HTTP helpers
// ----------------------------------------------------------------------------

class HunterError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "HunterError"
  }
}

async function hunterGet<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), api_key: HUNTER_API_KEY! })
  const url = `${HUNTER_BASE}${path}?${qs.toString()}`
  const res = await fetch(url, { headers: { Accept: "application/json" } })
  const text = await res.text()
  let json: unknown
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    throw new HunterError(res.status, `Hunter returned non-JSON: ${text.slice(0, 200)}`)
  }
  if (!res.ok) {
    // Hunter error shape: { errors: [{ id, code, details }] }
    const obj = json as { errors?: Array<{ details?: string; code?: string }> }
    const detail = obj.errors?.[0]?.details ?? `Hunter ${path} failed (${res.status})`
    throw new HunterError(res.status, detail)
  }
  return json as T
}

// ----------------------------------------------------------------------------
// Hunter response shapes (subset — we only consume what we need)
// ----------------------------------------------------------------------------

type HunterEmail = {
  value: string
  type?: string
  confidence?: number
  first_name?: string | null
  last_name?: string | null
  position?: string | null
  seniority?: string | null
  department?: string | null
  linkedin?: string | null
  twitter?: string | null
  phone_number?: string | null
  verification?: { date?: string | null; status?: string | null }
}

type HunterDomainSearchResponse = {
  data: {
    domain: string
    organization?: string | null
    description?: string | null
    industry?: string | null
    pattern?: string | null
    emails: HunterEmail[]
  }
}

type HunterEmailFinderResponse = {
  data: {
    first_name: string
    last_name: string
    email: string | null
    score?: number | null
    domain: string
    position?: string | null
    linkedin_url?: string | null
    verification?: { status?: string | null }
  }
}

// ----------------------------------------------------------------------------
// Route handlers
// ----------------------------------------------------------------------------

function matchesAnyTitle(position: string | null | undefined, titles: string[]): boolean {
  if (titles.length === 0) return true
  if (!position) return false
  const p = position.toLowerCase()
  return titles.some(t => p.includes(t.toLowerCase()))
}

async function handleByCompany(body: {
  name?: unknown
  domain?: unknown
  titles?: unknown
  perPage?: unknown
}): Promise<unknown> {
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const domain = typeof body.domain === "string" ? body.domain.trim().toLowerCase() : ""
  if (!name && !domain) {
    throw new HunterError(400, "name or domain is required")
  }
  const titles = Array.isArray(body.titles)
    ? body.titles.filter((t): t is string => typeof t === "string" && t.length > 0).slice(0, 8)
    : []
  // Hunter caps domain-search results at 100 (paid) / 10 (free). We over-fetch
  // a bit so client-side title filtering has more candidates to work with.
  const perPage = Math.min(Math.max(Number(body.perPage ?? 10), 1), 25)

  const cacheKey = `byCompany:${(domain || name).toLowerCase()}:${titles.sort().join("|")}:${perPage}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  // Prefer domain over company-name when both are present — exact lookups
  // are cheaper to reason about.
  const params: Record<string, string | number> = {
    limit: perPage,
    type: "personal",
  }
  if (domain) params.domain = domain
  else params.company = name

  const json = await hunterGet<HunterDomainSearchResponse>("/domain-search", params)
  const data = json.data

  const allPeople = (data.emails ?? []).map(e => {
    const fullName = [e.first_name, e.last_name].filter(Boolean).join(" ").trim() || e.value
    const verified = e.verification?.status === "valid" || e.verification?.status === "deliverable"
    return {
      name: fullName,
      firstName: e.first_name ?? null,
      lastName: e.last_name ?? null,
      title: e.position ?? "",
      email: e.value,
      emailStatus: verified ? "verified" : "unverified",
      confidence: typeof e.confidence === "number" ? e.confidence : null,
      department: e.department ?? null,
      seniority: e.seniority ?? null,
      linkedinUrl: e.linkedin ?? null,
    }
  })

  // Client-side title filter when the caller asked for specific roles. If
  // the filter empties the list, fall back to the unfiltered set so the
  // caller still has someone to email — better than zero results.
  const filtered = titles.length > 0 ? allPeople.filter(p => matchesAnyTitle(p.title, titles)) : allPeople
  const people = filtered.length > 0 ? filtered : allPeople

  const result = {
    organization: {
      name: data.organization ?? name ?? data.domain,
      domain: data.domain,
      description: data.description ?? null,
      industry: data.industry ?? null,
      pattern: data.pattern ?? null,
    },
    people,
  }
  cacheSet(cacheKey, result)
  return result
}

async function handleFindEmail(body: {
  firstName?: unknown
  lastName?: unknown
  domain?: unknown
  company?: unknown
}): Promise<unknown> {
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : ""
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : ""
  const domain = typeof body.domain === "string" ? body.domain.trim().toLowerCase() : ""
  const company = typeof body.company === "string" ? body.company.trim() : ""
  if (!firstName || !lastName) {
    throw new HunterError(400, "firstName and lastName are required")
  }
  if (!domain && !company) {
    throw new HunterError(400, "domain or company is required")
  }

  const cacheKey = `findEmail:${firstName}:${lastName}:${(domain || company).toLowerCase()}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const params: Record<string, string> = {
    first_name: firstName,
    last_name: lastName,
  }
  if (domain) params.domain = domain
  else params.company = company

  const json = await hunterGet<HunterEmailFinderResponse>("/email-finder", params)
  const d = json.data
  const verified = d.verification?.status === "valid" || d.verification?.status === "deliverable"
  const result = {
    email: d.email ?? null,
    confidence: typeof d.score === "number" ? d.score : null,
    emailStatus: verified ? "verified" : "unverified",
    domain: d.domain,
    linkedinUrl: d.linkedin_url ?? null,
    title: d.position ?? "",
  }
  cacheSet(cacheKey, result)
  return result
}

// ----------------------------------------------------------------------------
// HTTP plumbing
// ----------------------------------------------------------------------------

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = ""
    req.setEncoding("utf-8")
    req.on("data", chunk => {
      raw += chunk
      // 64 KiB hard cap — guards against accidental huge payloads.
      if (raw.length > 65536) {
        reject(new HunterError(413, "payload too large"))
        req.destroy()
      }
    })
    req.on("end", () => {
      if (!raw) return resolve({})
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          resolve(parsed as Record<string, unknown>)
        } else {
          reject(new HunterError(400, "body must be a JSON object"))
        }
      } catch {
        reject(new HunterError(400, "invalid JSON"))
      }
    })
    req.on("error", reject)
  })
}

function applyCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  res.setHeader("Access-Control-Max-Age", "86400")
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(body))
}

const ROUTES: Record<string, (body: Record<string, unknown>) => Promise<unknown>> = {
  "/people/by-company": handleByCompany,
  "/people/find-email": handleFindEmail,
}

const server = createServer(async (req, res) => {
  applyCors(res)

  if (req.method === "OPTIONS") {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method === "GET" && req.url === "/health") {
    return send(res, 200, { ok: true, cacheSize: cache.size })
  }

  if (req.method !== "POST") {
    return send(res, 405, { error: "method not allowed" })
  }

  const route = req.url ? ROUTES[req.url.split("?")[0]] : undefined
  if (!route) return send(res, 404, { error: "not found" })

  try {
    const body = await readJsonBody(req)
    const result = await route(body)
    send(res, 200, result)
  } catch (err) {
    if (err instanceof HunterError) {
      console.error(`[people-proxy] ${req.url} -> ${err.status}: ${err.message}`)
      return send(res, err.status, { error: err.message })
    }
    console.error("[people-proxy] unexpected error:", err)
    send(res, 500, { error: "internal error" })
  }
})

server.listen(PORT, () => {
  console.log(`[people-proxy] listening on http://localhost:${PORT}`)
  console.log(`[people-proxy] CORS allow-origin: ${ALLOWED_ORIGIN}`)
  console.log("[people-proxy] routes: POST /people/by-company, /people/find-email")
})
