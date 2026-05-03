/// <reference types="vite/client" />
import { lookupPeopleByCompany, type DiscoveredPerson } from "./people"
import { guessEmail } from "./email_guess"
import type { Company, CompanyContact } from "../../cold_email_workflow/schemas"
import type { FindCompanyMatch } from "../../cold_email_workflow/find_company_core"

// ============================================================================
// Live company discovery via Hunter (through server/people.ts).
// Used as the fallback when a company named by the user isn't in companies.json.
//
// Flow:
//   1. /people/by-company — single Hunter domain-search call returns both
//      company metadata (name, domain, industry, description) and a list of
//      people with real emails + confidence scores in one shot.
//   2. Filter to titles matching roleHints; if filter empties the list, keep
//      everyone — better to show too many than zero.
//   3. Convert each person to a CompanyContact. Hunter returns real emails
//      most of the time; if any field is missing or confidence is too low,
//      fall back to a firstname.lastname pattern guess via email_guess.ts.
//   4. Synthesize a Company record (no notableWork — the writer falls back
//      to the company blurb per prompts/context.ts).
//   5. Return matches in the same FindCompanyMatch shape findCompanyForQuery
//      returns, so the AgentView pipeline treats seed and live results
//      uniformly.
// ============================================================================

// Default titles when the keyword extractor returned roleHints: []. Order
// matters: recruiters first because they're the safest first-touch contact
// for cold outreach to an unknown company.
const DEFAULT_TITLES = [
  "Recruiter",
  "University Recruiter",
  "Engineering Recruiter",
  "Engineering Manager",
  "Software Engineer",
]

const MAX_PEOPLE_PER_COMPANY = 3
const MIN_CONFIDENCE = 50

function ensureTitles(roleHints: string[]): string[] {
  const trimmed = roleHints.map(t => t.trim()).filter(Boolean)
  return trimmed.length > 0 ? trimmed.slice(0, 6) : DEFAULT_TITLES
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

// Hunter person → CompanyContact. Most of the time Hunter gives us a real
// email with a confidence score. If the score is low or the email is
// missing entirely, fall back to a pattern guess and downgrade the status.
function toContact(
  person: DiscoveredPerson,
  domain: string,
  index: number,
): CompanyContact {
  const baseId = `live-${slugify(person.name) || `person-${index}`}`
  const id = `${baseId}-${index}`

  let email: string | null = person.email
  let emailStatus: "verified" | "guessed" | "unknown" =
    person.emailStatus === "verified" && (person.confidence ?? 0) >= MIN_CONFIDENCE
      ? "verified"
      : "guessed"

  if (!email) {
    const guess = guessEmail(person.name, domain)
    if (guess) {
      email = guess
      emailStatus = "guessed"
    } else {
      email = null
      emailStatus = "unknown"
    }
  }

  return {
    id,
    name: person.name,
    role: person.title || "Employee",
    email,
    linkedin: person.linkedinUrl ?? null,
    emailStatus,
  }
}

// Score how well a contact's role matches the user's roleHints. Higher = better.
// Used to rank the suggestedContactId so the most relevant person comes first.
function scoreContact(contact: CompanyContact, roleHints: string[]): number {
  const role = contact.role.toLowerCase()
  let score = 0
  for (const hint of roleHints) {
    if (role.includes(hint.toLowerCase())) score += 2
  }
  // Recruiters get a small bonus because they're the safest cold-outreach
  // target when no specific role was named.
  if (/recruit|talent|university/.test(role)) score += 0.5
  return score
}

export async function findCompanyLive(args: {
  name: string
  roleHints: string[]
  perCompany?: number
}): Promise<FindCompanyMatch[]> {
  const { name, roleHints } = args
  const perCompany = Math.min(args.perCompany ?? MAX_PEOPLE_PER_COMPANY, 5)

  const titles = ensureTitles(roleHints)
  // Over-fetch a little so the title filter has more candidates to pick from.
  const fetchSize = Math.min(perCompany * 3, 15)

  const resp = await lookupPeopleByCompany({
    name,
    titles,
    perPage: fetchSize,
  })

  if (!resp.organization?.domain || resp.people.length === 0) {
    return []
  }

  const domain = resp.organization.domain
  // Trim to the requested size after the proxy already filtered by title.
  const selected = resp.people.slice(0, perCompany)
  const contacts = selected.map((p, i) => toContact(p, domain, i))

  const blurb =
    resp.organization.description ||
    `${resp.organization.name} (${resp.organization.industry ?? "discovered via Hunter"}). Live-fetched company; the email writer grounds its hook in this short description rather than curated notable work.`

  const company: Company = {
    id: slugify(resp.organization.name) || slugify(domain),
    name: resp.organization.name,
    domain,
    blurb,
    notableWork: [],
    teams: [],
    contacts,
  }

  const ranked = [...contacts].sort(
    (a, b) => scoreContact(b, roleHints) - scoreContact(a, roleHints),
  )

  // Build one FindCompanyMatch row per contact so the existing AgentView loop
  // (one draft per match) handles it uniformly with the seed path.
  return ranked.map(contact => ({
    company,
    suggestedContactId: contact.id,
    matchReason: `live-discovered via Hunter (domain: ${domain})`,
  }))
}
