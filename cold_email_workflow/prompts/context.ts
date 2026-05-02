import type { ToneProfile } from "./tone"

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
      const head = `${i + 1}. "${p.title}" (${p.year}) — ${p.url}`
      if (!p.abstract) return head
      return `${head}\n   abstract: ${truncate(p.abstract, ABSTRACT_MAX_CHARS)}`
    })
    .join("\n")
}

function renderExperience(items: ExperienceItem[]): string {
  return items
    .map((e, i) => {
      const dates = [e.startDate, e.endDate].filter(Boolean).join("–")
      const head = `${i + 1}. ${e.title}, ${e.org}${dates ? ` (${dates})` : ""}`
      return `${head}\n   ${e.description}`
    })
    .join("\n")
}

export function renderContextBlock(input: ContextInput): string {
  const { user, professor, opportunity, userNotes } = input

  const papers = professor.recentPapers.slice(0, MAX_PAPERS)
  const experience = user.experience.slice(0, MAX_EXPERIENCE)
  const concepts = professor.concepts.slice(0, MAX_CONCEPTS).map(c => c.name)

  const sections: string[] = [
    "CONTEXT — DRAW THE EMAIL FROM THESE FACTS ONLY.",
    "",
    `Opportunity type: ${opportunity}`,
    "",
    "PROFESSOR:",
    `- Name: ${professor.name}`,
    `- Affiliation: ${professor.affiliation}`,
    `- Email: ${professor.email ?? "null"}`,
  ]

  if (concepts.length > 0) {
    sections.push(`- Top research concepts: ${concepts.join(", ")}`)
  }

  sections.push(
    "",
    "Recent papers (pick exactly ONE to reference, by title):",
    papers.length > 0
      ? renderPapers(papers)
      : "  (no recent papers available — return EmailDraft with confidence: \"low\" and a warning)",
    "",
    "USER:",
    `- Name: ${user.fullName}`,
    `- University: ${user.university}`,
    `- Major: ${user.major}`,
  )

  if (user.gpa !== null) {
    sections.push(`- GPA: ${user.gpa}`)
  }
  if (user.researchInterests.length > 0) {
    sections.push(`- Research interests: ${user.researchInterests.join(", ")}`)
  }
  if (user.shortBio.trim()) {
    sections.push(`- Short bio: ${user.shortBio.trim()}`)
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
      userNotes.trim(),
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
  )

  return sections.join("\n")
}
