import { z } from "zod"
import { CompanySchema, type Company } from "./schemas"

// ============================================================================
// Pure scoring + match-reason + contact-suggestion logic for findCompany.
//
// Lives separately from find_company.ts so the browser (which can't read from
// the filesystem) can import the same logic via a Vite JSON import. Node-side
// callers go through find_company.ts which loads companies.json from disk.
//
// Keep this module dependency-free of node:fs / node:path / fileURLToPath so
// it bundles cleanly into the Vite build.
// ============================================================================

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

  const uniqReasons = Array.from(new Set(reasons))
  return { score, reason: uniqReasons[0] ?? "" }
}

function suggestContactId(company: Company, queryLower: string): string {
  const queryNamesTeam = company.teams.some(t => queryLower.includes(t.toLowerCase()))
  const looksGeneric = /\b(intern|internship|interns|opportunit|application)\b/.test(queryLower)

  const recruiter = company.contacts.find(c => c.role.toLowerCase().includes("recruit"))
  const ic = company.contacts.find(c => !c.role.toLowerCase().includes("recruit"))

  if (queryNamesTeam && ic) return ic.id
  if (looksGeneric && recruiter) return recruiter.id
  return (recruiter ?? ic ?? company.contacts[0])!.id
}

// Pure function: companies in, ranked matches out. Used by both the Node
// disk-loading path (find_company.ts) and the browser JSON-import path
// (src/lib/find_company.ts).
export function findCompanyMatches(
  companies: Company[],
  query: string,
  limit = 5,
): FindCompanyOutput {
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
