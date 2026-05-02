import type { ToneProfile } from "./tone"
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

export function renderContextBlock(input: ContextInput): string {
  const { user, professor, opportunity, userNotes } = input

  const papers = professor.recentPapers.slice(0, MAX_PAPERS)
  const experience = user.experience.slice(0, MAX_EXPERIENCE)
  const concepts = professor.concepts.slice(0, MAX_CONCEPTS).map(c => c.name)

  const sections: string[] = [
    "CONTEXT: DRAW THE EMAIL FROM THESE FACTS ONLY.",
    "",
    `Opportunity type: ${opportunity}`,
    "",
    "PROFESSOR:",
    `- Name: ${ut(professor.name)}`,
    `- Affiliation: ${ut(professor.affiliation)}`,
    `- Email: ${professor.email === null ? "null" : ut(professor.email)}`,
  ]

  if (concepts.length > 0) {
    sections.push(`- Top research concepts: ${concepts.map(ut).join(", ")}`)
  }

  sections.push(
    "",
    "Recent papers (pick exactly ONE to reference, by title):",
    papers.length > 0
      ? renderPapers(papers)
      : "  (no recent papers available — return EmailDraft with confidence: \"low\" and a warning)",
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
    papers.length > 0
      ? "- Reference exactly ONE paper from the list above, by title, with one concrete sentence about what caught your attention."
      : "- No recent papers are available. Do NOT reference a specific paper or invent one. Build the email around the professor's top research concepts above, set EmailDraft.confidence to \"low\", and add a 'no recent papers in user's interest area' warning."

  const experienceReminder =
    experience.length > 0
      ? "- Tie to exactly ONE user experience item, naming the project or role concretely."
      : "- No experience items are available. Build the connection paragraph from researchInterests and shortBio instead. Set EmailDraft.confidence to at most \"medium\", add an \"experience match is loose\" warning, and do NOT invent a project, internship, or role."

  sections.push(
    "",
    "Hard reminders for this context:",
    paperReminder,
    experienceReminder,
    "- Do not invent papers, methods, lab details, prior contact, year, age, or any biographical detail not present in CONTEXT, or shared interests beyond what is above.",
    "- Do not invent dates, seasons, or relative timing for user experience. If an experience item has no dates, do not write 'last summer,' 'this semester,' or similar timing.",
  )

  return sections.join("\n")
}
