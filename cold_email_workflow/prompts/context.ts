import type { ToneProfile } from "./tone"
import type { Company, CompanyContact } from "../schemas"
import { wrapAsData } from "../sanitize"

// Local convenience: wrap a user-controlled string as untrusted data.
// Pair with the EMAIL_WRITER_ROLE clause that tells the model to treat
// content inside <ut> tags as data, not instructions.
const ut = (s: string) => wrapAsData(s, "ut")

export type ExperienceItem = {
  title: string
  org: string
  description: string
  startDate?: string
  endDate?: string
}

export type UserProfile = {
  fullName: string
  university: string
  major: string
  gpa: number | null
  researchInterests: string[]
  shortBio: string
  experience: ExperienceItem[]
  tone: ToneProfile
}

export type RecentPaper = {
  title: string
  year: number
  abstract: string | null
  url: string
}

export type Professor = {
  id: string
  name: string
  affiliation: string
  email: string | null
  homepage: string | null
  concepts: { name: string; score: number }[]
  recentPapers: RecentPaper[]
  matchScore: number
}

export type OpportunityType = "research" | "internship"

export type ContextInput = {
  user: UserProfile
  professor: Professor
  opportunity: OpportunityType
  userNotes?: string
}

const ABSTRACT_MAX_CHARS = 500
const MAX_PAPERS = 3
const MAX_EXPERIENCE = 3
const MAX_CONCEPTS = 5

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + "…"
}

function renderPapers(papers: RecentPaper[]): string {
  return papers
    .map((p, i) => {
      const head = `${i + 1}. ${ut(p.title)} (${p.year}) - ${ut(p.url)}`
      if (!p.abstract) return head
      return `${head}\n   abstract: ${ut(truncate(p.abstract, ABSTRACT_MAX_CHARS))}`
    })
    .join("\n")
}

function renderExperience(items: ExperienceItem[]): string {
  return items
    .map((e, i) => {
      const dateParts = [e.startDate, e.endDate].filter((d): d is string => Boolean(d)).map(ut)
      const dates = dateParts.join(" to ")
      const head = `${i + 1}. ${ut(e.title)}, ${ut(e.org)}${dates ? ` (${dates})` : ""}`
      return `${head}\n   ${ut(e.description)}`
    })
    .join("\n")
}

// Opportunity-aware labels for the rendered CONTEXT block.
// Research uses "PROFESSOR / paper / lab" vocabulary; internship uses
// "RECIPIENT / post / team" vocabulary. The Professor type is reused as a
// generic recipient shape (recentPapers carries blog posts/launches when
// opportunity = internship).
type ContextLabels = {
  recipientHeader: string
  conceptsLabel: string
  itemsHeader: string
  itemsEmpty: string
  conceptsNoun: string
  paperReminderHas: string
  paperReminderEmpty: string
  inventionAvoid: string
}

function labelsForOpportunity(opportunity: OpportunityType): ContextLabels {
  if (opportunity === "internship") {
    return {
      recipientHeader: "RECIPIENT (company contact):",
      conceptsLabel: "Team's technical areas",
      itemsHeader:
        "Recent posts, launches, or talks (pick exactly ONE to reference, by title):",
      itemsEmpty:
        "  (no recent posts or launches available. Return EmailDraft with confidence: \"low\" and a warning)",
      conceptsNoun: "team's technical areas",
      paperReminderHas:
        "- Reference exactly ONE post or launch from the list above, by title, with one concrete sentence about what caught your attention.",
      paperReminderEmpty:
        "- No recent posts or launches are available. Do NOT reference a specific post or invent one. Build the email around the team's technical areas above, set EmailDraft.confidence to \"low\", and add a 'no recent posts or launches in user's interest area' warning.",
      inventionAvoid:
        "- Do not invent posts, products, team details, prior contact, year, age, or any biographical detail not present in CONTEXT, or shared interests beyond what is above.",
    }
  }
  return {
    recipientHeader: "PROFESSOR:",
    conceptsLabel: "Top research concepts",
    itemsHeader: "Recent papers (pick exactly ONE to reference, by title):",
    itemsEmpty:
      "  (no recent papers available. Return EmailDraft with confidence: \"low\" and a warning)",
    conceptsNoun: "professor's top research concepts",
    paperReminderHas:
      "- Reference exactly ONE paper from the list above, by title, with one concrete sentence about what caught your attention.",
    paperReminderEmpty:
      "- No recent papers are available. Do NOT reference a specific paper or invent one. Build the email around the professor's top research concepts above, set EmailDraft.confidence to \"low\", and add a 'no recent papers in user's interest area' warning.",
    inventionAvoid:
      "- Do not invent papers, methods, lab details, prior contact, year, age, or any biographical detail not present in CONTEXT, or shared interests beyond what is above.",
  }
}

export function renderContextBlock(input: ContextInput): string {
  const { user, professor, opportunity, userNotes } = input
  const labels = labelsForOpportunity(opportunity)

  const papers = professor.recentPapers.slice(0, MAX_PAPERS)
  const experience = user.experience.slice(0, MAX_EXPERIENCE)
  const concepts = professor.concepts.slice(0, MAX_CONCEPTS).map(c => c.name)

  const sections: string[] = [
    "CONTEXT: DRAW THE EMAIL FROM THESE FACTS ONLY.",
    "",
    `Opportunity type: ${opportunity}`,
    "",
    labels.recipientHeader,
    `- Name: ${ut(professor.name)}`,
    `- Affiliation: ${ut(professor.affiliation)}`,
    `- Email: ${professor.email === null ? "null" : ut(professor.email)}`,
  ]

  if (concepts.length > 0) {
    sections.push(`- ${labels.conceptsLabel}: ${concepts.map(ut).join(", ")}`)
  }

  sections.push(
    "",
    labels.itemsHeader,
    papers.length > 0 ? renderPapers(papers) : labels.itemsEmpty,
    "",
    "USER:",
    `- Name: ${ut(user.fullName)}`,
    `- University: ${ut(user.university)}`,
    `- Major: ${ut(user.major)}`,
  )

  if (user.gpa !== null) {
    sections.push(`- GPA: ${user.gpa}`)
  }
  if (user.researchInterests.length > 0) {
    sections.push(`- Research interests: ${user.researchInterests.map(ut).join(", ")}`)
  }
  if (user.shortBio.trim()) {
    sections.push(`- Short bio: ${ut(user.shortBio.trim())}`)
  }

  sections.push(
    "",
    "Experience (pick the SINGLE most relevant item to reference; ignore the rest):",
    experience.length > 0 ? renderExperience(experience) : "  (none provided)",
  )

  if (userNotes?.trim()) {
    sections.push(
      "",
      "User notes (incorporate if directly relevant; otherwise ignore):",
      ut(userNotes.trim()),
    )
  }

  const paperReminder =
    papers.length > 0 ? labels.paperReminderHas : labels.paperReminderEmpty

  const experienceReminder =
    experience.length > 0
      ? "- Tie to exactly ONE user experience item, naming the project or role concretely."
      : "- No experience items are available. Build the connection paragraph from researchInterests and shortBio instead. Set EmailDraft.confidence to at most \"medium\", add an \"experience match is loose\" warning, and do NOT invent a project, internship, or role."

  sections.push(
    "",
    "Hard reminders for this context:",
    paperReminder,
    experienceReminder,
    labels.inventionAvoid,
    "- Do not invent dates, seasons, or relative timing for user experience. If an experience item has no dates, do not write 'last summer,' 'this semester,' or similar timing.",
  )

  return sections.join("\n")
}

// ============================================================================
// Internship branch: company + recipient + notable work.
//
// Distinct from renderContextBlock because the data shape is different
// (Company has notableWork with type/url/summary, no academic-paper fields)
// and the framing is different (the writer is selling capability to a
// recruiter or IC, not asking a professor about research).
// ============================================================================

const MAX_NOTABLE_WORK = 3

function renderNotableWork(items: Company["notableWork"]): string {
  return items
    .slice(0, MAX_NOTABLE_WORK)
    .map((w, i) => {
      const head = `  ${i + 1}. ${ut(w.title)} (${w.type}) - ${ut(w.url)}`
      const authorLine = w.author
        ? `     Author: ${ut(w.author)}`
        : `     Author: (company-level artifact, no individual byline)`
      return `${head}\n${authorLine}\n     Summary: ${ut(w.summary)}`
    })
    .join("\n")
}

// Match a contact to their authored notableWork by exact-string name match.
// Exact match is intentional: "Lydia Mendez" (recipient) and "Lydia Hallie"
// (author) must NOT collide. Fuzzy matching here is a credibility-bug factory.
function findAuthoredWork(
  company: Company,
  contact: CompanyContact,
): Company["notableWork"][number] | undefined {
  return company.notableWork.find(w => w.author === contact.name)
}

const RECRUITER_ROLE_TOKENS = ["recruit", "talent", "people"]
const IC_ROLE_TOKENS = [
  "engineer",
  "mts",
  "member of technical staff",
  "staff",
  "lead",
  "architect",
  "founding",
]

type RecipientKind = "recruiter" | "ic" | "unknown"

function classifyRecipient(role: string): RecipientKind {
  const r = role.toLowerCase()
  if (RECRUITER_ROLE_TOKENS.some(t => r.includes(t))) return "recruiter"
  if (IC_ROLE_TOKENS.some(t => r.includes(t))) return "ic"
  return "unknown"
}

export type CompanyContextInput = {
  user: UserProfile
  company: Company
  contact: CompanyContact
  teamFocus?: string
  userNotes?: string
}

export function renderCompanyBlock(input: CompanyContextInput): string {
  const { user, company, contact, teamFocus, userNotes } = input

  const works = company.notableWork.slice(0, MAX_NOTABLE_WORK)
  const experience = user.experience.slice(0, MAX_EXPERIENCE)

  const recipientKind = classifyRecipient(contact.role)
  const recipientAuthored = findAuthoredWork(company, contact)
  const namedAuthorWorks = works.filter(w => w.author !== null)

  // Four-way branch on the hook strategy. Authorship matching is exact-string
  // (see findAuthoredWork). The IC vs recruiter split lives in the etiquette
  // block; this hint just picks the right shape for the writer to land on.
  let recipientHint: string
  if (recipientKind === "recruiter") {
    recipientHint =
      "- This person is a RECRUITER. Reference the company, product, or mission in the hook, NOT a specific engineering artifact. Recruiters do not own technical decisions and referencing internal technical work reads as misdirected. Lead with credential signals and a clear ask."
  } else if (recipientAuthored) {
    recipientHint = `- This person is an ENGINEER and authored the notableWork "${ut(recipientAuthored.title)}". Reference it as THEIRS ("Your post on...", "Your talk on..."). This is the strongest available hook, use it.`
  } else if (namedAuthorWorks.length > 0) {
    const examples = namedAuthorWorks
      .map(w => `"${w.title}" by ${w.author}`)
      .join("; ")
    recipientHint = `- This person is an ENGINEER but did NOT author any of the listed notableWork. DEFAULT: reference artifacts as "your team's [post/talk] on [topic]" — the recipient knows their coworkers, so naming a peer reads as awkward. ONLY name the author if they are clearly senior leadership (cofounder, CTO, founding engineer, head of a major area). Named-author works here: ${examples}. DO NOT imply this person wrote work they did not author. Authorship match is exact-string, not fuzzy: a similar first name does not mean the same person.`
  } else {
    recipientHint =
      "- This person is an ENGINEER. None of the listed notableWork has a named individual author (all are company-level artifacts). Reference an artifact neutrally as the company's work (e.g. \"Linear's API design...\"); do NOT use \"your post\" or \"your talk\" since you cannot attribute it to anyone specific."
  }

  const sections: string[] = [
    "CONTEXT: DRAW THE EMAIL FROM THESE FACTS ONLY.",
    "",
    "Opportunity type: internship",
    "",
    "COMPANY:",
    `- Name: ${ut(company.name)}`,
    `- What they do: ${ut(company.blurb)}`,
    `- Teams: ${company.teams.map(ut).join(", ")}`,
  ]

  if (teamFocus) {
    sections.push(`- Team the writer is targeting: ${ut(teamFocus)}`)
  }

  sections.push(
    "",
    "Notable engineering work to potentially reference (pick at most ONE):",
    works.length > 0
      ? renderNotableWork(works)
      : "  (no notable work available. Return EmailDraft with confidence: \"low\" and a warning)",
    "",
    "RECIPIENT:",
    `- Name: ${ut(contact.name)}`,
    `- Role: ${ut(contact.role)}`,
    `- Email: ${ut(contact.email)}`,
    recipientHint,
    "",
    "USER:",
    `- Name: ${ut(user.fullName)}`,
    `- University: ${ut(user.university)}`,
    `- Major: ${ut(user.major)}`,
  )

  if (user.gpa !== null) {
    sections.push(`- GPA: ${user.gpa}`)
  }
  if (user.researchInterests.length > 0) {
    sections.push(`- Stated interests: ${user.researchInterests.map(ut).join(", ")}`)
  }
  if (user.shortBio.trim()) {
    sections.push(`- Short bio: ${ut(user.shortBio.trim())}`)
  }

  sections.push(
    "",
    "Experience (pick the SINGLE most relevant project to the team being emailed; ignore the rest):",
    experience.length > 0 ? renderExperience(experience) : "  (none provided)",
  )

  if (userNotes?.trim()) {
    sections.push(
      "",
      "User notes (incorporate if directly relevant; otherwise ignore):",
      ut(userNotes.trim()),
    )
  }

  const workReminder =
    works.length > 0
      ? "- Reference exactly ONE notable work from the list above, by title, in the HOOK sentence. Show the research; do not compliment the company."
      : "- No notable work is available. Return EmailDraft with confidence: \"low\" and add a 'no notable work available, hook is weak' warning."

  sections.push(
    "",
    "Hard reminders for this context:",
    workReminder,
    "- Pick the experience item most relevant to the team being emailed, NOT the most impressive one. If a more impressive but less relevant experience exists, you may compress it to a 4-word credential phrase in the OPENING sentence and skip it from THE PROOF.",
    "- Do not invent products, blog posts, team details, prior contact, or any biographical detail not present in CONTEXT.",
    "- Do not invent dates, seasons, or relative timing for user experience. If an experience item has no dates, do not write 'last summer,' 'this semester,' or similar timing.",
    "- Do not include an interest declaration paragraph. The internship etiquette explicitly forbids it. Capability is shown through the project, not stated through ambitions.",
  )

  return sections.join("\n")
}
