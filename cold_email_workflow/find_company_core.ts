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
  matches: z.array(FindCompanyMatchSchema).max(10),
})

export type FindCompanyMatch = z.infer<typeof FindCompanyMatchSchema>
export type FindCompanyOutput = z.infer<typeof FindCompanyOutputSchema>

// Chat-prompt fillers and grammatical glue that should never count as match
// signal. Keep this list aggressive: a stray "am"/"this"/"company" that leaks
// through hits dozens of blurbs as substrings and floods the result list.
const STOPWORDS = new Set([
  // articles / prepositions / conjunctions
  "a", "an", "the", "at", "in", "on", "for", "to", "of", "and", "or", "with",
  "from", "by", "as", "into", "onto", "about",
  // pronouns + auxiliaries (the "i am looking" case)
  "i", "me", "my", "mine", "we", "us", "our", "you", "your", "they", "them",
  "am", "is", "are", "was", "were", "be", "been", "being",
  "do", "does", "did", "have", "has", "had",
  "will", "would", "should", "could", "can", "may", "might", "must",
  // generic verbs students use in outreach prompts
  "looking", "look", "want", "wanting", "wants", "interested", "hoping",
  "hope", "trying", "try", "seeking", "seek", "find", "show", "give", "list",
  "work", "works", "working", "join", "joining", "apply", "applying",
  // generic nouns / qualifiers
  "this", "that", "these", "those", "any", "some", "all", "such",
  "company", "companies", "team", "teams", "year", "years", "season",
  "next", "upcoming", "current", "currently", "now", "soon",
  "summer", "fall", "winter", "spring", "autumn",
  // role / opportunity glue
  "intern", "internship", "interns", "swe", "engineer", "engineering",
  "role", "roles", "position", "positions", "job", "jobs", "opportunity",
  "opportunities",
])

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,./@()\[\]"'!?;:]+/)
    .map(t => t.trim().replace(/^['"]+|['"]+$/g, ""))
    .filter(t => t.length > 1 && !STOPWORDS.has(t))
}

// Word-level token set for a string. Used so "am" cannot match inside
// "management" / "Ramp" / "stream" — matching is at word boundaries.
function wordSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(w => w.length > 0),
  )
}

type ReasonTier = "name" | "team" | "blurb"
type Hit = { tier: ReasonTier; reason: string; score: number }

function scoreCompany(company: Company, queryTokens: string[]): { score: number; hits: Hit[] } {
  const name = company.name.toLowerCase()
  const id = company.id.toLowerCase()
  const nameWords = wordSet(company.name)
  const blurbWords = wordSet(company.blurb)
  const teams = company.teams.map(t => t.toLowerCase())

  const hits: Hit[] = []
  let score = 0
  const seenTokens = new Set<string>()

  for (const token of queryTokens) {
    if (seenTokens.has(token)) continue
    seenTokens.add(token)

    if (token === id || token === name) {
      hits.push({ tier: "name", reason: `matched on company name`, score: 3 })
      score += 3
      continue
    }
    // Word-boundary match against the company name (handles multi-word names).
    if (nameWords.has(token)) {
      hits.push({ tier: "name", reason: `matched on company name fragment "${token}"`, score: 2 })
      score += 2
      continue
    }
    // Teams are short phrases — substring is fine and lets "sync engine"
    // queries hit the "Sync Engine" team.
    const team = teams.find(t => t.includes(token))
    if (team) {
      hits.push({ tier: "team", reason: `matched on team: ${team}`, score: 2 })
      score += 2
      continue
    }
    // Blurb match is word-level. "am" no longer matches inside "management",
    // "engine" no longer matches inside "engineering" — required tokens must
    // be the whole word in the blurb.
    if (blurbWords.has(token)) {
      hits.push({ tier: "blurb", reason: `matched on blurb token "${token}"`, score: 1 })
      score += 1
    }
  }

  return { score, hits }
}

function pickReason(hits: Hit[]): string {
  // Prefer the highest-tier reason so the UI doesn't show "matched on blurb
  // token 'am'" when the company also matched its full name.
  const order: ReasonTier[] = ["name", "team", "blurb"]
  for (const tier of order) {
    const hit = hits.find(h => h.tier === tier)
    if (hit) return hit.reason
  }
  return ""
}

// Rank contacts for a query. The first ID is the "primary" suggestion (used
// when the caller only wants one); subsequent IDs are also-relevant contacts
// (different IC angles for companies like Figma that have multiple ICs).
//
// Ranking rules:
//   - If the query names one of the company's teams, ICs come first
//     (team-matching IC, then other ICs, then recruiter).
//   - For generic intern/internship queries, the recruiter comes first
//     (then ICs).
//   - Otherwise, recruiter first as a safe default, then ICs.
function suggestContactIds(company: Company, queryLower: string): string[] {
  const namedTeam = company.teams.find(t => queryLower.includes(t.toLowerCase()))?.toLowerCase()
  const looksGeneric = /\b(intern|internship|interns|opportunit|application)\b/.test(queryLower)

  // Drop contacts that are still placeholders in the seed — they have no real
  // email yet and shouldn't be suggested.
  const usable = company.contacts.filter(c => c.name !== "TO_FILL" && c.email !== "TO_FILL")
  const recruiters = usable.filter(c => c.role.toLowerCase().includes("recruit"))
  const ics = usable.filter(c => !c.role.toLowerCase().includes("recruit"))

  // Within ICs, push the one whose role mentions the named team to the top.
  const rankedICs = namedTeam
    ? [...ics].sort((a, b) => {
        const aMatch = a.role.toLowerCase().includes(namedTeam) ? -1 : 0
        const bMatch = b.role.toLowerCase().includes(namedTeam) ? -1 : 0
        return aMatch - bMatch
      })
    : ics

  let ordered: typeof company.contacts
  if (namedTeam) {
    ordered = [...rankedICs, ...recruiters]
  } else if (looksGeneric) {
    ordered = [...recruiters, ...rankedICs]
  } else {
    ordered = [...recruiters, ...rankedICs]
  }

  // Fall through to whatever usable contacts remain if neither bucket caught
  // anything. If every contact is a TO_FILL placeholder we return an empty
  // list, and findCompanyMatches will skip the company entirely.
  if (ordered.length === 0) ordered = usable

  return ordered.map(c => c.id)
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
      const { score, hits } = scoreCompany(company, tokens)
      return { company, score, hits }
    })
    .filter(s => s.score > 0)

  // Name-match-floor filter: if any company matched on its actual name
  // (a strong signal that the user named a specific company), drop matches
  // that only got a blurb-token hit. Otherwise "intern at Linear" returns
  // Linear plus three companies whose blurbs contain unrelated stray tokens.
  const hasNameHit = scored.some(s => s.hits.some(h => h.tier === "name"))
  const filtered = hasNameHit
    ? scored.filter(s => s.hits.some(h => h.tier === "name" || h.tier === "team"))
    : scored

  const ranked = filtered.sort((a, b) => b.score - a.score)

  // Expand each company into one row per relevant contact. A company like
  // Figma with three contacts (recruiter + two ICs targeting different teams)
  // becomes three rows; a company with one recruiter + one IC becomes two
  // rows. Truncating at `limit` happens after expansion so the user gets a
  // mix that respects company ranking and contact ranking.
  const matches: FindCompanyMatch[] = []
  for (const { company, hits } of ranked) {
    const contactIds = suggestContactIds(company, queryLower)
    const reason = pickReason(hits)
    for (const contactId of contactIds) {
      matches.push({ company, suggestedContactId: contactId, matchReason: reason })
      if (matches.length >= limit) break
    }
    if (matches.length >= limit) break
  }

  return FindCompanyOutputSchema.parse({ matches })
}
