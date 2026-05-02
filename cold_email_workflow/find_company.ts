import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { z } from "zod"
import { CompanySchema, type Company } from "./schemas"

// ============================================================================
// Pure-data company discovery. No LLM, no fetch — reads the seeded
// data/seed/companies.json, scores each company against a free-text query,
// and returns ranked matches plus a UI hint about which contact to pick
// (recruiter for "internship"/"intern" queries, IC otherwise).
//
// When the SPA wires up, it can call findCompany(query) directly. If we
// later add a thin Express/Hono route, the route just wraps this function.
// ============================================================================

const SeedFileSchema = z.object({
  companies: z.array(CompanySchema),
})

export const FindCompanyMatchSchema = z.object({
  company: CompanySchema,
  suggestedContactId: z.string(),
  matchReason: z.string(),
})

export const FindCompanyOutputSchema = z.object({
  matches: z.array(FindCompanyMatchSchema).max(5),
})

export type FindCompanyMatch = z.infer<typeof FindCompanyMatchSchema>
export type FindCompanyOutput = z.infer<typeof FindCompanyOutputSchema>

// Seed file lives next to this module, not in a top-level data/ dir
// (the repo doesn't have one — all workflow code + data is in
// cold_email_workflow/). Resolve relative to this file so the runner
// works regardless of where it's invoked from.
function defaultSeedPath(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  return resolve(here, "companies.json")
}

let cachedCompanies: Company[] | null = null

export function loadCompanies(seedPath: string = defaultSeedPath()): Company[] {
  if (cachedCompanies) return cachedCompanies
  const raw = readFileSync(seedPath, "utf-8")
  const parsed = SeedFileSchema.parse(JSON.parse(raw))
  cachedCompanies = parsed.companies
  return cachedCompanies
}

// Reset the in-memory cache. Test-only — not exported by index.
export function _resetCompanyCache(): void {
  cachedCompanies = null
}

// Scoring + match-reason builder. Pure function — easy to unit-test if we
// ever want to. Lowercased substring match across name, id, team names,
// and blurb tokens. Score is the count of matched signals; ties broken by
// the order companies appear in the seed file.
function scoreCompany(company: Company, queryTokens: string[]): { score: number; reason: string } {
  const name = company.name.toLowerCase()
  const id = company.id.toLowerCase()
  const blurb = company.blurb.toLowerCase()
  const teams = company.teams.map(t => t.toLowerCase())

  const reasons: string[] = []
  let score = 0

  for (const token of queryTokens) {
    if (token === id || token === name) {
      reasons.push(`matched on company name`)
      score += 3
      continue
    }
    if (name.includes(token) || id.includes(token)) {
      reasons.push(`matched on company name fragment "${token}"`)
      score += 2
      continue
    }
    const team = teams.find(t => t.includes(token))
    if (team) {
      reasons.push(`matched on team: ${team}`)
      score += 2
      continue
    }
    if (blurb.includes(token)) {
      reasons.push(`matched on blurb token "${token}"`)
      score += 1
    }
  }

  // Dedupe and join. First reason wins for clarity.
  const uniqReasons = Array.from(new Set(reasons))
  return { score, reason: uniqReasons[0] ?? "" }
}

const STOPWORDS = new Set([
  "a", "an", "the", "at", "in", "on", "for", "to", "of", "and", "or",
  "intern", "internship", "interns", "swe", "engineer", "engineering",
  "role", "roles", "position", "positions", "job", "jobs", "summer", "fall",
])

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,./@()\[\]"']+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !STOPWORDS.has(t))
}

function suggestContactId(company: Company, queryLower: string): string {
  // Default: pick the IC if the query names a specific team or technical area.
  // Otherwise pick the recruiter (general "intern at X" queries).
  const queryNamesTeam = company.teams.some(t => queryLower.includes(t.toLowerCase()))
  const looksGeneric = /\b(intern|internship|interns|opportunit|application)\b/.test(queryLower)

  const recruiter = company.contacts.find(c => c.role.toLowerCase().includes("recruit"))
  const ic = company.contacts.find(c => !c.role.toLowerCase().includes("recruit"))

  if (queryNamesTeam && ic) return ic.id
  if (looksGeneric && recruiter) return recruiter.id
  return (recruiter ?? ic ?? company.contacts[0])!.id
}

export function findCompany(
  query: string,
  opts: { seedPath?: string; limit?: number } = {},
): FindCompanyOutput {
  const companies = loadCompanies(opts.seedPath)
  const limit = opts.limit ?? 5

  const queryLower = query.toLowerCase()
  const tokens = tokenize(query)
  if (tokens.length === 0) {
    return FindCompanyOutputSchema.parse({ matches: [] })
  }

  const scored = companies
    .map(company => {
      const { score, reason } = scoreCompany(company, tokens)
      return { company, score, reason }
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  const matches: FindCompanyMatch[] = scored.map(({ company, reason }) => ({
    company,
    suggestedContactId: suggestContactId(company, queryLower),
    matchReason: reason,
  }))

  return FindCompanyOutputSchema.parse({ matches })
}
